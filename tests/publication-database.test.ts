import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { buildPersonalization } from "../src/lib/generation/personalize";
import { publicSnapshot } from "../src/lib/publication";
import type {
  LeadRow,
  PrototypeRow,
  PublishedPrototypeRow,
} from "../src/types/database";
import type { GenerationPlan } from "../src/lib/generation/contracts";
test(
  "publication SQL: authorization, snapshot isolation, versions, races, unpublish and anonymous RLS",
  { timeout: 120000 },
  async () => {
    const db = new PGlite();
    const admin = randomUUID(),
      member = randomUUID();
    try {
      await db.exec(
        `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values('${admin}'),('${member}');`,
      );
      for (const file of readdirSync("supabase/migrations")
        .filter((f) => f.endsWith(".sql"))
        .sort())
        await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
      await db.exec(
        `insert into public.admin_users values('${admin}',now());set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false);`,
      );
      const lead = (
        await db.query<{ v: LeadRow }>(
          "insert into public.leads(name,niche) values('Empresa fictícia','restaurantes') returning to_jsonb(leads.*) v",
        )
      ).rows[0].v;
      const plan = (
        await db.query<{ v: GenerationPlan }>(
          "select public.plan_prototype_generation($1,'B') v",
          [[lead.id]],
        )
      ).rows[0].v;
      await db.query("select public.generate_prototypes($1::jsonb)", [
        JSON.stringify({
          requestId: randomUUID(),
          leadIds: [lead.id],
          mode: "B",
          expectedPlan: plan.fingerprint,
          customizations: [
            { leadId: lead.id, data: buildPersonalization(lead) },
          ],
        }),
      ]);
      const proto = (
        await db.query<PrototypeRow>("select * from public.prototypes")
      ).rows[0];
      const snapshot = publicSnapshot(proto.customization_data);
      const filtered = async (status: string) =>
        (
          await db.query<{ v: { total: number } }>(
            "select public.list_prototype_workspace('','',$1,null,0) v",
            [status],
          )
        ).rows[0].v.total;
      assert.equal(await filtered("draft"), 1);
      await assert.rejects(
        db.query("select public.publish_prototype($1,1,0,$2::jsonb)", [
          randomUUID(),
          JSON.stringify(snapshot),
        ]),
        /prototype_not_found/,
      );
      const publish = (revision: number, version: number, data = snapshot) =>
        db.query<{ v: PublishedPrototypeRow }>(
          "select public.publish_prototype($1,$2,$3,$4::jsonb) v",
          [proto.id, revision, version, JSON.stringify(data)],
        );
      assert.equal(
        (await db.query("select * from public.published_prototypes")).rows
          .length,
        0,
      );
      await assert.rejects(publish(99, 0), /draft_changed/);
      await assert.rejects(
        publish(1, 0, {
          ...snapshot,
          confirmed: { ...snapshot.confirmed, name: "Unreviewed" },
        }),
        /snapshot_changed/,
      );
      const first = (await publish(1, 0)).rows[0].v;
      assert.equal(first.publication_version, 1);
      assert.equal(await filtered("published"), 1);
      assert.equal(await filtered("draft"), 0);
      assert.equal(first.slug, proto.slug);
      assert.deepEqual(first.public_data, snapshot);
      assert.equal(JSON.stringify(first.public_data).includes(lead.id), false);
      await assert.rejects(publish(1, 0), /publication_changed/);
      const draft = buildPersonalization(lead);
      draft.confirmed.name = "Novo rascunho";
      draft.confirmedOrigin = "admin_review";
      await db.query("select public.edit_prototype($1,1,$2,$3::jsonb)", [
        proto.id,
        proto.template_id,
        JSON.stringify(draft),
      ]);
      assert.deepEqual(
        (
          await db.query<PublishedPrototypeRow>(
            "select * from public.published_prototypes",
          )
        ).rows[0].public_data,
        snapshot,
      );
      await assert.rejects(publish(1, 1), /draft_changed/);
      const next = publicSnapshot(draft);
      const races = await Promise.allSettled([
        publish(2, 1, next),
        publish(2, 1, next),
      ]);
      assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
      await db.exec(
        `select set_config('request.jwt.claim.sub','${member}',false)`,
      );
      await assert.rejects(publish(2, 2, next), /admin_required/);
      await assert.rejects(
        db.query("select public.unpublish_prototype($1,2)", [proto.id]),
        /admin_required/,
      );
      assert.equal(
        (await db.query("select * from public.published_prototypes")).rows
          .length,
        0,
      );
      await db.exec(
        "reset role;set role anon;select set_config('request.jwt.claim.sub','',false)",
      );
      assert.equal(
        (
          await db.query(
            "select slug,public_data from public.published_prototypes",
          )
        ).rows.length,
        1,
      );
      for (const table of ["leads", "prototypes", "imports", "admin_users"])
        await assert.rejects(
          db.query(`select * from public.${table}`),
          /permission denied/,
        );
      await assert.rejects(
        db.query("select prototype_id from public.published_prototypes"),
        /permission denied/,
      );
      await assert.rejects(publish(2, 2, next), /permission denied/);
      await assert.rejects(
        db.query("update public.published_prototypes set unpublished_at=now()"),
        /permission denied/,
      );
      await db.exec(
        `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false)`,
      );
      await db.query("select public.unpublish_prototype($1,2)", [proto.id]);
      assert.equal(await filtered("unpublished"), 1);
      assert.equal(await filtered("published"), 0);
      await db.exec(
        "reset role;set role anon;select set_config('request.jwt.claim.sub','',false)",
      );
      assert.equal(
        (await db.query("select public_data from public.published_prototypes"))
          .rows.length,
        0,
      );
      await db.exec(
        `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false)`,
      );
      assert.equal(
        (await publish(2, 3, next)).rows[0].v.publication_version,
        4,
      );
      assert.equal(
        (await db.query<PrototypeRow>("select * from public.prototypes"))
          .rows[0].status,
        "draft",
      );
    } finally {
      await db.close();
    }
  },
);
