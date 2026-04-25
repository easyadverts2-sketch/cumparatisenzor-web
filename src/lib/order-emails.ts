import { getBankDetails, marketCurrency } from "./billing";
import { formatOrderNumber } from "./order-format";
import type { Market, Order } from "./types";

const PRODUCT_NAME = "FreeStyle Libre 2 Plus";

function siteName(market: Market) {
  return market === "HU" ? "szenzorvasarlas.hu" : "cumparatisenzor.ro";
}

function siteUrl(market: Market) {
  return market === "HU" ? "https://szenzorvasarlas.hu" : "https://cumparatisenzor.ro";
}

function supportEmail(market: Market) {
  return market === "HU" ? "info@szenzorvasarlas.hu" : "info@cumparatisenzor.ro";
}

function paymentLabel(paymentMethod: Order["paymentMethod"], market: Market) {
  if (market === "HU") {
    if (paymentMethod === "BANK_TRANSFER") return "Banki atutalas";
    if (paymentMethod === "COD") return "Utanvet";
    return "Bankkartya";
  }
  if (paymentMethod === "BANK_TRANSFER") return "Transfer bancar";
  if (paymentMethod === "COD") return "Ramburs";
  return "Card";
}

function shippingLabel(order: Pick<Order, "shippingCarrier">) {
  if (order.shippingCarrier === "DPD") return "DPD";
  if (order.shippingCarrier === "FINESHIP") return "Fineship";
  return "PPL";
}

function htmlShell(content: string, market: Market) {
  const logo = `${siteUrl(market)}/icon.png`;
  return `
  <div style="background:#f4f1f6;padding:24px 10px;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #ead5df;border-radius:20px;overflow:hidden;box-shadow:0 15px 45px rgba(111,33,71,.17);">
      <div style="background:linear-gradient(135deg,#6f2147,#a22d53,#df5b42);padding:18px 22px;position:relative;">
        <div style="position:absolute;right:-30px;top:-30px;width:140px;height:140px;background:rgba(255,255,255,.08);border-radius:100%;"></div>
        <img src="${logo}" alt="Logo" style="height:54px;width:54px;display:block;background:#fff;border-radius:14px;padding:8px;position:relative;z-index:1;" />
      </div>
      <div style="padding:24px 24px 26px;">
        ${content}
      </div>
    </div>
  </div>`;
}

function footer(market: Market) {
  const email = supportEmail(market);
  return market === "HU"
    ? `<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;">
         Kerdes eseten barmikor irjon nekunk:<br/>
         Email: <a href="mailto:${email}">${email}</a><br/>
         Telefon/WhatsApp: <a href="tel:+420777577352">+420 777 577 352</a>
       </p>`
    : `<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;">
         Daca aveti nevoie de ajutor, ne puteti contacta oricand:<br/>
         Email: <a href="mailto:${email}">${email}</a><br/>
         Telefon/WhatsApp: <a href="tel:+420777577352">+420 777 577 352</a>
       </p>`;
}

function normalizeAddress(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function addressSummary(order: Order, market: Market) {
  const deliveryTitle = market === "HU" ? "Szallitasi cim" : "Adresa de livrare";
  const billingTitle = market === "HU" ? "Szamlazasi cim" : "Adresa de facturare";
  const showBilling = normalizeAddress(order.billingAddress) !== normalizeAddress(order.deliveryAddress);

  const billingHtml = showBilling
    ? `<div style="margin-top:10px;padding:12px 13px;border:1px solid #e8dbe3;border-radius:12px;background:#fff;white-space:pre-line;">
         <div style="font-size:12px;font-weight:700;color:#6f2147;text-transform:uppercase;letter-spacing:.04em;">${billingTitle}</div>
         <div style="margin-top:5px;font-size:14px;line-height:1.55;color:#1f2937;">${order.billingAddress}</div>
       </div>`
    : "";

  const billingText = showBilling ? `\n${billingTitle}: ${order.billingAddress}` : "";

  return {
    html: `
      <div style="margin-top:14px;padding:14px;border:1px solid #eadce4;border-radius:14px;background:#faf7fb;">
        <div style="font-size:12px;font-weight:700;color:#6f2147;text-transform:uppercase;letter-spacing:.04em;">${deliveryTitle}</div>
        <div style="margin-top:5px;font-size:14px;line-height:1.55;color:#1f2937;white-space:pre-line;">${order.deliveryAddress}</div>
        ${billingHtml}
      </div>`,
    text: `${deliveryTitle}: ${order.deliveryAddress}${billingText}`,
  };
}

function summaryRow(label: string, value: string, icon: string) {
  return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #f0e2ea;white-space:nowrap;color:#6f2147;font-weight:700;font-size:13px;">
      <span style="display:inline-block;width:20px;text-align:center;margin-right:6px;">${icon}</span>${label}
    </td>
    <td style="padding:10px 12px;border-bottom:1px solid #f0e2ea;color:#111827;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

export function buildOrderCreatedEmail(order: Order, market: Market, variableSymbol?: string | null) {
  const subject = market === "HU" ? "Koszonjuk a rendeleset" : "Va multumim pentru comanda";
  const currency = marketCurrency(market);
  const nr = formatOrderNumber(order.orderNumber);
  const bank = getBankDetails(market);
  const transferBlock =
    order.paymentMethod === "BANK_TRANSFER"
      ? market === "HU"
        ? `<div style="margin-top:14px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
             <strong>Fizetesi adatok</strong>
             <div style="margin-top:8px;font-size:14px;line-height:1.6;">
               Kedvezmenyezett: ${bank.accountName}<br/>
               IBAN: ${bank.iban}<br/>
               BIC/SWIFT: ${bank.bic}<br/>
               Kozlemeny (valtozo szam): ${variableSymbol || "-"}
             </div>
           </div>`
        : `<div style="margin-top:14px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
             <strong>Detalii plata prin transfer</strong>
             <div style="margin-top:8px;font-size:14px;line-height:1.6;">
               Beneficiar: ${bank.accountName}<br/>
               IBAN: ${bank.iban}<br/>
               BIC/SWIFT: ${bank.bic}<br/>
               Referinta (variabila): ${variableSymbol || "-"}
             </div>
           </div>`
      : "";

  const greeting =
    market === "HU"
      ? `Kedves ${order.customerName}, koszonjuk a rendeleset!`
      : `Buna, ${order.customerName}! Va multumim pentru comanda.`;
  const address = addressSummary(order, market);

  const content = `
    <div style="display:inline-block;padding:6px 10px;background:#f9edf3;border:1px solid #f0d5e3;border-radius:999px;font-size:12px;font-weight:700;color:#8d2f5a;">
      ${siteName(market)}
    </div>
    <h1 style="margin:10px 0 8px 0;font-size:31px;line-height:1.16;color:#111827;">${greeting}</h1>
    <p style="margin:0 0 16px 0;color:#374151;font-size:15px;">${market === "HU" ? "Rendeleset rogzitettuk, es mar dolgozunk az elokeszitesen." : "Comanda a fost inregistrata cu succes si este in curs de procesare."}</p>
    <div style="border:1px solid #e8dbe3;border-radius:14px;overflow:hidden;background:#fff;">
      <div style="padding:11px 14px;background:#fff2f8;border-bottom:1px solid #f0e2ea;font-weight:700;color:#6f2147;font-size:13px;letter-spacing:.05em;text-transform:uppercase;">
        ${market === "HU" ? "Rendelesi osszesito" : "Rezumat comanda"}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
        ${summaryRow(market === "HU" ? "Rendelesszam" : "Numar comanda", `#${nr}`, "🔖")}
        ${summaryRow(market === "HU" ? "Termek" : "Produs", PRODUCT_NAME, "📦")}
        ${summaryRow(market === "HU" ? "Mennyiseg" : "Cantitate", String(order.quantity), "🔢")}
        ${summaryRow(market === "HU" ? "Szallitas" : "Livrare", shippingLabel(order), "🚚")}
        ${summaryRow(market === "HU" ? "Fizetes" : "Plata", paymentLabel(order.paymentMethod, market), "💳")}
        ${summaryRow(market === "HU" ? "Vegosszeg" : "Total", `${order.totalPrice} ${currency}`, "💰")}
      </table>
    </div>
    ${address.html}
    ${transferBlock}
    ${footer(market)}
  `;

  const text = [
    greeting,
    `${market === "HU" ? "Rendelesszam" : "Comanda"}: #${nr}`,
    `${market === "HU" ? "Termek" : "Produs"}: ${PRODUCT_NAME} x${order.quantity}`,
    `${market === "HU" ? "Fizetes" : "Plata"}: ${paymentLabel(order.paymentMethod, market)}`,
    `${market === "HU" ? "Szallitas" : "Livrare"}: ${shippingLabel(order)}`,
    `${market === "HU" ? "Vegosszeg" : "Total"}: ${order.totalPrice} ${currency}`,
    address.text,
    order.paymentMethod === "BANK_TRANSFER"
      ? `IBAN: ${bank.iban}; BIC: ${bank.bic}; ${market === "HU" ? "Valtozo szam" : "Variabila"}: ${variableSymbol || "-"}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text, html: htmlShell(content, market) };
}

export function buildPaymentReceivedEmail(order: Order, market: Market) {
  const nr = formatOrderNumber(order.orderNumber);
  const currency = marketCurrency(market);
  const address = addressSummary(order, market);
  const subject = market === "HU" ? "Koszonjuk a befizetest" : "Va multumim pentru plata";
  const content = `
    <h1 style="margin:0 0 10px 0;font-size:28px;line-height:1.2;">${market === "HU" ? "Koszonjuk a befizetest!" : "Va multumim pentru plata!"}</h1>
    <p style="margin:0 0 12px 0;color:#374151;">${market === "HU" ? "Befizeteset megerositettuk. A rendeles osszesitoje es a szallitasi cim alabb talalhato." : "Plata a fost confirmata. Rezumatul comenzii si adresa de livrare sunt mai jos."}</p>
    <div style="border:1px solid #e8dbe3;border-radius:14px;overflow:hidden;background:#fff;">
      <div style="padding:11px 14px;background:#fff2f8;border-bottom:1px solid #f0e2ea;font-weight:700;color:#6f2147;font-size:13px;letter-spacing:.05em;text-transform:uppercase;">
        ${market === "HU" ? "Rendelesi osszesito" : "Rezumat comanda"}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
        ${summaryRow(market === "HU" ? "Rendelesszam" : "Numar comanda", `#${nr}`, "🔖")}
        ${summaryRow(market === "HU" ? "Termek" : "Produs", PRODUCT_NAME, "📦")}
        ${summaryRow(market === "HU" ? "Mennyiseg" : "Cantitate", String(order.quantity), "🔢")}
        ${summaryRow(market === "HU" ? "Szallitas" : "Livrare", shippingLabel(order), "🚚")}
        ${summaryRow(market === "HU" ? "Fizetes" : "Plata", paymentLabel(order.paymentMethod, market), "💳")}
        ${summaryRow(market === "HU" ? "Vegosszeg" : "Total", `${order.totalPrice} ${currency}`, "💰")}
      </table>
    </div>
    ${address.html}
    ${footer(market)}
  `;

  return {
    subject,
    html: htmlShell(content, market),
    text: [
      market === "HU" ? "Koszonjuk, a befizetest rogzitettuk." : "Va multumim, plata a fost inregistrata.",
      `${market === "HU" ? "Rendelesszam" : "Comanda"}: #${nr}`,
      `${market === "HU" ? "Termek" : "Produs"}: ${PRODUCT_NAME} x${order.quantity}`,
      `${market === "HU" ? "Fizetes" : "Plata"}: ${paymentLabel(order.paymentMethod, market)}`,
      `${market === "HU" ? "Szallitas" : "Livrare"}: ${shippingLabel(order)}`,
      `${market === "HU" ? "Vegosszeg" : "Total"}: ${order.totalPrice} ${currency}`,
      address.text,
      `Kontakt: ${supportEmail(market)} / +420 777 577 352`,
    ].join("\n"),
  };
}

export function buildTrackingEmail(order: Order, market: Market, trackingNumber: string) {
  const subject =
    market === "HU"
      ? "Csomag kovetesi szam - rendelese"
      : "Numar urmarire colet - comanda dumneavoastra";
  const content = `
    <h1 style="margin:0 0 10px 0;font-size:26px;">${market === "HU" ? "A csomag uton van" : "Coletul este in drum spre dvs."}</h1>
    <p style="margin:0 0 10px 0;color:#374151;">
      ${market === "HU" ? "Kovetesi szam:" : "Numar de urmarire:"}
      <strong style="font-size:18px;color:#6f2147;"> ${trackingNumber}</strong>
    </p>
    <p style="margin:0 0 12px 0;color:#374151;">${market === "HU" ? "Szallitasi cim:" : "Adresa de livrare:"}</p>
    <div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;white-space:pre-line;">${order.deliveryAddress}</div>
    ${footer(market)}
  `;
  return {
    subject,
    html: htmlShell(content, market),
    text: `${market === "HU" ? "Kovetesi szam" : "Numar urmarire"}: ${trackingNumber}\n${order.deliveryAddress}`,
  };
}

export function buildInternalOrderAlertEmail(order: Order, market: Market) {
  const currency = marketCurrency(market);
  const nr = formatOrderNumber(order.orderNumber);
  const statusLabel = order.status;
  const subject = `Nová objednávka #${nr} (${siteName(market)})`;
  const content = `
    <h1 style="margin:0 0 10px 0;font-size:28px;line-height:1.2;">Nová objednávka #${nr}</h1>
    <p style="margin:0 0 12px 0;color:#374151;">Přišla nová objednávka z webu <strong>${siteName(market)}</strong>.</p>
    <div style="border:1px solid #e8dbe3;border-radius:14px;overflow:hidden;background:#fff;">
      <div style="padding:11px 14px;background:#fff2f8;border-bottom:1px solid #f0e2ea;font-weight:700;color:#6f2147;font-size:13px;letter-spacing:.05em;text-transform:uppercase;">
        Detail objednávky
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
        ${summaryRow("Klient", order.customerName, "👤")}
        ${summaryRow("E-mail", order.email, "✉️")}
        ${summaryRow("Telefon", order.phone, "📞")}
        ${summaryRow("Produkt", PRODUCT_NAME, "📦")}
        ${summaryRow("Množství", String(order.quantity), "🔢")}
        ${summaryRow("Doprava", shippingLabel(order), "🚚")}
        ${summaryRow("Platba", paymentLabel(order.paymentMethod, market), "💳")}
        ${summaryRow("Celkem", `${order.totalPrice} ${currency}`, "💰")}
        ${summaryRow("Stav", statusLabel, "🧾")}
      </table>
    </div>
    ${addressSummary(order, market).html}
    ${footer(market)}
  `;
  const text = [
    `Nová objednávka #${nr}`,
    `Web: ${siteName(market)}`,
    `Klient: ${order.customerName}`,
    `E-mail: ${order.email}`,
    `Telefon: ${order.phone}`,
    `Produkt: ${PRODUCT_NAME} x${order.quantity}`,
    `Doprava: ${shippingLabel(order)}`,
    `Platba: ${paymentLabel(order.paymentMethod, market)}`,
    `Celkem: ${order.totalPrice} ${currency}`,
    `Stav: ${statusLabel}`,
    `Doručovací adresa: ${order.deliveryAddress}`,
    `Fakturační adresa: ${order.billingAddress}`,
  ].join("\n");
  return { subject, html: htmlShell(content, market), text };
}
