import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import {
  brandPalette,
  studioBrand,
  studioIcons,
  studioTokens,
} from "../src/config/brand";
import { StudioBrand } from "../src/components/layout/studio-brand";
import { TemplateLibrary } from "../src/components/templates/template-library";

test("Studio brand: official LT asset is copied byte-for-byte and used for browser identity", () => {
  const original = readFileSync("src/data/logo.png"),
    copy = readFileSync(`public${studioBrand.logo}`);
  const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
  assert.equal(hash(copy), hash(original));
  assert.equal(copy.readUInt32BE(16), 830);
  assert.equal(copy.readUInt32BE(20), 830);
  assert.equal(studioIcons.icon[0].url, studioBrand.logo);
  const html = renderToStaticMarkup(createElement(StudioBrand));
  assert.match(html, /Símbolo oficial LT/);
  assert.match(html, /Loung Tech/);
  assert.match(html, /Prototype Studio/);
  assert.doesNotMatch(html, /brand-symbol|↗/);
});
test("Studio brand: fonts are local binaries with redistributed OFL licenses", () => {
  for (const [font, license] of [
    ["bricolage-grotesque.ttf", "bricolage-OFL.txt"],
    ["instrument-serif.ttf", "instrument-serif-OFL.txt"],
    ["inter.ttf", "inter-OFL.txt"],
  ]) {
    const binary = readFileSync(`src/styles/fonts/${font}`);
    assert.ok(binary.length > 10000);
    assert.ok(
      binary.readUInt32BE(0) === 0x00010000 ||
        binary.toString("ascii", 0, 4) === "OTTO",
    );
    assert.match(
      readFileSync(`src/styles/fonts/${license}`, "utf8"),
      /SIL OPEN FONT LICENSE/,
    );
  }
});
test("Studio brand: new theme rules are scoped and cannot select standalone customer templates", () => {
  const css = postcss.parse(readFileSync("src/styles/studio.css", "utf8"));
  let rules = 0;
  css.walkRules((rule) => {
    for (const selector of rule.selectors) {
      assert.ok(selector.trim().startsWith(".studio-ui"), selector);
      rules++;
    }
  });
  assert.ok(rules > 100);
  assert.doesNotMatch(
    readFileSync("src/styles/studio.css", "utf8"),
    /^\s*(body|html|:root)\s*\{/m,
  );
});
function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
test("Studio brand: official palette and accessible operational text pairs", () => {
  assert.deepEqual(
    brandPalette.map((t) => t.color),
    ["#000000", "#F1EEE6", "#A8A59D", "#CDF03B", "#2A4BFF"],
  );
  const tokens = Object.fromEntries(Object.entries(studioTokens));
  for (const [ink, paper] of [
    ["black", "off-white"],
    ["muted", "off-white"],
    ["black", "lime"],
    ["blue", "off-white"],
    ["error", "error-bg"],
    ["warning", "warning-bg"],
    ["success", "success-bg"],
  ]) {
    const a = luminance(String(tokens[`--lt-${ink}`])),
      b = luminance(String(tokens[`--lt-${paper}`]));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(ratio >= 4.5, `${ink}/${paper}: ${ratio}`);
  }
});
test("Studio library: eight distinct conceptual previews use existing local photographs", () => {
  const html = renderToStaticMarkup(createElement(TemplateLibrary));
  assert.equal((html.match(/data-template=/g) ?? []).length, 8);
  assert.equal((html.match(/Abrir protótipos/g) ?? []).length, 8);
  assert.doesNotMatch(
    html,
    /outros seis|demais nichos continuam em planejamento/i,
  );
  for (const path of [
    "/templates/clinics/shared/clinic-reception-hero.png",
    "/templates/clinics/shared/clinic-room-structure.png",
    "/templates/law/shared/law-office-reception.png",
    "/templates/law/modern/hero-office.png",
    "/templates/real-estate/shared/real-estate-luxury-house-hero.png",
    "/templates/real-estate/shared/real-estate-apartment-interior.png",
    "/templates/restaurants/shared/restaurant-dining-room.png",
    "/templates/restaurants/shared/restaurant-bar-ambience.png",
  ])
    assert.ok(existsSync(`public${path}`));
});
