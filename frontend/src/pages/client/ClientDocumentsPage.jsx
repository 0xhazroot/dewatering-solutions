import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import { FileText, Download, FileArchive, Search, Filter, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

const ClientDocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  
  const documents = [
    {
      id: 'DOC-2026-101',
      title: 'Reporte de Reología y Sedimentación MCR',
      project: 'PRJ-2026-041 (Antapaccay)',
      type: 'Reporte Técnico',
      date: '05-Jun-2026',
      size: '4.2 MB',
      category: 'technical'
    },
    {
      id: 'DOC-2026-088',
      title: 'Certificado de Garantía - Placas Filtrantes',
      project: 'Suministro Lote 45',
      type: 'Certificado de Calidad',
      date: '28-May-2026',
      size: '1.1 MB',
      category: 'quality'
    },
    {
      id: 'DOC-2026-052',
      title: 'Manual de Operación de Centrífuga Pusher',
      project: 'PRJ-2026-045',
      type: 'Manual de Equipo',
      date: '15-May-2026',
      size: '15.8 MB',
      category: 'manual'
    },
    {
      id: 'DOC-2025-210',
      title: 'Dossier de Calidad - Overhaul Filtro Prensa',
      project: 'PRJ-2025-089 (Marcobre)',
      type: 'Dossier Final (Data Book)',
      date: '15-Dic-2025',
      size: '45.5 MB',
      category: 'dossier'
    }
  ];

  const getIconForCategory = (cat) => {
    switch(cat) {
      case 'technical': return <Activity size={20} color="var(--accent-primary)" />;
      case 'quality': return <ShieldCheck size={20} color="var(--success)" />;
      case 'manual': return <FileText size={20} color="var(--warning)" />;
      case 'dossier': return <FileArchive size={20} color="#8b5cf6" />;
      default: return <FileText size={20} color="var(--text-secondary)" />;
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      Swal.fire({
        title: 'Preparando Documento...',
        html: `Generando y verificando:<br><b>${doc.title}</b>`,
        icon: 'info',
        showConfirmButton: false,
        timer: 1200,
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${doc.id}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Error al generar PDF en el servidor');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = doc.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${doc.id}_${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        title: '¡Descarga Completa!',
        text: `El documento oficial ${doc.id} se ha descargado correctamente en su dispositivo.`,
        icon: 'success',
        timer: 2200,
        showConfirmButton: false,
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      });
    } catch (error) {
      console.warn('Fallback a descarga directa:', error);
      window.open(`/api/documents/${doc.id}/pdf`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Mis Documentos" subtitle="Repositorio seguro de manuales, certificados y reportes técnicos">
      
      {/* Barra de Búsqueda y Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar documento por nombre, proyecto o ID..." 
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} 
          />
        </div>
        <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Filter size={18} /> Filtrar por Tipo
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Documento</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Proyecto / Referencia</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fecha</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tamaño</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Descarga</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length > 0 ? filteredDocuments.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="hover-row">
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getIconForCategory(doc.category)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{doc.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {doc.type} | ID: {doc.id}
                        {doc.category === 'dossier' && (
                          <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 600 }}>
                            ★ ISO 9001 Turnover Package
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {doc.project}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {doc.date}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {doc.size}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDownload(doc)} 
                    disabled={downloadingId === doc.id}
                    className="btn-outline" 
                    title="Descargar Documento Oficial" 
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '0.85rem', 
                      cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer',
                      backgroundColor: doc.category === 'dossier' ? 'rgba(139, 92, 246, 0.1)' : undefined,
                      borderColor: doc.category === 'dossier' ? '#8b5cf6' : undefined,
                      color: doc.category === 'dossier' ? '#8b5cf6' : undefined,
                      fontWeight: doc.category === 'dossier' ? 600 : 500
                    }}
                  >
                    <Download size={16} /> {downloadingId === doc.id ? 'Descargando...' : (doc.category === 'dossier' ? 'Bajar Dossier PDF' : 'Bajar PDF')}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No se encontraron documentos que coincidan con la búsqueda "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style>{`
        .hover-row:hover {
          background-color: var(--bg-secondary);
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ClientDocumentsPage;
