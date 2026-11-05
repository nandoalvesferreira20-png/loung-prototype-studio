import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout } from "node:timers/promises";
import { restaurantFixture } from "../fixtures/restaurant";
import { demonstrationContent } from "../../src/lib/generation/personalize";
import { publicSnapshot } from "../../src/lib/publication";
import { templateRenderers } from "../../src/templates/registry";

test(
  "production HTTP: eight public snapshots, metadata, no-cache, republish and unpublish (mock Supabase transport)",
  {
    skip:
      process.env.TEST_PUBLICATION_BUILD !== "1"
        ? "Run after build with TEST_PUBLICATION_BUILD=1; uses isolated fixture transport, no remote writes."
        : false,
    timeout: 120000,
  },
  async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "loung-publication-http-"));
    const file = path.join(dir, "snapshot.json");
    const port = 3023;
    const base = `http://127.0.0.1:${port}`;
    let state = {
      active: false,
      slug: "empresa-ficticia-teste",
      template: "restaurantes-b",
      data: publicSnapshot(restaurantFixture()),
    };
    const save = () => writeFileSync(file, JSON.stringify(state));
    save();
    const child = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
      {
        cwd: process.cwd(),
        windowsHide: true,
        env: {
          ...process.env,
          PUBLICATION_HTTP_FIXTURE: file,
          NODE_OPTIONS: `--import "${pathToFileURL(path.resolve("tests/fixtures/publication-fetch.mjs")).href}"`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    child.stdout.on("data", (data) => {
      logs += String(data);
    });
    child.stderr.on("data", (data) => {
      logs += String(data);
    });
    try {
      let ready = false;
      for (let i = 0; i < 100; i++) {
        if (child.exitCode !== null) throw new Error(logs);
        try {
          await fetch(`${base}/p/invalid`);
          ready = true;
          break;
        } catch {
          await setTimeout(200);
        }
      }
      assert.ok(ready, logs);
      assert.equal((await fetch(`${base}/p/${state.slug}`)).status, 404);
      for (const [slug, entry] of Object.entries(templateRenderers)) {
        const draft = restaurantFixture({
          niche: entry.niche,
          name: `Empresa pública fictícia ${slug}`,
        });
        draft.illustrative = demonstrationContent[entry.niche];
        state = {
          ...state,
          active: true,
          template: slug,
          data: publicSnapshot(draft),
        };
        save();
        const response = await fetch(`${base}/p/${state.slug}`);
        assert.equal(response.status, 200, logs);
        assert.match(response.headers.get("cache-control") ?? "", /no-store/);
        assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
        const html = await response.text();
        if (entry.niche === "clinicas") {
          for (const file of [
            "clinic-reception-hero",
            "doctor-consultation-main",
            "clinic-room-structure",
            "consultation-detail",
          ]) {
            const asset = `/templates/clinics/shared/${file}.png`;
            assert.ok(
              html.includes(file),
              `${slug}: ${file} rendered in public snapshot`,
            );
            const direct = await fetch(`${base}${asset}`);
            assert.equal(direct.status, 200, asset);
            assert.match(
              direct.headers.get("content-type") ?? "",
              /image\/png/,
            );
            const optimized = await fetch(
              `${base}/_next/image?url=${encodeURIComponent(asset)}&w=640&q=75`,
            );
            assert.equal(optimized.status, 200, `optimized ${asset}`);
            assert.match(
              optimized.headers.get("content-type") ?? "",
              /image\//,
            );
            assert.ok((await optimized.arrayBuffer()).byteLength > 1000);
          }
        }
        assert.ok(html.includes(draft.confirmed.name), slug);
        assert.match(
          html,
          /Protótipo demonstrativo desenvolvido pela Loung Tech/,
        );
        assert.match(html, /property="og:title"/);
        assert.doesNotMatch(
          html,
          /sourceLeadId|sourceUpdatedAt|confirmedOrigin|customization_data/,
        );
      }
      state.data.confirmed.name = "Republicação aprovada";
      save();
      assert.match(
        await (await fetch(`${base}/p/${state.slug}`)).text(),
        /Republicação aprovada/,
      );
      state.active = false;
      save();
      const removed = await fetch(`${base}/p/${state.slug}`);
      assert.equal(removed.status, 404);
      assert.doesNotMatch(await removed.text(), /Republicação aprovada/);
      assert.equal((await fetch(`${base}/p/outro-slug`)).status, 404);
      assert.equal((await fetch(`${base}/p/UPPERCASE`)).status, 404);
    } finally {
      child.kill();
      await new Promise<void>((resolve) => {
        if (child.exitCode !== null) resolve();
        else child.once("exit", () => resolve());
      });
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
