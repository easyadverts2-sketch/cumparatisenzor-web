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
  if (order.shippingCarrier === "PACKETA") return "DPD";
  if (order.shippingCarrier === "FINESHIP") return "Fineship";
  return "PPL";
}

function htmlShell(content: string, market: Market) {
  const logo = `${siteUrl(market)}/logo.png`;
  return `
  <div style="background:#f7f7fb;padding:28px 12px;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ead5df;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6f2147,#a22d53,#df5b42);padding:20px 24px;">
        <img src="${logo}" alt="${siteName(market)}" style="height:42px;width:auto;display:block;background:#fff;border-radius:10px;padding:6px 10px;" />
      </div>
      <div style="padding:24px;">
        ${content}
      </div>
    </div>
  </div>`;
}

function footer(market: Market) {
  return market === "HU"
    ? `<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;">
         Kerdes eseten barmikor irjon nekunk:<br/>
         Email: <a href="mailto:info@cumparatisenzor.ro">info@cumparatisenzor.ro</a><br/>
         Telefon/WhatsApp: <a href="tel:+420777577352">+420 777 577 352</a>
       </p>`
    : `<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;">
         Daca aveti nevoie de ajutor, ne puteti contacta oricand:<br/>
         Email: <a href="mailto:info@cumparatisenzor.ro">info@cumparatisenzor.ro</a><br/>
         Telefon/WhatsApp: <a href="tel:+420777577352">+420 777 577 352</a>
       </p>`;
}

export function buildOrderCreatedEmail(order: Order, market: Market, variableSymbol?: string | null) {
  const subject =
    market === "HU" ? "Koszonjuk a rendeleset" : "Va multumim pentru comanda";
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

  const content = `
    <h1 style="margin:0 0 10px 0;font-size:28px;line-height:1.2;">${greeting}</h1>
    <p style="margin:0 0 16px 0;color:#374151;">${market === "HU" ? "Rendeleset rogzitettuk." : "Comanda a fost inregistrata cu succes."}</p>
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
      <div style="font-size:14px;line-height:1.7;">
        <strong>${market === "HU" ? "Rendelesszam" : "Numar comanda"}:</strong> #${nr}<br/>
        <strong>${market === "HU" ? "Termek" : "Produs"}:</strong> ${PRODUCT_NAME}<br/>
        <strong>${market === "HU" ? "Mennyiseg" : "Cantitate"}:</strong> ${order.quantity}<br/>
        <strong>${market === "HU" ? "Szallitas" : "Livrare"}:</strong> ${shippingLabel(order)}<br/>
        <strong>${market === "HU" ? "Fizetes" : "Plata"}:</strong> ${paymentLabel(order.paymentMethod, market)}<br/>
        <strong>${market === "HU" ? "Vegosszeg" : "Total"}:</strong> ${order.totalPrice} ${currency}
      </div>
    </div>
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
    order.paymentMethod === "BANK_TRANSFER"
      ? `IBAN: ${bank.iban}; BIC: ${bank.bic}; ${market === "HU" ? "Valtozo szam" : "Variabila"}: ${variableSymbol || "-"}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text, html: htmlShell(content, market) };
}

export function buildPaymentReceivedEmail(order: Order, market: Market) {
  const subject =
    market === "HU" ? "Koszonjuk a befizetest" : "Va multumim pentru plata";
  const message =
    market === "HU"
      ? "Befizeteset megerositettuk. Csomagjat az alabbi cimre kuldjuk:"
      : "Plata a fost confirmata. Expediem coletul la adresa:";
  const content = `
    <h1 style="margin:0 0 10px 0;font-size:28px;line-height:1.2;">${market === "HU" ? "Koszonjuk a befizetest!" : "Va multumim pentru plata!"}</h1>
    <p style="margin:0 0 12px 0;color:#374151;">${message}</p>
    <div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;white-space:pre-line;">${order.deliveryAddress}</div>
    ${footer(market)}
  `;

  return {
    subject,
    html: htmlShell(content, market),
    text: `${message}\n${order.deliveryAddress}`,
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
