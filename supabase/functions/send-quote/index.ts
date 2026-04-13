import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LineItem {
  name: string;
  option: string;
  price: number | null;
}

interface QuoteRequest {
  lineItems: LineItem[];
  totalPrice: number;
  contact: { fullName: string; email: string; phone: string };
  model: string;
}

function fmt(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}

// ── HTML Email ──
function buildHtmlEmail(data: QuoteRequest): string {
  const rows = data.lineItems
    .map((item) => {
      const isIndented = item.name.startsWith("  ");
      const name = isIndented ? `<span style="padding-left:16px;color:#777">↳ ${item.name.trim()}</span>` : item.name;
      const priceCell = item.price !== null
        ? `<td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:14px;color:#333;text-align:right;white-space:nowrap">${fmt(item.price)}</td>`
        : `<td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#bbb;text-align:right">—</td>`;
      return `<tr>
        <td style="padding:${isIndented ? "6px" : "10px"} 14px;border-bottom:1px solid #e5e5e5;font-size:${isIndented ? "13" : "14"}px">${name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:14px;color:#555">${item.option}</td>
        ${priceCell}
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:640px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:#5c6b6a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">Configuratie Overzicht</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${data.model}</p>
    </div>
    <div style="padding:20px 32px;background:#f9fafb;border-bottom:1px solid #e5e5e5">
      <p style="margin:0;font-size:13px;color:#888">Klantgegevens</p>
      <p style="margin:6px 0 0;font-size:15px;color:#333;font-weight:500">${data.contact.fullName}</p>
      <p style="margin:2px 0;font-size:14px;color:#555">${data.contact.email}</p>
      ${data.contact.phone ? `<p style="margin:2px 0;font-size:14px;color:#555">${data.contact.phone}</p>` : ""}
    </div>
    <div style="padding:24px 32px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f0f0f0">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Onderdeel</th>
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Keuze</th>
          <th style="padding:10px 14px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Prijs</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="2" style="padding:14px;font-size:16px;font-weight:700;color:#333;border-top:2px solid #333">Totaal (excl. BTW)</td>
          <td style="padding:14px;font-size:16px;font-weight:700;color:#333;text-align:right;border-top:2px solid #333;white-space:nowrap">${fmt(data.totalPrice)}</td>
        </tr></tfoot>
      </table>
    </div>
    <div style="padding:20px 32px;background:#f9fafb;text-align:center">
      <p style="margin:0;font-size:12px;color:#999">Automatisch gegenereerde prijsindicatie · Onder voorbehoud van finale configuratie</p>
    </div>
  </div>
</body></html>`;
}

// ── PDF Generation with pdf-lib ──
async function generatePdf(data: QuoteRequest): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28; // A4
  const pageH = 841.89;
  const margin = 50;
  const colWidths = [180, 180, 100]; // name, option, price
  const rowH = 20;
  const headerColor = rgb(0.36, 0.42, 0.42); // #5c6b6a

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  // Header block
  page.drawRectangle({ x: 0, y: y - 30, width: pageW, height: 60, color: headerColor });
  page.drawText("Configuratie Overzicht", { x: margin, y: y - 10, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`${data.model} — ${new Date().toLocaleDateString("nl-BE")}`, { x: margin, y: y - 26, size: 10, font, color: rgb(0.85, 0.85, 0.85) });
  y -= 60;

  // Contact
  y -= 20;
  page.drawText("Klant:", { x: margin, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  page.drawText(data.contact.fullName, { x: margin, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(`${data.contact.email}${data.contact.phone ? "  ·  " + data.contact.phone : ""}`, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 24;

  // Table header
  const tableX = margin;
  page.drawRectangle({ x: tableX, y: y - 4, width: colWidths[0] + colWidths[1] + colWidths[2], height: 18, color: rgb(0.94, 0.94, 0.94) });
  page.drawText("ONDERDEEL", { x: tableX + 6, y: y, size: 8, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("KEUZE", { x: tableX + colWidths[0] + 6, y: y, size: 8, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("PRIJS", { x: tableX + colWidths[0] + colWidths[1] + colWidths[2] - 40, y: y, size: 8, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  y -= 22;

  // Table rows
  for (const item of data.lineItems) {
    if (y < margin + 40) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }

    const isIndented = item.name.startsWith("  ");
    const nameX = isIndented ? tableX + 18 : tableX + 6;
    const nameText = isIndented ? `> ${item.name.trim()}` : item.name;
    const nameColor = isIndented ? rgb(0.55, 0.55, 0.55) : rgb(0.2, 0.2, 0.2);
    const nameSize = isIndented ? 9 : 10;

    page.drawText(nameText, { x: nameX, y, size: nameSize, font, color: nameColor, maxWidth: colWidths[0] - 12 });
    page.drawText(item.option, { x: tableX + colWidths[0] + 6, y, size: 10, font, color: rgb(0.35, 0.35, 0.35), maxWidth: colWidths[1] - 12 });

    const priceText = item.price !== null ? fmt(item.price) : "—";
    const priceWidth = font.widthOfTextAtSize(priceText, 10);
    page.drawText(priceText, {
      x: tableX + colWidths[0] + colWidths[1] + colWidths[2] - priceWidth - 6,
      y,
      size: 10,
      font,
      color: item.price !== null ? rgb(0.2, 0.2, 0.2) : rgb(0.75, 0.75, 0.75),
    });

    // Separator line
    y -= 4;
    page.drawLine({ start: { x: tableX, y }, end: { x: tableX + colWidths[0] + colWidths[1] + colWidths[2], y }, thickness: 0.5, color: rgb(0.88, 0.88, 0.88) });
    y -= rowH - 4;
  }

  // Total row
  y -= 4;
  page.drawLine({ start: { x: tableX, y: y + 16 }, end: { x: tableX + colWidths[0] + colWidths[1] + colWidths[2], y: y + 16 }, thickness: 1.5, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Totaal (excl. BTW)", { x: tableX + 6, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  const totalText = fmt(data.totalPrice);
  const totalWidth = fontBold.widthOfTextAtSize(totalText, 12);
  page.drawText(totalText, { x: tableX + colWidths[0] + colWidths[1] + colWidths[2] - totalWidth - 6, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

  // Footer
  y -= 40;
  page.drawText("Automatisch gegenereerde prijsindicatie · Onder voorbehoud van finale configuratie", { x: tableX, y, size: 8, font, color: rgb(0.65, 0.65, 0.65) });

  return doc.save();
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const body: QuoteRequest = await req.json();
    const { lineItems, totalPrice, contact, model } = body;
    const submissionId = crypto.randomUUID();

    if (!contact?.email || !contact?.fullName || !lineItems?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlEmail = buildHtmlEmail(body);

    // Generate PDF
    let attachments: { filename: string; content: string }[] = [];
    let pdfBytes: Uint8Array | null = null;
    try {
      pdfBytes = await generatePdf(body);
      attachments = [{
        filename: `configuratie-${model.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        content: base64Encode(pdfBytes),
      }];
    } catch (e) {
      console.warn("PDF generation failed:", e);
    }

    // Encode PDF as base64 for webhook
    const pdfBase64 = pdfBytes ? base64Encode(pdfBytes) : "";

    const resendPayload: Record<string, unknown> = {
      from: "BLOQ Configurator <configurator@congristruct.be>",
      to: ["levi.soubry@gmail.com", "warre@congristruct.be"],
      reply_to: contact.email,
      subject: `Nieuwe configuratie — ${model} — ${contact.fullName}`,
      html: htmlEmail,
      ...(attachments.length > 0 ? { attachments } : {}),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(resendPayload),
    });

    const resData = await res.json();
    if (!res.ok) throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(resData)}`);

    // Send to Odoo CRM webhook
    try {
      const configSummary = lineItems.map((i: LineItem) => `${i.name}: ${i.option}${i.price !== null ? ` (${fmt(i.price)})` : ""}`).join("\n");
      await fetch("https://congristruct-staging-29860488.dev.odoo.com/df_lead_webhook/incoming/GKWd-jEcmjO_wERGHF7qgnvpSoI22DlwM_tWEEr5VKQ", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "8535067df68fc6267e38346325aaca4b46f6c97071d48ab0c1512d2083c1f15f",
        },
        body: JSON.stringify({
          name: contact.fullName,
          email: contact.email,
          phone: contact.phone || "",
          message: `Configuratie: ${model}\n\n${configSummary}\n\nTotaal (excl. BTW): ${fmt(totalPrice)}`,
          form_type: "configurator",
          source: "configurator",
        }),
      });
    } catch (e) {
      console.warn("Odoo webhook failed:", e);
    }

    // Send to Google Apps Script webhook (Sheets + Drive)
    try {
      await fetch("https://script.google.com/macros/s/AKfycbxsuNmhj3Gi49hty57x4H_e5duGeUnXirsrVpRzBYNy6xkJxkOPp8VoZAjgcM2N_nsT/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "configurator",
          submission_id: submissionId,
          submitted_at: new Date().toISOString(),
          name: contact.fullName,
          email: contact.email,
          phone: contact.phone || "",
          pdf_base64: pdfBase64,
        }),
      });
    } catch (e) {
      console.warn("Google Apps Script webhook failed:", e);
    }

    return new Response(JSON.stringify({ success: true, emailId: resData.id, hasPdf: attachments.length > 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending quote:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
