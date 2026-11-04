import Papa from "papaparse";
import { Unzip, UnzipInflate } from "fflate";
import { IMPORT_LIMITS } from "./model";

export type ParsedSheet = {
  headers: string[];
  rows: { row: number; cells: string[] }[];
  delimiter: string | null;
  warnings: string[];
};
type Limits = { [K in keyof typeof IMPORT_LIMITS]: number };
export function checkFile(
  name: string,
  size: number,
  limits: Limits = IMPORT_LIMITS,
) {
  if (!/\.(csv|xlsx)$/i.test(name))
    throw new Error("Selecione um arquivo CSV ou XLSX.");
  if (!size) throw new Error("O arquivo está vazio.");
  if (size > limits.maxBytes)
    throw new Error(
      `O arquivo excede o limite de ${limits.maxBytes / 1024 / 1024} MB.`,
    );
}
function toSheet(
  matrix: string[][],
  delimiter: string | null,
  limits: Limits,
): ParsedSheet {
  const nonempty = matrix
    .map((cells, index) => ({ row: index + 1, cells }))
    .filter((r) => r.cells.some((c) => c.trim()));
  const header = nonempty.shift();
  if (!header || !nonempty.length)
    throw new Error(
      "A planilha precisa de cabeçalhos e pelo menos um registro.",
    );
  if (nonempty.length > limits.maxRows)
    throw new Error(`Limite de ${limits.maxRows} registros excedido.`);
  if (matrix.some((r) => r.length > limits.maxColumns))
    throw new Error(`Limite de ${limits.maxColumns} colunas excedido.`);
  if (nonempty.some((r) => r.cells.length > header.cells.length))
    throw new Error(
      "Há registros com mais colunas que o cabeçalho. Confira o delimitador.",
    );
  if (matrix.some((r) => r.some((c) => c.length > 10000 || c.includes("\0"))))
    throw new Error("Há células inválidas ou maiores que 10.000 caracteres.");
  return {
    headers: header.cells.map((h, i) => h.trim() || `Coluna ${i + 1}`),
    rows: nonempty,
    delimiter,
    warnings: [
      "Telefones devem estar como texto na origem. Zeros já removidos pelo Excel não podem ser recuperados.",
    ],
  };
}
export function readCsv(
  bytes: Uint8Array,
  limits: Limits = IMPORT_LIMITS,
): ParsedSheet {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-1252").decode(bytes);
  }
  const result = Papa.parse<string[]>(text, {
    dynamicTyping: false,
    skipEmptyLines: false,
    preview: limits.maxRows + 3,
    delimitersToGuess: [",", ";", "\t", "|"],
  });
  if (result.errors.some((e) => e.code !== "UndetectableDelimiter"))
    throw new Error("CSV inválido: confira aspas e delimitadores.");
  if (result.meta.truncated)
    throw new Error(`Limite de ${limits.maxRows} registros excedido.`);
  return toSheet(result.data, result.meta.delimiter, limits);
}

// Descompactação incremental limitada antes de entregar o ZIP ao parser de XLSX.
export function inspectXlsx(bytes: Uint8Array, limits: Limits = IMPORT_LIMITS) {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
    throw new Error("XLSX inválido ou arquivo XLS antigo.");
  let expanded = 0,
    entries = 0;
  let validationError: Error | undefined;
  const names = new Set<string>();
  const unzip = new Unzip((file) => {
    if (
      ++entries > limits.maxEntries ||
      (file.originalSize && file.originalSize > limits.maxExpandedBytes)
    )
      throw new Error("XLSX excede os limites de descompactação.");
    if (/vbaproject|externallinks|embeddings|activex/i.test(file.name))
      throw new Error(
        "O XLSX contém macros, vínculos externos ou conteúdo ativo não aceito.",
      );
    if (names.has(file.name))
      throw new Error("XLSX contém entradas duplicadas.");
    names.add(file.name);
    const chunks: Uint8Array[] = [];
    file.ondata = (error, chunk, final) => {
      if (validationError) return;
      if (error) {
        validationError = new Error("XLSX corrompido.");
        return;
      }
      expanded += chunk.length;
      if (expanded > limits.maxExpandedBytes) {
        validationError = new Error(
          "XLSX excede o limite de conteúdo descompactado.",
        );
        return;
      }
      if (/\.xml$/i.test(file.name)) chunks.push(chunk);
      if (final && chunks.length) {
        const content = chunks.map((c) => new TextDecoder().decode(c)).join("");
        if (/<!DOCTYPE|<!ENTITY|<(?:\w+:)?f(?:\s|>)/i.test(content))
          validationError = new Error(
            "XLSX com fórmulas ou entidades XML não é aceito. Exporte somente valores.",
          );
        if (/^xl\/worksheets\//.test(file.name)) {
          for (const match of content.matchAll(
            /\br=["']([A-Z]*)([0-9]+)["']/g,
          )) {
            let col = 0;
            for (const char of match[1])
              col = col * 26 + char.charCodeAt(0) - 64;
            if (
              Number(match[2]) > limits.maxRows + 1 ||
              col > limits.maxColumns
            )
              validationError = new Error(
                "XLSX excede o limite de linhas ou colunas, inclusive células formatadas vazias.",
              );
          }
        }
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let offset = 0; offset < bytes.length; offset += 1024) {
    unzip.push(
      bytes.subarray(offset, offset + 1024),
      offset + 1024 >= bytes.length,
    );
    if (validationError) throw validationError;
  }
  if (!names.has("xl/workbook.xml") || !names.has("[Content_Types].xml"))
    throw new Error("O arquivo não é uma pasta de trabalho XLSX válida.");
}
export async function readSpreadsheet(
  name: string,
  bytes: Uint8Array,
  limits: Limits = IMPORT_LIMITS,
): Promise<ParsedSheet> {
  checkFile(name, bytes.length, limits);
  if (/\.csv$/i.test(name)) return readCsv(bytes, limits);
  inspectXlsx(bytes, limits);
  const { readSheet } = await import("read-excel-file/web-worker");
  const matrix = await readSheet(bytes.slice().buffer, 1, {
    parseNumber: (value) => value,
  });
  return {
    ...toSheet(
      matrix.map((row) =>
        row.map((v) =>
          v === null ? "" : v instanceof Date ? v.toISOString() : String(v),
        ),
      ),
      null,
      limits,
    ),
    warnings: [
      "Foi lida a primeira aba do XLSX. Exporte telefones como texto; formatação numérica não recupera zeros já perdidos.",
    ],
  };
}
