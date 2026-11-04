import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  blankLead,
  identityKeys,
  type ImportRequest,
  type ImportSummary,
  type DuplicatePreview,
} from "../src/lib/imports/model";
const admin = "11111111-1111-4111-8111-111111111111";
const member = "22222222-2222-4222-8222-222222222222";
function item(
  name: string,
  phone: string,
  row = 2,
): ImportRequest["rows"][number] {
  return {
    row,
    lead: {
      ...blankLead(),
      name,
      phone,
      niche: "clinicas",
      source: "loung_prospect",
    },
    decision: "insert",
    reason: "",
    targetId: null,
    targetUpdatedAt: null,
  };
}
function request(rows: ImportRequest["rows"]): ImportRequest {
  return {
    requestId: randomUUID(),
    filename: "ficticio.csv",
    totalRows: rows.length,
    rows,
  };
}

test(
  "PostgreSQL: migrations reais, RLS, duplicatas, idempotência e rollback transacional",
  { timeout: 120000 },
  async (t) => {
    const db = new PGlite();
    try {
      await db.exec(
        `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; insert into auth.users values ('${admin}'),('${member}');`,
      );
      for (const file of [
        "202610270001_foundation.sql",
        "202610270002_template_catalog.sql",
        "202610280001_lead_import.sql",
      ])
        await db.exec(
          readFileSync(
            new URL(`../supabase/migrations/${file}`, import.meta.url),
            "utf8",
          ),
        );
      await db.exec(
        `insert into public.admin_users(user_id) values ('${admin}'); set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false);`,
      );
      const commit = async (value: unknown) =>
        (
          await db.query<{ result: ImportSummary }>(
            "select public.commit_lead_import($1::jsonb) as result",
            [JSON.stringify(value)],
          )
        ).rows[0].result;
      const preview = async (value: ImportRequest["rows"]) =>
        (
          await db.query<{ result: DuplicatePreview[] }>(
            "select public.preview_lead_import($1::jsonb) as result",
            [JSON.stringify(value)],
          )
        ).rows[0].result;
      const count = async (name: string) =>
        (
          await db.query<{ n: number }>(
            `select count(*)::integer n from public.${name}`,
          )
        ).rows[0].n;
      const first = request([item("Clínica Exemplo", "001234567")]);
      let originalId = "";
      await t.test(
        "lote válido grava lead, histórico e resultado sem gerar protótipo",
        async () => {
          const result = await commit(first);
          assert.equal(result.status, "completed");
          assert.equal(result.valid_rows, 1);
          assert.equal(result.inserted_rows, 1);
          assert.equal(await count("leads"), 1);
          assert.equal(await count("imports"), 1);
          assert.equal(await count("import_lead_results"), 1);
          assert.equal(await count("prototypes"), 0);
          const lead = (
            await db.query<{
              id: string;
              phone: string;
              identity_keys: string[];
            }>("select id,phone,identity_keys from public.leads")
          ).rows[0];
          originalId = lead.id;
          assert.equal(lead.phone, "001234567");
          assert.deepEqual(
            lead.identity_keys,
            identityKeys(first.rows[0].lead),
          );
        },
      );
      await t.test(
        "reenvio idêntico devolve o mesmo histórico sem duplicar; payload diferente é negado",
        async () => {
          const a = await commit(first),
            b = await commit(first);
          assert.equal(a.id, b.id);
          assert.equal(await count("leads"), 1);
          assert.equal(await count("imports"), 1);
          await assert.rejects(
            commit({ ...first, filename: "alterado.csv" }),
            /idempotency_conflict/,
          );
        },
      );
      await t.test(
        "banco identifica duplicata e exige decisão explícita",
        async () => {
          const duplicate = request([item("Clinica Exemplo", "001234567")]);
          const matches = await preview(duplicate.rows);
          assert.equal(matches[0].matches[0].id, originalId);
          const failed = await commit(duplicate);
          assert.equal(failed.status, "failed");
          assert.equal(failed.valid_rows, 0);
          assert.equal(failed.error_code, "23505");
          assert.equal(await count("leads"), 1);
          const skip = request([{ ...duplicate.rows[0], decision: "skip" }]);
          const skipped = await commit(skip);
          assert.equal(skipped.duplicate_rows, 1);
          assert.equal(skipped.skipped_rows, 1);
          const separate = request([
            {
              ...duplicate.rows[0],
              decision: "separate",
              reason: "Empresas diferentes, confirmadas na revisão.",
            },
          ]);
          const saved = await commit(separate);
          assert.equal(saved.inserted_rows, 1);
          assert.equal(await count("leads"), 2);
        },
      );
      await t.test(
        "nome igual com identidade diferente não é duplicata",
        async () => {
          const result = await commit(
            request([item("Clínica Exemplo", "009876543")]),
          );
          assert.equal(result.status, "completed");
        },
      );
      await t.test(
        "normalização de Maps equivalente no cliente e PostgreSQL",
        async () => {
          const lead = {
            ...item("Clínica Maps", "").lead,
            google_maps_url:
              "https://www.google.com/maps/place/Exemplo/?utm_source=teste&q=clinica#foto",
          };
          const keys = (
            await db.query<{ keys: string[] }>(
              "select private.import_keys($1::jsonb) keys",
              [JSON.stringify(lead)],
            )
          ).rows[0].keys;
          assert.deepEqual(keys, identityKeys(lead));
          await commit(request([{ ...item("Clínica Maps", ""), lead }]));
          const matches = await preview([
            {
              ...item("Clínica Maps", ""),
              lead: {
                ...lead,
                google_maps_url:
                  "http://www.google.com/maps/place/Exemplo?q=clinica",
              },
            },
          ]);
          assert.equal(matches[0].matches.length, 1);
        },
      );
      await t.test(
        "atualização explícita usa versão revisada e bloqueia alteração concorrente",
        async () => {
          const record = item("Clínica Atualizar", "003333333");
          await commit(request([record]));
          const candidate = (await preview([record]))[0].matches[0];
          const update = {
            ...record,
            decision: "update" as const,
            targetId: candidate.id,
            targetUpdatedAt: candidate.updated_at,
            lead: { ...record.lead, description: "Descrição revisada" },
          };
          const updated = await commit(request([update]));
          assert.equal(updated.updated_rows, 1);
          const stale = await commit(request([update]));
          assert.equal(stale.status, "failed");
          assert.equal(stale.error_code, "40001");
        },
      );
      await t.test(
        "duplicatas dentro do lote não passam pelo servidor",
        async () => {
          const before = await count("leads");
          const row = item("Clínica Repetida", "004444444");
          const result = await commit(request([row, { ...row, row: 3 }]));
          assert.equal(result.status, "failed");
          assert.equal(result.valid_rows, 0);
          assert.equal(await count("leads"), before);
        },
      );
      await t.test(
        "falha no segundo insert reverte o primeiro, contadores e resultados",
        async () => {
          await db.exec(
            "reset role; create function public.test_fail_insert() returns trigger language plpgsql as $$ begin if new.name = 'Falha Simulada' then raise exception 'simulated constraint' using errcode='23514'; end if; return new; end $$; create trigger test_fail before insert on public.leads for each row execute function public.test_fail_insert(); set role authenticated;",
          );
          const before = await count("leads"),
            results = await count("import_lead_results");
          const req = request([
            item("Clínica Antes da Falha", "005555555"),
            item("Falha Simulada", "006666666", 3),
          ]);
          const result = await commit(req);
          assert.equal(result.status, "failed");
          assert.equal(result.valid_rows, 0);
          assert.equal(result.invalid_rows, 2);
          assert.equal(result.inserted_rows, 0);
          assert.equal(await count("leads"), before);
          assert.equal(await count("import_lead_results"), results);
          assert.equal((await commit(req)).id, result.id);
          assert.equal(await count("leads"), before);
        },
      );
      await t.test(
        "validação SQL bloqueia bypass do servidor e escrita direta duplicada",
        async () => {
          const before = await count("imports");
          await assert.rejects(
            commit(
              request([
                {
                  ...item("", ""),
                  lead: { ...item("", "").lead, niche: "outro" as never },
                },
              ]),
            ),
            /invalid_required/,
          );
          await assert.rejects(
            commit({
              ...request([item("X", "")]),
              rows: [{ row: 2, decision: "insert", lead: null }],
            }),
            /invalid_lead_shape/,
          );
          assert.equal(await count("imports"), before);
          await assert.rejects(
            db.query(
              "insert into public.leads(name,niche,phone) values ('Clinica Exemplo','clinicas','001234567')",
            ),
            /duplicate_lead/,
          );
        },
      );
      await t.test(
        "anônimo e usuário sem admin não leem dados nem executam importação",
        async () => {
          await db.exec(
            `select set_config('request.jwt.claim.sub','${member}',false);`,
          );
          assert.equal(await count("leads"), 0);
          await assert.rejects(
            commit(request([item("Intruso", "")])),
            /admin_required/,
          );
          await assert.rejects(
            preview([item("Intruso", "")]),
            /admin_required/,
          );
          await db.exec(
            "reset role; set role anon; select set_config('request.jwt.claim.sub','',false);",
          );
          await assert.rejects(
            db.query("select * from public.leads"),
            /permission denied/,
          );
          await assert.rejects(
            commit(request([item("Anônimo", "")])),
            /permission denied/,
          );
        },
      );
    } finally {
      await db.close();
    }
  },
);
