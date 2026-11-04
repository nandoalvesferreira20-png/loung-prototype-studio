import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import {
  readSpreadsheet,
  checkFile,
  inspectXlsx,
} from "../src/lib/imports/read-file";
import { autoMap, mapRow } from "../src/lib/imports/mapping";
import { classifyLead } from "../src/lib/imports/classify";
import {
  blankLead,
  identityKeys,
  findFileDuplicates,
  normalizeMapsUrl,
  IMPORT_LIMITS,
  leadSchema,
  importRequestSchema,
} from "../src/lib/imports/model";
import { executeImport, type ImportPort } from "../src/lib/imports/service";
import { randomUUID } from "node:crypto";

export function xlsxFixture(formula = false) {
  return zipSync(
    Object.fromEntries(
      Object.entries({
        "[Content_Types].xml":
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        "_rels/.rels":
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        "xl/workbook.xml":
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels":
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Empresa</t></is></c><c r="B1" t="inlineStr"><is><t>Telefone</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Clínica Exemplo</t></is></c><c r="B2" t="inlineStr"><is><t>001234567</t></is></c>${formula ? '<c r="C2"><f>1+1</f><v>2</v></c>' : ""}</row></sheetData></worksheet>`,
      }).map(([name, content]) => [name, strToU8(content)]),
    ),
  );
}
test("importação CSV: delimitadores, BOM, aspas, acentos, vazios e telefone textual", async () => {
  for (const delimiter of [",", ";", "\t", "|"]) {
    const result = await readSpreadsheet(
      "leads.csv",
      strToU8(
        `\ufeffEmpresa${delimiter}Telefone${delimiter}Endereço\n"Clínica, Exemplo"${delimiter}001234567${delimiter}\n`,
      ),
    );
    assert.equal(result.delimiter, delimiter);
    const { lead } = mapRow(
      result.rows[0].cells,
      autoMap(
        result.headers,
        result.rows.map((r) => r.cells),
      ),
    );
    assert.equal(lead.name, "Clínica, Exemplo");
    assert.equal(lead.phone, "001234567");
    assert.equal(lead.address, "");
    assert.equal(lead.niche, "clinicas");
  }
});
test("importação XLSX: leitura de valores sem executar conteúdo ativo", async () => {
  const parsed = await readSpreadsheet("leads.xlsx", xlsxFixture());
  assert.equal(parsed.headers[0], "Empresa");
  assert.equal(parsed.rows[0].cells[1], "001234567");
  await assert.rejects(
    readSpreadsheet("formulas.xlsx", xlsxFixture(true)),
    /fórmulas/,
  );
});
test("importação: arquivos vazios, inválidos, limites e ZIP expansivo", async () => {
  assert.throws(() => checkFile("leads.csv", 0), /vazio/);
  assert.throws(() => checkFile("leads.exe", 10), /CSV ou XLSX/);
  assert.throws(
    () => checkFile("leads.csv", IMPORT_LIMITS.maxBytes + 1),
    /limite/,
  );
  await assert.rejects(
    readSpreadsheet("leads.csv", strToU8("nome\n")),
    /pelo menos/,
  );
  await assert.rejects(
    readSpreadsheet("leads.xlsx", strToU8("not a zip")),
    /inválido/,
  );
  await assert.rejects(
    readSpreadsheet("leads.csv", strToU8('nome;telefone\n"sem fechamento;123')),
    /CSV inválido/,
  );
  await assert.rejects(
    readSpreadsheet(
      "leads.csv",
      strToU8(
        "nome\n" +
          Array.from({ length: 501 }, (_, i) => `Empresa ${i}`).join("\n"),
      ),
    ),
    /Limite/,
  );
  assert.throws(
    () =>
      inspectXlsx(zipSync({ "large.xml": strToU8("a".repeat(1000)) }), {
        ...IMPORT_LIMITS,
        maxExpandedBytes: 100,
      }),
    /limite/i,
  );
  assert.throws(
    () => inspectXlsx(zipSync({ "xl/vbaProject.bin": new Uint8Array([1]) })),
    /ativo/,
  );
});
test("mapeamento: equivalências, URLs por conteúdo e ajuste manual", () => {
  const headers = [
    "nome_empresa",
    "município",
    "endereço",
    "categoria_google",
    "url",
    "contato",
  ];
  const cells = [
    "Exemplo",
    "Recife",
    "Rua A",
    "Dentista",
    "https://maps.app.goo.gl/exemplo",
    "+55 00123456",
  ];
  const mapping = autoMap(headers, [cells]);
  assert.equal(mapping.google_maps_url, 4);
  assert.equal(mapping.website, undefined);
  assert.equal(mapRow(cells, mapping).lead.city, "Recife");
  assert.equal(
    autoMap(["url"], [["https://instagram.com/exemplo"]]).instagram,
    0,
  );
  assert.equal(
    autoMap(
      ["url"],
      [["https://exemplo.com"], ["https://instagram.com/exemplo"]],
    ).website,
    undefined,
  );
  assert.equal(mapRow(cells, { name: 1 }).lead.name, "Recife");
});
test("classificação: quatro nichos, especialidades, evidência insuficiente e ambiguidade", () => {
  for (const [category, niche] of [
    ["Odontologia", "clinicas"],
    ["Escritório jurídico", "advocacia"],
    ["Corretor de imóveis", "imobiliarias"],
    ["Pizzaria", "restaurantes"],
  ])
    assert.equal(classifyLead("Exemplo", category, "").niche, niche);
  for (const specialty of [
    "Odontologia",
    "Estética",
    "Psicologia",
    "Fisioterapia",
    "Veterinária",
  ])
    assert.equal(classifyLead("Clínica", specialty, "").specialty, specialty);
  assert.equal(classifyLead("Clínica", "", "").specialty, "");
  assert.equal(classifyLead("Exemplo", "", "seguro").status, "REVIEW_REQUIRED");
  assert.equal(
    classifyLead("Clínica", "Advogados", "").status,
    "REVIEW_REQUIRED",
  );
  assert.equal(
    classifyLead("Clínica", "Odontologia e Psicologia", "").specialty,
    "",
  );
});
test("validação: obrigatórios, limites, URLs sensíveis e campos opcionais", () => {
  const lead = { ...blankLead(), name: "Exemplo", niche: "clinicas" };
  assert.equal(leadSchema.safeParse(lead).success, true);
  for (const patch of [
    { name: "" },
    { niche: "outro" },
    { website: "javascript:alert(1)" },
    { website: "https://instagram.com/exemplo" },
    { website: "https://google.com/maps?q=exemplo" },
    { state: "SPP" },
    { description: "a".repeat(2001) },
    { phone: "abc" },
  ])
    assert.equal(leadSchema.safeParse({ ...lead, ...patch }).success, false);
});
test("identidades: não deduplica apenas por nome; normaliza acentos e localização", () => {
  const a = {
    ...blankLead(),
    name: "Clínica Exemplo",
    phone: "+55 (11) 00123456",
  };
  const b = { ...a, name: "Clinica Exemplo", phone: "551100123456" };
  assert.deepEqual(identityKeys(a), identityKeys(b));
  assert.equal(identityKeys({ ...a, phone: "" }).length, 0);
  assert.notDeepEqual(
    identityKeys({ ...a, address: "Rua A", city: "Recife" }),
    identityKeys({ ...a, address: "Rua A", city: "Olinda" }),
  );
});
test("duplicatas no arquivo: identidade forte ou linha idêntica, com opção de ignorar", () => {
  const a = { ...blankLead(), name: "Clínica Exemplo", phone: "00123456" };
  const rows = [
    { row: 2, lead: a },
    { row: 3, lead: { ...a, name: "Clinica Exemplo" } },
    { row: 4, lead: { ...a, phone: "00987654" } },
  ];
  assert.equal(findFileDuplicates(rows).get(3), 2);
  assert.equal(findFileDuplicates(rows).has(4), false);
  assert.equal(
    findFileDuplicates([{ ...rows[0], ignored: true }, rows[1]]).has(3),
    false,
  );
  assert.equal(
    findFileDuplicates([
      { row: 2, lead: blankLead() },
      { row: 3, lead: blankLead() },
    ]).get(3),
    2,
  );
});
test("Google Maps: remove tracking e fragmentos, preserva consulta e ordena parâmetros", () => {
  assert.notEqual(
    normalizeMapsUrl("https://google.com/maps?q=A?B"),
    normalizeMapsUrl("https://google.com/maps?q=A?C"),
  );
  assert.equal(
    normalizeMapsUrl(
      "https://www.google.com/maps/place/Exemplo/?utm_source=teste&q=clinica#foto",
    ),
    normalizeMapsUrl("http://www.google.com/maps/place/Exemplo?q=clinica"),
  );
  assert.notEqual(
    normalizeMapsUrl("https://google.com/maps?q=clinicaA"),
    normalizeMapsUrl("https://google.com/maps?q=clinicaB"),
  );
});
test("servidor: autorização antecede leitura/escrita, valida novamente e não confirma falha", async () => {
  let calls = 0;
  const port: ImportPort = {
    authorize: async () => {
      throw new Error("forbidden");
    },
    preview: async () => {
      calls++;
      return [];
    },
    commit: async () => {
      calls++;
      throw new Error("offline");
    },
  };
  const request = {
    requestId: randomUUID(),
    filename: "teste.csv",
    totalRows: 1,
    rows: [
      {
        row: 2,
        lead: { ...blankLead(), name: "Clínica Exemplo", niche: "clinicas" },
        decision: "insert",
        targetId: null,
        targetUpdatedAt: null,
        reason: "",
      },
    ],
  };
  assert.equal((await executeImport(request, "commit", port)).ok, false);
  assert.equal(calls, 0);
  port.authorize = async () => {};
  assert.equal(
    (
      await executeImport(
        {
          ...request,
          rows: [
            {
              ...request.rows[0],
              lead: { ...request.rows[0].lead, niche: "fake" },
            },
          ],
        },
        "commit",
        port,
      )
    ).ok,
    false,
  );
  assert.equal(calls, 0);
  assert.equal((await executeImport(request, "commit", port)).ok, false);
  assert.equal(calls, 1);
  assert.equal(
    importRequestSchema.safeParse({
      ...request,
      rows: [request.rows[0], request.rows[0]],
    }).success,
    false,
  );
});
