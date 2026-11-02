import { query } from '../config/db.js';
import { GoogleGenAI } from '@google/genai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import pdfParse from 'pdf-parse-new';
const mammoth = require('mammoth');
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey && apiKey.startsWith('AIza')) {
  ai = new GoogleGenAI({ apiKey });
}

// Función para dividir texto en chunks de aprox 1000 caracteres
function chunkText(text, maxChars = 1000) {
  const chunks = [];
  let currentChunk = '';
  const paragraphs = text.split('\n');

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

// Genera vector de 768 dimensiones o devuelve vector neutro de respaldo si se usa Groq/sin embedding API
async function computeVector768(text) {
  if (ai) {
    const modelsToTry = ['text-embedding-004', 'gemini-embedding-001', 'gemini-embedding-2'];
    for (const modelName of modelsToTry) {
      try {
        const embeddingRes = await ai.models.embedContent({
          model: modelName,
          contents: text,
          config: { outputDimensionality: 768 }
        });
        if (embeddingRes?.embeddings?.[0]?.values) {
          return `[${embeddingRes.embeddings[0].values.join(',')}]`;
        }
      } catch (_) {
        // Intentar siguiente modelo de embedding
      }
    }
  }
  // Vector de respaldo de 768 dimensiones para que pgvector almacene el chunk_text sin fallar
  return `[${new Array(768).fill(0).join(',')}]`;
}

export const trainAI = async (req, res) => {
  try {
    const { sourceName, textContent } = req.body;
    const userId = req.user?.userId || req.user?.id;

    try {
      await query(`ALTER TABLE document_embeddings ALTER COLUMN embedding TYPE vector(768)`);
    } catch (_) {}

    // 1. Crear documento maestro (categoría RAG_KNOWLEDGE)
    const docRes = await query(
      `INSERT INTO documents (title, description, category, file_url, is_public, uploaded_by) 
       VALUES ($1, $2, 'RAG_KNOWLEDGE', 'TEXT_INPUT', true, $3) RETURNING id`,
      [sourceName, 'Conocimiento inyectado vía panel de entrenamiento IA', userId]
    );
    const docId = docRes.rows[0].id;

    // 2. Dividir texto
    const chunks = chunkText(textContent, 1000);

    // 3. Generar embeddings (o almacenar texto para RAG híbrido) en pgvector
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length < 10) continue;

      const vectorStr = await computeVector768(chunk);

      await query(
        `INSERT INTO document_embeddings (document_id, chunk_index, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [docId, i, chunk, vectorStr, JSON.stringify({ source: sourceName })]
      );
    }

    res.status(200).json({
      message: 'Conocimiento inyectado con éxito',
      chunksProcessed: chunks.length,
      docId
    });
  } catch (error) {
    console.error('[AI Training Error]:', error);
    res.status(500).json({ error: 'Error al entrenar la IA' });
  }
};

export const getTrainedDocs = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title as name, created_at as date, 
       (SELECT COUNT(*) FROM document_embeddings WHERE document_id = d.id) as chunks
       FROM documents d
       WHERE category = 'RAG_KNOWLEDGE'
       ORDER BY created_at DESC`
    );

    const docs = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      tokens: row.chunks * 250,
      date: new Date(row.date).toISOString().split('T')[0]
    }));

    res.status(200).json(docs);
  } catch (error) {
    console.error('[Get Trained Docs Error]:', error);
    res.status(500).json({ error: 'Error al obtener documentos entrenados' });
  }
};

export const deleteTrainedDoc = async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM document_embeddings WHERE document_id = $1`, [id]);
    await query(`DELETE FROM documents WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Conocimiento eliminado correctamente.' });
  } catch (error) {
    console.error('[Delete Trained Doc Error]:', error);
    res.status(500).json({ error: 'Error al eliminar el documento.' });
  }
};

export const getTrainingJobs = async (req, res) => {
  try {
    const result = await query(`SELECT * FROM ai_training_jobs ORDER BY created_at DESC LIMIT 10`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener trabajos de entrenamiento' });
  }
};

export const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM ai_training_jobs WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Trabajo eliminado correctamente.' });
  } catch (error) {
    console.error('[Delete Job Error]:', error);
    res.status(500).json({ error: 'Error al eliminar el trabajo.' });
  }
};

export const trainFromFile = async (req, res) => {
  try {
    const file = req.file;
    const sourceName = req.body.sourceName || file?.originalname;
    const userId = req.user?.userId || req.user?.id;

    if (!file) return res.status(400).json({ error: 'No se envió ningún archivo.' });

    // 1. Intentar subir a Supabase Storage si está configurado, o usar referencia local segura
    let fileUrl = `local_upload://${file.originalname}`;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      const { error: uploadError } = await supabase.storage
        .from('dewatering-documents')
        .upload(`ai_training/${fileName}`, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('dewatering-documents')
          .getPublicUrl(`ai_training/${fileName}`);
        fileUrl = publicUrlData.publicUrl;
      }
    }

    // 2. Registrar el Trabajo en Segundo Plano (Job)
    const jobRes = await query(
      `INSERT INTO ai_training_jobs (file_name, file_url, status) VALUES ($1, $2, 'PENDING') RETURNING id`,
      [sourceName, fileUrl]
    );
    const jobId = jobRes.rows[0].id;

    // 3. Responder Inmediatamente al Cliente (202 Accepted)
    res.status(202).json({
      message: 'Archivo recibido. El entrenamiento ha comenzado en segundo plano.',
      jobId
    });

    // 4. Procesar en Segundo Plano
    processBackgroundTraining(jobId, file, sourceName, userId).catch(err => console.error('Error en background job:', err));
  } catch (error) {
    console.error('[AI File Training Error]:', error);
    res.status(500).json({ error: 'Error procesando el archivo.' });
  }
};

const processBackgroundTraining = async (jobId, file, sourceName, userId) => {
  try {
    await query(`UPDATE ai_training_jobs SET status = 'EXTRACTING', progress = 10 WHERE id = $1`, [jobId]);

    let extractedText = '';
    const mimeType = file.mimetype;

    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else if (mimeType.startsWith('image/')) {
      if (!ai) {
        throw new Error('Para OCR de imágenes se requiere una GEMINI_API_KEY (AIza...) válida en .env.');
      }
      let response = null;
      for (const visionModel of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
        try {
          response = await ai.models.generateContent({
            model: visionModel,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: 'Extrae todo el texto técnico y datos de esta imagen con la mayor precisión posible. Formatea como texto limpio.' },
                  { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } }
                ]
              }
            ]
          });
          if (response?.text) break;
        } catch (_) {}
      }
      extractedText = response?.text || '';
    } else {
      throw new Error('Formato de archivo no soportado. Usa PDF, Word o Imágenes.');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No se pudo extraer texto del archivo.');
    }

    await query(`UPDATE ai_training_jobs SET status = 'EMBEDDING', progress = 40 WHERE id = $1`, [jobId]);

    try { await query(`ALTER TABLE document_embeddings ALTER COLUMN embedding TYPE vector(768)`); } catch (_) {}

    const docRes = await query(
      `INSERT INTO documents (title, description, category, file_url, is_public, uploaded_by) 
       VALUES ($1, $2, 'RAG_KNOWLEDGE', 'FILE_UPLOAD', true, $3) RETURNING id`,
      [sourceName, 'Conocimiento inyectado vía archivo en segundo plano', userId]
    );
    const docId = docRes.rows[0].id;

    const chunks = chunkText(extractedText, 1000);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length < 10) continue;

      const vectorStr = await computeVector768(chunk);

      await query(
        `INSERT INTO document_embeddings (document_id, chunk_index, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [docId, i, chunk, vectorStr, JSON.stringify({ source: sourceName })]
      );

      const progress = 40 + Math.floor(((i + 1) / chunks.length) * 60);
      await query(`UPDATE ai_training_jobs SET progress = $1 WHERE id = $2`, [progress, jobId]);
    }

    await query(`UPDATE ai_training_jobs SET status = 'COMPLETED', progress = 100, completed_at = NOW() WHERE id = $1`, [jobId]);
  } catch (error) {
    console.error('Background Training Error:', error);
    await query(`UPDATE ai_training_jobs SET status = 'FAILED', error_message = $1 WHERE id = $2`, [error.message || 'Error desconocido', jobId]);
  }
};
