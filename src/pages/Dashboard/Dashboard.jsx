import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner/Spinner'
import Modal from '../../components/Modal/Modal'
import HotelForm, { DEFAULT_FORM } from '../../components/HotelForm/HotelForm'
import './Dashboard.css'

export default function Dashboard() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/hotels')
      setHotels(data)
    } catch {
      setError('Impossible de charger les hôtels.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHotels() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post('/hotels', form)
      setShowModal(false)
      setForm(DEFAULT_FORM)
      fetchHotels()
    } catch {
      alert('Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name, e) => {
    e.stopPropagation()
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return
    try {
      await api.delete(`/hotels/${id}`)
      fetchHotels()
    } catch {
      alert('Erreur lors de la suppression.')
    }
  }

  if (loading) return <Spinner text="Chargement des hôtels..." />
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">{hotels.length} hôtel{hotels.length > 1 ? 's' : ''} enregistré{hotels.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(DEFAULT_FORM); setShowModal(true) }}>
          + Nouvel hôtel
        </button>
      </div>

      {hotels.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏨</span>
          <p>Aucun hôtel enregistré.</p>
          <button className="btn btn-primary" onClick={() => { setForm(DEFAULT_FORM); setShowModal(true) }}>Ajouter un hôtel</button>
        </div>
      ) : (
        <div className="hotels-grid">
          {hotels.map((hotel) => (
            <div key={hotel._id} className="hotel-card" onClick={() => navigate(`/hotels/${hotel._id}`)}>
              <div className="hotel-card-badge">{hotel.name.charAt(0).toUpperCase()}</div>
              <div className="hotel-card-body">
                <h2 className="hotel-card-name">{hotel.name}</h2>
                {hotel.address && <p className="hotel-card-address">📍 {hotel.address}</p>}
                <div className="hotel-card-meta">
                  <span className="meta-tag">🛏 {['T1','T2','T3','T4','T5'].reduce((s, t) => s + (hotel[`rooms${t}`] || 0), 0)} chambres</span>
                  {['T1','T2','T3','T4','T5'].map((t) => (hotel[`rooms${t}`] || 0) > 0 && (
                    <span key={t} className="meta-tag">{t}: {hotel[`rooms${t}`]}</span>
                  ))}
                </div>
              </div>
              <div className="hotel-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={(e) => handleDelete(hotel._id, hotel.name, e)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nouvel hôtel" onClose={() => setShowModal(false)}>
          <HotelForm
            form={form}
            onChange={setForm}
            onSubmit={handleCreate}
            onCancel={() => setShowModal(false)}
            saving={saving}
            submitLabel="Créer l'hôtel"
          />
        </Modal>
      )}
    </div>
  )
}
