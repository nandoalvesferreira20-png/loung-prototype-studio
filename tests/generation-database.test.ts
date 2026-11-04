import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { buildPersonalization } from "../src/lib/generation/personalize";
import {
  startGenerationRun,
  nextGenerationBatch,
  summarizeRun,
} from "../src/lib/generation/batch-runner";
import type {
  GenerationPlan,
  GenerationResult,
  Personalization,
  GenerationLeadPage,
  PrototypePage,
} from "../src/lib/generation/contracts";
import type { LeadRow, PrototypeRow } from "../src/types/database";
import type { NicheId } from "../src/types/domain";
import {
  restaurantTestDesign,
  restaurantTestItem,
} from "./fixtures/restaurant";
import { restaurantDesignSchema } from "../src/lib/generation/restaurant-design";
const admin = "11111111-1111-4111-8111-111111111111",
  member = "22222222-2222-4222-8222-222222222222";
test(
  "motor SQL: distribuição, transações, RLS, edição e concorrência",
  { timeout: 120000 },
  async (t) => {
    const db = new PGlite();
    try {
      await db.exec(
        `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values('${admin}'),('${member}');`,
      );
      for (const file of [
        "202610270001_foundation.sql",
        "202610270002_template_catalog.sql",
        "202610280001_lead_import.sql",
        "202610280002_prototype_generation.sql",
        "202611030001_clinic_design.sql",
        "202611030002_clinic_appointments.sql",
        "202611030003_law_classic.sql",
        "202611030004_law_modern.sql",
        "202611030005_real_estate_premium.sql",
        "202611030006_real_estate_personal.sql",
        "202611030007_restaurant_premium.sql",
        "202611040001_restaurant_digital.sql",
      ])
        await db.exec(
          readFileSync(
            new URL(`../supabase/migrations/${file}`, import.meta.url),
            "utf8",
          ),
        );
      await db.exec(
        `insert into public.admin_users(user_id) values('${admin}');set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false);`,
      );
      const lead = async (name: string, niche: NicheId = "clinicas") =>
        (
          await db.query<{ v: LeadRow }>(
            "insert into public.leads(name,niche) values($1,$2) returning to_jsonb(leads.*) v",
            [name, niche],
          )
        ).rows[0].v;
      const plan = async (ids: string[], mode = "auto") =>
        (
          await db.query<{ v: GenerationPlan }>(
            "select public.plan_prototype_generation($1::uuid[],$2) v",
            [ids, mode],
          )
        ).rows[0].v;
      const payload = async (ids: string[], mode = "auto") => {
        const p = await plan(ids, mode);
        const leads = (
          await db.query<{ v: LeadRow }>(
            "select to_jsonb(l) v from public.leads l where id=any($1::uuid[])",
            [ids],
          )
        ).rows.map((r) => r.v);
        return {
          requestId: randomUUID(),
          leadIds: [...ids].sort(),
          mode,
          expectedPlan: p.fingerprint,
          customizations: leads
            .filter((l) =>
              p.items.some((i) => i.leadId === l.id && i.status === "eligible"),
            )
            .map((l) => ({ leadId: l.id, data: buildPersonalization(l) })),
        };
      };
      const generate = async (request: unknown) =>
        (
          await db.query<{ v: GenerationResult }>(
            "select public.generate_prototypes($1::jsonb) v",
            [JSON.stringify(request)],
          )
        ).rows[0].v;
      const count = async (table = "prototypes") =>
        (
          await db.query<{ n: number }>(
            `select count(*)::integer n from public.${table}`,
          )
        ).rows[0].n;
      let firstRequest: Awaited<ReturnType<typeof payload>>;
      let firstResult: GenerationResult;
      await t.test(
        "quantidades ímpares equilibradas em cada um dos quatro nichos; IDs persistidos",
        async () => {
          for (const niche of [
            "clinicas",
            "advocacia",
            "imobiliarias",
            "restaurantes",
          ] as const) {
            const leads = [];
            for (let i = 0; i < 5; i++)
              leads.push(await lead(`Empresa ${niche} ${i}`, niche));
            const ids = leads.map((l) => l.id);
            const p = await plan(ids);
            assert.equal(p.eligible, 5);
            assert.equal(p.items.filter((i) => i.variant === "A").length, 3);
            assert.equal(p.items.filter((i) => i.variant === "B").length, 2);
            assert.deepEqual(await plan([...ids].reverse()), p);
            const request = await payload(ids);
            const result = await generate(request);
            assert.equal(result.created, 5);
            if (niche === "clinicas") {
              firstRequest = request;
              firstResult = result;
            }
            const stored = (
              await db.query<PrototypeRow>(
                "select * from public.prototypes where lead_id=any($1::uuid[])",
                [ids],
              )
            ).rows;
            assert.equal(stored.length, 5);
            assert.ok(
              stored.every((p) => p.status === "draft" && !p.published_at),
            );
            assert.ok(
              stored.every(
                (p) =>
                  p.slug.length <= 160 &&
                  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug),
              ),
            );
          }
        },
      );
      await t.test(
        "replay do mesmo pedido e nova seleção com protótipos existentes não duplicam",
        async () => {
          const before = await count();
          assert.deepEqual(await generate(firstRequest!), firstResult!);
          assert.equal(await count(), before);
          const ids = firstRequest!.leadIds;
          const p = await plan(ids);
          assert.equal(p.ignored, 5);
          assert.equal(p.eligible, 0);
          const result = await generate(await payload(ids));
          assert.equal(result.created, 0);
          assert.equal(result.ignored, 5);
          assert.equal(await count(), before);
          await assert.rejects(
            generate({ ...firstRequest!, mode: "B" }),
            /idempotency_conflict/,
          );
        },
      );
      await t.test(
        "distribuição considera modelos existentes, inclusive escolha manual, sem redistribuir",
        async () => {
          const prior = (
            await db.query<{ id: string; template_id: string }>(
              "select id,template_id from public.prototypes",
            )
          ).rows;
          const a = await lead("Manual A");
          const manual = await generate(await payload([a.id], "A"));
          assert.equal(manual.prototypes[0].variant, "A");
          const next = await lead("Automático depois de manual");
          const p = await plan([next.id]);
          assert.equal(p.items[0].variant, "B");
          await generate(await payload([next.id]));
          const current = (
            await db.query<{ id: string; template_id: string }>(
              "select id,template_id from public.prototypes where id=any($1::uuid[])",
              [prior.map((p) => p.id)],
            )
          ).rows;
          assert.deepEqual(
            current.sort((a, b) => a.id.localeCompare(b.id)),
            prior.sort((a, b) => a.id.localeCompare(b.id)),
          );
        },
      );
      await t.test(
        "template inativo impede escolha manual; automático usa apenas variante ativa",
        async () => {
          await db.exec(
            "update public.templates set status='archived' where niche='advocacia' and variant='B'",
          );
          const l = await lead("Template inativo", "advocacia");
          const p = await plan([l.id], "B");
          assert.equal(p.blocked, 1);
          assert.equal(p.items[0].reason, "active_template_missing");
          assert.equal((await plan([l.id])).items[0].variant, "A");
          await assert.rejects(
            generate(await payload([l.id], "B")),
            /generation_has_blocked/,
          );
          await db.exec(
            "update public.templates set status='active' where niche='advocacia' and variant='B'",
          );
        },
      );
      await t.test(
        "lead alterado após prévia ou snapshot inválido não é gerado",
        async () => {
          const l = await lead("Versão antiga");
          const request = await payload([l.id]);
          await db.query(
            "update public.leads set city='Cidade fictícia' where id=$1",
            [l.id],
          );
          await assert.rejects(generate(request), /generation_plan_changed/);
          const current = await payload([l.id]);
          current.customizations[0].data.confirmed.name =
            "Informação não confirmada";
          await assert.rejects(generate(current), /lead_snapshot_changed/);
          const invalid = await lead("Dados inválidos");
          await db.query(
            "update public.leads set website='javascript:alert(1)' where id=$1",
            [invalid.id],
          );
          assert.equal((await plan([invalid.id])).blocked, 1);
        },
      );
      await t.test(
        "colisão real de slug é recuperada sem duplicar ou perder o lead",
        async () => {
          const l = await lead("Colisão de slug");
          const existing = firstResult!.prototypes[0].slug;
          await db.exec(
            `reset role;create sequence public.test_slug_attempt;grant usage,select on sequence public.test_slug_attempt to authenticated;create function public.test_slug_collision() returns trigger language plpgsql as $$ begin if new.lead_id='${l.id}'::uuid and nextval('public.test_slug_attempt')=1 then new.slug='${existing}';end if;return new;end;$$;create trigger zz_test_slug before insert on public.prototypes for each row execute function public.test_slug_collision();set role authenticated;`,
          );
          const result = await generate(await payload([l.id]));
          assert.equal(result.created, 1);
          assert.notEqual(result.prototypes[0].slug, existing);
          assert.equal(
            (
              await db.query<{ n: string }>(
                "select last_value::text n from public.test_slug_attempt",
              )
            ).rows[0].n,
            "2",
          );
        },
      );
      await t.test(
        "falha no segundo lead desfaz lote inteiro e pedido idempotente",
        async () => {
          const leads = [
            await lead("Atomicidade 1"),
            await lead("Atomicidade 2"),
          ].sort((a, b) => a.id.localeCompare(b.id));
          const request = await payload(leads.map((l) => l.id));
          const before = await count(),
            requests = await count("prototype_generation_requests");
          await db.exec(
            `reset role;create function public.test_generation_failure() returns trigger language plpgsql as $$ begin if new.lead_id='${leads[1].id}'::uuid then raise exception 'simulated generation failure' using errcode='23514';end if;return new;end;$$;create trigger zz_test_generation_failure before insert on public.prototypes for each row execute function public.test_generation_failure();set role authenticated;`,
          );
          await assert.rejects(
            generate(request),
            /simulated generation failure/,
          );
          assert.equal(await count(), before);
          assert.equal(await count("prototype_generation_requests"), requests);
          await db.exec(
            "reset role;drop trigger zz_test_generation_failure on public.prototypes;set role authenticated;",
          );
          assert.equal((await generate(request)).created, 2);
        },
      );
      await t.test(
        "pedidos sobrepostos concorrentes preservam unicidade e exigem nova prévia",
        async () => {
          const l = await lead("Concorrência");
          const a = await payload([l.id]),
            b = await payload([l.id]);
          const results = await Promise.allSettled([generate(a), generate(b)]);
          assert.equal(
            results.filter((r) => r.status === "fulfilled").length,
            1,
          );
          assert.equal(
            results.filter((r) => r.status === "rejected").length,
            1,
          );
          assert.equal(
            (
              await db.query<{ n: number }>(
                "select count(*)::integer n from public.prototypes where lead_id=$1",
                [l.id],
              )
            ).rows[0].n,
            1,
          );
        },
      );
      await t.test(
        "edição versionada, template compatível, slug estável e publicação bloqueada",
        async () => {
          const id = firstResult!.prototypes[0].id;
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [id],
            )
          ).rows[0];
          const compatible = (
            await db.query<{ id: string }>(
              "select id from public.templates where niche=$1 and variant='B'",
              [proto.niche],
            )
          ).rows[0].id;
          const data = {
            ...(proto.customization_data as unknown as Personalization),
            confirmedOrigin: "admin_review",
            confirmed: {
              ...(proto.customization_data as unknown as Personalization)
                .confirmed,
              city: "Cidade revisada",
            },
          };
          data.missingFields = data.missingFields.filter((f) => f !== "city");
          const edit = async (
            templateId = compatible,
            revision = proto.revision,
          ) =>
            (
              await db.query<{ v: PrototypeRow }>(
                "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
                [id, revision, templateId, JSON.stringify(data)],
              )
            ).rows[0].v;
          const updated = await edit();
          assert.equal(updated.revision, proto.revision + 1);
          const extended = {
            ...data,
            clinicDesign: {
              version: 1,
              primary: "#244c45",
              appointments: {
                version: 1,
                primary: "#004D50",
                email: "confirmed@example.test",
                hours: "Horários confirmados de teste",
                sections: ["about", "process", "contact"],
                heroImage: {
                  src: "/templates/clinics/shared/doctor-consultation-main.png",
                  position: "right",
                  illustrative: true,
                },
                gallery: [
                  {
                    src: "/templates/clinics/shared/clinic-room-structure.png",
                    caption: "Referência",
                    illustrative: true,
                  },
                ],
                steps: [
                  { title: "Escolha", description: "Consulte os serviços" },
                  { title: "Contato", description: "Use o canal" },
                  { title: "Confirme", description: "Combine os detalhes" },
                ],
              },
              sections: ["about", "contact"],
            },
          };
          await db.query(
            "select private.validate_personalization($1::jsonb, 'clinicas')",
            [JSON.stringify(extended)],
          );

          for (const invalid of [
            { version: 99 },
            { version: 1, primary: "red" },
            { version: 1, email: "bad" },
            { version: 1, sections: ["about", "about"] },
            { version: 1, sections: ["foreign"] },
            { version: 1, hiddenContacts: ["email", "email"] },
            { version: 1, steps: [] },
            {
              version: 1,
              heroImage: { src: "https://example.test/external.png" },
            },
            {
              version: 1,
              gallery: [{ src: "/templates/clinics/../private.png" }],
            },
            { version: 1, unknown: true },
          ])
            await assert.rejects(
              db.query(
                "select private.validate_clinic_appointments($1::jsonb)",
                [JSON.stringify(invalid)],
              ),
              /invalid_appointments/,
            );
          assert.equal(updated.slug, proto.slug);
          assert.equal(updated.template_id, compatible);
          await db.exec("begin; savepoint design_check;");
          try {
            const saved = await db.query<{ v: PrototypeRow }>(
              "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
              [id, updated.revision, compatible, JSON.stringify(extended)],
            );
            assert.deepEqual(
              (saved.rows[0].v.customization_data as unknown as Personalization)
                .clinicDesign,
              extended.clinicDesign,
            );
            const reopened = await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [id],
            );
            assert.deepEqual(
              (
                reopened.rows[0]
                  .customization_data as unknown as Personalization
              ).clinicDesign,
              extended.clinicDesign,
            );
          } finally {
            await db.exec("rollback to design_check; commit;");
          }
          await assert.rejects(edit(), /revision_changed/);
          const incompatible = (
            await db.query<{ id: string }>(
              "select id from public.templates where niche<>'clinicas' limit 1",
            )
          ).rows[0].id;
          await assert.rejects(
            edit(incompatible, updated.revision),
            /incompatible/,
          );
          await assert.rejects(
            db.query(
              "update public.prototypes set slug='alterado-123' where id=$1",
              [id],
            ),
            /immutable/,
          );
          await assert.rejects(
            db.query(
              "update public.prototypes set status='published',published_at=now() where id=$1",
              [id],
            ),
            /publication_not_available/,
          );
        },
      );
      await t.test(
        "Imobiliárias A: catálogo JSONB, CRUD, releitura e revisão",
        async () => {
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where niche='imobiliarias' limit 1",
            )
          ).rows[0];
          const target = (
            await db.query<{ id: string }>(
              "select id from public.templates where slug='imobiliarias-a'",
            )
          ).rows[0].id;
          const original =
            proto.customization_data as unknown as Personalization;
          const property = {
            id: randomUUID(),
            title: "Imóvel cadastrado",
            purpose: "venda",
            type: "casa",
            city: "Cidade confirmada",
            price: 750000,
            area: 120,
            bedrooms: 3,
            bathrooms: 2,
            parking: 2,
            description: "Descrição confirmada",
            images: [
              {
                src: "/templates/real-estate/properties/autorizada.png",
                alt: "Fachada autorizada",
              },
            ],
            status: "disponivel",
            featured: true,
            demonstration: false,
          };
          const design = {
            version: 1,
            leadType: "broker",
            creci: "Registro confirmado",
            colors: { primary: "#142B35" },
            steps: [
              { title: "Etapa confirmada", description: "Descrição aprovada" },
            ],
            categories: [{ type: "casa", hidden: false }],
            properties: [property],
          };
          const payload = {
            ...original,
            confirmedOrigin: "admin_review",
            realEstateDesign: design,
          };
          const save = async (revision: number, data: unknown) =>
            (
              await db.query<{ v: PrototypeRow }>(
                "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
                [proto.id, revision, target, JSON.stringify(data)],
              )
            ).rows[0].v;
          const added = await save(proto.revision, payload);
          const reopened = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [proto.id],
            )
          ).rows[0];
          assert.deepEqual(
            (reopened.customization_data as unknown as Personalization)
              .realEstateDesign,
            design,
          );
          assert.equal(added.slug, proto.slug);
          assert.deepEqual(
            (added.customization_data as unknown as Personalization).confirmed,
            original.confirmed,
          );
          await assert.rejects(
            save(proto.revision, payload),
            /revision_changed/,
          );
          const edited = await save(added.revision, {
            ...payload,
            realEstateDesign: {
              ...design,
              properties: [{ ...property, price: 800000, status: "reservado" }],
            },
          });
          assert.equal(
            (edited.customization_data as unknown as Personalization)
              .realEstateDesign?.properties?.[0].price,
            800000,
          );
          const removed = await save(edited.revision, {
            ...payload,
            realEstateDesign: { ...design, properties: [] },
          });
          assert.deepEqual(
            (removed.customization_data as unknown as Personalization)
              .realEstateDesign?.properties,
            [],
          );
          for (const invalid of [
            { version: 2 },
            { version: 1, properties: [property, property] },
            { version: 1, properties: [{ ...property, price: -1 }] },
            {
              version: 1,
              properties: [
                {
                  ...property,
                  images: [
                    {
                      src: "/templates/real-estate/shared/real-estate-luxury-house-hero.png",
                    },
                  ],
                },
              ],
            },
            { version: 1, properties: [{ ...property, demonstration: null }] },
            {
              version: 1,
              properties: Array.from({ length: 49 }, () => ({
                ...property,
                id: randomUUID(),
              })),
            },
            {
              version: 1,
              images: { hero: { src: "https://evil.test/x.png" } },
            },
            { version: 1, sections: ["about", "about"] },
            { version: 1, facebook: "https://facebook.com.evil.test/x" },
          ])
            await assert.rejects(
              db.query(
                "select private.validate_real_estate_design($1::jsonb)",
                [JSON.stringify(invalid)],
              ),
            );
          await db.query(
            "select private.validate_real_estate_design($1::jsonb)",
            [
              JSON.stringify({
                version: 1,
                properties: [
                  {
                    ...property,
                    demonstration: true,
                    images: [
                      {
                        src: "/templates/real-estate/shared/real-estate-luxury-house-hero.png",
                      },
                    ],
                  },
                ],
              }),
            ],
          );
        },
      );
      await t.test(
        "Restaurantes A: cardápio JSONB, CRUD, revisão, validação e autorização",
        async () => {
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where niche='restaurantes' and status='draft' limit 1",
            )
          ).rows[0];
          const target = (
            await db.query<{ id: string }>(
              "select id from public.templates where slug='restaurantes-a'",
            )
          ).rows[0].id;
          const original =
            proto.customization_data as unknown as Personalization;
          const design = restaurantTestDesign();
          const save = async (revision: number, restaurantDesign: unknown) =>
            (
              await db.query<{ v: PrototypeRow }>(
                "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
                [
                  proto.id,
                  revision,
                  target,
                  JSON.stringify({
                    ...original,
                    confirmedOrigin: "admin_review",
                    restaurantDesign,
                  }),
                ],
              )
            ).rows[0].v;
          const added = await save(proto.revision, design);
          assert.equal(added.slug, proto.slug);
          assert.equal(added.template_id, target);
          assert.deepEqual(
            (added.customization_data as unknown as Personalization)
              .restaurantDesign,
            design,
          );
          const reopened = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [proto.id],
            )
          ).rows[0];
          assert.deepEqual(
            reopened.customization_data,
            added.customization_data,
          );
          await assert.rejects(
            save(proto.revision, design),
            /revision_changed/,
          );
          const second = restaurantTestItem({
            order: 0,
            featured: true,
            price: 0,
          });
          const editedDesign = {
            ...design,
            items: [
              second,
              { ...design.items![0], price: 88, available: false, order: 1 },
            ],
            categories: design.categories!.map((c) => ({ ...c, hidden: true })),
          };
          const edited = await save(added.revision, editedDesign);
          assert.deepEqual(
            (edited.customization_data as unknown as Personalization)
              .restaurantDesign,
            editedDesign,
          );
          const removed = await save(edited.revision, {
            ...editedDesign,
            items: [],
            categories: [],
          });
          assert.deepEqual(
            (removed.customization_data as unknown as Personalization)
              .restaurantDesign?.items,
            [],
          );
          const item = restaurantTestItem();
          for (const invalid of [
            { version: 2 },
            { version: 1, unknown: true },
            { version: 1, items: [{ ...item, price: -1 }] },
            { version: 1, items: [item, item] },
            { version: 1, items: [{ ...item, categoryId: randomUUID() }] },
            { version: 1, items: [{ ...item, available: null }] },
            { version: 1, items: [{ ...item, order: 0.5 }] },
            {
              version: 1,
              items: Array.from({ length: 61 }, () => restaurantTestItem()),
            },
            { version: 1, copy: { heroTitle: "<script>alert(1)</script>" } },
            { version: 1, copy: { heroTitle: "x".repeat(256) } },
            { version: 1, colors: { forest: "red" } },
            {
              version: 1,
              images: {
                hero: { src: "https://evil.test/a.png", demonstration: true },
              },
            },
            {
              version: 1,
              images: {
                hero: {
                  src: "/templates/restaurants/shared/restaurant-dining-room.png",
                  demonstration: false,
                },
              },
            },
            {
              version: 1,
              items: [
                {
                  ...item,
                  image: {
                    src: "/templates/restaurants/shared/restaurant-dish-closeup.png",
                    demonstration: true,
                  },
                },
              ],
            },
            { version: 1, sections: ["menu", "menu"] },
            { version: 1, menuLimit: 25 },
          ]) {
            assert.equal(
              restaurantDesignSchema.safeParse(invalid).success,
              false,
            );
            await assert.rejects(
              db.query("select private.validate_restaurant_design($1::jsonb)", [
                JSON.stringify(invalid),
              ]),
            );
          }
          await db.query(
            "select private.validate_restaurant_design($1::jsonb)",
            [JSON.stringify({ version: 1 })],
          );
          await assert.rejects(
            db.query(
              "select private.validate_personalization($1::jsonb,'imobiliarias')",
              [JSON.stringify({ ...original, restaurantDesign: design })],
            ),
            /incompatible_restaurant_niche/,
          );
          try {
            await db.query(
              "select set_config('request.jwt.claim.sub',$1,false)",
              [member],
            );
            assert.equal(
              (
                await db.query("select id from public.prototypes where id=$1", [
                  proto.id,
                ])
              ).rows.length,
              0,
            );
            await assert.rejects(save(removed.revision, design));
          } finally {
            await db.query(
              "select set_config('request.jwt.claim.sub',$1,false)",
              [admin],
            );
          }
        },
      );
      await t.test(
        "Restaurantes B: configuração digital, catálogo único, persistência e RLS",
        async () => {
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where niche='restaurantes' and status='draft' limit 1",
            )
          ).rows[0];
          const target = (
            await db.query<{ id: string }>(
              "select id from public.templates where slug='restaurantes-b'",
            )
          ).rows[0].id;
          const original =
            proto.customization_data as unknown as Personalization;
          const design = restaurantTestDesign(),
            categoryId = design.categories![0].id;
          design.digital = {
            version: 1,
            maxQuantity: 9,
            showSubtotal: false,
            colors: { orange: "#FA6B35" },
            copy: {
              whatsappIntroduction: "Mensagem configurada",
              whatsappConfirmation: "Consulte os valores",
            },
            categoryIcons: [{ categoryId, icon: "pizza" }],
            bannerCategoryId: categoryId,
            images: { hero: { src: null, demonstration: true } },
            sections: ["menu", "banner", "steps", "about", "contact"],
          };
          const save = async (revision: number, cfg: unknown) =>
            (
              await db.query<{ v: PrototypeRow }>(
                "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
                [
                  proto.id,
                  revision,
                  target,
                  JSON.stringify({
                    ...original,
                    confirmedOrigin: "admin_review",
                    restaurantDesign: cfg,
                  }),
                ],
              )
            ).rows[0].v;
          const saved = await save(proto.revision, design);
          assert.equal(saved.slug, proto.slug);
          assert.equal(saved.template_id, target);
          const reopened = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [proto.id],
            )
          ).rows[0];
          const persisted = (
            reopened.customization_data as unknown as Personalization
          ).restaurantDesign;
          assert.deepEqual(persisted, design);
          assert.deepEqual(persisted?.items, design.items);
          assert.deepEqual(persisted?.copy, design.copy);
          await assert.rejects(
            save(proto.revision, design),
            /revision_changed/,
          );
          for (const digital of [
            { version: 2 },
            { version: 1, unknown: true },
            { version: 1, maxQuantity: 0 },
            { version: 1, maxQuantity: 100 },
            { version: 1, maxQuantity: 2.5 },
            { version: 1, showSubtotal: null },
            { version: 1, copy: { whatsappIntroduction: "x".repeat(501) } },
            { version: 1, copy: { heroTitle: "<script>" } },
            { version: 1, brandIcon: "unknown" },
            { version: 1, colors: { orange: "red" } },
            { version: 1, bannerCategoryId: randomUUID() },
            {
              version: 1,
              categoryIcons: [{ categoryId: randomUUID(), icon: "pizza" }],
            },
            { version: 1, sections: ["menu", "menu"] },
            {
              version: 1,
              images: {
                hero: { src: "https://evil.test/a.png", demonstration: true },
              },
            },
            {
              version: 1,
              benefits: Array(5).fill({ title: "x", description: "y" }),
            },
          ]) {
            assert.equal(
              restaurantDesignSchema.safeParse({ ...design, digital }).success,
              false,
            );
            await assert.rejects(
              db.query("select private.validate_restaurant_design($1::jsonb)", [
                JSON.stringify({ ...design, digital }),
              ]),
            );
          }
          await db.query(
            "select private.validate_restaurant_design($1::jsonb)",
            [JSON.stringify({ version: 1 })],
          );
          try {
            await db.query(
              "select set_config('request.jwt.claim.sub',$1,false)",
              [member],
            );
            assert.equal(
              (
                await db.query("select id from public.prototypes where id=$1", [
                  proto.id,
                ])
              ).rows.length,
              0,
            );
            await assert.rejects(save(saved.revision, design));
          } finally {
            await db.query(
              "select set_config('request.jwt.claim.sub',$1,false)",
              [admin],
            );
          }
        },
      );
      await t.test(
        "Imobiliárias B: apresentação pessoal, catálogo compartilhado e persistência",
        async () => {
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where niche='imobiliarias' limit 1",
            )
          ).rows[0];
          const target = (
            await db.query<{ id: string }>(
              "select id from public.templates where slug='imobiliarias-b'",
            )
          ).rows[0].id;
          const original =
            proto.customization_data as unknown as Personalization;
          const design = {
            version: 1,
            personal: {
              version: 1,
              name: "Nome confirmado",
              heroHighlight: "Novo capítulo",
              portraits: {
                hero: {
                  src: "/templates/real-estate/portraits/autorizada.webp",
                  alt: "Retrato autorizado",
                  position: "top",
                  demonstration: false,
                },
              },
              benefits: [{ title: "Conversa", description: "Texto editável" }],
            },
            properties: original.realEstateDesign?.properties ?? [],
          };
          const saved = (
            await db.query<{ v: PrototypeRow }>(
              "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
              [
                proto.id,
                proto.revision,
                target,
                JSON.stringify({
                  ...original,
                  confirmedOrigin: "admin_review",
                  realEstateDesign: design,
                }),
              ],
            )
          ).rows[0].v;
          assert.deepEqual(
            (saved.customization_data as unknown as Personalization)
              .realEstateDesign,
            design,
          );
          assert.equal(saved.slug, proto.slug);
          assert.equal(saved.template_id, target);
          const reopened = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [proto.id],
            )
          ).rows[0];
          assert.deepEqual(
            reopened.customization_data,
            saved.customization_data,
          );
          for (const personal of [
            { version: 2 },
            { version: 1, unknown: true },
            { version: 1, portraits: { hero: { src: null } } },
            {
              version: 1,
              portraits: {
                hero: { src: "https://evil.test/a.png", demonstration: true },
              },
            },
            {
              version: 1,
              benefits: Array(4).fill({ title: "a", description: "b" }),
            },
            { version: 1, name: "x".repeat(256) },
          ])
            await assert.rejects(
              db.query(
                "select private.validate_real_estate_design($1::jsonb)",
                [JSON.stringify({ version: 1, personal })],
              ),
            );
        },
      );
      await t.test(
        "Advocacia B: JSONB, revisão e validação independente",
        async () => {
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where niche='advocacia' limit 1",
            )
          ).rows[0];
          const target = (
            await db.query<{ id: string }>(
              "select id from public.templates where slug='advocacia-b'",
            )
          ).rows[0].id;
          const original =
            proto.customization_data as unknown as Personalization;
          const design = {
            version: 1,
            manifestoTitle: "Contexto aprovado",
            colors: { white: "#FFFFFF", line: "#E8EBED" },
            images: {
              hero: {
                src: "/templates/law/modern/hero-office.png",
                alt: "Ambiente conceitual",
                illustrative: true,
              },
            },
            team: [
              {
                name: "Nome autorizado",
                authorized: true,
                profileUrl: "https://example.test/perfil",
              },
            ],
            sections: [
              "manifesto",
              "areas",
              "about",
              "team",
              "conversion",
              "contact",
            ],
          };
          const payload = {
            ...original,
            confirmedOrigin: "admin_review",
            lawModernDesign: design,
          };
          const updated = (
            await db.query<{ v: PrototypeRow }>(
              "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
              [proto.id, proto.revision, target, JSON.stringify(payload)],
            )
          ).rows[0].v;
          const reopened = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [proto.id],
            )
          ).rows[0];
          assert.deepEqual(
            (reopened.customization_data as unknown as Personalization)
              .lawModernDesign,
            design,
          );
          assert.deepEqual(
            (reopened.customization_data as unknown as Personalization)
              .confirmed,
            original.confirmed,
          );
          assert.equal(updated.slug, proto.slug);
          assert.equal(updated.revision, proto.revision + 1);
          await assert.rejects(
            db.query("select public.edit_prototype($1,$2,$3,$4::jsonb)", [
              proto.id,
              proto.revision,
              target,
              JSON.stringify(payload),
            ]),
            /revision_changed/,
          );
          for (const invalid of [
            { version: 99 },
            { version: 1, colors: { white: "red" } },
            { version: 1, sections: ["about", "about"] },
            {
              version: 1,
              areaDetails: { Civil: { href: "javascript:alert(1)" } },
            },
            {
              version: 1,
              images: {
                hero: { src: "/templates/law/shared/law-office-reception.png" },
              },
            },
            {
              version: 1,
              images: {
                hero: {
                  src: "/templates/law/modern/hero-office.png",
                  illustrative: false,
                },
              },
            },
            { version: 1, team: [{ name: "Fake", authorized: false }] },
          ])
            await assert.rejects(
              db.query("select private.validate_law_modern_design($1::jsonb)", [
                JSON.stringify(invalid),
              ]),
            );
        },
      );
      await t.test(
        "Advocacia A: extensão, edição, releitura e validação mantêm RLS e revisão",
        async () => {
          const proto = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where niche='advocacia' limit 1",
            )
          ).rows[0];
          assert.ok(proto);
          const target = (
            await db.query<{ id: string }>(
              "select id from public.templates where slug='advocacia-a'",
            )
          ).rows[0].id;
          const original =
            proto.customization_data as unknown as Personalization;
          const lawDesign = {
            version: 1,
            leadType: "solo",
            monogram: "LC",
            colors: { primary: "#17191B", accent: "#B59A65" },
            email: "juridico@example.test",
            linkedin: "https://www.linkedin.com/company/exemplo",
            heroTitle: "Título jurídico aprovado",
            areaDetails: {
              "Área confirmada de teste": {
                description: "Descrição aprovada",
                icon: "scale",
              },
            },
            images: {
              hero: {
                src: "/templates/law/shared/law-office-reception.png",
                position: "right",
                illustrative: true,
              },
            },
            team: [
              {
                name: "Profissional autorizado de teste",
                role: "Cargo confirmado",
                authorized: true,
              },
            ],
            sections: ["about", "areas", "editorial", "team", "contact"],
          };
          const payload = {
            ...original,
            lawDesign,
            confirmedOrigin: "admin_review",
          };
          const updated = (
            await db.query<{ v: PrototypeRow }>(
              "select public.edit_prototype($1,$2,$3,$4::jsonb) v",
              [proto.id, proto.revision, target, JSON.stringify(payload)],
            )
          ).rows[0].v;
          assert.equal(updated.revision, proto.revision + 1);
          assert.equal(updated.slug, proto.slug);
          const reopened = (
            await db.query<PrototypeRow>(
              "select * from public.prototypes where id=$1",
              [proto.id],
            )
          ).rows[0];
          const data =
            reopened.customization_data as unknown as Personalization;
          assert.deepEqual(data.lawDesign, lawDesign);
          assert.deepEqual(data.confirmed, original.confirmed);
          assert.equal(data.sourceLeadId, original.sourceLeadId);
          await assert.rejects(
            db.query("select public.edit_prototype($1,$2,$3,$4::jsonb)", [
              proto.id,
              proto.revision,
              target,
              JSON.stringify(payload),
            ]),
            /revision_changed/,
          );
          for (const invalid of [
            { version: 99 },
            { version: 1, colors: { accent: "red" } },
            { version: 1, email: "bad" },
            { version: 1, linkedin: "https://linkedin.com.evil.test/x" },
            { version: 1, sections: ["about", "about"] },
            { version: 1, team: [{ name: "Unapproved", authorized: false }] },
            {
              version: 1,
              team: [
                {
                  name: "Unsafe photo",
                  authorized: true,
                  photo: "/templates/law/shared/law-client-consultation.png",
                  photoAuthorized: true,
                },
              ],
            },
            {
              version: 1,
              images: {
                hero: {
                  src: "/templates/law/shared/law-office-reception.png",
                  illustrative: false,
                },
              },
            },
            {
              version: 1,
              images: { hero: { src: "/templates/law/../private.png" } },
            },
          ])
            await assert.rejects(
              db.query("select private.validate_law_design($1::jsonb)", [
                JSON.stringify(invalid),
              ]),
              /invalid_law|illustrative_law/,
            );
          await assert.rejects(
            db.query(
              "select private.validate_personalization($1::jsonb,'clinicas')",
              [JSON.stringify(payload)],
            ),
            /incompatible_law_design_niche/,
          );
        },
      );
      await t.test(
        "listagem real, filtros, seleção integral e contadores de rascunhos",
        async () => {
          const listed = (
            await db.query<{ v: PrototypePage }>(
              "select public.list_prototype_workspace('','clinicas','draft',null,0) v",
            )
          ).rows[0].v;
          assert.ok(listed.total > 0);
          assert.ok(
            listed.items.every(
              (p) => p.niche === "clinicas" && p.status === "draft",
            ),
          );
          const pending = await lead("Selecionar elegível", "restaurantes");
          const page = (
            await db.query<{ v: GenerationLeadPage }>(
              "select public.list_generation_leads('Selecionar elegivel','restaurantes',0) v",
            )
          ).rows[0].v;
          assert.equal(page.total, 1);
          assert.equal(page.items[0].id, pending.id);
          assert.equal(page.eligible, 1);
          const selected = (
            await db.query<{ v: string[] }>(
              "select public.select_generation_leads('Selecionar elegivel','restaurantes') v",
            )
          ).rows[0].v;
          assert.deepEqual(selected, [pending.id]);
          assert.equal(
            (
              await db.query<{ n: number }>(
                "select count(*)::integer n from public.prototypes where status='draft'",
              )
            ).rows[0].n,
            await count(),
          );
          assert.equal((await count("leads")) > (await count()), true);
        },
      );
      await t.test(
        "slugs removem acentos e seleção integral não trunca lotes acima do limite",
        async () => {
          const entropy = "33333333-3333-4333-8333-333333333333";
          const slug = (
            await db.query<{ v: string }>(
              "select private.prototype_slug($1,$2::uuid) v",
              ["Clínica São João / Fictícia", entropy],
            )
          ).rows[0].v;
          assert.equal(
            slug,
            "clinica-sao-joao-ficticia-" + entropy.replaceAll("-", ""),
          );
          const ids: string[] = [];
          for (let i = 0; i < 26; i++)
            ids.push((await lead(`Limite Fictício ${i}`)).id);
          assert.equal((await plan(ids)).eligible, 26);
          const all = (
            await db.query<{ v: string[] }>(
              "select public.select_generation_leads('Limite Ficticio','') v",
            )
          ).rows[0].v;
          assert.equal(all.length, 26);
          await assert.rejects(
            generate({
              requestId: randomUUID(),
              leadIds: ids,
              mode: "auto",
              expectedPlan: "a".repeat(32),
              customizations: [],
            }),
            /generation_limit/,
          );
          let run = startGenerationRun(await plan(ids), "auto");
          const expected = run.plan.items;
          while (run.remaining.length) {
            const step = await nextGenerationBatch(run, {
              newId: () => randomUUID(),
              onPending: () => {},
              preview: async (ids, mode) => ({
                ok: true,
                data: await plan(ids, mode),
              }),
              commit: async (request) => ({
                ok: true,
                data: await generate({
                  ...(await payload(request.leadIds, request.mode)),
                  ...request,
                }),
              }),
            });
            assert.equal(step.ok, true);
            run = step.run;
          }
          assert.equal(summarizeRun(run)?.created, 26);
          for (const result of run.results.flatMap((r) => r.prototypes))
            assert.equal(
              result.variant,
              expected.find((i) => i.leadId === result.leadId)?.variant,
            );
        },
      );
      await t.test(
        "mesmo identificador em chamadas sobrepostas devolve um recibo único",
        async () => {
          const row = await lead("Replay simultâneo");
          const request = await payload([row.id]);
          const before = await count();
          const [a, b] = await Promise.all([
            generate(request),
            generate(request),
          ]);
          assert.deepEqual(a, b);
          assert.equal(await count(), before + 1);
        },
      );
      await t.test(
        "prévia e seleção integral de 500; excesso rejeitado sem truncamento",
        async () => {
          const ids = (
            await db.query<{ id: string }>(
              "insert into public.leads(name,niche) select 'Limite Amplo '||i,'imobiliarias' from generate_series(1,500) i returning id",
            )
          ).rows.map((r) => r.id);
          const reviewed = await plan(ids);
          assert.equal(reviewed.selected, 500);
          assert.equal(reviewed.eligible, 500);
          assert.equal(reviewed.items.length, 500);
          const all = (
            await db.query<{ v: string[] }>(
              "select public.select_generation_leads('Limite Amplo','imobiliarias') v",
            )
          ).rows[0].v;
          assert.equal(all.length, 500);
          await lead("Limite Amplo 501", "imobiliarias");
          await assert.rejects(
            db.query(
              "select public.select_generation_leads('Limite Amplo','imobiliarias')",
            ),
            /narrow_selection_to_500/,
          );
          await assert.rejects(
            plan([...ids, randomUUID()]),
            /invalid_generation_selection/,
          );
        },
      );
      await t.test(
        "não autorizado: RLS e todas as RPCs negam dados e mutações",
        async () => {
          await db.exec(
            `select set_config('request.jwt.claim.sub','${member}',false)`,
          );
          assert.equal(await count(), 0);
          assert.equal(await count("prototype_generation_requests"), 0);
          await assert.rejects(plan(firstRequest!.leadIds), /admin_required/);
          await assert.rejects(generate(firstRequest!), /admin_required/);
          await assert.rejects(
            db.query("select public.list_generation_leads('','',0)"),
            /admin_required/,
          );
          await assert.rejects(
            db.query("select public.list_prototype_workspace('','','',null,0)"),
            /admin_required/,
          );
          await db.exec(
            "reset role;set role anon;select set_config('request.jwt.claim.sub','',false)",
          );
          await assert.rejects(
            db.query("select * from public.prototypes"),
            /permission denied/,
          );
          await assert.rejects(generate(firstRequest!), /permission denied/);
        },
      );
    } finally {
      await db.close();
    }
  },
);
