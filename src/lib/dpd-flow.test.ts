import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isLikelyDpdTrackingNumber } from "./dpd";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("DPD tracking candidate validation", () => {
  it("accepts numeric tracking-like values", () => {
    expect(isLikelyDpdTrackingNumber("12345678901")).toBe(true);
    expect(isLikelyDpdTrackingNumber("12345678901234")).toBe(true);
  });

  it("rejects uuid and non-numeric values", () => {
    expect(isLikelyDpdTrackingNumber("ed61bea9-df39-4177-8e09-242cb4cb4847")).toBe(false);
    expect(isLikelyDpdTrackingNumber("ORDER-12345")).toBe(false);
  });
});

describe("DPD admin wiring", () => {
  it("renders explicit DPD action labels in RO and HU admin", () => {
    const ro = read("src/app/admin/page.tsx");
    const hu = read("src/app/hu-admin/page.tsx");
    expect(ro).toContain("Zrušit DPD zásilku");
    expect(hu).toContain("Zrušit DPD zásilku");
    expect(ro).toContain("Lokální reset DPD");
    expect(hu).toContain("Lokální reset DPD");
    expect(ro).toContain("Stáhnout DPD štítek");
    expect(hu).toContain("Stáhnout DPD štítek");
  });

  it("DPD label routes support debug and attachment download", () => {
    const ro = read("src/app/api/admin/dpd-label/route.ts");
    const hu = read("src/app/api/hu-admin/dpd-label/route.ts");
    expect(ro).toContain("debug");
    expect(hu).toContain("debug");
    const helper = read("src/lib/dpd-label-route.ts");
    expect(helper).toContain("attachment; filename=\"dpd-");
    expect(helper).toContain("\"Content-Type\": \"application/pdf\"");
  });

  it("DPD bulk routes return diagnostic JSON on failure/debug", () => {
    const ro = read("src/app/api/admin/dpd-bulk-label/route.ts");
    const hu = read("src/app/api/hu-admin/dpd-bulk-label/route.ts");
    expect(ro).toContain("failedOrders");
    expect(hu).toContain("failedOrders");
    expect(ro).toContain("endpointAttemptResults");
    expect(hu).toContain("endpointAttemptResults");
  });

  it("DPD helper uses shipmentIdList for labels and cancellation", () => {
    const dpd = read("src/lib/dpd.ts");
    expect(dpd).toContain("shipmentIdList");
    expect(dpd).toContain("/v1.1/shipments/cancellation");
  });

  it("HU COD is explicitly blocked in DPD create flow", () => {
    const dpd = read("src/lib/dpd.ts");
    expect(dpd).toContain('dpd_cod_not_allowed_hu');
  });
});
