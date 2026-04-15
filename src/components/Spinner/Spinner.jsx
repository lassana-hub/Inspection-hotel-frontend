import './Spinner.css'

export default function Spinner({ text = 'Chargement...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  )
}
