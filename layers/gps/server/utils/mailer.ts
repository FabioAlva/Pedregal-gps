import type { SpeedAlertInfo } from '../schemas/ISpeedAlertInfo'

export const sendAlertEmail = async (info: SpeedAlertInfo) => {
  const brevo = useBrevo()

  const config = useRuntimeConfig()

  const mapsUrl = `https://www.google.com/maps?q=${info.lat},${info.lng}`

  const htmlContent = `
<div style="max-width:580px;margin:0 auto;font-family:Arial,sans-serif;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
  <div style="background:#A32D2D;padding:24px 32px;">
    <p style="margin:0;color:#F7C1C1;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Sistema de Operaciones</p>
    <p style="margin:0;color:white;font-size:17px;font-weight:600;">Alerta de velocidad excesiva</p>
  </div>
  <div style="padding:24px 32px;background:#ffffff;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <div style="background:#f5f5f5;border-radius:8px;padding:12px 16px;">
        <p style="margin:0 0 2px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Placa</p>
        <p style="margin:0;font-size:20px;font-weight:600;letter-spacing:0.05em;color:#111;">${info.placa}</p>
      </div>
      <div style="background:#FCEBEB;border-radius:8px;padding:12px 16px;">
        <p style="margin:0 0 2px;font-size:11px;color:#A32D2D;text-transform:uppercase;letter-spacing:0.06em;">Velocidad registrada</p>
        <p style="margin:0;font-size:20px;font-weight:600;color:#A32D2D;">${info.speed} km/h</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="border-bottom:1px solid #e5e5e5;">
        <td style="padding:10px 14px;color:#888;width:40%;">Unidad (ID)</td>
        <td style="padding:10px 14px;color:#111;font-weight:600;">${info.deviceId}</td>
      </tr>
      <tr style="border-bottom:1px solid #e5e5e5;">
        <td style="padding:10px 14px;color:#888;">Coordenadas</td>
        <td style="padding:10px 14px;color:#111;font-weight:600;">${info.lat}, ${info.lng}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;color:#888;">Hora del evento</td>
        <td style="padding:10px 14px;color:#111;font-weight:600;">${new Date(info.time).toLocaleString()}</td>
      </tr>
    </table>
    <a href="${mapsUrl}" style="display:block;text-align:center;background:#185FA5;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;">Ver ubicación en Google Maps</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #e5e5e5;background:#fafafa;">
    <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">Mensaje generado automáticamente. No responder a este correo.</p>
  </div>
</div>`

  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: { email: config.alerts.emailSender },
      to: [{ email: config.alerts.emailRecipient }],
      subject: `🚨 Exceso: ${info.speed} km/h - ${info.placa}`,
      htmlContent
    })
    return response
  
  }catch (error: any) {
    console.error(
      ' !------Error enviando alerta:---!',
      error.response?.body || error.message
    )
    throw error
  }
}
