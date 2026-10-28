import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../../src/types/database";
import { resolveAccess } from "../../src/lib/auth/access";
import { supabaseAccessPort } from "../../src/lib/auth/supabase-port";

const enabled = process.env.RUN_SUPABASE_INTEGRATION === "1";
test(
  "INTEGRAÇÃO REAL: Supabase Auth, RLS, constraints e rotas privadas",
  {
    skip: !enabled
      ? "Configure projeto/contas de teste e RUN_SUPABASE_INTEGRATION=1. Integração não validada."
      : false,
  },
  async (t) => {
    function env(name: string) {
      const value = process.env[name];
      assert.ok(value, `Variável obrigatória: ${name}`);
      return value;
    }
    const url = env("NEXT_PUBLIC_SUPABASE_URL");
    const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    const appUrl = env("TEST_APP_URL");
    const adminEmail = env("TEST_ADMIN_EMAIL");
    const adminPassword = env("TEST_ADMIN_PASSWORD");
    const memberEmail = env("TEST_NON_ADMIN_EMAIL");
    const memberPassword = env("TEST_NON_ADMIN_PASSWORD");
    const options = {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    };
    const anonymous = createClient<Database>(url, key, options);
    const member = createClient<Database>(url, key, options);
    const cookies = new Map<string, string>();
    const admin = createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
        setAll: (values) =>
          values.forEach(({ name, value }) => cookies.set(name, value)),
      },
    });
    const cookieHeader = () =>
      Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ");
    const runId = randomUUID();
    const leadId = randomUUID();
    const prototypeId = randomUUID();
    const importId = randomUUID();
    try {
      await t.test("login inválido não abre sessão", async () => {
        const { error } = await anonymous.auth.signInWithPassword({
          email: adminEmail,
          password: randomUUID(),
        });
        assert.ok(error);
        assert.equal((await anonymous.auth.getUser()).data.user, null);
      });
      await t.test("login válido e associação administrativa", async () => {
        const { error } = await admin.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });
        assert.equal(error, null);
        assert.equal(
          (await resolveAccess(supabaseAccessPort(admin))).status,
          "authorized",
        );
      });
      await t.test("conta autenticada sem autorização é negada", async () => {
        const { error } = await member.auth.signInWithPassword({
          email: memberEmail,
          password: memberPassword,
        });
        assert.equal(error, null);
        assert.equal(
          (await resolveAccess(supabaseAccessPort(member))).status,
          "forbidden",
        );
      });
      await t.test("anônimo não lê dados e não insere leads", async () => {
        for (const table of [
          "admin_users",
          "imports",
          "leads",
          "templates",
          "prototypes",
        ] as const) {
          const { data, error } = await anonymous.from(table).select("*");
          assert.ok(error || data?.length === 0);
        }
        assert.ok(
          (
            await anonymous
              .from("leads")
              .insert({ name: "Teste negado", niche: "clinicas" })
          ).error,
        );
      });
      await t.test(
        "não administrador não lê, insere, altera ou exclui dados administrativos",
        async () => {
          for (const table of [
            "imports",
            "leads",
            "templates",
            "prototypes",
          ] as const) {
            const { data, error } = await member.from(table).select("*");
            assert.equal(error, null);
            assert.deepEqual(data, []);
          }
          assert.ok(
            (
              await member
                .from("leads")
                .insert({ name: "Teste negado", niche: "clinicas" })
            ).error,
          );
        },
      );
      await t.test(
        "nenhuma conta se autoatribui ou modifica administradores",
        async () => {
          const memberId = (await member.auth.getUser()).data.user!.id;
          for (const client of [member, admin]) {
            assert.ok(
              (await client.from("admin_users").insert({ user_id: memberId }))
                .error,
            );
            assert.ok(
              (
                await client
                  .from("admin_users")
                  .update({ user_id: memberId })
                  .eq("user_id", memberId)
              ).error,
            );
            assert.ok(
              (
                await client
                  .from("admin_users")
                  .delete()
                  .eq("user_id", memberId)
              ).error,
            );
          }
        },
      );
      const { data: catalog, error: catalogError } = await admin
        .from("templates")
        .select("*");
      assert.equal(catalogError, null);
      assert.equal(catalog?.length, 8);
      const clinic = catalog!.find(
        (template) => template.slug === "clinicas-a",
      )!;
      const lawyer = catalog!.find(
        (template) => template.slug === "advocacia-a",
      )!;
      assert.ok(clinic);
      assert.ok(lawyer);
      await t.test("admin grava e lê fixture descartável", async () => {
        assert.equal(
          (
            await admin
              .from("imports")
              .insert({ id: importId, filename: `security-test-${runId}.csv` })
          ).error,
          null,
        );
        assert.equal(
          (
            await admin.from("leads").insert({
              id: leadId,
              import_id: importId,
              name: `Security test ${runId}`,
              niche: "clinicas",
              source: "automated-security-test",
            })
          ).error,
          null,
        );
        assert.equal(
          (
            await admin.from("prototypes").insert({
              id: prototypeId,
              lead_id: leadId,
              template_id: clinic.id,
              slug: `security-test-${runId}`,
            })
          ).error,
          null,
        );
        const { data, error } = await admin
          .from("prototypes")
          .select("*")
          .eq("id", prototypeId)
          .single();
        assert.equal(error, null);
        assert.equal(data?.niche, "clinicas");
      });
      await t.test(
        "RLS impede alteração/exclusão de registro existente por não administrador",
        async () => {
          const update = await member
            .from("leads")
            .update({ name: "Não autorizado" })
            .eq("id", leadId)
            .select("id");
          assert.equal(update.error, null);
          assert.deepEqual(update.data, []);
          const remove = await member
            .from("leads")
            .delete()
            .eq("id", leadId)
            .select("id");
          assert.equal(remove.error, null);
          assert.deepEqual(remove.data, []);
          assert.equal(
            (await admin.from("leads").select("name").eq("id", leadId).single())
              .data?.name,
            `Security test ${runId}`,
          );
        },
      );
      await t.test(
        "banco impede duplicidade de protótipo e template incompatível",
        async () => {
          assert.equal(
            (
              await admin.from("prototypes").insert({
                lead_id: leadId,
                template_id: clinic.id,
                slug: `duplicate-${runId}`,
              })
            ).error?.code,
            "23505",
          );
          assert.equal(
            (
              await admin
                .from("prototypes")
                .update({ template_id: lawyer.id })
                .eq("id", prototypeId)
            ).error?.code,
            "23503",
          );
          assert.equal(
            (
              await admin
                .from("leads")
                .update({ niche: "advocacia" })
                .eq("id", leadId)
            ).error?.code,
            "23503",
          );
          assert.equal(
            (
              await admin
                .from("imports")
                .update({ total_rows: -1 })
                .eq("id", importId)
            ).error?.code,
            "23514",
          );
        },
      );
      await t.test(
        "todas as páginas privadas negam visitante e permitem admin; endpoint distingue 401/403/200",
        async () => {
          for (const path of [
            "/dashboard",
            "/importacoes",
            "/prototipos",
            "/templates",
            "/configuracoes",
          ]) {
            const denied = await fetch(new URL(path, appUrl), {
              redirect: "manual",
            });
            assert.equal(denied.status, 307);
            assert.ok(denied.headers.get("location")?.startsWith("/login"));
            const allowed = await fetch(new URL(path, appUrl), {
              headers: { cookie: cookieHeader() },
              redirect: "manual",
            });
            assert.equal(allowed.status, 200);
          }
          const endpoint = new URL("/api/admin/session", appUrl);
          assert.equal((await fetch(endpoint)).status, 401);
          assert.equal(
            (await fetch(endpoint, { headers: { cookie: cookieHeader() } }))
              .status,
            200,
          );
          const memberCookies = new Map<string, string>();
          const memberSsr = createServerClient<Database>(url, key, {
            cookies: {
              getAll: () =>
                Array.from(memberCookies, ([name, value]) => ({ name, value })),
              setAll: (values) =>
                values.forEach(({ name, value }) =>
                  memberCookies.set(name, value),
                ),
            },
          });
          assert.equal(
            (
              await memberSsr.auth.signInWithPassword({
                email: memberEmail,
                password: memberPassword,
              })
            ).error,
            null,
          );
          const header = Array.from(
            memberCookies,
            ([name, value]) => `${name}=${value}`,
          ).join("; ");
          assert.equal(
            (await fetch(endpoint, { headers: { cookie: header } })).status,
            403,
          );
          for (const path of [
            "/dashboard",
            "/importacoes",
            "/prototipos",
            "/templates",
            "/configuracoes",
          ]) {
            const denied = await fetch(new URL(path, appUrl), {
              headers: { cookie: header },
              redirect: "manual",
            });
            assert.equal(denied.status, 307);
            assert.ok(
              denied.headers.get("location")?.includes("reason=forbidden"),
            );
          }
          await memberSsr.auth.signOut({ scope: "local" });
        },
      );
    } finally {
      // Somente fixtures com UUID desta execução; nunca limpa dados existentes.
      const errors = [];
      for (const [table, id] of [
        ["prototypes", prototypeId],
        ["leads", leadId],
        ["imports", importId],
      ] as const) {
        const { error } = await admin.from(table).delete().eq("id", id);
        if (error) errors.push(`${table}: ${error.code}`);
      }
      const signout = await admin.auth.signOut({ scope: "local" });
      await member.auth.signOut({ scope: "local" });
      assert.equal(signout.error, null);
      assert.deepEqual(errors, [], "Falha ao limpar fixtures de teste");
    }
    await t.test(
      "logout impede novo acesso com os cookies locais atualizados",
      async () => {
        assert.equal(
          (await resolveAccess(supabaseAccessPort(admin))).status,
          "unauthenticated",
        );
        assert.equal(
          (
            await fetch(new URL("/api/admin/session", appUrl), {
              headers: { cookie: cookieHeader() },
            })
          ).status,
          401,
        );
      },
    );
  },
);
