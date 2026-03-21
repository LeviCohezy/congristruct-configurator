import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LineItem {
  name: string;
  option: string;
  price: number;
}

interface QuoteRequest {
  lineItems: LineItem[];
  totalPrice: number;
  contact: { fullName: string; email: string; phone: string };
  model: string;
}

function formatPrice(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}

function buildHtmlEmail(data: QuoteRequest): string {
  const rows = data.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:14px;color:#333">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:14px;color:#555">${item.option}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e5e5;font-size:14px;color:#333;text-align:right;white-space:nowrap">${formatPrice(item.price)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:#5c6b6a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">Configuratie Overzicht</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${data.model}</p>
    </div>

    <!-- Contact -->
    <div style="padding:20px 32px;background:#f9fafb;border-bottom:1px solid #e5e5e5">
      <p style="margin:0;font-size:13px;color:#888">Klantgegevens</p>
      <p style="margin:6px 0 0;font-size:15px;color:#333;font-weight:500">${data.contact.fullName}</p>
      <p style="margin:2px 0;font-size:14px;color:#555">${data.contact.email}</p>
      ${data.contact.phone ? `<p style="margin:2px 0;font-size:14px;color:#555">${data.contact.phone}</p>` : ""}
    </div>

    <!-- Table -->
    <div style="padding:24px 32px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Onderdeel</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Keuze</th>
            <th style="padding:10px 14px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px">Prijs</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px;font-size:16px;font-weight:700;color:#333;border-top:2px solid #333">Totaal (excl. BTW)</td>
            <td style="padding:14px;font-size:16px;font-weight:700;color:#333;text-align:right;border-top:2px solid #333;white-space:nowrap">${formatPrice(data.totalPrice)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;text-align:center">
      <p style="margin:0;font-size:12px;color:#999">Dit is een automatisch gegenereerde prijsindicatie · Onder voorbehoud van finale configuratie</p>
    </div>
  </div>
</body>
</html>`;
}

function buildPdfHtml(data: QuoteRequest): string {
  // Simplified HTML for PDF generation — same structure but print-friendly
  const rows = data.lineItems
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #ddd">${item.name}</td><td style="padding:8px 12px;border-bottom:1px solid #ddd">${item.option}</td><td style="padding:8px 12px;border-bottom:1px solid #ddd;text-align:right">${formatPrice(item.price)}</td></tr>`
    )
    .join("");

  return `<html><head><meta charset="utf-8"><style>
body{font-family:Helvetica,Arial,sans-serif;margin:40px;color:#333}
h1{color:#5c6b6a;font-size:24px;margin-bottom:4px}
.sub{color:#888;font-size:14px;margin-bottom:24px}
.contact{background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:24px;font-size:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 12px;background:#f0f0f0;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.5px}
th:last-child{text-align:right}
tfoot td{border-top:2px solid #333;font-weight:bold;font-size:15px;padding:12px}
.footer{margin-top:32px;font-size:11px;color:#999;text-align:center}
</style></head><body>
<h1>Configuratie Overzicht</h1>
<p class="sub">${data.model}</p>
<div class="contact">
  <strong>${data.contact.fullName}</strong><br>
  ${data.contact.email}${data.contact.phone ? `<br>${data.contact.phone}` : ""}
</div>
<table>
  <thead><tr><th>Onderdeel</th><th>Keuze</th><th style="text-align:right">Prijs</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="2">Totaal (excl. BTW)</td><td style="text-align:right">${formatPrice(data.totalPrice)}</td></tr></tfoot>
</table>
<p class="footer">Automatisch gegenereerde prijsindicatie · Onder voorbehoud van finale configuratie</p>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body: QuoteRequest = await req.json();
    const { lineItems, totalPrice, contact, model } = body;

    if (!contact?.email || !contact?.fullName || !lineItems?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlEmail = buildHtmlEmail(body);

    // Send email via Resend with HTML body
    const resendPayload: Record<string, unknown> = {
      from: "BLOQ Configurator <configurator@congristruct.be>",
      to: ["levi.soubry@gmail.com"],
      reply_to: contact.email,
      subject: `Nieuwe configuratie — ${model} — ${contact.fullName}`,
      html: htmlEmail,
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend API error [${resendResponse.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending quote:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
