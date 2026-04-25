import { describe, expect, it } from "vitest";
import {
  isLikelyPplTrackingNumber,
  resolveTrackingFromBatch,
  validatePplShipmentBelongsToOrder,
} from "./ppl-tracking";

describe("PPL tracking selection", () => {
  it("batch response overrides stale DB tracking when reference and complete match", () => {
    const resolved = resolveTrackingFromBatch("21491971453", "25042026005", {
      items: [
        {
          referenceId: "25042026005",
          importState: "Complete",
          shipmentNumber: "21491971454",
        },
      ],
    });
    expect(resolved).toBe("21491971454");
  });

  it("known debug lookup number is not auto-saved by ownership validator", () => {
    const check = validatePplShipmentBelongsToOrder(
      {
        orderNumber: 25042026005,
        pplOrderReference: "25042026005",
        customerName: "Filippo testo 10",
        deliveryAddress: "Street, City, 1101, Country",
        totalPrice: 89899,
      },
      { shipmentNumber: "21491971453" },
      "known_tracking_debug",
      "5042026005"
    );
    expect(check.ok).toBe(false);
  });

  it("variable symbol fallback can be accepted when details match", () => {
    const check = validatePplShipmentBelongsToOrder(
      {
        orderNumber: 25042026005,
        pplOrderReference: "25042026005",
        customerName: "Filippo testo 10",
        deliveryAddress: "Street, City, 1101, Country",
        totalPrice: 89899,
      },
      {
        paymentInfo: { codVariableSymbol: "5042026005", codPrice: 89899 },
        recipient: { name: "Filippo testo 10", zipCode: "1101" },
      },
      "shipment_lookup",
      "5042026005"
    );
    expect(check.ok).toBe(true);
    expect(check.matchedFields).toContain("codVariableSymbol");
  });

  it("variable symbol fallback is rejected when cod var sym mismatches", () => {
    const check = validatePplShipmentBelongsToOrder(
      {
        orderNumber: 25042026005,
        pplOrderReference: "25042026005",
        customerName: "Filippo testo 10",
        deliveryAddress: "Street, City, 1101, Country",
        totalPrice: 89899,
      },
      {
        paymentInfo: { codVariableSymbol: "5042026004", codPrice: 89899 },
        recipient: { name: "Filippo testo 10", zipCode: "1101" },
      },
      "shipment_lookup",
      "5042026005"
    );
    expect(check.ok).toBe(false);
  });

  it("referenceId value is not used as tracking in batch resolver", () => {
    const resolved = resolveTrackingFromBatch("21491971453", "25042026005", {
      items: [
        {
          referenceId: "25042026005",
          importState: "Complete",
          // missing shipmentNumber on purpose
        },
      ],
    });
    expect(resolved).toBe("21491971453");
  });
});

