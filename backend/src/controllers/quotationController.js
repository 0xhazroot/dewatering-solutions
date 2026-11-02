import quotationModel from '../models/quotationModel.js';
import auditService from '../services/auditService.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const create = async (req, res, next) => {
  try {
    const quotation_number = await quotationModel.getNextNumber();
    const data = { ...req.body, quotation_number, created_by: req.user.userId };
    const quotation = await quotationModel.create(data);
    await auditService.log(req, 'CREATE', 'QUOTATION', quotation.id, null, quotation);
    res.status(201).json({ message: 'Cotización creada.', quotation });
  } catch (error) { next(error); }
};

export const getAll = async (req, res, next) => {
  try {
    const quotations = await quotationModel.findAll(req.query);
    res.json({ quotations });
  } catch (error) { next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const quotation = await quotationModel.findById(req.params.id);
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada.' });
    res.json({ quotation });
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const old = await quotationModel.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Cotización no encontrada.' });
    const quotation = await quotationModel.update(req.params.id, req.body);
    await auditService.log(req, 'UPDATE', 'QUOTATION', quotation.id, old, quotation);
    res.json({ message: 'Cotización actualizada.', quotation });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const quotation = await quotationModel.delete(req.params.id);
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada.' });
    await auditService.log(req, 'DELETE', 'QUOTATION', quotation.id, quotation, null);
    res.json({ message: 'Cotización eliminada.' });
  } catch (error) { next(error); }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await quotationModel.getStats();
    res.json({ stats });
  } catch (error) { next(error); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const old = await quotationModel.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Cotización no encontrada.' });
    
    const quotation = await quotationModel.update(req.params.id, { status });
    await auditService.log(req, 'UPDATE_STATUS', 'QUOTATION', quotation.id, old, quotation);
    res.json({ message: 'Estado actualizado.', quotation });
  } catch (error) { next(error); }
};

export const downloadPDF = async (req, res, next) => {
  try {
    const quotation = await quotationModel.findById(req.params.id);
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Cotizacion_${quotation.quotation_number}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header Corporativo
    doc.fontSize(22).fillColor('#1d4ed8').text('DEWATERING SOLUTIONS S.A.C.', { align: 'right' });
    doc.fontSize(9).fillColor('#64748b').text('Certificación Internacional ISO 9001 | Ingeniería Sólido-Líquido', { align: 'right' });
    doc.text('Av. Industrial 123, Lima, Perú | RUC: 20601234567', { align: 'right' });
    doc.text('contacto@dewatering.com | WhatsApp Corporativo: +51 987 654 321', { align: 'right' });

    doc.moveDown(1.5);

    // Título y Metadatos
    doc.fontSize(18).fillColor('#0f172a').text('COTIZACIÓN TÉCNICO-COMERCIAL OFICIAL', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10.5).fillColor('#1e293b');
    doc.text(`N° de Documento: ${quotation.quotation_number}`);
    doc.text(`Cliente / Empresa: ${quotation.lead_company || quotation.lead_name || 'Cliente Corporativo Minero'}`);
    doc.text(`Fecha de Emisión: ${new Date(quotation.created_at).toLocaleDateString('es-PE')}`);
    doc.text(`Válida hasta: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('es-PE') : '15 días calendario'}`);
    doc.text(`Estado de Aprobación: ${quotation.status}`);

    doc.moveDown(1.5);

    // 1. Propuesta Técnica
    doc.fontSize(13).fillColor('#1d4ed8').text('1. Alcance y Especificación Técnica', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11.5).fillColor('#0f172a').text(`Proyecto / Suministro: ${quotation.title}`);
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#334155').text(quotation.description || 'Suministro de equipamiento e ingeniería especializada para separación sólido-líquido con garantía post-venta certificada.');

    doc.moveDown(1.5);

    // 2. Resumen Económico
    doc.fontSize(13).fillColor('#1d4ed8').text('2. Desglose Económico', { underline: true });
    doc.moveDown(0.6);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 22).fill('#e2e8f0');
    doc.fillColor('#0f172a').fontSize(10).text('Ítem / Descripción Técnica', 60, tableTop + 6);
    doc.text('Importe', 440, tableTop + 6);

    const currencySymbol = quotation.currency === 'PEN' ? 'S/.' : 'USD $';
    const totalNum = Number(quotation.total || 0);
    const subtotalNum = Number(quotation.subtotal || (totalNum / 1.18));
    const taxNum = Number(quotation.tax || (totalNum - subtotalNum));

    let rowY = tableTop + 30;
    doc.fillColor('#1e293b').fontSize(10).text(quotation.title, 60, rowY, { width: 360 });
    doc.text(`${currencySymbol} ${subtotalNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 430, rowY);

    rowY += 28;
    doc.moveTo(50, rowY).lineTo(550, rowY).strokeColor('#cbd5e1').stroke();
    rowY += 8;
    doc.fontSize(10).fillColor('#475569').text('Subtotal (Valor Venta):', 310, rowY);
    doc.text(`${currencySymbol} ${subtotalNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 430, rowY);

    rowY += 18;
    doc.text('I.G.V. (18%):', 310, rowY);
    doc.text(`${currencySymbol} ${taxNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 430, rowY);

    rowY += 20;
    doc.fontSize(11.5).fillColor('#059669').text('TOTAL INVERSIÓN:', 310, rowY);
    doc.text(`${currencySymbol} ${totalNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 430, rowY);

    // 3. Código QR de Verificación Digital y Trazabilidad
    const qrY = rowY + 45;
    try {
      const qrPayload = JSON.stringify({
        empresa: 'Dewatering Solutions SAC',
        cotizacion: quotation.quotation_number,
        cliente: quotation.lead_company || quotation.lead_name || 'Corporativo',
        total: `${quotation.currency || 'USD'} ${totalNum.toFixed(2)}`,
        estado: quotation.status,
        verificacion: `http://localhost:5173/admin/cotizaciones?verify=${quotation.quotation_number}`
      });
      const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 100, margin: 1 });
      doc.image(qrBuffer, 50, qrY, { width: 85 });
      doc.fontSize(8.5).fillColor('#475569').text('Sello de Verificación Digital QR', 145, qrY + 12);
      doc.text(`Código Único: ${quotation.quotation_number}`, 145, qrY + 25);
      doc.text('Escanee el código QR para validar autenticidad,', 145, qrY + 38);
      doc.text('vigencia y trazabilidad en el Portal Dewatering.', 145, qrY + 50);
    } catch (_) {}

    doc.fontSize(9.5).fillColor('#64748b').text('_________________________________', 350, qrY + 35, { width: 190, align: 'center' });
    doc.text('Gerencia de Ingeniería y Proyectos', 350, qrY + 50, { width: 190, align: 'center' });
    doc.text('Dewatering Solutions S.A.C.', 350, qrY + 63, { width: 190, align: 'center' });

    doc.end();
  } catch (error) { next(error); }
};
