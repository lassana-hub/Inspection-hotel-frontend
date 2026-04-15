import './AnalyseCard.css'

export default function AnalyseCard({ analyse }) {
  if (!analyse) return null

  const ok = analyse.surplus >= 0
  const statusClass = ok ? 'ok' : 'alert'

  const formatMin = (min) => {
    const h = Math.floor(Math.abs(min) / 60)
    const m = Math.abs(min) % 60
    return `${h}h${m > 0 ? m + 'min' : ''}`
  }

  return (
    <div className={`analyse-card ${statusClass}`}>
      <div className="analyse-header">
        <span className="analyse-icon">{ok ? '✅' : '⚠️'}</span>
        <h3 className="analyse-title">Analyse des effectifs</h3>
      </div>

      <p className="analyse-recommendation">{analyse.recommendation}</p>

      <div className="analyse-stats">
        <div className="stat-item">
          <span className="stat-label">Minutes nécessaires</span>
          <span className="stat-value">{formatMin(analyse.minutesNécessaires)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Minutes disponibles</span>
          <span className="stat-value">{formatMin(analyse.minutesDisponibles)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Valets présents</span>
          <span className="stat-value">{analyse.nbValetsPresents}</span>
        </div>
        {!ok && (
          <div className="stat-item alert-stat">
            <span className="stat-label">Valets manquants estimés</span>
            <span className="stat-value">{analyse.valetsSupplémentairesNécessaires}</span>
          </div>
        )}
      </div>
    </div>
  )
}
