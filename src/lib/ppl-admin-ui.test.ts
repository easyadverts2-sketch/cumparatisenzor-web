import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildPplBatchLabelFallbackUrl, resolvePplLabelEndpoint } from "./ppl";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("PPL admin UI wiring", () => {
  it("does not render Vytvorit action in RO admin page", () => {
    const source = read("src/app/admin/page.tsx");
    expect(source).not.toContain(">Vytvořit<");
  });

  it("does not render Vytvorit action in HU admin page", () => {
    const source = read("src/app/hu-admin/page.tsx");
    expect(source).not.toContain(">Vytvořit<");
  });

  it("uses attachment disposition for RO and HU label routes", () => {
    const ro = read("src/app/api/admin/ppl-label/route.ts");
    const hu = read("src/app/api/hu-admin/ppl-label/route.ts");
    expect(ro).toContain('attachment; filename="ppl-${order.orderNumber}.pdf"');
    expect(hu).toContain('attachment; filename="ppl-${order.orderNumber}.pdf"');
  });
});

describe("PPL label endpoint helpers", () => {
  it("builds A4 fallback /label URL with required query params", () => {
    const url = buildPplBatchLabelFallbackUrl("https://api.dhl.com/ecs/ppl/myapi2", "abc-123");
    expect(url).toContain("/shipment/batch/abc-123/label");
    expect(url).toContain("pageSize=A4");
    expect(url).toContain("position=1");
    expect(url).toContain("limit=200");
    expect(url).toContain("offset=0");
  });

  it("resolves relative /data/{guid} label URL against PPL base URL", () => {
    const url = resolvePplLabelEndpoint("https://api.dhl.com/ecs/ppl/myapi2", "/data/123-guid");
    expect(url).toBe("https://api.dhl.com/ecs/ppl/myapi2/data/123-guid");
  });
});
