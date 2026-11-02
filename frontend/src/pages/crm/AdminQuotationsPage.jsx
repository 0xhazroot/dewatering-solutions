import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import { FileText, Plus, CheckCircle, XCircle, Clock, Download, Search, MessageCircle, QrCode } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../services/api';

const AdminQuotationsPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDesc, setQuoteDesc] = useState('');
  const [leadId, setLeadId] = useState('');
  const [leads, setLeads] = useState([]);
  const [isQuoting, setIsQuoting] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

  const fetchQuotationsAndLeads = async () => {
    try {
      const [qRes, lRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/leads')
      ]);
      setQuotations(qRes.data.quotations || qRes.data || []);
      setLeads(lRes.data.leads || lRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationsAndLeads();
  }, []);

  const handleSendQuote = async () => {
    if (!quoteTitle || !quoteAmount || !leadId) return Swal.fire('Error', 'Ingrese título, monto y seleccione un cliente', 'error');
    setIsQuoting(true);
    const subtotalVal = parseFloat(quoteAmount);
    const taxVal = +(subtotalVal * 0.18).toFixed(2);
    const totalVal = +(subtotalVal + taxVal).toFixed(2);
    try {
      await api.post('/quotations', {
        title: quoteTitle,
        description: quoteDesc,
        lead_id: leadId,
        items: [{ description: quoteTitle, quantity: 1, unit_price: subtotalVal, subtotal: subtotalVal }],
        subtotal: subtotalVal,
        tax: taxVal,
        total: totalVal,
        currency: 'USD',
      });
      Swal.fire('¡Éxito!', 'Cotización enviada (incluye sello QR). El cliente la verá en su portal.', 'success');
      setShowForm(false);
      setQuoteTitle('');
      setQuoteAmount('');
      setQuoteDesc('');
      setLeadId('');
      fetchQuotationsAndLeads();
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar la cotización', 'error');
    } finally {
      setIsQuoting(false);
    }
  };

  const handleDownload = (id, number) => {
    Swal.fire({
      title: 'Generando PDF Oficial (con QR)...',
      text: 'Por favor espere un momento.',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    api.get(`/quotations/${id}/pdf`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Cotizacion_${number}.pdf`);
        document.body.appendChild(link);
        link.click();
        Swal.close();
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudo generar el documento.', 'error');
      });
  };

  const buildQuotationWhatsAppUrl = (q) => {
    const matchedLead = leads.find(l => String(l.id) === String(q.lead_id));
    const rawPhone = (matchedLead?.contact_phone || '51987654321').replace(/[^0-9]/g, '');
    const phone = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone || '51987654321';
    const cleanBase = apiBase.replace(/\/api\/?$/, '');
    const pdfLink = `${cleanBase}/api/quotations/${q.id}/pdf`;
    const msg = encodeURIComponent(
      `Estimado(a) *${q.lead_name || matchedLead?.contact_name || 'Cliente Corporativo'}* (*${q.lead_company || matchedLead?.company_name || 'Operación Minera'}*),\n\nLe compartimos nuestra Cotización Técnico-Comercial Oficial *${q.quotation_number}*:\n• *Proyecto:* ${q.title}\n• *Inversión Total:* ${q.currency || 'USD'} $ ${Number(q.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• *Descarga Directa PDF (con QR):* ${pdfLink}\n\nQuedamos atentos para coordinar la orden de compra o visita técnica.\n*Dewatering Solutions S.A.C. (ISO 9001)*`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const filteredQuotations = quotations.filter(q =>
    !search.trim() ||
    q.quotation_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.title?.toLowerCase().includes(search.toLowerCase()) ||
    q.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.lead_company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Gestión de Cotizaciones (PDF + QR)" subtitle="Emisión de propuestas técnico-comerciales y envío omnicanal por WhatsApp Business">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-control"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código COT-2026, cliente o equipo..."
              style={{ paddingLeft: '2.5rem', margin: 0 }}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Nueva Cotización
        </button>
      </div>

      {showForm && (
        <div className="animate-fade-in" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18}/>
            </div>
            Generar Nueva Cotización Oficial (con Verificación QR)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Cliente / Empresa (Lead)</label>
              <select className="input-control" value={leadId} onChange={e => setLeadId(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Seleccionar Cliente --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.contact_name} {l.company_name ? `(${l.company_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Título de la Propuesta</label>
              <input type="text" className="input-control" value={quoteTitle} onChange={e => setQuoteTitle(e.target.value)} placeholder="Ej. Suministro de Filtro Prensa FPA-1500" style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Subtotal Valor Venta (USD)</label>
              <input type="number" className="input-control" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Ej. 85000" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Descripción / Especificaciones Técnicas</label>
            <textarea className="input-control" rows="4" value={quoteDesc} onChange={e => setQuoteDesc(e.target.value)} placeholder="Detalles extra del equipo o servicio (Esto aparecerá en el PDF junto al código QR)..." style={{ width: '100%', resize: 'vertical' }}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSendQuote} disabled={isQuoting}>
              {isQuoting ? 'Generando PDF y Guardando...' : 'Confirmar y Emitir'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>N° Cotización</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detalle</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Monto Total (inc. IGV)</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estado</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones (PDF QR / WhatsApp)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Cargando cotizaciones...</td></tr>
            ) : filteredQuotations.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay cotizaciones registradas. Crea una nueva o pídele al Agente IA que emita una.</td></tr>
            ) : filteredQuotations.map(q => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={15} color="var(--accent-primary)" />
                    {q.quotation_number}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Emisión: {new Date(q.created_at).toLocaleDateString('es-PE')}</div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cliente: {q.lead_company || q.lead_name || 'Cliente Corporativo'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vence: {q.valid_until ? new Date(q.valid_until).toLocaleDateString('es-PE') : '15 días'}</div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  $ {Number(q.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  {(q.status === 'PENDING' || q.status === 'DRAFT' || q.status === 'SENT') && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', backgroundColor: 'rgba(245,158,11,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}><Clock size={14}/> {q.status === 'PENDING' ? 'Pendiente' : 'Emitida'}</span>}
                  {q.status === 'APPROVED' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}><CheckCircle size={14}/> Aprobada</span>}
                  {q.status === 'REJECTED' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}><XCircle size={14}/> Rechazada</span>}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleDownload(q.id, q.quotation_number)}
                      className="btn-ghost"
                      title="Descargar PDF Oficial (con QR)"
                      style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <Download size={16} color="var(--accent-primary)" /> PDF + QR
                    </button>
                    <a
                      href={buildQuotationWhatsAppUrl(q)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar Cotización por WhatsApp Business"
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#25D366',
                        color: '#fff',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminQuotationsPage;
