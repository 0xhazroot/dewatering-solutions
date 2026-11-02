import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, Download, ExternalLink, ThumbsUp, ThumbsDown, Sparkles, Calculator, FileText, PhoneCall, Paperclip, FileCheck } from 'lucide-react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const QUICK_ACTIONS = [
  {
    label: '⚡ Cotizar FPA-1500 (Agente IA)',
    prompt: 'Cotízame 1 Filtro Prensa Automático FPA-1500 para Compañía Minera Antamina',
    icon: Sparkles
  },
  {
    label: '🧮 Dimensionar (45 m³/h, 32% Cp)',
    prompt: 'Calcula qué filtro prensa necesito para un caudal de 45 m3/h con 32% de sólidos',
    icon: Calculator
  },
  {
    label: '📄 Catálogo Oficial',
    prompt: '¿Qué equipos industriales y bombas tienen en su catálogo oficial?',
    icon: FileText
  }
];

const DewateringChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: '¡Hola! Soy el **Ingeniero Virtual** de Dewatering Solutions.\n\nPuedo ayudarte con especificaciones de equipos, dimensionamiento de caudales, análisis de manuales/fotos o generar una cotización para tu proyecto. ¿En qué te puedo asesorar hoy?',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, type, data, preview }
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('El archivo no debe exceder los 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result;
      const base64Data = resultStr.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        data: base64Data,
        preview: file.type.startsWith('image/') ? resultStr : null
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const sendMessageText = async (userMessage, attachObj = null) => {
    const textToSend = userMessage.trim();
    if (!textToSend && !attachObj && !attachment) return;
    if (isLoading) return;

    const currentAttach = attachObj || attachment;
    setInput('');
    setAttachment(null);

    const userBubble = {
      role: 'user',
      text: textToSend || (currentAttach ? `[Archivo adjunto: ${currentAttach.name}]` : ''),
      attachmentPreview: currentAttach?.preview || null,
      attachmentName: currentAttach?.name || null
    };

    setMessages(prev => [...prev, userBubble]);
    setIsLoading(true);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));
      const response = await api.post('/chat', {
        message: textToSend,
        history,
        attachment: currentAttach
          ? {
              name: currentAttach.name,
              mimeType: currentAttach.mimeType,
              data: currentAttach.data
            }
          : null
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: response.data.response,
          agentAction: response.data.agentAction || null,
          calcResult: response.data.calcResult || null,
          sources: response.data.sources || []
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: 'Lo siento, hubo un error al procesar su consulta. Por favor intente más tarde o contacte a soporte.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    await sendMessageText(input, attachment);
  };

  const handleFeedback = async (idx, helpful) => {
    setFeedbackGiven(prev => ({ ...prev, [idx]: helpful ? 'up' : 'down' }));
    try {
      await api.post('/chat/feedback', { messageIndex: idx, helpful });
    } catch (_) {}
  };

  const getFullPdfUrl = (pdfUrl) => {
    if (!pdfUrl) return '#';
    if (pdfUrl.startsWith('http')) return pdfUrl;
    const cleanBase = apiBase.replace(/\/api\/?$/, '');
    return `${cleanBase}${pdfUrl}`;
  };

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '65px',
            height: '65px',
            borderRadius: '50%',
            backgroundColor: 'white',
            border: 'none',
            boxShadow: '0 4px 20px rgba(54, 124, 252, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            overflow: 'hidden',
            padding: 0,
            animation: 'floatAnimation 3s ease-in-out infinite'
          }}
          onMouseOver={e => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseOut={e => (e.currentTarget.style.animationPlayState = 'running')}
        >
          <style>
            {`
              @keyframes floatAnimation {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
              }
            `}
          </style>
          <img
            src="/chatbot-mascot.png"
            alt="Chatbot"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </button>
      )}

      {/* Ventana de Chat Flotante */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '420px',
            maxWidth: 'calc(100vw - 2rem)',
            height: '650px',
            maxHeight: 'calc(100vh - 3rem)',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Header del Chat */}
          <div
            style={{
              background: 'var(--accent-gradient)',
              color: 'white',
              padding: '1rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <img src="/chatbot-mascot.png" alt="Ingeniero Virtual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Ingeniero Virtual</h3>
                <span style={{ fontSize: '0.73rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 7, height: 7, backgroundColor: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
                  En línea
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <a
                href="https://wa.me/51987654321?text=Hola%20Dewatering%20Solutions,%20vengo%20del%20Ingeniero%20Virtual%20IA%20y%20deseo%20atenci%C3%B3n%20comercial."
                target="_blank"
                rel="noopener noreferrer"
                title="Hablar por WhatsApp Business"
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <PhoneCall size={13} /> WhatsApp
              </a>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Área de mensajes */}
          <div
            style={{
              flex: 1,
              padding: '1.1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}
              >
                {msg.role === 'model' && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'var(--accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MessageSquare size={14} color="var(--accent-primary)" />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '88%',
                    padding: '0.85rem 1rem',
                    borderRadius: '16px',
                    backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'model' ? '4px' : '16px',
                    border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none',
                    overflowX: 'auto'
                  }}
                >
                  {msg.role === 'user' ? (
                    <div>
                      {msg.attachmentPreview && (
                        <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px' }}>
                          <img src={msg.attachmentPreview} alt="Adjunto" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                      )}
                      {msg.attachmentName && !msg.attachmentPreview && (
                        <div style={{ marginBottom: '6px', fontSize: '0.78rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FileCheck size={14} /> {msg.attachmentName}
                        </div>
                      )}
                      <div>{msg.text}</div>
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0', lineHeight: 1.55 }} {...props} />,
                          ul: ({ node, ...props }) => <ul style={{ margin: '0 0 10px 0', paddingLeft: '18px' }} {...props} />,
                          ol: ({ node, ...props }) => <ol style={{ margin: '0 0 10px 0', paddingLeft: '18px' }} {...props} />,
                          li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                          h3: ({ node, ...props }) => <h3 style={{ margin: '12px 0 6px 0', fontSize: '0.96rem', fontWeight: 700, color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '3px' }} {...props} />,
                          h4: ({ node, ...props }) => <h4 style={{ margin: '10px 0 4px 0', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }} {...props} />,
                          strong: ({ node, ...props }) => <strong style={{ fontWeight: 600, color: 'var(--accent-primary)' }} {...props} />,
                          table: ({ node, ...props }) => (
                            <div style={{ overflowX: 'auto', margin: '10px 0', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }} {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }} {...props} />,
                          th: ({ node, ...props }) => <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }} {...props} />,
                          td: ({ node, ...props }) => <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} {...props} />,
                          pre: ({ node, ...props }) => (
                            <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '8px 12px', borderRadius: '8px', fontSize: '0.76rem', overflowX: 'auto', margin: '8px 0', fontFamily: 'monospace' }} {...props} />
                          ),
                          code: ({ node, inline, ...props }) => (
                            inline
                              ? <code style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)', fontFamily: 'monospace' }} {...props} />
                              : <code {...props} />
                          ),
                          hr: ({ node, ...props }) => <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} {...props} />
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>

                      {/* Tarjeta de Acción Transaccional del Agente IA (Descarga PDF + WhatsApp) */}
                      {msg.agentAction && msg.agentAction.type === 'QUOTATION_CREATED' && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--accent-primary)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📄 {msg.agentAction.quotationNumber}</span>
                            <span>USD $ {Number(msg.agentAction.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <a
                              href={getFullPdfUrl(msg.agentAction.pdfUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                flex: 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                backgroundColor: 'var(--accent-primary)',
                                color: 'white',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                textDecoration: 'none'
                              }}
                            >
                              <Download size={14} /> Descargar PDF (QR)
                            </a>
                            <a
                              href={msg.agentAction.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                flex: 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                backgroundColor: '#25D366',
                                color: 'white',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={14} /> Enviar a WhatsApp
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Fuentes y Botones de Feedback */}
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px dashed var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(msg.sources || []).slice(0, 2).map((src, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: '0.68rem',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              📚 {src}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleFeedback(idx, true)}
                            title="Respuesta útil"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: feedbackGiven[idx] === 'up' ? '#10b981' : 'var(--text-secondary)'
                            }}
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(idx, false)}
                            title="Mejorar respuesta"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: feedbackGiven[idx] === 'down' ? '#ef4444' : 'var(--text-secondary)'
                            }}
                          >
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'var(--accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Loader2 size={14} color="var(--accent-primary)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Analizando consulta y documentos...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips de Acción Rápida */}
          <div
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: 'var(--bg-primary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {QUICK_ACTIONS.map((action, idx) => {
              const IconComp = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessageText(action.prompt)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                  }}
                >
                  <IconComp size={12} />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Previsualización del archivo adjunto */}
          {attachment && (
            <div
              style={{
                padding: '0.4rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {attachment.preview ? (
                  <img src={attachment.preview} alt="Miniatura" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <FileCheck size={18} color="var(--accent-primary)" />
                )}
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {attachment.name}
                </span>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-secondary)' }}
                title="Quitar archivo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Input Box con botón de adjuntar PDF / Imagen */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-primary)',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            {/* Input oculto para subir archivos */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
            />

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Adjuntar PDF o Foto de equipo / requerimiento"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: attachment ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  color: attachment ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  flexShrink: 0
                }}
              >
                <Paperclip size={17} />
              </button>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={attachment ? 'Escribe tu consulta sobre el archivo...' : 'Escribe tu consulta o adjunta un archivo...'}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '99px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem'
                }}
              />

              <button
                type="submit"
                disabled={(!input.trim() && !attachment) || isLoading}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: (input.trim() || attachment) && !isLoading ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: (input.trim() || attachment) && !isLoading ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (input.trim() || attachment) && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <Send size={16} style={{ marginLeft: '2px' }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DewateringChatbot;
