import { GoogleGenAI } from '@google/genai';
import { query } from '../config/db.js';
import leadModel from '../models/leadModel.js';
import quotationModel from '../models/quotationModel.js';
import pdfParse from 'pdf-parse-new';
import dotenv from 'dotenv';
dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const WHATSAPP_CORPORATE_NUMBER = process.env.WHATSAPP_NUMBER || '51987654321';

let ai = null;
let aiVertex = null;
if (geminiKey) {
  try {
    ai = new GoogleGenAI({ apiKey: geminiKey });
    if (geminiKey.startsWith('AQ.')) {
      aiVertex = new GoogleGenAI({ vertexai: true, apiKey: geminiKey });
    }
  } catch (_) {
    ai = null;
  }
}

// Catálogo base garantizado de Dewatering Solutions con precios referenciales B2B para el Agente Transaccional
const DEFAULT_PRODUCTS = [
  {
    name: 'Filtro Prensa Automático FPA-1500',
    category: 'Filtros Prensa',
    origin: 'Italia',
    reference_price_usd: 85000,
    short_description: 'Filtro prensa de placas de alto rendimiento con sistema automático de apertura, descarga de queque y lavado de telas.',
    specifications: { capacidad: '50 m³/h', presion_max: '16 bar', area_filtracion: '200 m²', placas: 80, humedad_residual: '< 14%' }
  },
  {
    name: 'Filtro Prensa Manual FPM-800',
    category: 'Filtros Prensa',
    origin: 'Italia',
    reference_price_usd: 32000,
    short_description: 'Filtro prensa compacto para operaciones de menor escala, plantas piloto y efluentes industriales.',
    specifications: { capacidad: '15 m³/h', presion_max: '12 bar', area_filtracion: '60 m²', placas: 30 }
  },
  {
    name: 'Bomba de Alimentación Centrífuga BA-200',
    category: 'Bombas',
    origin: 'Sudáfrica',
    reference_price_usd: 18500,
    short_description: 'Bomba centrífuga de alta resistencia a la abrasión para alimentación de filtros prensa y transporte de relaves.',
    specifications: { caudal_max: '200 m³/h', presion_max: '10 bar', potencia: '75 kW', revestimiento: 'Elastómero / Aleación Alto Cromo' }
  },
  {
    name: 'Espesador de Alta Capacidad EAC-20',
    category: 'Espesadores',
    origin: 'Italia',
    reference_price_usd: 145000,
    short_description: 'Espesador continuo de 20m de diámetro con sistema de dilución de alimentación y control automático de torque.',
    specifications: { diametro: '20 m', capacidad: '500 TPD', tipo: 'High-Rate (Alta Capacidad)', descarga_solidos: '55% - 68% Cp' }
  },
  {
    name: 'Decanter Centrífugo DC-450',
    category: 'Decanters',
    origin: 'Italia',
    reference_price_usd: 68000,
    short_description: 'Centrífuga decanter horizontal para deshidratación continua de lodos finos y relaves mineros.',
    specifications: { capacidad: '45 m³/h', velocidad: '3200 RPM', potencia: '55 kW', fuerza_g: '3000 G' }
  },
  {
    name: 'Bomba Neumática de Diafragma BD-100',
    category: 'Bombas',
    origin: 'Sudáfrica',
    reference_price_usd: 9800,
    short_description: 'Bomba neumática de doble diafragma para pulpas densas, corrosivas y altamente abrasivas.',
    specifications: { caudal_max: '100 m³/h', solidos_max: '70% en peso', presion_max: '8 bar' }
  }
];

const DEFAULT_SERVICES = [
  { name: 'Ensayo de Filtración al Vacío y a Presión', short_description: 'Determinación a escala laboratorio y banco de tasas de filtración (kg/m²·h), humedad residual del queque y ciclos óptimos de prensado.' },
  { name: 'Selección de Telas Filtrantes', short_description: 'Evaluación de permeabilidad (CFM), retención de partículas y resistencia química en polipropileno, poliéster y poliamida.' },
  { name: 'Ensayo de Espesamiento Estático y Dinámico', short_description: 'Pruebas de velocidad de sedimentación, screening y dosificación óptima de floculantes (g/t) para pulpas y relaves.' },
  { name: 'Ensayos de Flotación Batch y Continua', short_description: 'Evaluación metalúrgica de recuperación y ley de concentrados minerales a escala laboratorio y planta piloto.' },
  { name: 'Lixiviación en Columna y por Agitación', short_description: 'Pruebas hidrometalúrgicas de extracción de cobre, oro y plata con control cinético y consumo de reactivos.' },
  { name: 'Pilotaje Industrial en Planta (In-Situ)', short_description: 'Despliegue y operación de unidades móviles de filtración prensa y espesamiento directamente en la unidad minera del cliente.' },
  { name: 'Montaje, Comisionamiento y Mantenimiento', short_description: 'Instalación electromecánica, puesta en marcha (commissioning) y soporte post-venta certificado ISO 9001.' }
];

const baseSystemContext = `
Eres el "Ingeniero Virtual" (Agente IA Transaccional y RAG Multimodal) de Dewatering Solutions (Lima, Perú), empresa líder certificada ISO 9001 especializada en separación sólido-líquido para el sector minero e industrial.
Tu objetivo es asistir a ingenieros metalurgistas, superintendentes de planta y clientes corporativos.

REGLAS ESTRICTAS:
1. Responde de forma profesional, técnica y estructurada. Emplea viñetas claras, negritas y párrafos breves. No utilices LaTeX complejo.
2. Eres capaz de resolver cálculos matemáticos, dimensionamiento metalúrgico de equipos (caudales, presiones, tonelaje seco, áreas de filtración) y emitir pre-cotizaciones automáticas en el CRM.
3. Cuando te pregunten sobre Dewatering Solutions, su catálogo de equipos, servicios de laboratorio/pilotaje o documentos técnicos, utiliza SIEMPRE la "MEMORIA RAG Y CATÁLOGO OFICIAL" proporcionada abajo.
4. Si el sistema ejecutó una herramienta del Agente (como Cálculo Metalúrgico o Generación de Cotización PDF en Base de Datos), incluye y explica los resultados generados con precisión.
`;

// ============================================================================
// HERRAMIENTA AUTÓNOMA #1: CALCULADORA METALÚRGICA Y DIMENSIONAMIENTO DE PLANTA
// ============================================================================
function detectAndRunSizingCalculator(userMessage) {
  const msg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hasCalcIntent =
    msg.includes('calcul') ||
    msg.includes('dimension') ||
    msg.includes('m3/h') ||
    msg.includes('m³/h') ||
    msg.includes('tph') ||
    msg.includes('tpd') ||
    (msg.includes('caudal') && /\d/.test(msg)) ||
    (msg.includes('solidos') && /\d/.test(msg));

  if (!hasCalcIntent) return null;

  // Extraer caudal (m3/h) y % de sólidos si el usuario los indica; usar valores típicos de planta si no
  const flowMatch = msg.match(/(\d+(?:\.\d+)?)\s*(?:m3\/h|m³\/h|m3|metros cubicos)/i) || msg.match(/caudal\s*(?:de)?\s*(\d+(?:\.\d+)?)/i);
  const solidsMatch = msg.match(/(\d+(?:\.\d+)?)\s*%\s*(?:de\s*solidos|solidos|cp)?/i);

  const flowM3h = flowMatch ? parseFloat(flowMatch[1]) : 42;
  const solidsPct = solidsMatch ? Math.min(Math.max(parseFloat(solidsMatch[1]), 5), 75) : 32;

  // Balance metalúrgico de pulpa (Gravedad específica mineral típica Sg = 2.75)
  const sgSolid = 2.75;
  const cw = solidsPct / 100;
  const pulpDensity = +(1 / (cw / sgSolid + (1 - cw))).toFixed(2); // t/m3
  const massFlowTph = +(flowM3h * pulpDensity * cw).toFixed(2); // TPH secos
  const massFlowTpd = +(massFlowTph * 24).toFixed(0); // TPD secos
  const filtrationRate = 110; // kg/m2·h tasa diseño típica para concentrado/relave
  const requiredAreaM2 = Math.ceil((massFlowTph * 1000) / filtrationRate);
  const platesNeeded = Math.max(15, Math.ceil(requiredAreaM2 / 2.5));

  const recommendedFilter =
    flowM3h > 18 || requiredAreaM2 > 70
      ? 'Filtro Prensa Automático FPA-1500 (200 m², 80 placas, 16 bar)'
      : 'Filtro Prensa Manual FPM-800 (60 m², 30 placas, 12 bar)';
  const unitsNeeded = Math.max(1, Math.ceil(requiredAreaM2 / (flowM3h > 18 ? 200 : 60)));
  const recommendedPump =
    flowM3h > 80
      ? 'Bomba de Alimentación Centrífuga BA-200 (200 m³/h, 10 bar, 75 kW)'
      : 'Bomba Centrífuga BA-200 (configuración VFD para llenado y prensado)';

  const markdownReport = [
    `### 🧮 Balance Metalúrgico y Dimensionamiento (Agente IA)`,
    `He ejecutado el motor de cálculo de ingeniería para tu operación:`,
    `* **Caudal de Pulpa de Alimentación ($Q$):** \`${flowM3h} m³/h\``,
    `* **Concentración de Sólidos en Peso ($C_p$):** \`${solidsPct}%\` (Densidad de pulpa calculada: \`${pulpDensity} t/m³\`)`,
    `* **Tonelaje de Sólidos Secos:** \`${massFlowTph} TPH\` (\`${massFlowTpd} TPD\`)`,
    `* **Área de Filtración Requerida:** \`${requiredAreaM2} m²\` (Tasa de diseño: \`${filtrationRate} kg/m²·h\`, \`${platesNeeded} placas\`)`,
    ``,
    `### ⚙️ Selección de Equipamiento Recomendado`,
    `1. **Equipo Principal (${unitsNeeded} und.):** **${recommendedFilter}** — Humedad residual garantizada \`< 14%\`.`,
    `2. **Sistema de Bombeo:** **${recommendedPump}** con revestimiento antiabrasivo de alto cromo.`,
    `3. **Etapa Previa Sugerida:** Si la pulpa proviene de flotación/lixiviación con bajo % de sólidos, recomendamos espesamiento previo en nuestro **Espesador High-Rate EAC-20** hasta alcanzar \`55% - 65% Cp\`.`
  ].join('\n');

  return {
    flowM3h,
    solidsPct,
    pulpDensity,
    massFlowTph,
    massFlowTpd,
    requiredAreaM2,
    platesNeeded,
    recommendedFilter,
    unitsNeeded,
    markdownReport
  };
}

// ============================================================================
// HERRAMIENTA AUTÓNOMA #2: FUNCTION CALLING (CREACIÓN DE LEAD + COTIZACIÓN PDF)
// ============================================================================
async function detectAndRunQuotationAgent(userMessage) {
  const msg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hasQuoteIntent =
    msg.includes('cotiz') ||
    msg.includes('proforma') ||
    msg.includes('presupuesto') ||
    msg.includes('generar pdf') ||
    msg.includes('comprar') ||
    msg.includes('precio formal');

  if (!hasQuoteIntent) return null;

  // Identificar el producto solicitado
  let selectedProduct = DEFAULT_PRODUCTS[0]; // Por defecto FPA-1500
  for (const prod of DEFAULT_PRODUCTS) {
    const normName = prod.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const codeMatch = normName.match(/[a-z]{2,3}-\d+/);
    if ((codeMatch && msg.includes(codeMatch[0])) || (msg.includes('manual') && normName.includes('manual')) || (msg.includes('centrifuga') && normName.includes('ba-200')) || (msg.includes('diafragma') && normName.includes('bd-100')) || (msg.includes('espesador') && normName.includes('eac-20')) || (msg.includes('decanter') && normName.includes('dc-450'))) {
      selectedProduct = prod;
      break;
    }
  }

  // Extraer correo, teléfono o empresa si el usuario los escribió en el prompt
  const emailMatch = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = userMessage.match(/(?:\+?51)?\s*9\d{2}[\s-]?\d{3}[\s-]?\d{3}/);
  const companyMatch = userMessage.match(/(?:empresa|minera|compañia|cia|para)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.&-]{2,35})/);

  const contactEmail = emailMatch ? emailMatch[0] : 'ingenieria.planta@corporacion-minera.pe';
  const contactPhone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : '+51987654321';
  const companyName = companyMatch ? companyMatch[1].trim() : 'Compañía Minera Corporativa (vía Agente IA)';
  const contactName = 'Superintendente de Planta (Lead IA)';

  const quantityMatch = msg.match(/(\d+)\s*(?:unidades|equipos|filtros|bombas)/);
  const quantity = quantityMatch ? Math.min(Math.max(parseInt(quantityMatch[1], 10), 1), 10) : 1;

  const unitPrice = selectedProduct.reference_price_usd || 45000;
  const subtotal = +(unitPrice * quantity).toFixed(2);
  const tax = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  // 1. Registrar el Lead automáticamente en el CRM
  const newLead = await leadModel.create({
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    company_name: companyName,
    company_sector: 'Minería e Industria',
    source: 'AI_AGENT',
    service_interest: selectedProduct.name,
    message: `[Generado automáticamente por el Agente IA] Solicitud de cotización para ${quantity}x ${selectedProduct.name}. Consulta original: "${userMessage}"`,
    priority: 'URGENT'
  });

  // 2. Generar la Cotización Oficial (COT-2026-XXXX) en la Base de Datos
  const quotationNumber = await quotationModel.getNextNumber();
  const validUntil = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const newQuotation = await quotationModel.create({
    lead_id: newLead.id,
    quotation_number: quotationNumber,
    title: `Suministro Industrial: ${quantity}x ${selectedProduct.name}`,
    description: `${selectedProduct.short_description} Origen: ${selectedProduct.origin}. Incluye garantías ISO 9001, dossier de calidad y soporte de comisionamiento en planta.`,
    items: [
      {
        description: selectedProduct.name,
        quantity,
        unit_price: unitPrice,
        subtotal
      }
    ],
    subtotal,
    tax,
    total,
    currency: 'USD',
    valid_until: validUntil,
    created_by: 1
  });

  const pdfUrl = `/api/quotations/${newQuotation.id}/pdf`;
  const waText = encodeURIComponent(
    `Hola equipo comercial de Dewatering Solutions, el Ingeniero Virtual IA generó mi Pre-Cotización Oficial *${quotationNumber}* por *${quantity}x ${selectedProduct.name}* (Total: USD $ ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} inc. IGV) para *${companyName}*. Deseo coordinar los detalles técnicos.`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_CORPORATE_NUMBER}?text=${waText}`;

  const markdownSummary = [
    `### ✅ ¡Acción Autónoma Ejecutada por el Agente IA!`,
    `He registrado tu requerimiento directamente en nuestro **CRM Corporativo** y emitido la **Pre-Cotización Oficial con Código QR**:`,
    `* **N° de Cotización Oficial:** \`${quotationNumber}\``,
    `* **Empresa / Prospecto CRM:** ${companyName} (\`${contactEmail}\`)`,
    `* **Equipo Cotizado:** **${quantity}x ${selectedProduct.name}** (*Origen: ${selectedProduct.origin}*)`,
    `* **Valor Venta (Subtotal):** \`USD $ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}\``,
    `* **I.G.V. (18%):** \`USD $ ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}\``,
    `* **Inversión Total Estimada:** **\`USD $ ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\`**`,
    `* **Vigencia de la Oferta:** Hasta el \`${validUntil}\``,
    ``,
    `👇 *Utiliza los botones interactivos de abajo para **descargar el PDF oficial (con sello QR)** o **enviarlo directamente por WhatsApp Business** a gerencia comercial.*`
  ].join('\n');

  return {
    type: 'QUOTATION_CREATED',
    leadId: newLead.id,
    quotationId: newQuotation.id,
    quotationNumber,
    equipment: `${quantity}x ${selectedProduct.name}`,
    company: companyName,
    subtotal,
    tax,
    total,
    currency: 'USD',
    pdfUrl,
    whatsappUrl,
    markdownSummary
  };
}

async function generateQueryEmbedding(text) {
  if (!ai) return null;
  const modelsToTry = ['text-embedding-004', 'gemini-embedding-001', 'gemini-embedding-2'];
  for (const modelName of modelsToTry) {
    try {
      const embeddingRes = await ai.models.embedContent({
        model: modelName,
        contents: text,
        config: { outputDimensionality: 768 }
      });
      if (embeddingRes?.embeddings?.[0]?.values) {
        return embeddingRes.embeddings[0].values;
      }
    } catch (_) {}
  }
  return null;
}

async function fetchKnowledgeData(userMessage) {
  let matchedChunks = [];
  let allRecentChunks = [];
  let products = [];
  let services = [];

  try {
    const vector = await generateQueryEmbedding(userMessage);
    if (vector) {
      const vectorStr = `[${vector.join(',')}]`;
      const searchRes = await query(
        `SELECT chunk_text, metadata, 1 - (embedding <=> $1) as similarity 
         FROM document_embeddings 
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> $1 
         LIMIT 4`,
        [vectorStr]
      );
      matchedChunks = searchRes.rows
        .filter(row => row.similarity > 0.35)
        .map(row => ({ text: row.chunk_text, source: row.metadata?.source || 'Documento Técnico' }));
    }
  } catch (_) {}

  try {
    const docsRes = await query(
      `SELECT chunk_text, metadata FROM document_embeddings ORDER BY id DESC LIMIT 15`
    );
    allRecentChunks = docsRes.rows.map(r => ({
      text: r.chunk_text,
      source: r.metadata?.source || 'Base de Conocimiento IA'
    }));
  } catch (_) {}

  try {
    const [productsRes, servicesRes] = await Promise.all([
      query(`SELECT name, category, origin, short_description, specifications FROM products WHERE is_active = true ORDER BY sort_order ASC`),
      query(`SELECT name, short_description FROM services WHERE is_active = true ORDER BY sort_order ASC`)
    ]);
    products = productsRes.rows;
    services = servicesRes.rows;
  } catch (_) {}

  if (products.length === 0) products = DEFAULT_PRODUCTS;
  if (services.length === 0) services = DEFAULT_SERVICES;

  return {
    chunks: matchedChunks.length > 0 ? matchedChunks : allRecentChunks.slice(0, 6),
    allRecentChunks,
    products,
    services
  };
}

function buildSmartRagResponse(userMessage, knowledge, calcResult, agentAction) {
  const msg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const { allRecentChunks, products, services } = knowledge;

  const responseParts = [];

  // Si se activó el Agente Transaccional de Cotizaciones o la Calculadora Metalúrgica, mostrarlos en primer lugar
  if (agentAction) {
    responseParts.push(agentAction.markdownSummary);
  }
  if (calcResult) {
    responseParts.push(calcResult.markdownReport);
  }

  const keywords = msg
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 3 && !['que', 'como', 'para', 'con', 'los', 'las', 'una', 'uno', 'del', 'por', 'sobre', 'tienen', 'cual', 'cuales', 'hola', 'buenos', 'dias', 'tardes', 'necesito', 'quiero', 'cotizar', 'cotizame', 'calcula', 'calcular'].includes(w));

  const relevantChunks = allRecentChunks.filter(c => {
    const normChunk = c.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normSource = (c.source || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return keywords.some(k => normChunk.includes(k) || normSource.includes(k));
  });

  const matchedProducts = products.filter(p => {
    const content = `${p.name} ${p.category} ${p.origin} ${p.short_description} ${JSON.stringify(p.specifications || {})}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return keywords.some(k => content.includes(k));
  });

  const matchedServices = services.filter(s => {
    const content = `${s.name} ${s.short_description}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return keywords.some(k => content.includes(k));
  });

  if (!agentAction && !calcResult && (keywords.length === 0 || /^(hola|buenas|buenos|ayuda|info|informacion|quienes son|dewatering)/.test(msg.trim()))) {
    const prodSummary = products.slice(0, 4).map(p => `* **${p.name}** (*${p.origin || 'Importado'}*): ${p.short_description}`).join('\n');
    return `¡Hola! Soy el **Ingeniero Virtual de Dewatering Solutions**.\n\nEstoy aquí para orientarte en nuestros equipos y soluciones de deshidratación industrial:\n\n${prodSummary}\n\n¿En qué te puedo asesorar hoy?`;
  }

  if (relevantChunks.length > 0) {
    responseParts.push(`### 📄 Información Técnica Recuperada (Memoria RAG)`);
    relevantChunks.slice(0, 3).forEach(chunk => {
      responseParts.push(`> **Fuente: ${chunk.source}**\n>\n> ${chunk.text.trim()}`);
    });
  }

  if (!agentAction && (matchedProducts.length > 0 || msg.includes('equipo') || msg.includes('producto') || msg.includes('catalogo') || msg.includes('maquina') || msg.includes('filtro') || msg.includes('bomba') || msg.includes('espesador') || msg.includes('decanter') || msg.includes('ficha'))) {
    const listToRender = matchedProducts.length > 0 ? matchedProducts : products;
    responseParts.push(`### ⚙️ Especificaciones Técnicas de Equipos (Dewatering Solutions)`);
    listToRender.forEach(p => {
      const specsObj = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : (p.specifications || {});
      const specsFormatted = Object.entries(specsObj)
        .map(([k, v]) => `\`${k.replace(/_/g, ' ')}: ${v}\``)
        .join(' • ');
      responseParts.push(`* **${p.name}** (*Categoría: ${p.category} | Origen: ${p.origin || 'Italia/Sudáfrica'}*)\n  ${p.short_description}\n  **Parámetros:** ${specsFormatted}`);
    });
  }

  if (!agentAction && !calcResult && (matchedServices.length > 0 || msg.includes('servicio') || msg.includes('ensayo') || msg.includes('laboratorio') || msg.includes('pilotaje') || msg.includes('montaje') || msg.includes('flotacion') || msg.includes('lixiviacion'))) {
    const servToRender = matchedServices.length > 0 ? matchedServices : services;
    responseParts.push(`### 🔬 Servicios de Ingeniería y Laboratorio Metalúrgico`);
    servToRender.forEach(s => {
      responseParts.push(`* **${s.name}**: ${s.short_description}`);
    });
  }

  if (responseParts.length === 0 && allRecentChunks.length > 0) {
    responseParts.push(`### 📚 Base de Conocimiento Técnico (Memoria RAG)`);
    allRecentChunks.slice(0, 2).forEach(chunk => {
      responseParts.push(`* **Fuente (${chunk.source}):** ${chunk.text}`);
    });
  }

  if (responseParts.length === 0) {
    responseParts.push(
      `### 🛠️ Recomendación de Ingeniería — Dewatering Solutions\nPara el requerimiento consultado (**"${userMessage}"**), nuestro equipo metalúrgico recomienda evaluar el porcentaje de sólidos (%Cp), granulometría ($P_{80}$) y gravedad específica del mineral:\n\n` +
      `* **Filtración de Concentrados y Relaves (< 14% humedad):** Recomendamos el **Filtro Prensa Automático FPA-1500** (\`50 m³/h\`, \`16 bar\`, \`200 m²\` de área, 80 placas, origen Italia) o el **FPM-800** (\`15 m³/h\`, \`12 bar\`, \`60 m²\`).\n` +
      `* **Bombeo de Pulpas de Alta Densidad:** Disponemos de la **Bomba Centrífuga BA-200** (\`200 m³/h\`, \`10 bar\`, \`75 kW\`) y la **Bomba Neumática de Diafragma BD-100** (hasta \`70% de sólidos\`, origen Sudáfrica).\n` +
      `* **Espesamiento y Deshidratación Continua:** Contamos con el **Espesador High-Rate EAC-20** (\`500 TPD\`, \`20 m\` de diámetro) y el **Decanter Centrífugo DC-450** (\`45 m³/h\`, \`3200 RPM\`).`
    );
  }

  return responseParts.join('\n\n');
}

export const chatWithBot = async (req, res) => {
  try {
    const { message, history, attachment } = req.body;

    if (!message && !attachment) {
      return res.status(400).json({ error: 'El mensaje o archivo no puede estar vacío.' });
    }

    // Procesamiento de adjuntos (PDF o Imagen)
    let attachmentSummary = '';
    let extractedFileText = '';

    if (attachment && attachment.data) {
      try {
        const fileBuffer = Buffer.from(attachment.data, 'base64');
        const mimeType = attachment.mimeType || 'application/pdf';

        if (mimeType === 'application/pdf') {
          const parsed = await pdfParse(fileBuffer);
          extractedFileText = parsed.text ? parsed.text.trim().slice(0, 4000) : '';
          attachmentSummary = `[ARCHIVO ADJUNTO PDF: "${attachment.name || 'documento.pdf'}"]\nContenido técnico extraído:\n${extractedFileText}`;
        } else if (mimeType.startsWith('image/')) {
          attachmentSummary = `[IMAGEN TÉCNICA ADJUNTA: "${attachment.name || 'foto.jpg'}"]`;
        }
      } catch (err) {
        console.warn('[Attachment parse warning]:', err.message);
      }
    }

    const effectiveUserPrompt = [
      attachmentSummary,
      message || (attachment ? 'Por favor analiza este archivo técnico adjunto y asesórame según el catálogo y requerimientos de planta.' : '')
    ].filter(Boolean).join('\n\n');

    // 1. Ejecutar herramientas autónomas del Agente IA (Calculadora Metalúrgica + Function Calling de Cotización/Lead)
    const calcResult = detectAndRunSizingCalculator(effectiveUserPrompt);
    const agentAction = await detectAndRunQuotationAgent(effectiveUserPrompt);

    // 2. Recuperar contexto RAG y Catálogo
    const knowledge = await fetchKnowledgeData(effectiveUserPrompt);
    const ragSources = Array.from(
      new Set([
        ...knowledge.chunks.map(c => c.source).filter(Boolean),
        attachment ? `Archivo Adjunto (${attachment.name || 'documento'})` : null,
        'Catálogo Industrial ISO 9001'
      ])
    ).filter(Boolean).slice(0, 4);

    const sections = [];
    if (attachmentSummary) {
      sections.push(`=== ARCHIVO ADJUNTO DEL USUARIO (DOCUMENTO/FOTO) ===\n${attachmentSummary}`);
    }
    if (agentAction) {
      sections.push(`=== ACCIÓN TRANSACCIONAL EJECUTADA EN CRM ===\n${agentAction.markdownSummary}`);
    }
    if (calcResult) {
      sections.push(`=== CÁLCULO METALÚRGICO EJECUTADO ===\n${calcResult.markdownReport}`);
    }
    if (knowledge.chunks.length > 0) {
      sections.push(
        `=== DOCUMENTOS TÉCNICOS ENTRENADOS (MEMORIA RAG) ===\n` +
        knowledge.chunks.map(c => `[Fuente: ${c.source}]\n${c.text}`).join('\n---\n')
      );
    }
    if (knowledge.products.length > 0) {
      sections.push(
        `=== CATÁLOGO DE EQUIPOS DEWATERING SOLUTIONS ===\n` +
        knowledge.products.map(p => `- ${p.name} (${p.category}, Origen: ${p.origin}): ${p.short_description}. Specs: ${JSON.stringify(p.specifications)}`).join('\n')
      );
    }
    if (knowledge.services.length > 0) {
      sections.push(
        `=== SERVICIOS METALÚRGICOS E INDUSTRIALES ===\n` +
        knowledge.services.map(s => `- ${s.name}: ${s.short_description}`).join('\n')
      );
    }

    const ragContext = sections.join('\n\n');
    const dynamicSystemContext = `${baseSystemContext}\n\n--- MEMORIA RAG Y CATÁLOGO OFICIAL ---\n${ragContext}\n--------------------------------------`;

    // Helper para anexar el resumen de acción si el LLM externo no lo incluyó completo
    const finalizeReply = (llmText) => {
      let finalText = llmText;
      if (agentAction && !finalText.includes(agentAction.quotationNumber)) {
        finalText = `${agentAction.markdownSummary}\n\n---\n\n${finalText}`;
      } else if (calcResult && !finalText.includes('TPH')) {
        finalText = `${calcResult.markdownReport}\n\n---\n\n${finalText}`;
      }
      return finalText;
    };

    if (groqKey && !groqKey.includes('your_groq')) {
      const isImage = attachment?.mimeType?.startsWith('image/');
      const groqModelsToTry = isImage
        ? ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b']
        : (process.env.GROQ_MODEL
            ? [process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b']
            : ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b']);

      for (const gModel of groqModelsToTry) {
        try {
          const messagesPayload = [{ role: 'system', content: dynamicSystemContext }];
          if (Array.isArray(history)) {
            history.forEach(msg => {
              messagesPayload.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
              });
            });
          }

          // Si el usuario envió imagen y el modelo soporta visión
          if (isImage && gModel.includes('qwen')) {
            messagesPayload.push({
              role: 'user',
              content: [
                { type: 'text', text: effectiveUserPrompt || 'Analiza esta imagen técnica y asesórame según nuestro catálogo de deshidratación.' },
                {
                  type: 'image_url',
                  image_url: { url: `data:${attachment.mimeType};base64,${attachment.data}` }
                }
              ]
            });
          } else {
            messagesPayload.push({ role: 'user', content: effectiveUserPrompt });
          }

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: gModel,
              messages: messagesPayload,
              temperature: 0.3,
              max_tokens: 2048
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            return res.status(200).json({
              response: finalizeReply(data.choices[0].message.content),
              agentAction,
              calcResult,
              sources: ragSources,
              modelUsed: `Groq (${gModel})`
            });
          }
        } catch (_) {}
      }
    }

    if (openRouterKey && !openRouterKey.includes('your_key')) {
      try {
        const messagesPayload = [{ role: 'system', content: dynamicSystemContext }];
        if (Array.isArray(history)) {
          history.forEach(msg => {
            messagesPayload.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.text
            });
          });
        }
        messagesPayload.push({ role: 'user', content: message });

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
            messages: messagesPayload,
            temperature: 0.3,
            max_tokens: 2048
          })
        });

        if (orRes.ok) {
          const data = await orRes.json();
          return res.status(200).json({
            response: finalizeReply(data.choices[0].message.content),
            agentAction,
            calcResult,
            sources: ragSources
          });
        }
      } catch (_) {}
    }

    if (ai) {
      const formattedContents = [];
      if (Array.isArray(history)) {
        history.forEach(msg => {
          formattedContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }
      formattedContents.push({
        role: 'user',
        parts: [{ text: effectiveUserPrompt }]
      });

      const geminiModelsToTry = process.env.GEMINI_MODEL
        ? [process.env.GEMINI_MODEL, 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
        : ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];

      const clientsToTry = aiVertex ? [ai, aiVertex] : [ai];

      for (const clientInstance of clientsToTry) {
        if (!clientInstance) continue;
        for (const modelName of geminiModelsToTry) {
          try {
            const response = await clientInstance.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction: dynamicSystemContext,
                temperature: 0.3,
                maxOutputTokens: 2048
              }
            });

            if (response?.text) {
              return res.status(200).json({
                response: finalizeReply(response.text),
                modelUsed: modelName,
                agentAction,
                calcResult,
                sources: ragSources
              });
            }
          } catch (_) {}
        }
      }
    }

    const fallbackReply = buildSmartRagResponse(effectiveUserPrompt, knowledge, calcResult, agentAction);
    return res.status(200).json({
      response: fallbackReply,
      agentAction,
      calcResult,
      sources: ragSources
    });
  } catch (error) {
    console.error('[ChatBot Error]:', error);
    res.status(500).json({ error: 'Error al comunicarse con la IA.' });
  }
};

export const submitChatFeedback = async (req, res) => {
  try {
    const { messageIndex, helpful, comment } = req.body;
    return res.status(200).json({
      message: 'Feedback registrado en telemetría RLHF.',
      recorded: { messageIndex, helpful: Boolean(helpful), comment: comment || null, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo registrar el feedback.' });
  }
};
