import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/types/database";
import { buildPersonalization } from "../../src/lib/generation/personalize";
import {
  generationPlanSchema,
  generationResultSchema,
} from "../../src/lib/generation/contracts";

test(
  "INTEGRAÇÃO REAL Fase 3.1: dois clientes concorrentes, replay e RLS",
  {
    skip:
      process.env.RUN_SUPABASE_GENERATION !== "1"
        ? "Configure homologação com a migration revisada e RUN_SUPABASE_GENERATION=1. Concorrência remota não validada."
        : false,
    timeout: 90000,
  },
  async () => {
    function env(name: string) {
      const value = process.env[name];
      assert.ok(value, `Variável obrigatória: ${name}`);
      return value;
    }
    const options = {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    };
    const url = env("NEXT_PUBLIC_SUPABASE_URL"),
      key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    const a = createClient<Database>(url, key, options),
      b = createClient<Database>(url, key, options),
      anonymous = createClient<Database>(url, key, options);
    const id = randomUUID();
    const runId = randomUUID();
    try {
      for (const client of [a, b]) {
        const login = await client.auth.signInWithPassword({
          email: env("TEST_ADMIN_EMAIL"),
          password: env("TEST_ADMIN_PASSWORD"),
        });
        assert.equal(!!login.error, false, "Login da conta de teste falhou.");
      }
      const insert = await a
        .from("leads")
        .insert({
          id,
          name: `Geração fictícia ${runId}`,
          niche: "restaurantes",
          source: "automated-generation-test",
          external_reference: runId,
        })
        .select("*")
        .single();
      assert.equal(
        !!insert.error,
        false,
        "Não foi possível criar o lead fictício de homologação.",
      );
      assert.ok(insert.data);
      const p = await a.rpc("plan_prototype_generation", {
        p_ids: [id],
        p_mode: "auto",
      });
      assert.equal(
        !!p.error,
        false,
        "A migration de geração deve estar aplicada.",
      );
      const plan = generationPlanSchema.parse(p.data);
      assert.equal(
        plan.eligible,
        1,
        "É necessário ao menos um template ativo compatível.",
      );
      const payload = {
        leadIds: [id],
        mode: "auto",
        expectedPlan: plan.fingerprint,
        customizations: [
          { leadId: id, data: buildPersonalization(insert.data) },
        ],
      };
      const requests = [
        { ...payload, requestId: randomUUID() },
        { ...payload, requestId: randomUUID() },
      ];
      const results = await Promise.all([
        a.rpc("generate_prototypes", {
          p_request: requests[0] as unknown as Json,
        }),
        b.rpc("generate_prototypes", {
          p_request: requests[1] as unknown as Json,
        }),
      ]);
      const success = results.findIndex((r) => !r.error);
      assert.notEqual(success, -1);
      assert.equal(results.filter((r) => !r.error).length, 1);
      assert.equal(results[1 - success].error?.code, "40001");
      const result = generationResultSchema.parse(results[success].data);
      assert.equal(result.created, 1);
      const replay = await a.rpc("generate_prototypes", {
        p_request: requests[success] as unknown as Json,
      });
      assert.equal(!!replay.error, false);
      assert.deepEqual(generationResultSchema.parse(replay.data), result);
      const count = await a
        .from("prototypes")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", id);
      assert.equal(count.count, 1);
      const denied = await anonymous.rpc("plan_prototype_generation", {
        p_ids: [id],
        p_mode: "auto",
      });
      assert.ok(denied.error);
      const read = await anonymous
        .from("prototypes")
        .select("id")
        .eq("lead_id", id);
      assert.ok(read.error);
    } finally {
      // A FK remove somente o protótipo desta fixture. O recibo idempotente é append-only e permanece para auditoria.
      const cleanup = await a.from("leads").delete().eq("id", id);
      assert.equal(
        !!cleanup.error,
        false,
        "Remova manualmente a fixture de homologação se a limpeza não foi autorizada.",
      );
      await Promise.all([
        a.auth.signOut({ scope: "local" }),
        b.auth.signOut({ scope: "local" }),
      ]);
    }
  },
);
