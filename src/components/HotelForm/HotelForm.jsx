import { useState } from 'react'
import './HotelForm.css'

const DEFAULT_FORM = {
  name: '',
  address: '',
  roomsT1: 0,
  roomsT2: 0,
  roomsT3: 0,
  roomsT4: 0,
  roomsT5: 0,
  dureeDepartT1: 35,
  dureeDepartT2: 45,
  dureeDepartT3: 55,
  dureeDepartT4: 65,
  dureeDepartT5: 75,
  dureeChangementDrapT1: 25,
  dureeChangementDrapT2: 30,
  dureeChangementDrapT3: 35,
  dureeChangementDrapT4: 45,
  dureeChangementDrapT5: 55,
  dureeRecoucheT1: 15,
  dureeRecoucheT2: 20,
  dureeRecoucheT3: 25,
  dureeRecoucheT4: 30,
  dureeRecoucheT5: 35,
}

export { DEFAULT_FORM }

const DUREE_FIELDS = [
  { key: 'dureeDepartT1',         label: 'Départ T1',    color: 'red' },
  { key: 'dureeDepartT2',         label: 'Départ T2',    color: 'red' },
  { key: 'dureeDepartT3',         label: 'Départ T3',    color: 'red' },
  { key: 'dureeDepartT4',         label: 'Départ T4',    color: 'red' },
  { key: 'dureeDepartT5',         label: 'Départ T5',    color: 'red' },
  { key: 'dureeChangementDrapT1', label: 'Chgt drap T1', color: 'blue' },
  { key: 'dureeChangementDrapT2', label: 'Chgt drap T2', color: 'blue' },
  { key: 'dureeChangementDrapT3', label: 'Chgt drap T3', color: 'blue' },
  { key: 'dureeChangementDrapT4', label: 'Chgt drap T4', color: 'blue' },
  { key: 'dureeChangementDrapT5', label: 'Chgt drap T5', color: 'blue' },
  { key: 'dureeRecoucheT1',       label: 'Recouche T1',  color: 'green' },
  { key: 'dureeRecoucheT2',       label: 'Recouche T2',  color: 'green' },
  { key: 'dureeRecoucheT3',       label: 'Recouche T3',  color: 'green' },
  { key: 'dureeRecoucheT4',       label: 'Recouche T4',  color: 'green' },
  { key: 'dureeRecoucheT5',       label: 'Recouche T5',  color: 'green' },
]

const ALL_TYPES = ['T1', 'T2', 'T3', 'T4', 'T5']

export default function HotelForm({ form, onChange, onSubmit, onCancel, saving, submitLabel = 'Enregistrer' }) {
  const set = (field, value) => onChange({ ...form, [field]: value })

  // Types actifs : ceux avec rooms > 0, ou au moins T1 si aucun
  const [activeTypes, setActiveTypes] = useState(() => {
    const withRooms = ALL_TYPES.filter((t) => (form[`rooms${t}`] || 0) > 0)
    return withRooms.length > 0 ? withRooms : ['T1']
  })

  const availableTypes = ALL_TYPES.filter((t) => !activeTypes.includes(t))

  const addType = (t) => setActiveTypes([...activeTypes, t])

  const removeType = (t) => {
    setActiveTypes(activeTypes.filter((x) => x !== t))
    onChange({ ...form, [`rooms${t}`]: 0 })
  }

  const setRooms = (t, value) => {
    const val = parseInt(value) || 0
    if (val === 0) {
      removeType(t)
    } else {
      onChange({ ...form, [`rooms${t}`]: val })
    }
  }

  const activeDureeFields = DUREE_FIELDS.filter(({ key }) =>
    activeTypes.some((t) => key.endsWith(t))
  )

  const total = activeTypes.reduce((s, t) => s + (form[`rooms${t}`] || 0), 0)

  return (
    <form className="hotel-form" onSubmit={onSubmit}>
      {/* Infos générales */}
      <div className="hf-section">
        <h3 className="hf-section-title">Informations générales</h3>
        <div className="form-group">
          <label className="form-label">Nom de l'hôtel *</label>
          <input className="form-input" type="text" placeholder="ex: Hôtel Les Pins"
            value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Adresse</label>
          <input className="form-input" type="text" placeholder="ex: 12 Rue de la Paix, Paris"
            value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
      </div>

      {/* Chambres */}
      <div className="hf-section">
        <h3 className="hf-section-title">Types de chambres</h3>
        <div className="form-row">
          {activeTypes.map((t) => (
            <div key={t} className="form-group hf-room-type-group">
              <div className="hf-room-type-header">
                <label className="form-label">Chambres {t}</label>
                {activeTypes.length > 1 && (
                  <button type="button" className="btn-remove-type" onClick={() => removeType(t)} title={`Retirer ${t}`}>×</button>
                )}
              </div>
              <input className="form-input" type="number" min="0"
                value={form[`rooms${t}`] || 0}
                onChange={(e) => setRooms(t, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="hf-room-actions">
          <p className="hf-total">Total : {total} chambre{total > 1 ? 's' : ''}</p>
          {availableTypes.length > 0 && (
            <div className="hf-add-type">
              <select className="form-select hf-add-type-select" defaultValue=""
                onChange={(e) => { if (e.target.value) { addType(e.target.value); e.target.value = '' } }}>
                <option value="" disabled>+ Ajouter un type</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Durées de nettoyage */}
      <div className="hf-section">
        <h3 className="hf-section-title">Durées de nettoyage (minutes)</h3>
        <div className="hf-durees-grid">
          {activeDureeFields.map(({ key, label, color }) => (
            <div key={key} className={`hf-duree-item color-${color}`}>
              <label className="form-label">{label}</label>
              <div className="hf-duree-input-wrap">
                <input className="form-input" type="number" min="1"
                  value={form[key] || 1} onChange={(e) => set(key, parseInt(e.target.value) || 1)} />
                <span className="hf-min-label">min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
