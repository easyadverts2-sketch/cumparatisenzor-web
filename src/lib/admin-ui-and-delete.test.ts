import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("PPL admin cleanup", () => {
  it("hides debug/refresh/storno PPL actions in RO/HU tables", () => {
    const ro = read("src/app/admin/page.tsx");
    const hu = read("src/app/hu-admin/page.tsx");
    expect(ro).not.toContain("Debug najit tracking cislo");
    expect(hu).not.toContain("Debug najit tracking cislo");
    expect(ro).not.toContain("label=\"Stornovat v PPL\"");
    expect(hu).not.toContain("label=\"Stornovat v PPL\"");
    expect(ro).not.toContain(">Refresh<");
    expect(hu).not.toContain(">Refresh<");
  });

  it("removes PPL batch/import/status/label columns and keeps print in actions", () => {
    const ro = read("src/app/admin/page.tsx");
    expect(ro).not.toContain("Batch / Import");
    expect(ro).not.toContain("Stav PPL");
    expect(ro).toContain("Tisk štítku");
  });
});

describe("Hard delete wiring", () => {
  it("has dedicated RO/HU hard delete API routes", () => {
    const ro = read("src/app/api/admin/order-hard-delete/route.ts");
    const hu = read("src/app/api/hu-admin/order-hard-delete/route.ts");
    expect(ro).toContain("hardDeleteOrderWithCarrierCancel");
    expect(hu).toContain("hardDeleteOrderWithCarrierCancel");
  });

  it("has dedicated RO/HU bulk hard delete API routes", () => {
    const ro = read("src/app/api/admin/orders-bulk-hard-delete/route.ts");
    const hu = read("src/app/api/hu-admin/orders-bulk-hard-delete/route.ts");
    expect(ro).toContain("hardDeleteOrdersBulk");
    expect(hu).toContain("hardDeleteOrdersBulk");
  });

  it("admin orders list deletes directly and supports bulk delete without modal", () => {
    const ui = read("src/components/admin-orders-list.tsx");
    expect(ui).toContain("Smazat vybrané objednávky");
    expect(ui).toContain("orders-bulk-hard-delete");
    expect(ui).not.toContain("Potvrzení smazání objednávky");
    expect(ui).not.toContain("window.confirm");
    expect(ui).not.toContain("window.alert");
    expect(ui).not.toContain("window.prompt");
  });
});
