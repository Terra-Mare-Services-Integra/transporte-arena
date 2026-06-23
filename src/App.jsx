import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  DEFAULT_PARAMS, MESES, FUENTES, CLIMA_DB_DEFAULT, VLSFO_HISTORICO_DEFAULT,
  VLSFO_ESCENARIOS, TABLA_VEL_CONSUMO_DEFAULT, TRAMOS_REPO_DEFAULT,
  WAYPOINTS_RUTA, calcDistanciaTramo, haversine,
  calcVLSFOStats, getPrecioVLSFO, interpolarConsumo,
  calcEtapaRepo, calcEtapaVuelta, calcEtapa1, calcEtapa2, calcEtapa3, calcTotal, calcNViajes,
  calcAgenciaZarate, calcAgenciaBB, calcScheduler,
  getPctInopFromDB, getInopDetalle, velPromedioPonderada, checkEspejo,
  runMonteCarlo,
} from "./lib/motor";
import { supabase } from "./lib/supabase";

// ─── COLORES ───────────────────────────────────────────────────────────────
const T = {
  usuario:     {bg:"#FFFBEB",border:"#D4B84A",text:"#78610E",label:"#92740F"},
  input:       {bg:"#FFFBEB",border:"#D4B84A",text:"#78610E",label:"#92740F"},
  formula:     {bg:"#F9FAFB",border:"#D1D5DB",text:"#374151",label:"#6B7280"},
  stat:        {bg:"#F0FDF4",border:"#86EFAC",text:"#166534",label:"#15803D"},
  estadistico: {bg:"#F0FDF4",border:"#86EFAC",text:"#166534",label:"#15803D"},
};
const C = {
  navy:"#213363",blue:"#235C96",mid:"#6381A7",light:"#A5B5CC",
  bg:"#EEF2F7",surface:"#FFFFFF",border:"#D6E0ED",
  gold:"#B07D0A",green:"#166534",red:"#991B1B",orange:"#92400E",
  warn:"#FEF3C7",warnBorder:"#D4B84A",
  p10:"#166534",p50:"#B07D0A",p90:"#991B1B",
};

const TABS = [
  {id:"barco", label:"Contrato Barco",         icon:"🚢"},
  {id:"repo",  label:"Viaje a Puerto Carga",   icon:"🛳️"},
  {id:"az",    label:"Ag. Puerto de Carga",    icon:"⚓"},
  {id:"e1",    label:"Carga",                  icon:"⚓"},
  {id:"e2",    label:"Nav. a Puerto Descarga", icon:"🧭"},
  {id:"abb",   label:"Ag. Puerto Descarga",    icon:"⚓"},
  {id:"e3",    label:"Descarga",               icon:"🏭"},
  {id:"mc",    label:"Monte Carlo",            icon:"🎲"},
  {id:"ev",    label:"Evaluación",             icon:"📊"},
  {id:"sens",  label:"Sensibilidades",         icon:"📐"},
  {id:"cl",    label:"Base Clima",             icon:"🌦️"},
  {id:"cb",    label:"Combustible",            icon:"⛽"},
  {id:"sc",    label:"Escenarios",             icon:"💾"},
  {id:"faq",   label:"FAQ",                    icon:"❓"},
];

// ─── CSS RESPONSIVE ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px}
body{font-family:'Montserrat',sans-serif;background:#EEF2F7;color:#213363;min-height:100vh}
input[type=number],select{outline:none;font-family:'Montserrat',sans-serif}
input[type=range]{width:100%}
button{font-family:'Montserrat',sans-serif;cursor:pointer}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:#A5B5CC;border-radius:3px}

/* HEADER */
.hdr{background:#213363;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:54px;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(33,51,99,.3);gap:8px}
.hdr-brand{display:flex;flex-direction:column;flex-shrink:0}
.hdr-title{font-size:11px;font-weight:800;color:#fff;letter-spacing:.3px;white-space:nowrap}
.hdr-sub{font-size:8px;color:rgba(255,255,255,.4);font-family:'DM Mono',monospace}
.hdr-kpis{display:flex;overflow:hidden}
.hdr-kpi{padding:2px 10px;border-left:1px solid rgba(255,255,255,.12);text-align:right;flex-shrink:0}
.hdr-kpi-v{font-size:13px;font-weight:800;color:#fff;font-family:'DM Mono',monospace;line-height:1}
.hdr-kpi-l{font-size:7px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px}
.back{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);font-size:9px;font-weight:600;padding:4px 8px;border-radius:5px;white-space:nowrap;flex-shrink:0}

/* TABS */
.tabs{background:#fff;border-bottom:1px solid #D6E0ED;display:flex;padding:0 12px;overflow-x:auto;position:sticky;top:54px;z-index:99;-webkit-overflow-scrolling:touch}
.tabs::-webkit-scrollbar{height:3px}
.tab{padding:10px 12px;border:none;background:transparent;color:#6381A7;font-size:10px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;flex-shrink:0}
.tab.on{color:#213363;border-bottom-color:#235C96}

/* PAGE */
.page{max-width:1240px;margin:0 auto;padding:14px 12px 60px}
.card{background:#fff;border:1px solid #D6E0ED;border-radius:10px;padding:12px 14px;margin-bottom:10px}
.ct{font-size:8px;font-weight:700;color:#235C96;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #D6E0ED;display:flex;align-items:center;gap:5px;flex-wrap:wrap}

/* GRIDS RESPONSIVE */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px}
@media(max-width:768px){
  .g2{grid-template-columns:1fr}
  .g3{grid-template-columns:1fr 1fr}
  .g4{grid-template-columns:1fr 1fr}
  .hdr-kpi:nth-child(n+3){display:none}
  .hdr-title{font-size:10px}
}
@media(max-width:480px){
  .g3{grid-template-columns:1fr}
  .g4{grid-template-columns:1fr 1fr}
  .hdr-kpi{display:none}
}

/* KPIs */
.kpis{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.kpi{flex:1;min-width:85px;background:#EEF2F7;border:1px solid #D6E0ED;border-radius:8px;padding:8px 10px}
.kpi-v{font-size:16px;font-weight:800;line-height:1;font-family:'DM Mono',monospace}
.kpi-l{font-size:8px;color:#6381A7;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.kpi-u{font-size:9px;color:#6381A7;margin-top:2px}

/* CAMPOS */
.campo{margin-bottom:8px}
.campo-label{font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px;display:flex;align-items:center;gap:3px;flex-wrap:wrap;min-height:20px}
.campo-input{width:100%;border-radius:6px;padding:6px 8px;font-size:13px;border-width:1px;border-style:solid;font-family:'Montserrat',sans-serif}
.campo-formula{width:100%;border-radius:6px;padding:6px 8px;font-size:12px;font-family:'DM Mono',monospace;border-width:1px;border-style:solid}

.tipo-badge{display:inline-flex;align-items:center;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;letter-spacing:.3px;text-transform:uppercase}
.trow{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.tbtn{padding:4px 10px;border-radius:6px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:10px;font-weight:600;transition:all .15s}
.tbtn.on{background:#213363;border-color:#213363;color:#fff}

/* COST TABLE */
.cost-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
.cost-table th{padding:5px 8px;background:#213363;color:rgba(255,255,255,.7);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:left}
.cost-table th:nth-child(3),.cost-table td:nth-child(3){text-align:right}
.cost-table th:last-child,.cost-table td:last-child{text-align:right}
.cost-table td{padding:5px 8px;border-bottom:1px solid #EEF2F7}
.cost-table tr:nth-child(even) td{background:#F9FAFB}
.cost-table tr.total td{background:#EEF2F7;font-weight:800;font-size:12px}
.cost-table .mono{font-family:'DM Mono',monospace}
.cost-table .eq{font-size:9px;color:#6381A7;font-family:'DM Mono',monospace}
@media(max-width:600px){
  .cost-table th:nth-child(2),.cost-table td:nth-child(2){display:none}
  .cost-table th:nth-child(3),.cost-table td:nth-child(3){display:none}
}

/* HOVER */
.hv{position:relative;display:inline-block;cursor:help;border-bottom:1px dashed #A5B5CC}
.hv:hover .hvt{display:block}
.hvt{display:none;position:absolute;bottom:calc(100%+5px);right:0;background:#213363;border:1px solid #1a3356;border-radius:8px;padding:8px 12px;min-width:240px;max-width:320px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.hvt-title{font-size:8px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700}
.hvt-line{font-size:10px;color:rgba(255,255,255,.85);font-family:'DM Mono',monospace;padding:1px 0;line-height:1.5;display:block}

.run{padding:8px 18px;border-radius:7px;border:none;background:#213363;color:#fff;font-size:11px;font-weight:700;transition:all .2s;letter-spacing:.3px}
.run:hover:not(:disabled){background:#235C96}
.run:disabled{background:#A5B5CC;cursor:not-allowed}

.pbadge{flex:1;min-width:95px;border-radius:8px;padding:9px 11px;border-width:1px;border-style:solid}
.pbadge-v{font-size:17px;font-weight:800;font-family:'DM Mono',monospace;line-height:1}
.pbadge-l{font-size:8px;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.pbadge-d{font-size:9px;margin-top:3px;opacity:.75;line-height:1.4}

.espejo-warn{background:#FEF3C7;border:1px solid #D4B84A;border-radius:8px;padding:7px 12px;margin-bottom:8px;font-size:10px;color:#92400E}
.espejo-ok{background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:6px 12px;margin-bottom:8px;font-size:9px;color:#166534}
.src-note{font-size:9px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:6px;padding:5px 9px;margin-top:5px;color:#166534;border-left:3px solid #86EFAC}
.warn-note{font-size:9px;background:#FEF3C7;border:1px solid #D4B84A;border-radius:6px;padding:5px 9px;margin-top:5px;color:#92400E;border-left:3px solid #D4B84A}

.mes-selector{display:flex;gap:3px;flex-wrap:wrap;margin-bottom:8px}
.mes-btn{padding:3px 8px;border-radius:5px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:9px;font-weight:600;transition:all .15s}
.mes-btn.on{background:#213363;border-color:#213363;color:#fff}

.mc-var-row{display:grid;grid-template-columns:150px 150px 1fr 70px;gap:6px;padding:5px 8px;border-radius:5px;font-size:10px;align-items:center}
.mc-var-row:nth-child(odd){background:#EEF2F7}
@media(max-width:600px){.mc-var-row{grid-template-columns:1fr 1fr}}

.tramo-input{width:52px;border-radius:5px;padding:3px 4px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace;text-align:center;border-width:1px;border-style:solid}
.mapa-svg{width:100%;border-radius:8px;background:#EFF6FF;border:1px solid #D6E0ED}

/* VLSFO WIDGET */
.vlsfo-widget{background:linear-gradient(135deg,#213363,#1a2a50);border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap}
.vlsfo-price{font-size:26px;font-weight:800;color:#fff;font-family:'DM Mono',monospace;line-height:1}
.vlsfo-label{font-size:7px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.vlsfo-refs{display:flex;gap:10px;flex-wrap:wrap;flex:1}
.vlsfo-ref-v{font-size:13px;font-weight:700;font-family:'DM Mono',monospace;color:rgba(255,255,255,.85)}
.vlsfo-ref-l{font-size:7px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px}
.vlsfo-escenarios{display:flex;gap:4px;flex-wrap:wrap}
.vlsfo-btn{padding:3px 9px;border-radius:5px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:9px;font-weight:600;transition:all .15s;cursor:pointer;font-family:'Montserrat',sans-serif}
.vlsfo-btn.on{background:rgba(255,255,255,.25);border-color:rgba(255,255,255,.5);color:#fff}
.vlsfo-posicion{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;margin-top:3px;display:inline-block}

/* TABLA VELOCIDAD */
.vel-table{width:100%;border-collapse:collapse;font-size:11px}
.vel-table th{padding:6px 8px;background:#213363;color:rgba(255,255,255,.7);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:center}
.vel-table td{padding:5px 8px;border-bottom:1px solid #EEF2F7;text-align:center}
.vel-table tr:nth-child(even) td{background:#F9FAFB}
.vel-table tr.active-row td{background:#FFFBEB;font-weight:700}
.vel-table input{width:60px;border-radius:4px;padding:2px 5px;font-size:11px;text-align:center;font-family:'DM Mono',monospace;border:1px solid #D4B84A;background:#FFFBEB;color:#78610E}

/* CLIMA TABLE */
.clima-table{width:100%;border-collapse:collapse;font-size:11px}
.clima-table th{padding:5px 7px;background:#213363;color:rgba(255,255,255,.7);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:center}
.clima-table td{padding:4px 5px;border-bottom:1px solid #EEF2F7;text-align:center}
.clima-table tr:nth-child(even) td{background:#F9FAFB}
.clima-table input{width:54px;background:#FFFBEB;border:1px solid #D4B84A;border-radius:4px;padding:2px 4px;color:#78610E;font-size:10px;text-align:center;font-family:'DM Mono',monospace}
.clima-table .calc{background:#F9FAFB;border:1px solid #D1D5DB;border-radius:4px;padding:2px 5px;color:#374151;font-size:10px;font-family:'DM Mono',monospace;display:inline-block;min-width:44px}

/* EVAL TABLE */
.eval-table{width:100%;border-collapse:collapse;font-size:11px}
.eval-table th{padding:7px 10px;background:#213363;color:rgba(255,255,255,.8);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:left}
.eval-table th:last-child,.eval-table td:last-child,.eval-table th:nth-child(3),.eval-table td:nth-child(3){text-align:right}
.eval-table td{padding:7px 10px;border-bottom:1px solid #EEF2F7}
.eval-table tr.subtotal td{background:#F3F4F6;font-weight:700}
.eval-table tr.etapa-hdr td{background:#EEF2F7;font-weight:800;color:#213363;font-size:10px;letter-spacing:.5px;text-transform:uppercase}
.eval-table tr.grand-total td{background:#213363;color:#fff;font-weight:800;font-size:13px}
@media(max-width:600px){
  .eval-table th:nth-child(2),.eval-table td:nth-child(2){display:none}
  .eval-table th:nth-child(3),.eval-table td:nth-child(3){display:none}
}
`;

// ─── UI HELPERS ────────────────────────────────────────────────────────────
const TipoBadge = ({tipo}) => {
  const cfg={usuario:{bg:"#FFFBEB",c:"#78610E",l:"Input"},input:{bg:"#FFFBEB",c:"#78610E",l:"Input"},
    estadistico:{bg:"#DCFCE7",c:"#166534",l:"Stat"},stat:{bg:"#DCFCE7",c:"#166534",l:"Stat"},
    formula:{bg:"#F3F4F6",c:"#374151",l:"Fórmula"}};
  const s=cfg[tipo]||cfg.formula;
  return <span className="tipo-badge" style={{background:s.bg,color:s.c}}>{s.l}</span>;
};

const FuenteLink = ({fuente}) => (
  <a href={fuente.url} target="_blank" rel="noreferrer"
    style={{fontSize:8,color:C.blue,textDecoration:"none",borderBottom:"1px dashed #235C96",marginLeft:3}}>
    {fuente.label} ↗
  </a>
);

const Campo = ({label,value,onChange,tipo="usuario",unit,min,max,step=1,nota,inputType}) => {
  const st=T[tipo]||T.formula;
  const isText = inputType==="text" || typeof value === "string";
  return (
    <div className="campo">
      <div className="campo-label" style={{color:st.label}}>
        {label}{unit?` (${unit})`:""}<TipoBadge tipo={tipo}/>
      </div>
      {tipo==="formula"||tipo==="stat"?(
        <div className="campo-formula" style={{background:st.bg,borderColor:st.border,color:st.text}}>{value}</div>
      ):isText?(
        <input className="campo-input" type="text" value={value||""} 
          onChange={e=>onChange&&onChange(e.target.value)}
          style={{background:st.bg,borderColor:st.border,color:st.text}}/>
      ):(
        <input className="campo-input" type="number" value={value} min={min} max={max} step={step}
          onChange={e=>onChange&&onChange(parseFloat(e.target.value)||0)}
          style={{background:st.bg,borderColor:st.border,color:st.text}}/>
      )}
      {nota&&<div style={{fontSize:8,color:st.label,marginTop:2}}>{nota}</div>}
    </div>
  );
};

const Toggle = ({label,options,value,onChange,tipo="usuario"}) => {
  const st=T[tipo]||T.formula;
  return (
    <div style={{marginBottom:8}}>
      <div className="campo-label" style={{color:st.label}}>{label}<TipoBadge tipo={tipo}/></div>
      <div className="trow">{options.map(o=>(<button key={o} className={`tbtn ${value===o?"on":""}`} onClick={()=>onChange(o)}>{o}</button>))}</div>
    </div>
  );
};

const KPI = ({label,value,unit,color}) => (
  <div className="kpi" style={{borderColor:color?`${color}55`:undefined}}>
    <div className="kpi-v" style={{color:color||C.navy}}>{value}</div>
    <div className="kpi-l">{label}</div>
    {unit&&<div className="kpi-u">{unit}</div>}
  </div>
);

const HoverVal = ({value,title,lines,isTotal,color}) => (
  <span className="hv" style={{fontFamily:"DM Mono,monospace",fontWeight:isTotal?800:600,fontSize:isTotal?12:11,color:color||C.navy}}>
    {value}
    <span className="hvt">
      <span className="hvt-title">{title}</span>
      {(Array.isArray(lines)?lines:[lines]).map((l,i)=><span key={i} className="hvt-line">{l}</span>)}
    </span>
  </span>
);

const EspejoCheck = ({p}) => {
  const checks=(checkEspejo(p)||[]).filter(Boolean);
  const hasDiff=checks.some(c=>c.difiere);
  if(!hasDiff) return <div className="espejo-ok">✓ Campos espejo carga ↔ descarga iguales.</div>;
  return (
    <div className="espejo-warn">
      ⚠️ Difieren: {checks.filter(c=>c.difiere).map((c,i)=>(
        <span key={i} style={{marginLeft:6}}><strong>{c.label}</strong>: C={c.valCap} D={c.valDes}</span>
      ))}
    </div>
  );
};

const MesSelector = ({value,onChange}) => (
  <div className="mes-selector">
    {MESES.map((m,i)=>(
      <button key={m} className={`mes-btn ${value===i?"on":""}`} onClick={()=>onChange(i)}>{m}</button>
    ))}
  </div>
);

const TTip={contentStyle:{background:"#213363",border:"1px solid #1a3356",color:"#fff",fontSize:10}};

// ─── COST TABLE ────────────────────────────────────────────────────────────
function CostTable({rows,tnEntregadas}) {
  return (
    <table className="cost-table">
      <thead><tr><th>Concepto</th><th>Ecuación</th><th style={{textAlign:"right"}}>Total USD</th><th style={{textAlign:"right"}}>USD/Tn</th></tr></thead>
      <tbody>
        {rows.map((r,i)=>{
          const usdTn=tnEntregadas>0?r.total/tnEntregadas:0;
          return (
            <tr key={i} className={r.isTotal?"total":""}>
              <td style={{fontWeight:r.isTotal?800:500,color:r.isTotal?C.navy:undefined}}>{r.label}</td>
              <td className="eq">{r.eq}</td>
              <td style={{textAlign:"right"}}>
                <HoverVal value={`$${r.total.toLocaleString("es-AR",{maximumFractionDigits:0})}`}
                  title={r.label} lines={r.hover||[r.eq]} isTotal={r.isTotal}/>
              </td>
              <td className="mono" style={{textAlign:"right",color:C.mid}}>${usdTn.toFixed(1)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── VLSFO WIDGET ──────────────────────────────────────────────────────────
function VLSFOWidget({p,set}) {
  const stats=calcVLSFOStats(p.vlsfo_historico);
  const precioActivo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const pctColor=stats.pctVsPromedio12m>15?"#ff6b6b":stats.pctVsPromedio12m>5?"#ffa94d":"#69db7c";
  return (
    <div className="vlsfo-widget">
      <div>
        <div className="vlsfo-label">VLSFO en modelo</div>
        <div className="vlsfo-price">${precioActivo}<span style={{fontSize:12,opacity:.6}}>/T</span></div>
        <span className="vlsfo-posicion" style={{background:pctColor+"33",color:pctColor}}>
          {stats.pctVsPromedio12m>0?"+":""}{stats.pctVsPromedio12m.toFixed(1)}% vs prom 12M
        </span>
      </div>
      <div className="vlsfo-refs">
        {[
          {l:"Hoy",    v:`$${stats.actual}`},
          {l:"12M",   v:`$${stats.prom12m.toFixed(0)}`},
          {l:"5 años",v:`$${stats.prom5a.toFixed(0)}`},
          {l:"Mín",   v:`$${stats.min5a}`},
          {l:"Máx",   v:`$${stats.max5a}`},
        ].map(({l,v})=>(
          <div key={l}>
            <div className="vlsfo-ref-v">{v}</div>
            <div className="vlsfo-ref-l">{l}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="vlsfo-label" style={{marginBottom:4}}>ESCENARIO</div>
        <div className="vlsfo-escenarios">
          {VLSFO_ESCENARIOS.map(e=>(
            <button key={e.id} className={`vlsfo-btn ${p.nav_escenarioVLSFO===e.id?"on":""}`}
              onClick={()=>set("nav_escenarioVLSFO",e.id)} title={e.desc}>{e.label}</button>
          ))}
        </div>
        {p.nav_escenarioVLSFO==="manual"&&(
          <input type="number" value={p.nav_vlsfoManual} min={100} max={2000} step={10}
            onChange={e=>set("nav_vlsfoManual",parseFloat(e.target.value)||0)}
            style={{marginTop:5,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",
              borderRadius:5,padding:"3px 8px",color:"#fff",fontSize:12,width:90,fontFamily:"DM Mono,monospace"}}/>
        )}
      </div>
    </div>
  );
}

// ─── MAPA SVG ──────────────────────────────────────────────────────────────
// ─── MAPA SVG ESQUEMÁTICO ─────────────────────────────────────────────────
const COLS_TIPO = {"Hidrovía":"#185FA5","Estuario":"#0D7490","Costero":"#166534","Puerto":"#534AB7"};

function MapaNavegacion({tramos, onUpdate, titulo="IDA CARGADO"}) {
  const esLastre = titulo.includes("LASTRE");

  // Calcular distancias y totales con Haversine
  const tramosConDist = tramos.map(t => ({
    ...t,
    distanciaCalc: t.wpIds ? calcDistanciaTramo(t) : (t.distancia||0),
  }));
  const totalMn  = tramosConDist.reduce((a,t)=>a+t.distanciaCalc, 0);
  const totalHrs = tramosConDist.reduce((a,t)=>a+t.distanciaCalc/t.velocidad, 0);
  const velProm  = totalMn/totalHrs;

  // Puntos SVG esquemáticos (izq=Zárate, der=Sea White)
  const puntos = [
    {x:55,  y:72,  n:"Zárate",          s:"Km 102"},
    {x:175, y:112, n:"Confluencia",      s:"Canal Mitre"},
    {x:305, y:155, n:"Río de la Plata",  s:"Punta Indio"},
    {x:455, y:200, n:"Costa Bonaerense", s:"Mar abierto"},
    {x:635, y:258, n:"Rada BB",          s:"Exterior"},
    {x:735, y:282, n:"Sea White",        s:"Bahía Blanca"},
  ];
  const puntosOrden = esLastre ? [...puntos].reverse() : puntos;

  return (
    <div>
      {/* SVG esquemático */}
      <svg viewBox="0 0 800 320" style={{width:"100%",borderRadius:8,background:"#EFF6FF",border:"1px solid #D6E0ED",minHeight:160}}>
        <defs>
          <linearGradient id="agua3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DBEAFE"/>
            <stop offset="100%" stopColor="#BFDBFE"/>
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#agua3)" rx="8"/>
        <path d="M0,52 Q80,42 180,92 Q280,132 380,162 Q500,193 650,235 Q720,259 800,275 L800,320 L0,320 Z"
          fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1"/>

        {/* Líneas de tramos */}
        {tramosConDist.map((t,i)=>{
          const a=puntosOrden[i], b=puntosOrden[i+1];
          if(!a||!b) return null;
          const color=COLS_TIPO[t.tipo]||C.blue;
          const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
          return (
            <g key={t.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color} strokeWidth={esLastre?2:3} strokeDasharray={esLastre?"6,3":""} opacity={.85}/>
              <rect x={mx-22} y={my-11} width={44} height={18} rx={4} fill={color} opacity={.9}/>
              <text x={mx} y={my+2} textAnchor="middle" fontSize="10" fontWeight="700"
                fill="#fff" fontFamily="DM Mono,monospace">{t.velocidad}kt</text>
            </g>
          );
        })}

        {/* Marcadores */}
        {puntosOrden.map((pt,i)=>(
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={7}
              fill={i===0?"#213363":i===puntosOrden.length-1?"#166534":"#235C96"}
              stroke="#fff" strokeWidth={2}/>
            <text x={pt.x} y={pt.y-13} textAnchor="middle" fontSize="9" fontWeight="700" fill="#213363">{pt.n}</text>
            <text x={pt.x} y={pt.y-4}  textAnchor="middle" fontSize="7" fill="#6381A7">{pt.s}</text>
          </g>
        ))}

        {/* Stats en esquina */}
        <rect x={6} y={288} width={230} height={25} rx={4} fill="rgba(33,51,99,.88)"/>
        <text x={13} y={298} fontSize="7" fill="rgba(255,255,255,.5)" fontWeight="600">
          VEL. PROM. PONDERADA — {titulo}
        </text>
        <text x={13} y={309} fontSize="11" fill="#fff" fontWeight="800" fontFamily="DM Mono,monospace">
          {velProm.toFixed(1)}kt · {totalMn.toFixed(0)}mn · {totalHrs.toFixed(1)}hs
        </text>

        {/* Leyenda tipos */}
        {Object.entries(COLS_TIPO).map(([tipo,color],i)=>(
          <g key={tipo}>
            <rect x={700-i*85} y={10} width={8} height={3} fill={color} rx={1}/>
            <text x={711-i*85} y={14} fontSize="8" fill="#6381A7">{tipo}</text>
          </g>
        ))}
      </svg>

      {/* Tabla de tramos — solo velocidad editable */}
      <div style={{marginTop:8,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{background:C.navy}}>
              {["Tramo","Tipo","Dist. (mn)","Vel. (kt) ✏️","Consumo","Horas","Condición"].map(h=>(
                <th key={h} style={{padding:"5px 8px",color:"rgba(255,255,255,.6)",fontSize:8,
                  textAlign:"left",fontWeight:600,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tramosConDist.map((t,i)=>{
              const tipoConsumo=esLastre?"lastre":"cargado";
              const consumoDia=interpolarConsumo(DEFAULT_PARAMS.barco_tablaVelConsumo,t.velocidad,tipoConsumo);
              return (
                <tr key={t.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"6px 8px",color:C.navy,fontWeight:600,fontSize:10}}>{t.nombre}</td>
                  <td style={{padding:"6px 8px"}}>
                    <span style={{fontSize:8,padding:"1px 5px",borderRadius:3,
                      background:`${COLS_TIPO[t.tipo]||C.blue}18`,color:COLS_TIPO[t.tipo]||C.blue,fontWeight:700}}>
                      {t.tipo}
                    </span>
                  </td>
                  <td style={{padding:"6px 8px",fontFamily:"DM Mono,monospace",color:T.formula.text,fontSize:11}}>
                    {t.distanciaCalc.toFixed(1)}
                    <span style={{fontSize:8,color:C.muted,marginLeft:3}}>Hvs</span>
                  </td>
                  <td style={{padding:"6px 8px"}}>
                    <input className="tramo-input" type="number" value={t.velocidad} min={1} max={20} step={0.5}
                      style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}
                      onChange={e=>{
                        const arr=tramos.map((tr,idx)=>idx===i?{...tr,velocidad:parseFloat(e.target.value)||0}:tr);
                        onUpdate(arr);
                      }}/>
                  </td>
                  <td style={{padding:"6px 8px",color:C.mid,fontSize:10,fontFamily:"DM Mono,monospace"}}>{consumoDia.toFixed(1)}T/d</td>
                  <td style={{padding:"6px 8px",color:C.gold,fontWeight:700,fontFamily:"DM Mono,monospace",fontSize:10}}>
                    {(t.distanciaCalc/t.velocidad).toFixed(1)}hs
                  </td>
                  <td style={{padding:"6px 8px",color:C.muted,fontSize:9}}>{t.condicion}</td>
                </tr>
              );
            })}
            <tr style={{background:"#EEF2F7",fontWeight:700}}>
              <td style={{padding:"7px 8px",color:C.navy}} colSpan={2}>TOTAL</td>
              <td style={{padding:"7px 8px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalMn.toFixed(0)} mn</td>
              <td style={{padding:"7px 8px",color:C.blue,fontFamily:"DM Mono,monospace",fontSize:13}}>{velProm.toFixed(1)} kt ⌀</td>
              <td></td>
              <td style={{padding:"7px 8px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalHrs.toFixed(1)} hs</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ─── TAB BARCO ─────────────────────────────────────────────────────────────
function TabBarco({p,set}) {
  const tabla=p.barco_tablaVelConsumo;
  const velProm12=velPromedioPonderada(p.nav_tramos).velProm;

  const updateTabla=(idx,field,val)=>{
    const arr=[...tabla];arr[idx]={...arr[idx],[field]:parseFloat(val)||0};set("barco_tablaVelConsumo",arr);
  };
  const resetTabla=()=>set("barco_tablaVelConsumo",TABLA_VEL_CONSUMO_DEFAULT);

  // Costo diario total incluyendo misc
  const costoTotalDia=p.barco_timeCharter+p.barco_tripulacion+(p.barco_miscPorDia||0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
        {[
          {l:"Time Charter",     v:`$${p.barco_timeCharter.toLocaleString()}`,                              u:"USD/día"},
          {l:"Tripulación",      v:`$${p.barco_tripulacion.toLocaleString()}`,                               u:"USD/día"},
          {l:"Total diario",     v:`$${costoTotalDia.toLocaleString()}`,                                     u:"USD/día"},
          {l:"Por viaje (est.)", v:`$${(costoTotalDia*calcTotal(p).diasTotales/1000).toFixed(0)}k`,          u:"USD total"},
        ].map(({l,v,u})=>(
          <div key={l} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:.6,fontWeight:600,marginBottom:6}}>{l}</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1E293B",fontFamily:"ui-monospace,monospace",lineHeight:1}}>{v}</div>
            <div style={{fontSize:9,color:"#94A3B8",marginTop:3}}>{u}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ct">Identificación del Proyecto</div>
        <Campo label="Título del proyecto" value={p.proyecto_titulo||"Transporte Arena"} onChange={v=>set("proyecto_titulo",v)} tipo="usuario"
          nota="Aparece en el encabezado principal de la aplicación"/>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros del Contrato <TipoBadge tipo="usuario"/></div>
          <Campo label="Capacidad del barco" value={p.cap_capacidadBarco} onChange={v=>set("cap_capacidadBarco",v)} tipo="usuario" unit="Tn" min={1000} max={80000} step={1000}
            nota="Toneladas de arena que carga el barco por escala. Alimenta todas las etapas."/>
          <Campo label="Time Charter" value={p.barco_timeCharter} onChange={v=>set("barco_timeCharter",v)} tipo="usuario" unit="USD/día" min={5000} max={50000} step={500}
            nota="Costo diario del flete del barco. Aplica en todas las etapas."/>
          <Campo label="Tripulación" value={p.barco_tripulacion} onChange={v=>set("barco_tripulacion",v)} tipo="usuario" unit="USD/día" min={0} max={10000} step={100}
            nota="Costo diario de tripulación. En 0 si está incluido en el TC."/>
          <Campo label="Consumo en puerto" value={p.barco_consumoPuerto} onChange={v=>set("barco_consumoPuerto",v)} tipo="usuario" unit="T/día" min={1} max={20} step={0.5}
            nota="Consumo VLSFO mientras el barco está en puerto (carga y descarga). Típico Handysize: 3–6 T/día."/>
          <Campo label="Misceláneos / día" value={p.barco_miscPorDia||0} onChange={v=>set("barco_miscPorDia",v)} tipo="usuario" unit="USD/día" min={0} max={5000} step={50}
            nota="Gastos operativos diarios varios (comunicaciones, agua, provisiones, etc.)"/>
          <Campo label="Limpieza de bodega" value={p.barco_limpiezaBodega||0} onChange={v=>set("barco_limpiezaBodega",v)} tipo="usuario" unit="USD" min={0} max={100000} step={500}
            nota="Costo por escala para limpiar bodega antes de cargar arena. Se carga en el viaje de reposicionamiento."/>
          <Campo label="Importación / Waiver" value={p.barco_importacionWaiver||0} onChange={v=>set("barco_importacionWaiver",v)} tipo="usuario" unit="USD" min={0} max={100000} step={500}
            nota="Gastos de importación temporal del barco y/o waiver regulatorio."/>
          <Campo label="Días de vigencia waiver" value={p.barco_diasWaiver||30} onChange={v=>set("barco_diasWaiver",Math.max(1,Math.round(v)))} tipo="usuario" unit="días" min={1} max={180} step={1}
            nota="Período cubierto por el waiver. Determina cuántos viajes consecutivos pueden compartir el costo de importación y limpieza."/>
          <div style={{marginTop:10,padding:"8px 12px",background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:8,fontSize:10,color:"#0369A1"}}>
            <strong>Costo diario total</strong> (TC + Misc = ${costoTotalDia.toLocaleString()}/día) aplica a todos los días del viaje — reposicionamiento, cargando, navegando y descargando.
          </div>
        </div>

        <div className="card">
          <div className="ct">Tabla Velocidad / Consumo — Handysize {p.cap_capacidadBarco.toLocaleString("es-AR")} Tn
            <button onClick={resetTabla} style={{marginLeft:"auto",padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:8,fontWeight:700,cursor:"pointer"}}>Resetear</button>
          </div>
          <p style={{fontSize:10,color:C.mid,marginBottom:8,lineHeight:1.5}}>
            Consumo VLSFO interpolado automáticamente según la velocidad de cada tramo. Relación cúbica: C ∝ v³.
            La fila resaltada es la más cercana a la velocidad promedio actual ({velProm12.toFixed(1)}kt).
            <strong> Lastre = Cargado</strong> — sin descuento (operación prácticamente igual en consumo).
          </p>
          <table className="vel-table">
            <thead><tr><th>Vel (kt)</th><th>Cargado (T/día)</th><th>Lastre (T/día)</th></tr></thead>
            <tbody>{tabla.map((row,i)=>{
              const esActual=Math.abs(row.vel-velProm12)<0.75;
              return (
                <tr key={i} className={esActual?"active-row":""}>
                  <td style={{fontWeight:700,color:esActual?C.gold:C.navy,fontFamily:"DM Mono,monospace"}}>{row.vel}{esActual?" ←":""}</td>
                  <td><input type="number" value={row.cargado} step={0.1} min={1} onChange={e=>updateTabla(i,"cargado",e.target.value)}/></td>
                  <td><input type="number" value={row.lastre}  step={0.1} min={1} onChange={e=>updateTabla(i,"lastre", e.target.value)}/></td>
                </tr>
              );
            })}</tbody>
          </table>
          <div className="src-note">Fuente: valores típicos de mercado para Handysize bulk carrier. Validar con broker o consumo real del barco.</div>
        </div>
      </div>
    </div>
  );
}

// ─── SECCIÓN INOP (compartida entre carga y descarga) ──────────────────────
function SeccionInop({puerto,p,set,mesIdx,climaKey,umbralLluviaKey,umbralVientoKey,tIdeal_dias}) {
  const inopMes=getPctInopFromDB(p[climaKey],p[umbralLluviaKey],p[umbralVientoKey]);
  const inopDet=getInopDetalle(p[climaKey],p[umbralLluviaKey],p[umbralVientoKey],mesIdx);
  const pInop=inopDet.pInop;
  const diasInop=tIdeal_dias!=null ? tIdeal_dias*pInop/Math.max(0.01,1-pInop) : 0;
  return (
    <div className="card">
      <div className="ct">Inoperabilidad Climática — {puerto==="zarate"?"Zárate":"Bahía Blanca"} <TipoBadge tipo="estadistico"/>
        <FuenteLink fuente={puerto==="zarate"?FUENTES.climaZarate:FUENTES.climaBB}/>
      </div>
      <div className="g2">
        {/* Lluvia — selector con valores finos en rangos bajos */}
        <div className="campo">
          <div className="campo-label" style={{color:T.usuario.label}}>
            LLUVIA INOPERABLE DESDE <span style={{fontSize:7,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,borderRadius:3,padding:"1px 4px",color:T.usuario.text,fontWeight:700}}>INPUT</span>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>
            {[0.5,1,2,3,5,10,15,20,30,40,50].map(v=>(
              <button key={v}
                onClick={()=>set(umbralLluviaKey,v)}
                style={{
                  padding:"4px 9px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",
                  border:`1px solid ${p[umbralLluviaKey]===v?T.usuario.border:C.border}`,
                  background:p[umbralLluviaKey]===v?T.usuario.bg:"#fff",
                  color:p[umbralLluviaKey]===v?T.usuario.text:C.mid,
                  transition:"all .12s",
                }}>
                {v}mm
              </button>
            ))}
          </div>
          <div style={{marginTop:5,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,color:C.mid}}>otro:</span>
            <input type="number" value={p[umbralLluviaKey]} min={0.5} max={100} step={0.5}
              onChange={e=>set(umbralLluviaKey,parseFloat(e.target.value)||0.5)}
              style={{width:70,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,
                      borderRadius:5,padding:"4px 7px",fontSize:12,fontFamily:"DM Mono,monospace",
                      color:T.usuario.text,fontWeight:700}}/>
            <span style={{fontSize:9,color:C.mid}}>mm/día</span>
          </div>
        </div>
        <Campo label="Viento inoperable desde" value={p[umbralVientoKey]} onChange={v=>set(umbralVientoKey,v)} tipo="usuario" unit="km/h" min={5} max={100} step={5}/>
      </div>
      <div className="g2">
        <Campo tipo="formula" label="% días inhábiles (mes sel.)" value={`${(pInop*100).toFixed(1)}%`}/>
        <Campo tipo="formula" label="Días extra clima" value={`${diasInop.toFixed(1)} días`}/>
      </div>
      <div style={{marginTop:6,height:100}}>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={p[climaKey].map((d,i)=>({mes:d.mes,pct:parseFloat((inopMes[i]*100).toFixed(1))}))} margin={{top:2,right:5,left:0,bottom:2}}>
            <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:8}}/>
            <YAxis tick={{fill:C.muted,fontSize:8}} unit="%"/>
            <Tooltip {...TTip} formatter={v=>[`${v}%`]}/>
            <Bar dataKey="pct" fill={T.stat.border} radius={[2,2,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="warn-note">⚠️ Estimados — ver pestaña Base Clima para editar.</div>
    </div>
  );
}

// ─── SECCIÓN FORMULAS PUERTO (compartida) ──────────────────────────────────
function SeccionFormulas({tipo,e,p,gruas,grampada,movGrampa,horasDia,pctMerma,capacidad}) {
  const esCarga=tipo==="carga";
  return (
    <div className="card">
      <div className="ct">Fórmulas — {esCarga?"Velocidad y Tiempo Carga":"Velocidad y Tiempo Descarga"} <TipoBadge tipo="formula"/></div>
      <table className="cost-table">
        <thead><tr><th>Variable</th><th>Ecuación</th><th colSpan={2}>Resultado</th></tr></thead>
        <tbody>
          {[
            {l:"Vel. ideal",    eq:`${gruas}×${grampada}×${p.cap_densidadArena}×${movGrampa}`,v:`${e.velIdeal_TnMin.toFixed(1)}Tn/min`,hover:e.hoverVel},
            {l:"Vel./hora",     eq:"velMin×60",                                                  v:`${e.velIdeal_TnHr.toFixed(0)}Tn/hr`,   hover:`${e.velIdeal_TnMin.toFixed(1)}×60=${e.velIdeal_TnHr.toFixed(0)}Tn/hr`},
            {l:"T ideal (días)",eq:`${esCarga?capacidad:e.tnEntrada.toFixed(0)}÷vel_hr÷${horasDia}hr/día`, v:`${e.tIdeal_dias.toFixed(1)}días`, hover:e.hoverTIdeal||"—"},
            {l:"Días inop.",    eq:"tIdeal×pInop÷(1−pInop)",                                     v:`${e.diasInop.toFixed(1)}días`,          hover:e.hoverInop},
            {l:"T real",        eq:esCarga?"tIdeal+inop+esperaZ":"tIdeal+inop+esperaBB+esperaZ",v:`${e.tReal_dias.toFixed(1)}días`,        hover:e.hoverTReal},
            esCarga?
              {l:"Merma Carga (Bruta)",eq:`${capacidad}×${(pctMerma*100).toFixed(1)}% costo extra en origen`, v:`${e.mermaTn.toFixed(0)}Tn`, hover:e.hoverMerma}:
              {l:"Merma desc.", eq:`${e.tnEntrada.toFixed(0)}×${(p.des_pctMermaDescarga*100).toFixed(1)}%`,v:`${e.mermaDescarga_Tn.toFixed(0)}Tn`,hover:`${e.tnEntrada.toFixed(0)}×${(p.des_pctMermaDescarga*100).toFixed(1)}%=${e.mermaDescarga_Tn.toFixed(0)}Tn`},
            esCarga?
              {l:"Carga Neta",   eq:"capacidad del barco (zarpa siempre lleno)",                  v:`${e.tnPostCarga.toFixed(0)}Tn`,         hover:`Bruta: ${capacidad}Tn + ${e.mermaTn.toFixed(0)}Tn merma → Neta embarcada: ${e.tnPostCarga.toFixed(0)}Tn`}:
              {l:"Tn entregadas",eq:"tnPostDesc−mermaAcopio",                                     v:`${e.tnEntregadas.toFixed(0)}Tn`,        hover:`${e.tnPostDescarga.toFixed(0)}−${e.mermaAcopio_Tn.toFixed(0)}=${e.tnEntregadas.toFixed(0)}Tn`},
          ].map((r,i)=>(
            <tr key={i}><td style={{fontWeight:600,color:C.navy,fontSize:10}}>{r.l}</td>
              <td className="eq">{r.eq}</td>
              <td colSpan={2}><HoverVal value={r.v} title={r.l} lines={Array.isArray(r.hover)?r.hover:[r.hover]}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TAB REPO: VIAJE A PUERTO DE CARGA ─────────────────────────────────────
function TabRepo({p,set}) {
  const e0=calcEtapaRepo(p);
  const tramos=p.repo_tramos||TRAMOS_REPO_DEFAULT;

  const updateTramo=(idx,field,val)=>{
    const arr=[...tramos];arr[idx]={...arr[idx],[field]:field==="velocidad"?parseFloat(val)||0:val};
    set("repo_tramos",arr);
  };

  // Items fijos editables (igual estructura que agz_items / abb_items)
  const itemsFijos=[
    {key:"barco_limpiezaBodega",   label:"Limpieza de bodega",     nota:"Costo por escala para limpiar bodega antes de cargar arena."},
    {key:"barco_importacionWaiver",label:"Importación / Waiver",   nota:"Gastos de importación temporal del barco y/o waiver regulatorio."},
  ];

  return (
    <div>
      <div className="kpis">
        <KPI label="Días viaje" value={`${e0.diasNav.toFixed(1)}d`}                                                        color={C.navy}/>
        <KPI label="Distancia"  value={`${e0.totalMn?.toFixed(0)||"—"}mn`}                                                 color={C.mid}/>
        <KPI label="Vel. prom." value={`${e0.velProm?.toFixed(1)||"—"}kt`}                                                 color={C.blue}/>
        <KPI label="Combustible"value={`${e0.combTotal.toFixed(1)}T`}                                                      color={C.orange}/>
        <KPI label="Costo total"value={`$${(e0.costoTotal/1000).toFixed(0)}k`}                                             color={C.gold}/>
        <KPI label="USD/Tn"     value={`$${p.cap_capacidadBarco>0?(e0.costoTotal/p.cap_capacidadBarco).toFixed(2):"—"}`}  color={C.green}/>
      </div>

      {/* Tramo — solo velocidad editable */}
      <div className="card">
        <div className="ct">Tramo de Reposicionamiento <TipoBadge tipo="usuario"/></div>
        <p style={{fontSize:10,color:C.mid,marginBottom:10,lineHeight:1.5}}>
          El barco llega en lastre desde su última posición (proxy: Rio Grande do Sul, Brasil).
          Solo la velocidad es editable; la distancia se calcula automáticamente desde los waypoints.
        </p>
        <table className="vel-table">
          <thead><tr><th>Tramo</th><th>Tipo</th><th>Vel (kt)</th><th>Dist (mn)</th><th>Días</th><th>Condición</th></tr></thead>
          <tbody>{tramos.map((t,i)=>{
            const dist=t.distancia||0;
            const dias=dist/t.velocidad/24;
            return (
              <tr key={t.id}>
                <td><input value={t.nombre} onChange={e=>updateTramo(i,"nombre",e.target.value)}
                  style={{background:"transparent",border:"none",width:"100%",fontSize:11,fontFamily:"Montserrat,sans-serif",color:C.navy,fontWeight:600,minWidth:120}}/></td>
                <td><span style={{fontSize:8,background:"#EEF2F7",padding:"2px 6px",borderRadius:4,fontWeight:700,color:C.mid}}>{t.tipo}</span></td>
                <td><input type="number" value={t.velocidad} min={4} max={20} step={0.5}
                  onChange={e=>updateTramo(i,"velocidad",e.target.value)}
                  style={{width:60}}/></td>
                <td><input type="number" value={dist} min={0} step={1}
                  onChange={e=>updateTramo(i,"distancia",parseFloat(e.target.value)||0)}
                  className="tramo-input" style={{width:70}}/></td>
                <td style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.navy,fontWeight:700}}>{dias.toFixed(2)}</td>
                <td style={{fontSize:9,color:C.mid}}>{t.condicion}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      {/* Costos — calculados read-only + fijos editables */}
      <div className="card">
        <div className="ct">Costos Viaje a Puerto de Carga</div>
        <div style={{overflowX:"auto"}}>
          <table className="cost-table" style={{tableLayout:"fixed",width:"100%"}}>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Ecuación / Valor</th>
                <th style={{textAlign:"right"}}>Total USD</th>
                <th style={{textAlign:"right"}}>USD/Tn</th>
              </tr>
            </thead>
            <tbody>
              {/* Filas calculadas — read only */}
              {[
                {label:"Combustible lastre",    eq:`${e0.combTotal.toFixed(1)}T × $${e0.vlsfo}/T`,  total:e0.combCosto,    hover:e0.hoverComb},
                {label:"Time Charter+Trip+Misc", eq:`${e0.diasNav.toFixed(1)}d × $${e0.tc}/d`,      total:e0.fleteCosto,   hover:e0.hoverTC},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={{color:C.mid,fontSize:10}}>{r.label}</td>
                  <td style={{textAlign:"center"}}>
                    <span style={{fontSize:8,background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:4,padding:"1px 6px",fontWeight:700,color:C.green}}>CALC.</span>
                  </td>
                  <td className="eq">{r.eq}</td>
                  <td style={{textAlign:"right"}}>
                    <HoverVal value={`$${r.total.toLocaleString("es-AR",{maximumFractionDigits:0})}`} title={r.label} lines={r.hover}/>
                  </td>
                  <td className="mono" style={{textAlign:"right",color:C.mid,fontSize:10}}>${p.cap_capacidadBarco>0?(r.total/p.cap_capacidadBarco).toFixed(2):"—"}</td>
                </tr>
              ))}

              {/* Filas editables — fijas por escala */}
              {itemsFijos.map(item=>(
                <tr key={item.key}>
                  <td style={{color:C.mid,fontSize:10}}>{item.label}</td>
                  <td style={{textAlign:"center"}}>
                    <span style={{fontSize:8,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,borderRadius:4,padding:"1px 6px",fontWeight:700,color:T.usuario.text}}>FIJO</span>
                  </td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" value={p[item.key]||0} min={0} step={500}
                        onChange={e=>set(item.key, parseFloat(e.target.value)||0)}
                        style={{width:100,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,
                                borderRadius:5,padding:"3px 7px",fontSize:12,fontFamily:"DM Mono,monospace",
                                color:T.usuario.text,fontWeight:700}}/>
                      <span style={{fontSize:9,color:C.mid}}>USD</span>
                      {item.nota && <span style={{fontSize:8,color:C.mid,fontStyle:"italic"}}>{item.nota}</span>}
                    </div>
                  </td>
                  <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.navy}}>
                    ${(p[item.key]||0).toLocaleString("es-AR",{maximumFractionDigits:0})}
                  </td>
                  <td className="mono" style={{textAlign:"right",color:C.mid,fontSize:10}}>${p.cap_capacidadBarco>0?((p[item.key]||0)/p.cap_capacidadBarco).toFixed(2):"—"}</td>
                </tr>
              ))}

              {/* Items extra editables */}
              {(p.repo_itemsExtra||[]).map((it,i)=>(
                <tr key={it.id} style={{opacity:it.activo?1:0.45}}>
                  <td>
                    <input value={it.label} onChange={e=>{
                      const arr=[...(p.repo_itemsExtra||[])];arr[i]={...arr[i],label:e.target.value};set("repo_itemsExtra",arr);
                    }} style={{background:"transparent",border:"none",width:"100%",fontSize:11,fontFamily:"Montserrat,sans-serif",color:C.navy,minWidth:140}}/>
                  </td>
                  <td style={{textAlign:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"center"}}>
                      <input type="checkbox" checked={!!it.activo} onChange={e=>{
                        const arr=[...(p.repo_itemsExtra||[])];arr[i]={...arr[i],activo:e.target.checked};set("repo_itemsExtra",arr);
                      }} style={{cursor:"pointer"}}/>
                      <span style={{fontSize:8,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,borderRadius:4,padding:"1px 6px",fontWeight:700,color:T.usuario.text}}>FIJO</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" value={it.usd} min={0} step={500}
                        onChange={e=>{const arr=[...(p.repo_itemsExtra||[])];arr[i]={...arr[i],usd:parseFloat(e.target.value)||0};set("repo_itemsExtra",arr);}}
                        style={{width:100,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,
                                borderRadius:5,padding:"3px 7px",fontSize:12,fontFamily:"DM Mono,monospace",
                                color:T.usuario.text,fontWeight:700}}/>
                      <span style={{fontSize:9,color:C.mid}}>USD</span>
                      <button onClick={()=>{const arr=(p.repo_itemsExtra||[]).filter((_,j)=>j!==i);set("repo_itemsExtra",arr);}}
                        style={{padding:"1px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:10,cursor:"pointer",fontWeight:700}}>×</button>
                    </div>
                  </td>
                  <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:it.activo?C.navy:C.mid}}>
                    {it.activo?`$${it.usd.toLocaleString("es-AR",{maximumFractionDigits:0})}`:"—"}
                  </td>
                  <td className="mono" style={{textAlign:"right",color:C.mid,fontSize:10}}>
                    {it.activo&&p.cap_capacidadBarco>0?`$${(it.usd/p.cap_capacidadBarco).toFixed(2)}`:"—"}
                  </td>
                </tr>
              ))}

              {/* Total */}
              <tr className="total">
                <td colSpan={2} style={{textAlign:"right"}}>TOTAL</td>
                <td className="eq">Σ viaje a puerto de carga</td>
                <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:800,fontSize:13}}>
                  ${e0.costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}
                </td>
                <td className="mono" style={{textAlign:"right",fontWeight:800}}>${p.cap_capacidadBarco>0?(e0.costoTotal/p.cap_capacidadBarco).toFixed(2):"—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{marginTop:8}}>
          <button className="run" style={{fontSize:10,padding:"5px 12px"}}
            onClick={()=>{
              const nuevo={id:`repo_${Date.now()}`,label:"Nuevo concepto",usd:0,activo:true};
              set("repo_itemsExtra",[...(p.repo_itemsExtra||[]),nuevo]);
            }}>+ Agregar fila</button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E1: CARGA ─────────────────────────────────────────────────────────
function TabCarga({p,set,tnEntregadas}) {
  // Mes más pesimista del clima de Zárate
  const mesWorst = useMemo(()=>{
    let worst=0, worstInop=0;
    for(let i=0;i<12;i++){
      const e=calcEtapa1(p,i);
      if(e.pInop>worstInop){worstInop=e.pInop;worst=i;}
    }
    return worst;
  },[p]);
  const e1=calcEtapa1(p,mesWorst);

  const costRows=[
    {label:"Costo arena",       eq:`$${e1.precioArena}×${p.cap_capacidadBarco.toLocaleString()}Tn`, total:e1.costoArena,  hover:[e1.hoverTotal[0]]},
    {label:"Costo merma",       eq:`$${e1.precioArena}×${e1.mermaTn.toFixed(0)}Tn`,                total:e1.costoMerma,  hover:[e1.hoverTotal[1]]},
    {label:"Opex carga",        eq:`$${p.cap_opexUSDTn}/Tn×${p.cap_capacidadBarco.toLocaleString()}Tn`, total:e1.costoOpex, hover:[e1.hoverTotal[2]]},
    {label:"Combustible puerto",eq:`${e1.tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${e1.vlsfo}`, total:e1.combPuerto, hover:e1.hoverComb},
    {label:"Time Charter+Trip.",eq:`${e1.tReal_dias.toFixed(1)}d×$${e1.tc}/d`,                     total:e1.fleteEtapa,  hover:e1.hoverTC},
    {label:"TOTAL ETAPA 1",     eq:"Σ costos carga",                                               total:e1.costoTotal,  hover:e1.hoverTotal, isTotal:true},
  ];

  return (
    <div>
      <div className="kpis">
        <KPI label="Vel. ideal"   value={`${e1.velIdeal_TnMin.toFixed(1)}Tn/min`} color={T.formula.text}/>
        <KPI label="T. ideal"     value={`${e1.tIdeal_dias.toFixed(1)}d`}          color={T.formula.text}/>
        <KPI label="T. real"      value={`${e1.tReal_dias.toFixed(1)}d`}           color={C.gold}/>
        <KPI label="Inop. clima"  value={`${(e1.pInop*100).toFixed(1)}%`}          color={C.orange}/>
        <KPI label="Merma"        value={`${e1.mermaTn.toFixed(0)}Tn`}             unit={`${(p.cap_pctMerma*100).toFixed(1)}%`} color={C.red}/>
        <KPI label="USD/Tn etapa" value={`$${(e1.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div style={{padding:"6px 10px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,fontSize:10,color:"#64748B",marginBottom:8}}>
        ℹ️ Usando mes más pesimista: <strong>{MESES[mesWorst]}</strong> ({(e1.pInop*100).toFixed(1)}% inop. climática). Editá umbrales en <strong>Base Clima</strong>.
      </div>
      <div className="card">
        <div className="ct">Parámetros Físicos <TipoBadge tipo="usuario"/></div>
        <div style={{padding:"6px 10px",background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:8,fontSize:10,color:"#0369A1",marginBottom:8}}>
          Capacidad: <strong>{p.cap_capacidadBarco.toLocaleString("es-AR")} Tn</strong> — editable en pestaña <strong>Contrato Barco</strong>
        </div>
        <div className="g3">
          <Campo label="Densidad"      value={p.cap_densidadArena}     onChange={v=>set("cap_densidadArena",v)}     tipo="usuario" unit="T/m³"    min={1}    max={2}     step={0.05}/>
          <Campo label="Grampada"      value={p.cap_grampada}          onChange={v=>set("cap_grampada",v)}          tipo="usuario" unit="m³"      min={5}    max={30}/>
          <Campo label="Grúas"         value={p.cap_gruas}             onChange={v=>set("cap_gruas",v)}             tipo="usuario"               min={1}    max={4}/>
          <Campo label="Mov/min"       value={p.cap_movGrampa}         onChange={v=>set("cap_movGrampa",v)}         tipo="usuario" unit="mov/min" min={0.1}  max={2}     step={0.1}/>
          <Campo label="Precio arena"  value={p.cap_precioArenaOrigen} onChange={v=>set("cap_precioArenaOrigen",v)} tipo="usuario" unit="USD/Tn"  min={0}    step={0.5}/>
          <Campo label="Opex carga"    value={p.cap_opexUSDTn}         onChange={v=>set("cap_opexUSDTn",v)}         tipo="usuario" unit="USD/Tn"  min={0}    step={0.5}/>
          <Campo label="Espera Zárate" value={p.cap_esperaDias}        onChange={v=>set("cap_esperaDias",v)}        tipo="usuario" unit="días"    min={0}    max={5}     step={0.25} nota="Puerto propio"/>
        </div>
        <Toggle label="Horas trabajo/día" options={[4,8,12,24]} value={p.cap_horasDia} onChange={v=>set("cap_horasDia",v)} tipo="usuario"/>
        <Campo label="Merma de carga" value={parseFloat((p.cap_pctMerma*100).toFixed(4))} onChange={v=>set("cap_pctMerma",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1} nota="Derrames grampa, vuelo de material"/>
      </div>
      <SeccionInop puerto="zarate" p={p} set={set} mesIdx={mesWorst} tIdeal_dias={e1.tIdeal_dias}
        climaKey="clima_zarate" umbralLluviaKey="cap_inopLluvia" umbralVientoKey="cap_inopViento"/>
      <SeccionFormulas tipo="carga" e={e1} p={p}
        gruas={p.cap_gruas} grampada={p.cap_grampada} movGrampa={p.cap_movGrampa}
        horasDia={p.cap_horasDia} pctMerma={p.cap_pctMerma} capacidad={p.cap_capacidadBarco}/>
      <div className="card">
        <div className="ct">Costos Etapa 1</div>
        <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
      </div>
    </div>
  );
}

// ─── TAB E2: NAVEGACIÓN IDA ────────────────────────────────────────────────
function TabNavegacion({p,set,tnEntregadas}) {
  const e2=calcEtapa2(p);
  const tramos=p.nav_tramos||[];
  const costRows=[
    {label:"Combustible ida",   eq:`${e2.combNavTotal.toFixed(1)}T×$${e2.vlsfo}`,total:e2.combNav,  hover:e2.hoverComb},
    {label:"Time Charter+Trip.",eq:`${e2.diasNav.toFixed(1)}d×$${e2.tc}/d`,      total:e2.fleteNav, hover:e2.hoverTC},
    {label:"TOTAL ETAPA 2",     eq:"Σ costos navegación ida",                    total:e2.costoTotal,hover:e2.hoverTotal,isTotal:true},
  ];
  const updateTramo=(i,field,val)=>{
    const arr=[...tramos];
    arr[i]={...arr[i],[field]:field==="velocidad"||field==="distancia"?parseFloat(val)||0:val};
    set("nav_tramos",arr);
  };
  const agregarTramo=()=>{
    const nuevo={id:`nav_${Date.now()}`,nombre:"Nuevo tramo",tipo:"Costero",velocidad:10,distancia:0,condicion:""};
    set("nav_tramos",[...tramos,nuevo]);
  };
  const eliminarTramo=(i)=>set("nav_tramos",tramos.filter((_,j)=>j!==i));
  return (
    <div>
      <div className="card">
        <div className="ct">Tramos <TipoBadge tipo="usuario"/></div>
        <table className="vel-table">
          <thead><tr><th>Tramo</th><th>Tipo</th><th>Vel (kt)</th><th>Dist (mn)</th><th>Días</th><th style={{width:32}}/></tr></thead>
          <tbody>
            {tramos.map((t,i)=>{
              const dist=t.distancia||0;
              const dias=t.velocidad>0?dist/t.velocidad/24:0;
              return (
                <tr key={t.id}>
                  <td><input value={t.nombre} onChange={e=>updateTramo(i,"nombre",e.target.value)}
                    style={{background:"transparent",border:"none",width:"100%",fontSize:11,fontFamily:"Montserrat,sans-serif",color:C.navy,fontWeight:600,minWidth:120}}/></td>
                  <td><span style={{fontSize:8,background:"#EEF2F7",padding:"2px 6px",borderRadius:4,fontWeight:700,color:C.mid}}>{t.tipo}</span></td>
                  <td><input type="number" value={t.velocidad} min={4} max={20} step={0.5}
                    onChange={e=>updateTramo(i,"velocidad",e.target.value)}
                    style={{width:60}}/></td>
                  <td><input type="number" value={dist} min={0} step={1}
                    onChange={e=>updateTramo(i,"distancia",e.target.value)}
                    className="tramo-input" style={{width:70}}/></td>
                  <td style={{fontFamily:"DM Mono,monospace",fontSize:10,color:C.navy,fontWeight:700}}>{dias.toFixed(2)}</td>
                  <td><button onClick={()=>eliminarTramo(i)}
                    style={{padding:"1px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:11,cursor:"pointer",fontWeight:700}}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(()=>{
          const totalMnLocal = tramos.reduce((a,t)=>a+(t.distancia||0),0);
          const totalDiasLocal = tramos.reduce((a,t)=>t.velocidad>0?a+(t.distancia||0)/t.velocidad/24:a,0);
          return (
            <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
              <button className="run" style={{fontSize:10,padding:"5px 12px"}} onClick={agregarTramo}>+ Agregar tramo</button>
              <span style={{fontSize:10,color:C.mid}}>Total: <strong style={{fontFamily:"DM Mono,monospace",color:C.gold}}>{totalMnLocal.toFixed(1)} mn · {totalDiasLocal.toFixed(1)} días</strong></span>
            </div>
          );
        })()}
      </div>
      <div className="card">
        <div className="ct">Costos Etapa 2 <TipoBadge tipo="formula"/></div>
        <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
        <div style={{marginTop:8,padding:"6px 10px",background:"#EEF2F7",borderRadius:7,fontSize:10,color:C.muted}}>
          Vel. prom. ponderada: <HoverVal value={`${e2.velProm.toFixed(1)}kt`} title="Vel. Promedio Ponderada" lines={[e2.hoverVelProm]}/>
          &nbsp;·&nbsp; Consumo total: <strong style={{fontFamily:"DM Mono,monospace"}}>{e2.combNavTotal.toFixed(1)}T</strong> (interpolado de tabla Contrato Barco)
        </div>
      </div>
    </div>
  );
}

// ─── TAB E3: DESCARGA ──────────────────────────────────────────────────────
function TabDescarga({p,set,tnEntregadas}) {
  const mesWorst = useMemo(()=>{
    const e0=calcEtapaRepo(p); const e2=calcEtapa2(p);
    let worstMes=0, worstInop=0;
    for(let i=0;i<12;i++){
      const e1=calcEtapa1(p,i);
      const cAEq=e1.tnPostCarga>0?(e0.costoTotal+e1.costoTotal+e2.costoTotal)/e1.tnPostCarga:(p.cap_precioArenaOrigen||13.5);
      const e3=calcEtapa3({...p,_costoArenaEq:cAEq},i,e1.tnPostCarga);
      if(e3.pInop>worstInop){worstInop=e3.pInop;worstMes=i;}
    }
    return worstMes;
  },[p]);

  const e0=calcEtapaRepo(p);
  const e1=calcEtapa1(p,mesWorst);
  const e2=calcEtapa2(p);
  const costoArenaEq=e1.tnPostCarga>0?(e0.costoTotal+e1.costoTotal+e2.costoTotal)/e1.tnPostCarga:(p.cap_precioArenaOrigen||13.5);
  const e3=calcEtapa3({...p,_costoArenaEq:costoArenaEq},mesWorst,e1.tnPostCarga);
  const sch=e3.sch;
  const densidad=p.cap_densidadArena||1.45;

  // Tabla de sensibilidad: rango dinámico centrado en los valores actuales
  const centeredRange = (center, count) => {
    if (center === 0) return Array.from({length:count}, (_,i) => i);
    const step = Math.max(1, Math.round(center / Math.floor(count / 2)));
    const mid  = Math.floor(count / 2);
    const vals = Array.from({length:count}, (_,i) => Math.max(0, center + (i - mid) * step));
    // dedup y ordenar
    return [...new Set(vals)].sort((a,b)=>a-b);
  };
  const sensFilas = useMemo(()=> centeredRange(sch.nDir, 9),  [sch.nDir]);
  const sensCols  = useMemo(()=> centeredRange(sch.nCal, 11), [sch.nCal]);

  const sensDatos = useMemo(()=>{
    const tnBase = e1.tnPostCarga;
    const rows = [];
    for(const nd of sensFilas){
      for(const nc of sensCols){
        const pp={...p, des_camDir_cantidad:nd, des_camAco_cantidad:nc};
        const s=calcScheduler(pp, tnBase);
        rows.push({nd, nc,
          dias: parseFloat(s.t_total_dias.toFixed(1)),
          alerta: s.alertas.length>0,
        });
      }
    }
    return rows;
  },[p, e1.tnPostCarga, sensFilas, sensCols]);

  const costoRows=[
    {label:"Opex descarga",           eq:`$${p.des_opexUSDTn}/Tn×${e3.tnEntrada.toFixed(0)}Tn`,                          total:e3.costoOpex,          hover:[`${e3.hoverTotal[0]}`]},
    {label:"Directos → Neuquén",      eq:`${sch.nDir} cam × ${sch.Tn_cam_dir.toFixed(1)}Tn → ${sch.Tn_directos.toFixed(0)}Tn`,  total:e3.costoCamiones, hover:[`$${p.des_costoCamionesDirUSDTn}/Tn × ${sch.Tn_directos.toFixed(0)}Tn`]},
    {label:"Calesitas (ciclo BB)",     eq:`${sch.nCal} cam → ${sch.Tn_calesitas.toFixed(0)}Tn × $${sch.costoCalUSDTn.toFixed(2)}/Tn`, total:e3.costoAcopio, hover:[`dist ${p.des_camAco_distKm}km × 2 × $${p.des_camAco_costoKmTon}/Tn·km + $${p.des_alquilerPredioUSDTn||0}/Tn predio`]},
    {label:"Acopio → Neuquén",        eq:`${e3.tnAcopio.toFixed(0)}Tn × $${(p.des_costoFleteAcopioUSDTn??37.14).toFixed(2)}/Tn`, total:e3.costoFleteAcopio, hover:[e3.hoverTotal[3]]},
    {label:"Combustible puerto",      eq:`${e3.tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${e3.vlsfo}`,         total:e3.combPuerto,         hover:e3.hoverComb},
    {label:"Time Charter+Trip.",      eq:`${e3.tReal_dias.toFixed(1)}d×$${e3.tc}/d`,                                      total:e3.fleteEtapa,         hover:e3.hoverTC},
    {label:"Merma descarga",          eq:`${e3.mermaDescarga_Tn.toFixed(0)}Tn×$${e3.precioArenaEq.toFixed(1)}/Tn eq.`,    total:e3.costoMermaDescarga, hover:[`${e3.mermaDescarga_Tn.toFixed(0)}Tn × $${e3.precioArenaEq.toFixed(2)}`]},
    {label:"Merma acopio",            eq:`${e3.mermaAcopio_Tn.toFixed(0)}Tn×$${e3.precioArenaEq.toFixed(1)}/Tn eq.`,      total:e3.mermaAcopio_Tn*e3.precioArenaEq, hover:[`${e3.mermaAcopio_Tn.toFixed(0)}Tn × $${e3.precioArenaEq.toFixed(2)}`]},
    {label:"TOTAL ETAPA 3",           eq:"Σ costos descarga",                                                              total:e3.costoTotal,         hover:e3.hoverTotal, isTotal:true},
  ];

  return (
    <div>
      <EspejoCheck p={p}/>

      {/* ── KPIs ── */}
      <div className="kpis">
        <KPI label="Días descarga" value={`${sch.t_total_dias.toFixed(1)}d`}          unit="scheduler puro"   color={C.navy}/>
        <KPI label="Días real"     value={`${e3.tReal_dias.toFixed(1)}d`}              unit="+inop+espera"     color={C.gold}/>
        <KPI label="Inop. clima"   value={`${(e3.pInop*100).toFixed(1)}%`}            unit={`mes ${MESES[mesWorst]}`} color={C.orange}/>
        <KPI label="Throughput"    value={`${(sch.tp_fase1||sch.tp_fase2||0).toFixed(0)} Tn/hr`} unit="fase 1" color={C.blue}/>
        <KPI label="Tn entregadas" value={e3.tnEntregadas.toFixed(0)}                  color={C.green}/>
        <KPI label="USD/Tn etapa"  value={`$${tnEntregadas>0?(e3.costoTotal/tnEntregadas).toFixed(1):"—"}`} color={C.gold}/>
      </div>

      <div style={{padding:"6px 10px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,fontSize:10,color:"#64748B",marginBottom:8}}>
        ℹ️ Mes más pesimista: <strong>{MESES[mesWorst]}</strong> ({(e3.pInop*100).toFixed(1)}% inop). Editá umbrales en <strong>Base Clima</strong>.
      </div>

      {/* ── ALERTAS ── */}
      {sch.alertas.length>0 && (
        <div style={{marginBottom:8}}>
          {sch.alertas.map((a,i)=>(
            <div key={i} style={{padding:"7px 12px",background:"#FEF3C7",border:`1px solid ${C.warnBorder}`,borderRadius:8,fontSize:10,color:C.orange,marginBottom:4}}>{a}</div>
          ))}
        </div>
      )}

      {/* ── GRÚA Y TOLVA ── */}
      <div className="card">
        <div className="ct">🏗️ Grúa y Tolva <TipoBadge tipo="usuario"/></div>
        <div className="g3">
          <Campo label="Número de grúas/tolvas" value={p.des_gruas} onChange={v=>set("des_gruas",Math.max(1,Math.round(v)))} tipo="usuario" unit="unidades" min={1} max={6} step={1}
            nota="Cada grúa alimenta su propia tolva en paralelo"/>
          <Campo label="Grampada" value={p.des_grampada} onChange={v=>set("des_grampada",v)} tipo="usuario" unit="m³"
            nota={`Vel grúa: ${(p.des_grampada*densidad*(p.des_movGrampa||0.5)).toFixed(2)} Tn/min`}/>
          <Campo label="Movimientos/min" value={p.des_movGrampa} onChange={v=>set("des_movGrampa",v)} tipo="usuario" unit="mov/min" min={0.1} max={3} step={0.1}/>
        </div>
        <div className="g3">
          <Campo label="Volumen tolva" value={p.des_tolva_vol_m3||60} onChange={v=>set("des_tolva_vol_m3",v)} tipo="usuario" unit="m³"
            nota={`${((p.des_tolva_vol_m3||60)*densidad).toFixed(1)} Tn capacidad`}/>
          <Campo label="T. posicionamiento" value={p.des_t_posicion_min||3} onChange={v=>set("des_t_posicion_min",v)} tipo="usuario" unit="min" min={0.5} max={20} step={0.5} nota="Camión se ubica bajo tolva"/>
          <Campo label="T. caída (tolva→camión)" value={p.des_t_caida_min||4} onChange={v=>set("des_t_caida_min",v)} tipo="usuario" unit="min" min={0.5} max={15} step={0.5} nota="Apertura compuerta, arena cae"/>
        </div>
        <div className="g3">
          <Campo label="T. cierre compuerta" value={p.des_t_cierre_min||1} onChange={v=>set("des_t_cierre_min",v)} tipo="usuario" unit="min" min={0.1} max={5} step={0.1} nota="Compuerta cierra, camión arranca"/>
        </div>
        {/* Resumen ciclo tolva */}
        <div style={{marginTop:8,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {[
            {l:"Vel. grúa",   v:`${sch.vel_grua_TnMin.toFixed(2)} Tn/min`, eq:`${p.des_grampada}m³ × ${densidad} × ${p.des_movGrampa} mov/min`},
            {l:"Llenar tolva",v:`${sch.t_llenar.toFixed(1)} min`,           eq:`${((p.des_tolva_vol_m3||60)*densidad).toFixed(1)} Tn ÷ ${sch.vel_grua_TnMin.toFixed(2)} Tn/min`},
            {l:"Ciclo tolva", v:`${sch.t_ciclo_tolva.toFixed(1)} min`,      eq:`pos ${p.des_t_posicion_min||3} + caída ${p.des_t_caida_min||4} + cierre ${p.des_t_cierre_min||1}`},
            {l:"Tp máx/tolva",v:`${(sch.tp_grua_max_total/(p.des_gruas||2)).toFixed(0)} Tn/hr`, eq:`${sch.vel_grua_TnHr.toFixed(0)} Tn/hr (techo grúa)`},
          ].map(({l,v,eq})=>(
            <div key={l} style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:7,padding:"7px 10px"}}>
              <div style={{fontSize:8,color:"#0369A1",textTransform:"uppercase",letterSpacing:.5,fontWeight:700,marginBottom:3}}>{l}</div>
              <div style={{fontSize:13,fontWeight:800,color:C.navy,fontFamily:"DM Mono,monospace"}}>{v}</div>
              <div style={{fontSize:8,color:"#64748B",marginTop:2,fontFamily:"DM Mono,monospace"}}>{eq}</div>
            </div>
          ))}
        </div>
        {sch.tolva_rebosa && (
          <div style={{marginTop:8,padding:"6px 10px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:7,fontSize:10,color:C.red}}>
            ⚠️ El posicionamiento ({p.des_t_posicion_min||3}min) llenaría la tolva antes de que el camión esté listo. Reducí t_posicionamiento o aumentá el volumen de la tolva.
          </div>
        )}
      </div>

      {/* ── CAMIONES ── */}
      <div className="g2">
        {/* Directos */}
        <div className="card" style={{borderTop:`3px solid ${C.green}`}}>
          <div className="ct" style={{color:C.green}}>🚛 Directos — Neuquén/Añelo</div>
          <p style={{fontSize:10,color:C.mid,marginBottom:10,lineHeight:1.5}}>
            Prioridad absoluta. Cargan y no vuelven. Se citan escalonados cada <strong style={{fontFamily:"DM Mono,monospace"}}>{sch.t_ciclo_tolva.toFixed(1)} min</strong> por tolva.
          </p>
          <div className="g2">
            <Campo label="Cantidad total" value={p.des_camDir_cantidad||0} onChange={v=>set("des_camDir_cantidad",Math.max(0,Math.round(v)))} tipo="usuario" unit="camiones" min={0} max={200} step={1}/>
            <Campo label="Volumen/camión" value={p.des_camDir_volM3||30} onChange={v=>set("des_camDir_volM3",v)} tipo="usuario" unit="m³" min={5} max={80} step={1}
              nota={`${((p.des_camDir_volM3||30)*densidad).toFixed(1)} Tn/cam`}/>
          </div>
          <Campo label="Tarifa flete" value={p.des_costoCamionesDirUSDTn||0} onChange={v=>set("des_costoCamionesDirUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5} nota="BB → Neuquén/Añelo (sin retorno)"/>
          <div style={{marginTop:8,padding:"8px 12px",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:8}}>
            <div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Fase 1 — solo directos</div>
            <div style={{fontSize:15,fontWeight:800,color:C.green,fontFamily:"DM Mono,monospace"}}>{sch.Tn_directos.toFixed(0)} Tn · {sch.t_fase1_hrs.toFixed(1)} hrs</div>
            <div style={{fontSize:9,color:C.mid,marginTop:2}}>{sch.nDir} cam × {sch.Tn_cam_dir.toFixed(1)} Tn/cam · intervalo {sch.t_ciclo_tolva.toFixed(1)} min/tolva</div>
          </div>
        </div>

        {/* Calesitas */}
        <div className="card" style={{borderTop:`3px solid ${C.gold}`}}>
          <div className="ct" style={{color:C.gold}}>🔄 Calesitas — Depósito BB</div>

          {/* Explicación lógica matemática */}
          <div style={{background:"#FAFAF7",border:"1px solid #E5E0C8",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:10,color:"#4B4530",lineHeight:1.7}}>
            <div style={{fontWeight:700,marginBottom:6,color:C.gold,textTransform:"uppercase",letterSpacing:.5,fontSize:9}}>¿Cómo operan los dos pools en paralelo?</div>
            <div>Ambos pools (<strong>directos + calesitas</strong>) cargan simultáneamente desde el minuto 0. Los directos tienen prioridad — la tolva los atiende primero.</div>
            <div style={{marginTop:6,fontWeight:700}}>Ciclo de cada calesita:</div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,marginTop:4,padding:"4px 8px",background:"rgba(0,0,0,.04)",borderRadius:5}}>
              {sch.t_ciclo_tolva.toFixed(1)} min (pos+carga+cierre)
              + {sch.t_viaje.toFixed(1)} min (ida {p.des_camAco_distKm||15}km)
              + {p.des_tDescargaAcoMin||10} min (descarga dep.)
              + {sch.t_viaje.toFixed(1)} min (vuelta)
              = <strong>{sch.t_ciclo_cal.toFixed(1)} min</strong>
            </div>
            {sch.Tn_calesitas > 0 ? (
              <>
                <div style={{marginTop:6}}>
                  Para que <em>ninguna tolva espere en fase 2</em>, se necesita al menos{' '}
                  <strong style={{fontFamily:"DM Mono,monospace"}}>⌈{sch.t_ciclo_cal.toFixed(1)} ÷ {sch.t_ciclo_tolva.toFixed(1)}⌉ = {sch.n_cal_min_por_tolva}</strong> calesitas por tolva.
                  Con <strong>{p.des_gruas||2} tolvas</strong> → mínimo:{' '}
                  <strong style={{fontFamily:"DM Mono,monospace",color:C.gold}}>{sch.n_cal_min_por_tolva} × {p.des_gruas||2} = {sch.n_cal_min_total}</strong>
                </div>
                {sch.nCal >= sch.n_cal_min_total ? (
                  <div style={{marginTop:6,color:C.green,fontWeight:700}}>✓ Flujo continuo garantizado en fase 2.</div>
                ) : (
                  <div style={{marginTop:6,color:C.red,fontWeight:700}}>
                    ⚠️ Con {sch.nCal} calesitas la tolva espera en fase 2 — throughput reducido.
                  </div>
                )}
              </>
            ) : (
              <div style={{marginTop:6,color:C.green,fontWeight:700}}>
                ✓ Los directos cubren todas las Tn — no se necesitan calesitas para completar la descarga.
              </div>
            )}
          </div>

          <div className="g2">
            <Campo label="Cantidad total" value={p.des_camAco_cantidad||0} onChange={v=>set("des_camAco_cantidad",Math.max(0,Math.round(v)))} tipo="usuario" unit="camiones" min={0} max={50} step={1}/>
            <Campo label="Volumen/camión" value={p.des_camAco_volM3||30} onChange={v=>set("des_camAco_volM3",v)} tipo="usuario" unit="m³" min={5} max={80} step={1}
              nota={`${((p.des_camAco_volM3||30)*densidad).toFixed(1)} Tn/cam`}/>
          </div>
          <div className="g2">
            <Campo label="Dist. tolva→depósito" value={p.des_camAco_distKm||15} onChange={v=>set("des_camAco_distKm",v)} tipo="usuario" unit="km" min={1} max={100} step={1} nota="Solo ida"/>
            <Campo label="Velocidad" value={p.des_camAco_velKmh||60} onChange={v=>set("des_camAco_velKmh",v)} tipo="usuario" unit="km/h" min={10} max={120} step={5}/>
          </div>
          <div className="g2">
            <Campo label="T. descarga en depósito" value={p.des_tDescargaAcoMin||10} onChange={v=>set("des_tDescargaAcoMin",v)} tipo="usuario" unit="min" min={2} max={60} step={1}/>
            <Campo label="Alquiler predio" value={p.des_alquilerPredioUSDTn||0} onChange={v=>set("des_alquilerPredioUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.1}/>
          </div>
          <Campo label="Costo transporte" value={p.des_camAco_costoUSDTn != null ? p.des_camAco_costoUSDTn : parseFloat((((p.des_camAco_costoKmTon||0.08)*(p.des_camAco_distKm||15)*2)).toFixed(2))}
            onChange={v=>{
              set("des_camAco_costoUSDTn", v);
              // también actualizamos costoKmTon para compatibilidad con motor
              const dist=(p.des_camAco_distKm||15);
              set("des_camAco_costoKmTon", dist>0 ? v/(dist*2) : 0.08);
            }}
            tipo="usuario" unit="USD/Tn" min={0} step={0.5}
            nota={`Flete ciclo local: tolva → depósito → tolva`}/>
          <Campo label="Flete acopio → Neuquén" value={p.des_costoFleteAcopioUSDTn ?? 37.14}
            onChange={v=>set("des_costoFleteAcopioUSDTn",v)}
            tipo="usuario" unit="USD/Tn" min={0} step={0.5}
            nota={`2ª etapa: depósito BB → Neuquén/Añelo · aplica a ${(e3.tnAcopio||0).toFixed(0)} Tn acopiadas`}/>
          <div style={{marginTop:8,padding:"8px 12px",background:"#FFFBEB",border:`1px solid ${C.warnBorder}`,borderRadius:8}}>
            <div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Fase 2 — solo calesitas</div>
            <div style={{fontSize:15,fontWeight:800,color:C.orange,fontFamily:"DM Mono,monospace"}}>{sch.Tn_calesitas.toFixed(0)} Tn · {sch.t_fase2_hrs.toFixed(1)} hrs</div>
            <div style={{fontSize:9,color:C.mid,marginTop:2}}>
              Ciclo cam: {sch.t_ciclo_cal.toFixed(1)} min · mín. {sch.n_cal_min_por_tolva*(p.des_gruas||2)} cam para flujo continuo
              {sch.nCal < sch.n_cal_min_por_tolva*(p.des_gruas||2) && sch.nCal>0 &&
                <span style={{color:C.red,fontWeight:700}}> ⚠️ faltan {sch.n_cal_min_por_tolva*(p.des_gruas||2)-sch.nCal}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── RESUMEN DE FASES ── */}
      <div className="card" style={{borderTop:`3px solid ${C.navy}`}}>
        <div className="ct">📊 Plan de Descarga</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          {[
            {l:"Throughput fase 1", v:`${sch.tp_fase1.toFixed(0)} Tn/hr`, sub:`directos + calesitas en paralelo`, c:C.green},
            {l:"Throughput fase 2", v:`${sch.tp_fase2.toFixed(0)} Tn/hr`, sub:`solo calesitas (directos agotados)`, c:C.gold},
            {l:"Techo grúas",       v:`${sch.tp_grua_max_total.toFixed(0)} Tn/hr`, sub:`${p.des_gruas||2} grúas × ${sch.vel_grua_TnHr.toFixed(0)} Tn/hr`, c:C.blue},
          ].map(({l,v,sub,c})=>(
            <div key={l} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,fontWeight:600,marginBottom:4}}>{l}</div>
              <div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"ui-monospace,monospace"}}>{v}</div>
              <div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Barra fases */}
        <div style={{marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:700,color:C.green}}>Fase 1 — Directos · {sch.Tn_directos.toFixed(0)} Tn · {sch.t_fase1_hrs.toFixed(1)} hrs</span>
            <span style={{fontSize:10,fontWeight:700,color:C.gold}}>Fase 2 — Calesitas · {sch.Tn_calesitas.toFixed(0)} Tn · {sch.t_fase2_hrs.toFixed(1)} hrs</span>
          </div>
          <div style={{height:20,borderRadius:6,overflow:"hidden",display:"flex",border:`1px solid ${C.border}`}}>
            {sch.t_total_hrs > 0 && <>
              <div style={{width:`${(sch.t_fase1_hrs/sch.t_total_hrs)*100}%`,background:C.green,display:"flex",alignItems:"center",justifyContent:"center",transition:"width .3s"}}>
                {sch.t_fase1_hrs/sch.t_total_hrs>0.15 && <span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{sch.t_fase1_hrs.toFixed(1)}h</span>}
              </div>
              <div style={{flex:1,background:C.gold,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {sch.t_fase2_hrs/sch.t_total_hrs>0.15 && <span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{sch.t_fase2_hrs.toFixed(1)}h</span>}
              </div>
            </>}
          </div>
        </div>
        <div style={{fontSize:10,color:C.mid,textAlign:"center"}}>
          Tiempo total scheduler: <strong style={{fontFamily:"DM Mono,monospace"}}>{sch.t_total_dias.toFixed(2)} días</strong>
          &nbsp;·&nbsp; Con inop + espera: <strong style={{fontFamily:"DM Mono,monospace",color:C.gold}}>{e3.tReal_dias.toFixed(1)} días</strong>
        </div>
      </div>

      {/* ── TABLA SENSIBILIDAD ── */}
      <div className="card">
        <div className="ct">🔍 Sensibilidad — Días de descarga por combinación de camiones</div>
        <div style={{padding:"8px 12px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,marginBottom:10,fontSize:10,color:"#475569",lineHeight:1.7}}>
          <strong>Cómo leer esta tabla:</strong> cada celda muestra los días totales de descarga para una combinación de camiones directos (filas 🚛) y calesitas (columnas 🔄).
          <br/>
          <span style={{color:C.green,fontWeight:700}}>Verde</span> = flujo continuo garantizado (hay calesitas suficientes para que las tolvas nunca esperen).
          <span style={{color:C.red,fontWeight:700}}> Rojo</span> = las tolvas tendrán tiempo muerto — throughput reducido.
          La celda <span style={{color:C.gold,fontWeight:700}}>amarilla</span> es tu configuración actual.
          <br/>
          <em>Nota: al agregar más directos los días bajan rápido (fase 1 más larga); al agregar más calesitas los días bajan más suavemente (mejora fase 2).</em>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",fontSize:10,whiteSpace:"nowrap"}}>
            <thead>
              <tr>
                <th style={{padding:"4px 8px",background:C.navy,color:"rgba(255,255,255,.6)",fontSize:8,fontWeight:700,textAlign:"left",position:"sticky",left:0}}>
                  Dir ↓ Cal →
                </th>
                {sensCols.map(nc=>(
                  <th key={nc} style={{padding:"4px 8px",background:nc===sch.nCal?C.gold:C.navy,color:"rgba(255,255,255,.8)",fontSize:8,fontWeight:700,textAlign:"center",minWidth:44}}>
                    {nc}🔄
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensFilas.map(nd=>(
                <tr key={nd}>
                  <td style={{padding:"4px 8px",background:nd===sch.nDir?C.gold:"#EEF2F7",fontWeight:700,fontSize:9,color:nd===sch.nDir?"#fff":C.navy,position:"sticky",left:0}}>
                    {nd}🚛
                  </td>
                  {sensCols.map(nc=>{
                    const row=sensDatos.find(r=>r.nd===nd&&r.nc===nc);
                    const isCurrent=nd===sch.nDir&&nc===sch.nCal;
                    const isGood=row&&!row.alerta;
                    const bg=isCurrent?"#FFFBEB":isGood?"#F0FDF4":row?"#FEF2F2":"#F9FAFB";
                    const co=isCurrent?C.gold:isGood?C.green:C.red;
                    return (
                      <td key={nc} style={{padding:"4px 8px",textAlign:"center",background:bg,
                        border:isCurrent?`2px solid ${C.gold}`:"1px solid #EEF2F7",fontFamily:"DM Mono,monospace",fontWeight:isCurrent?800:600,color:co}}>
                        {row ? (row.dias >= 500 ? "—" : `${row.dias}d`) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PARÁMETROS FÍSICOS DESCARGA ── */}
      <div className="card">
        <div className="ct">Parámetros Operativos <TipoBadge tipo="usuario"/></div>
        <div className="g2">
          <Campo label="Opex descarga" value={p.des_opexUSDTn} onChange={v=>set("des_opexUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
        </div>
        <Toggle label="Horas trabajo/día" options={[4,8,12,14,24]} value={p.des_horasDia} onChange={v=>set("des_horasDia",v)} tipo="usuario"/>
        <div className="g2">
          <Campo label="Merma descarga" value={parseFloat((p.des_pctMermaDescarga*100).toFixed(4))} onChange={v=>set("des_pctMermaDescarga",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1}/>
          <Campo label="Merma acopio"   value={parseFloat((p.des_pctMermaAcopio*100).toFixed(4))}   onChange={v=>set("des_pctMermaAcopio",v/100)}   tipo="usuario" unit="%" min={0} max={10} step={0.1}/>
        </div>
      </div>

      {/* ── ESPERA BB ── */}
      <div className="card">
        <div className="ct">Espera BB por Mes (días) <TipoBadge tipo="estadistico"/> <FuenteLink fuente={FUENTES.esperaBB}/></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
          {MESES.map((m,i)=>(
            <div key={m}>
              <div style={{fontSize:7,color:T.stat.label,textAlign:"center",marginBottom:2,fontWeight:700}}>{m}</div>
              <input type="number" value={p.des_esperaBBMes[i]} step={0.1} min={0} max={15}
                onChange={e=>{const arr=[...p.des_esperaBBMes];arr[i]=parseFloat(e.target.value)||0;set("des_esperaBBMes",arr);}}
                style={{width:"100%",background:T.stat.bg,border:`1px solid ${T.stat.border}`,borderRadius:4,padding:"3px 3px",color:T.stat.text,fontSize:10,textAlign:"center",fontFamily:"DM Mono,monospace"}}/>
            </div>
          ))}
        </div>
      </div>

      <SeccionInop puerto="bb" p={p} set={set} mesIdx={mesWorst} tIdeal_dias={e3.tIdeal_dias}
        climaKey="clima_bb" umbralLluviaKey="des_inopLluvia" umbralVientoKey="des_inopViento"/>
      <SeccionFormulas tipo="descarga" e={e3} p={p}
        gruas={p.des_gruas} grampada={p.des_grampada} movGrampa={p.des_movGrampa}
        horasDia={p.des_horasDia} pctMerma={p.des_pctMermaDescarga} capacidad={p.cap_capacidadBarco}/>
      <div className="card">
        <div className="ct">Costos Etapa 3</div>
        <CostTable rows={costoRows} tnEntregadas={tnEntregadas}/>
      </div>
    </div>
  );
}


// ─── TAB E4: VUELTA EN LASTRE ──────────────────────────────────────────────
function TabVuelta({p,set,tnEntregadas}) {
  const e4=calcEtapa4(p);
  const costRows=[
    {label:"Combustible lastre",eq:`${e4.combLastreTotal.toFixed(1)}T×$${e4.vlsfo}`,total:e4.combLastre,hover:e4.hoverComb},
    {label:"Time Charter+Trip.",eq:`${e4.diasNav.toFixed(1)}d×$${e4.tc}/d`,          total:e4.fleteNav,  hover:e4.hoverTC},
    {label:"TOTAL ETAPA 4",     eq:"Σ costos vuelta en lastre",                      total:e4.costoTotal,hover:e4.hoverTotal,isTotal:true},
  ];
  return (
    <div>
      <VLSFOWidget p={p} set={set}/>
      <div className="kpis">
        <KPI label="Vel. promedio" value={`${e4.velProm.toFixed(1)}kt`} color={T.formula.text}/>
        <KPI label="Días vuelta" value={`${e4.diasNav.toFixed(1)}d`} color={T.formula.text}/>
        <KPI label="Combustible" value={`${e4.combLastreTotal.toFixed(1)}T`} color={C.orange}/>
        <KPI label="USD/Tn etapa" value={`$${(e4.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div className="card">
        <div className="ct">Ruta Vuelta — Sea White → Zárate (velocidad y consumo editables)</div>
        <MapaNavegacion tramos={p.vta_tramos} onUpdate={arr=>set("vta_tramos",arr)} titulo="VUELTA EN LASTRE"/>
      </div>
      <div className="card">
        <div className="ct">Costos Etapa 4 <TipoBadge tipo="formula"/></div>
        <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
        <div style={{marginTop:8,padding:"8px 10px",background:C.warn,border:`1px solid ${C.warnBorder}`,borderRadius:8}}>
          <div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase"}}>Ahorro combustible vs. ida cargado</div>
          <div style={{fontSize:13,fontWeight:800,color:C.orange,fontFamily:"DM Mono,monospace",marginTop:2}}>
            ${(calcEtapa2(p).combNav-e4.combLastre).toFixed(0)} USD
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB MC: MONTE CARLO ───────────────────────────────────────────────────
function TabMC({p,set,resultado,setResultado}) {
  const [n,setN]=useState(5000);
  const [running,setR]=useState(false);
  const [savingMC,setSavingMC]=useState(false);
  const [nomMC,setNomMC]=useState("");
  const [msgMC,setMsgMC]=useState("");
  const det=calcTotal(p,5);
  const res=resultado;

  // mc_vars vive en p — editamos a través de set("mc_vars", ...)
  const mcVars = p.mc_vars || DEFAULT_PARAMS.mc_vars;
  const vlsfoStats = calcVLSFOStats(p.vlsfo_historico);

  const updateVar=(id,field,val)=>{
    const arr=mcVars.map(v=>v.id===id?{...v,[field]:val}:v);
    set("mc_vars",arr);
  };

  const run=useCallback(()=>{
    setR(true);
    setTimeout(()=>{setResultado(runMonteCarlo(p,n));setR(false);},60);
  },[p,n,setResultado]);

  const guardarMC=async()=>{
    if(!res){setMsgMC("Corré la simulación primero");return;}
    if(!nomMC.trim()){setMsgMC("Ingresá un nombre");return;}
    setSavingMC(true);
    const{error}=await supabase.from("corridas_montecarlo").insert({
      escenario_nombre:nomMC.trim(),n_simulaciones:res.n,mes_analizado:null,
      p10:res.p10,p25:res.p25,p50:res.p50,p75:res.p75,p90:res.p90,
      mean_val:res.mean,std_val:res.std,
      spread:parseFloat((res.p90-res.p10).toFixed(1)),
      vlsfo_escenario:p.nav_escenarioVLSFO,
      vlsfo_precio:getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico),
      params:p,
    });
    if(error)setMsgMC("Error: "+error.message);
    else{setMsgMC("✓ Guardada");setNomMC("");}
    setSavingMC(false);setTimeout(()=>setMsgMC(""),3000);
  };

  const pBadges=res?[
    {l:"P10 — Optimista",   v:res.p10,bg:"#F0FDF4",bc:"#86EFAC",c:C.p10,   d:"Solo 10% de escenarios tiene costo menor."},
    {l:"P25",               v:res.p25,bg:"#F0FDF4",bc:"#86EFAC",c:"#1a7a3a",d:"Cuartil optimista."},
    {l:"P50 — Más probable",v:res.p50,bg:"#FFFBEB",bc:"#D4B84A",c:C.p50,   d:"Mediana — caso más representativo."},
    {l:"P75",               v:res.p75,bg:"#FEF3C7",bc:"#D4B84A",c:C.orange, d:"Cuartil pesimista."},
    {l:"P90 — Pesimista",   v:res.p90,bg:"#FEE2E2",bc:"#FECACA",c:C.p90,   d:"Solo 10% de escenarios tiene costo mayor."},
  ]:[];

  // Rango ±2σ para mostrar en la tabla
  const rango=(v)=>{
    const s = v.id==="vlsfo"
      ? (v.sigma!==null&&v.sigma!==undefined ? v.sigma : vlsfoStats.sigma12m)
      : (v.sigma??0);
    if(!v.activa || s===0) return "Fijo";
    const base=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
    switch(v.id){
      case "vlsfo":   return `$${(base-2*s).toFixed(0)} – $${(base+2*s).toFixed(0)}`;
      case "tc":      return `$${(p.barco_timeCharter-2*s).toFixed(0)} – $${(p.barco_timeCharter+2*s).toFixed(0)}`;
      case "velFact": return `${((1-2*s)*100).toFixed(0)}% – ${((1+2*s)*100).toFixed(0)}%`;
      case "espBB": {const avg=p.des_esperaBBMes.reduce((a,b)=>a+b,0)/12;return `${Math.max(0,avg-2*s).toFixed(1)} – ${(avg+2*s).toFixed(1)} d`;}
      case "espZ":    return `${Math.max(0,p.des_esperaZarateDias-2*s).toFixed(1)} – ${(p.des_esperaZarateDias+2*s).toFixed(1)} d`;
      case "mCarga":  return `${Math.max(0,(p.cap_pctMerma-2*s)*100).toFixed(1)}% – ${((p.cap_pctMerma+2*s)*100).toFixed(1)}%`;
      case "mDesc":   return `${Math.max(0,(p.des_pctMermaDescarga-2*s)*100).toFixed(1)}% – ${((p.des_pctMermaDescarga+2*s)*100).toFixed(1)}%`;
      case "mAcopio": return `${Math.max(0,(p.des_pctMermaAcopio-2*s)*100).toFixed(1)}% – ${((p.des_pctMermaAcopio+2*s)*100).toFixed(1)}%`;
      case "inop":    return `±${(s*100).toFixed(0)}% del pBase calculado`;
      default: return "—";
    }
  };

  const sigmaLabel=(v)=>{
    if(v.id==="vlsfo") return v.sigma!==null&&v.sigma!==undefined ? `$${v.sigma}` : `$${vlsfoStats.sigma12m.toFixed(0)} (auto)`;
    if(!v.sigma&&v.sigma!==0) return "—";
    switch(v.id){
      case "tc":      return `$${v.sigma}`;
      case "velFact": return `${(v.sigma*100).toFixed(0)}%`;
      case "inop":    return `${(v.sigma*100).toFixed(0)}%`;
      default: return v.unit==="frac." ? `${(v.sigma*100).toFixed(1)}%` : `${v.sigma}`;
    }
  };

  return (
    <div>
      <div className="card" style={{background:"#F0F9FF",borderColor:"#BAE6FD"}}>
        <div className="ct" style={{color:"#0369A1"}}>¿Qué es el Monte Carlo?</div>
        <p style={{fontSize:11,color:"#0369A1",lineHeight:1.7}}>
          Corre el modelo <strong>N veces</strong> sorteando valores aleatorios para cada variable activa según distribuciones Normal centradas en el valor base.
          El mes se sortea al azar en cada iteración — el resultado representa el <strong>costo anualizado esperado</strong>, ponderando todos los meses según su clima y estacionalidad.
          Las variables marcadas <strong>Fija</strong> se toman sin ruido.
        </p>
      </div>

      {/* ── TABLA DE VARIABLES ── */}
      <div className="card">
        <div className="ct">Variables Estocásticas <TipoBadge tipo="usuario"/></div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead>
              <tr style={{background:C.navy}}>
                {["Variable","Valor base","σ (editable)","Rango ~95% (±2σ)","Activa","Nota"].map(h=>(
                  <th key={h} style={{padding:"6px 9px",color:"rgba(255,255,255,.65)",fontSize:8,fontWeight:700,
                    textTransform:"uppercase",letterSpacing:.5,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mcVars.map((v,i)=>{
                const esFija=!v.activa;
                const sigmaAuto=v.id==="vlsfo"&&(v.sigma===null||v.sigma===undefined);
                return (
                  <tr key={v.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#F9FAFB",opacity:esFija?0.55:1}}>
                    {/* Variable */}
                    <td style={{padding:"7px 9px",fontWeight:700,color:C.navy,whiteSpace:"nowrap"}}>{v.label}</td>
                    {/* Valor base */}
                    <td style={{padding:"7px 9px",fontFamily:"DM Mono,monospace",fontSize:10,color:C.mid,whiteSpace:"nowrap"}}>
                      {v.id==="vlsfo" && `$${getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico)}/T`}
                      {v.id==="tc"      && `$${p.barco_timeCharter.toLocaleString()}/d`}
                      {v.id==="velFact" && "100%"}
                      {v.id==="espBB"   && `${(p.des_esperaBBMes.reduce((a,b)=>a+b,0)/12).toFixed(1)}d prom.`}
                      {v.id==="espZ"    && `${p.des_esperaZarateDias}d`}
                      {v.id==="mCarga"  && `${(p.cap_pctMerma*100).toFixed(1)}%`}
                      {v.id==="mDesc"   && `${(p.des_pctMermaDescarga*100).toFixed(1)}%`}
                      {v.id==="mAcopio" && `${(p.des_pctMermaAcopio*100).toFixed(1)}%`}
                      {v.id==="inop"    && "pBase clima"}
                    </td>
                    {/* Sigma editable */}
                    <td style={{padding:"5px 9px"}}>
                      {sigmaAuto ? (
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{fontSize:10,fontFamily:"DM Mono,monospace",color:T.stat.text,
                            background:T.stat.bg,border:`1px solid ${T.stat.border}`,borderRadius:4,padding:"2px 7px"}}>
                            ${vlsfoStats.sigma12m.toFixed(0)} auto
                          </span>
                          <button onClick={()=>updateVar(v.id,"sigma",vlsfoStats.sigma12m)}
                            style={{fontSize:8,padding:"2px 6px",borderRadius:4,border:`1px solid ${C.border}`,
                            background:"#fff",color:C.mid,cursor:"pointer"}}>fijar</button>
                        </div>
                      ):(
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <input type="number"
                            value={v.id==="velFact"||v.id==="inop" ? (v.sigma??0)*100 : (v.sigma??0)}
                            min={0} step={v.id==="vlsfo"?5:v.id==="tc"?50:v.id==="velFact"||v.id==="inop"?1:0.1}
                            onChange={e=>{
                              const val=parseFloat(e.target.value)||0;
                              const stored=(v.id==="velFact"||v.id==="inop")?val/100:val;
                              updateVar(v.id,"sigma",stored);
                            }}
                            disabled={esFija}
                            style={{width:65,background:esFija?"#F3F4F6":T.usuario.bg,
                              border:`1px solid ${esFija?C.border:T.usuario.border}`,
                              borderRadius:5,padding:"3px 5px",fontSize:11,fontFamily:"DM Mono,monospace",
                              color:esFija?C.mid:T.usuario.text,fontWeight:700,textAlign:"center"}}/>
                          <span style={{fontSize:9,color:C.mid}}>{v.id==="velFact"||v.id==="inop"?"%":v.unit==="frac."?"":v.unit}</span>
                          {v.id==="vlsfo"&&<button onClick={()=>updateVar(v.id,"sigma",null)}
                            style={{fontSize:8,padding:"2px 6px",borderRadius:4,border:`1px solid ${T.stat.border}`,
                            background:T.stat.bg,color:T.stat.text,cursor:"pointer"}}>auto</button>}
                        </div>
                      )}
                    </td>
                    {/* Rango */}
                    <td style={{padding:"7px 9px",fontFamily:"DM Mono,monospace",fontSize:10,
                      color:esFija?C.mid:C.gold,fontWeight:esFija?400:700}}>
                      {esFija?"—":rango(v)}
                    </td>
                    {/* Toggle activa/fija */}
                    <td style={{padding:"7px 9px",textAlign:"center"}}>
                      <button onClick={()=>updateVar(v.id,"activa",!v.activa)}
                        style={{padding:"3px 10px",borderRadius:5,fontSize:9,fontWeight:700,cursor:"pointer",
                          border:`1px solid ${v.activa?C.navy:C.border}`,
                          background:v.activa?C.navy:"#fff",
                          color:v.activa?"#fff":C.mid,transition:"all .15s"}}>
                        {v.activa?"Activa":"Fija"}
                      </button>
                    </td>
                    {/* Nota */}
                    <td style={{padding:"7px 9px",fontSize:9,color:C.mid,maxWidth:220}}>{v.nota}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:8,fontSize:9,color:C.mid,fontStyle:"italic"}}>
          σ = desviación estándar de la distribución Normal. ~95% de los sorteos caen dentro de ±2σ del valor base.
          El mes se sortea al azar en cada iteración (análisis anual ponderado).
        </div>
      </div>

      {/* ── CONFIGURACIÓN Y CORRER ── */}
      <div className="card">
        <div className="ct">Configuración</div>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>N simulaciones</div>
            <select className="campo-input" value={n} onChange={e=>setN(Number(e.target.value))}
              style={{width:130,background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}>
              {[1000,3000,5000,10000].map(v=><option key={v} value={v}>{v.toLocaleString()}</option>)}
            </select>
          </div>
          <button className="run" onClick={run} disabled={running}>{running?"Calculando...":"▶ Correr"}</button>
          <span style={{fontSize:10,color:C.muted}}>Base det. (Jun): <strong style={{color:C.gold}}>${det.usdTn.toFixed(1)} USD/Tn</strong></span>
        </div>
      </div>

      {/* ── RESULTADOS ── */}
      {res&&(
        <>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {pBadges.map(({l,v,bg,bc,c,d})=>(
              <div key={l} className="pbadge" style={{background:bg,borderColor:bc}}>
                <div className="pbadge-l" style={{color:c}}>{l}</div>
                <div className="pbadge-v" style={{color:c}}>${v.toFixed(1)}</div>
                <div className="pbadge-d" style={{color:c}}>{d}</div>
              </div>
            ))}
            <div className="pbadge" style={{background:"#EEF2F7",borderColor:C.border}}>
              <div className="pbadge-l" style={{color:C.muted}}>Spread P10–P90</div>
              <div className="pbadge-v" style={{color:C.navy}}>${(res.p90-res.p10).toFixed(1)}</div>
              <div className="pbadge-d" style={{color:C.muted}}>σ=${res.std.toFixed(1)}</div>
            </div>
            <div className="pbadge" style={{background:"#F0F9FF",borderColor:"#BAE6FD"}}>
              <div className="pbadge-l" style={{color:"#0369A1"}}>Media</div>
              <div className="pbadge-v" style={{color:"#0369A1",fontSize:14}}>${res.mean.toFixed(2)}</div>
              <div className="pbadge-d" style={{color:"#0369A1"}}>±${(res.std/Math.sqrt(res.n)*2).toFixed(3)} error</div>
            </div>
          </div>

          <div className="card" style={{background:"#F0FDF4",borderColor:"#86EFAC"}}>
            <div className="ct" style={{color:C.green}}>Guardar esta corrida</div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <input type="text" value={nomMC} onChange={e=>setNomMC(e.target.value)}
                placeholder="Ej: Anual 2026 — VLSFO hoy — 5000 sims"
                style={{flex:2,minWidth:180,background:T.usuario.bg,border:`1px solid ${T.usuario.border}`,
                  borderRadius:6,padding:"6px 8px",color:T.usuario.text,fontSize:12,fontFamily:"Montserrat,sans-serif"}}/>
              <button className="run" onClick={guardarMC} disabled={savingMC} style={{background:C.green}}>
                {savingMC?"Guardando...":"💾 Guardar corrida"}
              </button>
              {msgMC&&<span style={{fontSize:11,color:msgMC.startsWith("✓")?C.green:C.red,fontWeight:700}}>{msgMC}</span>}
            </div>
            <div style={{fontSize:9,color:C.green,marginTop:5}}>
              Anualizado — P10=${res.p10} P50=${res.p50} P90=${res.p90} · Spread=${(res.p90-res.p10).toFixed(1)}
            </div>
          </div>

          <div className="card">
            <div className="ct">Distribución de Probabilidad — Anual</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={res.hist} margin={{top:8,right:8,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="x" tick={{fill:C.muted,fontSize:9}} tickCount={10}/>
                <YAxis tick={{fill:C.muted,fontSize:9}} unit="%"/>
                <Tooltip {...TTip} formatter={(v,_,{payload})=>[`${v}% a $${payload.x}`]}/>
                <ReferenceLine x={res.p10} stroke={C.p10} strokeWidth={2} label={{value:"P10",fill:C.p10,fontSize:9}}/>
                <ReferenceLine x={res.p50} stroke={C.p50} strokeWidth={2} label={{value:"P50",fill:C.p50,fontSize:9}}/>
                <ReferenceLine x={res.p90} stroke={C.p90} strokeWidth={2} label={{value:"P90",fill:C.p90,fontSize:9}}/>
                <ReferenceLine x={det.usdTn} stroke={C.mid} strokeDasharray="4 4" label={{value:"Det.",fill:C.mid,fontSize:9}}/>
                <Bar dataKey="pct" radius={[2,2,0,0]}>
                  {res.hist.map((h,i)=>(
                    <Cell key={i} fill={h.x<=res.p10?C.p10:h.x<=res.p25?"#2a9a5a":h.x<=res.p75?C.blue:h.x<=res.p90?C.orange:C.p90}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Proforma MC — desglose USD/Tn por ítem */}
          {res.proforma&&(
            <div className="card">
              <div className="ct">Proforma de Costos — P10 / P50 / P90</div>
              <div style={{fontSize:10,color:C.mid,marginBottom:8}}>
                Cada línea muestra el percentil de ese ítem <strong>en el escenario P10/P50/P90 del costo total</strong> — no son percentiles independientes.
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:C.navy}}>
                      {["Concepto","P10 — Optimista","P50 — Base","P90 — Pesimista","Δ P90−P10"].map((h,i)=>(
                        <th key={h} style={{padding:"6px 10px",color:"rgba(255,255,255,.65)",fontSize:8,fontWeight:700,
                          textTransform:"uppercase",letterSpacing:.5,textAlign:i===0?"left":"right"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {k:"arena",    label:"Precio arena en origen",  color:C.navy},
                      {k:"mermas",   label:"Mermas totales",           color:C.red},
                      {k:"barco",    label:"Barco (TC+Trip+Misc)",     color:C.blue},
                      {k:"comb",     label:"Combustible total",        color:C.orange},
                      {k:"agZarate", label:"Agencia Zárate",           color:C.navy},
                      {k:"agBB",     label:"Agencia BB",               color:C.navy},
                      {k:"opex",     label:"Opex carga + descarga",    color:C.navy},
                      {k:"camiones", label:"Camiones + Acopio",        color:C.navy},
                    ].map(({k,label,color},i)=>{
                      const r=res.proforma[k];
                      const delta=(r.p90-r.p10).toFixed(1);
                      return (
                        <tr key={k} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#F9FAFB"}}>
                          <td style={{padding:"6px 10px",fontWeight:600,color}}>{label}</td>
                          <td style={{padding:"6px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.p10,fontWeight:700}}>${r.p10.toFixed(1)}</td>
                          <td style={{padding:"6px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.p50,fontWeight:700}}>${r.p50.toFixed(1)}</td>
                          <td style={{padding:"6px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.p90,fontWeight:700}}>${r.p90.toFixed(1)}</td>
                          <td style={{padding:"6px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:10,
                            color:parseFloat(delta)>0.5?C.red:C.mid}}>{parseFloat(delta)>0?"+ $"+delta:"$"+delta}</td>
                        </tr>
                      );
                    })}
                    <tr style={{background:C.navy}}>
                      <td style={{padding:"7px 10px",fontWeight:800,color:"#fff",fontSize:12}}>TOTAL USD/Tn</td>
                      <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:800,color:"#86EFAC",fontSize:13}}>${res.p10.toFixed(1)}</td>
                      <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:800,color:"#FCD34D",fontSize:13}}>${res.p50.toFixed(1)}</td>
                      <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:800,color:"#FCA5A5",fontSize:13}}>${res.p90.toFixed(1)}</td>
                      <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:"#FCA5A5",fontSize:12}}>+ ${(res.p90-res.p10).toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabla de variables usadas en esta corrida */}
          {res.varsDesc&&(
            <div className="card">
              <div className="ct">Variables en esta corrida</div>
              <div className="mc-var-row" style={{fontWeight:700,fontSize:8,color:C.muted,background:"transparent",textTransform:"uppercase",letterSpacing:.5}}>
                <span>Variable</span><span>Valor base</span><span>σ efectivo</span><span>Estado</span>
              </div>
              {res.varsDesc.map((v,i)=>(
                <div key={i} className="mc-var-row" style={{opacity:v.activa?1:0.5}}>
                  <span style={{fontWeight:600,color:C.navy}}>{v.label}</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:C.mid}}>{v.base}</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:v.activa?T.usuario.text:C.mid}}>
                    {v.activa?sigmaLabel(v):"—"}
                  </span>
                  <TipoBadge tipo={v.activa?"usuario":"formula"}/>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
// ─── TAB EV: EVALUACIÓN TOTAL ──────────────────────────────────────────────
function TabEvaluacion({p,tnEntregadas}) {
  const [mes,setMes]=useState(5);
  const e1=calcEtapa1(p,mes);
  const e2=calcEtapa2(p);
  const e0=calcEtapaRepo(p);
  const costoArenaEq = e1.tnPostCarga > 0 ? (e0.costoTotal+e1.costoTotal + e2.costoTotal) / e1.tnPostCarga : (p.cap_precioArenaOrigen||13.5);
  const e3=calcEtapa3({...p,_costoArenaEq:costoArenaEq},mes,e1.tnPostCarga);
  const tot={
    costoTotal: e0.costoTotal+e1.costoTotal+e2.costoTotal+e3.costoTotal,
    usdTn: (e0.costoTotal+e1.costoTotal+e2.costoTotal+e3.costoTotal)/e3.tnEntregadas,
    diasTotales: e0.diasNav+e1.tReal_dias+e2.diasNav+e3.tReal_dias,
    tnEntregadas: e3.tnEntregadas,
  };

  const etapas=[
    {
      id:"e0", label:"VIAJE A PUERTO DE CARGA", color:"#0F766E",
      kpis:[
        {l:"Días viaje",      v:`${e0.diasNav.toFixed(1)}d`},
        {l:"Distancia",       v:`${e0.totalMn?.toFixed(0)||"—"}mn`},
        {l:"Combustible",     v:`${e0.combTotal.toFixed(1)}T`},
        {l:"Limpieza bodega", v:`$${(p.barco_limpiezaBodega||0).toLocaleString()}`},
        {l:"Import./Waiver",  v:`$${(p.barco_importacionWaiver||0).toLocaleString()}`},
      ],
      rows:[
        {label:"Combustible lastre",   eq:`${e0.combTotal.toFixed(1)}T×$${e0.vlsfo}`,   total:e0.combCosto,         hover:e0.hoverComb},
        {label:"Limpieza bodega",      eq:"por escala",                                  total:e0.limpiezaBodega,    hover:[e0.hoverTotal[2]]},
        {label:"Importación/Waiver",   eq:"por escala",                                  total:e0.importacionWaiver, hover:[e0.hoverTotal[3]]},
      ],
      nota:`TC (${e0.diasNav.toFixed(1)}d × $${e0.tc}/d = $${e0.fleteCosto.toLocaleString("es-AR",{maximumFractionDigits:0})}) incluido en total "Barco"`,
      subtotal:e0.costoTotal, dias:e0.diasNav,
    },
    {
      id:"e1", label:"CARGA — ZÁRATE", color:"#235C96",
      kpis:[
        {l:"T. real carga",  v:`${e1.tReal_dias.toFixed(1)}d`},
        {l:"T. ideal",       v:`${e1.tIdeal_dias.toFixed(1)}d`},
        {l:"Inop. clima",    v:`${(e1.pInop*100).toFixed(1)}%`},
        {l:"Merma carga",    v:`${e1.mermaTn.toFixed(0)}Tn`},
        {l:"Vel. ideal",     v:`${e1.velIdeal_TnMin.toFixed(1)}Tn/min`},
      ],
      rows:[
        {label:"Costo arena",         eq:`$${e1.precioArena}×${p.cap_capacidadBarco.toLocaleString()}Tn`,                  total:e1.costoArena,   hover:[e1.hoverTotal[0]]},
        {label:"Merma carga",         eq:`$${e1.precioArena}×${e1.mermaTn.toFixed(0)}Tn`,                                  total:e1.costoMerma,   hover:[e1.hoverTotal[1]]},
        {label:"Opex carga",          eq:`$${p.cap_opexUSDTn}/Tn×${p.cap_capacidadBarco.toLocaleString()}Tn`,              total:e1.costoOpex,    hover:[e1.hoverTotal[2]]},
        {label:"Combustible puerto",  eq:`${e1.tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${e1.vlsfo}`,         total:e1.combPuerto,   hover:e1.hoverComb},
        {label:"Time Charter+Trip.",  eq:`${e1.tReal_dias.toFixed(1)}d×$${e1.tc}/d`,                                       total:e1.fleteEtapa,   hover:e1.hoverTC},
        {label:"Agencia Zárate",      eq:"desde ítems Ag. Zárate",                                                         total:e1.agencia,      hover:[e1.hoverTotal[5]]},
      ],
      subtotal:e1.costoTotal, dias:e1.tReal_dias,
    },
    {
      id:"e2", label:"NAVEGACIÓN IDA", color:"#166534",
      kpis:[
        {l:"Días",          v:`${e2.diasNav.toFixed(1)}d`},
        {l:"Distancia",     v:`${e2.totalMn}mn`},
        {l:"Vel. promedio", v:`${e2.velProm.toFixed(1)}kt`},
        {l:"Combustible",   v:`${e2.combNavTotal.toFixed(1)}T`},
      ],
      rows:[
        {label:"Combustible ida",     eq:`${e2.combNavTotal.toFixed(1)}T×$${e2.vlsfo}`,  total:e2.combNav,  hover:e2.hoverComb},
        {label:"Time Charter+Trip.",  eq:`${e2.diasNav.toFixed(1)}d×$${e2.tc}/d`,        total:e2.fleteNav, hover:e2.hoverTC},
      ],
      subtotal:e2.costoTotal, dias:e2.diasNav,
    },
    {
      id:"e3", label:"DESCARGA — SEA WHITE / BAHÍA BLANCA", color:"#5B21B6",
      kpis:[
        {l:"T. real desc.",    v:`${e3.tReal_dias.toFixed(1)}d`},
        {l:"T. scheduler",     v:`${(e3.sch?.t_total_dias||0).toFixed(1)}d`},
        {l:"Inop. clima BB",   v:`${(e3.pInop*100).toFixed(1)}%`},
        {l:"Tn entregadas",    v:e3.tnEntregadas.toFixed(0)},
        {l:"Merma desc.",      v:`${e3.mermaDescarga_Tn.toFixed(0)}Tn`},
        {l:"Precio eq. arena", v:`$${e3.precioArenaEq.toFixed(2)}/Tn`},
      ],
      rows:[
        {label:"Opex descarga",          eq:`$${p.des_opexUSDTn}/Tn×${e3.tnEntrada.toFixed(0)}Tn`,                                                       total:e3.costoOpex,          hover:[e3.hoverTotal[0]]},
        {label:"Camiones directos",      eq:`${e3.sch?.nDir||0} cam → ${e3.tnDirecto.toFixed(0)}Tn`,                                                     total:e3.costoCamiones,      hover:[e3.hoverTotal[1]]},
        {label:"Calesitas (ciclo local)",eq:`${e3.sch?.nCal||0} cam → ${e3.tnAcopio.toFixed(0)}Tn × $${(e3.sch?.costoCalUSDTn||0).toFixed(2)}/Tn`,      total:e3.costoAcopio,        hover:[e3.hoverTotal[2]]},
        {label:"Flete acopio → Neuquén", eq:`${e3.tnAcopio.toFixed(0)}Tn × $${(p.des_costoFleteAcopioUSDTn??37.14).toFixed(2)}/Tn`,                     total:e3.costoFleteAcopio,   hover:[e3.hoverTotal[3]]},
        {label:"Combustible puerto",     eq:`${e3.tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${e3.vlsfo}`,                                     total:e3.combPuerto,         hover:e3.hoverComb},
        {label:"Time Charter+Trip.",     eq:`${e3.tReal_dias.toFixed(1)}d×$${e3.tc}/d`,                                                                  total:e3.fleteEtapa,         hover:e3.hoverTC},
        {label:"Agencia BB",             eq:"desde ítems Ag. BB",                                                                                         total:e3.agencia,            hover:[e3.hoverTotal[6]]},
        {label:"Merma descarga",         eq:`${e3.mermaDescarga_Tn.toFixed(0)}Tn×$${e3.precioArenaEq.toFixed(2)}/Tn eq.`,                               total:e3.costoMermaDescarga, hover:[e3.hoverTotal[7]]},
      ],
      subtotal:e3.costoTotal, dias:e3.tReal_dias,
    },
  ];
  return (
    <div>
      {/* KPIs globales */}
      <div className="kpis">
        <KPI label="USD/Tn final"  value={`$${tot.usdTn.toFixed(1)}`}             color={C.gold}/>
        <KPI label="Tn entregadas" value={tot.tnEntregadas.toFixed(0)}             color={C.green}/>
        <KPI label="Días totales"  value={`${tot.diasTotales.toFixed(1)}d`}        color={C.navy}/>
        <KPI label="Costo total"   value={`$${(tot.costoTotal/1000).toFixed(0)}k`} color={C.navy}/>
        <KPI label="VLSFO"         value={`$${e1.vlsfo}/T`}                        color={C.orange}/>
        <KPI label="TC+Trip."      value={`$${e1.tc.toLocaleString()}/d`}          color={C.mid}/>
      </div>

      {/* Bloque por etapa */}
      {etapas.map(etapa=>(
        <div key={etapa.id} className="card" style={{borderTop:`3px solid ${etapa.color}`}}>
          <div className="ct" style={{color:etapa.color}}>{etapa.label}</div>

          {/* KPIs del bloque */}
          <div className="kpis" style={{marginBottom:10}}>
            {etapa.kpis.map(k=>(
              <div key={k.l} style={{flex:1,minWidth:80,background:"#EEF2F7",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px"}}>
                <div style={{fontSize:15,fontWeight:800,fontFamily:"DM Mono,monospace",color:etapa.color,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:8,color:C.mid,textTransform:"uppercase",letterSpacing:.5,marginTop:3}}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* Tabla de costos */}
          <table className="cost-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Fórmula</th>
                <th style={{textAlign:"right"}}>Total USD</th>
                <th style={{textAlign:"right"}}>USD/Tn</th>
              </tr>
            </thead>
            <tbody>
              {etapa.rows.map((r,i)=>(
                <tr key={i}>
                  <td style={{color:C.mid,fontSize:10}}>{r.label}</td>
                  <td className="eq">{r.eq}</td>
                  <td style={{textAlign:"right"}}>
                    <HoverVal value={`$${r.total.toLocaleString("es-AR",{maximumFractionDigits:0})}`} title={r.label} lines={Array.isArray(r.hover)?r.hover:[r.hover]}/>
                  </td>
                  <td className="mono" style={{textAlign:"right",color:C.mid,fontSize:10}}>${(r.total/tot.tnEntregadas).toFixed(1)}</td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={2} style={{textAlign:"right"}}>SUBTOTAL</td>
                <td className="mono" style={{textAlign:"right",color:etapa.color}}>${etapa.subtotal.toLocaleString("es-AR",{maximumFractionDigits:0})}</td>
                <td className="mono" style={{textAlign:"right",color:etapa.color}}>${(etapa.subtotal/tot.tnEntregadas).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
          {etapa.nota && (
            <div style={{marginTop:6,padding:"5px 10px",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:6,fontSize:10,color:"#166534"}}>
              ℹ️ {etapa.nota}
            </div>
          )}
        </div>
      ))}

      {/* Total consolidado */}
      <div className="card" style={{background:C.navy,border:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:14}}>
          <div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>TOTAL — USD / TN ENTREGADA</div>
            <div style={{fontSize:32,fontWeight:800,fontFamily:"DM Mono,monospace",color:"#FCD34D",lineHeight:1,marginTop:4}}>${tot.usdTn.toFixed(1)}</div>
          </div>
          <div style={{display:"flex",gap:16}}>
            {[
              {l:"Días totales",  v:`${tot.diasTotales.toFixed(1)}d`},
              {l:"Tn entregadas", v:tot.tnEntregadas.toFixed(0)},
              {l:"Costo total",   v:`$${(tot.costoTotal/1000).toFixed(0)}k`},
            ].map(({l,v})=>(
              <div key={l} style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:800,fontFamily:"DM Mono,monospace",color:"#fff"}}>{v}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose por etapa */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {etapas.map(etapa=>{
            const pct = tot.costoTotal>0 ? (etapa.subtotal/tot.costoTotal*100) : 0;
            return (
              <div key={etapa.id} style={{background:"rgba(255,255,255,.07)",borderRadius:8,padding:"9px 11px",borderTop:`3px solid ${etapa.color}`}}>
                <div style={{fontSize:8,color:"rgba(255,255,255,.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,lineHeight:1.3}}>
                  {etapa.label.split("—")[0].trim()}
                </div>
                <div style={{fontSize:16,fontWeight:800,fontFamily:"DM Mono,monospace",color:"#fff",lineHeight:1}}>
                  ${(etapa.subtotal/tot.tnEntregadas).toFixed(1)}
                </div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:3,fontFamily:"DM Mono,monospace"}}>
                  USD/Tn
                </div>
                <div style={{marginTop:6,height:3,background:"rgba(255,255,255,.1)",borderRadius:2}}>
                  <div style={{height:"100%",width:`${pct}%`,background:etapa.color,borderRadius:2}}/>
                </div>
                <div style={{fontSize:8,color:"rgba(255,255,255,.35)",marginTop:3,display:"flex",justifyContent:"space-between"}}>
                  <span>${(etapa.subtotal/1000).toFixed(0)}k</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waterfall */}
      <div className="card">
        <div className="ct">Contribución por Etapa (USD/Tn)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={etapas.map(e=>({name:e.label.split("—")[1]?.trim()||e.label,val:parseFloat((e.subtotal/tot.tnEntregadas).toFixed(1)),color:e.color}))} margin={{top:8,right:8,left:0,bottom:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="name" tick={{fill:C.mid,fontSize:9}}/>
            <YAxis tick={{fill:C.mid,fontSize:9}}/>
            <Tooltip {...TTip} formatter={v=>[`$${v} USD/Tn`]}/>
            <Bar dataKey="val" radius={[4,4,0,0]}>{etapas.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── DESGLOSE: Costo Logístico vs Costo Arena+Mermas ── */}
      {(() => {
        // Costo arena + mermas
        const costoArena   = e1.costoArena   || 0;
        const costoMermaCarga   = e1.costoMerma    || 0;
        const costoMermaDesc    = e3.costoMermaDescarga || 0;
        const costoMermaAcopio  = (e3.mermaAcopio_Tn||0) * (e3.precioArenaEq||0);
        const totalArenaMermas  = costoArena + costoMermaCarga + costoMermaDesc + costoMermaAcopio;

        // Costo logístico puro = todo lo demás
        const totalLogistico = tot.costoTotal - totalArenaMermas;
        const tn = tot.tnEntregadas || 1;

        const pctLog  = tot.costoTotal > 0 ? totalLogistico / tot.costoTotal * 100 : 0;
        const pctArena = 100 - pctLog;

        const filas = [
          {l:"Precio arena en origen",       v:costoArena,          c:"#5B21B6"},
          {l:"Merma de carga (Zárate)",      v:costoMermaCarga,     c:"#DC2626"},
          {l:"Merma de descarga (BB)",       v:costoMermaDesc,      c:"#C2410C"},
          {l:"Merma de acopio",              v:costoMermaAcopio,    c:"#D97706"},
        ];
        const filasLog = [
          {l:"Barco (TC + tripulación)",     v:e0.fleteCosto + e1.fleteEtapa + e2.fleteNav + e3.fleteEtapa, c:C.navy},
          {l:"Combustible (todas etapas)",   v:e0.combCosto + e1.combPuerto + e2.combNav + e3.combPuerto,   c:C.orange},
          {l:"Agencia Zárate",               v:e1.agencia || 0,     c:C.blue},
          {l:"Agencia BB",                   v:e3.agencia || 0,     c:C.blue},
          {l:"Opex carga + descarga",        v:(e1.costoOpex||0) + (e3.costoOpex||0), c:C.mid},
          {l:"Camiones + Acopio",            v:(e3.costoCamiones||0) + (e3.costoAcopio||0) + (e3.costoFleteAcopio||0), c:"#166534"},
          {l:"Repo. (limpieza, waiver, etc.)",v:e0.combCosto + e0.fleteCosto + (e0.limpiezaBodega||0) + (e0.importacionWaiver||0) - e0.combCosto - e0.fleteCosto + e0.limpiezaBodega + e0.importacionWaiver, c:C.mid},
        ];
        // Simplify: just show logístico total vs arena total
        return (
          <div className="card" style={{borderTop:`3px solid #7C3AED`}}>
            <div className="ct" style={{color:"#7C3AED"}}>📊 Desglose: Costo Logístico vs Costo Arena y Mermas</div>
            <p style={{fontSize:10,color:C.mid,marginBottom:12,lineHeight:1.6}}>
              Aísla el <strong>costo propio del viaje</strong> (barco, combustible, agencias, opex) del <strong>costo de la arena y sus pérdidas</strong> (precio origen + mermas de carga, descarga y acopio).
            </p>

            {/* Barra apilada visual */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,flexWrap:"wrap",gap:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:12,height:12,borderRadius:2,background:"#7C3AED"}}/>
                  <span style={{fontSize:10,fontWeight:700,color:"#7C3AED"}}>Logístico</span>
                  <span style={{fontSize:13,fontWeight:800,color:"#7C3AED",fontFamily:"DM Mono,monospace"}}>${(totalLogistico/tn).toFixed(1)}/Tn ({pctLog.toFixed(0)}%)</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,fontWeight:800,color:"#5B21B6",fontFamily:"DM Mono,monospace"}}>${(totalArenaMermas/tn).toFixed(1)}/Tn ({pctArena.toFixed(0)}%)</span>
                  <span style={{fontSize:10,fontWeight:700,color:"#5B21B6"}}>Arena + Mermas</span>
                  <div style={{width:12,height:12,borderRadius:2,background:"#5B21B6"}}/>
                </div>
              </div>
              <div style={{height:20,borderRadius:8,overflow:"hidden",display:"flex",border:`1px solid ${C.border}`}}>
                <div style={{width:`${pctLog}%`,background:"#7C3AED",transition:"width .3s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {pctLog>12&&<span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{pctLog.toFixed(0)}%</span>}
                </div>
                <div style={{flex:1,background:"#5B21B6",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {pctArena>12&&<span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{pctArena.toFixed(0)}%</span>}
                </div>
              </div>
            </div>

            <div className="g2">
              {/* Bloque Logístico */}
              <div style={{background:"#F5F3FF",border:"1px solid #C4B5FD",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:"#7C3AED",fontWeight:800,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Costo Logístico Puro</div>
                <div style={{fontSize:22,fontWeight:800,fontFamily:"DM Mono,monospace",color:"#7C3AED",lineHeight:1,marginBottom:2}}>${(totalLogistico/tn).toFixed(1)}<span style={{fontSize:10,fontWeight:400,color:"#A78BFA"}}> /Tn</span></div>
                <div style={{fontSize:10,color:"#7C3AED",fontFamily:"DM Mono,monospace",marginBottom:8}}>${totalLogistico.toLocaleString("es-AR",{maximumFractionDigits:0})} total</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                  <tbody>
                    {[
                      {l:"Barco (TC+Trip+Misc)", v: (e0.fleteCosto||0)+(e1.fleteEtapa||0)+(e2.fleteNav||0)+(e3.fleteEtapa||0)},
                      {l:"Combustible total",    v: (e0.combCosto||0)+(e1.combPuerto||0)+(e2.combNav||0)+(e3.combPuerto||0)},
                      {l:"Agencia Zárate",       v: e1.agencia||0},
                      {l:"Agencia BB",           v: e3.agencia||0},
                      {l:"Opex carga+desc.",     v: (e1.costoOpex||0)+(e3.costoOpex||0)},
                      {l:"Camiones+Acopio",      v: (e3.costoCamiones||0)+(e3.costoAcopio||0)+(e3.costoFleteAcopio||0)},
                    ].map(({l,v})=>(
                      <tr key={l} style={{borderBottom:"1px solid #EDE9FE"}}>
                        <td style={{padding:"4px 0",color:"#6D28D9",fontSize:9}}>{l}</td>
                        <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",color:"#7C3AED",fontSize:9,padding:"4px 0"}}>${(v/tn).toFixed(1)}/Tn</td>
                        <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",color:"#A78BFA",fontSize:8,padding:"4px 0",paddingLeft:6}}>${(v/1000).toFixed(0)}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bloque Arena + Mermas */}
              <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:"#5B21B6",fontWeight:800,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Arena + Mermas</div>
                <div style={{fontSize:22,fontWeight:800,fontFamily:"DM Mono,monospace",color:"#5B21B6",lineHeight:1,marginBottom:2}}>${(totalArenaMermas/tn).toFixed(1)}<span style={{fontSize:10,fontWeight:400,color:"#8B5CF6"}}> /Tn</span></div>
                <div style={{fontSize:10,color:"#5B21B6",fontFamily:"DM Mono,monospace",marginBottom:8}}>${totalArenaMermas.toLocaleString("es-AR",{maximumFractionDigits:0})} total</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                  <tbody>
                    {filas.map(({l,v,c})=>(
                      <tr key={l} style={{borderBottom:"1px solid #EDE9FE"}}>
                        <td style={{padding:"4px 0",color:c,fontSize:9}}>{l}</td>
                        <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",color:c,fontSize:9,padding:"4px 0"}}>${(v/tn).toFixed(1)}/Tn</td>
                        <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",color:"#8B5CF6",fontSize:8,padding:"4px 0",paddingLeft:6}}>${(v/1000).toFixed(0)}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ANÁLISIS MULTI-VIAJE (waiver compartido) ── */}
      {(() => {
        const mv = calcNViajes(p, 5);
        const b  = mv.base;
        const n  = mv.nViajes;
        const fmt = v => `$${v.toLocaleString("es-AR",{maximumFractionDigits:0})}`;
        const fmtUSDTn = v => `$${v.toFixed(1)}`;
        const delta = (vN, v1, f) => {
          const d = vN - v1;
          const str = f(Math.abs(d));
          return <span style={{fontFamily:"DM Mono,monospace",fontSize:11,fontWeight:700,color:d<0?"#16A34A":"#DC2626"}}>{d<0?"-":"+"}{str}</span>;
        };
        const rows = [
          {l:"USD / Tn",      v1: b.usdTn,            vN: mv.usdTnSistema,      fmt: fmtUSDTn,                         isGoodWhenNeg: true},
          {l:"Costo total",   v1: b.costoTotal,        vN: mv.costoTotalSistema, fmt: v=>`$${(v/1000).toFixed(0)}k`,    isGoodWhenNeg: false},
          {l:"Tn entregadas", v1: b.tnEntregadas,      vN: mv.tnTotales,         fmt: v=>v.toFixed(0),                  isGoodWhenNeg: false},
          {l:"Días waiver",   v1: mv.diasCiclo1,       vN: mv.diasTotalesWaiver, fmt: v=>`${v.toFixed(1)}d`,            isGoodWhenNeg: false},
        ];
        return (
          <div className="card" style={{borderTop:`3px solid #0891B2`}}>
            <div className="ct" style={{color:"#0891B2"}}>🔁 Análisis Multi-Viaje — Waiver {p.barco_diasWaiver||30} días</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
              <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#0369A1",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Waiver</div>
                <div style={{fontSize:20,fontWeight:800,color:"#0369A1",fontFamily:"DM Mono,monospace"}}>{p.barco_diasWaiver||30}d</div>
              </div>
              <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#0369A1",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Ciclo viaje 1</div>
                <div style={{fontSize:20,fontWeight:800,color:"#0369A1",fontFamily:"DM Mono,monospace"}}>{mv.diasCiclo1.toFixed(1)}d</div>
                <div style={{fontSize:8,color:"#64748B"}}>Carga+Nav+Desc</div>
              </div>
              <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#0369A1",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Ciclo viaje 2+</div>
                <div style={{fontSize:20,fontWeight:800,color:"#0369A1",fontFamily:"DM Mono,monospace"}}>{mv.diasCiclo2.toFixed(1)}d</div>
                <div style={{fontSize:8,color:"#64748B"}}>Vuelta+Carga+Nav+Desc</div>
              </div>
              <div style={{background:"#F0F9FF",border:`1px solid ${mv.diasTotalesWaiver<=(p.barco_diasWaiver||30)?"#BAE6FD":"#FCA5A5"}`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#0369A1",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Días usados</div>
                <div style={{fontSize:20,fontWeight:800,color:mv.diasTotalesWaiver<=(p.barco_diasWaiver||30)?"#0369A1":"#DC2626",fontFamily:"DM Mono,monospace"}}>{mv.diasTotalesWaiver.toFixed(1)}d</div>
                <div style={{fontSize:8,color:"#64748B"}}>de {p.barco_diasWaiver||30}d</div>
              </div>
              <div style={{background: n>1?"#F0FDF4":"#FEF9C3",border:`1px solid ${n>1?"#86EFAC":"#FDE047"}`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color: n>1?"#166534":"#92400E",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Viajes posibles</div>
                <div style={{fontSize:28,fontWeight:800,color: n>1?"#16A34A":"#D97706",fontFamily:"DM Mono,monospace"}}>{n}</div>
              </div>
            </div>

            {n > 1 && (
              <>
                <div style={{marginBottom:10,padding:"8px 12px",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:8,fontSize:10,color:"#166534"}}>
                  <strong>Ahorro por costos compartidos:</strong> Waiver {fmt(p.barco_importacionWaiver||0)} + Limpieza {fmt(p.barco_limpiezaBodega||0)} = <strong>{fmt(mv.ahorroTotal)}</strong> en {n} viajes ({fmtUSDTn(mv.ahorroTotal/mv.tnTotales)} USD/Tn)
                </div>
                <table className="cost-table">
                  <thead>
                    <tr>
                      <th>Métrica</th>
                      <th style={{textAlign:"right"}}>1 Viaje</th>
                      <th style={{textAlign:"right"}}>{n} Viajes</th>
                      <th style={{textAlign:"right"}}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({l,v1,vN,fmt:f})=>(
                      <tr key={l}>
                        <td style={{color:C.mid,fontSize:10}}>{l}</td>
                        <td className="mono" style={{textAlign:"right"}}>{f(v1)}</td>
                        <td className="mono" style={{textAlign:"right",color:"#0891B2",fontWeight:700}}>{f(vN)}</td>
                        <td style={{textAlign:"right"}}>{delta(vN, v1, f)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {n === 1 && (
              <div style={{padding:"10px 12px",background:"#FEF9C3",border:"1px solid #FDE047",borderRadius:8,fontSize:10,color:"#92400E"}}>
                Con {p.barco_diasWaiver||30} días de waiver y un ciclo de {mv.diasCiclo1.toFixed(1)}d (Carga+Nav+Desc) solo entra 1 viaje. Extendé el waiver o reducí el ciclo para aprovechar el segundo viaje.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── TAB CL: BASE CLIMA ────────────────────────────────────────────────────
function TabClima({p,set}) {
  const inopZ=getPctInopFromDB(p.clima_zarate,p.cap_inopLluvia,p.cap_inopViento);
  const inopB=getPctInopFromDB(p.clima_bb,p.des_inopLluvia,p.des_inopViento);
  const upd=(puerto,i,field,val)=>{const k=puerto==="zarate"?"clima_zarate":"clima_bb";const arr=[...p[k]];arr[i]={...arr[i],[field]:parseFloat(val)||0};set(k,arr);};
  const reset=(puerto)=>set(puerto==="zarate"?"clima_zarate":"clima_bb",CLIMA_DB_DEFAULT[puerto]);
  const Sec=({puerto,titulo,climaDB,inop,fuente})=>(
    <div className="card">
      <div className="ct">{titulo} <TipoBadge tipo="estadistico"/> <FuenteLink fuente={fuente}/>
        <button onClick={()=>reset(puerto)} style={{marginLeft:"auto",padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:8,fontWeight:700,cursor:"pointer"}}>Resetear</button>
      </div>
      <div className="warn-note" style={{marginBottom:7}}>⚠️ ESTIMADOS — μ=promedio diario del mes, σ=desviación estándar. Reemplazar con datos reales SMN.</div>
      <div style={{overflowX:"auto"}}>
        <table className="clima-table">
          <thead><tr><th>Mes</th><th>Lluvia μ</th><th>Lluvia σ</th><th>Viento μ</th><th>Viento σ</th><th>% Inop.</th></tr></thead>
          <tbody>{climaDB.map((d,i)=>(
            <tr key={d.mes}>
              <td style={{fontWeight:700,color:C.navy}}>{d.mes}</td>
              <td><input type="number" value={d.lluviaProm} step={0.1} min={0} onChange={e=>upd(puerto,i,"lluviaProm",e.target.value)}/></td>
              <td><input type="number" value={d.lluviaSigma} step={0.1} min={0} onChange={e=>upd(puerto,i,"lluviaSigma",e.target.value)}/></td>
              <td><input type="number" value={d.vientoProm} step={0.5} min={0} onChange={e=>upd(puerto,i,"vientoProm",e.target.value)}/></td>
              <td><input type="number" value={d.vientoSigma} step={0.5} min={0} onChange={e=>upd(puerto,i,"vientoSigma",e.target.value)}/></td>
              <td><span className="calc" style={{color:inop[i]>0.3?C.red:inop[i]>0.15?C.orange:C.green}}>{(inop[i]*100).toFixed(1)}%</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div>
      <div className="card" style={{background:C.warn,borderColor:C.warnBorder}}>
        <div style={{fontSize:11,color:C.orange,fontWeight:700,marginBottom:4}}>⚠️ Fuentes para validar</div>
        <div style={{fontSize:10,color:C.orange,lineHeight:1.7}}>
          • <strong>SMN San Fernando/Ezeiza:</strong> <a href="https://www.smn.gob.ar/descarga-de-datos" target="_blank" rel="noreferrer" style={{color:C.navy}}>smn.gob.ar ↗</a><br/>
          • <strong>SMN Bahía Blanca (est. 87750):</strong> misma URL<br/>
          • μ = media del valor diario histórico para ese mes. σ = desviación estándar.
        </div>
      </div>
      <Sec puerto="zarate" titulo="Zárate — Lluvia y Viento" climaDB={p.clima_zarate} inop={inopZ} fuente={FUENTES.climaZarate}/>
      <Sec puerto="bb"     titulo="Bahía Blanca — Lluvia y Viento" climaDB={p.clima_bb} inop={inopB} fuente={FUENTES.climaBB}/>
    </div>
  );
}

// ─── TAB CB: BASE COMBUSTIBLE ──────────────────────────────────────────────
function TabCombustible({p,set}) {
  const stats=calcVLSFOStats(p.vlsfo_historico);
  const upd=(idx,val)=>{const arr=[...p.vlsfo_historico];arr[idx]={...arr[idx],precio:parseFloat(val)||0};set("vlsfo_historico",arr);};
  const reset=()=>set("vlsfo_historico",VLSFO_HISTORICO_DEFAULT);
  const años=[...new Set(p.vlsfo_historico.map(h=>h.año))];
  const chartData=p.vlsfo_historico.map(h=>({name:`${MESES[h.mes]}'${String(h.año).slice(2)}`,precio:h.precio}));
  return (
    <div>
      <div className="card" style={{background:"#1E293B",borderColor:"#334155"}}>
        <div style={{fontSize:8,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>VLSFO 0.5%S Rotterdam</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[{l:"Hoy",v:`$${stats.actual}/T`,c:"#fff",sub:"⚠️ Pico histórico"},
            {l:"Prom 12M",v:`$${stats.prom12m.toFixed(0)}/T`,c:"#93C5FD"},
            {l:"Prom 5 años",v:`$${stats.prom5a.toFixed(0)}/T`,c:"#93C5FD"},
            {l:"Mín 5a",v:`$${stats.min5a}/T`,c:"#86EFAC"},
            {l:"Máx 5a",v:`$${stats.max5a}/T`,c:"#FCA5A5"},
            {l:"vs Prom 12M",v:`${stats.pctVsPromedio12m>0?"+":""}${stats.pctVsPromedio12m.toFixed(1)}%`,c:stats.pctVsPromedio12m>10?"#FCA5A5":"#86EFAC"},
            {l:"σ 12M (MC)",v:`$${stats.sigma12m.toFixed(0)}/T`,c:"#FCD34D"},
          ].map(({l,v,c,sub})=>(
            <div key={l}>
              <div style={{fontSize:7,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>{l}</div>
              <div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"DM Mono,monospace"}}>{v}</div>
              {sub&&<div style={{fontSize:8,color:"rgba(255,255,255,.4)",marginTop:1}}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="warn-note">⚠️ ESTIMADOS. Reemplazar con datos reales de <a href="https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam" target="_blank" rel="noreferrer" style={{color:C.navy}}>Ship & Bunker Rotterdam ↗</a></div>
      <div className="card">
        <div className="ct">Histórico VLSFO</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{top:8,right:8,left:0,bottom:5}}>
            <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#235C96" stopOpacity={.3}/><stop offset="95%" stopColor="#235C96" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:8}} interval={5}/>
            <YAxis tick={{fill:C.muted,fontSize:9}} domain={["auto","auto"]}/>
            <Tooltip {...TTip} formatter={v=>[`$${v}/T`,"VLSFO"]}/>
            <ReferenceLine y={stats.prom12m} stroke="#93C5FD" strokeDasharray="4 4" label={{value:`12M:$${stats.prom12m.toFixed(0)}`,fill:"#93C5FD",fontSize:8}}/>
            <ReferenceLine y={stats.prom5a}  stroke="#6B7280" strokeDasharray="4 4" label={{value:`5a:$${stats.prom5a.toFixed(0)}`,fill:"#6B7280",fontSize:8}}/>
            <Area type="monotone" dataKey="precio" stroke="#235C96" fill="url(#vg)" strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div className="ct">Tabla Histórica — Editable <TipoBadge tipo="usuario"/>
          <button onClick={reset} style={{marginLeft:"auto",padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:8,fontWeight:700,cursor:"pointer"}}>Resetear</button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="clima-table">
            <thead><tr><th>Mes</th>{años.map(a=><th key={a}>{a}</th>)}</tr></thead>
            <tbody>{MESES.map((m,mi)=>(
              <tr key={m}>
                <td style={{fontWeight:700,color:C.navy}}>{m}</td>
                {años.map(a=>{const idx=p.vlsfo_historico.findIndex(h=>h.año===a&&h.mes===mi);return(
                  <td key={a}>{idx>=0?(<input type="number" value={p.vlsfo_historico[idx].precio} step={5} min={100} max={2000} onChange={e=>upd(idx,e.target.value)}/>):<span style={{color:C.muted,fontSize:9}}>—</span>}</td>
                );})}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB SC: ESCENARIOS ────────────────────────────────────────────────────
function TabEscenarios({p, onLoad}) {
  const [esc,setEsc]=useState([]);
  const [corridas,setCorridas]=useState([]);
  const [nom,setNom]=useState("");
  const [desc,setDesc]=useState("");
  const [sav,setSav]=useState(false);
  const [load,setLoad]=useState(false);
  const [msg,setMsg]=useState("");
  const [vista,setVista]=useState("escenarios");
  const [editId,setEditId]=useState(null);
  const [editNom,setEditNom]=useState("");
  const [editDesc,setEditDesc]=useState("");
  const [dbStatus,setDbStatus]=useState(null); // null | "ok" | "error"
  const det=calcTotal(p);

  const cargar=async()=>{
    setLoad(true);
    setMsg("");
    try {
      const [{data:e,error:eErr},{data:c,error:cErr}]=await Promise.all([
        supabase.from("escenarios_arena").select("*").order("created_at",{ascending:false}),
        supabase.from("corridas_montecarlo").select("*").order("created_at",{ascending:false}),
      ]);
      if(eErr) {
        console.error("Error cargando escenarios:",eErr);
        setMsg("Error al leer escenarios: "+eErr.message);
        setDbStatus("error");
      } else {
        setEsc(e||[]);
        setDbStatus("ok");
      }
      if(cErr) {
        console.error("Error cargando corridas:",cErr);
      } else {
        setCorridas(c||[]);
      }
    } catch(ex) {
      console.error("Error inesperado en cargar():",ex);
      setMsg("Error inesperado: "+ex.message);
      setDbStatus("error");
    }
    setLoad(false);
  };

  // Auto-cargar al montar
  useEffect(()=>{ cargar(); },[]);

  const guardar=async()=>{
    if(!nom.trim()){setMsg("Ingresá un nombre");return;}
    setSav(true);
    setMsg("");
    try {
      const payload = {
        nombre: nom.trim(),
        descripcion: desc.trim(),
        params: p,
        usd_tn: parseFloat(det.usdTn.toFixed(1)),
      };
      const{data,error}=await supabase.from("escenarios_arena").insert(payload).select();
      if(error){
        console.error("Error al guardar escenario:",error);
        setMsg("Error al guardar: "+error.message);
      } else {
        setMsg("✓ Guardado");
        setNom("");
        setDesc("");
        await cargar();
      }
    } catch(ex) {
      console.error("Excepción al guardar:",ex);
      setMsg("Error inesperado: "+ex.message);
    }
    setSav(false);
    setTimeout(()=>setMsg(""),4000);
  };

  const eliminar=async(tabla,id)=>{
    const{error}=await supabase.from(tabla).delete().eq("id",id);
    if(error) console.error("Error al eliminar:",error);
    cargar();
  };
  const abrirEdit=(e)=>{setEditId(e.id);setEditNom(e.nombre);setEditDesc(e.descripcion||"");};
  const cancelarEdit=()=>{setEditId(null);setEditNom("");setEditDesc("");};
  const actualizarNombre=async(id)=>{
    const{error}=await supabase.from("escenarios_arena").update({nombre:editNom.trim(),descripcion:editDesc.trim()}).eq("id",id);
    if(error){setMsg("Error: "+error.message);}
    else{setMsg("✓ Nombre actualizado");}
    setTimeout(()=>setMsg(""),3000);
    cancelarEdit();cargar();
  };
  const sobreescribir=async(id,nombre)=>{
    const det=calcTotal(p);
    const{error}=await supabase.from("escenarios_arena").update({params:p,usd_tn:parseFloat(det.usdTn.toFixed(1))}).eq("id",id);
    if(error){setMsg("Error: "+error.message);}
    else{setMsg(`✓ Sobreescrito: ${nombre}`);}
    setTimeout(()=>setMsg(""),3000);
    cargar();
  };

  return (
    <div>
      <div className="card">
        <div className="ct">Guardar Escenario Actual</div>
        <div className="g2" style={{marginBottom:8}}>
          <div className="campo">
            <div className="campo-label" style={{color:T.usuario.label}}>Nombre <TipoBadge tipo="usuario"/></div>
            <input className="campo-input" type="text" value={nom} onChange={e=>setNom(e.target.value)}
              placeholder="Ej: Caso base junio 2026"
              style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}/>
          </div>
          <div className="campo">
            <div className="campo-label" style={{color:T.usuario.label}}>Descripción <TipoBadge tipo="usuario"/></div>
            <input className="campo-input" type="text" value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Notas sobre este escenario"
              style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button className="run" onClick={guardar} disabled={sav}>{sav?"Guardando...":"💾 Guardar"}</button>
          <span style={{fontSize:10,color:C.muted}}>USD/Tn: <strong style={{color:C.gold}}>${det.usdTn.toFixed(1)}</strong></span>
          <span style={{fontSize:10,color:C.muted}}>VLSFO: <strong style={{color:C.orange}}>${calcVLSFOStats(p.vlsfo_historico).actual}/T ({VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label})</strong></span>
          {msg&&<span style={{fontSize:10,color:msg.startsWith("✓")?C.green:C.red,fontWeight:700}}>{msg}</span>}
        </div>
      </div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",gap:5}}>
            {[{id:"escenarios",l:"Escenarios"},{id:"corridas",l:"Corridas MC"}].map(v=>(
              <button key={v.id} className={`tbtn ${vista===v.id?"on":""}`} onClick={()=>setVista(v.id)}>{v.l}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {dbStatus==="error"&&(
              <span style={{fontSize:9,color:C.red,fontWeight:700}}>⚠️ Error Supabase — ver consola</span>
            )}
            {dbStatus==="ok"&&(
              <span style={{fontSize:9,color:C.green,fontWeight:700}}>✓ DB conectada</span>
            )}
            <button className="run" style={{padding:"5px 10px",fontSize:9}} onClick={cargar} disabled={load}>{load?"...":"↻ Actualizar"}</button>
          </div>
        </div>
        {vista==="escenarios"&&(
          esc.length===0?<div style={{textAlign:"center",padding:"20px",color:C.mid,fontSize:11}}>No hay escenarios.</div>
          :esc.map(e=>(
            <div key={e.id} style={{background:"#EEF2F7",border:`1px solid ${editId===e.id?C.blue:C.border}`,borderRadius:8,padding:"9px 12px",marginBottom:7}}>
              {editId===e.id ? (
                /* ── Modo edición inline ── */
                <div>
                  <div className="g2" style={{marginBottom:8}}>
                    <div className="campo">
                      <div className="campo-label" style={{color:T.usuario.label}}>Nombre</div>
                      <input className="campo-input" value={editNom} onChange={ev=>setEditNom(ev.target.value)}
                        style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}
                        onKeyDown={ev=>ev.key==="Enter"&&actualizarNombre(e.id)}
                        autoFocus/>
                    </div>
                    <div className="campo">
                      <div className="campo-label" style={{color:T.usuario.label}}>Descripción</div>
                      <input className="campo-input" value={editDesc} onChange={ev=>setEditDesc(ev.target.value)}
                        style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}
                        onKeyDown={ev=>ev.key==="Enter"&&actualizarNombre(e.id)}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button className="run" style={{fontSize:10,padding:"5px 12px"}}
                      onClick={()=>actualizarNombre(e.id)}>✓ Guardar nombre</button>
                    <button className="run" style={{fontSize:10,padding:"5px 12px",background:"#5B21B6"}}
                      onClick={()=>sobreescribir(e.id,e.nombre)}
                      title="Reemplaza los parámetros guardados con la configuración actual">
                      ↻ Sobreescribir parámetros
                    </button>
                    <button onClick={cancelarEdit}
                      style={{fontSize:10,padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.mid,fontWeight:600,cursor:"pointer"}}>
                      Cancelar
                    </button>
                  </div>
                  <div style={{fontSize:9,color:C.mid,marginTop:6}}>
                    💡 "Sobreescribir parámetros" reemplaza los datos guardados con la configuración actual de la app — el nombre no cambia.
                  </div>
                </div>
              ) : (
                /* ── Vista normal ── */
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,
                  cursor:"pointer"}}
                  onClick={()=>{if(e.params&&onLoad){onLoad({...DEFAULT_PARAMS,...e.params});setMsg(`✓ Cargado: ${e.nombre}`);setTimeout(()=>setMsg(""),3000);}}}
                  onMouseEnter={ev=>ev.currentTarget.style.background="#E5EBF5"}
                  onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.navy}}>{e.nombre}</div>
                    {e.descripcion&&<div style={{fontSize:9,color:C.mid,marginTop:1}}>{e.descripcion}</div>}
                    <div style={{fontSize:8,color:C.mid,marginTop:2,fontFamily:"DM Mono,monospace"}}>{new Date(e.created_at).toLocaleDateString("es-AR")} · clic para cargar</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontSize:15,fontWeight:800,color:C.blue,fontFamily:"DM Mono,monospace"}}>${e.usd_tn?.toFixed(1)} USD/Tn</div>
                    <button onClick={ev=>{ev.stopPropagation();abrirEdit(e);}}
                      title="Editar nombre / sobreescribir parámetros"
                      style={{padding:"3px 8px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.mid,fontSize:11,cursor:"pointer",fontWeight:600}}>✏️</button>
                    <button onClick={ev=>{ev.stopPropagation();eliminar("escenarios_arena",e.id);}}
                      style={{padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:9,fontWeight:600,cursor:"pointer"}}>×</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {vista==="corridas"&&(
          corridas.length===0?<div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:11}}>No hay corridas. Guardá desde la pestaña Monte Carlo.</div>
          :(
            <>
              <div style={{overflowX:"auto",marginBottom:10}}>
                <table className="cost-table">
                  <thead><tr><th>Nombre</th><th>Mes</th><th>N</th><th>VLSFO</th><th style={{color:"#86EFAC"}}>P10</th><th style={{color:"#FCD34D"}}>P50</th><th style={{color:"#FCA5A5"}}>P90</th><th>Spread</th><th>Fecha</th><th></th></tr></thead>
                  <tbody>{corridas.map(c=>(
                    <tr key={c.id}>
                      <td style={{fontWeight:600,color:C.navy,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.escenario_nombre}</td>
                      <td className="mono" style={{textAlign:"right"}}>{c.mes_analizado!==null?MESES[c.mes_analizado]:"Anual"}</td>
                      <td className="mono" style={{textAlign:"right"}}>{c.n_simulaciones?.toLocaleString()}</td>
                      <td className="mono" style={{textAlign:"right",color:C.orange,fontSize:9}}>${c.vlsfo_precio}</td>
                      <td className="mono" style={{textAlign:"right",color:C.p10}}>${c.p10?.toFixed(1)}</td>
                      <td className="mono" style={{textAlign:"right",color:C.p50}}>${c.p50?.toFixed(1)}</td>
                      <td className="mono" style={{textAlign:"right",color:C.p90}}>${c.p90?.toFixed(1)}</td>
                      <td className="mono" style={{textAlign:"right",color:C.orange}}>${c.spread?.toFixed(1)}</td>
                      <td style={{fontSize:8,color:C.muted}}>{new Date(c.created_at).toLocaleDateString("es-AR")}</td>
                      <td><button onClick={()=>eliminar("corridas_montecarlo",c.id)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:9,cursor:"pointer"}}>×</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {corridas.length>1&&(
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={corridas.slice(0,8).map(c=>({name:c.escenario_nombre.slice(0,12),p10:c.p10,p50:c.p50,p90:c.p90})).reverse()} margin={{top:5,right:8,left:0,bottom:30}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="name" tick={{fill:C.muted,fontSize:8}} angle={-20} textAnchor="end"/>
                    <YAxis tick={{fill:C.muted,fontSize:8}} domain={["auto","auto"]}/>
                    <Tooltip {...TTip} formatter={v=>[`$${v?.toFixed(1)}`]}/>
                    <Legend wrapperStyle={{fontSize:9}}/>
                    <Bar dataKey="p10" name="P10" fill={`${C.p10}88`} radius={[2,2,0,0]}/>
                    <Bar dataKey="p50" name="P50" fill={C.p50} radius={[2,2,0,0]}/>
                    <Bar dataKey="p90" name="P90" fill={`${C.p90}88`} radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

// ─── TAB AGENCIA PUERTO DE CARGA ──────────────────────────────────────────
function TabAgenciaZarate({p,set}) {
  const e1=calcEtapa1(p,0);
  const tReal=e1.tReal_dias;
  const diasDisp=p.agz_redondearDias?Math.ceil(tReal):tReal;
  const items=p.agz_items||[];
  const totalActivo=calcAgenciaZarate(p,tReal);
  const tnRef=p.cap_capacidadBarco||1;

  function updItem(id,field,val){
    set("agz_items",items.map(it=>it.id===id?{...it,[field]:val}:it));
  }

  return (
    <div>
      <div className="card">
        <div className="ct">⚓ Agencia Puerto de Carga</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>T. Real carga</div>
            <div style={{fontSize:16,fontWeight:700,color:"#1E293B",fontFamily:"ui-monospace,monospace"}}>{tReal.toFixed(2)}d</div>
          </div>
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>Total Agencia</div>
            <div style={{fontSize:16,fontWeight:700,color:"#1E293B",fontFamily:"ui-monospace,monospace"}}>${totalActivo.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
            <div style={{fontSize:9,color:"#64748B"}}>${(totalActivo/tnRef).toFixed(2)}/Tn</div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:600,color:C.mid,cursor:"pointer"}}>
            <input type="checkbox" checked={!!p.agz_redondearDias} onChange={e=>set("agz_redondearDias",e.target.checked)}/>
            Redondear días
          </label>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="cost-table" style={{tableLayout:"fixed",width:"100%"}}>
            <thead>
              <tr>
                <th style={{width:28}}>✓</th>
                <th style={{minWidth:160}}>Concepto</th>
                <th style={{width:110}}>Categoría</th>
                <th style={{width:80}}>Tipo</th>
                <th style={{textAlign:"right",width:100}}>USD unitario</th>
                <th style={{textAlign:"right",width:100}}>Total USD</th>
                <th style={{textAlign:"right",width:80}}>USD/Tn</th>
                <th style={{minWidth:100}}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it=>{
                const d=it.tipo==="diario"?diasDisp:1;
                const total=it.activo?(it.tipo==="diario"?it.usd*d:it.usd):0;
                return (
                  <tr key={it.id} style={{opacity:it.activo?1:0.45}}>
                    <td style={{textAlign:"center"}}>
                      <input type="checkbox" checked={!!it.activo} onChange={e=>updItem(it.id,"activo",e.target.checked)} style={{cursor:"pointer"}}/>
                    </td>
                    <td>
                      <input value={it.label} onChange={e=>updItem(it.id,"label",e.target.value)}
                        style={{background:"transparent",border:"none",width:"100%",fontSize:11,fontFamily:"Montserrat,sans-serif",color:C.navy,minWidth:160}}/>
                    </td>
                    <td>
                      <input value={it.categoria||""} onChange={e=>updItem(it.id,"categoria",e.target.value)}
                        placeholder="ej: Pilotaje"
                        style={{background:"transparent",border:"none",width:"100%",fontSize:10,fontFamily:"Montserrat,sans-serif",color:C.mid,minWidth:80}}/>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <select value={it.tipo} onChange={e=>updItem(it.id,"tipo",e.target.value)}
                        style={{fontSize:9,padding:"2px 4px",borderRadius:4,border:`1px solid ${C.border}`,background:it.tipo==="diario"?"#FEF3C7":"#F0FDF4",
                                color:it.tipo==="diario"?C.orange:C.green,fontWeight:700,cursor:"pointer"}}>
                        <option value="fijo">FIJO</option>
                        <option value="diario">DIARIO</option>
                      </select>
                    </td>
                    <td style={{textAlign:"right"}}>
                      <input type="number" value={it.usd} min={0} step={1}
                        onChange={e=>updItem(it.id,"usd",parseFloat(e.target.value)||0)}
                        style={{width:90,textAlign:"right",background:"#FFFBEB",border:`1px solid ${C.warnBorder}`,borderRadius:4,
                                padding:"3px 6px",fontSize:12,fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}/>
                    </td>
                    <td className="mono" style={{textAlign:"right",fontWeight:it.activo?700:400,color:it.activo?C.navy:C.mid}}>
                      {it.activo?`$${total.toLocaleString("es-AR",{maximumFractionDigits:0})}`:"—"}
                    </td>
                    <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:10,color:C.mid}}>
                      {it.activo?`$${(total/tnRef).toFixed(2)}`:"—"}
                    </td>
                    <td>
                      <input value={it.nota||""} onChange={e=>updItem(it.id,"nota",e.target.value)}
                        placeholder="nota..."
                        style={{background:"transparent",border:"none",width:"100%",fontSize:9,fontFamily:"Montserrat,sans-serif",color:C.mid,minWidth:100}}/>
                    </td>
                  </tr>
                );
              })}
              <tr className="total">
                <td colSpan={5} style={{textAlign:"right",fontSize:11}}>TOTAL AGENCIA PUERTO DE CARGA</td>
                <td className="mono" style={{textAlign:"right",fontSize:13}}>${totalActivo.toLocaleString("es-AR",{maximumFractionDigits:0})}</td>
                <td className="mono" style={{textAlign:"right",fontSize:11,color:C.mid}}>${(totalActivo/tnRef).toFixed(2)}/Tn</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="run" style={{fontSize:10,padding:"5px 12px"}}
            onClick={()=>set("agz_items",[...items,{id:`agz_${Date.now()}`,label:"Nuevo concepto",tipo:"fijo",usd:0,activo:true,nota:"",categoria:""}])}>
            + Agregar fila
          </button>
          <div className="warn-note" style={{flex:1}}>Los valores editados acá actualizan automáticamente el cálculo de Etapa 1 (Carga) y el Monte Carlo.</div>
        </div>
      </div>
      <div className="card">
        <div className="ct">Resumen por Categoría</div>
        <table className="cost-table">
          <thead><tr><th>Categoría</th><th style={{textAlign:"right"}}>Total USD</th><th style={{textAlign:"right"}}>USD/Tn</th></tr></thead>
          <tbody>
            {(()=>{
              const cats=[...new Set(items.filter(it=>it.activo&&it.categoria).map(it=>it.categoria))].sort();
              const result=cats.map(cat=>{
                const tot=items.filter(it=>it.activo&&it.categoria===cat).reduce((s,it)=>s+(it.tipo==="diario"?it.usd*diasDisp:it.usd),0);
                return <tr key={cat}><td style={{fontWeight:600,color:C.navy}}>{cat}</td><td className="mono" style={{textAlign:"right"}}>${tot.toLocaleString("es-AR",{maximumFractionDigits:0})}</td><td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:10,color:C.mid}}>${(tot/tnRef).toFixed(2)}</td></tr>;
              });
              const scTot=items.filter(it=>it.activo&&!it.categoria).reduce((s,it)=>s+(it.tipo==="diario"?it.usd*diasDisp:it.usd),0);
              if(scTot>0) result.push(<tr key="sc"><td style={{color:C.mid,fontStyle:"italic"}}>Sin categoría</td><td className="mono" style={{textAlign:"right",color:C.mid}}>${scTot.toLocaleString("es-AR",{maximumFractionDigits:0})}</td><td/></tr>);
              return result;
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB AGENCIA PUERTO DE DESCARGA ───────────────────────────────────────
function TabAgenciaBB({p,set}) {
  const e0=calcEtapaRepo(p);
  const e1=calcEtapa1(p,0);
  const e2=calcEtapa2(p);
  const costoArenaEq=e1.tnPostCarga>0?(e0.costoTotal+e1.costoTotal+e2.costoTotal)/e1.tnPostCarga:(p.cap_precioArenaOrigen||13.5);
  const e3=calcEtapa3({...p,_costoArenaEq:costoArenaEq},0,e1.tnPostCarga);
  const tReal=e3.tReal_dias;
  const diasDisp=p.abb_redondearDias?Math.ceil(tReal):tReal;
  const items=p.abb_items||[];
  const totalActivo=calcAgenciaBB(p,tReal);
  const tnRef=p.cap_capacidadBarco||1;

  function updItem(id,field,val){
    set("abb_items",items.map(it=>it.id===id?{...it,[field]:val}:it));
  }

  return (
    <div>
      <div className="card">
        <div className="ct">⚓ Agencia Puerto de Descarga</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>T. Real descarga</div>
            <div style={{fontSize:16,fontWeight:700,color:"#1E293B",fontFamily:"ui-monospace,monospace"}}>{tReal.toFixed(2)}d</div>
          </div>
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>Total Agencia</div>
            <div style={{fontSize:16,fontWeight:700,color:"#1E293B",fontFamily:"ui-monospace,monospace"}}>${totalActivo.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
            <div style={{fontSize:9,color:"#64748B"}}>${(totalActivo/tnRef).toFixed(2)}/Tn</div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:600,color:C.mid,cursor:"pointer"}}>
            <input type="checkbox" checked={!!p.abb_redondearDias} onChange={e=>set("abb_redondearDias",e.target.checked)}/>
            Redondear días
          </label>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="cost-table" style={{tableLayout:"fixed",width:"100%"}}>
            <thead>
              <tr>
                <th style={{width:28}}>✓</th>
                <th style={{minWidth:160}}>Concepto</th>
                <th style={{width:110}}>Categoría</th>
                <th style={{width:80}}>Tipo</th>
                <th style={{textAlign:"right",width:100}}>USD unitario</th>
                <th style={{textAlign:"right",width:100}}>Total USD</th>
                <th style={{textAlign:"right",width:80}}>USD/Tn</th>
                <th style={{minWidth:100}}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it=>{
                const d=it.tipo==="diario"?diasDisp:1;
                const total=it.activo?(it.tipo==="diario"?it.usd*d:it.usd):0;
                return (
                  <tr key={it.id} style={{opacity:it.activo?1:0.45}}>
                    <td style={{textAlign:"center"}}>
                      <input type="checkbox" checked={!!it.activo} onChange={e=>updItem(it.id,"activo",e.target.checked)} style={{cursor:"pointer"}}/>
                    </td>
                    <td>
                      <input value={it.label} onChange={e=>updItem(it.id,"label",e.target.value)}
                        style={{background:"transparent",border:"none",width:"100%",fontSize:11,fontFamily:"Montserrat,sans-serif",color:C.navy,minWidth:160}}/>
                    </td>
                    <td>
                      <input value={it.categoria||""} onChange={e=>updItem(it.id,"categoria",e.target.value)}
                        placeholder="ej: Pilotaje"
                        style={{background:"transparent",border:"none",width:"100%",fontSize:10,fontFamily:"Montserrat,sans-serif",color:C.mid,minWidth:80}}/>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <select value={it.tipo} onChange={e=>updItem(it.id,"tipo",e.target.value)}
                        style={{fontSize:9,padding:"2px 4px",borderRadius:4,border:`1px solid ${C.border}`,background:it.tipo==="diario"?"#FEF3C7":"#F0FDF4",
                                color:it.tipo==="diario"?C.orange:C.green,fontWeight:700,cursor:"pointer"}}>
                        <option value="fijo">FIJO</option>
                        <option value="diario">DIARIO</option>
                      </select>
                    </td>
                    <td style={{textAlign:"right"}}>
                      <input type="number" value={it.usd} min={0} step={1}
                        onChange={e=>updItem(it.id,"usd",parseFloat(e.target.value)||0)}
                        style={{width:90,textAlign:"right",background:"#FFFBEB",border:`1px solid ${C.warnBorder}`,borderRadius:4,
                                padding:"3px 6px",fontSize:12,fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}/>
                    </td>
                    <td className="mono" style={{textAlign:"right",fontWeight:it.activo?700:400,color:it.activo?C.navy:C.mid}}>
                      {it.activo?`$${total.toLocaleString("es-AR",{maximumFractionDigits:0})}`:"—"}
                    </td>
                    <td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:10,color:C.mid}}>
                      {it.activo?`$${(total/tnRef).toFixed(2)}`:"—"}
                    </td>
                    <td>
                      <input value={it.nota||""} onChange={e=>updItem(it.id,"nota",e.target.value)}
                        placeholder="nota..."
                        style={{background:"transparent",border:"none",width:"100%",fontSize:9,fontFamily:"Montserrat,sans-serif",color:C.mid,minWidth:100}}/>
                    </td>
                  </tr>
                );
              })}
              <tr className="total">
                <td colSpan={5} style={{textAlign:"right",fontSize:11}}>TOTAL AGENCIA PUERTO DE DESCARGA</td>
                <td className="mono" style={{textAlign:"right",fontSize:13}}>${totalActivo.toLocaleString("es-AR",{maximumFractionDigits:0})}</td>
                <td className="mono" style={{textAlign:"right",fontSize:11,color:C.mid}}>${(totalActivo/tnRef).toFixed(2)}/Tn</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="run" style={{fontSize:10,padding:"5px 12px"}}
            onClick={()=>set("abb_items",[...items,{id:`abb_${Date.now()}`,label:"Nuevo concepto",tipo:"fijo",usd:0,activo:true,nota:"",categoria:""}])}>
            + Agregar fila
          </button>
          <div className="warn-note" style={{flex:1}}>Los valores editados acá actualizan automáticamente el cálculo de Etapa 3 (Descarga) y el Monte Carlo.</div>
        </div>
      </div>
      <div className="card">
        <div className="ct">Resumen por Categoría</div>
        <table className="cost-table">
          <thead><tr><th>Categoría</th><th style={{textAlign:"right"}}>Total USD</th><th style={{textAlign:"right"}}>USD/Tn</th></tr></thead>
          <tbody>
            {(()=>{
              const cats=[...new Set(items.filter(it=>it.activo&&it.categoria).map(it=>it.categoria))].sort();
              const result=cats.map(cat=>{
                const tot=items.filter(it=>it.activo&&it.categoria===cat).reduce((s,it)=>s+(it.tipo==="diario"?it.usd*diasDisp:it.usd),0);
                return <tr key={cat}><td style={{fontWeight:600,color:C.navy}}>{cat}</td><td className="mono" style={{textAlign:"right"}}>${tot.toLocaleString("es-AR",{maximumFractionDigits:0})}</td><td style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:10,color:C.mid}}>${(tot/tnRef).toFixed(2)}</td></tr>;
              });
              const scTot=items.filter(it=>it.activo&&!it.categoria).reduce((s,it)=>s+(it.tipo==="diario"?it.usd*diasDisp:it.usd),0);
              if(scTot>0) result.push(<tr key="sc"><td style={{color:C.mid,fontStyle:"italic"}}>Sin categoría</td><td className="mono" style={{textAlign:"right",color:C.mid}}>${scTot.toLocaleString("es-AR",{maximumFractionDigits:0})}</td><td/></tr>);
              return result;
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function TabFAQ() {
  const [abierto, setAbierto] = useState(null);
  const secciones = [...new Set(FAQ_ITEMS.map(f=>f.seccion))];

  return (
    <div>
      <div className="card">
        <div className="ct">❓ Preguntas Frecuentes — Metodología del Modelo</div>
        <p style={{fontSize:11,color:C.mid,lineHeight:1.6,marginBottom:0}}>
          Explicaciones de los conceptos, fórmulas y decisiones de diseño detrás de la herramienta.
          Hacé clic en cada pregunta para expandir.
        </p>
      </div>

      {secciones.map(sec=>(
        <div key={sec} className="card">
          <div className="ct">{sec}</div>
          {FAQ_ITEMS.filter(f=>f.seccion===sec).map(item=>{
            const isOpen = abierto===item.id;
            return (
              <div key={item.id} style={{
                borderRadius:8, border:`1px solid ${isOpen?C.blue:C.border}`,
                marginBottom:8, overflow:"hidden",
                transition:"border-color .15s",
              }}>
                {/* Pregunta */}
                <button
                  onClick={()=>setAbierto(isOpen?null:item.id)}
                  style={{
                    width:"100%", display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"10px 14px", border:"none",
                    background:isOpen?"#EEF2F7":"#fff", cursor:"pointer", textAlign:"left",
                    gap:10,
                  }}>
                  <span style={{fontSize:12,fontWeight:700,color:isOpen?C.navy:C.mid,lineHeight:1.4}}>
                    {item.pregunta}
                  </span>
                  <span style={{
                    fontSize:16, color:isOpen?C.blue:C.mid, flexShrink:0,
                    transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s",
                  }}>▾</span>
                </button>

                {/* Respuesta */}
                {isOpen && (
                  <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,background:"#fff"}}>
                    {/* Texto con formato */}
                    <div style={{
                      fontSize:11, color:"#374151", lineHeight:1.8,
                      whiteSpace:"pre-wrap", fontFamily:"inherit", marginBottom:10,
                    }}>
                      {item.respuesta}
                    </div>

                    {/* Nota */}
                    {item.nota && (
                      <div style={{
                        background:"#FEF3C7", border:"1px solid #D4B84A", borderLeft:`3px solid #D4B84A`,
                        borderRadius:6, padding:"7px 11px", fontSize:10, color:"#92400E",
                        marginBottom:item.links.length?10:0,
                      }}>
                        ⚠️ {item.nota}
                      </div>
                    )}

                    {/* Links */}
                    {item.links.length>0 && (
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
                        {item.links.map(l=>(
                          <a key={l.url} href={l.url} target="_blank" rel="noreferrer"
                            style={{
                              fontSize:10, fontWeight:700, color:C.blue,
                              background:"#EEF2F7", border:`1px solid ${C.border}`,
                              borderRadius:5, padding:"4px 10px", textDecoration:"none",
                              display:"inline-flex", alignItems:"center", gap:4,
                            }}>
                            🔗 {l.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── TAB SENSIBILIDADES ────────────────────────────────────────────────────
function TabSensibilidades({p}) {
  const [mes, setMes] = useState(5);

  // Base
  const base = (() => {
    const e0 = calcEtapaRepo(p);
    const e1 = calcEtapa1(p, mes);
    const e2 = calcEtapa2(p);
    const eq  = e1.tnPostCarga > 0 ? (e0.costoTotal+e1.costoTotal+e2.costoTotal) / e1.tnPostCarga : p.cap_precioArenaOrigen;
    const e3  = calcEtapa3({...p, _costoArenaEq: eq}, mes, e1.tnPostCarga);
    const tot = e0.costoTotal+e1.costoTotal+e2.costoTotal+e3.costoTotal;
    return { usdTn: tot / e3.tnEntregadas, tnEnt: e3.tnEntregadas };
  })();

  function calcConDelta(overrides) {
    const pp = {...p, ...overrides};
    const e0 = calcEtapaRepo(pp);
    const e1 = calcEtapa1(pp, mes);
    const e2 = calcEtapa2(pp);
    const eq  = e1.tnPostCarga > 0 ? (e0.costoTotal+e1.costoTotal+e2.costoTotal) / e1.tnPostCarga : pp.cap_precioArenaOrigen;
    const e3  = calcEtapa3({...pp, _costoArenaEq: eq}, mes, e1.tnPostCarga);
    const tot = e0.costoTotal+e1.costoTotal+e2.costoTotal+e3.costoTotal;
    return tot / e3.tnEntregadas;
  }

  // Definición de sensibilidades
  const grupos = [
    {
      titulo: "Tiempos de espera portuaria",
      icon: "⏱️",
      items: [
        {
          label: "Espera en Zárate",
          unidad: "días",
          deltas: [-1, -0.5, +0.5, +1, +2],
          fn: d => calcConDelta({ cap_esperaDias: Math.max(0, p.cap_esperaDias + d) }),
          base_val: p.cap_esperaDias,
          nota: "Afecta TC, combustible puerto y agencia Zárate (ítems diarios)",
        },
        {
          label: `Espera en BB (${MESES[mes]})`,
          unidad: "días",
          deltas: [-1, -0.5, +0.5, +1, +2],
          fn: d => calcConDelta({ des_esperaBBMes: p.des_esperaBBMes.map((v,i) => i===mes ? Math.max(0,v+d) : v) }),
          base_val: p.des_esperaBBMes[mes],
          nota: "Afecta TC, combustible puerto y agencia BB (ítems diarios)",
        },
      ],
    },
    {
      titulo: "Velocidad de navegación",
      icon: "🧭",
      items: [
        {
          label: "Velocidad barco (ida cargado)",
          unidad: "kt (todos los tramos)",
          deltas: [-1, -0.5, +0.5, +1],
          fn: d => calcConDelta({ nav_tramos: p.nav_tramos.map(t => ({...t, velocidad: Math.max(6, t.velocidad + d)})) }),
          base_val: null,
          nota: "Velocidad menor → más días navegando → más TC y combustible. El consumo sube por la relación cúbica.",
        },
        {
          label: "Velocidad barco (vuelta lastre)",
          unidad: "kt (todos los tramos)",
          deltas: [-1, -0.5, +0.5, +1],
          fn: d => calcConDelta({ vta_tramos: (p.vta_tramos||p.nav_tramos).map(t => ({...t, velocidad: Math.max(6, t.velocidad + d)})) }),
          base_val: null,
          nota: "Impacto menor que la ida porque el consumo en lastre es ~20% inferior.",
        },
      ],
    },
    {
      titulo: "Costos del barco",
      icon: "🚢",
      items: [
        {
          label: "Time Charter",
          unidad: "USD/día",
          deltas: [-2000, -1000, +1000, +2000, +5000],
          fn: d => calcConDelta({ barco_timeCharter: Math.max(0, p.barco_timeCharter + d) }),
          base_val: p.barco_timeCharter,
          nota: "Impacta en todas las etapas proporcional a los días totales del ciclo.",
        },
        {
          label: "Precio VLSFO",
          unidad: "USD/T",
          deltas: [-100, -50, +50, +100, +200],
          fn: d => calcConDelta({ nav_escenarioVLSFO: "manual", nav_vlsfoManual: Math.max(200, p.nav_vlsfoManual + d) }),
          base_val: p.nav_vlsfoManual,
          nota: "Afecta navegación (mayor impacto) y estadía en puerto (menor impacto).",
        },
      ],
    },
    {
      titulo: "Precio y merma de arena",
      icon: "⛏️",
      items: [
        {
          label: "Precio arena en origen",
          unidad: "USD/Tn",
          deltas: [-2, -1, +1, +2, +5],
          fn: d => calcConDelta({ cap_precioArenaOrigen: Math.max(0, p.cap_precioArenaOrigen + d) }),
          base_val: p.cap_precioArenaOrigen,
          nota: "El precio de la arena es el componente de mayor peso absoluto en el costo total.",
        },
        {
          label: "Merma de carga",
          unidad: "%",
          deltas: [-0.5, -0.25, +0.25, +0.5, +1],
          fn: d => calcConDelta({ cap_pctMerma: Math.max(0, p.cap_pctMerma + d/100) }),
          base_val: p.cap_pctMerma * 100,
          nota: "Cada punto de merma extra significa más Tn compradas para el mismo embarque.",
        },
        {
          label: "Merma de descarga",
          unidad: "%",
          deltas: [-0.5, -0.25, +0.25, +0.5, +1],
          fn: d => calcConDelta({ des_pctMermaDescarga: Math.max(0, p.des_pctMermaDescarga + d/100) }),
          base_val: p.des_pctMermaDescarga * 100,
          nota: "Valorizada al precio equivalente (costo hasta llegada / Tn), no al precio origen.",
        },
      ],
    },
    {
      titulo: "Capacidad operativa",
      icon: "🏭",
      items: [
        {
          label: "Horas de trabajo/día — Carga",
          unidad: "hs",
          deltas: [-4, -2, +2, +4],
          fn: d => calcConDelta({ cap_horasDia: Math.min(24, Math.max(4, p.cap_horasDia + d)) }),
          base_val: p.cap_horasDia,
          nota: "Más horas por día → menor tiempo ideal → menor exposición climática y menos TC.",
        },
        {
          label: "Horas de trabajo/día — Descarga",
          unidad: "hs",
          deltas: [-4, -2, +2, +4],
          fn: d => calcConDelta({ des_horasDia: Math.min(24, Math.max(4, p.des_horasDia + d)) }),
          base_val: p.des_horasDia,
          nota: "Mismo efecto que en carga pero sobre el tiempo de descarga en BB.",
        },
      ],
    },
  ];

  const fmtDelta = (v) => {
    const d = v - base.usdTn;
    const color = d > 0 ? C.red : d < 0 ? C.green : C.mid;
    const sign  = d > 0 ? "+" : "";
    return { color, text: `${sign}${d.toFixed(2)}`, abs: `$${v.toFixed(1)}` };
  };

  return (
    <div>
      <div className="card">
        <div className="ct">📐 Análisis de Sensibilidades — Impacto en USD/Tn</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontSize:8,color:C.mid,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Mes de análisis (esperas y clima)</div>
            <MesSelector value={mes} onChange={setMes}/>
          </div>
          <div style={{background:C.navy,borderRadius:8,padding:"8px 16px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.5,fontWeight:700}}>Base actual</div>
            <div style={{fontSize:20,fontWeight:800,fontFamily:"DM Mono,monospace",color:"#FCD34D"}}>${base.usdTn.toFixed(1)} <span style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>USD/Tn</span></div>
          </div>
        </div>
        <div className="warn-note">Cada fila muestra el USD/Tn resultante si solo cambia esa variable. El color indica si el cambio sube (🔴) o baja (🟢) el costo.</div>
      </div>

      {grupos.map(grupo => (
        <div key={grupo.titulo} className="card">
          <div className="ct">{grupo.icon} {grupo.titulo}</div>
          {grupo.items.map(item => {
            const resultados = item.deltas.map(d => ({ d, usdTn: item.fn(d) }));
            return (
              <div key={item.label} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,flexWrap:"wrap",gap:4}}>
                  <div>
                    <span style={{fontSize:11,fontWeight:700,color:C.navy}}>{item.label}</span>
                    {item.base_val !== null && (
                      <span style={{fontSize:9,color:C.mid,marginLeft:6}}>base: <span style={{fontFamily:"DM Mono,monospace",color:C.gold}}>{item.base_val} {item.unidad}</span></span>
                    )}
                  </div>
                </div>

                {/* Tabla de resultados */}
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{background:"#EEF2F7"}}>
                        <th style={{padding:"5px 10px",textAlign:"left",fontSize:8,fontWeight:700,color:C.mid,textTransform:"uppercase",letterSpacing:.5,width:120}}>Δ {item.unidad}</th>
                        {resultados.map(r=>(
                          <th key={r.d} style={{padding:"5px 10px",textAlign:"center",fontSize:10,fontWeight:700,
                            color: r.d < 0 ? C.green : r.d > 0 ? C.red : C.mid}}>
                            {r.d > 0 ? `+${r.d}` : r.d}
                          </th>
                        ))}
                        <th style={{padding:"5px 10px",textAlign:"center",fontSize:9,fontWeight:700,color:C.gold,background:"#FFFBEB",borderLeft:`2px solid ${C.warnBorder}`}}>BASE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding:"6px 10px",fontSize:9,color:C.mid,fontWeight:600}}>USD/Tn resultado</td>
                        {resultados.map(r => {
                          const {color, abs} = fmtDelta(r.usdTn);
                          return (
                            <td key={r.d} style={{padding:"6px 10px",textAlign:"center",fontFamily:"DM Mono,monospace",fontWeight:700,color}}>
                              {abs}
                            </td>
                          );
                        })}
                        <td style={{padding:"6px 10px",textAlign:"center",fontFamily:"DM Mono,monospace",fontWeight:800,color:C.gold,background:"#FFFBEB",borderLeft:`2px solid ${C.warnBorder}`}}>
                          ${base.usdTn.toFixed(1)}
                        </td>
                      </tr>
                      <tr style={{background:"#F9FAFB"}}>
                        <td style={{padding:"4px 10px",fontSize:9,color:C.mid,fontWeight:600}}>Δ USD/Tn</td>
                        {resultados.map(r => {
                          const {color, text} = fmtDelta(r.usdTn);
                          return (
                            <td key={r.d} style={{padding:"4px 10px",textAlign:"center",fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:700,color}}>
                              {text}
                            </td>
                          );
                        })}
                        <td style={{padding:"4px 10px",textAlign:"center",fontSize:10,color:C.mid,background:"#FFFBEB",borderLeft:`2px solid ${C.warnBorder}`}}>—</td>
                      </tr>
                      <tr>
                        <td style={{padding:"4px 10px",fontSize:9,color:C.mid,fontWeight:600}}>Δ Costo total</td>
                        {resultados.map(r => {
                          const d = (r.usdTn - base.usdTn) * base.tnEnt;
                          const color = d > 0 ? C.red : d < 0 ? C.green : C.mid;
                          const sign = d > 0 ? "+" : "";
                          return (
                            <td key={r.d} style={{padding:"4px 10px",textAlign:"center",fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:600,color}}>
                              {sign}${Math.round(d/1000)}k
                            </td>
                          );
                        })}
                        <td style={{padding:"4px 10px",textAlign:"center",fontSize:10,color:C.mid,background:"#FFFBEB",borderLeft:`2px solid ${C.warnBorder}`}}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Barra visual */}
                <div style={{display:"flex",gap:3,marginTop:6,alignItems:"center",height:8}}>
                  {resultados.map(r => {
                    const d = r.usdTn - base.usdTn;
                    const maxD = Math.max(...resultados.map(x=>Math.abs(x.usdTn-base.usdTn)), 0.01);
                    const w = Math.abs(d) / maxD * 100;
                    return (
                      <div key={r.d} style={{flex:1,height:"100%",background:"#EEF2F7",borderRadius:3,overflow:"hidden",position:"relative"}}>
                        <div style={{position:"absolute",[d<0?"right":"left"]:d<0?`${100-w}%`:"0",width:`${w}%`,height:"100%",
                          background: d > 0 ? "#FCA5A5" : d < 0 ? "#86EFAC" : "transparent",borderRadius:3,transition:"width .3s"}}/>
                      </div>
                    );
                  })}
                </div>

                {item.nota && (
                  <div style={{fontSize:9,color:C.mid,marginTop:5,fontStyle:"italic"}}>{item.nota}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("barco");
  const [params,setParams]=useState(DEFAULT_PARAMS);
  const [mcResultado,setMcResultado]=useState(null);
  const set=useCallback((k,v)=>setParams(prev=>({...prev,[k]:v})),[]);
  const tot=useMemo(()=>calcTotal(params),[params]);

  const tabMap={
    barco:<TabBarco      p={params} set={set}/>,
    repo: <TabRepo       p={params} set={set}/>,
    az:   <TabAgenciaZarate p={params} set={set}/>,
    e1:   <TabCarga      p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e2:   <TabNavegacion p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    abb:  <TabAgenciaBB  p={params} set={set}/>,
    e3:   <TabDescarga   p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    mc:   <TabMC         p={params} set={set} resultado={mcResultado} setResultado={setMcResultado}/>,
    ev:   <TabEvaluacion p={params} tnEntregadas={tot.tnEntregadas}/>,
    sens: <TabSensibilidades p={params}/>,
    cl:   <TabClima      p={params} set={set}/>,
    cb:   <TabCombustible p={params} set={set}/>,
    sc:   <TabEscenarios p={params} onLoad={v=>setParams(v)}/>,
    faq:  <TabFAQ/>,
  };

  return (
    <>
      <style>{CSS}</style>
      <header className="hdr">
        <div className="hdr-brand">
          <div className="hdr-title">⛴️ {params.proyecto_titulo||"Transporte Arena"}</div>
          <div className="hdr-sub">Terra Mare Services</div>
        </div>
        <div className="hdr-kpis">
          {[
            {l:"USD/Tn",v:`$${tot.usdTn.toFixed(1)}`},
            {l:"Tn entregadas",v:tot.tnEntregadas.toFixed(0)},
            {l:"Días",v:`${tot.diasTotales.toFixed(1)}d`},
            {l:"Total",v:`$${(tot.costoTotal/1000).toFixed(0)}k`},
          ].map(({l,v})=>(
            <div key={l} className="hdr-kpi">
              <div className="hdr-kpi-v">{v}</div>
              <div className="hdr-kpi-l">{l}</div>
            </div>
          ))}
        </div>
        <button className="back" onClick={()=>window.open("https://evaluacion-proyectos.vercel.app","_self")}>← Portal</button>
      </header>
      <nav className="tabs">
        {TABS.map(t=>(
          <button key={t.id} className={`tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
      <div className="page">{tabMap[tab]}</div>
    </>
  );
}
