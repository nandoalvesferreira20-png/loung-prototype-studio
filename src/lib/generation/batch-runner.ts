import {
  GENERATION_LIMITS,
  type GenerationMode,
  type GenerationPlan,
  type GenerationResult,
} from "./contracts";
import type { GenerationCommit, OperationResult } from "./service";
export type GenerationRun = {
  plan: GenerationPlan;
  mode: GenerationMode;
  remaining: string[];
  completed: number;
  results: GenerationResult[];
  pending: GenerationCommit | null;
};
export function startGenerationRun(
  plan: GenerationPlan,
  mode: GenerationMode,
): GenerationRun {
  return {
    plan,
    mode,
    remaining: plan.items.map((i) => i.leadId).sort(),
    completed: 0,
    results: [],
    pending: null,
  };
}
export function summarizeRun(run: GenerationRun): GenerationResult | null {
  if (!run.results.length) return null;
  return {
    requestId: run.results[0].requestId,
    created: run.results.reduce((n, r) => n + r.created, 0),
    ignored: run.results.reduce((n, r) => n + r.ignored, 0),
    prototypes: run.results.flatMap((r) => r.prototypes),
  };
}
type Port = {
  preview: (
    ids: string[],
    mode: GenerationMode,
  ) => Promise<OperationResult<GenerationPlan>>;
  commit: (
    request: GenerationCommit,
  ) => Promise<OperationResult<GenerationResult>>;
  onPending: (run: GenerationRun) => void;
  newId: () => string;
};
export async function nextGenerationBatch(
  run: GenerationRun,
  port: Port,
): Promise<
  | { ok: true; run: GenerationRun }
  | { ok: false; run: GenerationRun; message: string; stale?: boolean }
> {
  let current = run;
  try {
    if (!current.remaining.length) return { ok: true, run: current };
    if (!current.pending) {
      const ids = current.remaining.slice(0, GENERATION_LIMITS.batchSize);
      const preview = await port.preview(ids, current.mode);
      if (!preview.ok) return { ...preview, run: current };
      const expected = current.plan.items.filter((i) => ids.includes(i.leadId));
      if (
        preview.data.blocked ||
        JSON.stringify(preview.data.items) !== JSON.stringify(expected)
      )
        return {
          ok: false,
          stale: true,
          run: current,
          message:
            "A distribuição ou os dados mudaram. Os lotes já confirmados foram preservados; confira novamente os leads restantes.",
        };
      current = {
        ...current,
        pending: {
          requestId: port.newId(),
          leadIds: ids,
          mode: current.mode,
          expectedPlan: preview.data.fingerprint,
        },
      };
      port.onPending(current);
    }
    const result = await port.commit(current.pending!);
    if (!result.ok) return { ...result, run: current };
    const completedIds = current.pending!.leadIds;
    return {
      ok: true,
      run: {
        ...current,
        remaining: current.remaining.filter((id) => !completedIds.includes(id)),
        completed: current.completed + completedIds.length,
        results: [...current.results, result.data],
        pending: null,
      },
    };
  } catch {
    return {
      ok: false,
      run: current,
      message:
        "Resultado ainda não confirmado. Retome a mesma tentativa para continuar sem duplicar os lotes já gravados.",
    };
  }
}
