import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner/Spinner'
import Modal from '../../components/Modal/Modal'
import AnalyseCard from '../../components/AnalyseCard/AnalyseCard'
import './DailyPlanDetail.css'

const ROOM_FIELDS = [
  { key: 'departsT1', label: 'Départs T1', icon: '🚪', color: 'red', time: 35 },
  { key: 'departsT2', label: 'Départs T2', icon: '🚪', color: 'red', time: 45 },
  { key: 'departsT3', label: 'Départs T3', icon: '🚪', color: 'red', time: 55 },
  { key: 'departsT4', label: 'Départs T4', icon: '🚪', color: 'red', time: 65 },
  { key: 'departsT5', label: 'Départs T5', icon: '🚪', color: 'red', time: 75 },
  { key: 'changementDrapT1', label: 'Chgt drap T1', icon: '🛏', color: 'blue', time: 25 },
  { key: 'changementDrapT2', label: 'Chgt drap T2', icon: '🛏', color: 'blue', time: 30 },
  { key: 'changementDrapT3', label: 'Chgt drap T3', icon: '🛏', color: 'blue', time: 35 },
  { key: 'changementDrapT4', label: 'Chgt drap T4', icon: '🛏', color: 'blue', time: 45 },
  { key: 'changementDrapT5', label: 'Chgt drap T5', icon: '🛏', color: 'blue', time: 55 },
  { key: 'recouchesT1', label: 'Recouches T1', icon: '✨', color: 'green', time: 15 },
  { key: 'recouchesT2', label: 'Recouches T2', icon: '✨', color: 'green', time: 20 },
  { key: 'recouchesT3', label: 'Recouches T3', icon: '✨', color: 'green', time: 25 },
  { key: 'recouchesT4', label: 'Recouches T4', icon: '✨', color: 'green', time: 30 },
  { key: 'recouchesT5', label: 'Recouches T5', icon: '✨', color: 'green', time: 35 },
]

export default function DailyPlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dailyPlan, setDailyPlan] = useState(null)
  const [analyse, setAnalyse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyseLoading, setAnalyseLoading] = useState(false)
  const [valets, setValets] = useState([]) // valets disponibles pour cet hôtel
  const [editModal, setEditModal] = useState(false)
  const [valetModal, setValetModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [valetForm, setValetForm] = useState({ valetId: '', workHours: 5, status: 'P' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get(`/daily-plans/${id}`)
      setDailyPlan(data)
      // Récupérer les valets de l'hôtel
      const hotelId = data.weeklyPlanningId?.hotelId
      if (hotelId) {
        const vRes = await api.get(`/hotels/${hotelId}/valets`)
        setValets(vRes.data)
      }
    } catch { navigate('/') }
    finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchAnalyse = async () => {
    try {
      setAnalyseLoading(true)
      const { data } = await api.get(`/daily-plans/${id}/analyse`)
      setAnalyse(data)
    } catch { alert('Erreur lors de l\'analyse.') }
    finally { setAnalyseLoading(false) }
  }

  const openEditModal = () => {
    setEditForm(
      Object.fromEntries(ROOM_FIELDS.map(({ key }) => [key, dailyPlan[key] || 0]))
    )
    setEditModal(true)
  }

  const saveRooms = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const date = new Date(dailyPlan.date).toISOString().split('T')[0]
      const planningId = dailyPlan.weeklyPlanningId?._id || dailyPlan.weeklyPlanningId
      await api.put(`/plannings/${planningId}/days?date=${date}`, editForm)
      setEditModal(false)
      fetchData()
    } catch { alert('Erreur lors de la mise à jour.') }
    finally { setSaving(false) }
  }

  const addValet = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post(`/daily-plans/${id}/valets`, valetForm)
      setValetModal(false)
      setValetForm({ valetId: '', workHours: 5, status: 'P' })
      fetchData()
      setAnalyse(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'ajout.')
    } finally { setSaving(false) }
  }

  const updateSchedule = async (scheduleId, field, value) => {
    try {
      await api.put(`/daily-plans/valets/${scheduleId}`, { [field]: value })
      fetchData()
      setAnalyse(null)
    } catch { alert('Erreur lors de la mise à jour.') }
  }

  const removeValet = async (scheduleId) => {
    if (!confirm('Retirer ce valet du planning de ce jour ?')) return
    await api.delete(`/daily-plans/valets/${scheduleId}`)
    fetchData()
    setAnalyse(null)
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })

  const totalMinutes = () =>
    ROOM_FIELDS.reduce((sum, f) => sum + (dailyPlan?.[f.key] || 0) * f.time, 0)

  // Valets déjà assignés ce jour
  const assignedIds = new Set((dailyPlan?.valets || []).map((v) => v.valetId?._id || v.valetId))
  const availableValets = valets.filter((v) => !assignedIds.has(v._id))

  if (loading) return <Spinner text="Chargement..." />
  if (!dailyPlan) return null

  const planning = dailyPlan.weeklyPlanningId || {}
  const hotelId = planning.hotelId

  return (
    <div className="daily-detail">
      <div className="breadcrumb">
        <Link to="/">Tableau de bord</Link>
        <span>›</span>
        <Link to={`/hotels/${hotelId}`}>Hôtel</Link>
        <span>›</span>
        <Link to={`/plannings/${planning._id}`}>Planning</Link>
        <span>›</span>
        <span>{formatDate(dailyPlan.date)}</span>
      </div>

      <div className="daily-header">
        <div>
          <h1 className="page-title">{formatDate(dailyPlan.date)}</h1>
        </div>
        <div className="daily-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={openEditModal}>✏️ Modifier</button>
          <button className="btn btn-secondary btn-sm" onClick={fetchAnalyse} disabled={analyseLoading}>
            {analyseLoading ? '...' : '📊 Analyser'}
          </button>
        </div>
      </div>

      <div className="daily-grid">
        {/* Chambres */}
        <div className="daily-card">
          <div className="daily-card-header">
            <h2>🛏 Chambres à nettoyer</h2>
            <span className="total-min">≈ {Math.floor(totalMinutes() / 60)}h{totalMinutes() % 60 > 0 ? totalMinutes() % 60 + 'min' : ''} total</span>
          </div>
          <div className="rooms-list">
            {ROOM_FIELDS.map(({ key, label, icon, color, time }) => (
              <div key={key} className={`room-item color-${color}`}>
                <div className="room-item-left">
                  <span className="room-icon">{icon}</span>
                  <div>
                    <span className="room-label">{label}</span>
                    <span className="room-time">{time} min/chambre</span>
                  </div>
                </div>
                <div className="room-item-right">
                  <span className="room-qty">{dailyPlan[key] || 0}</span>
                  <span className="room-subtotal">
                    {(dailyPlan[key] || 0) * time} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valets */}
        <div className="daily-card">
          <div className="daily-card-header">
            <h2>👤 Valets de chambre</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setValetForm({ valetId: availableValets[0]?._id || '', workHours: 5, status: 'P' }); setValetModal(true) }}
              disabled={availableValets.length === 0}
            >
              + Assigner
            </button>
          </div>

          {(dailyPlan.valets || []).length === 0 ? (
            <div className="empty-valets">Aucun valet assigné pour ce jour.</div>
          ) : (
            <div className="valets-list">
              {(dailyPlan.valets || []).map((schedule) => {
                const v = schedule.valetId
                const name = v ? `${v.firstName} ${v.lastName}` : 'Inconnu'
                return (
                  <div key={schedule._id} className={`valet-item${schedule.status !== 'P' ? ' absent' : ''}`}>
                    <div className="valet-avatar">{name.charAt(0)}</div>
                    <div className="valet-info">
                      <span className="valet-fullname">{name}</span>
                      <div className="valet-controls">
                        <select
                          className="status-select-daily"
                          value={schedule.status || 'P'}
                          onChange={(e) => updateSchedule(schedule._id, 'status', e.target.value)}
                        >
                          <option value="P">P – Présent</option>
                          <option value="R">R – Repos</option>
                          <option value="AA">AA – Absence autorisée</option>
                          <option value="CP">CP – Congés payés</option>
                        </select>
                        <select
                          className="hours-select"
                          value={schedule.workHours}
                          onChange={(e) => updateSchedule(schedule._id, 'workHours', parseInt(e.target.value))}
                          disabled={schedule.status !== 'P'}
                        >
                          <option value={4}>4h</option>
                          <option value={5}>5h</option>
                          <option value={6}>6h</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-xs" onClick={() => removeValet(schedule._id)}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Analyse */}
      <AnalyseCard analyse={analyse} />

      {/* Modal chambres */}
      {editModal && (
        <Modal title="Modifier les chambres" onClose={() => setEditModal(false)}>
          <form className="form" onSubmit={saveRooms}>
            <p className="form-section-label">Nombre de chambres à nettoyer</p>
            <div className="rooms-form-grid">
              {ROOM_FIELDS.map(({ key, label }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="number" min="0" value={editForm[key] || 0}
                    onChange={(e) => setEditForm({ ...editForm, [key]: parseInt(e.target.value) || 0 })} />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal valet */}
      {valetModal && (
        <Modal title="Assigner un valet" onClose={() => setValetModal(false)}>
          <form className="form" onSubmit={addValet}>
            <div className="form-group">
              <label className="form-label">Valet *</label>
              <select className="form-select" value={valetForm.valetId}
                onChange={(e) => setValetForm({ ...valetForm, valetId: e.target.value })} required>
                <option value="">-- Choisir --</option>
                {availableValets.map((v) => (
                  <option key={v._id} value={v._id}>{v.firstName} {v.lastName}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Heures de travail *</label>
                <select className="form-select" value={valetForm.workHours}
                  onChange={(e) => setValetForm({ ...valetForm, workHours: parseInt(e.target.value) })}>
                  <option value={4}>4 heures</option>
                  <option value={5}>5 heures</option>
                  <option value={6}>6 heures</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select className="form-select" value={valetForm.status}
                  onChange={(e) => setValetForm({ ...valetForm, status: e.target.value })}>
                  <option value="P">P – Présent</option>
                  <option value="R">R – Repos</option>
                  <option value="AA">AA – Absence autorisée</option>
                  <option value="CP">CP – Congés payés</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setValetModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving || !valetForm.valetId}>
                {saving ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
