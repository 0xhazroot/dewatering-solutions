import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import api from '../../services/api.js';
import { Mail, Phone, Building, Briefcase, Clock, Search, Filter, MoreVertical, Calendar } from 'lucide-react';

const COLUMNS = [
  { id: 'NEW', label: 'Nuevo', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'CONTACTED', label: 'Contactado', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'EVALUATING', label: 'Evaluando', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'PROPOSAL', label: 'Propuesta', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { id: 'WON', label: 'Ganado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
];

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDesc, setQuoteDesc] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(res.data?.leads || res.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const leadIdStr = e.dataTransfer.getData('leadId');
    if (!leadIdStr) return;

    const leadToMove = leads.find(l => l.id.toString() === leadIdStr);
    if (leadToMove && leadToMove.status !== targetStatus) {
      // Optimizacion UI (Update local state instantly)
      setLeads(prev => prev.map(l => l.id.toString() === leadIdStr ? { ...l, status: targetStatus } : l));
      
      try {
        await api.put(`/leads/${leadIdStr}`, { status: targetStatus });
      } catch (error) {
        console.error('Error updating lead status:', error);
        // Revertir si falla
        fetchLeads();
      }
    }
  };

  const filteredLeads = leads.filter(l => 
    (l.contact_name?.toLowerCase().includes(search.toLowerCase()) || 
     l.company_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSendQuote = async () => {
    if (!quoteTitle || !quoteAmount) return Swal.fire('Error', 'Ingrese título y monto', 'error');
    setIsQuoting(true);
    const amountVal = parseFloat(quoteAmount);
    try {
      await api.post('/quotations', {
        title: quoteTitle,
        description: quoteDesc || `Cotización solicitada por ${selectedLead.company_name}`,
        lead_id: selectedLead.id,
        items: [{ description: quoteTitle, quantity: 1, unit_price: amountVal, subtotal: amountVal }],
        subtotal: amountVal,
        tax: 0,
        total: amountVal,
        currency: 'USD',
      });
      Swal.fire('¡Éxito!', 'Cotización enviada. El cliente la verá en su portal.', 'success');
      setShowQuoteForm(false);
      setQuoteTitle('');
      setQuoteAmount('');
      setQuoteDesc('');
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar la cotización', 'error');
    } finally {
      setIsQuoting(false);
    }
  };

  return (
    <DashboardLayout title="Leads (Prospectos)" subtitle="Gestión comercial y pipeline">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="Buscar por empresa o contacto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', margin: 0 }}
            />
          </div>
          <button className="btn btn-ghost"><Filter size={18} /> Filtros</button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando pipeline...</div>
      ) : (
        <div style={{ 
          display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem',
          minHeight: 'calc(100vh - 250px)'
        }}>
          {COLUMNS.map(column => {
            const columnLeads = filteredLeads.filter(l => l.status === column.id);
            return (
              <div 
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                style={{ 
                  flex: '0 0 320px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  display: 'flex', flexDirection: 'column',
                  maxHeight: 'calc(100vh - 250px)'
                }}
              >
                {/* Column Header */}
                <div style={{ 
                  padding: '1.25rem', borderBottom: '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: column.color }}></div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{column.label}</h3>
                  </div>
                  <span style={{ 
                    backgroundColor: 'var(--bg-primary)', padding: '0.2rem 0.6rem', 
                    borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)'
                  }}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Body (Draggable items) */}
                <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {columnLeads.map(lead => (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        padding: '1.25rem', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        cursor: 'grab', transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: column.color, backgroundColor: column.bg, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {lead.service_interest || 'General'}
                        </span>
                        <MoreVertical size={16} color="var(--text-secondary)" />
                      </div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{lead.company_name || 'Empresa Sin Nombre'}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        <Briefcase size={14} /> {lead.contact_name}
                      </div>
                      
                      <div style={{ borderTop: '1px dashed var(--border-color)', margin: '0.75rem 0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(lead.created_at).toLocaleDateString('es-PE')}
                        </div>
                        {lead.priority === 'URGENT' && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)' }} title="Prioridad Alta"></span>}
                      </div>
                    </div>
                  ))}
                  {columnLeads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      Arrastra un lead aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalles Lead */}
      {selectedLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Detalles del Prospecto</h3>
              <button onClick={() => { setSelectedLead(null); setShowQuoteForm(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Empresa</p>
                  <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16}/> {selectedLead.company_name || 'No especificado'}</p>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Contacto</p>
                  <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16}/> {selectedLead.contact_name}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Email</p>
                  <p style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={16}/> {selectedLead.contact_email}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Teléfono</p>
                  <p style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={16}/> {selectedLead.contact_phone || 'No especificado'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Servicio de Interés</p>
                <span className="badge badge-success">{selectedLead.service_interest || 'General'}</span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mensaje / Requerimiento</p>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {selectedLead.message || <i>El cliente no dejó un mensaje.</i>}
                </div>
              </div>

              {showQuoteForm && (
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18}/> Generador de Cotización (PDF)</h4>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>Título de la Propuesta</label>
                    <input type="text" className="input-control" value={quoteTitle} onChange={e => setQuoteTitle(e.target.value)} placeholder="Ej. Suministro de Bomba PEMO" />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>Monto Total (USD)</label>
                    <input type="number" className="input-control" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Ej. 15000" />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>Descripción / Notas</label>
                    <textarea className="input-control" rows="2" value={quoteDesc} onChange={e => setQuoteDesc(e.target.value)} placeholder="Detalles extra..."></textarea>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSendQuote} disabled={isQuoting}>
                    {isQuoting ? 'Generando PDF y Enviando...' : 'Confirmar y Enviar Cotización'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button className="btn btn-ghost" onClick={() => { setSelectedLead(null); setShowQuoteForm(false); }}>Cerrar</button>
                {!showQuoteForm && (
                  <button className="btn" style={{ backgroundColor: 'var(--warning)', color: '#fff' }} onClick={() => setShowQuoteForm(true)}>
                    <FileText size={16}/> Generar Cotización
                  </button>
                )}
                <a href={`mailto:${selectedLead.contact_email}`} className="btn btn-primary"><Mail size={16}/> Contactar</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LeadsPage;
