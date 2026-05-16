import { useState, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  DEFAULT_PARAMS, MESES, CLIMA_ZARATE, CLIMA_BB,
  modeloIdeal, calcularConFricciones, getPctInop, runMonteCarlo,
} from "./lib/motor";
import { supabase } from "./lib/supabase";

// ─── PALETA ────────────────────────────────────────────────────────────────
const C = {
  navy: "#213363", blue: "#235C96", mid: "#6381A7", light: "#A5B5CC",
  bg: "#EEF2F7", surface: "#FFFFFF", border: "#D6E0ED",
  text: "#213363", muted: "#6381A7",
  accent: "#235C96", accentGold: "#B07D0A",
  green: "#065F46", greenBg: "#D1FAE5",
  red: "#991B1B", redBg: "#FEE2E2",
  orange: "#92400E", orangeBg: "#FEF3C7",
};

// ─── TABS ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "ideal",        label: "1. Modelo Ideal" },
  { id: "fricciones",   label: "2. Fricciones" },
  { id: "montecarlo",   label: "3. Monte Carlo" },
  { id: "mensual",      label: "4. Análisis Mensual" },
  { id: "trazabilidad", label: "5. Trazabilidad" },
  { id: "escenarios",   label: "6. Escenarios" },
];

// ─── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Montserrat', sans-serif; background: #EEF2F7; color: #213363; min-height: 100vh; }
input[type=number], select { outline: none; }
input[type=range] { width: 100%; accent-color: #235C96; }
button { font-family: 'Montserrat', sans-serif; cursor: pointer; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #EEF2F7; }
::-webkit-scrollbar-thumb { background: #A5B5CC; border-radius: 3px; }

.header {
  background: #213363; padding: 0 32px; display: flex; align-items: center;
  justify-content: space-between; height: 58px; position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 12px rgba(33,51,99,.25);
}
.header-brand { display: flex; align-items: center; gap: 10px; }
.header-title { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: .5px; }
.header-sub   { font-size: 9px; color: rgba(255,255,255,.4); letter-spacing: 1px; font-family: 'DM Mono', monospace; }
.header-kpis  { display: flex; gap: 0; }
.header-kpi   { padding: 4px 20px; border-left: 1px solid rgba(255,255,255,.12); text-align: right; }
.header-kpi-v { font-size: 16px; font-weight: 800; color: #fff; line-height: 1; }
.header-kpi-l { font-size: 9px; color: rgba(255,255,255,.4); letter-spacing: .5px; text-transform: uppercase; margin-top: 2px; }
.back-btn {
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.7); font-size: 10px; font-weight: 600;
  padding: 5px 12px; border-radius: 6px; letter-spacing: .3px; transition: all .15s;
}
.back-btn:hover { background: rgba(255,255,255,.2); color: #fff; }

.tabs-bar {
  background: #fff; border-bottom: 1px solid #D6E0ED;
  display: flex; padding: 0 32px; gap: 0; overflow-x: auto;
  position: sticky; top: 58px; z-index: 99;
}
.tab-btn {
  padding: 13px 20px; border: none; background: transparent;
  color: #6381A7; font-size: 11px; font-weight: 600;
  border-bottom: 2px solid transparent; white-space: nowrap;
  transition: all .15s; letter-spacing: .3px;
}
.tab-btn.active { color: #213363; border-bottom-color: #235C96; }
.tab-btn:hover:not(.active) { color: #213363; background: #EEF2F7; }

.content { max-width: 1200px; margin: 0 auto; padding: 24px 32px 60px; }

.card {
  background: #fff; border: 1px solid #D6E0ED; border-radius: 10px;
  padding: 20px 24px; margin-bottom: 16px;
}
.card-title {
  font-size: 10px; font-weight: 700; color: #235C96; text-transform: uppercase;
  letter-spacing: 2px; margin-bottom: 14px; padding-bottom: 8px;
  border-bottom: 1px solid #D6E0ED; display: flex; align-items: center; gap: 8px;
}
.card-sub { font-size: 11px; color: #6381A7; font-weight: 400; text-transform: none; letter-spacing: 0; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

.kpi-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.kpi {
  flex: 1; min-width: 120px; background: #EEF2F7; border: 1px solid #D6E0ED;
  border-radius: 8px; padding: 12px 16px;
}
.kpi-v { font-size: 22px; font-weight: 800; color: #213363; line-height: 1; }
.kpi-l { font-size: 9px; color: #6381A7; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
.kpi-u { font-size: 10px; color: #6381A7; margin-top: 2px; }

.input-group { display: flex; flex-wrap: wrap; gap: 10px; }
.input-field { flex: 1; min-width: 180px; }
.input-label { font-size: 10px; color: #6381A7; margin-bottom: 4px; font-weight: 600; letter-spacing: .3px; text-transform: uppercase; }
.input-el {
  width: 100%; background: #EEF2F7; border: 1px solid #D6E0ED;
  border-radius: 6px; padding: 7px 10px; color: #213363;
  font-size: 13px; font-family: 'Montserrat', sans-serif;
}
.input-el:focus { border-color: #235C96; background: #fff; }

.toggle-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px; }
.toggle-btn {
  padding: 5px 14px; border-radius: 6px; border: 1px solid #D6E0ED;
  background: #EEF2F7; color: #6381A7; font-size: 11px; font-weight: 600;
  transition: all .15s;
}
.toggle-btn.active { background: #213363; border-color: #213363; color: #fff; }

.data-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 10px; border-radius: 6px; font-size: 12px;
}
.data-row:nth-child(odd) { background: #EEF2F7; }
.data-key { color: #6381A7; }
.data-val { font-weight: 700; color: #213363; font-family: 'DM Mono', monospace; }

.run-btn {
  padding: 10px 28px; border-radius: 8px; border: none;
  background: #213363; color: #fff; font-size: 13px; font-weight: 700;
  transition: all .2s; letter-spacing: .3px;
}
.run-btn:hover:not(:disabled) { background: #235C96; }
.run-btn:disabled { background: #A5B5CC; cursor: not-allowed; }

.source-note {
  font-size: 10px; color: #6381A7; background: #EEF2F7; border: 1px solid #D6E0ED;
  border-radius: 6px; padding: 8px 12px; margin-top: 8px;
  border-left: 3px solid #B07D0A;
}

.p-badge {
  flex: 1; min-width: 120px; border-radius: 8px; padding: 12px 16px;
  border-width: 1px; border-style: solid;
}
.p-badge-v { font-size: 22px; font-weight: 800; line-height: 1; }
.p-badge-l { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
.p-badge-d { font-size: 10px; margin-top: 4px; opacity: .7; }

.trace-row {
  display: grid; grid-template-columns: 220px 1fr 160px;
  gap: 12px; padding: 8px 12px; border-radius: 6px; align-items: start;
  font-size: 12px;
}
.trace-row:nth-child(odd) { background: #EEF2F7; }
.trace-group {
  font-size: 10px; font-weight: 700; color: #B07D0A; text-transform: uppercase;
  letter-spacing: 1.5px; margin: 16px 0 6px; padding-left: 10px;
  border-left: 3px solid #B07D0A;
}
.formula-badge {
  font-size: 11px; color: #235C96; background: rgba(35,92,150,.08);
  padding: 2px 8px; border-radius: 4px; font-family: 'DM Mono', monospace;
}
.check-ok   { font-size: 10px; color: #065F46; margin-top: 2px; }
.check-warn { font-size: 10px; color: #92400E; margin-top: 2px; }

.escenario-card {
  background: #EEF2F7; border: 1px solid #D6E0ED; border-radius: 8px;
  padding: 14px 16px; margin-bottom: 8px; display: flex;
  justify-content: space-between; align-items: center;
}
.escenario-name { font-size: 13px; font-weight: 700; color: #213363; }
.escenario-desc { font-size: 11px; color: #6381A7; margin-top: 2px; }
.escenario-val  { font-size: 18px; font-weight: 800; color: #235C96; font-family: 'DM Mono', monospace; }
.escenario-actions { display: flex; gap: 6px; }
.action-btn {
  padding: 4px 10px; border-radius: 5px; border: 1px solid #D6E0ED;
  background: #fff; color: #6381A7; font-size: 10px; font-weight: 600;
  transition: all .15s;
}
.action-btn:hover { background: #213363; color: #fff; border-color: #213363; }
.action-btn.danger:hover { background: #991B1B; border-color: #991B1B; }
`;

// ─── UI HELPERS ────────────────────────────────────────────────────────────
const KPI = ({ label, value, unit, color }) => (
  <div className="kpi" style={{ borderColor: color ? `${color}44` : undefined }}>
    <div className="kpi-v" style={{ color: color || C.navy }}>{value}</div>
    <div className="kpi-l">{label}</div>
    {unit && <div className="kpi-u">{unit}</div>}
  </div>
);

const CardTitle = ({ children, sub }) => (
  <div className="card-title">
    {children}
    {sub && <span className="card-sub">— {sub}</span>}
  </div>
);

const InputField = ({ label, value, onChange, min, max, step = 1, unit }) => (
  <div className="input-field">
    <div className="input-label">{label}{unit ? ` (${unit})` : ""}</div>
    <input className="input-el" type="number" value={value}
      min={min} max={max} step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)} />
  </div>
);

const Toggle = ({ label, options, value, onChange }) => (
  <div style={{ marginBottom: 12 }}>
    <div className="input-label">{label}</div>
    <div className="toggle-row">
      {options.map(o => (
        <button key={o} className={`toggle-btn ${value === o ? "active" : ""}`}
          onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  </div>
);

const DataRow = ({ label, val1, val2 }) => (
  <div className="data-row">
    <span className="data-key">{label}</span>
    <span style={{ color: C.mid, fontSize: 11 }}>{val1}</span>
    <span className="data-val">{val2}</span>
  </div>
);

const TooltipStyle = { background: "#213363", border: "1px solid #1a3356", color: "#fff", fontSize: 12 };

// ─── TAB 1: MODELO IDEAL ───────────────────────────────────────────────────
function TabIdeal({ p, set }) {
  const ideal = modeloIdeal(p);
  const real  = calcularConFricciones(p);

  const wf = [
    { name: "Arena Origen",  v: real.costoArena    / real.tnEntregadas, c: C.blue },
    { name: "Flete Barco",   v: real.flete          / real.tnEntregadas, c: "#1a4a8a" },
    { name: "Combustible",   v: (real.combNav + real.combPuerto) / real.tnEntregadas, c: "#B07D0A" },
    { name: "Agencias",      v: real.costoAgencias  / real.tnEntregadas, c: C.mid },
    { name: "Opex",          v: real.costoOpex      / real.tnEntregadas, c: "#065F46" },
    { name: "Camiones",      v: real.costoCamiones  / real.tnEntregadas, c: "#4A1D96" },
    { name: "Acopio",        v: real.costoAcopio    / real.tnEntregadas, c: "#6381A7" },
    { name: "Mermas",        v: real.costoMermas    / real.tnEntregadas, c: C.red },
  ];

  return (
    <div>
      <div className="kpi-row">
        <KPI label="Costo Total" value={`$${real.usdTn.toFixed(2)}`} unit="USD/Tn entregada" color={C.accentGold} />
        <KPI label="Tn Entregadas" value={real.tnEntregadas.toFixed(0)} unit={`de ${p.capacidadBarco.toLocaleString()} cargadas`} />
        <KPI label="Días Totales" value={real.totalDias.toFixed(1)} unit="con fricciones" />
        <KPI label="Merma Total" value={`${((real.totalMermas_Tn / p.capacidadBarco) * 100).toFixed(2)}%`}
          unit={`${real.totalMermas_Tn.toFixed(0)} Tn perdidas`}
          color={real.totalMermas_Tn / p.capacidadBarco > 0.04 ? C.red : C.green} />
      </div>

      <div className="grid-2">
        <div className="card">
          <CardTitle sub="Velocidad física máxima sin fricciones">Parámetros del Barco</CardTitle>
          <div className="input-group">
            <InputField label="Capacidad" value={p.capacidadBarco} onChange={v => set("capacidadBarco", v)} unit="Tn" min={1000} max={80000} step={1000} />
            <InputField label="Densidad arena" value={p.densidadArena} onChange={v => set("densidadArena", v)} unit="T/m³" min={1} max={2} step={0.05} />
            <InputField label="Grampada" value={p.grampada} onChange={v => set("grampada", v)} unit="m³" min={5} max={30} />
            <InputField label="Grúas" value={p.gruas} onChange={v => set("gruas", v)} min={1} max={4} />
            <InputField label="Mov/min grúa" value={p.movGrampa} onChange={v => set("movGrampa", v)} min={0.1} max={2} step={0.1} />
            <InputField label="Velocidad barco" value={p.velocidadBarco} onChange={v => set("velocidadBarco", v)} unit="kt" min={6} max={18} step={0.5} />
            <InputField label="Distancia Z→BB" value={p.distanciaZBB} onChange={v => set("distanciaZBB", v)} unit="mn" min={100} max={2000} step={10} />
          </div>
          <div style={{ height: 1, background: C.border, margin: "14px 0" }} />
          <Toggle label="Horas/día — Zárate (carga)" options={[4, 8, 12, 24]} value={p.horasDiaZarate} onChange={v => set("horasDiaZarate", v)} />
          <Toggle label="Horas/día — Bahía Blanca (descarga)" options={[4, 8, 12, 14, 24]} value={p.horasDiaBB} onChange={v => set("horasDiaBB", v)} />
        </div>

        <div>
          <div className="card">
            <CardTitle>Modelo Ideal — Tiempos</CardTitle>
            <DataRow label="Vel. carga" val1={`${ideal.velCarga_TnMin.toFixed(2)} Tn/min`} val2={`${ideal.velCarga_TnHr.toFixed(0)} Tn/hr`} />
            <DataRow label="Tiempo carga (ideal)" val1={`${ideal.tCarga_hr.toFixed(1)} hs`} val2={`${ideal.tCarga_dias.toFixed(3)} días`} />
            <DataRow label="Tiempo descarga (ideal)" val1={`${ideal.tDescarga_hr.toFixed(1)} hs`} val2={`${ideal.tDescarga_dias.toFixed(3)} días`} />
            <DataRow label="Navegación (ida)" val1={`${(ideal.diasNav * 24).toFixed(1)} hs`} val2={`${ideal.diasNav.toFixed(3)} días`} />
            <DataRow label="Total viaje (ideal)" val1="—" val2={`${ideal.totalDias.toFixed(2)} días`} />
            <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", marginTop: 12 }}>
              <div style={{ fontSize: 10, color: C.orange }}>Δ Ideal → Real</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.orange }}>
                +{(real.totalDias - ideal.totalDias).toFixed(2)} días de fricciones
              </div>
            </div>
          </div>

          <div className="card">
            <CardTitle>Costos Económicos</CardTitle>
            <div className="input-group">
              <InputField label="Time Charter" value={p.timeCharter} onChange={v => set("timeCharter", v)} unit="USD/día" min={5000} max={50000} step={500} />
              <InputField label="VLSFO" value={p.precioVLSFO} onChange={v => set("precioVLSFO", v)} unit="USD/T" min={400} max={1500} step={10} />
              <InputField label="Consumo navegando" value={p.consumoNavegando} onChange={v => set("consumoNavegando", v)} unit="T/día" min={5} max={40} step={0.5} />
              <InputField label="Consumo puerto" value={p.consumoPuerto} onChange={v => set("consumoPuerto", v)} unit="T/día" min={1} max={20} step={0.5} />
              <InputField label="Agencia Zárate" value={p.agenciaZarate} onChange={v => set("agenciaZarate", v)} unit="USD" min={0} step={500} />
              <InputField label="Agencia BB" value={p.agenciaBB} onChange={v => set("agenciaBB", v)} unit="USD" min={0} step={500} />
              <InputField label="Opex carga" value={p.opexCargaUSDTn} onChange={v => set("opexCargaUSDTn", v)} unit="USD/Tn" min={0} step={0.5} />
              <InputField label="Opex descarga" value={p.opexDescargaUSDTn} onChange={v => set("opexDescargaUSDTn", v)} unit="USD/Tn" min={0} step={0.5} />
              <InputField label="Arena origen" value={p.precioArenaOrigen} onChange={v => set("precioArenaOrigen", v)} unit="USD/Tn" min={0} step={0.5} />
              <InputField label="Camiones (directo)" value={p.costoCamionesDirUSDTn} onChange={v => set("costoCamionesDirUSDTn", v)} unit="USD/Tn" min={0} step={1} />
              <InputField label="Acopio BB" value={p.costoAcopioUSDTn} onChange={v => set("costoAcopioUSDTn", v)} unit="USD/Tn" min={0} step={0.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <CardTitle>Waterfall — Descomposición USD/Tn</CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={wf} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 10 }} />
            <Tooltip contentStyle={TooltipStyle} formatter={v => [`$${v.toFixed(2)} USD/Tn`]} />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>
              {wf.map((w, i) => <Cell key={i} fill={w.c} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── TAB 2: FRICCIONES ─────────────────────────────────────────────────────
function TabFricciones({ p, set }) {
  const real  = calcularConFricciones(p);
  const inopZ = getPctInop(CLIMA_ZARATE, p.inopZarateLluvia, p.inopZarateViento);
  const inopB = getPctInop(CLIMA_BB,     p.inopBBLluvia,    p.inopBBViento);

  const climaData = MESES.map((m, i) => ({
    mes: m,
    inopZ: parseFloat((inopZ[i] * 100).toFixed(1)),
    inopB: parseFloat((inopB[i] * 100).toFixed(1)),
  }));

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <CardTitle sub="Condiciones que detienen la operación">Umbrales de Inoperabilidad</CardTitle>

          <div style={{ marginBottom: 16, padding: "12px 14px", background: "#EEF2F7", borderRadius: 8, borderLeft: `3px solid ${C.blue}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 8 }}>🔵 Zárate — Carga</div>
            <div className="input-group">
              <InputField label="Lluvia inoperable desde" value={p.inopZarateLluvia} onChange={v => set("inopZarateLluvia", v)} unit="mm/día" min={5} max={100} step={5} />
              <InputField label="Viento inoperable desde" value={p.inopZarateViento} onChange={v => set("inopZarateViento", v)} unit="km/h" min={20} max={100} step={5} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              % días inhábiles prom. anual: <strong style={{ color: C.blue }}>
                {(inopZ.reduce((a, b) => a + b, 0) / 12 * 100).toFixed(1)}%
              </strong> → {((inopZ.reduce((a, b) => a + b, 0) / 12) * real.ideal.tCarga_dias / (1 - inopZ.reduce((a, b) => a + b, 0) / 12)).toFixed(2)} días extra/viaje
            </div>
          </div>

          <div style={{ marginBottom: 16, padding: "12px 14px", background: "#FEE2E2", borderRadius: 8, borderLeft: `3px solid ${C.red}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 8 }}>🔴 Bahía Blanca — Descarga</div>
            <div className="input-group">
              <InputField label="Lluvia inoperable desde" value={p.inopBBLluvia} onChange={v => set("inopBBLluvia", v)} unit="mm/día" min={5} max={100} step={5} />
              <InputField label="Viento inoperable desde" value={p.inopBBViento} onChange={v => set("inopBBViento", v)} unit="km/h" min={20} max={100} step={5} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              % días inhábiles prom. anual: <strong style={{ color: C.red }}>
                {(inopB.reduce((a, b) => a + b, 0) / 12 * 100).toFixed(1)}%
              </strong> → {((inopB.reduce((a, b) => a + b, 0) / 12) * real.ideal.tDescarga_dias / (1 - inopB.reduce((a, b) => a + b, 0) / 12)).toFixed(2)} días extra/viaje
            </div>
          </div>

          <div style={{ height: 1, background: C.border, margin: "12px 0" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accentGold, marginBottom: 8 }}>⏱ Espera en Puerto</div>
          <InputField label="Espera Zárate (días fijos — puerto propio)" value={p.esperaZarate}
            onChange={v => set("esperaZarate", v)} min={0} max={5} step={0.25} />
          <div className="input-label" style={{ marginTop: 10, marginBottom: 6 }}>Espera BB por mes (días) — estadístico</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>
            {MESES.map((m, i) => (
              <div key={m}>
                <div style={{ fontSize: 9, color: C.muted, textAlign: "center", marginBottom: 2 }}>{m}</div>
                <input type="number" value={p.esperaBBMes[i]} step={0.1} min={0} max={10}
                  onChange={e => { const arr = [...p.esperaBBMes]; arr[i] = parseFloat(e.target.value) || 0; set("esperaBBMes", arr); }}
                  style={{ width: "100%", background: "#EEF2F7", border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 5px", color: C.accentGold, fontSize: 12, textAlign: "center" }} />
              </div>
            ))}
          </div>
          <div className="source-note">
            Fuente datos clima: estimación regional. Validar con SMN (smn.gob.ar) y CGPBB. Fuente espera BB: estimar con agencia Argelan.
          </div>
        </div>

        <div className="card">
          <CardTitle sub="Pérdida física de arena — doble impacto: costo + denominador">Mermas</CardTitle>

          {[
            { key: "pctMermaCarga",    label: "Merma Carga (Zárate)",   color: C.blue,       tip: "Derrames en grampa, limpieza bodegas, vuelo de material. Rango típico: 0.5–3%" },
            { key: "pctMermaDescarga", label: "Merma Descarga (BB)",    color: C.orange,     tip: "Arena que queda en bodegas o cae al agua. Rango típico: 0.5–2%" },
            { key: "pctMermaAcopio",   label: "Merma Acopio BB",        color: C.red,        tip: "Pérdida en stockpile por viento/lluvia. Rango típico: 0.5–2% acumulativo." },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "DM Mono, monospace" }}>
                  {(p[key] * 100).toFixed(2)}%
                </span>
              </div>
              <input type="range" min={0} max={0.10} step={0.001} value={p[key]}
                onChange={e => set(key, parseFloat(e.target.value))}
                style={{ accentColor: color }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted }}>
                <span>0%</span>
                <span style={{ color }}>≈ {(p[key] * p.capacidadBarco).toFixed(0)} Tn perdidas/viaje</span>
                <span>10%</span>
              </div>
            </div>
          ))}

          <div style={{ height: 1, background: C.border, margin: "14px 0" }} />
          <CardTitle sub="% descargado directo vs. a acopio">Split Descarga</CardTitle>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>Despacho directo</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{((1 - p.pctAcopio) * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={1 - p.pctAcopio}
            onChange={e => set("pctAcopio", parseFloat((1 - e.target.value).toFixed(2)))}
            style={{ accentColor: C.green }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[
              { label: "Directo", val: `${real.tnDirecto.toFixed(0)} Tn`, sub: `$${p.costoCamionesDirUSDTn}/Tn`, c: C.green },
              { label: "Acopio",  val: `${real.tnAcopio.toFixed(0)} Tn`,  sub: `$${p.costoAcopioUSDTn}/Tn`,     c: C.accentGold },
              { label: "Merma Acopio", val: `${real.mermaAcopio_Tn.toFixed(0)} Tn`, sub: `${(p.pctMermaAcopio * 100).toFixed(1)}%`, c: C.red },
            ].map(({ label, val, sub, c }) => (
              <div key={label} style={{ background: "#EEF2F7", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.muted }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{val}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <CardTitle>Inoperabilidad Mensual — % días inhábiles por puerto</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={climaData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} unit="%" />
            <Tooltip contentStyle={TooltipStyle} formatter={v => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="inopZ" name="Zárate (carga)" fill={C.blue} radius={[3, 3, 0, 0]} />
            <Bar dataKey="inopB" name="BB (descarga)" fill={C.red} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="kpi-row">
        <KPI label="Días extra clima Zárate" value={real.diasInopZ.toFixed(2)} unit="días/viaje prom." color={C.blue} />
        <KPI label="Días extra clima BB" value={real.diasInopB.toFixed(2)} unit="días/viaje prom." color={C.red} />
        <KPI label="Merma total" value={`${real.totalMermas_Tn.toFixed(0)} Tn`} unit={`${((real.totalMermas_Tn / p.capacidadBarco) * 100).toFixed(2)}% de la carga`} color={C.orange} />
        <KPI label="USD/Tn modelo real" value={`$${real.usdTn.toFixed(2)}`} color={C.accentGold} />
      </div>
    </div>
  );
}

// ─── TAB 3: MONTE CARLO ────────────────────────────────────────────────────
function TabMonteCarlo({ p }) {
  const [n, setN] = useState(5000);
  const [mesIdx, setMesIdx] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [running, setRunning] = useState(false);
  const real = calcularConFricciones(p, mesIdx ?? 5);

  const run = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      setResultado(runMonteCarlo(p, n, mesIdx));
      setRunning(false);
    }, 60);
  }, [p, n, mesIdx]);

  const pBadges = resultado ? [
    { label: "P10 — Optimista",    val: resultado.p10, c: C.green,      bc: "#D1FAE5", desc: "Solo 10% mejor que este" },
    { label: "P25",                val: resultado.p25, c: "#1a7a3a",    bc: "#D1FAE5", desc: "Cuartil optimista" },
    { label: "P50 — Más probable", val: resultado.p50, c: C.accentGold, bc: "#FEF3C7", desc: "Mediana del modelo" },
    { label: "P75",                val: resultado.p75, c: C.orange,     bc: "#FEF3C7", desc: "Cuartil pesimista" },
    { label: "P90 — Pesimista",    val: resultado.p90, c: C.red,        bc: "#FEE2E2", desc: "Solo 10% peor que este" },
  ] : [];

  return (
    <div>
      <div className="card">
        <CardTitle sub="Variables aleatorias: velocidad (σ=1.2kt), VLSFO (σ=$100), espera BB (σ=0.6d), inoperabilidad (±20%), mermas (σ pequeño)">
          Configuración Monte Carlo
        </CardTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <div className="input-label">N simulaciones</div>
            <select className="input-el" value={n} onChange={e => setN(Number(e.target.value))} style={{ width: 160 }}>
              {[1000, 3000, 5000, 10000].map(v => <option key={v} value={v}>{v.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <div className="input-label">Mes (vacío = año completo aleatorio)</div>
            <select className="input-el" value={mesIdx ?? ""} onChange={e => setMesIdx(e.target.value === "" ? null : Number(e.target.value))} style={{ width: 220 }}>
              <option value="">Año completo</option>
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <button className="run-btn" onClick={run} disabled={running}>
            {running ? "Calculando..." : "▶ Correr Simulación"}
          </button>
          <div style={{ fontSize: 12, color: C.muted }}>
            Modelo base: <strong style={{ color: C.accentGold }}>${real.usdTn.toFixed(2)} USD/Tn</strong>
          </div>
        </div>
      </div>

      {resultado && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {pBadges.map(({ label, val, c, bc, desc }) => (
              <div key={label} className="p-badge" style={{ background: bc, borderColor: `${c}44` }}>
                <div className="p-badge-l" style={{ color: c }}>{label}</div>
                <div className="p-badge-v" style={{ color: c, fontFamily: "DM Mono, monospace" }}>${val.toFixed(2)}</div>
                <div className="p-badge-d" style={{ color: c }}>USD/Tn · {desc}</div>
              </div>
            ))}
            <div className="p-badge" style={{ background: "#EEF2F7", borderColor: C.border }}>
              <div className="p-badge-l" style={{ color: C.muted }}>Spread P10–P90</div>
              <div className="p-badge-v" style={{ color: C.navy, fontFamily: "DM Mono, monospace" }}>
                ${(resultado.p90 - resultado.p10).toFixed(2)}
              </div>
              <div className="p-badge-d" style={{ color: C.muted }}>σ = ${resultado.std.toFixed(2)} USD/Tn</div>
            </div>
          </div>

          <div className="card">
            <CardTitle>Distribución de Probabilidad — {resultado.n.toLocaleString()} simulaciones</CardTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={resultado.hist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="x" tick={{ fill: C.muted, fontSize: 10 }} tickCount={12} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TooltipStyle} formatter={(v, _, { payload }) => [`${v.toFixed(1)}% a $${payload.x}`]} />
                <ReferenceLine x={resultado.p10} stroke={C.green}      strokeWidth={2} label={{ value: "P10", fill: C.green,      fontSize: 10 }} />
                <ReferenceLine x={resultado.p50} stroke={C.accentGold} strokeWidth={2} label={{ value: "P50", fill: C.accentGold, fontSize: 10 }} />
                <ReferenceLine x={resultado.p90} stroke={C.red}        strokeWidth={2} label={{ value: "P90", fill: C.red,        fontSize: 10 }} />
                <ReferenceLine x={real.usdTn}    stroke={C.mid}        strokeDasharray="4 4" label={{ value: "Base", fill: C.mid, fontSize: 10 }} />
                <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
                  {resultado.hist.map((h, i) => (
                    <Cell key={i} fill={
                      h.x <= resultado.p10 ? C.green :
                      h.x <= resultado.p25 ? "#2a9a5a" :
                      h.x <= resultado.p75 ? C.blue :
                      h.x <= resultado.p90 ? C.orange : C.red
                    } />
                  ))} 
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB 4: MENSUAL ────────────────────────────────────────────────────────
function TabMensual({ p, set }) {
  const [mcData, setMcData] = useState(null);
  const [running, setRunning] = useState(false);

  const dataDet = useMemo(() =>
    MESES.map((m, i) => {
      const r = calcularConFricciones(p, i);
      return { mes: m, usdTn: parseFloat(r.usdTn.toFixed(2)), totalDias: parseFloat(r.totalDias.toFixed(2)) };
    }), [p]);

  const promedio = dataDet.reduce((a, b) => a + b.usdTn, 0) / 12;

  const runMC = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const d = MESES.map((_, i) => {
        const r = runMonteCarlo(p, 2000, i);
        return { mes: MESES[i], p10: r.p10, p50: r.p50, p90: r.p90, det: dataDet[i].usdTn };
      });
      setMcData(d);
      setRunning(false);
    }, 80);
  }, [p, dataDet]);

  return (
    <div>
      <div className="card">
        <CardTitle sub="USD/Tn determinístico por mes usando inoperabilidad climática histórica">
          Costo USD/Tn Mensual
        </CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={dataDet} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={TooltipStyle} formatter={v => [`$${v} USD/Tn`]} />
            <ReferenceLine y={promedio} stroke={C.accentGold} strokeDasharray="4 4"
              label={{ value: `Prom $${promedio.toFixed(2)}`, fill: C.accentGold, fontSize: 10 }} />
            <Bar dataKey="usdTn" radius={[4, 4, 0, 0]}>
              {dataDet.map((d, i) => <Cell key={i} fill={d.usdTn > promedio ? "#FCA5A5" : "#A7F3D0"} />)}
            </Bar>
            <Line type="monotone" dataKey="usdTn" stroke={C.blue} dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: C.muted }}>
          Promedio anual: <strong style={{ color: C.accentGold, fontSize: 16 }}>${promedio.toFixed(2)} USD/Tn</strong>
          &nbsp;·&nbsp; Rango: <strong style={{ color: C.navy }}>
            ${Math.min(...dataDet.map(d => d.usdTn)).toFixed(2)} – ${Math.max(...dataDet.map(d => d.usdTn)).toFixed(2)}
          </strong>
        </div>
      </div>

      <div className="card">
        <CardTitle>Precio Arena por Mes</CardTitle>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <button className="toggle-btn" style={{ background: p.arenaFijaPorMes ? C.navy : undefined, color: p.arenaFijaPorMes ? "#fff" : undefined }}
            onClick={() => set("arenaFijaPorMes", !p.arenaFijaPorMes)}>
            {p.arenaFijaPorMes ? "✓ Variable por mes" : `Precio fijo ($${p.precioArenaOrigen})`}
          </button>
          <span style={{ fontSize: 11, color: C.muted }}>Activá para ingresar precio mensual</span>
        </div>
        {p.arenaFijaPorMes && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
            {MESES.map((m, i) => (
              <div key={m}>
                <div style={{ fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 2 }}>{m}</div>
                <input type="number" value={p.precioArenaMes[i]} step={0.5} min={0}
                  onChange={e => { const arr = [...p.precioArenaMes]; arr[i] = parseFloat(e.target.value) || 0; set("precioArenaMes", arr); }}
                  style={{ width: "100%", background: "#EEF2F7", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 6px", color: C.accentGold, fontSize: 12, textAlign: "center" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <CardTitle sub="2.000 simulaciones por mes — 24.000 total">Monte Carlo Mensual</CardTitle>
        <button className="run-btn" onClick={runMC} disabled={running} style={{ marginBottom: 16 }}>
          {running ? "Calculando 24.000 simulaciones..." : "▶ Correr Monte Carlo Mensual"}
        </button>
        {mcData && (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={mcData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={TooltipStyle} formatter={(v, n) => [`$${v.toFixed(2)} USD/Tn`, n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="p90" name="P90 (pesimista)"  fill="#FCA5A544" radius={[3, 3, 0, 0]} />
                <Bar dataKey="p50" name="P50 (probable)"   fill="#FCD34D44" radius={[3, 3, 0, 0]} />
                <Bar dataKey="p10" name="P10 (optimista)"  fill="#A7F3D044" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="det" name="Determinístico" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="kpi-row" style={{ marginTop: 12 }}>
              <KPI label="Mejor mes P50" value={`${mcData.reduce((a, b) => a.p50 < b.p50 ? a : b).mes} $${Math.min(...mcData.map(d => d.p50)).toFixed(2)}`} color={C.green} />
              <KPI label="Peor mes P50"  value={`${mcData.reduce((a, b) => a.p50 > b.p50 ? a : b).mes} $${Math.max(...mcData.map(d => d.p50)).toFixed(2)}`} color={C.red} />
              <KPI label="Spread estacional" value={`$${(Math.max(...mcData.map(d => d.p50)) - Math.min(...mcData.map(d => d.p50))).toFixed(2)}`} color={C.accentGold} />
              <KPI label="Promedio anual P50" value={`$${(mcData.reduce((a, b) => a + b.p50, 0) / 12).toFixed(2)}`} color={C.blue} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TAB 5: TRAZABILIDAD ───────────────────────────────────────────────────
function TabTrazabilidad({ p }) {
  const real  = calcularConFricciones(p);
  const ideal = real.ideal;

  const grupos = [
    { titulo: "VELOCIDAD FÍSICA", items: [
      { n: "Vel. carga (ideal)", f: "grúas × grampada × densidad × mov/min", v: `${ideal.velCarga_TnMin.toFixed(4)} Tn/min`, c: "✓ [cant]×[m³]×[T/m³]×[mov/min] = T/min", ok: true },
      { n: "Vel. carga/hr",       f: "velCarga_min × 60",                     v: `${ideal.velCarga_TnHr.toFixed(2)} Tn/hr`,  c: "✓ T/min × 60 = T/hr", ok: true },
    ]},
    { titulo: "TIEMPOS IDEALES", items: [
      { n: "Tiempo carga (ideal)",    f: "capacidad / velCarga_hr / horasDíaZ",   v: `${ideal.tCarga_dias.toFixed(4)} días`,  c: "✓ [T]/[T/hr]/[hr/día] = días", ok: true },
      { n: "Tiempo descarga (ideal)", f: "capacidad / velDescarga_hr / horasDíaBB", v: `${ideal.tDescarga_dias.toFixed(4)} días`, c: "✓ ídem", ok: true },
      { n: "Días navegación (ida)",   f: "distancia / (velocidad × 24)",          v: `${ideal.diasNav.toFixed(4)} días`,      c: "✓ [mn]/([kt]×[hr/día]) = días", ok: true },
    ]},
    { titulo: "FRICCIONES — TIEMPO", items: [
      { n: "% inop Zárate",     f: "P(lluvia>umbral) ∪ P(viento>umbral)",         v: `${(real.pInopZ * 100).toFixed(2)}%`,        c: "⚠️ Aprox. — fuente estimación regional. Validar SMN.", ok: false },
      { n: "Días inop Zárate",  f: "tCarga_ideal × pInopZ / (1 − pInopZ)",         v: `${real.diasInopZ.toFixed(4)} días`,          c: "✓ Transforma % inhábil en días adicionales netos", ok: true },
      { n: "Días inop BB",      f: "tDescarga_ideal × pInopB / (1 − pInopB)",      v: `${real.diasInopB.toFixed(4)} días`,          c: "✓ ídem", ok: true },
      { n: "Tiempo carga real", f: "tCarga_ideal + diasInopZ + esperaZarate",       v: `${real.tCarga_real.toFixed(4)} días`,        c: "✓ suma directa", ok: true },
      { n: "Tiempo desc. real", f: "tDescarga_ideal + diasInopB + esperaBB[mes]",   v: `${real.tDescarga_real.toFixed(4)} días`,     c: "✓ suma directa", ok: true },
      { n: "Total días viaje",  f: "tCarga_real + tDescarga_real + diasNav × 2",    v: `${real.totalDias.toFixed(4)} días`,          c: "✓ ida y vuelta", ok: true },
    ]},
    { titulo: "MERMAS FÍSICAS", items: [
      { n: "Merma carga (Tn)",    f: "capacidad × pctMermaCarga",               v: `${real.mermaCarga_Tn.toFixed(2)} Tn`,    c: "✓ [T]×[%] = T", ok: true },
      { n: "Tn post-carga",       f: "capacidad − mermaCarga",                  v: `${real.tnPostCarga.toFixed(2)} Tn`,      c: "✓", ok: true },
      { n: "Merma descarga (Tn)", f: "tnPostCarga × pctMermaDescarga",          v: `${real.mermaDescarga_Tn.toFixed(2)} Tn`, c: "✓ aplicada sobre lo que llegó", ok: true },
      { n: "Tn a acopio",         f: "tnPostDescarga × pctAcopio",              v: `${real.tnAcopio.toFixed(2)} Tn`,         c: "✓", ok: true },
      { n: "Tn despacho directo", f: "tnPostDescarga × (1 − pctAcopio)",        v: `${real.tnDirecto.toFixed(2)} Tn`,        c: "✓", ok: true },
      { n: "Merma acopio (Tn)",   f: "tnAcopio × pctMermaAcopio",              v: `${real.mermaAcopio_Tn.toFixed(2)} Tn`,   c: "✓ solo sobre fracción en acopio", ok: true },
      { n: "Tn entregadas",       f: "tnPostDescarga − mermaAcopio",            v: `${real.tnEntregadas.toFixed(2)} Tn`,     c: `✓ Merma total: ${((real.totalMermas_Tn / p.capacidadBarco) * 100).toFixed(3)}%`, ok: true },
    ]},
    { titulo: "COSTOS", items: [
      { n: "Comb. navegación",  f: "diasNav × 2 × consumoNav × VLSFO",                      v: `$${real.combNav.toFixed(0)}`,       c: "✓ ida+vuelta", ok: true },
      { n: "Comb. puerto",      f: "(tCarga_real + tDescarga_real) × consumoPuerto × VLSFO", v: `$${real.combPuerto.toFixed(0)}`,    c: "✓", ok: true },
      { n: "Flete TC",          f: "totalDias × timeCharter",                                v: `$${real.flete.toFixed(0)}`,         c: "✓ incluye días extra por clima", ok: true },
      { n: "Costo arena",       f: "precioArena × capacidadBarco",                           v: `$${real.costoArena.toFixed(0)}`,    c: "✓ sobre lo cargado, no lo entregado", ok: true },
      { n: "Costo mermas",      f: "precioArena × totalMermas_Tn",                           v: `$${real.costoMermas.toFixed(0)}`,   c: "✓ arena perdida al precio de compra", ok: true },
      { n: "Camiones directo",  f: "costoCamiones × tnDirecto",                              v: `$${real.costoCamiones.toFixed(0)}`, c: "✓", ok: true },
      { n: "Acopio",            f: "costoAcopio × tnAcopio",                                 v: `$${real.costoAcopio.toFixed(0)}`,   c: "✓", ok: true },
      { n: "Costo total",       f: "Σ todos los costos",                                     v: `$${real.costoTotal.toFixed(0)}`,    c: "✓", ok: true },
    ]},
    { titulo: "RESULTADO FINAL", items: [
      { n: "USD/Tn entregada", f: "costoTotal / tnEntregadas", v: `$${real.usdTn.toFixed(4)} USD/Tn`,
        c: "✓ DENOMINADOR = Tn efectivamente entregadas (neto de mermas)", ok: true },
    ]},
  ];

  return (
    <div className="card">
      <CardTitle sub="Fórmula, valor actual y check dimensional de cada variable">Cadena Completa de Cálculo</CardTitle>
      {grupos.map(g => (
        <div key={g.titulo}>
          <div className="trace-group">{g.titulo}</div>
          {g.items.map((item, i) => (
            <div key={i} className="trace-row">
              <span style={{ color: C.navy, fontWeight: 600 }}>{item.n}</span>
              <span className="formula-badge">{item.f}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accentGold, fontFamily: "DM Mono, monospace" }}>{item.v}</div>
                <div className={item.ok ? "check-ok" : "check-warn"}>{item.c}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── TAB 6: ESCENARIOS ─────────────────────────────────────────────────────
function TabEscenarios({ p }) {
  const [escenarios, setEscenarios] = useState([]);
  const [nombre, setNombre] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const real = calcularConFricciones(p);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from("escenarios_arena").select("*").order("created_at", { ascending: false });
    setEscenarios(data || []);
    setLoading(false);
  };

  const guardar = async () => {
    if (!nombre.trim()) { setMsg("Ingresá un nombre para el escenario"); return; }
    setSaving(true);
    const { error } = await supabase.from("escenarios_arena").insert({
      nombre: nombre.trim(),
      descripcion: desc.trim(),
      params: p,
      usd_tn: parseFloat(real.usdTn.toFixed(2)),
    });
    if (error) { setMsg("Error al guardar: " + error.message); }
    else { setMsg("✓ Escenario guardado"); setNombre(""); setDesc(""); cargar(); }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const eliminar = async (id) => {
    await supabase.from("escenarios_arena").delete().eq("id", id);
    cargar();
  };

  return (
    <div>
      <div className="card">
        <CardTitle>Guardar Escenario Actual</CardTitle>
        <div className="input-group" style={{ marginBottom: 12 }}>
          <div className="input-field" style={{ flex: 2 }}>
            <div className="input-label">Nombre del escenario</div>
            <input className="input-el" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Caso base junio 2026" />
          </div>
          <div className="input-field" style={{ flex: 3 }}>
            <div className="input-label">Descripción (opcional)</div>
            <input className="input-el" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Notas sobre este escenario" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="run-btn" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "💾 Guardar Escenario"}
          </button>
          <div style={{ fontSize: 12, color: C.muted }}>
            USD/Tn actual: <strong style={{ color: C.accentGold }}>${real.usdTn.toFixed(2)}</strong>
          </div>
          {msg && <div style={{ fontSize: 12, color: msg.startsWith("✓") ? C.green : C.red, fontWeight: 600 }}>{msg}</div>}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <CardTitle>Escenarios Guardados</CardTitle>
          <button className="action-btn" onClick={cargar}>{loading ? "Cargando..." : "↻ Actualizar"}</button>
        </div>
        {escenarios.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>
            No hay escenarios guardados aún. Guardá el primero arriba.
          </div>
        ) : (
          escenarios.map(e => (
            <div key={e.id} className="escenario-card">
              <div>
                <div className="escenario-name">{e.nombre}</div>
                {e.descripcion && <div className="escenario-desc">{e.descripcion}</div>}
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontFamily: "DM Mono, monospace" }}>
                  {new Date(e.created_at).toLocaleDateString("es-AR")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="escenario-val">${e.usd_tn?.toFixed(2)} USD/Tn</div>
                <div className="escenario-actions">
                  <button className="action-btn danger" onClick={() => eliminar(e.id)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("ideal");
  const [params, setParams] = useState(DEFAULT_PARAMS);

  const set = useCallback((key, val) => setParams(prev => ({ ...prev, [key]: val })), []);

  const real = calcularConFricciones(params);

  const tabMap = {
    ideal:        <TabIdeal        p={params} set={set} />,
    fricciones:   <TabFricciones   p={params} set={set} />,
    montecarlo:   <TabMonteCarlo   p={params} />,
    mensual:      <TabMensual      p={params} set={set} />,
    trazabilidad: <TabTrazabilidad p={params} />,
    escenarios:   <TabEscenarios   p={params} />,
  };

  return (
    <>
      <style>{CSS}</style>
      <header className="header">
        <div className="header-brand">
          <div>
            <div className="header-title">⛴️ Transporte de Arena — Zárate → Sea White</div>
            <div className="header-sub">Terra Mare Services · Análisis Económico</div>
          </div>
        </div>
        <div className="header-kpis">
          {[
            { l: "USD/Tn", v: `$${real.usdTn.toFixed(2)}` },
            { l: "Tn Entregadas", v: real.tnEntregadas.toFixed(0) },
            { l: "Días Totales", v: real.totalDias.toFixed(1) },
            { l: "Merma", v: `${((real.totalMermas_Tn / params.capacidadBarco) * 100).toFixed(2)}%` },
          ].map(({ l, v }) => (
            <div key={l} className="header-kpi">
              <div className="header-kpi-v">{v}</div>
              <div className="header-kpi-l">{l}</div>
            </div>
          ))}
        </div>
        <button className="back-btn" onClick={() => window.open("https://terra-mare-portal.vercel.app", "_self")}>
          ← Portal
        </button>
      </header>

      <nav className="tabs-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="content">
        {tabMap[tab]}
      </div>
    </>
  );
}
