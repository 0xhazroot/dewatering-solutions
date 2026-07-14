-- ========================================
-- MODELO DE DATOS — DEWATERING SOLUTIONS
-- ========================================

-- 1. Usuarios del sistema (Admin, Comercial, Ingeniero, Cliente)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(200),          -- Para clientes: nombre de su empresa
    position VARCHAR(100),         -- Cargo del contacto
    role VARCHAR(20) NOT NULL DEFAULT 'CLIENT',  
    -- SUPER_ADMIN | OPERATOR | CLIENT
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categorías de servicios
CREATE TABLE service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,       -- "Filtración", "Espesamiento", etc.
    slug VARCHAR(100) UNIQUE NOT NULL, -- "filtracion", "espesamiento"
    description TEXT,
    icon VARCHAR(50),                  -- Nombre del ícono Lucide
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Servicios ofrecidos
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES service_categories(id),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    short_description TEXT,           -- Para cards del catálogo
    full_description TEXT,            -- Para la página detalle
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Productos / Equipos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category VARCHAR(100),            -- "Filtros Prensa", "Bombas", etc.
    short_description TEXT,
    full_description TEXT,
    specifications JSONB,             -- Ficha técnica estructurada
    origin VARCHAR(50),               -- "Italia", "Sudáfrica"
    image_urls TEXT[],                -- Array de URLs de imágenes
    datasheet_url TEXT,               -- URL del PDF descargable
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Leads / Solicitudes de contacto
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    -- Datos del prospecto
    contact_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    company_name VARCHAR(200),
    company_sector VARCHAR(100),       -- "Minería", "Industrial", etc.
    -- Contexto de la solicitud
    source VARCHAR(50) DEFAULT 'WEB', -- WEB | WHATSAPP | REFERRAL | EVENT
    service_interest TEXT,             -- Qué servicio le interesa
    message TEXT,
    -- Pipeline CRM
    status VARCHAR(30) DEFAULT 'NEW', 
    -- NEW | CONTACTED | EVALUATING | PROPOSAL | NEGOTIATION | WON | LOST
    assigned_to UUID REFERENCES users(id),  -- Comercial asignado
    priority VARCHAR(10) DEFAULT 'MEDIUM',  -- LOW | MEDIUM | HIGH | URGENT
    -- Seguimiento
    next_follow_up DATE,
    lost_reason TEXT,                  -- Si se perdió, por qué
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Cotizaciones
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id),
    quotation_number VARCHAR(20) UNIQUE NOT NULL, -- "COT-2026-0042"
    version INT DEFAULT 1,
    -- Contenido
    title VARCHAR(300) NOT NULL,
    description TEXT,
    items JSONB NOT NULL,              -- Array de ítems con precio
    subtotal DECIMAL(12,2),
    tax DECIMAL(12,2),
    total DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'PEN', -- PEN | USD
    valid_until DATE,
    -- Estado
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- DRAFT | SENT | VIEWED | APPROVED | REJECTED | EXPIRED
    -- Archivos
    pdf_url TEXT,
    -- Metadata
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Proyectos (post-venta)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    quotation_id INT REFERENCES quotations(id),
    client_id UUID REFERENCES users(id),
    project_number VARCHAR(20) UNIQUE NOT NULL, -- "PRJ-2026-0015"
    title VARCHAR(300) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PLANNING',
    -- PLANNING | IN_PROGRESS | ON_HOLD | COMPLETED | CANCELLED
    start_date DATE,
    end_date DATE,
    assigned_engineer UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Documentos (fichas técnicas, informes, certificados)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    category VARCHAR(50),             -- DATASHEET | REPORT | CERTIFICATE | MANUAL | OTHER
    file_url TEXT NOT NULL,
    file_size INT,                     -- bytes
    file_type VARCHAR(20),             -- pdf, docx, etc.
    -- Acceso
    is_public BOOLEAN DEFAULT FALSE,   -- ¿Visible sin login?
    project_id INT REFERENCES projects(id), -- Si pertenece a un proyecto
    product_id INT REFERENCES products(id), -- Si es ficha de un producto
    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    download_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Mensajes del Chatbot (para entrenar y mejorar)
CREATE TABLE chatbot_conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id), -- NULL si es visitante anónimo
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    sources JSONB,                     -- Documentos usados como contexto RAG
    feedback VARCHAR(10),              -- HELPFUL | NOT_HELPFUL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Log
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Embeddings para RAG (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE document_embeddings (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,          -- Orden del chunk en el documento
    chunk_text TEXT NOT NULL,           -- Texto original del chunk
    embedding vector(768),             -- Gemini gemini-embedding-2
    metadata JSONB,                    -- Título del doc, página, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda de similitud
CREATE INDEX idx_embeddings_vector ON document_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 12. Sucursales (para ABAC Geográfico)
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Trabajos de Entrenamiento de IA en Segundo Plano
CREATE TABLE ai_training_jobs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, EXTRACTING, EMBEDDING, COMPLETED, FAILED
    progress INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
