# 🎙️ Guion Magistral de Exposición — Dewatering Solutions Platform
### Discurso Completo Palabra por Palabra (Arquitectura, Cloud/DevOps, Seguridad, CRM y Chatbot IA RAG)

---

## 🟢 BLOQUE 1: Introducción y Problema de Negocio (Minuto 0:00 - 1:30)

**[🖥️ En pantalla: Página de Inicio `http://localhost:5173` — Haciendo scroll suave por el Hero, Servicios y Clientes Mineros]**

> **🗣️ Qué decir:**
> "Buenos días profesor y compañeros. Hoy les presentamos **Dewatering Solutions Platform**, un ecosistema empresarial Full-Stack desarrollado para la empresa peruana **Dewatering Solutions**, fundada en Lima en el 2017 y certificada con la norma **ISO 9001**.
>
> Dewatering Solutions se especializa en ingeniería de **separación sólido-líquido** para la gran y mediana minería en el Perú —trabajando con unidades mineras como Antamina, Cerro Verde, Las Bambas, Antapaccay y Buenaventura— proveyendo ensayos metalúrgicos de laboratorio, pilotajes en planta y suministro de maquinaria pesada importada de **Italia y Sudáfrica**, como filtros prensa, espesadores, decanters centrífugos y bombas para pulpas abrasivas.
>
> **¿Cuál era la problemática?** Hasta hoy, la empresa manejaba la captación de clientes, el envío de cotizaciones, el seguimiento de proyectos post-venta y las consultas técnicas de ingeniería de forma fragmentada por correo y hojas de cálculo.
>
> Nuestra solución unifica **cuatro sistemas en una sola plataforma**:
> 1. Un **Portal Corporativo Público** con catálogo técnico de 6 categorías metalúrgicas, 13 servicios y equipos industriales conectados al flujo comercial.
> 2. Un **Sistema Interno CRM y ERP** con tablero Kanban de prospectos y generación de cotizaciones en PDF en tiempo real.
> 3. Un **Portal B2B privado para Clientes Mineros**, donde cada minera consulta el avance de sus proyectos y descarga sus dossieres de calidad ISO.
> 4. Y nuestro principal diferenciador tecnológico: el **'Ingeniero Virtual'**, un asistente técnico con Inteligencia Artificial basado en arquitectura **RAG (*Retrieval-Augmented Generation*) Multimodal**."

---

## 🤖 BLOQUE 2: El Chatbot IA ("Ingeniero Virtual") y Arquitectura RAG (Minuto 1:30 - 3:30)

**[🖥️ En pantalla: Abrir el widget flotante abajo a la derecha (`DewateringChatbot.jsx`) y escribir: `¿Qué especificaciones tiene el Filtro Prensa Automático FPA-1500 y qué bomba de alimentación recomiendan?`]**

> **🗣️ Qué decir:**
> "Quiero profundizar primero en cómo hemos diseñado el **Ingeniero Virtual**, porque no es un simple wrapper conectado a un LLM genérico que podría inventar o 'alucinar' datos técnicos. En minería, dar un dato falso de presión en bares o caudal puede dañar un equipo de cien mil dólares.
>
> Por eso implementamos una arquitectura **RAG Híbrida sobre PostgreSQL 16 con la extensión vectorial `pgvector`**:
> 1. **Primero (Vectorización)**: Cuando un ingeniero de planta escribe una consulta aquí en el widget, el backend en Node.js 22 la recibe en el controlador `chatController.js` y la transforma en un vector matemático de **768 dimensiones** utilizando el modelo `gemini-embedding-2` / `text-embedding-004`.
> 2. **Segundo (Búsqueda Semántica Coseno)**: Ese vector de 768 dimensiones se compara en milisegundos contra nuestra tabla `document_embeddings` en PostgreSQL usando un índice **`IVFFlat`** y el operador de **distancia coseno (`<=>`)**.
> 3. **Tercero (Filtro Anti-Alucinaciones)**: Aplicamos un umbral estricto de relevancia (`similarity > 0.35 / 0.40`). Si el fragmento documental no supera ese porcentaje de similitud semántica, se descarta para no contaminar el prompt.
> 4. **Cuarto (Cruce Híbrido con el Catálogo Relacional)**: Además de los manuales vectorizados, el controlador consulta en tiempo real las tablas relacionales `products` (que almacenan especificaciones técnicas en columnas `JSONB`) y `services`.
> 5. **Quinto (Generación Determinista)**: Todo ese contexto verificado se inyecta en el `systemInstruction` del modelo con una **temperatura baja de `0.3`** y un máximo de **`2048` tokens**, formateando la respuesta en Markdown limpio como vemos en pantalla: nos entrega exactamente los `16 bar` de presión, `50 m³/h` de capacidad, `200 m²` de área de filtración y las `80 placas` del Filtro Prensa FPA-1500 italiano, junto con la recomendación de la Bomba Centrífuga BA-200 sudafricana."

---

## 🔐 BLOQUE 3: Seguridad Zero-Trust, Login y Entrenamiento IA en Vivo (Minuto 3:30 - 5:30)

**[🖥️ En pantalla: Ir a `Portal Corporativo (/login)` e ingresar con `admin@dewatering.com` / `Admin@2026`]**

> **🗣️ Qué decir:**
> "Ahora pasemos al entorno corporativo interno. A nivel de ciberseguridad, hemos implementado un modelo **Zero-Trust de Defensa en Profundidad en 5 anillos**:
> * Las contraseñas se almacenan con hashing **bcrypt de 12 rondas de sal**.
> * Contamos con protección contra fuerza bruta en `authService.js`: al quinto intento fallido, la cuenta se bloquea automáticamente por **15 minutos**.
> * La sesión se gestiona con **JSON Web Tokens (JWT)** firmados con `HS256` y soporte para **Autenticación Multifactor (MFA/TOTP)** bajo el estándar **RFC 6238**, compatible con Google Authenticator mediante códigos QR generados con `speakeasy`.
> * Y la autorización es de **doble capa (RBAC + ABAC)**: primero `rbacMiddleware.js` valida los 3 roles oficiales del sistema (`SUPER_ADMIN`, `OPERATOR` y `CLIENT`), y luego `abacMiddleware.js` valida atributos granulares, como la jurisdicción geográfica por sucursal y qué campos exactos del JSON tiene permitido editar un operador."

**[🖥️ En pantalla: Entrar en el menú lateral a `Entrenamiento IA (/ai-training)`]**

> **🗣️ Qué decir:**
> "Aquí estamos en el **Centro de Entrenamiento IA (`/ai-training`)**, exclusivo para el rol `SUPER_ADMIN`. ¿Cómo aprende nuestro Chatbot cuando llegan nuevos manuales o protocolos mineros?
>
> Tenemos dos modalidades de ingesta en `aiController.js`:
> 1. **Inyección de Texto Técnico Directo**: Donde nuestro algoritmo `chunkText` divide automáticamente el documento respetando los saltos de párrafo en fragmentos de aproximadamente **1,000 caracteres**, calcula la estimación de tokens (`chunks * 250`) y los vectoriza en `document_embeddings`.
> 2. **Ingestión Multimodal Asíncrona en Segundo Plano**: Podemos subir archivos **PDF** (procesados con `pdf-parse-new`), documentos **Word `.docx`** (procesados con `mammoth`) e incluso **Imágenes de planos o placas técnicas `.png`/`.jpg`** (donde usamos la visión artificial de Gemini como OCR técnico).
>
> Para no bloquear el navegador cuando se sube un manual pesado, aplicamos un patrón de **trabajos en segundo plano (`Background Jobs`)**: el backend respalda el archivo en el bucket `dewatering-documents`, crea un registro en la tabla `ai_training_jobs` con estado `PENDING`, responde inmediatamente un código **`HTTP 202 Accepted`** y procesa la extracción y vectorización en segundo plano mientras el frontend hace *polling* cada 5 segundos mostrando la barra de progreso del 10% al 100%."

*(Opcional en vivo: Escribir un título como `Norma Operativa Cerro Verde 2026` y un texto corto, darle a **"Entrenar Modelo IA"** y mostrar cómo aparece al instante en la columna derecha de "Conocimiento Actual").*

**[🖥️ En pantalla: Abrir el widget del "Ingeniero Virtual IA" y hacer clic en los chips `🧮 Dimensionar (45 m³/h, 32% Cp)` y `⚡ Cotizar FPA-1500 (Agente IA)`]**

> **🗣️ Qué decir (La joya de la corona — El Agente IA Transaccional):**
> "Además de ser un motor RAG Multimodal, evolucionamos al Ingeniero Virtual hacia un **Agente IA Transaccional con Ejecución de Herramientas (*Function Calling*)**:
> * **1. Calculadora Metalúrgica Integrada:** Cuando un ingeniero de planta ingresa su caudal y porcentaje de sólidos (por ejemplo, `45 m³/h con 32% de sólidos`), el agente ejecuta nuestro balance metalúrgico en el backend, calculando la densidad de pulpa (`1.28 t/m³`), el tonelaje seco (`18.14 TPH` / `435 TPD`), el área de filtración requerida (`165 m²`) y seleccionando el equipo óptimo del catálogo.
> * **2. Emisión Autónoma de Leads y Cotizaciones PDF con Código QR:** Si el cliente pide cotizar un equipo desde el chat, el Agente IA no solo le responde con texto: se conecta transaccionalmente con nuestra base de datos, **registra automáticamente al prospecto en el CRM Kanban con prioridad Alta** y **emite en vivo una Pre-Cotización Oficial (`COT-2026-XXXX`) con desglose de IGV (18%) y Sello QR**, entregándole aquí mismo en el chat el botón para descargar el PDF oficial o enviarlo directo a **WhatsApp Business**."

---

## 📊 BLOQUE 4: CRM Kanban Omnicanal, Cotizaciones PDF con QR y Auditoría Forense (Minuto 5:30 - 7:00)

**[🖥️ En pantalla: Entrar a `Prospectos CRM (/leads)`, luego a `Cotizaciones (/admin/quotations)` y descargar el PDF de `COT-2026-0001`, y finalmente mostrar `Auditoría (/audit)`]**

> **🗣️ Qué decir:**
> "En la parte operativa del negocio:
> * Cuando una empresa minera llena el formulario web o interactúa con el **Agente IA**, el requerimiento cae automáticamente aquí en el **Pipeline Kanban de Leads (`/leads`)**, identificando con el badge **`✨ Agente IA`** los prospectos capturados autónomamente. Además, integramos **Omnicanalidad con WhatsApp Business (`wa.me`)** en cada tarjeta y modal para contactar al cliente en un clic con un mensaje técnico personalizado.
> * En el **Motor de Cotizaciones (`/admin/quotations`)**, al hacer clic en **`PDF + QR`**, el controlador `quotationController.js` genera en tiempo real mediante `PDFKit` y `qrcode` un documento oficial numerado correlativamente (`COT-2026-XXXX`), con cálculo automático de Subtotal + IGV (18%), soporte **multimoneda (`USD $` / `PEN S/.`)** y un **Sello QR de Verificación Digital** para validar la autenticidad de la oferta, además de envío directo por **WhatsApp Business**.
> * Finalmente, en el módulo de **Auditoría (`/audit`)**, gestionado por `auditService.js`, cada acción crítica del sistema (`CREATE`, `UPDATE`, `DELETE`, `UPDATE_STATUS`) queda registrada de forma inmutable en la tabla `audit_logs`, guardando el usuario, la dirección IP, la marca de tiempo y el *diff* exacto en formato `JSONB` (`old_data` versus `new_data`)."

---

## ☁️ BLOQUE 5: Tu Rol — Cloud, DevOps, Contenedores Docker, Terraform y QA (Minuto 7:00 - 9:00)

**[🖥️ En pantalla: Mostrar el [`README.md`](file:///c:/pretesis-haziel/dewatering-platform/README.md) con los diagramas de arquitectura, y abrir [`docker/docker-compose.yml`](file:///c:/pretesis-haziel/dewatering-platform/docker/docker-compose.yml), [`frontend/Dockerfile`](file:///c:/pretesis-haziel/dewatering-platform/frontend/Dockerfile), [`frontend/nginx.conf`](file:///c:/pretesis-haziel/dewatering-platform/frontend/nginx.conf) y [`terraform/main.tf`](file:///c:/pretesis-haziel/dewatering-platform/terraform/main.tf)]**

> **🗣️ Qué decir (Tu parte protagonista como responsable de Cloud, DevOps y QA):**
> "Ahora explicaré el trabajo realizado en la capa de **Ingeniería Cloud, DevOps y Aseguramiento de Calidad (QA)**, de la cual estuve a cargo:
>
> **1. Contenerización con Docker Multi-Stage y Red Aislada:**
> Empaquetamos toda la plataforma en dos contenedores herméticos orquestados mediante `docker-compose.yml` sobre una red bridge privada (`dewatering_solutions_network`):
> * Para el **Frontend (`frontend/Dockerfile`)**, implementamos un **Multi-Stage Build**: en la primera etapa usamos `node:22-alpine` para compilar los estáticos optimizados con Vite 8, y en la segunda etapa copiamos únicamente la carpeta `/dist` hacia una imagen ultraligera de **`nginx:alpine`**, logrando una imagen de producción de apenas ~45 MB sin código fuente ni dependencias pesadas de desarrollo.
> * Para el **Backend (`backend/Dockerfile`)**, utilizamos `node:22-alpine` ejecutando instalaciones deterministas con `npm ci` y exponiendo el puerto interno `3000`.
>
> **2. Proxy Inverso y Seguridad de Red en Nginx (`frontend/nginx.conf`):**
> Configuramos Nginx no solo para servir el enrutamiento SPA de React Router 7 (`try_files $uri /index.html`) y caché de activos estáticos por 6 meses, sino también como **Reverse Proxy unificado**:
> * Toda petición que llega al bloque `location /api/` en el puerto `80` es redirigida internamente por Nginx hacia `http://backend:3000/api/` dentro de la red de Docker.
> * Además, configuramos `client_max_body_size 20M;` para permitir la subida de manuales PDF e imágenes pesadas al módulo de entrenamiento de IA sin errores `413 Payload Too Large`, y eliminamos por completo problemas de CORS en producción.
>
> **3. Infraestructura como Código (IaC) para AWS con Terraform (`terraform/main.tf`):**
> En lugar de configurar servidores manualmente en la consola de AWS, automatizamos el despliegue mediante **Terraform**:
> * Nuestro archivo `terraform/main.tf` busca dinámicamente la última imagen oficial de **Ubuntu Server 24.04 LTS**, aprovisiona el **Security Group (Firewall)** con las reglas de entrada necesarias, levanta la instancia **Amazon EC2 (`t3.small` con volumen SSD `gp3` de 20 GB)** y ejecuta un script `user_data` que instala Docker Engine, clona el repositorio desde GitHub y deja lista la plataforma de forma desatendida.
>
> **4. Resiliencia, Pruebas QA y Estado Actual del Despliegue:**
> En la etapa de **QA y Pruebas**, validamos el endpoint de monitoreo `/api/health` y programamos un sistema de **Alta Disponibilidad y Tolerancia a Fallos en `server.js` y `db.js`**: si por restricciones de red o mantenimiento la base de datos externa tarda en responder, el servidor no se cae y conmuta automáticamente a un motor resiliente en memoria.
>
> **¿Por qué hoy estamos ejecutando la demostración desde nuestro entorno Staging local?**
> Toda la infraestructura para AWS (`Dockerfile`, `nginx.conf`, `docker-compose.yml` y `terraform/main.tf`) ya está terminada y probada en el repositorio. Sin embargo, dado que el sistema maneja cotizaciones y documentación técnica de clientes mineros bajo certificación **ISO 9001**, por políticas de gobernanza de TI estamos a la espera de que la gerencia de **Dewatering Solutions** nos entregue las credenciales IAM de su **cuenta corporativa de AWS (bajo el programa empresarial AWS Activate)**, evitando alojar datos corporativos en cuentas personales de estudiantes. Apenas nos habiliten el usuario IAM, con ejecutar un solo comando (`terraform apply`) toda la arquitectura que ven aquí queda publicada en AWS en menos de 2 minutos."

---

## 🛡️ Respuestas Rápidas para Preguntas del Profesor (Tu Escudo Técnico)

1. **Profesor: "¿Por qué eligieron desplegar en AWS EC2 con Docker Compose en vez de usar microservicios en Kubernetes (EKS) o RDS?"**
   * **Tu respuesta**: *"Por pragmatismo arquitectónico y optimización de costos (FinOps). Para la carga transaccional actual de Dewatering Solutions, un clúster EKS o una instancia RDS dedicada costaría más de \$150 al mes. Con **EC2 + Docker Compose** para el cómputo y **Supabase PostgreSQL (`pgvector`)** para la persistencia vectorial, mantenemos aislamiento de contenedores, cero bloqueo de proveedor (*vendor lock-in*) y reducimos el costo operativo en más de un 80%."*
2. **Profesor: "¿Cómo se comunican el Frontend y el Backend dentro de Docker sin que falle el CORS?"**
   * **Tu respuesta**: *"En producción el navegador nunca llama directo al puerto 3000 del backend. El frontend compila con `VITE_API_URL=/api`. Todas las peticiones entran por el puerto 80 del contenedor Nginx, y Nginx hace un `proxy_pass http://backend:3000/api/` a través de la red bridge interna de Docker (`dewatering_solutions_network`). Para el navegador todo ocurre en el mismo origen (`Same-Origin`)."*
3. **Profesor: "¿Cómo evitaron inyecciones SQL y ataques de fuerza bruta?"**
   * **Tu respuesta**: *"En los 8 modelos de datos usamos exclusivamente consultas parametrizadas (`$1, $2...`) del driver `pg`, nunca concatenación de strings. Y en `authService.js` tenemos un limitador en memoria que bloquea la cuenta durante 15 minutos tras 5 intentos fallidos, además de cabeceras HTTP seguras con `Helmet`."*

