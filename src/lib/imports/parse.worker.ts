import { readSpreadsheet } from "./read-file";
self.onmessage = async (
  event: MessageEvent<{ name: string; bytes: ArrayBuffer }>,
) => {
  try {
    self.postMessage({
      ok: true,
      sheet: await readSpreadsheet(
        event.data.name,
        new Uint8Array(event.data.bytes),
      ),
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      message:
        error instanceof Error &&
        /^(Selecione|O arquivo|O XLSX|XLSX|CSV|A planilha|Limite|Há registros|Há células)/.test(
          error.message,
        )
          ? error.message
          : "Não foi possível ler a planilha. Verifique se o arquivo está íntegro.",
    });
  }
};
