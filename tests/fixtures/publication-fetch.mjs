// Test-process preload only. Never imported by application code or deployed runtime.
import fs from "node:fs";
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (url.pathname.startsWith("/rest/v1/")) {
    if (url.pathname !== "/rest/v1/published_prototypes")
      throw new Error("Private table access from public page");
    const state = JSON.parse(
      fs.readFileSync(process.env.PUBLICATION_HTTP_FIXTURE, "utf8"),
    );
    const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
    const data =
      state.active && state.slug === slug
        ? { slug, template_identifier: state.template, public_data: state.data }
        : null;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.pathname.startsWith("/auth/"))
    throw new Error("Public page attempted authentication");
  return original(input, init);
};
