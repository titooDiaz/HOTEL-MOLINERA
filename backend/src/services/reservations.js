const PDFDocument = require('pdfkit');

const parseDate = (value) => new Date(`${value}T00:00:00.000Z`);

const isValidDateOnly = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = parseDate(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const getNights = (checkIn, checkOut) => Math.round((parseDate(checkOut) - parseDate(checkIn)) / 86400000);
const reservationTotal = (room, plan, nights) => Number(room.pricePerNight) * nights + Number(plan?.price || 0);
const paymentMethods = ['efectivo', 'tarjeta', 'transferencia', 'pago_movil'];
const toCents = (value) => Math.round(Number(value) * 100);

const formatStatementAmount = (value) => `Bs. ${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(value) || 0)}`;

const pdfToBuffer = (writeDocument) => new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
    writeDocument(document);
    document.end();
});

const writeStatementRow = (document, label, value, options = {}) => {
    const { bold = false, indent = 0 } = options;
    document.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        .text(label, 48 + indent, document.y, { continued: true, width: 380 - indent })
        .text(value, { align: 'right', width: 116 });
};

const getCancellationDeadline = (checkIn, checkInTime) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(checkInTime || '15:00'));
    const arrivalTime = match ? `${match[1]}:${match[2]}` : '15:00';
    return new Date(new Date(`${checkIn}T${arrivalTime}:00.000Z`).getTime() - 24 * 60 * 60 * 1000);
};

module.exports = {
    parseDate,
    isValidDateOnly,
    getNights,
    reservationTotal,
    paymentMethods,
    toCents,
    formatStatementAmount,
    pdfToBuffer,
    writeStatementRow,
    getCancellationDeadline
};
