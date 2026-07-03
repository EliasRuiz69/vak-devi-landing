type BookingData = {
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  mensaje: string;
  disponibilidad: string;
};

export function therapistEmailHtml(data: BookingData) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nueva solicitud de sesión</title>
</head>
<body style="margin:0;padding:0;background:#F5F0FA;font-family:'Georgia',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(43,18,48,0.08);">

          <tr>
            <td style="background:#8B1EA0;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;letter-spacing:6px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Vāk Devi</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:1px;">
                Nueva solicitud de sesión
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;font-size:15px;color:#2A1230;line-height:1.7;">
                Alguien ha solicitado una sesión exploratoria gratuita. Aquí están sus datos:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                     style="border-collapse:collapse;font-size:14px;color:#2A1230;">
                ${row("Nombre", data.nombre)}
                ${row("Email", `<a href="mailto:${data.email}" style="color:#8B1EA0;">${data.email}</a>`)}
                ${row("Teléfono", data.telefono)}
                ${row("Servicio solicitado", data.servicio)}
                ${row("Disponibilidad horaria", data.disponibilidad)}
                ${data.mensaje ? row("Mensaje", data.mensaje, true) : ""}
              </table>

              <div style="margin-top:32px;text-align:center;">
                <a href="mailto:${data.email}?subject=Tu sesión exploratoria en Vāk Devi&body=Hola ${encodeURIComponent(data.nombre)},"
                   style="display:inline-block;background:#8B1EA0;color:#ffffff;font-size:13px;letter-spacing:2px;
                          text-decoration:none;padding:14px 32px;border-radius:40px;">
                  Responder a ${data.nombre}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px;border-top:1px solid #F5F0FA;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9B4DAB;letter-spacing:1px;">
                © ${new Date().getFullYear()} Vāk Devi — Mérida, México
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function userConfirmationHtml(data: BookingData) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hemos recibido tu solicitud</title>
</head>
<body style="margin:0;padding:0;background:#F5F0FA;font-family:'Georgia',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(43,18,48,0.08);">

          <tr>
            <td style="background:#8B1EA0;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;letter-spacing:6px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Vāk Devi</p>
              <h1 style="margin:12px 0 0;font-size:24px;font-weight:400;color:#ffffff;font-style:italic;line-height:1.4;">
                Tu solicitud ha sido recibida
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#2A1230;line-height:1.8;">
                Hola, <strong>${data.nombre}</strong>.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#2A1230;line-height:1.9;">
                Gracias por dar este primer paso. Hemos recibido tu solicitud de sesión exploratoria
                y nos pondremos en contacto contigo a la brevedad para coordinar el mejor momento.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#2A1230;line-height:1.9;">
                Mientras tanto, recuerda que no necesitas tenerlo todo claro para comenzar —
                ese es precisamente el espacio que queremos ofrecerte.
              </p>

              <div style="background:#F5F0FA;border-radius:8px;padding:24px;margin-bottom:32px;">
                <p style="margin:0 0 12px;font-size:12px;letter-spacing:3px;color:#9B4DAB;text-transform:uppercase;">Resumen de tu solicitud</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                       style="font-size:13px;color:#2A1230;">
                  ${summaryRow("Servicio", data.servicio)}
                  ${summaryRow("Disponibilidad", data.disponibilidad)}
                </table>
              </div>

              <p style="margin:0;font-size:14px;color:#7B2D8B;font-style:italic;line-height:1.8;text-align:center;">
                Encuentra tu ser, habita tu vida.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px;border-top:1px solid #F5F0FA;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9B4DAB;letter-spacing:1px;">
                © ${new Date().getFullYear()} Vāk Devi — Mérida, México
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Appointment system emails ─────────────────────────────────────────────

type AppointmentNotifData = {
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  duracion: number;
  motivo?: string;
};

export function appointmentNotificationHtml(data: AppointmentNotifData) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F5F0FA;font-family:'Georgia',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0"
             style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(43,18,48,0.08);">
        <tr>
          <td style="background:#8B1EA0;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;letter-spacing:6px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Vāk Devi</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:400;color:#ffffff;">Nueva cita reservada</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 24px;font-size:15px;color:#2A1230;line-height:1.7;">
              Una nueva cita ha sido reservada en el sistema de agendado.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                   style="border-collapse:collapse;font-size:14px;color:#2A1230;">
              ${row("Cliente", data.nombre)}
              ${row("Email", `<a href="mailto:${data.email}" style="color:#8B1EA0;">${data.email}</a>`)}
              ${row("Teléfono", data.telefono)}
              ${row("Servicio", data.servicio)}
              ${row("Fecha", data.fecha)}
              ${row("Hora", `${data.hora} h (${data.duracion} min)`)}
              ${data.motivo ? row("Motivo", data.motivo, true) : ""}
            </table>
            <div style="margin-top:32px;text-align:center;">
              <a href="https://supabase.ervia.tech" style="display:inline-block;background:#8B1EA0;color:#ffffff;font-size:13px;letter-spacing:2px;text-decoration:none;padding:14px 32px;border-radius:40px;">
                Ver en panel de administración
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #F5F0FA;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9B4DAB;letter-spacing:1px;">© ${new Date().getFullYear()} Vāk Devi — Mérida, México</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type AppointmentConfirmData = {
  nombre: string;
  servicio: string;
  fecha: string;
  hora: string;
  duracion: number;
};

export function appointmentConfirmationHtml(data: AppointmentConfirmData) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F5F0FA;font-family:'Georgia',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0"
             style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(43,18,48,0.08);">
        <tr>
          <td style="background:#8B1EA0;padding:40px 40px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;letter-spacing:6px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Vāk Devi</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:400;color:#ffffff;font-style:italic;line-height:1.4;">
              Tu cita ha sido reservada
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#2A1230;line-height:1.8;">
              Hola, <strong>${data.nombre}</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#2A1230;line-height:1.9;">
              Gracias por dar este paso. Tu cita queda confirmada y te esperamos con mucho gusto.
            </p>

            <div style="background:#F5F0FA;border-radius:8px;padding:24px;margin-bottom:32px;">
              <p style="margin:0 0 16px;font-size:12px;letter-spacing:3px;color:#9B4DAB;text-transform:uppercase;">Resumen de tu cita</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                     style="font-size:14px;color:#2A1230;">
                ${summaryRow("Servicio", data.servicio)}
                ${summaryRow("Fecha", data.fecha)}
                ${summaryRow("Hora", `${data.hora} h`)}
                ${summaryRow("Duración", `${data.duracion} minutos`)}
                ${summaryRow("Terapeuta", "Ambar Escalante")}
              </table>
            </div>

            <p style="margin:0 0 16px;font-size:15px;color:#2A1230;line-height:1.9;font-weight:600;">
              Antes de tu sesión
            </p>
            <p style="margin:0 0 12px;font-size:14px;color:#2A1230;line-height:1.9;">
              No necesitas preparar nada especial. Llega o conéctate con una mente abierta — este espacio es para ti, desde donde estás hoy.
            </p>
            <p style="margin:0 0 32px;font-size:14px;color:#2A1230;line-height:1.9;">
              Si surge algún imprevisto o necesitas reprogramar tu cita, responde a este correo y con gusto lo resolvemos juntos.
            </p>

            <p style="margin:0;font-size:14px;color:#7B2D8B;font-style:italic;line-height:1.8;text-align:center;">
              Encuentra tu ser, habita tu vida.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #F5F0FA;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9B4DAB;letter-spacing:1px;">© ${new Date().getFullYear()} Vāk Devi — Mérida, México</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Old simple booking form emails ────────────────────────────────────────

function row(label: string, value: string, wrap = false) {
  return `<tr>
    <td style="padding:10px 16px 10px 0;vertical-align:top;white-space:nowrap;color:#7B2D8B;font-weight:600;width:180px;">${label}</td>
    <td style="padding:10px 0;vertical-align:top;color:#2A1230;${wrap ? "white-space:pre-wrap;" : ""}">${value}</td>
  </tr>`;
}

function summaryRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 16px 6px 0;color:#7B2D8B;font-weight:600;vertical-align:top;white-space:nowrap;">${label}:</td>
    <td style="padding:6px 0;color:#2A1230;">${value}</td>
  </tr>`;
}
