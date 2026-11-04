import type { z } from "zod";
import type { LeadRow } from "../../types/database";
import {
  generationSelectionSchema,
  generationPreviewSchema,
  generationCommitSchema,
  prototypeEditSchema,
  generationPlanSchema,
  generationResultSchema,
  type GenerationPlan,
  type GenerationResult,
  type Personalization,
} from "./contracts";
import { buildPersonalization } from "./personalize";
export class GenerationError extends Error {
  constructor(public code: string) {
    super("Generation operation failed");
  }
}
export type GenerationCommit = z.infer<typeof generationCommitSchema>;
export interface GenerationPort {
  authorize(): Promise<void>;
  plan(selection: z.infer<typeof generationSelectionSchema>): Promise<unknown>;
  replayExists(id: string): Promise<boolean>;
  leads(ids: string[]): Promise<LeadRow[]>;
  generate(
    request: GenerationCommit,
    customizations: { leadId: string; data: Personalization }[],
  ): Promise<unknown>;
  edit(request: z.infer<typeof prototypeEditSchema>): Promise<void>;
}
export type OperationResult<T> =
  { ok: true; data: T } | { ok: false; message: string; stale?: boolean };
export function generationFailure(error: unknown): {
  ok: false;
  message: string;
  stale?: boolean;
} {
  if (error instanceof GenerationError && error.code === "40001")
    return {
      ok: false,
      stale: true,
      message:
        "Os dados, a distribuição ou a versão mudaram. Confira a prévia novamente antes de confirmar.",
    };
  if (error instanceof GenerationError && error.code === "selection_limit")
    return {
      ok: false,
      message:
        "Há mais de 500 leads elegíveis. Refine os filtros ou selecione até 500 por operação.",
    };
  return {
    ok: false,
    message:
      "Não foi possível concluir. Verifique seu acesso, os dados e a configuração do banco. Nenhum resultado foi confirmado para esta tentativa.",
  };
}
export async function previewGeneration(
  raw: unknown,
  port: GenerationPort,
): Promise<OperationResult<GenerationPlan>> {
  try {
    await port.authorize();
    const parsed = generationPreviewSchema.safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        message:
          "Selecione de 1 a 500 leads únicos e um modo de distribuição válido.",
      };
    return {
      ok: true,
      data: generationPlanSchema.parse(
        await port.plan({
          ...parsed.data,
          leadIds: [...parsed.data.leadIds].sort(),
        }),
      ),
    };
  } catch (error) {
    return generationFailure(error);
  }
}
export async function commitGeneration(
  raw: unknown,
  port: GenerationPort,
): Promise<OperationResult<GenerationResult>> {
  try {
    await port.authorize();
    const parsed = generationCommitSchema.safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        message: "A confirmação é inválida. Refaça a prévia de até 25 leads.",
      };
    const request = {
      ...parsed.data,
      leadIds: [...parsed.data.leadIds].sort(),
    };
    if (await port.replayExists(request.requestId))
      return {
        ok: true,
        data: generationResultSchema.parse(await port.generate(request, [])),
      };
    const plan = generationPlanSchema.parse(await port.plan(request));
    if (plan.fingerprint !== request.expectedPlan) {
      // Uma tentativa anterior pode ter concluído enquanto o planejamento aguardava o lock.
      if (await port.replayExists(request.requestId))
        return {
          ok: true,
          data: generationResultSchema.parse(await port.generate(request, [])),
        };
      throw new GenerationError("40001");
    }
    if (plan.blocked)
      return {
        ok: false,
        message: "Remova ou corrija os leads impedidos antes de gerar.",
      };
    const ids = plan.items
      .filter((i) => i.status === "eligible")
      .map((i) => i.leadId);
    const leads = ids.length ? await port.leads(ids) : [];
    if (leads.length !== ids.length) throw new GenerationError("40001");
    const customizations = leads.map((lead) => ({
      leadId: lead.id,
      data: buildPersonalization(lead),
    }));
    return {
      ok: true,
      data: generationResultSchema.parse(
        await port.generate(request, customizations),
      ),
    };
  } catch (error) {
    return generationFailure(error);
  }
}
export async function editPrototype(
  raw: unknown,
  port: GenerationPort,
): Promise<OperationResult<null>> {
  try {
    await port.authorize();
    const parsed = prototypeEditSchema.safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        message: "Revise os campos, as URLs e os limites do protótipo.",
      };
    await port.edit({
      ...parsed.data,
      personalization: {
        ...parsed.data.personalization,
        confirmedOrigin: "admin_review",
      },
    });
    return { ok: true, data: null };
  } catch (error) {
    return generationFailure(error);
  }
}
