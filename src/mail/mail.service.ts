import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface PaymentConfirmationParams {
  to: string;
  customerName: string;
  orderId: string;
  confirmationCode: string;
  total: number;
  currency: string;

  items: {
    name: string;
    quantity: number;
    date: string;
    unitPrice: number;
    totalPrice: number;
  }[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly http: HttpService) {}

  // ============================================================================
  // CLIENTE LOGUEADO
  // ============================================================================
  async sendPaymentConfirmation(
    params: PaymentConfirmationParams,
  ): Promise<void> {
    try {
      // HTML ADMIN (logueado)
      const adminHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Nueva Orden</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" style="background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.06);" cellpadding="0" cellspacing="0">

          <tr>
            <td style="background:#111827;color:white;padding:24px 28px;">
              <h2 style="margin:0;font-size:22px;">Nueva Orden Registrada</h2>
              <p style="margin:6px 0 0;font-size:14px;">Usuario Logueado</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px;font-size:15px;color:#111827;line-height:1.6;">
              <p><strong>Cliente:</strong> ${params.customerName}</p>
              <p><strong>Email:</strong> ${params.to}</p>
              <p><strong>ID Orden:</strong> ${params.orderId}</p>
              <p><strong>Código de Reserva:</strong> ${params.confirmationCode}</p>
              <p><strong>Total:</strong> ${params.total} ${params.currency}</p>
              <p><strong>Fecha de Registro:</strong> ${new Date().toLocaleString()}</p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:14px;text-align:center;font-size:13px;color:#6b7280;">
              Sistema Automático – Inca Travel Peru
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

      // Enviar correo usando Brevo
      await this.http.axiosRef.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            email: process.env.MAIL_FROM || 'reservas.incatravelperu@gmail.com',
            name: 'Inca Travel Peru',
          },

          // Requeridos por Brevo
          subject: 'Notificación',
          htmlContent: '<p>Notificación base</p>',

          messageVersions: [
            // =================== CLIENTE ===================
            {
              to: [{ email: params.to, name: params.customerName }],
              subject: 'Pago confirmado - Inca Travel Peru',
              htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Pago Confirmado</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0px 4px 10px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#0d9488;padding:28px 24px;text-align:center;color:white;">
              <h1 style="margin:0;font-size:26px;">Pago Confirmado</h1>
              <p style="margin:8px 0 0;font-size:15px;">Gracias por confiar en Inca Travel Peru</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#111827;font-size:15px;line-height:1.6;">
              <p>Hola <strong>${params.customerName}</strong>,</p>

              <p>Tu pago ha sido procesado exitosamente. Aquí tienes tu código de reserva:</p>

              <div style="text-align:center;margin:22px 0;">
                <span style="display:inline-block;font-size:24px;font-weight:bold;background:#f1f5f9;padding:14px 28px;border-radius:8px;border:1px solid #e5e7eb;">
                  ${params.confirmationCode}
                </span>
              </div>

              <p style="text-align:center;">
                <a href="https://incatravelperu.com/reservas/${params.confirmationCode}" 
                   style="background:#0d9488;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-size:15px;display:inline-block;">
                  Ver mi reserva
                </a>
              </p>

              <p>En breve nuestro equipo se comunicará contigo para coordinar los detalles de tu experiencia.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px;text-align:center;font-size:13px;color:#6b7280;">
              © ${new Date().getFullYear()} Inca Travel Peru — Todos los derechos reservados.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
            },

            // =================== ADMIN ===================
            {
              to: [
                {
                  email: 'reservas.incatravelperu@gmail.com',
                  name: 'Administrador',
                },
              ],
              subject: 'NUEVA ORDEN REGISTRADA – Inca Travel Peru',
              htmlContent: adminHtml,
            },
          ],
        },

        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error('Error enviando email de confirmación', error);
      throw error;
    }
  }

  // ============================================================================
  // CLIENTE INVITADO
  // ============================================================================
  async sendGuestPaymentConfirmation(
    params: PaymentConfirmationParams,
  ): Promise<void> {
    try {
      const itemsRows = params.items
        .map(
          (i) => `
<tr style="border-bottom:1px solid #e5e7eb;">
  <td>${i.name}</td>
  <td align="center">${i.quantity}</td>
  <td align="center">${i.date}</td>
  <td align="right">${i.unitPrice} ${params.currency}</td>
  <td align="right">${i.totalPrice} ${params.currency}</td>
</tr>
`,
        )
        .join('');

      const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Nueva Orden Invitado</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:#111827;color:white;padding:24px 28px;">
              <h2 style="margin:0;font-size:22px;">Nueva Orden Registrada</h2>
              <p style="margin:6px 0 0;font-size:14px;">Usuario Invitado</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px;font-size:15px;color:#111827;line-height:1.6;">
              <p><strong>Cliente:</strong> ${params.customerName}</p>
              <p><strong>Email:</strong> ${params.to}</p>
              <p><strong>ID Orden:</strong> ${params.orderId}</p>
              <p><strong>Código de Reserva:</strong> ${params.confirmationCode}</p>
              <p><strong>Total:</strong> ${params.total} ${params.currency}</p>

              <h3 style="margin:20px 0 8px;">Items:</h3>
              <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;">
                <tr style="background:#f9fafb;">
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Fecha</th>
                  <th>P.Unit</th>
                  <th>Total</th>
                </tr>
                ${itemsRows}
              </table>

              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

      await this.http.axiosRef.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            email: process.env.MAIL_FROM || 'reservas.incatravelperu@gmail.com',
            name: 'Inca Travel Peru',
          },
          subject: 'Notificación',
          htmlContent: '<p>Notificación</p>',

          messageVersions: [
            // CLIENTE INVITADO
            {
              to: [{ email: params.to, name: params.customerName }],
              subject: 'Pago confirmado – Tu reserva Inca Travel Peru',
              htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Pago Confirmado</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%">
    <tr>
      <td align="center" style="padding:24px;">

        <table width="600" cellpadding="0" cellspacing="0"
          style="background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:#0d9488;color:white;padding:26px;text-align:center;">
              <h2 style="margin:0;font-size:24px;">Pago Confirmado</h2>
              <p style="margin:4px 0 0;font-size:14px;">Gracias por tu compra</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px;font-size:15px;color:#111827;line-height:1.6;">
              <p>Hola <strong>${params.customerName}</strong>,</p>
              <p>Aquí tienes tu código de reserva:</p>

              <div style="text-align:center;margin:20px 0;">
                <span style="font-size:22px;font-weight:bold;padding:12px 26px;background:#f1f5f9;border-radius:8px;border:1px solid #e5e7eb;">
                  ${params.confirmationCode}
                </span>
              </div>

              <p><strong>Total Pagado:</strong> ${params.total} ${params.currency}</p>

              <h3 style="margin-top:24px;font-size:18px;">Detalles de tu Compra</h3>
              <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;">
                <tr style="background:#f9fafb;">
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Fecha</th>
                  <th>P. Unit</th>
                  <th>Total</th>
                </tr>

                ${itemsRows}
              </table>

            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:14px;text-align:center;font-size:13px;color:#6b7280;">
              © ${new Date().getFullYear()} Inca Travel Peru — Todos los derechos reservados.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
            },

            // ADMIN
            {
              to: [{ email: 'reservas.incatravelperu@gmail.com' }],
              subject: 'NUEVA ORDEN REGISTRADA – Invitado',
              htmlContent: adminHtml,
            },
          ],
        },

        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error('Error enviando email de invitado', error);
      throw error;
    }
  }
}
