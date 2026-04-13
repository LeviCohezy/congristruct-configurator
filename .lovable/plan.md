

## Plan: Fix PDF generation + empty `pdf_url`

### Root cause
The `↳` Unicode character (U+21B3) is used in the PDF for indented sub-items. The standard Helvetica font in `pdf-lib` only supports WinAnsi encoding and cannot render this character, causing PDF generation to crash.

### Fix

**`supabase/functions/send-quote/index.ts`**
- Replace `↳` with a WinAnsi-safe alternative like `>` or `- ` in the `generatePdf` function (line ~170 area)
- Change: `const nameText = isIndented ? \`> ${item.name.trim()}\` : item.name;`
- This fixes PDF generation, which means the PDF will be uploaded to storage and the `pdf_url` will be populated correctly in the Google Apps Script webhook payload

That's it — one character change fixes the entire chain (PDF → upload → webhook URL).

