

## Plan: Add Google Apps Script Webhook + PDF Storage

### What this does
After the email is sent and PDF is generated, the edge function will:
1. Upload the PDF to Supabase Storage (a new `quote-pdfs` bucket) to get a public URL
2. Send the lead data + PDF URL to your Google Apps Script webhook, which handles writing to Google Sheets and uploading to Google Drive

### Data contract sent to Google Apps Script
```json
{
  "source": "configurator",
  "submission_id": "<uuid>",
  "submitted_at": "2026-04-13T12:00:00.000Z",
  "name": "Jan Janssens",
  "email": "jan@example.com",
  "phone": "+32 470 00 00 00",
  "pdf_url": "https://.../storage/v1/object/public/quote-pdfs/xxx.pdf"
}
```

### Changes

**1. Database migration — create `quote-pdfs` storage bucket**
- Public bucket so the Google Apps Script can download the PDF

**2. `supabase/functions/send-quote/index.ts`**
- After PDF generation, upload PDF bytes to the `quote-pdfs` bucket using the Supabase service role key
- Construct the public URL for the uploaded PDF
- Add a new webhook call (alongside the existing Odoo one) to `https://script.google.com/macros/s/AKfycbxsuNmhj3Gi49hty57x4H_e5duGeUnXirsrVpRzBYNy6xkJxkOPp8VoZAjgcM2N_nsT/exec` with the data contract above
- Generate a unique `submission_id` using `crypto.randomUUID()`
- The Odoo webhook remains untouched

### Technical details
- The PDF upload uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (both already configured as secrets) to call the Storage API directly via REST
- The webhook call is fire-and-forget (wrapped in try/catch, won't block the response)
- If PDF generation failed, `pdf_url` will be sent as an empty string

