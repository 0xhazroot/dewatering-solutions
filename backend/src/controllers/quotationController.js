import quotationModel from '../models/quotationModel.js';
import auditService from '../services/auditService.js';
import PDFDocument from 'pdfkit';

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

    doc.fontSize(24).fillColor('#2563eb').text('Dewatering Solutions', { align: 'right' });
    doc.fontSize(10).fillColor('#64748b').text('Av. Industrial 123, Lima, Perú', { align: 'right' });
    doc.text('contacto@dewatering.com | +51 987 654 321', { align: 'right' });
    
    doc.moveDown(2);
    
    doc.fontSize(20).fillColor('#0f172a').text('COTIZACIÓN OFICIAL', { align: 'left' });
    doc.moveDown(1);
    doc.fontSize(12).text(`N° de Documento: ${quotation.quotation_number}`);
    doc.text(`Fecha de Emisión: ${new Date(quotation.created_at).toLocaleDateString()}`);
    doc.text(`Válida hasta: ${new Date(quotation.valid_until).toLocaleDateString()}`);
    doc.text(`Estado: ${quotation.status}`);
    
    doc.moveDown(2);
    
    doc.fontSize(14).fillColor('#2563eb').text('1. Detalle de la Propuesta Técnica', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#0f172a').text(`Título: ${quotation.title}`, { bold: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#334155').text(quotation.description || 'Suministro de equipos de separación sólido-líquido.');
    
    doc.moveDown(2);
    
    doc.fontSize(14).fillColor('#2563eb').text('2. Resumen Económico', { underline: true });
    doc.moveDown(1);
    
    doc.rect(50, doc.y, 500, 20).fill('#f1f5f9').stroke();
    doc.fillColor('#0f172a').fontSize(11).text('Descripción', 60, doc.y - 15);
    doc.text('Monto Total', 450, doc.y - 15);
    
    doc.moveDown(1);
    doc.text(quotation.title, 60, doc.y);
    const currencySymbol = quotation.currency === 'PEN' ? 'S/.' : '$';
    doc.fillColor('#10b981').text(`${currencySymbol} ${Number(quotation.total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${quotation.currency}`, 450, doc.y);
    
    doc.moveDown(4);
    
    doc.fontSize(10).fillColor('#64748b').text('_________________________________', { align: 'center' });
    doc.text('Aprobado por: Gerencia General', { align: 'center' });
    doc.text('Dewatering Solutions', { align: 'center' });

    doc.end();
  } catch (error) { next(error); }
};
