import type { PrototypeRow, TemplateRow } from "../types/database";
export type PreviewPort = {
  authorize(): Promise<unknown>;
  prototype(id: string): Promise<PrototypeRow | null>;
  template(id: string): Promise<TemplateRow | null>;
};
export async function loadPrivatePreview(id: string, port: PreviewPort) {
  await port.authorize();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  const prototype = await port.prototype(id);
  if (!prototype) return null;
  const template = await port.template(prototype.template_id);
  if (!template || template.niche !== prototype.niche) return null;
  return { prototype, template };
}
