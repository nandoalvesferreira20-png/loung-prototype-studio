import {
  IMPORT_LIMITS,
  importRequestSchema,
  type ImportRequest,
  type DuplicatePreview,
  type ImportSummary,
} from "./model";
export type ImportResponse =
  | { ok: true; matches?: DuplicatePreview[]; summary?: ImportSummary }
  | {
      ok: false;
      message: string;
      issues?: { row: number; field: string; message: string }[];
    };
export interface ImportPort {
  authorize(): Promise<void>;
  preview(request: ImportRequest): Promise<DuplicatePreview[]>;
  commit(request: ImportRequest): Promise<ImportSummary>;
}
// Fronteira única: autoriza e valida novamente, sem confiar no estado do navegador.
export async function executeImport(
  raw: unknown,
  operation: "preview" | "commit",
  port: ImportPort,
): Promise<ImportResponse> {
  try {
    await port.authorize();
    if (
      !raw ||
      typeof raw !== "object" ||
      !("rows" in raw) ||
      !Array.isArray(raw.rows) ||
      raw.rows.length > IMPORT_LIMITS.maxRows ||
      JSON.stringify(raw).length > 3 * 1024 * 1024
    )
      return { ok: false, message: "O lote excede os limites permitidos." };
    const rawRows = raw.rows;
    const parsed = importRequestSchema.safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        message: "Revise os dados do lote antes de continuar.",
        issues: parsed.error.issues.slice(0, 100).map((i) => ({
          row:
            typeof i.path[1] === "number"
              ? ((rawRows[i.path[1]] as { row?: number })?.row ?? 0)
              : 0,
          field: String(i.path.at(-1) ?? "lote"),
          message: i.message,
        })),
      };
    return operation === "preview"
      ? { ok: true, matches: await port.preview(parsed.data) }
      : { ok: true, summary: await port.commit(parsed.data) };
  } catch {
    return {
      ok: false,
      message:
        "Não foi possível concluir a operação. Verifique seu acesso e a configuração do banco e tente novamente. Nenhum sucesso foi confirmado.",
    };
  }
}
