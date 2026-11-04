import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  startGenerationRun,
  nextGenerationBatch,
  summarizeRun,
} from "../src/lib/generation/batch-runner";
import type {
  GenerationPlan,
  GenerationResult,
} from "../src/lib/generation/contracts";
function plan(size: number): GenerationPlan {
  const templateId = randomUUID();
  return {
    selected: size,
    eligible: size,
    ignored: 0,
    blocked: 0,
    fingerprint: "a".repeat(32),
    items: Array.from({ length: size }, () => randomUUID())
      .sort()
      .map((leadId, index) => ({
        leadId,
        name: `Empresa fictícia ${index}`,
        niche: "clinicas",
        leadUpdatedAt: "2026-10-28T12:00:00+00:00",
        templateId,
        variant: index % 2 ? "B" : "A",
        status: "eligible",
        reason: null,
      })),
  };
}
test("operações maiores usam requisições de até 25 e retomam lote incerto com mesmo ID", async () => {
  const original = plan(57);
  let run = startGenerationRun(original, "auto");
  const receipts = new Map<string, GenerationResult>();
  const mutations: string[][] = [];
  let failOnce = true;
  const pendingIds: string[] = [];
  const port = {
    newId: () => randomUUID(),
    onPending: (value: typeof run) => {
      pendingIds.push(value.pending!.requestId);
    },
    preview: async (ids: string[]) => ({
      ok: true as const,
      data: {
        ...original,
        selected: ids.length,
        eligible: ids.length,
        items: original.items.filter((i) => ids.includes(i.leadId)),
      },
    }),
    commit: async (request: { requestId: string; leadIds: string[] }) => {
      if (receipts.has(request.requestId))
        return { ok: true as const, data: receipts.get(request.requestId)! };
      const items = original.items.filter((i) =>
        request.leadIds.includes(i.leadId),
      );
      const result: GenerationResult = {
        requestId: request.requestId,
        created: items.length,
        ignored: 0,
        prototypes: items.map((i) => ({
          id: randomUUID(),
          leadId: i.leadId,
          templateId: i.templateId!,
          variant: i.variant!,
          niche: i.niche!,
          slug: `empresa-${randomUUID().replaceAll("-", "")}`,
        })),
      };
      receipts.set(request.requestId, result);
      mutations.push(request.leadIds);
      if (mutations.length === 2 && failOnce) {
        failOnce = false;
        throw new Error("network response lost");
      }
      return { ok: true as const, data: result };
    },
  };
  const first = await nextGenerationBatch(run, port);
  assert.equal(first.ok, true);
  run = first.run;
  assert.equal(run.completed, 25);
  const second = await nextGenerationBatch(run, port);
  assert.equal(second.ok, false);
  run = second.run;
  const pendingId = run.pending!.requestId;
  assert.equal(run.completed, 25);
  assert.equal(summarizeRun(run)?.created, 25);
  const retry = await nextGenerationBatch(run, port);
  assert.equal(retry.ok, true);
  run = retry.run;
  assert.equal(run.completed, 50);
  assert.equal(run.results[1].requestId, pendingId);
  const last = await nextGenerationBatch(run, port);
  assert.equal(last.ok, true);
  run = last.run;
  assert.equal(run.remaining.length, 0);
  assert.equal(summarizeRun(run)?.created, 57);
  assert.deepEqual(
    mutations.map((ids) => ids.length),
    [25, 25, 7],
  );
  assert.equal(pendingIds.length, 3);
  assert.equal(new Set(mutations.flat()).size, 57);
});
test("mudança na atribuição revisada interrompe antes de gravar o próximo lote", async () => {
  const original = plan(30);
  let commits = 0;
  const run = startGenerationRun(original, "auto");
  const result = await nextGenerationBatch(run, {
    newId: () => randomUUID(),
    onPending: () => {},
    preview: async (ids) => ({
      ok: true,
      data: {
        ...original,
        items: original.items
          .filter((i) => ids.includes(i.leadId))
          .map((i, index) =>
            index === 0 ? { ...i, variant: i.variant === "A" ? "B" : "A" } : i,
          ),
      },
    }),
    commit: async () => {
      commits++;
      throw new Error("não deveria chamar");
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.stale, true);
  assert.equal(commits, 0);
  assert.equal(result.run.completed, 0);
  assert.equal(result.run.remaining.length, 30);
});
