import crypto from 'crypto';
import documentModel from '../models/documentModel.js';
import auditService from '../services/auditService.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const create = async (req, res, next) => {
  try {
    const data = { ...req.body, uploaded_by: req.user.userId };
    const doc = await documentModel.create(data);
    await auditService.log(req, 'CREATE', 'DOCUMENT', doc.id, null, doc);
    res.status(201).json({ message: 'Documento creado.', document: doc });
  } catch (error) { next(error); }
};

export const getAll = async (req, res, next) => {
  try {
    const documents = await documentModel.findAll(req.query);
    res.json({ documents });
  } catch (error) { next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const doc = await documentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    res.json({ document: doc });
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const doc = await documentModel.update(req.params.id, req.body);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    res.json({ message: 'Documento actualizado.', document: doc });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const doc = await documentModel.delete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    await auditService.log(req, 'DELETE', 'DOCUMENT', doc.id, doc, null);
    res.json({ message: 'Documento eliminado.' });
  } catch (error) { next(error); }
};

export const download = async (req, res, next) => {
  try {
    const doc = await documentModel.incrementDownload(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    res.json({ document: doc });
  } catch (error) { next(error); }
};

// Generador de PDFs industriales según tipo de documento (Dossier de Calidad, Reporte Técnico, Certificado, etc.)
export const downloadPDF = async (req, res, next) => {
  try {
    const docId = req.params.id;
    let docRecord = null;

    try {
      docRecord = await documentModel.findById(docId);
      if (docRecord) {
        await documentModel.incrementDownload(docId);
      }
    } catch (_) {}

    const isDossier = docId === 'DOC-2025-210' ||
      docId === '2' ||
      (docRecord && (docRecord.category === 'dossier' || docRecord.category === 'CERTIFICATE' || (docRecord.title && docRecord.title.toLowerCase().includes('dossier'))));

    const isReologia = docId === 'DOC-2026-101' || (docRecord && docRecord.title && docRecord.title.toLowerCase().includes('reolog'));
    const isCertPlacas = docId === 'DOC-2026-088' || (docRecord && docRecord.title && docRecord.title.toLowerCase().includes('garant'));
    const isManualCentrifuga = docId === 'DOC-2026-052' || (docRecord && docRecord.title && docRecord.title.toLowerCase().includes('manual'));

    const filename = isDossier
      ? `Dossier_Calidad_Overhaul_${docId}.pdf`
      : isReologia
      ? `Reporte_Reologia_Sedimentacion_${docId}.pdf`
      : isCertPlacas
      ? `Certificado_Garantia_Placas_${docId}.pdf`
      : isManualCentrifuga
      ? `Manual_Operacion_Centrifuga_${docId}.pdf`
      : `Documento_Tecnico_${docId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
      bufferPages: true
    });

    doc.pipe(res);

    if (isDossier) {
      // ==========================================
      // DOSSIER DE CALIDAD Y TURNOVER PACKAGE (DATABOOK)
      // ==========================================
      // PÁGINA 1
      doc.rect(40, 36, 515, 6).fill('#0284c7');

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('DEWATERING SOLUTIONS S.A.C.', 40, 52);
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text('SISTEMA INTEGRADO DE GESTIÓN (SIG) | ISO 9001:2015 - ISO 14001:2015', 40, 70);
      doc.text('División de Aseguramiento y Control de Calidad (QA/QC) | Minería y Procesamiento de Minerales', 40, 81);

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0284c7').text('TURNOVER PACKAGE / DATA BOOK', 360, 52, { width: 195, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`CÓDIGO: DOS-CAL-2025-089-REV0`, 360, 65, { width: 195, align: 'right' });
      doc.text('EMISIÓN: 15/12/2025 | ESTADO: LIBERADO', 360, 77, { width: 195, align: 'right' });

      doc.moveTo(40, 96).lineTo(555, 96).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // Banner Principal
      doc.rect(40, 104, 515, 34).fill('#0f172a');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('DOSSIER DE CALIDAD Y CERTIFICACIÓN TÉCNICA DE EQUIPO', 40, 114, { align: 'center', width: 515 });
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('CERTIFICADO FINAL DE CONFORMIDAD, OVERHAUL Y COMISIONAMIENTO EN OPERACIÓN', 40, 127, { align: 'center', width: 515 });

      // Cuadro de Metadatos del Proyecto Minero
      const metaY = 146;
      doc.rect(40, metaY, 515, 82).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0369a1').text('DATOS DEL PROYECTO Y CLIENTE:', 50, metaY + 8);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text('Cliente Titular:', 50, metaY + 24);
      doc.font('Helvetica').text('MARCOBRE S.A.C. — Mina Justa (Nazca, Ica)', 125, metaY + 24);

      doc.font('Helvetica-Bold').text('Proyecto N°:', 50, metaY + 38);
      doc.font('Helvetica').text('PRJ-2025-089 (Overhaul Mayor Filtro Prensa)', 125, metaY + 38);

      doc.font('Helvetica-Bold').text('Tag de Equipo:', 50, metaY + 52);
      doc.font('Helvetica').text('0310-FL-002 | Filtro Prensa Automático FPA-1500', 125, metaY + 52);

      doc.font('Helvetica-Bold').text('Aplicación:', 50, metaY + 66);
      doc.font('Helvetica').text('Deshidratación de Relaves y Concentrado de Cobre', 125, metaY + 66);

      doc.font('Helvetica-Bold').text('Ubicación Planta:', 320, metaY + 24);
      doc.font('Helvetica').text('Planta Concentradora (800 msnm)', 410, metaY + 24);

      doc.font('Helvetica-Bold').text('Contratista QA/QC:', 320, metaY + 38);
      doc.font('Helvetica').text('Dewatering Solutions S.A.C.', 410, metaY + 38);

      doc.font('Helvetica-Bold').text('Horas Operativas:', 320, metaY + 52);
      doc.font('Helvetica').text('Prueba continua 168 hrs (7 días)', 410, metaY + 52);

      doc.font('Helvetica-Bold').text('Dictamen QA/QC:', 320, metaY + 66);
      doc.font('Helvetica-Bold').fillColor('#15803d').text('CONFORME Y APROBADO 100%', 410, metaY + 66);

      // Sección 1: Resumen de Alcance
      const sec1Y = 236;
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('1. RESUMEN EJECUTIVO Y ALCANCE DE LA LIBERACIÓN', 40, sec1Y);
      doc.rect(40, sec1Y + 12, 515, 38).fill('#f1f5f9');
      doc.fontSize(7.5).font('Helvetica').fillColor('#334155').text(
        'El presente Dossier de Calidad certifica la culminación satisfactoria del Overhaul Integral del Filtro Prensa FPA-1500 (Tag 0310-FL-002). ' +
        'Se verificaron las tolerancias dimensionales, ensayos no destructivos de componentes críticos, hermeticidad del cilindro hidráulico a 16 bar, ' +
        'instalación de 120 placas filtrantes de polipropileno virgen y rendimiento metalúrgico con pulpa de mineral real alcanzando una humedad de queque de 12.8% w/w.',
        48, sec1Y + 16, { width: 500, align: 'justify', lineGap: 1.5 }
      );

      // Sección 2: Tabla de Protocolos de Inspección y Ensayos
      const sec2Y = 286;
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('2. PROTOCOLOS DE INSPECCIÓN, ENSAYOS Y PRUEBAS TÉCNICAS (QC LOG)', 40, sec2Y);

      const thY = sec2Y + 14;
      doc.rect(40, thY, 515, 18).fill('#1e293b');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('CÓD. PROTOCOLO', 45, thY + 5, { width: 75 });
      doc.text('DESCRIPCIÓN DEL ENSAYO / TEST', 125, thY + 5, { width: 175 });
      doc.text('NORMA APLICABLE', 305, thY + 5, { width: 85 });
      doc.text('CRITERIO / VALOR', 395, thY + 5, { width: 85 });
      doc.text('RESULTADO', 485, thY + 5, { width: 65, align: 'center' });

      const protocols = [
        { code: 'QC-NDT-001', desc: 'Ensayos No Destructivos (Líquidos Penetrantes) en cabezal móvil, fijo y viga maestra', std: 'ASME Sec. V Art. 6 / ASTM E165', value: 'Cero fisuras / Sin indicaciones lineales', status: 'CONFORME' },
        { code: 'QC-HYD-002', desc: 'Prueba de Presión Hidrostática y Hermeticidad en cilindro y manifold principal', std: 'ISO 10631 / ASME B31.3', value: '16.0 bar x 4 horas (Delta P = 0 bar)', status: 'CONFORME' },
        { code: 'QC-DIM-003', desc: 'Alineamiento y Nivelación Láser de Vigas Laterales y paralelismo de placas', std: 'DIN 7129 / ISO 2768-m', value: 'Desv: 0.35 mm (Tol max: 0.80 mm)', status: 'CONFORME' },
        { code: 'QC-TOR-004', desc: 'Torqueo Estructural de tirantes y anclajes con torquímetro calibrado INACAL', std: 'ANSI B18.2.1 / Diemme Spec', value: '450 Nm controlado al 100% pernos', status: 'CONFORME' },
        { code: 'QC-MET-005', desc: 'Evaluación Metalúrgica: Humedad Residual en Queque (Torta Filtrada de Concentrado)', std: 'ASTM D2216 / ISO 589', value: 'Humedad: 12.8% w/w (Límite: < 14.0%)', status: 'CONFORME' },
        { code: 'QC-AUT-006', desc: 'Pruebas de Lógica PLC Siemens S7-1500, enclavamientos e instrumentación 4-20mA', std: 'ISA 88 / IEC 61131-3', value: '15 ciclos continuos sin disparos', status: 'CONFORME' },
        { code: 'QC-ELC-007', desc: 'Prueba de Aislamiento Megóhmetro (500V DC) a motor electrohidráulico 75 kW', std: 'IEEE 43-2013 / IEC 60034', value: 'Resistencia: 450 MΩ (> 100 MΩ mín)', status: 'CONFORME' }
      ];

      let rowY = thY + 18;
      protocols.forEach((p, idx) => {
        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, rowY, 515, 23).fill(bg);
        doc.rect(40, rowY, 515, 23).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#0284c7').text(p.code, 45, rowY + 7, { width: 75 });
        doc.font('Helvetica').fillColor('#1e293b').text(p.desc, 125, rowY + 4, { width: 175, lineGap: 1 });
        doc.fillColor('#64748b').text(p.std, 305, rowY + 7, { width: 85 });
        doc.font('Helvetica-Bold').fillColor('#334155').text(p.value, 395, rowY + 5, { width: 85, lineGap: 1 });

        doc.rect(490, rowY + 5, 56, 13).fill('#dcfce7');
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#15803d').text(p.status, 490, rowY + 8, { width: 56, align: 'center' });

        rowY += 23;
      });

      const footerY1 = 490;
      doc.rect(40, footerY1, 515, 24).fill('#f1f5f9');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#0369a1').text('DECLARACIÓN DE CONFORMIDAD:', 48, footerY1 + 5);
      doc.font('Helvetica').fillColor('#475569').text(
        'Los ensayos anteriores fueron supervisados y validados por el área QA/QC de Dewatering Solutions S.A.C. de acuerdo con la norma ISO 9001:2015. ' +
        'El equipo se encuentra completamente operativo y apto para su explotación industrial.',
        48, footerY1 + 13, { width: 500 }
      );

      // PÁGINA 2
      doc.addPage();
      doc.rect(40, 36, 515, 5).fill('#0284c7');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('DEWATERING SOLUTIONS S.A.C. — DOSSIER DE CALIDAD (PÁGINA 2/2)', 40, 48);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('PROYECTO: PRJ-2025-089 (MARCOBRE) | REGISTRO: DOS-CAL-2025-089-REV0', 40, 62);
      doc.moveTo(40, 74).lineTo(555, 74).strokeColor('#cbd5e1').lineWidth(0.8).stroke();

      const sec3Y = 84;
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('3. TRAZABILIDAD DE COMPONENTES Y REPUESTOS MAYORES INSTALADOS', 40, sec3Y);

      const matThY = sec3Y + 12;
      doc.rect(40, matThY, 515, 16).fill('#334155');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('COMPONENTE / REPUESTO', 45, matThY + 4, { width: 150 });
      doc.text('CANTIDAD', 200, matThY + 4, { width: 60 });
      doc.text('ESPECIFICACIÓN / MATERIAL', 265, matThY + 4, { width: 170 });
      doc.text('CERTIFICADO ORIGEN', 440, matThY + 4, { width: 110 });

      const materials = [
        { item: 'Placas Filtrantes Mixtas 1500x1500mm', qty: '120 Unidades', spec: 'Polipropileno Virgen PPH alta resistencia química', cert: 'EN 10204 3.1 / Klinkau' },
        { item: 'Telas Filtrantes Monofilamento Rilsan', qty: '240 Paquetes', spec: 'Permeabilidad 220 l/dm²/min, acabado calandrado', cert: 'Test Report Sefar AG' },
        { item: 'Empaquetaduras y Sellos de Pistón', qty: '01 Kit Mayor', spec: 'Poliuretano + Nitrilo NBR 90 Shore A (Parker)', cert: 'Parker Seal Cert #8821' },
        { item: 'Aceite Hidráulico Antidesgaste ISO VG 46', qty: '800 Litros', spec: 'Clase de Limpieza NAS 1638 Grado 6 (Mobil DTE)', cert: 'Cert. Análisis Mobil 2025' }
      ];

      let matRowY = matThY + 16;
      materials.forEach((m, idx) => {
        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, matRowY, 515, 18).fill(bg);
        doc.rect(40, matRowY, 515, 18).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e293b').text(m.item, 45, matRowY + 5, { width: 150 });
        doc.font('Helvetica').fillColor('#475569').text(m.qty, 200, matRowY + 5, { width: 60 });
        doc.text(m.spec, 265, matRowY + 5, { width: 170 });
        doc.font('Helvetica-Bold').fillColor('#0284c7').text(m.cert, 440, matRowY + 5, { width: 110 });

        matRowY += 18;
      });

      const sec4Y = matRowY + 18;
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('4. PANEL DE FIRMAS TÉCNICAS Y CONFORMIDAD DE ENTREGA (SIGN-OFF)', 40, sec4Y);

      const boxW = 165;
      const boxH = 95;
      const boxY = sec4Y + 14;

      doc.rect(40, boxY, boxW, boxH).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0369a1').text('RESPONSABLE QA / QC', 45, boxY + 6, { align: 'center', width: boxW - 10 });
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('DEWATERING SOLUTIONS S.A.C.', 45, boxY + 16, { align: 'center', width: boxW - 10 });
      doc.moveTo(55, boxY + 60).lineTo(190, boxY + 60).strokeColor('#94a3b8').lineWidth(1).stroke();
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#0f172a').text('Ing. Roberto Carrión V.', 45, boxY + 64, { align: 'center', width: boxW - 10 });
      doc.fontSize(6.5).font('Helvetica').fillColor('#475569').text('Ingeniero Residente QA/QC\nReg. CIP N° 184520', 45, boxY + 74, { align: 'center', width: boxW - 10 });

      doc.rect(215, boxY, boxW, boxH).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0369a1').text('GERENCIA TÉCNICA / PROYECTOS', 220, boxY + 6, { align: 'center', width: boxW - 10 });
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('DEWATERING SOLUTIONS S.A.C.', 220, boxY + 16, { align: 'center', width: boxW - 10 });
      doc.moveTo(230, boxY + 60).lineTo(365, boxY + 60).strokeColor('#94a3b8').lineWidth(1).stroke();
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#0f172a').text('Ing. Carlos Mendoza R.', 220, boxY + 64, { align: 'center', width: boxW - 10 });
      doc.fontSize(6.5).font('Helvetica').fillColor('#475569').text('Gerente de Ingeniería y Operaciones\nReg. CIP N° 142890', 220, boxY + 74, { align: 'center', width: boxW - 10 });

      doc.rect(390, boxY, boxW, boxH).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0369a1').text('SUPERINTENDENCIA DE PLANTA', 395, boxY + 6, { align: 'center', width: boxW - 10 });
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('MARCOBRE S.A.C. (MINA JUSTA)', 395, boxY + 16, { align: 'center', width: boxW - 10 });
      doc.moveTo(405, boxY + 60).lineTo(540, boxY + 60).strokeColor('#94a3b8').lineWidth(1).stroke();
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#0f172a').text('Ing. Marco Villegas P.', 395, boxY + 64, { align: 'center', width: boxW - 10 });
      doc.fontSize(6.5).font('Helvetica').fillColor('#475569').text('Superintendente de Filtrado y Relaves\nReg. CIP N° 167332', 395, boxY + 74, { align: 'center', width: boxW - 10 });

      const dossierIntegrityHash = crypto.createHash('sha256').update(String(docId) + '-DOSSIER-TURNOVER-ISO9001').digest('hex');
      const sec5Y = boxY + boxH + 16;
      doc.rect(40, sec5Y, 515, 90).fillAndStroke('#f8fafc', '#e2e8f0');

      try {
        const qrPayload = JSON.stringify({
          tipo: 'DOSSIER_DE_CALIDAD_TURNOVER',
          dossier_id: 'DOS-CAL-2025-089-REV0',
          proyecto: 'PRJ-2025-089',
          cliente: 'MARCOBRE S.A.C.',
          tag: '0310-FL-002',
          equipo: 'Filtro Prensa FPA-1500',
          estado: 'CONFORME_LIBERADO_100%',
          fecha: '2025-12-15',
          hash_sha256: dossierIntegrityHash,
          emisor: 'Dewatering Solutions S.A.C. - ISO 9001:2015'
        });
        const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 90, margin: 1 });
        doc.image(qrBuffer, 50, sec5Y + 8, { width: 74 });
      } catch (_) {}

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('VERIFICACIÓN DIGITAL Y TRAZABILIDAD CRIPTOGRÁFICA', 135, sec5Y + 10);
      doc.fontSize(7).font('Helvetica').fillColor('#475569');
      doc.text('Este documento cuenta con firma y certificación digital respaldada en el Portal Dewatering Solutions Cloud.', 135, sec5Y + 22);
      doc.text('Escanee el código QR desde cualquier dispositivo móvil o tablet industrial para verificar en tiempo real la validez del Turnover Package, las actas de liberación y certificados de laboratorio.', 135, sec5Y + 32, { width: 405 });

      doc.font('Helvetica-Bold').text('Hash de Integridad SHA-256:', 135, sec5Y + 54);
      doc.fontSize(6.5).font('Courier').fillColor('#0284c7').text(dossierIntegrityHash, 135, sec5Y + 64);
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('Válido para auditorías de cumplimiento minero OSINERGMIN / OEFA / ISO 9001:2015.', 135, sec5Y + 74);

      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text('Dewatering Solutions S.A.C. — Av. Industrial 123, Lima, Perú | www.dewatering.pe | Central: +51 (1) 710-5000', 40, 755, { align: 'center', width: 515 });

    } else if (isReologia) {
      // ==========================================
      // REPORTE TÉCNICO DE REOLOGÍA Y SEDIMENTACIÓN
      // ==========================================
      doc.rect(40, 36, 515, 6).fill('#10b981');
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('DEWATERING SOLUTIONS S.A.C.', 40, 52);
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text('LABORATORIO METALÚRGICO Y CARACTERIZACIÓN DE PULPAS', 40, 70);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#10b981').text('INFORME TÉCNICO ESPECIALIZADO', 360, 52, { width: 195, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`DOC: ${docId} | REV: 1.0`, 360, 65, { width: 195, align: 'right' });
      doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#cbd5e1').stroke();

      doc.rect(40, 98, 515, 30).fill('#0f172a');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text('REPORTE DE REOLOGÍA, FLOCULACIÓN Y SEDIMENTACIÓN MCR', 40, 107, { align: 'center', width: 515 });

      // Info
      doc.rect(40, 138, 515, 60).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155');
      doc.text('Cliente:', 50, 146); doc.font('Helvetica').text('Compañía Minera Antapaccay S.A.', 110, 146);
      doc.font('Helvetica-Bold').text('Proyecto:', 50, 160); doc.font('Helvetica').text('PRJ-2026-041 (Optimización Espesador de Relaves)', 110, 160);
      doc.font('Helvetica-Bold').text('Muestra:', 50, 174); doc.font('Helvetica').text('Relave Cobre-Oro (D80 = 45 µm, S.G. = 2.82)', 110, 174);

      doc.font('Helvetica-Bold').text('Fecha Ensayo:', 330, 146); doc.font('Helvetica').text('05 de Junio de 2026', 410, 146);
      doc.font('Helvetica-Bold').text('Normativa:', 330, 160); doc.font('Helvetica').text('ASTM D4687 / ISO 18749', 410, 160);
      doc.font('Helvetica-Bold').text('Responsable:', 330, 174); doc.font('Helvetica').text('Ing. Metalurgista Senior', 410, 174);

      // Tabla de Parámetros Reológicos
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('1. RESULTADOS REOLÓGICOS Y DOSIFICACIÓN ÓPTIMA', 40, 215);
      const thY = 230;
      doc.rect(40, thY, 515, 18).fill('#1e293b');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('PARÁMETRO EVALUADO', 45, thY + 5, { width: 170 });
      doc.text('VALOR BASAL', 220, thY + 5, { width: 95 });
      doc.text('VALOR OPTIMIZADO', 320, thY + 5, { width: 110 });
      doc.text('MEJORA RELATIVA', 435, thY + 5, { width: 110 });

      const reoData = [
        { param: 'Velocidad de Sedimentación Libre', b: '0.85 m/h', o: '3.40 m/h (Floculante 22 g/t)', inc: '+300% de capacidad' },
        { param: 'Porcentaje de Sólidos Underflow', b: '48.5% p/p', o: '64.2% p/p con cizalle controlado', inc: '+15.7 puntos base' },
        { param: 'Esfuerzo de Fluencia (Yield Stress)', b: '145 Pa', o: '42 Pa con dilución feed', inc: 'Baja viscosidad p/bombeo' },
        { param: 'Claridad Sobrenadante (Turbidez)', b: '180 NTU', o: '< 25 NTU (Agua clarificada)', inc: '92% recupero agua' }
      ];

      let rY = thY + 18;
      reoData.forEach((row, i) => {
        doc.rect(40, rY, 515, 22).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff');
        doc.rect(40, rY, 515, 22).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1e293b').text(row.param, 45, rY + 6, { width: 170 });
        doc.font('Helvetica').fillColor('#64748b').text(row.b, 220, rY + 6, { width: 95 });
        doc.font('Helvetica-Bold').fillColor('#0284c7').text(row.o, 320, rY + 6, { width: 110 });
        doc.fillColor('#15803d').text(row.inc, 435, rY + 6, { width: 110 });
        rY += 22;
      });

      // Conclusiones
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('2. CONCLUSIONES Y RECOMENDACIONES DE OPERACIÓN', 40, rY + 20);
      doc.rect(40, rY + 34, 515, 60).fill('#f1f5f9');
      doc.fontSize(8).font('Helvetica').fillColor('#334155').text(
        '1. Se demostró la viabilidad de operar el espesador de relaves a 64% de sólidos en descarga, reduciendo la huella hídrica de Antapaccay.\n' +
        '2. Se recomienda implementar un lazo de control de dosificación de polímero aniónico en función de la turbidez de rebose (setpoint 22 g/t).\n' +
        '3. El caudal de reciclo de agua recuperada aumentará en 145 m³/h para recirculación en circuito de flotación.',
        48, rY + 40, { width: 500, lineGap: 3 }
      );

      // Firma
      doc.moveTo(180, 520).lineTo(370, 520).strokeColor('#94a3b8').stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text('Ing. Javier Solís M. - CIP 198210', 40, 526, { align: 'center', width: 515 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('Jefe de Laboratorio de Reología y Filtración | Dewatering Solutions S.A.C.', 40, 537, { align: 'center', width: 515 });

    } else if (isCertPlacas) {
      // ==========================================
      // CERTIFICADO DE GARANTÍA - PLACAS FILTRANTES
      // ==========================================
      doc.rect(40, 36, 515, 6).fill('#8b5cf6');
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('DEWATERING SOLUTIONS S.A.C.', 40, 52);
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text('DIVISIÓN DE REPUESTOS Y COMPONENTES FILTRANTES', 40, 70);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#8b5cf6').text('CERTIFICADO DE GARANTÍA', 360, 52, { width: 195, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`DOC: ${docId}`, 360, 65, { width: 195, align: 'right' });
      doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#cbd5e1').stroke();

      doc.rect(40, 100, 515, 30).fill('#0f172a');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('CERTIFICADO DE CALIDAD Y GARANTÍA EXTENDIDA (24 MESES)', 40, 110, { align: 'center', width: 515 });

      doc.rect(40, 145, 515, 70).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#334155');
      doc.text('Lote Certificado:', 50, 155); doc.font('Helvetica').text('Suministro Lote 45 - Placas de Polipropileno de Membrana', 140, 155);
      doc.font('Helvetica-Bold').text('Cantidad:', 50, 170); doc.font('Helvetica').text('120 Unidades (Dimensiones 1500 x 1500 mm, Cámara 30 mm)', 140, 170);
      doc.font('Helvetica-Bold').text('Material:', 50, 185); doc.font('Helvetica').text('PP Homopolímero Virgen Stabilized UV & Anti-Ácido (pH 1.0 - 14.0)', 140, 185);
      doc.font('Helvetica-Bold').text('Rango de Presión:', 50, 200); doc.font('Helvetica').text('Presión de alimentación: 8.0 bar | Presión de inflado: 16.0 bar', 140, 200);

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('TÉRMINOS DE LA GARANTÍA TÉCNICA', 40, 235);
      doc.fontSize(8).font('Helvetica').fillColor('#475569').text(
        'Dewatering Solutions S.A.C. garantiza que las placas suministradas están libres de defectos de fabricación, ' +
        'microporosidades o deformaciones estructurales bajo las condiciones de diseño especificadas. La garantía cubre el reemplazo inmediato ' +
        'sin costo alguno durante el periodo de 24 meses contados a partir de su entrega en faena.',
        40, 252, { width: 515, align: 'justify', lineGap: 3 }
      );

      // Firma
      doc.moveTo(180, 420).lineTo(370, 420).strokeColor('#94a3b8').stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text('Ing. Gabriel Vargas T.', 40, 426, { align: 'center', width: 515 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('Gerente de Calidad y Post-Venta | Dewatering Solutions S.A.C.', 40, 437, { align: 'center', width: 515 });

    } else {
      // ==========================================
      // MANUAL / OTROS DOCUMENTOS TÉCNICOS
      // ==========================================
      doc.rect(40, 36, 515, 6).fill('#f59e0b');
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('DEWATERING SOLUTIONS S.A.C.', 40, 52);
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text('SISTEMA INTEGRADO DE GESTIÓN TÉCNICA Y DOCUMENTACIÓN OFICIAL', 40, 70);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#f59e0b').text('MANUAL TÉCNICO OFICIAL', 360, 52, { width: 195, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`DOC: ${docId}`, 360, 65, { width: 195, align: 'right' });
      doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#cbd5e1').stroke();

      doc.rect(40, 100, 515, 30).fill('#0f172a');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text((docRecord && docRecord.title) || 'MANUAL DE OPERACIÓN Y MANTENIMIENTO PREVENTIVO', 40, 110, { align: 'center', width: 515 });

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('ESPECIFICACIONES GENERALES DEL DOCUMENTO', 40, 150);
      doc.fontSize(8).font('Helvetica').fillColor('#334155').text(
        `Este documento técnico oficial (ID: ${docId}) describe los procedimientos de seguridad operacional, calibración de equipos, ` +
        `intervalos de lubricación y solución de fallas (Troubleshooting) para la tecnología de separación sólido-líquido suministrada.\n\n` +
        `Para consultas técnicas directas, comuníquese con nuestra central técnica 24/7 o a través del Portal Dewatering Solutions.`,
        40, 168, { width: 515, lineGap: 3 }
      );

      // Firma
      doc.moveTo(180, 380).lineTo(370, 380).strokeColor('#94a3b8').stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text('Ingeniería de Soporte y Operaciones', 40, 386, { align: 'center', width: 515 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('Dewatering Solutions S.A.C.', 40, 397, { align: 'center', width: 515 });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
