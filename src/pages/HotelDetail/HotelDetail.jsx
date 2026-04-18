import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner/Spinner'
import Modal from '../../components/Modal/Modal'
import HotelForm, { DEFAULT_FORM } from '../../components/HotelForm/HotelForm'
import './HotelDetail.css'

const TABS_BASE = ['Informations', 'Durées de nettoyage', 'Valets', 'Plannings']

const ALL_activeRoomTypes = ['T1', 'T2', 'T3', 'T4', 'T5']

const DUREE_ROWS = [
  { labelType: 'Départ',       keyPrefix: 'dureeDepart',         color: 'red' },
  { labelType: 'Chgt de drap', keyPrefix: 'dureeChangementDrap', color: 'blue' },
  { labelType: 'Recouche',     keyPrefix: 'dureeRecouche',       color: 'green' },
]

export default function HotelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const TABS = isAdmin
    ? ['Informations', 'Durées de nettoyage', 'Valets', 'Gouvernants', 'Plannings']
    : TABS_BASE

  const [activeTab, setActiveTab] = useState('Informations')
  const [hotel, setHotel] = useState(null)
  const [plannings, setPlannings] = useState([])
  const [gouvernants, setGouvernants] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [editHotelModal, setEditHotelModal] = useState(false)
  const [valetModal, setValetModal] = useState(false)
  const [editValetModal, setEditValetModal] = useState(false)
  const [editingValet, setEditingValet] = useState(null)
  const [planningModal, setPlanningModal] = useState(false)
  const [gouvernantModal, setGouvernantModal] = useState(false)
  const [editGouvernantModal, setEditGouvernantModal] = useState(false)
  const [editingGouvernant, setEditingGouvernant] = useState(null)

  const [editForm, setEditForm] = useState(DEFAULT_FORM)
  const [valetForm, setValetForm] = useState({ firstName: '', lastName: '', phone: '', workHours: 5 })
  const [planningForm, setPlanningForm] = useState({ weekStartDate: '', gouvernantNom: '' })
  const [gouvernantForm, setGouvernantForm] = useState({ username: '', email: '', password: '' })
  const [editGouvernantForm, setEditGouvernantForm] = useState({ username: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  const fetchHotel = useCallback(async () => {
    try {
      const [hotelRes, planningsRes] = await Promise.all([
        api.get(`/hotels/${id}`),
        api.get(`/hotels/${id}/plannings`),
      ])
      setHotel(hotelRes.data)
      setPlannings(planningsRes.data)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchHotel() }, [fetchHotel])

  const openEditHotel = () => {
    setEditForm({
      name:    hotel.name || '',
      address: hotel.address || '',
      roomsT1: hotel.roomsT1 || 0,
      roomsT2: hotel.roomsT2 || 0,
      roomsT3: hotel.roomsT3 || 0,
      roomsT4: hotel.roomsT4 || 0,
      roomsT5: hotel.roomsT5 || 0,
      dureeDepartT1:         hotel.dureeDepartT1 || 35,
      dureeDepartT2:         hotel.dureeDepartT2 || 45,
      dureeDepartT3:         hotel.dureeDepartT3 || 55,
      dureeDepartT4:         hotel.dureeDepartT4 || 65,
      dureeDepartT5:         hotel.dureeDepartT5 || 75,
      dureeChangementDrapT1: hotel.dureeChangementDrapT1 || 25,
      dureeChangementDrapT2: hotel.dureeChangementDrapT2 || 30,
      dureeChangementDrapT3: hotel.dureeChangementDrapT3 || 35,
      dureeChangementDrapT4: hotel.dureeChangementDrapT4 || 45,
      dureeChangementDrapT5: hotel.dureeChangementDrapT5 || 55,
      dureeRecoucheT1:       hotel.dureeRecoucheT1 || 15,
      dureeRecoucheT2:       hotel.dureeRecoucheT2 || 20,
      dureeRecoucheT3:       hotel.dureeRecoucheT3 || 25,
      dureeRecoucheT4:       hotel.dureeRecoucheT4 || 30,
      dureeRecoucheT5:       hotel.dureeRecoucheT5 || 35,
    })
    setEditHotelModal(true)
  }

  const saveHotel = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put(`/hotels/${id}`, editForm)
      setEditHotelModal(false)
      fetchHotel()
    } catch { alert('Erreur lors de la mise à jour.') }
    finally { setSaving(false) }
  }

  // --- Valets ---
  const addValet = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post(`/hotels/${id}/valets`, valetForm)
      setValetModal(false)
      setValetForm({ firstName: '', lastName: '', phone: '', workHours: 5 })
      fetchHotel()
    } catch { alert("Erreur lors de l'ajout.") }
    finally { setSaving(false) }
  }

  const openEditValet = (valet) => {
    setEditingValet(valet)
    setValetForm({ firstName: valet.firstName, lastName: valet.lastName, phone: valet.phone || '', workHours: valet.workHours || 5 })
    setEditValetModal(true)
  }

  const saveValet = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put(`/valets/${editingValet._id}`, valetForm)
      setEditValetModal(false)
      setEditingValet(null)
      setValetForm({ firstName: '', lastName: '', phone: '', workHours: 5 })
      fetchHotel()
    } catch { alert('Erreur lors de la modification.') }
    finally { setSaving(false) }
  }

  const deleteValet = async (valetId) => {
    if (!confirm('Supprimer ce valet ?')) return
    await api.delete(`/valets/${valetId}`)
    fetchHotel()
  }

  // --- Planning ---
  const addPlanning = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post(`/hotels/${id}/plannings`, planningForm)
      setPlanningModal(false)
      setPlanningForm({ weekStartDate: '', gouvernantNom: '' })
      fetchHotel()
    } catch (err) {
      alert(err.response?.data?.error || 'La date doit être un lundi.')
    } finally { setSaving(false) }
  }

  const deletePlanning = async (planId) => {
    if (!confirm('Supprimer ce planning ?')) return
    await api.delete(`/plannings/${planId}`)
    fetchHotel()
  }

  // --- Gouvernants (admin seulement) ---
  const fetchGouvernants = useCallback(async () => {
    if (!isAdmin) return
    try {
      const { data } = await api.get(`/auth/gouvernants?hotelId=${id}`)
      setGouvernants(data)
    } catch { /* silencieux */ }
  }, [id, isAdmin])

  useEffect(() => {
    if (activeTab === 'Gouvernants') fetchGouvernants()
  }, [activeTab, fetchGouvernants])

  const openEditGouvernant = (g) => {
    setEditingGouvernant(g)
    setEditGouvernantForm({ username: g.username, email: g.email, password: '' })
    setEditGouvernantModal(true)
  }

  const saveGouvernant = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { username: editGouvernantForm.username, email: editGouvernantForm.email }
      if (editGouvernantForm.password) payload.password = editGouvernantForm.password
      await api.put(`/auth/gouvernants/${editingGouvernant._id}`, payload)
      setEditGouvernantModal(false)
      setEditingGouvernant(null)
      fetchGouvernants()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la modification.')
    } finally { setSaving(false) }
  }

  const removeGouvernant = async (gId, username) => {
    if (!confirm(`Supprimer le compte de "${username}" ? Cette action est irréversible.`)) return
    try {
      await api.delete(`/auth/gouvernants/${gId}`)
      fetchGouvernants()
    } catch { alert('Erreur lors de la suppression.') }
  }

  // --- Créer un gouvernant (admin seulement) ---
  const createGouvernant = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post('/auth/gouvernants', { ...gouvernantForm, hotelId: id })
      setGouvernantModal(false)
      setGouvernantForm({ username: '', email: '', password: '' })
      alert('Compte gouvernant créé avec succès.')
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la création.')
    } finally { setSaving(false) }
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const nextMonday = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 1 ? 0 : day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  }

  if (loading) return <Spinner text="Chargement..." />
  if (!hotel) return null

  const valets = hotel.valets || []
  const activeRoomTypes = ALL_activeRoomTypes.filter((t) => (hotel[`rooms${t}`] || 0) > 0)
  const total = activeRoomTypes.reduce((s, t) => s + (hotel[`rooms${t}`] || 0), 0)

  return (
    <div className="hotel-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Tableau de bord</Link>
        <span>›</span>
        <span>{hotel.name}</span>
      </div>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-badge">{hotel.name.charAt(0)}</div>
          <div>
            <h1 className="page-title">{hotel.name}</h1>
            {hotel.address && <p className="page-subtitle">📍 {hotel.address}</p>}
          </div>
        </div>
        <div className="detail-header-actions">
          {isAdmin && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setGouvernantModal(true)}>
                👤 Créer un gouvernant
              </button>
              <button className="btn btn-ghost btn-sm" onClick={openEditHotel}>
                ✏️ Modifier
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{total}</span>
          <span className="stat-lbl">Chambres</span>
        </div>
        {activeRoomTypes.map((t) => (
          <div key={t} className="stat-card">
            <span className="stat-number">{hotel[`rooms${t}`] || 0}</span>
            <span className="stat-lbl">{t}</span>
          </div>
        ))}
        <div className="stat-card">
          <span className="stat-number">{valets.length}</span>
          <span className="stat-lbl">Valets</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{plannings.length}</span>
          <span className="stat-lbl">Plannings</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {TABS.map((tab) => (
          <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Informations ── */}
      {activeTab === 'Informations' && (
        <div className="tab-content">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nom</span>
              <span className="info-value">{hotel.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Adresse</span>
              <span className="info-value">{hotel.address || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Créé le</span>
              <span className="info-value">{formatDate(hotel.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Durées de nettoyage ── */}
      {activeTab === 'Durées de nettoyage' && (
        <div className="tab-content">
          <div className="durees-section">
            <div className="durees-table">
              <div className="durees-head" style={{ gridTemplateColumns: `2fr ${activeRoomTypes.map(() => '1fr').join(' ')}` }}>
                <span>Type</span>
                {activeRoomTypes.map((t) => <span key={t}>{t}</span>)}
              </div>
              {DUREE_ROWS.map(({ labelType, keyPrefix, color }) => (
                <div key={keyPrefix} className={`durees-row color-${color}`} style={{ gridTemplateColumns: `2fr ${activeRoomTypes.map(() => '1fr').join(' ')}` }}>
                  <span className="duree-type">{labelType}</span>
                  {activeRoomTypes.map((t) => (
                    <span key={t} className="duree-val">{hotel[`${keyPrefix}${t}`] || '—'} min</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {isAdmin && (
            <p className="rooms-edit-hint">💡 Pour modifier ces informations, cliquez sur <strong>✏️ Modifier</strong> en haut de la page.</p>
          )}
        </div>
      )}

      {/* ── Tab: Valets ── */}
      {activeTab === 'Valets' && (
        <div className="tab-content">
          <div className="tab-toolbar">
            <p className="tab-count">{valets.length} valet{valets.length > 1 ? 's' : ''}</p>
            <button className="btn btn-primary btn-sm" onClick={() => { setValetForm({ firstName: '', lastName: '', phone: '', workHours: 5 }); setValetModal(true) }}>+ Ajouter</button>
          </div>
          {valets.length === 0 ? (
            <div className="empty-state-sm">Aucun valet enregistré.</div>
          ) : (
            <div className="valets-cards">
              {valets.map((v) => (
                <div key={v._id} className="valet-card">
                  <div className="valet-card-avatar">{v.firstName.charAt(0)}{v.lastName.charAt(0)}</div>
                  <div className="valet-card-info">
                    <span className="valet-card-name">{v.firstName} {v.lastName}</span>
                    {v.phone
                      ? <a className="valet-card-phone" href={`tel:${v.phone}`}>📞 {v.phone}</a>
                      : <span className="valet-card-no-phone">Pas de téléphone</span>
                    }
                    <span className="valet-card-contract">🕐 Contrat : {v.workHours || 5}h/jour</span>
                  </div>
                  <div className="valet-card-actions">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEditValet(v)}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => deleteValet(v._id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Gouvernants (admin seulement) ── */}
      {activeTab === 'Gouvernants' && isAdmin && (
        <div className="tab-content">
          <div className="tab-toolbar">
            <p className="tab-count">{gouvernants.length} gouvernant{gouvernants.length > 1 ? 's' : ''}</p>
            <button className="btn btn-primary btn-sm" onClick={() => { setGouvernantForm({ username: '', email: '', password: '' }); setGouvernantModal(true) }}>
              + Ajouter
            </button>
          </div>
          {gouvernants.length === 0 ? (
            <div className="empty-state-sm">Aucun gouvernant assigné à cet hôtel.</div>
          ) : (
            <div className="valets-cards">
              {gouvernants.map((g) => (
                <div key={g._id} className="valet-card">
                  <div className="valet-card-avatar">{g.username.charAt(0).toUpperCase()}</div>
                  <div className="valet-card-info">
                    <span className="valet-card-name">{g.username}</span>
                    <span className="valet-card-phone">{g.email}</span>
                  </div>
                  <div className="valet-card-actions">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEditGouvernant(g)}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => removeGouvernant(g._id, g.username)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Plannings ── */}
      {activeTab === 'Plannings' && (
        <div className="tab-content">
          <div className="tab-toolbar">
            <p className="tab-count">{plannings.length} planning{plannings.length > 1 ? 's' : ''}</p>
            <button className="btn btn-primary btn-sm" onClick={() => { setPlanningForm({ weekStartDate: nextMonday(), gouvernantNom: '' }); setPlanningModal(true) }}>
              + Créer un planning
            </button>
          </div>
          {plannings.length === 0 ? (
            <div className="empty-state-sm">Aucun planning créé. Créez un planning hebdomadaire le lundi.</div>
          ) : (
            <div className="planning-list">
              {plannings.map((p) => (
                <div key={p._id} className="planning-row">
                  <div className="planning-info">
                    <span className="planning-week">📅 Semaine du {formatDate(p.weekStartDate)}</span>
                    <span className="planning-days">{p.nombreDeJours || 0} jour{(p.nombreDeJours || 0) > 1 ? 's' : ''} planifié{(p.nombreDeJours || 0) > 1 ? 's' : ''}</span>
                  </div>
                  <div className="planning-actions">
                    <Link to={`/plannings/${p._id}`} className="btn btn-secondary btn-sm">Voir</Link>
                    <button className="btn btn-danger btn-xs" onClick={() => deletePlanning(p._id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal modifier hôtel (admin seulement) */}
      {editHotelModal && isAdmin && (
        <Modal title={`Modifier — ${hotel.name}`} onClose={() => setEditHotelModal(false)}>
          <HotelForm
            form={editForm}
            onChange={setEditForm}
            onSubmit={saveHotel}
            onCancel={() => setEditHotelModal(false)}
            saving={saving}
            submitLabel="Enregistrer"
          />
        </Modal>
      )}

      {/* Modal créer gouvernant (admin seulement) */}
      {gouvernantModal && isAdmin && (
        <Modal title={`Créer un gouvernant — ${hotel.name}`} onClose={() => setGouvernantModal(false)}>
          <form className="form" onSubmit={createGouvernant}>
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur *</label>
              <input
                className="form-input"
                type="text"
                placeholder="ex : marie.dupont"
                value={gouvernantForm.username}
                onChange={(e) => setGouvernantForm({ ...gouvernantForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-input"
                type="email"
                placeholder="marie@hotel.com"
                value={gouvernantForm.email}
                onChange={(e) => setGouvernantForm({ ...gouvernantForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input
                className="form-input"
                type="password"
                placeholder="6 caractères minimum"
                value={gouvernantForm.password}
                onChange={(e) => setGouvernantForm({ ...gouvernantForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setGouvernantModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal modifier gouvernant (admin seulement) */}
      {editGouvernantModal && editingGouvernant && (
        <Modal title={`Modifier — ${editingGouvernant.username}`} onClose={() => { setEditGouvernantModal(false); setEditingGouvernant(null) }}>
          <form className="form" onSubmit={saveGouvernant}>
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur *</label>
              <input
                className="form-input"
                type="text"
                value={editGouvernantForm.username}
                onChange={(e) => setEditGouvernantForm({ ...editGouvernantForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-input"
                type="email"
                value={editGouvernantForm.email}
                onChange={(e) => setEditGouvernantForm({ ...editGouvernantForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe <span className="form-hint">(laisser vide pour ne pas changer)</span></label>
              <input
                className="form-input"
                type="password"
                placeholder="6 caractères minimum"
                value={editGouvernantForm.password}
                onChange={(e) => setEditGouvernantForm({ ...editGouvernantForm, password: e.target.value })}
                minLength={6}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setEditGouvernantModal(false); setEditingGouvernant(null) }}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal ajout valet */}
      {valetModal && (
        <Modal title="Ajouter un valet" onClose={() => setValetModal(false)}>
          <form className="form" onSubmit={addValet}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input className="form-input" type="text" placeholder="Marie" value={valetForm.firstName}
                  onChange={(e) => setValetForm({ ...valetForm, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input className="form-input" type="text" placeholder="Dupont" value={valetForm.lastName}
                  onChange={(e) => setValetForm({ ...valetForm, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" type="tel" placeholder="+33 6 12 34 56 78" value={valetForm.phone}
                  onChange={(e) => setValetForm({ ...valetForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Heures de contrat *</label>
                <select className="form-select" value={valetForm.workHours}
                  onChange={(e) => setValetForm({ ...valetForm, workHours: parseInt(e.target.value) })}>
                  <option value={4}>4 heures / jour</option>
                  <option value={5}>5 heures / jour</option>
                  <option value={6}>6 heures / jour</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setValetModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Ajout...' : 'Ajouter'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal modification valet */}
      {editValetModal && editingValet && (
        <Modal title={`Modifier — ${editingValet.firstName} ${editingValet.lastName}`} onClose={() => { setEditValetModal(false); setEditingValet(null) }}>
          <form className="form" onSubmit={saveValet}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input className="form-input" type="text" value={valetForm.firstName}
                  onChange={(e) => setValetForm({ ...valetForm, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input className="form-input" type="text" value={valetForm.lastName}
                  onChange={(e) => setValetForm({ ...valetForm, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" type="tel" placeholder="+33 6 12 34 56 78" value={valetForm.phone}
                  onChange={(e) => setValetForm({ ...valetForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Heures de contrat *</label>
                <select className="form-select" value={valetForm.workHours}
                  onChange={(e) => setValetForm({ ...valetForm, workHours: parseInt(e.target.value) })}>
                  <option value={4}>4 heures / jour</option>
                  <option value={5}>5 heures / jour</option>
                  <option value={6}>6 heures / jour</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setEditValetModal(false); setEditingValet(null) }}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal planning */}
      {planningModal && (
        <Modal title="Créer un planning hebdomadaire" onClose={() => setPlanningModal(false)}>
          <form className="form" onSubmit={addPlanning}>
            <div className="form-group">
              <label className="form-label">Lundi de début de semaine *</label>
              <input className="form-input" type="date" value={planningForm.weekStartDate}
                onChange={(e) => setPlanningForm({ ...planningForm, weekStartDate: e.target.value })} required />
              <small className="form-hint">La date doit être un lundi.</small>
            </div>
            <div className="form-group">
              <label className="form-label">Nom du gouvernant</label>
              <input className="form-input" type="text" placeholder="ex : LASSANA"
                value={planningForm.gouvernantNom}
                onChange={(e) => setPlanningForm({ ...planningForm, gouvernantNom: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPlanningModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Création...' : 'Créer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
