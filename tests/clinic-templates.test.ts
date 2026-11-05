import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import {
  clinicModel,
  telephoneLink,
  whatsappLink,
} from "../src/templates/clinics/shared/adapter";
import {
  specialties,
  resolveSpecialty,
} from "../src/templates/clinics/shared/specialties";
import { renderPersistedTemplate } from "../src/templates/registry";
import { createElement } from "react";
import { PremiumClinic } from "../src/templates/clinics/premium";
import { premiumContent } from "../src/templates/clinics/premium/content";
import { premiumPhotography } from "../src/templates/clinics/premium/photography";
import {
  clinicPhotos,
  clinicDefaultPhoto,
} from "../src/templates/clinics/shared/default-photography";
import { clinicPhotoSource } from "../src/templates/clinics/shared/photo-recovery";
import { publicSnapshot, publicRendererInput } from "../src/lib/publication";
import {
  loadPrivatePreview,
  type PreviewPort,
} from "../src/lib/prototype-preview";
import type { Personalization } from "../src/lib/generation/contracts";
import type { PrototypeRow, TemplateRow } from "../src/types/database";

function fixture(
  values: Partial<Personalization["confirmed"]> = {},
): Personalization {
  const confirmed: Personalization["confirmed"] = {
    name: "Clínica Horizonte Fictícia",
    niche: "clinicas",
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
    sourceUpdatedAt: "2026-10-28T12:00:00Z",
    confirmedOrigin: "lead_snapshot",
    confirmed,
    illustrative: {
      label: "Conteúdo de demonstração",
      headline: "Apresentação ilustrativa",
      introduction: "Texto demonstrativo de teste.",
      plannedSections: ["Apresentação"],
    },
    missingFields: Object.entries(confirmed)
      .filter(
        ([, value]) =>
          value === null || (Array.isArray(value) && !value.length),
      )
      .map(([key]) => key) as Personalization["missingFields"],
  };
}
const template = (variant: "A" | "B") => ({
  slug: `clinicas-${variant.toLowerCase()}`,
  niche: "clinicas" as const,
  variant,
});
const render = (variant: "A" | "B", data = fixture()) =>
  renderToStaticMarkup(renderPersistedTemplate(template(variant), data));

test("clinic images: tracked public PNGs have exact names, signatures and dimensions", () => {
  for (const [name, width, height] of [
    ["clinic-reception-hero", 1448, 1086],
    ["clinic-room-structure", 1448, 1086],
    ["doctor-consultation-main", 1122, 1402],
    ["consultation-detail", 1122, 1402],
  ] as const) {
    const bytes = readFileSync(`public/templates/clinics/shared/${name}.png`);
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
  }
});

test("official clinic catalog: every default names a real local PNG and unknown names are rejected", () => {
  assert.equal(clinicPhotos.length, 4);
  for (const photo of clinicPhotos) {
    const asset = clinicDefaultPhoto(photo.name);
    assert.equal(asset.src, `/templates/clinics/shared/${photo.name}.png`);
    const bytes = readFileSync(`public${asset.src}`);
    assert.equal(bytes.readUInt32BE(16), asset.width);
    assert.equal(bytes.readUInt32BE(20), asset.height);
  }
  assert.throws(
    () => clinicDefaultPhoto("invented-photo"),
    /unknown_clinic_photo/,
  );
});

test("clinic images: recovery preserves chosen photos, explicit removal and source changes without loops", () => {
  const chosen = "/templates/clinics/authorized/photo.webp";
  const fallback = premiumPhotography.hero!.src;
  assert.equal(clinicPhotoSource(chosen, fallback, []), chosen);
  assert.equal(clinicPhotoSource(chosen, fallback, [chosen]), fallback);
  assert.equal(clinicPhotoSource(chosen, fallback, [chosen, fallback]), null);
  assert.equal(clinicPhotoSource(null, fallback, []), null);
  assert.equal(clinicPhotoSource("", fallback, []), null);
  assert.equal(clinicPhotoSource(chosen, chosen, [chosen]), null);
  assert.equal(clinicPhotoSource(chosen, null, [chosen]), null);
  assert.equal(
    clinicPhotoSource("/templates/clinics/new.png", fallback, [chosen]),
    "/templates/clinics/new.png",
  );
});

test("clinic images: legacy local paths and overrides survive snapshot and public rendering for both variants", () => {
  for (const variant of ["A", "B"] as const) {
    const data = fixture();
    const chosen = "/templates/clinics/premium/waiting-area.jpg";
    data.clinicDesign = {
      version: 1,
      images: { hero: chosen },
      ...(variant === "B"
        ? {
            appointments: {
              version: 1 as const,
              heroImage: { src: chosen, illustrative: false },
            },
          }
        : {}),
    };
    const original = JSON.stringify(data);
    const snapshot = publicSnapshot(data);
    const publicHtml = render(variant, publicRendererInput(snapshot));
    assert.match(render(variant, data), /waiting-area/);
    assert.match(publicHtml, /waiting-area/);
    assert.equal(JSON.stringify(data), original);
    assert.deepEqual(publicSnapshot(publicRendererInput(snapshot)), snapshot);
    data.clinicDesign.images = { hero: null };
    if (variant === "B")
      data.clinicDesign.appointments!.heroImage = { src: null };
    assert.doesNotMatch(render(variant, data), /waiting-area/);
  }
});

test("templates A/B: páginas completas, identificação conceitual e estruturas distintas", () => {
  const data = fixture({
    description: "Descrição confirmada fictícia",
    services: ["Serviço confirmado de teste"],
    city: "Cidade Fictícia",
    state: "SP",
  });
  const a = render("A", data),
    b = render("B", data);
  for (const html of [a, b]) {
    assert.match(html, /Clínica Horizonte Fictícia/);
    assert.match(html, /Descrição confirmada fictícia/);
    assert.match(html, /Serviço confirmado de teste/);
    assert.match(
      html,
      /(?:Demonstração conceitual|Protótipo demonstrativo) desenvolvid[ao] pela Loung Tech\./,
    );
    assert.match(html, /id="localizacao"/);
    assert.match(html, /aria-label="Navegação principal"/);
    assert.match(html, /width="\d+" height="\d+"/);
    assert.doesNotMatch(
      html,
      /<form|<input|depoimento|certificaç|anos de experiência/i,
    );
  }
  assert.match(a, /class="premiumServices"/);
  assert.doesNotMatch(a, /class="serviceGrid"/);
  assert.match(b, /class="serviceGrid"/);
  assert.match(b, /id="como"/);
  assert.doesNotMatch(a, /id="como"/);
});
test("especialidades: seis configurações e assets locais; nunca inserem serviços típicos", () => {
  const cases = {
    dentistry: "Odontologia",
    aesthetics: "Estética",
    psychology: "Psicologia",
    physiotherapy: "Fisioterapia",
    veterinary: "Veterinária",
    general: "Clínica multidisciplinar",
  };
  for (const [id, name] of Object.entries(cases)) {
    assert.equal(resolveSpecialty(name), id);
    const m = clinicModel(fixture({ specialty: name }));
    assert.equal(m.specialtyId, id);
    assert.equal(m.services.length, 0);
    assert.ok(existsSync(`public${m.image}`));
    for (const variant of ["A", "B"] as const) {
      const html = render(variant, fixture({ specialty: name }));
      for (const photo of clinicPhotos) assert.ok(html.includes(photo.name));
      assert.doesNotMatch(
        html,
        /waiting-area|warm-interior|Fotografia do ambiente em preparação|bPhotoFallback/,
      );
      assert.doesNotMatch(html, /\.svg/);
      assert.ok(html.includes(name));
      assert.doesNotMatch(html, /id="servicos"/);
    }
  }
  assert.equal(Object.keys(specialties).length, 6);
});
test("dados ausentes: não inventa endereço, telefone, serviços ou informações clínicas", () => {
  for (const variant of ["A", "B"] as const) {
    const html = render(variant);
    assert.doesNotMatch(
      html,
      /id="servicos"|id="localizacao"|href="tel:|wa.me|maps\/search/,
    );
    assert.match(html, /Conteúdo de demonstração/);
    assert.match(html, /canais de contato serão apresentados após confirmação/);
  }
});

test("production regression: Estética without clinicDesign gets photos in draft and unchanged public snapshot", () => {
  const data = fixture({ specialty: "Estética" });
  assert.equal(data.clinicDesign, undefined);
  const snapshot = publicSnapshot(data);
  const before = JSON.stringify(snapshot);
  for (const variant of ["A", "B"] as const) {
    for (const input of [data, publicRendererInput(snapshot)]) {
      const html = render(variant, input);
      assert.equal((html.match(/<img\b/g) ?? []).length, 5);
      assert.doesNotMatch(
        html,
        /Fotografia do ambiente em preparação|bPhotoFallback|waiting-area|warm-interior/,
      );
      for (const photo of clinicPhotos) assert.ok(html.includes(photo.name));
    }
  }
  assert.equal(JSON.stringify(snapshot), before, "no rewriting approved data");
  data.clinicDesign = {
    version: 1,
    images: { hero: null, institutional: null, detail: null, room: null },
    appointments: {
      version: 1,
      heroImage: { src: null },
      aboutImage: { src: null },
      gallery: [],
    },
  };
  for (const variant of ["A", "B"] as const) {
    assert.doesNotMatch(render(variant, data), /<img\b/);
    assert.doesNotMatch(
      render(variant, publicRendererInput(publicSnapshot(data))),
      /<img\b/,
    );
  }
  const chosen = "/templates/clinics/shared/clinic-room-structure.png";
  data.clinicDesign.images!.hero = chosen;
  data.clinicDesign.appointments!.heroImage = {
    src: chosen,
    illustrative: false,
  };
  for (const variant of ["A", "B"] as const) {
    assert.match(render(variant, data), /clinic-room-structure/);
    assert.match(
      render(variant, publicRendererInput(publicSnapshot(data))),
      /clinic-room-structure/,
    );
  }
});
test("links: esquemas inseguros recusados; contatos sem inferência de país e localização codificada", () => {
  assert.throws(() =>
    clinicModel(fixture({ instagram: "javascript:alert(1)" })),
  );
  assert.throws(() =>
    clinicModel(fixture({ website: "https://user:password@example.test" })),
  );
  assert.equal(telephoneLink("+55 (11) 90000-0000"), "tel:+5511900000000");
  assert.equal(
    whatsappLink("+55 (11) 90000-0000"),
    "https://wa.me/5511900000000",
  );
  assert.equal(whatsappLink("11900000000"), null);
  assert.equal(telephoneLink("12"), null);
  const html = render(
    "B",
    fixture({
      whatsapp: "+55 (11) 90000-0000",
      instagram: "https://www.instagram.com/clinica_ficticia/",
      address: "Rua Fictícia & Jardim 1",
    }),
  );
  assert.match(html, /wa.me\/5511900000000/);
  assert.match(html, /noopener noreferrer/);
  assert.match(html, /Rua%20Fict%C3%ADcia%20%26%20Jardim%201/);
});
test("registro: compatibilidade de nicho, slug, variante e versão é obrigatória", () => {
  assert.throws(() =>
    renderPersistedTemplate(
      { ...template("A"), niche: "advocacia" },
      fixture(),
    ),
  );
  assert.throws(() =>
    renderPersistedTemplate({ ...template("A"), variant: "B" }, fixture()),
  );
  assert.throws(() =>
    renderPersistedTemplate(
      { ...template("A"), slug: "desconhecido" },
      fixture(),
    ),
  );
  assert.throws(() => render("A", fixture({ niche: "advocacia" })));
  assert.throws(() =>
    renderPersistedTemplate(template("A"), { ...fixture(), schemaVersion: 99 }),
  );
});
test("premium A: fotografia local em três slots, copy humana e fallback discreto", () => {
  const data = fixture();
  data.illustrative.headline =
    "Um espaço para apresentar cuidado e atendimento";
  data.illustrative.introduction =
    "Texto-base demonstrativo para organizar as informações da clínica. Especialidades, equipe e atendimentos precisam ser confirmados pela empresa.";
  const model = clinicModel(data);
  assert.equal(
    premiumContent(model).headline,
    "Seu cuidado merece uma boa conversa.",
  );
  assert.match(premiumContent(model).introduction, /Cada pessoa chega/);
  const html = render("A", data);
  assert.match(html, /premiumPhoto-hero/);
  assert.match(html, /premiumPhoto-institutional/);
  assert.match(html, /premiumPhoto-detail/);
  assert.match(html, /Fotografia de referência/);
  assert.doesNotMatch(
    html,
    /editorialNote|Clareza nos detalhes|Espaço para o essencial|\.svg/,
  );
  assert.match(render("B", data), /Sua saúde merece atenção em cada detalhe/);
  for (const photo of Object.values(premiumPhotography)) {
    assert.ok(photo);
    assert.ok(existsSync(`public${photo.src}`));
    assert.match(photo.alt, /não representa esta clínica/);
  }
  const noPhoto = renderToStaticMarkup(
    createElement(PremiumClinic, {
      model,
      photography: { hero: null, institutional: null, detail: null },
    }),
  );
  assert.doesNotMatch(noPhoto, /<img/);
  assert.match(noPhoto, /Fotografia do ambiente em preparação/);
  data.illustrative.headline = "Texto personalizado salvo";
  data.illustrative.introduction = "Introdução personalizada salva";
  assert.equal(
    premiumContent(clinicModel(data)).headline,
    "Texto personalizado salvo",
  );
  assert.equal(
    premiumContent(clinicModel(data)).introduction,
    "Introdução personalizada salva",
  );
});
test("prévia: autorização antecede leituras, dados persistidos e revisões novas chegam ao renderizador", async () => {
  let reads = 0;
  const id = randomUUID(),
    templateId = randomUUID();
  let data = fixture();
  const port: PreviewPort = {
    authorize: async () => {
      throw new Error("unauthorized");
    },
    prototype: async () => {
      reads++;
      return {
        id,
        template_id: templateId,
        niche: "clinicas",
        customization_data: data,
      } as unknown as PrototypeRow;
    },
    template: async (key) => {
      assert.equal(key, templateId);
      return { ...template("A"), id: templateId } as TemplateRow;
    },
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
    /Clínica Horizonte/,
  );
  data = fixture({ name: "Nome revisado fictício" });
  const second = await loadPrivatePreview(id, port);
  assert.ok(second);
  assert.match(
    renderToStaticMarkup(
      renderPersistedTemplate(
        second.template,
        second.prototype.customization_data,
      ),
    ),
    /Nome revisado fictício/,
  );
  port.template = async () =>
    ({ ...template("B"), id: templateId }) as TemplateRow;
  const previewB = await loadPrivatePreview(id, port);
  assert.ok(previewB);
  const htmlB = renderToStaticMarkup(
    renderPersistedTemplate(
      previewB.template,
      previewB.prototype.customization_data,
    ),
  );
  assert.match(htmlB, /data-template="clinicas-b"/);
  assert.match(htmlB, /Nome revisado fictício/);
  assert.equal(await loadPrivatePreview("invalid", port), null);
  port.template = async () =>
    ({ ...template("A"), niche: "advocacia" }) as TemplateRow;
  assert.equal(await loadPrivatePreview(id, port), null);
});
test("proteção: prévia continua privada e publicação usa rota separada", () => {
  assert.ok(existsSync("src/app/p/[slug]/page.tsx"));
  assert.match(
    readFileSync("src/services/publication.ts", "utf8"),
    /from\("published_prototypes"\)/,
  );
  assert.doesNotMatch(
    readFileSync("src/services/publication.ts", "utf8"),
    /from\("leads"\)/,
  );
  const route = readFileSync(
    "src/app/preview/prototipos/[id]/page.tsx",
    "utf8",
  );
  assert.match(route, /getPrivatePreview/);
  assert.match(route, /force-dynamic/);
  assert.match(
    readFileSync("src/services/preview.ts", "utf8"),
    /authorize: requireAdminPage/,
  );
  assert.match(readFileSync("src/proxy.ts", "utf8"), /\/preview\/:path\*/);
});

test("design extension: legacy compatible, sections, custom content and authorized reviews", () => {
  const data = fixture({ services: ["Confirmed service"] });
  data.clinicDesign = {
    version: 1,
    primary: "#244c45",
    heroDescription: "Custom hero",
    aboutTitle: "Custom about",
    sections: ["about", "contact"],
    images: { hero: null },
  };
  const html = render("A", data);
  assert.match(html, /Custom hero/);
  assert.match(html, /Custom about/);
  assert.doesNotMatch(html, /id="servicos"|id="estrutura"|premiumReviews/);
  assert.match(html, /--forest:#244c45/);
  data.clinicDesign.reviews = [
    {
      name: "Authorized",
      quote: "Verified text",
      source: "https:\/\/example.com\/review",
      authorized: true,
    },
  ];
  assert.match(render("A", data), /Verified text/);
  assert.throws(() =>
    render("A", {
      ...data,
      clinicDesign: {
        ...data.clinicDesign,
        reviews: [
          {
            name: "Unauthorized",
            quote: "Hidden",
            source: "https:\/\/example.com",
            authorized: false,
          },
        ],
      },
    } as unknown as Personalization),
  );
  assert.throws(() =>
    render("A", {
      ...data,
      clinicDesign: {
        version: 1,
        images: { hero: "https:\/\/example.com\/image.png" },
      },
    } as unknown as Personalization),
  );
});

test("B 4.3: composição fotográfica, ordem de referência e seis serviços inicialmente", () => {
  const data = fixture({
    services: Array.from(
      { length: 8 },
      (_, i) => `Serviço confirmado ${i + 1}`,
    ),
  });
  const html = render("B", data);
  assert.match(html, /appointmentsV2/);
  assert.match(html, /bHeroVisual/);
  for (const file of [
    "doctor-consultation-main",
    "clinic-reception-hero",
    "clinic-room-structure",
    "consultation-detail",
  ])
    assert.match(html, new RegExp(file));
  assert.doesNotMatch(
    html,
    /\.svg|NovaCare|Equipe multidisciplinar|Atendimento humanizado/,
  );
  const order = ["servicos", "sobre", "como", "estrutura", "contato"].map(
    (id) => html.indexOf(`id="${id}"`),
  );
  assert.ok(order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])));
  assert.equal(
    (html.split('<details class="bMoreServices">')[0].match(/<article/g) ?? [])
      .length,
    6,
  );
  assert.match(html, /Ver mais 2 atendimentos/);
  assert.match(html, /Serviço confirmado 8/);
  assert.match(html, /Imagem ilustrativa/);
});

test("B 4.3: cores, textos, imagens, legendas e opções não alteram o A", () => {
  const data = fixture({
    services: ["Procedimento confirmado"],
    description: "Descrição verificada",
  });
  data.clinicDesign = { version: 1, primary: "#244c45", aboutTitle: "Sobre A" };
  const beforeA = render("A", data);
  data.clinicDesign.appointments = {
    version: 1,
    primary: "#414b64",
    button: "#244c45",
    secondary: "#dce2ef",
    heroTitle: "Título exclusivo B",
    heroDescription: "Descrição B",
    aboutTitle: "Sobre B",
    serviceDescriptions: {
      "Procedimento confirmado": "Descrição aprovada do serviço",
    },
    heroImage: {
      src: "/templates/clinics/shared/clinic-room-structure.png",
      position: "right",
      caption: "Legenda do hero",
      illustrative: true,
    },
    gallery: [
      {
        src: "/templates/clinics/shared/consultation-detail.png",
        caption: "Galeria aprovada",
        illustrative: true,
      },
    ],
    steps: [
      { title: "Passo A", description: "Orientação A" },
      { title: "Passo B", description: "Orientação B" },
      { title: "Passo C", description: "Orientação C" },
    ],
  };
  const html = render("B", data);
  for (const text of [
    "Título exclusivo B",
    "Descrição B",
    "Sobre B",
    "Descrição aprovada do serviço",
    "Legenda do hero",
    "Galeria aprovada",
    "Passo A",
    "Orientação C",
  ])
    assert.ok(html.includes(text), text);
  assert.match(html, /--b-primary:#414b64/);
  assert.match(html, /--b-button:#244c45/);
  assert.match(html, /--b-secondary:#dce2ef/);
  assert.match(html, /object-position:right 25%/);
  assert.equal(render("A", data), beforeA);
});

test("B 4.3: contato confirmado, campos ocultos e fallback de canal funcionam", () => {
  const data = fixture({
    phone: "+551133334444",
    whatsapp: "+5511999999999",
    city: "São Paulo",
    state: "SP",
  });
  data.clinicDesign = {
    version: 1,
    appointments: {
      version: 1,
      email: "contato@example.test",
      hours: "Segunda: 09h às 12h (confirmado)",
      contactChannel: "email",
      hiddenContacts: ["phone"],
    },
  };
  let html = render("B", data);
  assert.match(html, /mailto:contato@example.test/);
  assert.match(html, /Segunda: 09h/);
  assert.doesNotMatch(html, /tel:|551133334444/);
  data.clinicDesign.appointments!.hiddenContacts = [
    "phone",
    "email",
    "hours",
    "address",
  ];
  html = render("B", data);
  assert.match(html, /href="https:\/\/wa.me\/5511999999999"/);
  assert.doesNotMatch(html, /contato@example.test|Segunda:|id="localizacao"/);
  data.clinicDesign.appointments!.sections = [];
  html = render("B", data);
  assert.doesNotMatch(
    html,
    /id="sobre"|id="servicos"|id="como"|id="estrutura"|id="contato"/,
  );
  assert.match(html, /id="canais"/);
});

test("B: especialidades usam as fotos oficiais ilustrativas sem inventar serviços", () => {
  for (const specialty of [
    "Odontologia",
    "Estética",
    "Psicologia",
    "Fisioterapia",
    "Veterinária",
  ]) {
    const data = fixture({ specialty });
    const html = render("B", data);
    assert.doesNotMatch(
      html,
      /id="servicos"|Clínica Geral|Cardiologia|Pediatria|waiting-area|warm-interior/,
    );
    assert.match(html, /prévia demonstrativa/);
    assert.match(html, /após confirmação/);
    for (const photo of clinicPhotos) assert.ok(html.includes(photo.name));
    assert.match(html, /Imagem ilustrativa/);
  }
});

test("B 4.3: rejeita versão, caminhos, contato e seções inválidos", () => {
  for (const invalid of [
    { version: 99 },
    { version: 1, primary: "red" },
    { version: 1, heroImage: { src: "javascript:alert(1)" } },
    { version: 1, email: "a@example.test\r\nBcc:b@example.test" },
    { version: 1, sections: ["about", "about"] },
    { version: 1, hiddenContacts: ["email", "email"] },
    { version: 1, steps: [] },
    { version: 1, gallery: [{ src: "/templates/clinics/../private.png" }] },
  ]) {
    assert.throws(() =>
      render("B", {
        ...fixture(),
        clinicDesign: { version: 1, appointments: invalid },
      } as unknown as Personalization),
    );
  }
});
