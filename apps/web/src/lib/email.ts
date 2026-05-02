import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = "Para Leczy <noreply@paraleczy.pl>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://paraleczy.pl"

export async function sendProgramAssignedEmail(params: {
  toEmail: string
  patientName: string
  programName: string
  accessCode: string
  practitionerName: string
}) {
  const link = `${APP_URL}/p/${params.accessCode}`

  await resend.emails.send({
    from: FROM,
    to: params.toEmail,
    subject: `Nowy program ćwiczeń: ${params.programName}`,
    html: buildProgramEmail({ ...params, link }),
  })
}

function buildProgramEmail(p: {
  patientName: string
  programName: string
  practitionerName: string
  link: string
}) {
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a5f;padding:28px 32px">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px">Para Leczy</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:13px">Program ćwiczeń fizjoterapeutycznych</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:15px;color:#374151">Cześć, <strong>${p.patientName}</strong>!</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
              Twój fizjoterapeuta <strong>${p.practitionerName}</strong> przypisał Ci nowy program ćwiczeń.
            </p>

            <!-- Program name badge -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-bottom:28px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:.5px">Program</p>
              <p style="margin:0;font-size:17px;font-weight:700;color:#1e3a5f">${p.programName}</p>
            </div>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${p.link}"
                     style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.1px">
                    Otwórz program ćwiczeń →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5">
              Jeśli przycisk nie działa, skopiuj ten link:<br>
              <a href="${p.link}" style="color:#3b82f6;word-break:break-all">${p.link}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
              Para Leczy — Mgr Wojciech Dymek · Fizjoterapia
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
