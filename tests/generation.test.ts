import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { LeadRow } from "../src/types/database";
import {
  buildPersonalization,
  demonstrationContent,
} from "../src/lib/generation/personalize";
import {
  personalizationSchema,
  generationSelectionSchema,
  prototypeEditSchema,
  type GenerationPlan,
} from "../src/lib/generation/contracts";
import {
  commitGeneration,
  previewGeneration,
  editPrototype,
  type GenerationPort,
  GenerationError,
} from "../src/lib/generation/service";
import { rendererRegistry } from "../src/lib/generation/registry";
function lead(): LeadRow {
  return {
    id: randomUUID(),
    import_id: null,
    name: "Clínica Fictícia",
    niche: "clinicas",
    specialty: null,
    google_category: null,
    phone: null,
    whatsapp: null,
    address: null,
    city: null,
    state: null,
    website: null,
    instagram: null,
    description: null,
    services: [],
    source: null,
    external_reference: null,
    segment: null,
    google_maps_url: null,
    duplicate_reason: null,
    identity_keys: [],
    created_at: "2026-10-28T12:00:00.000000+00:00",
    updated_at: "2026-10-28T12:00:00.123456+00:00",
  };
}
test("personalização: snapshot exato, ausências explícitas e conteúdo demonstrativo separado", () => {
  const source = lead();
  const data = buildPersonalization(source);
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.confirmed.name, source.name);
  assert.equal(data.sourceUpdatedAt, source.updated_at);
  assert.equal(data.confirmedOrigin, "lead_snapshot");
  assert.equal(data.confirmed.phone, null);
  assert.deepEqual(data.confirmed.services, []);
  assert.ok(data.missingFields.includes("phone"));
  assert.ok(data.missingFields.includes("services"));
  assert.equal(data.illustrative.label, "Conteúdo de demonstração");
  for (const niche of [
    "clinicas",
    "advocacia",
    "imobiliarias",
    "restaurantes",
  ] as const) {
    const result = buildPersonalization({ ...source, niche });
    assert.equal(result.confirmed.niche, niche);
    assert.deepEqual(result.illustrative, demonstrationContent[niche]);
    assert.doesNotMatch(
      JSON.stringify(result),
      /"(testimonials|reviews|rating|professionals|prices|openingHours|certifications)"/,
    );
  }
  const full = buildPersonalization({
    ...source,
    specialty: "Psicologia",
    city: "Cidade Exemplo",
    phone: "001234567",
    services: [" Serviço confirmado "],
  });
  assert.equal(full.confirmed.phone, "001234567");
  assert.deepEqual(full.confirmed.services, ["Serviço confirmado"]);
  assert.ok(!full.missingFields.includes("phone"));
});
test("contratos rejeitam URLs executáveis, estrutura livre, ausências inconsistentes e lotes grandes", () => {
  const data = buildPersonalization(lead());
  assert.equal(
    personalizationSchema.safeParse({
      ...data,
      confirmed: { ...data.confirmed, phone: "telefone inválido" },
    }).success,
    false,
  );
  assert.equal(
    personalizationSchema.safeParse({
      ...data,
      confirmed: { ...data.confirmed, website: "javascript:alert(1)" },
    }).success,
    false,
  );
  assert.equal(
    personalizationSchema.safeParse({ ...data, missingFields: [] }).success,
    false,
  );
  assert.equal(
    personalizationSchema.safeParse({
      ...data,
      illustrative: { ...data.illustrative, label: "Avaliações reais" },
    }).success,
    false,
  );
  assert.equal(
    personalizationSchema.safeParse({ ...data, unexpected: "field" }).success,
    false,
  );
  assert.equal(
    generationSelectionSchema.safeParse({
      leadIds: Array.from({ length: 26 }, () => randomUUID()),
      mode: "auto",
    }).success,
    false,
  );
  assert.equal(
    generationSelectionSchema.safeParse({
      leadIds: [data.sourceLeadId, data.sourceLeadId],
      mode: "auto",
    }).success,
    false,
  );
  assert.equal(
    prototypeEditSchema.safeParse({
      id: randomUUID(),
      expectedRevision: 1,
      templateId: randomUUID(),
      personalization: data,
      slug: "troca-invalida",
    }).success,
    false,
  );
  assert.equal(Object.keys(rendererRegistry).length, 8);
  assert.ok(
    Object.values(rendererRegistry).every((r) =>
      r.niche === "clinicas" ||
      r.niche === "advocacia" ||
      r.niche === "imobiliarias" ||
      r.niche === "restaurantes"
        ? typeof r.renderer === "function"
        : r.renderer === null,
    ),
  );
});
test("servidor: autenticação/autorização antecede qualquer leitura ou mutação", async () => {
  let calls = 0;
  const source = lead();
  const port: GenerationPort = {
    authorize: async () => {
      throw new Error("forbidden");
    },
    plan: async () => {
      calls++;
      return {};
    },
    leads: async () => {
      calls++;
      return [source];
    },
    replayExists: async () => {
      calls++;
      return false;
    },
    generate: async () => {
      calls++;
      return {};
    },
    edit: async () => {
      calls++;
    },
  };
  assert.equal(
    (await previewGeneration({ leadIds: [source.id], mode: "auto" }, port)).ok,
    false,
  );
  assert.equal(
    (
      await commitGeneration(
        {
          leadIds: [source.id],
          mode: "auto",
          requestId: randomUUID(),
          expectedPlan: "a".repeat(32),
        },
        port,
      )
    ).ok,
    false,
  );
  assert.equal((await editPrototype({}, port)).ok, false);
  assert.equal(calls, 0);
  port.authorize = async () => {};
  assert.equal(
    (await previewGeneration({ leadIds: ["invalid"], mode: "auto" }, port)).ok,
    false,
  );
  assert.equal(calls, 0);
});
test("servidor: geração constrói dados no servidor e replay não depende de lead ainda existente", async () => {
  const source = lead(),
    templateId = randomUUID(),
    prototypeId = randomUUID(),
    requestId = randomUUID();
  const plan: GenerationPlan = {
    selected: 1,
    eligible: 1,
    ignored: 0,
    blocked: 0,
    fingerprint: "a".repeat(32),
    items: [
      {
        leadId: source.id,
        name: source.name,
        niche: source.niche,
        leadUpdatedAt: source.updated_at,
        templateId,
        variant: "A",
        status: "eligible",
        reason: null,
      },
    ],
  };
  let replay = false,
    reads = 0;
  const result = {
    requestId,
    created: 1,
    ignored: 0,
    prototypes: [
      {
        id: prototypeId,
        leadId: source.id,
        templateId,
        variant: "A",
        niche: source.niche,
        slug: "clinica-ficticia-abcdef",
      },
    ],
  };
  const port: GenerationPort = {
    authorize: async () => {},
    plan: async () => plan,
    replayExists: async () => replay,
    leads: async () => {
      reads++;
      return [source];
    },
    generate: async (_, data) => {
      if (!replay) assert.deepEqual(data[0].data, buildPersonalization(source));
      else assert.deepEqual(data, []);
      return result;
    },
    edit: async () => {},
  };
  const request = {
    requestId,
    leadIds: [source.id],
    mode: "auto",
    expectedPlan: plan.fingerprint,
  };
  assert.equal((await commitGeneration(request, port)).ok, true);
  assert.equal(reads, 1);
  replay = true;
  assert.equal((await commitGeneration(request, port)).ok, true);
  assert.equal(reads, 1);
  replay = false;
  assert.equal(
    (await commitGeneration({ ...request, expectedPlan: "b".repeat(32) }, port))
      .ok,
    false,
  );
  port.generate = async () => {
    throw new GenerationError("40001");
  };
  const stale = await commitGeneration(request, port);
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.stale, true);
  let lookup = 0;
  port.replayExists = async () => ++lookup >= 2;
  port.plan = async () => ({ ...plan, fingerprint: "b".repeat(32) });
  port.generate = async (_, data) => {
    assert.deepEqual(data, []);
    return result;
  };
  assert.equal((await commitGeneration(request, port)).ok, true);
});
