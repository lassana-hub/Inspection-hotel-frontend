import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner/Spinner";
import Modal from "../../components/Modal/Modal";
import "./PlanningDetail.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Semaine : Lun → Dim
const DAYS_LABEL = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
];
const STATUS_OPTIONS = ["P", "R", "AA", "CP"];

function getWeekDates(weekStartDate) {
  const start = new Date(weekStartDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
}

function fmtDay(date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function fmtDateKey(date) {
  return date.toISOString().split("T")[0];
}

export default function PlanningDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planning, setPlanning] = useState(null);
  const [hotelValets, setHotelValets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline edit pour les cellules numériques
  const [editingCell, setEditingCell] = useState(null); // { row, colIdx }
  const [cellValue, setCellValue] = useState("");

  // Modal gouvernant
  const [gouvernantModal, setGouvernantModal] = useState(false);
  const [gouvernantForm, setGouvernantForm] = useState({
    gouvernantNom: "",
    gouvernantStatuts: ["P", "P", "P", "P", "P", "P", "P"],
  });

  // Analyse staffing
  const [analyse, setAnalyse] = useState(null);
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const gridRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get(`/plannings/${id}`);
      setPlanning(data);
      const hotelId = data.hotelId?._id || data.hotelId;
      if (hotelId) {
        const vRes = await api.get(`/hotels/${hotelId}/valets`);
        setHotelValets(vRes.data);
      }
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchAnalyse = async () => {
    try {
      setAnalyseLoading(true);
      const { data } = await api.get(`/plannings/${id}/analyse`);
      setAnalyse(data);
    } catch {
      alert("Erreur lors de l'analyse.");
    } finally {
      setAnalyseLoading(false);
    }
  };

  if (loading) return <Spinner text="Chargement du planning..." />;
  if (!planning) return null;

  const hotel = planning.hotelId || {};
  const weekDates = getWeekDates(planning.weekStartDate);

  const ALL_ROOM_TYPES = ['T1', 'T2', 'T3', 'T4', 'T5'];
  const activeRoomTypes = ALL_ROOM_TYPES.filter(t => (hotel[`rooms${t}`] || 0) > 0);

  // Map dailyPlans par clé de date
  const dayMap = {};
  (planning.dailyPlans || []).forEach((dp) => {
    dayMap[new Date(dp.date).toISOString().split("T")[0]] = dp;
  });

  // Gouvernant
  const gouvernantStatuts = planning.gouvernantStatuts || [
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
  ];
  const gouvernantNom = planning.gouvernantNom || "";

  // Tous les valets de l'hôtel (source principale)
  const allValets = hotelValets;

  // ── Lecture valeur journalière ─────────────────────────────────────────────
  const getDayValue = (dateKey, field) => dayMap[dateKey]?.[field] ?? 0;

  // ── Sauvegarde champ numérique ─────────────────────────────────────────────
  const saveField = async (dateKey, fields) => {
    setSaving(true);
    try {
      await api.put(`/plannings/${id}/days?date=${dateKey}`, fields);
      fetchAll();
      setAnalyse(null);
    } catch {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row, colIdx, currentVal) => {
    setEditingCell({ row, colIdx });
    setCellValue(String(currentVal));
  };

  const commitSingle = (dateKey, field) => {
    saveField(dateKey, { [field]: parseInt(cellValue) || 0 });
    setEditingCell(null);
  };

  // ── Statut valet ───────────────────────────────────────────────────────────
  const getSchedule = (valetId, dateKey) => {
    const dp = dayMap[dateKey];
    if (!dp) return null;
    return (
      (dp.valets || []).find((s) => {
        const vid = s.valetId?._id || s.valetId;
        return vid?.toString() === valetId.toString();
      }) || null
    );
  };

  const changeValetStatus = async (dateKey, day, valetId, valet, newStatus) => {
    setSaving(true);
    try {
      const schedule = getSchedule(valetId, dateKey);
      if (schedule) {
        await api.put(`/daily-plans/valets/${schedule._id}`, {
          status: newStatus,
        });
      } else if (day) {
        // Valet ajouté à l'hôtel après la création du planning → créer le schedule
        await api.post(`/daily-plans/${day._id}/valets`, {
          valetId,
          workHours: valet?.workHours || 5,
          status: newStatus,
        });
      }
      fetchAll();
      setAnalyse(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  // ── Gouvernant modal ───────────────────────────────────────────────────────
  const openGouvernantModal = () => {
    setGouvernantForm({
      gouvernantNom: planning.gouvernantNom || "",
      gouvernantStatuts: [...gouvernantStatuts],
    });
    setGouvernantModal(true);
  };

  const saveGouvernant = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/plannings/${id}/gouvernant`, gouvernantForm);
      setGouvernantModal(false);
      fetchAll();
    } catch {
      alert("Erreur.");
    } finally {
      setSaving(false);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!gridRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(gridRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let imgW = pageW - 20;
      let imgH = imgW / ratio;
      if (imgH > pageH - 20) {
        imgH = pageH - 20;
        imgW = imgH * ratio;
      }
      const hotelName = hotel.name || 'hotel';
      const weekLabel = new Date(planning.weekStartDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`PLANNING DE PRÉSENCE HEBDOMADAIRE ÉTAGE — ${hotelName} — Semaine du ${weekLabel}`, 10, 10);
      pdf.addImage(imgData, 'PNG', 10, 16, imgW, imgH);
      pdf.save(`planning_${hotelName.replace(/\s+/g, '_')}_${weekLabel.replace(/\//g, '-')}.pdf`);
    } catch {
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Analyse par jour ───────────────────────────────────────────────────────
  const getAnalyseDay = (dateKey) =>
    (analyse?.analyseJournaliere || []).find(
      (a) => new Date(a.date).toISOString().split("T")[0] === dateKey,
    ) || null;

  const statusClass = (s) =>
    ({ P: "status-p", R: "status-r", AA: "status-aa", CP: "status-cp" })[s] ||
    "";

  return (
    <div className="planning-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Tableau de bord</Link>
        <span>›</span>
        <Link to={`/hotels/${hotel._id || hotel.id}`}>{hotel.name}</Link>
        <span>›</span>
        <span>
          Planning — semaine du{" "}
          {new Date(planning.weekStartDate).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </div>

      {/* Header */}
      <div className="planning-header">
        <div>
          <h1 className="page-title">
            PLANNING DE PRÉSENCE HEBDOMADAIRE ÉTAGE
          </h1>
          <p className="page-subtitle">🏨 {hotel.name}</p>
        </div>
        <div className="planning-header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={openGouvernantModal}
          >
            ✏️ Gouvernant
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchAnalyse}
            disabled={analyseLoading}
          >
            {analyseLoading ? "..." : "📊 Analyser"}
          </button>
          <button
            className="btn btn-pdf btn-sm"
            onClick={exportPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? "..." : "📄 PDF"}
          </button>
          {saving && (
            <span className="saving-indicator">Enregistrement...</span>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="legend">
        <span className="legend-item status-p">P = Présent</span>
        <span className="legend-item status-r">R = Repos</span>
        <span className="legend-item status-aa">AA = Absence autorisée</span>
        <span className="legend-item status-cp">CP = Congés payés</span>
      </div>

      {/* Grille hebdomadaire */}
      <div className="weekly-grid-wrap" ref={gridRef}>
        <table className="weekly-grid">
          <thead>
            <tr>
              <th className="col-label">
                Semaine du{" "}
                {new Date(planning.weekStartDate).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  timeZone: "UTC",
                })}
              </th>
              {weekDates.map((d, i) => (
                <th key={i} className="col-day">
                  <span className="day-name">{DAYS_LABEL[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* DATE */}
            <tr className="row-date">
              <td className="row-label">DATE</td>
              {weekDates.map((d, i) => (
                <td key={i} className="cell-date">
                  {fmtDay(d)}
                </td>
              ))}
            </tr>

            {/* GOUVERNANT */}
            <tr className="row-gouvernant">
              <td className="row-label">
                GOUVERNANT{gouvernantNom ? ` : ${gouvernantNom}` : ""}
              </td>
              {weekDates.map((d, i) => {
                const st = gouvernantStatuts[i] || "P";
                return (
                  <td key={i} className="cell-status">
                    <span className={`status-badge ${statusClass(st)}`}>
                      {st}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* ARRIVÉES */}
            <tr className="row-rooms">
              <td className="row-label">ARRIVÉES</td>
              {weekDates.map((d, i) => {
                const dateKey = fmtDateKey(d);
                const val = getDayValue(dateKey, "arrivees");
                const isEditing =
                  editingCell?.row === "arrivees" && editingCell?.colIdx === i;
                return (
                  <td
                    key={i}
                    className="cell-number"
                    onClick={() => !isEditing && startEdit("arrivees", i, val)}
                  >
                    {isEditing ? (
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        value={cellValue}
                        autoFocus
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => commitSingle(dateKey, "arrivees")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            commitSingle(dateKey, "arrivees");
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                      />
                    ) : (
                      val
                    )}
                  </td>
                );
              })}
            </tr>

            {/*  DÉPARTS / CHGT DRAP / RECOUCHE */}
            {[
              { row: "departs",  fieldFn: (t) => `departs${t}`,        label: "DÉPARTS" },
              { row: "chgtDrap", fieldFn: (t) => `changementDrap${t}`, label: "CHANGEMENT DRAP" },
              { row: "recouche", fieldFn: (t) => `recouches${t}`,      label: "EXPRESS (RECOUCHE)" },
            ].map(({ row, fieldFn, label }) => {
              const fields = activeRoomTypes.map(fieldFn);
              return (
                <tr key={row} className="row-rooms">
                  <td className="row-label">{label}</td>
                  {weekDates.map((d, i) => {
                    const dateKey = fmtDateKey(d);
                    const vals = fields.map((f) => getDayValue(dateKey, f));
                    const isEditing = editingCell?.row === row && editingCell?.colIdx === i;
                    return (
                      <td
                        key={i}
                        className="cell-number cell-split"
                        onClick={() => !isEditing && setEditingCell({ row, colIdx: i })}
                      >
                        {isEditing ? (
                          <div className="cell-split-inputs">
                            {fields.map((f, fi) => {
                              const tLabel = activeRoomTypes[fi];
                              const isLast = fi === fields.length - 1;
                              return (
                                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <input
                                    className="cell-input"
                                    type="number"
                                    min="0"
                                    placeholder={tLabel}
                                    defaultValue={vals[fi]}
                                    autoFocus={fi === 0}
                                    id={`${row}-${i}-${fi}`}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === "Tab") && !isLast) {
                                        document.getElementById(`${row}-${i}-${fi + 1}`)?.focus();
                                      }
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                    onBlur={isLast ? () => {
                                      const data = {};
                                      fields.forEach((fk, idx) => {
                                        data[fk] = parseInt(document.getElementById(`${row}-${i}-${idx}`)?.value) || 0;
                                      });
                                      saveField(dateKey, data);
                                      setEditingCell(null);
                                    } : undefined}
                                  />
                                  {!isLast && <span className="cell-split-sep">/</span>}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="cell-total-split">
                            {fields.map((f, fi) => (
                              <span key={f}>
                                {vals[fi]}<span className="split-sub">{activeRoomTypes[fi]}</span>
                                {fi < fields.length - 1 && <>&nbsp;+&nbsp;</>}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* ── Séparateur valets ── */}
            <tr className="row-separator">
              <td colSpan={8} className="separator-label">
                VALETS DE CHAMBRE
              </td>
            </tr>

            {allValets.length === 0 ? (
              <tr>
                <td colSpan={8} className="cell-empty">
                  Aucun valet enregistré pour cet hôtel.
                </td>
              </tr>
            ) : (
              allValets.map((valet) => (
                <tr key={valet._id} className="row-valet">
                  <td className="row-label row-valet-name">
                    {valet.firstName} {valet.lastName}
                  </td>
                  {weekDates.map((d, i) => {
                    const dateKey = fmtDateKey(d);
                    const day = dayMap[dateKey];
                    const schedule = getSchedule(valet._id, dateKey);
                    const st = schedule?.status || null;
                    return (
                      <td key={i} className="cell-status">
                        {st ? (
                          <select
                            className={`status-select ${statusClass(st)}`}
                            value={st}
                            onChange={(e) =>
                              changeValetStatus(
                                dateKey,
                                day,
                                valet._id,
                                valet,
                                e.target.value,
                              )
                            }
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            className="btn-add-schedule"
                            onClick={() =>
                              day &&
                              changeValetStatus(
                                dateKey,
                                day,
                                valet._id,
                                valet,
                                "P",
                              )
                            }
                            title="Ajouter au planning"
                            disabled={!day}
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}

            {/* ── BESOIN DE VALETS ── */}
            {analyse && (
              <tr className="row-besoin">
                <td className="row-label">BESOIN DE VALETS</td>
                {weekDates.map((d, i) => {
                  const dateKey = fmtDateKey(d);
                  const a = getAnalyseDay(dateKey);
                  if (!a)
                    return (
                      <td key={i} className="cell-besoin">
                        —
                      </td>
                    );
                  const ok = a.surplus >= 0;
                  return (
                    <td
                      key={i}
                      className={`cell-besoin ${ok ? "besoin-ok" : "besoin-alert"}`}
                    >
                      <span className="besoin-icon">{ok ? "✓" : "!"}</span>
                      <span className="besoin-val">
                        {ok
                          ? `+${Math.floor(a.surplus / 60)}h`
                          : `+${a.valetsSupplémentairesNécessaires} valet(s)`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal gouvernant */}
      {gouvernantModal && (
        <Modal
          title="Modifier le gouvernant"
          onClose={() => setGouvernantModal(false)}
        >
          <form className="form" onSubmit={saveGouvernant}>
            <div className="form-group">
              <label className="form-label">Nom du gouvernant</label>
              <input
                className="form-input"
                type="text"
                placeholder="ex : LASSANA"
                value={gouvernantForm.gouvernantNom}
                onChange={(e) =>
                  setGouvernantForm({
                    ...gouvernantForm,
                    gouvernantNom: e.target.value,
                  })
                }
              />
            </div>
            <p className="form-section-label" style={{ marginTop: 16 }}>
              Statut par jour
            </p>
            <div className="gouvernant-statuts-grid">
              {DAYS_LABEL.map((day, i) => (
                <div key={i} className="gouv-day-item">
                  <label className="form-label">{day.slice(0, 3)}</label>
                  <select
                    className={`status-select ${statusClass(gouvernantForm.gouvernantStatuts[i])}`}
                    value={gouvernantForm.gouvernantStatuts[i] || "P"}
                    onChange={(e) => {
                      const updated = [...gouvernantForm.gouvernantStatuts];
                      updated[i] = e.target.value;
                      setGouvernantForm({
                        ...gouvernantForm,
                        gouvernantStatuts: updated,
                      });
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setGouvernantModal(false)}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
