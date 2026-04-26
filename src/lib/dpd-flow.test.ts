import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dpdUrl, isLikelyDpdTrackingNumber } from "./dpd";

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

describe("DPD URL builder", () => {
  it("builds correct v1.1/v1.0 URLs from base with api version", () => {
    expect(dpdUrl("v1.1", "/shipments", "https://shipping.dpdgroup.com/api/v1.1")).toBe(
      "https://shipping.dpdgroup.com/api/v1.1/shipments"
    );
    expect(dpdUrl("v1.0", "/label/shipment-ids", "https://shipping.dpdgroup.com/api/v1.1")).toBe(
      "https://shipping.dpdgroup.com/api/v1.0/label/shipment-ids"
    );
  });

  it("builds same URLs from origin-only base", () => {
    expect(dpdUrl("v1.1", "/shipments", "https://shipping.dpdgroup.com")).toBe(
      "https://shipping.dpdgroup.com/api/v1.1/shipments"
    );
    expect(dpdUrl("v1.0", "/label/shipment-ids", "https://shipping.dpdgroup.com")).toBe(
      "https://shipping.dpdgroup.com/api/v1.0/label/shipment-ids"
    );
  });

  it("never produces duplicated api/version path fragments", () => {
    const url1 = dpdUrl("v1.1", "/v1.1/shipments", "https://shipping.dpdgroup.com/api/v1.1");
    const url2 = dpdUrl("v1.0", "/v1.0/label/shipment-ids", "https://shipping.dpdgroup.com/api/v1.1");
    expect(url1).toBe("https://shipping.dpdgroup.com/api/v1.1/shipments");
    expect(url2).toBe("https://shipping.dpdgroup.com/api/v1.0/label/shipment-ids");
    expect(url1).not.toContain("/api/v1.1/v1.1/");
    expect(url2).not.toContain("/api/v1.1/v1.0/");
    expect(url1).not.toContain("/api/api/");
  });
});

describe("DPD admin wiring", () => {
  it("renders explicit DPD action labels in RO and HU admin", () => {
    const ro = read("src/app/admin/page.tsx");
    const hu = read("src/app/hu-admin/page.tsx");
    expect(ro).toContain("Reset DPD zásilky");
    expect(hu).toContain("Reset DPD zásilky");
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

  it("DPD helper uses shipmentIdList for labels and remote cancel endpoint", () => {
    const dpd = read("src/lib/dpd.ts");
    expect(dpd).toContain("shipmentIdList");
    expect(dpd).toContain("/shipments/cancellation");
  });

  it("HU COD is explicitly blocked in DPD create flow", () => {
    const dpd = read("src/lib/dpd.ts");
    expect(dpd).toContain("DPD_HU_COD_NOT_ENABLED");
  });
});
