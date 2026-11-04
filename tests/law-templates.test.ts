import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import {
  renderPersistedTemplate,
  templateRenderers,
} from "../src/templates/registry";
import { lawModel, lawMonogram } from "../src/templates/law/classic/model";
import {
  lawPhotos,
  isBrandedReception,
} from "../src/templates/law/classic/photography";
import { rendererRegistry } from "../src/lib/generation/registry";
import { demonstrationContent } from "../src/lib/generation/personalize";
import {
  personalizationSchema,
  type Personalization,
} from "../src/lib/generation/contracts";
import {
  loadPrivatePreview,
  type PreviewPort,
} from "../src/lib/prototype-preview";
import type { PrototypeRow, TemplateRow } from "../src/types/database";
const template = {
  slug: "advocacia-a",
  niche: "advocacia" as const,
  variant: "A" as const,
};
function fixture(
  values: Partial<Personalization["confirmed"]> = {},
): Personalization {
  const confirmed: Personalization["confirmed"] = {
    name: "Lima & Costa · escritório de teste",
    niche: "advocacia",
    specialty: null,
    city: null,
    state: null,
    address: null,
    phone: null,
    whatsapp: null,
    website: null,
    instagram: null,
    description: null,
    services: [],
    ...values,
  };
  return {
    schemaVersion: 1,
    sourceLeadId: randomUUID(),
    sourceUpdatedAt: "2026-11-03T12:00:00Z",
    confirmedOrigin: "lead_snapshot",
    confirmed,
    illustrative: demonstrationContent.advocacia,
    missingFields: Object.entries(confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k) as Personalization["missingFields"],
  };
}
const render = (data = fixture()) =>
  renderToStaticMarkup(renderPersistedTemplate(template, data));

test("Advocacia A: composição fotográfica completa, sem informações inventadas", () => {
  const html = render();
  for (const file of [
    "law-office-reception",
    "law-meeting-room",
    "law-legal-details",
    "law-client-consultation",
  ])
    assert.ok(html.includes(file));
  assert.match(html, /data-template="advocacia-a"/);
  assert.match(html, /Monograma tipográfico demonstrativo/);
  assert.match(html, /Imagem ilustrativa/);
  assert.match(html, /Protótipo demonstrativo desenvolvido pela Loung Tech/);
  assert.doesNotMatch(
    html,
    /id="equipe"|Nossa Equipe|id="atuacao"|Direito Civil|Almeida|Vasconcelos|Tradição|garantia|vitória|ranking|<form/i,
  );
  assert.match(html, /canais de contato serão apresentados após confirmação/);
  const indexes = ["escritorio", "contato", "informacoes"].map((id) =>
    html.indexOf(`id="${id}"`),
  );
  assert.ok(
    indexes[0] > 0 && indexes[1] > indexes[0] && indexes[2] > indexes[1],
  );
  for (const p of Object.values(lawPhotos))
    assert.ok(existsSync(`public${p.src}`));
});

test("Advocacia A: identidade, cores, tipografia, textos e imagens personalizáveis", () => {
  const data = fixture({ description: "Descrição institucional confirmada" });
  data.lawDesign = {
    version: 1,
    monogram: "LX",
    professionalLabel: "Identificação aprovada",
    typeface: "traditional",
    colors: {
      primary: "#202124",
      secondary: "#343537",
      paper: "#fffaf0",
      accent: "#b4985a",
      text: "#242424",
      muted: "#666666",
    },
    heroTitle: "Título jurídico aprovado",
    aboutTitle: "Institucional aprovado",
    editorialTitle: "Editorial aprovado",
    contactTitle: "Contato aprovado",
    heroPrimaryCta: "Conheça a apresentação",
    images: {
      hero: {
        src: "/templates/law/shared/law-meeting-room.png",
        position: "left",
        caption: "Imagem escolhida",
        illustrative: true,
      },
    },
  };
  const html = render(data);
  for (const text of [
    "LX",
    "Identificação aprovada",
    "Título jurídico aprovado",
    "Institucional aprovado",
    "Editorial aprovado",
    "Contato aprovado",
    "Descrição institucional confirmada",
    "Imagem escolhida",
  ])
    assert.ok(html.includes(text), text);
  assert.match(html, /--law-primary:#202124/);
  assert.match(html, /--law-accent:#b4985a/);
  assert.match(html, /data-typeface="traditional"/);
  assert.match(html, /object-position:left/);
  assert.equal(lawMonogram("Ana de Souza Advogados"), "AS");
  assert.equal(lawMonogram("Lima & Costa"), "LC");
});

test("Advocacia A: áreas confirmadas, ordem, seis cards iniciais e ocultação individual", () => {
  const names = Array.from({ length: 8 }, (_, i) => `Área confirmada ${i + 1}`);
  const data = fixture({ services: names });
  data.lawDesign = {
    version: 1,
    areaDetails: {
      [names[0]]: { hidden: true },
      [names[1]]: {
        description: "Descrição aprovada de área",
        icon: "building",
      },
    },
  };
  const html = render(data);
  assert.doesNotMatch(html, /Área confirmada 1/);
  assert.match(html, /Descrição aprovada de área/);
  assert.match(html, /Outras áreas de atuação/);
  const first = html.split('<details class="lawMore">')[0];
  assert.equal((first.match(/<article/g) ?? []).length, 6);
  assert.ok(html.indexOf(names[1]) < html.indexOf(names[2]));
  data.lawDesign.sections = ["contact", "about"];
  const hidden = render(data);
  assert.doesNotMatch(hidden, /id="atuacao"/);
  assert.ok(hidden.indexOf('id="contato"') < hidden.indexOf('id="escritorio"'));
});

test("Advocacia A: equipe real autorizada, registro opcional e linguagem autônoma", () => {
  const data = fixture();
  data.lawDesign = {
    version: 1,
    leadType: "solo",
    team: [
      {
        name: "Pessoa autorizada de teste",
        role: "Cargo informado",
        area: "Área informada",
        registration: "Registro fornecido pelo administrador",
        authorized: true,
      },
    ],
  };
  const html = render(data);
  assert.match(html, /id="equipe"/);
  assert.match(html, /Pessoa autorizada de teste/);
  assert.match(html, /Registro fornecido pelo administrador/);
  assert.match(html, /Perfil profissional/);
  assert.doesNotMatch(html, /Nossa Equipe|Tradição|Almeida/);
  data.lawDesign.team = [];
  assert.doesNotMatch(render(data), /id="equipe"|Perfil profissional/);
  for (const member of [
    { name: "Sem autorização", authorized: false },
    {
      name: "Foto compartilhada",
      authorized: true,
      photo: "/templates/law/shared/law-client-consultation.png",
      photoAuthorized: true,
    },
    {
      name: "Sem consentimento de foto",
      authorized: true,
      photo: "/templates/law/team/pessoa.webp",
    },
  ])
    assert.throws(() =>
      render({
        ...data,
        lawDesign: { version: 1, team: [member] },
      } as unknown as Personalization),
    );
  data.lawDesign.team = [
    {
      name: "Pessoa autorizada de teste",
      authorized: true,
      photo: "/templates/law/team/pessoa.webp",
      photoAuthorized: true,
    },
  ];
  assert.match(render(data), /team%2Fpessoa.webp/);
});

test("Advocacia A: recorte seguro obrigatório protege a marca fictícia inclusive em slots alterados", () => {
  const data = fixture();
  data.lawDesign = {
    version: 1,
    images: {
      hero: {
        src: "/templates/law/shared/LAW-OFFICE-RECEPTION.png",
        position: "left",
        illustrative: true,
      },
      contact: {
        src: "/templates/law/shared/law-office-reception.png",
        position: "center",
        illustrative: true,
      },
    },
  };
  const html = render(data);
  assert.equal((html.match(/data-safe-crop="true"/g) ?? []).length, 2);
  assert.match(
    html,
    /width:250%;max-width:none;height:100%;position:absolute;right:0/,
  );
  assert.doesNotMatch(html, /object-position:left/);
  assert.ok(
    isBrandedReception("/templates/law/shared/LAW-OFFICE-RECEPTION.png"),
  );
  assert.equal(
    personalizationSchema.safeParse({
      ...data,
      lawDesign: {
        version: 1,
        images: {
          hero: { src: "/templates/law/shared//law-office-reception.png" },
        },
      },
    }).success,
    false,
  );
  assert.equal(
    personalizationSchema.safeParse({
      ...data,
      lawDesign: {
        version: 1,
        images: {
          hero: {
            src: "/templates/law/SHARED/law-office-reception.png",
            illustrative: false,
          },
        },
      },
    }).success,
    false,
  );
});

test("Advocacia A: contato confirmado, LinkedIn seguro e dados ausentes", () => {
  const data = fixture({
    phone: "+551130000000",
    whatsapp: "+5511999990000",
    instagram: "https://www.instagram.com/exemplo/",
    address: "Endereço confirmado",
    city: "Cidade",
    state: "SP",
  });
  data.lawDesign = {
    version: 1,
    email: "juridico@example.test",
    linkedin: "https://www.linkedin.com/company/exemplo",
  };
  const html = render(data);
  for (const expected of [
    /tel:\+551130000000/,
    /wa.me\/5511999990000/,
    /mailto:juridico@example.test/,
    /linkedin.com\/company\/exemplo/,
    /noopener noreferrer/,
    /Endere%C3%A7o%20confirmado/,
  ])
    assert.match(html, expected);
  for (const invalid of [
    { version: 99 },
    { version: 1, colors: { accent: "red" } },
    { version: 1, linkedin: "https://linkedin.com.evil.test/x" },
    { version: 1, email: "mail@example.test\r\nBcc:x@example.test" },
    { version: 1, images: { hero: { src: "https://example.test/x.png" } } },
    { version: 1, sections: ["about", "about"] },
  ])
    assert.throws(() =>
      render({ ...data, lawDesign: invalid } as unknown as Personalization),
    );
  const absent = render();
  assert.doesNotMatch(
    absent,
    /mailto:|wa.me|href="tel:|linkedin.com|maps\/search/,
  );
});

test("Advocacia A: motor, nicho, registros anteriores e prévia autenticada", async () => {
  const data = fixture();
  assert.ok(templateRenderers["advocacia-a"]);
  assert.equal(typeof rendererRegistry["advocacia:B"].renderer, "function");
  const generated = await rendererRegistry["advocacia:A"].renderer!({
    prototypeId: randomUUID(),
    slug: "reservado",
    personalization: data,
  });
  assert.match(
    renderToStaticMarkup(
      generated as ReturnType<typeof renderPersistedTemplate>,
    ),
    /data-template="advocacia-a"/,
  );
  assert.throws(() =>
    lawModel({ ...data, confirmed: { ...data.confirmed, niche: "clinicas" } }),
  );
  const id = randomUUID();
  let reads = 0;
  const port: PreviewPort = {
    authorize: async () => {
      throw new Error("unauthorized");
    },
    prototype: async () => {
      reads++;
      return {
        id,
        template_id: randomUUID(),
        niche: "advocacia",
        customization_data: data,
      } as unknown as PrototypeRow;
    },
    template: async () => ({ ...template, id: randomUUID() }) as TemplateRow,
  };
  await assert.rejects(loadPrivatePreview(id, port), /unauthorized/);
  assert.equal(reads, 0);
  port.authorize = async () => {};
  const first = await loadPrivatePreview(id, port);
  assert.ok(first);
  assert.match(
    renderToStaticMarkup(
      renderPersistedTemplate(
        first.template,
        first.prototype.customization_data,
      ),
    ),
    /Lima &amp; Costa/,
  );
  data.confirmed.name = "Nome jurídico revisado";
  const second = await loadPrivatePreview(id, port);
  assert.ok(second);
  assert.match(
    renderToStaticMarkup(
      renderPersistedTemplate(
        second.template,
        second.prototype.customization_data,
      ),
    ),
    /Nome jurídico revisado/,
  );
  assert.ok(existsSync("src/app/p/[slug]/page.tsx"));
  assert.match(
    readFileSync("src/services/preview.ts", "utf8"),
    /authorize: requireAdminPage/,
  );
});
