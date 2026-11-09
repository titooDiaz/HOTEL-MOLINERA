// Envío de correos del sistema (por ahora, los códigos de verificación en dos pasos).
const nodemailer = require('nodemailer');

let transporter;

// Creamos el transporte SMTP una sola vez, la primera vez que se necesite.
function getTransporter() {
    if (transporter !== undefined) return transporter;
    if (!process.env.SMTP_HOST) {
        transporter = null;
        return transporter;
    }
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        // El puerto 465 usa TLS directo; el 587 negocia TLS después de conectar.
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined
    });
    return transporter;
}

// Los datos del usuario se insertan en HTML, así que escapamos los caracteres especiales.
const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function sendVerificationCode({ to, code, minutes, purpose }) {
    const hotelName = process.env.HOTEL_NAME || 'Hotel Molinera';
    const reason = purpose === 'enable'
        ? 'activar la verificación en dos pasos'
        : 'iniciar sesión';
    const subject = `${code} es tu código de verificación de ${hotelName}`;
    const text = [
        `Tu código para ${reason} en ${hotelName} es: ${code}`,
        '',
        `Vence en ${minutes} minutos. No lo compartas con nadie.`,
        'Si no fuiste tú, ignora este mensaje y cambia tu contraseña.'
    ].join('\n');
    const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
            <h2 style="margin:0 0 12px">${escapeHtml(hotelName)}</h2>
            <p>Tu código para ${escapeHtml(reason)} es:</p>
            <p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:16px 0">${escapeHtml(code)}</p>
            <p>Vence en ${minutes} minutos. No lo compartas con nadie.</p>
            <p style="color:#777;font-size:13px">Si no fuiste tú, ignora este mensaje y cambia tu contraseña.</p>
        </div>`;

    const mailTransport = getTransporter();
    if (!mailTransport) {
        // Sin SMTP configurado solo permitimos mostrar el código en consola fuera de producción.
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SMTP_HOST no está configurado: no se puede enviar el código de verificación.');
        }
        console.log(`[DESARROLLO] Código de verificación para ${to}: ${code}`);
        return;
    }
    await mailTransport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html
    });
}

async function sendContactMessage({ to, name, email, subject, message }) {
    const mailTransport = getTransporter();
    if (!mailTransport) {
        throw new Error('SMTP_HOST no está configurado: no se puede enviar el mensaje de contacto.');
    }

    const hotelName = process.env.HOTEL_NAME || 'Hotel Molinera';
    const text = [
        `Nuevo mensaje de contacto para ${hotelName}`,
        '',
        `Nombre: ${name}`,
        `Correo: ${email}`,
        `Asunto: ${subject}`,
        '',
        message
    ].join('\n');
    const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:24px;color:#222">
            <h2 style="margin:0 0 16px">${escapeHtml(hotelName)}: nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
            <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
            <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>`;

    await mailTransport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        replyTo: email,
        subject: `Nuevo mensaje de contacto - ${subject}`,
        text,
        html
    });
}

module.exports = { sendVerificationCode, sendContactMessage };
