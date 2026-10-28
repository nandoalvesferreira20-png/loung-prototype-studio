import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { templates } from "../src/config/catalog";
const schema = readFileSync(
  new URL(
    "../supabase/migrations/202610270001_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const catalog = readFileSync(
  new URL(
    "../supabase/migrations/202610270002_template_catalog.sql",
    import.meta.url,
  ),
  "utf8",
);
// Checagens estruturais do contrato SQL; não executam PostgreSQL nem substituem os testes RLS reais.
test("contrato SQL: cinco tabelas com RLS habilitada e sem grants anônimos", () => {
  for (const table of [
    "admin_users",
    "imports",
    "leads",
    "templates",
    "prototypes",
  ]) {
    assert.ok(schema.includes(`create table public.${table} (`));
    assert.ok(
      schema.includes(`alter table public.${table} enable row level security;`),
    );
  }
  assert.doesNotMatch(
    schema,
    /grant\s+(select|insert|update|delete|all)\s+.*\s+to\s+anon\s*;/i,
  );
});
test("contrato SQL: unicidade de lead, nichos e variantes limitados e associação composta", () => {
  assert.match(schema, /lead_id uuid not null unique/);
  assert.match(
    schema,
    /enum \('clinicas', 'advocacia', 'imobiliarias', 'restaurantes'\)/,
  );
  assert.match(schema, /enum \('A', 'B'\)/);
  assert.match(
    schema,
    /foreign key \(template_id, niche\) references public.templates\(id, niche\)/,
  );
  assert.match(
    schema,
    /foreign key \(lead_id, niche\) references public.leads\(id, niche\)/,
  );
});
test("contrato SQL: autorização privada sem argumentos e sem política de autoatribuição", () => {
  assert.match(schema, /function private.is_admin\(\) returns boolean/);
  assert.match(schema, /security definer set search_path = ''/);
  assert.match(schema, /a.user_id = \(select auth.uid\(\)\)/);
  assert.match(
    schema,
    /revoke all on table public.admin_users from public, anon, authenticated/,
  );
  assert.match(
    schema,
    /create policy admin_users_read_self .* for select to authenticated/,
  );
  assert.doesNotMatch(
    schema,
    /create policy .* on public.admin_users for (all|insert|update|delete)/,
  );
});
test("catálogo SQL corresponde aos oito conceitos existentes, sem dados de clientes", () => {
  for (const template of templates)
    assert.ok(catalog.includes(`('${template.id.toLowerCase()}'`));
  assert.equal((catalog.match(/,'planned'\)/g) ?? []).length, 8);
  assert.doesNotMatch(
    catalog,
    /insert into public\.(leads|imports|prototypes|admin_users)/,
  );
});
