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
      const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Nueva Orden</title></head>
<body>
  <h2>Nueva orden registrada (Usuario Logueado)</h2>

  <p><strong>Cliente:</strong> ${params.customerName}</p>
  <p><strong>Email:</strong> ${params.to}</p>

  <p><strong>ID Orden:</strong> ${params.orderId}</p>
  <p><strong>Código de reserva:</strong> ${params.confirmationCode}</p>
  <p><strong>Total:</strong> ${params.total} ${params.currency}</p>

  <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>

  <hr />
  <p>Notificación automática del sistema Inca Travel Peru.</p>
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

          // ✔ Obligatorios para Brevo (pero no para enviar)
          subject: 'Notificación de Pago',
          htmlContent: '<p>Notificación</p>',

          // ❗ IMPORTANTE: NO enviar "to" en el root
          // to: [],  ← ELIMINADO

          messageVersions: [
            // =================== CLIENTE ===================
            {
              to: [{ email: params.to, name: params.customerName }],
              subject: 'Pago confirmado - Inca Travel Peru',
              htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Pago Confirmado</title></head>
<body>
  <h2>Pago Confirmado</h2>
  <p>Hola <strong>${params.customerName}</strong>, tu pago fue procesado correctamente.</p>

  <p>Código de reserva:</p>
  <h1>${params.confirmationCode}</h1>

  <p><a href="https://incatravelperu.com/reservas/${params.confirmationCode}">Ver mi reserva</a></p>

  <p>Gracias por confiar en nosotros.</p>
</body>
</html>
`,
            },

            // =================== ADMINISTRADOR ===================
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
          (item) => `
<tr>
  <td>${item.name}</td>
  <td>${item.quantity}</td>
  <td>${item.date}</td>
  <td>${item.unitPrice} ${params.currency}</td>
  <td>${item.totalPrice} ${params.currency}</td>
</tr>`,
        )
        .join('');

      const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Nueva Orden Invitado</title></head>
<body>

  <h2>Nueva orden registrada (Invitado)</h2>

  <p><strong>Cliente:</strong> ${params.customerName}</p>
  <p><strong>Email:</strong> ${params.to}</p>

  <p><strong>ID Orden:</strong> ${params.orderId}</p>
  <p><strong>Código de reserva:</strong> ${params.confirmationCode}</p>
  <p><strong>Total:</strong> ${params.total} ${params.currency}</p>

  <h3>Items:</h3>
  <table border="1" cellpadding="6">
    <tr>
      <th>Producto</th>
      <th>Cant.</th>
      <th>Fecha</th>
      <th>P. Unit</th>
      <th>Total</th>
    </tr>
    ${itemsRows}
  </table>

  <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>

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

          subject: 'Notificación de Pago',
          htmlContent: '<p>Notificación</p>',

          // ❗ No enviar "to" a nivel root
          // to: [],

          messageVersions: [
            // =================== CLIENTE INVITADO ===================
            {
              to: [{ email: params.to, name: params.customerName }],
              subject: 'Pago confirmado – Tu reserva Inca Travel Peru',
              htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Pago Confirmado</title></head>
<body>
  <h2>Pago Confirmado</h2>

  <p>Hola <strong>${params.customerName}</strong>,</p>

  <p>Código de reserva:</p>
  <h1>${params.confirmationCode}</h1>

  <p><strong>Total:</strong> ${params.total} ${params.currency}</p>

  <h3>Detalles de compra</h3>
  <table border="1" cellpadding="6">
    <tr>
      <th>Producto</th>
      <th>Cant.</th>
      <th>Fecha</th>
      <th>P. Unit</th>
      <th>Total</th>
    </tr>
    ${itemsRows}
  </table>

</body>
</html>
`,
            },

            // =================== ADMINISTRADOR ===================
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
