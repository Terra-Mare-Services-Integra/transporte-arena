import React, { useState, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  DEFAULT_PARAMS, MESES, FUENTES, CLIMA_DB_DEFAULT, VLSFO_HISTORICO_DEFAULT,
  VLSFO_ESCENARIOS, calcVLSFOStats, getPrecioVLSFO,
  calcEtapa1, calcEtapa2, calcEtapa3, calcEtapa4, calcTotal,
  getPctInopFromDB, getInopDetalle, velPromedioPonderada, checkEspejo,
  runMonteCarlo, runMCMensual,
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
  {id:"e1",label:"1. Carga",        icon:"⚓"},
  {id:"e2",label:"2. Nav. Ida",      icon:"🧭"},
  {id:"e3",label:"3. Descarga",     icon:"🏭"},
  {id:"e4",label:"4. Vuelta Lastre",icon:"↩️"},
  {id:"mc",label:"5. Monte Carlo",  icon:"🎲"},
  {id:"ev",label:"6. Evaluación",   icon:"📊"},
  {id:"cl",label:"7. Base Clima",   icon:"🌦️"},
  {id:"cb",label:"8. Base Combustible",icon:"⛽"},
  {id:"sc",label:"9. Escenarios",   icon:"💾"},
];

// ─── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Montserrat',sans-serif;background:#EEF2F7;color:#213363;min-height:100vh}
input[type=number],select{outline:none;font-family:'Montserrat',sans-serif}
input[type=range]{width:100%}
button{font-family:'Montserrat',sans-serif;cursor:pointer}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#A5B5CC;border-radius:3px}

.hdr{background:#213363;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:54px;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(33,51,99,.3)}
.hdr-brand{display:flex;flex-direction:column}
.hdr-title{font-size:12px;font-weight:800;color:#fff;letter-spacing:.3px}
.hdr-sub{font-size:9px;color:rgba(255,255,255,.4);font-family:'DM Mono',monospace}
.hdr-kpis{display:flex}
.hdr-kpi{padding:3px 14px;border-left:1px solid rgba(255,255,255,.12);text-align:right}
.hdr-kpi-v{font-size:14px;font-weight:800;color:#fff;font-family:'DM Mono',monospace}
.hdr-kpi-l{font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px}
.back{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);font-size:10px;font-weight:600;padding:4px 10px;border-radius:6px}
.back:hover{background:rgba(255,255,255,.2);color:#fff}

.tabs{background:#fff;border-bottom:1px solid #D6E0ED;display:flex;padding:0 24px;overflow-x:auto;position:sticky;top:54px;z-index:99}
.tab{padding:11px 14px;border:none;background:transparent;color:#6381A7;font-size:10px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s}
.tab.on{color:#213363;border-bottom-color:#235C96}
.tab:hover:not(.on){color:#213363;background:#EEF2F7}

.page{max-width:1240px;margin:0 auto;padding:18px 22px 60px}
.card{background:#fff;border:1px solid #D6E0ED;border-radius:10px;padding:14px 18px;margin-bottom:12px}
.ct{font-size:9px;font-weight:700;color:#235C96;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #D6E0ED;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}

.kpis{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.kpi{flex:1;min-width:95px;background:#EEF2F7;border:1px solid #D6E0ED;border-radius:8px;padding:9px 12px}
.kpi-v{font-size:17px;font-weight:800;line-height:1;font-family:'DM Mono',monospace}
.kpi-l{font-size:8px;color:#6381A7;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.kpi-u{font-size:9px;color:#6381A7;margin-top:2px}

.campo{margin-bottom:8px}
.campo-label{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;min-height:24px;align-content:center}
.campo-input{width:100%;border-radius:6px;padding:5px 9px;font-size:12px;border-width:1px;border-style:solid;font-family:'Montserrat',sans-serif}
.campo-formula{width:100%;border-radius:6px;padding:5px 9px;font-size:12px;font-family:'DM Mono',monospace;border-width:1px;border-style:solid}

.tipo-badge{display:inline-flex;align-items:center;font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:.3px;text-transform:uppercase}

.trow{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.tbtn{padding:4px 10px;border-radius:6px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:10px;font-weight:600;transition:all .15s}
.tbtn.on{background:#213363;border-color:#213363;color:#fff}

/* COST TABLE */
.cost-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
.cost-table th{padding:6px 9px;background:#213363;color:rgba(255,255,255,.7);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:left}
.cost-table th:nth-child(3),.cost-table td:nth-child(3){text-align:right;color:#6381A7}
.cost-table th:last-child,.cost-table td:last-child{text-align:right}
.cost-table td{padding:6px 9px;border-bottom:1px solid #EEF2F7}
.cost-table tr:nth-child(even) td{background:#F9FAFB}
.cost-table tr.total td{background:#EEF2F7;font-weight:800;font-size:12px}
.cost-table .mono{font-family:'DM Mono',monospace}
.cost-table .eq{font-size:9px;color:#6381A7;font-family:'DM Mono',monospace}

/* HOVER TOOLTIP */
.hv{position:relative;display:inline-block;cursor:help;border-bottom:1px dashed #A5B5CC}
.hv:hover .hvt{display:block}
.hvt{display:none;position:absolute;bottom:calc(100% + 5px);right:0;background:#213363;border:1px solid #1a3356;border-radius:8px;padding:10px 14px;min-width:260px;max-width:360px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.hvt-title{font-size:8px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:700}
.hvt-line{font-size:10px;color:rgba(255,255,255,.85);font-family:'DM Mono',monospace;padding:1px 0;line-height:1.5}

.run{padding:8px 20px;border-radius:8px;border:none;background:#213363;color:#fff;font-size:11px;font-weight:700;transition:all .2s;letter-spacing:.3px}
.run:hover:not(:disabled){background:#235C96}
.run:disabled{background:#A5B5CC;cursor:not-allowed}

.pbadge{flex:1;min-width:100px;border-radius:8px;padding:10px 12px;border-width:1px;border-style:solid}
.pbadge-v{font-size:18px;font-weight:800;font-family:'DM Mono',monospace;line-height:1}
.pbadge-l{font-size:8px;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.pbadge-d{font-size:9px;margin-top:3px;opacity:.75}

.espejo-warn{background:#FEF3C7;border:1px solid #D4B84A;border-radius:8px;padding:7px 12px;margin-bottom:10px;font-size:11px;color:#92400E}
.espejo-ok{background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:6px 12px;margin-bottom:10px;font-size:10px;color:#166534}
.src-note{font-size:10px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:6px;padding:6px 10px;margin-top:5px;color:#166534;border-left:3px solid #86EFAC}
.warn-note{font-size:10px;background:#FEF3C7;border:1px solid #D4B84A;border-radius:6px;padding:6px 10px;margin-top:5px;color:#92400E;border-left:3px solid #D4B84A}

.mes-selector{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.mes-btn{padding:3px 9px;border-radius:5px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:9px;font-weight:600;transition:all .15s}
.mes-btn.on{background:#213363;border-color:#213363;color:#fff}

.mc-var-row{display:grid;grid-template-columns:160px 160px 180px 80px;gap:6px;padding:5px 8px;border-radius:5px;font-size:10px;align-items:center}
.mc-var-row:nth-child(odd){background:#EEF2F7}

.tramo-input{width:54px;border-radius:5px;padding:3px 5px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace;text-align:center;border-width:1px;border-style:solid}
.mapa-svg{width:100%;border-radius:8px;background:#EFF6FF;border:1px solid #D6E0ED}

/* VLSFO WIDGET */
.vlsfo-widget{background:linear-gradient(135deg,#213363,#1a2a50);border-radius:10px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.vlsfo-price{font-size:28px;font-weight:800;color:#fff;font-family:'DM Mono',monospace;line-height:1}
.vlsfo-label{font-size:8px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.vlsfo-refs{display:flex;gap:12px;flex:1}
.vlsfo-ref{text-align:center}
.vlsfo-ref-v{font-size:14px;font-weight:700;font-family:'DM Mono',monospace}
.vlsfo-ref-l{font-size:8px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px}
.vlsfo-escenarios{display:flex;gap:4px;flex-wrap:wrap}
.vlsfo-btn{padding:4px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:10px;font-weight:600;transition:all .15s;cursor:pointer;font-family:'Montserrat',sans-serif}
.vlsfo-btn.on{background:rgba(255,255,255,.25);border-color:rgba(255,255,255,.5);color:#fff}
.vlsfo-posicion{font-size:11px;font-weight:700;padding:3px 10px;border-radius:5px}

/* CLIMA TABLE */
.clima-table{width:100%;border-collapse:collapse;font-size:11px}
.clima-table th{padding:6px 8px;background:#213363;color:rgba(255,255,255,.7);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:center}
.clima-table td{padding:4px 6px;border-bottom:1px solid #EEF2F7;text-align:center}
.clima-table tr:nth-child(even) td{background:#F9FAFB}
.clima-table input{width:58px;background:#FFFBEB;border:1px solid #D4B84A;border-radius:4px;padding:2px 4px;color:#78610E;font-size:10px;text-align:center;font-family:'DM Mono',monospace}
.clima-table .calc{background:#F9FAFB;border:1px solid #D1D5DB;border-radius:4px;padding:2px 5px;color:#374151;font-size:10px;font-family:'DM Mono',monospace;display:inline-block;min-width:48px}

/* EVAL TABLE */
.eval-table{width:100%;border-collapse:collapse;font-size:12px}
.eval-table th{padding:8px 12px;background:#213363;color:rgba(255,255,255,.8);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:left}
.eval-table th:last-child,.eval-table td:last-child{text-align:right}
.eval-table th:nth-child(3),.eval-table td:nth-child(3){text-align:right}
.eval-table td{padding:8px 12px;border-bottom:1px solid #EEF2F7;font-size:12px}
.eval-table tr.subtotal td{background:#F3F4F6;font-weight:700}
.eval-table tr.etapa-hdr td{background:#EEF2F7;font-weight:800;color:#213363;font-size:11px;letter-spacing:.5px;text-transform:uppercase}
.eval-table tr.grand-total td{background:#213363;color:#fff;font-weight:800;font-size:14px}
.eval-table .mono{font-family:'DM Mono',monospace}
`;

// ─── UI HELPERS ────────────────────────────────────────────────────────────
const TipoBadge = ({tipo}) => {
  const cfg={usuario:{bg:"#FFFBEB",c:"#78610E",l:"Input"},input:{bg:"#FFFBEB",c:"#78610E",l:"Input"},
    estadistico:{bg:"#DCFCE7",c:"#166534",l:"Estadístico"},stat:{bg:"#DCFCE7",c:"#166534",l:"Estadístico"},
    formula:{bg:"#F3F4F6",c:"#374151",l:"Fórmula"}};
  const s=cfg[tipo]||cfg.formula;
  return <span className="tipo-badge" style={{background:s.bg,color:s.c}}>{s.l}</span>;
};

const FuenteLink = ({fuente}) => (
  <a href={fuente.url} target="_blank" rel="noreferrer"
    style={{fontSize:8,color:C.blue,textDecoration:"none",borderBottom:"1px dashed #235C96",marginLeft:4}}>
    {fuente.label} ↗
  </a>
);

const Campo = ({label,value,onChange,tipo="usuario",unit,min,max,step=1,nota}) => {
  const st=T[tipo]||T.formula;
  return (
    <div className="campo">
      <div className="campo-label" style={{color:st.label}}>
        {label}{unit?` (${unit})`:""}<TipoBadge tipo={tipo}/>
      </div>
      {tipo==="formula"||tipo==="stat"?(
        <div className="campo-formula" style={{background:st.bg,borderColor:st.border,color:st.text}}>{value}</div>
      ):(
        <input className="campo-input" type="number" value={value} min={min} max={max} step={step}
          onChange={e=>onChange&&onChange(parseFloat(e.target.value)||0)}
          style={{background:st.bg,borderColor:st.border,color:st.text}}/>
      )}
      {nota&&<div style={{fontSize:9,color:st.label,marginTop:2}}>{nota}</div>}
    </div>
  );
};

const Toggle = ({label,options,value,onChange,tipo="usuario"}) => {
  const st=T[tipo]||T.formula;
  return (
    <div style={{marginBottom:10}}>
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
  <span className="hv" style={{fontFamily:"DM Mono,monospace",fontWeight:isTotal?800:600,fontSize:isTotal?13:12,color:color||C.navy}}>
    {value}
    <span className="hvt">
      <span className="hvt-title">{title}</span>
      {(Array.isArray(lines)?lines:[lines]).map((l,i)=><span key={i} className="hvt-line" style={{display:"block"}}>{l}</span>)}
    </span>
  </span>
);

const EspejoCheck = ({p}) => {
  const checks=(checkEspejo(p)||[]).filter(Boolean);
  const hasDiff=checks.some(c=>c.difiere);
  if(!hasDiff) return <div className="espejo-ok">✓ Campos espejo carga ↔ descarga iguales.</div>;
  return (
    <div className="espejo-warn">
      ⚠️ Difieren:
      {checks.filter(c=>c.difiere).map((c,i)=>(
        <span key={i} style={{marginLeft:8}}><strong>{c.label}</strong>: Carga={c.valCap} Desc={c.valDes}</span>
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

// ─── VLSFO WIDGET ──────────────────────────────────────────────────────────
function VLSFOWidget({p,set}) {
  const stats=calcVLSFOStats(p.vlsfo_historico);
  const precioActivo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const pctColor=stats.pctVsPromedio12m>15?"#ff6b6b":stats.pctVsPromedio12m>5?"#ffa94d":"#69db7c";

  return (
    <div className="vlsfo-widget">
      <div>
        <div className="vlsfo-label">VLSFO en modelo</div>
        <div className="vlsfo-price">${precioActivo}<span style={{fontSize:14,opacity:.6}}>/T</span></div>
        <span className="vlsfo-posicion" style={{background:pctColor+"33",color:pctColor,marginTop:4,display:"inline-block"}}>
          {stats.pctVsPromedio12m>0?"+":""}{stats.pctVsPromedio12m.toFixed(1)}% vs prom 12M
        </span>
      </div>
      <div className="vlsfo-refs">
        {[
          {l:"Valor hoy",   v:`$${stats.actual}`},
          {l:"Prom 12M",    v:`$${stats.prom12m.toFixed(0)}`},
          {l:"Prom 5 años", v:`$${stats.prom5a.toFixed(0)}`},
          {l:"Mín 5 años",  v:`$${stats.min5a}`},
          {l:"Máx 5 años",  v:`$${stats.max5a}`},
        ].map(({l,v})=>(
          <div key={l} className="vlsfo-ref">
            <div className="vlsfo-ref-v" style={{color:"rgba(255,255,255,.85)"}}>{v}</div>
            <div className="vlsfo-ref-l">{l}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="vlsfo-label" style={{marginBottom:5}}>ESCENARIO</div>
        <div className="vlsfo-escenarios">
          {VLSFO_ESCENARIOS.map(e=>(
            <button key={e.id} className={`vlsfo-btn ${p.nav_escenarioVLSFO===e.id?"on":""}`}
              onClick={()=>set("nav_escenarioVLSFO",e.id)} title={e.desc}>
              {e.label}
            </button>
          ))}
        </div>
        {p.nav_escenarioVLSFO==="manual"&&(
          <div style={{marginTop:6}}>
            <input type="number" value={p.nav_vlsfoManual} min={100} max={2000} step={10}
              onChange={e=>set("nav_vlsfoManual",parseFloat(e.target.value)||0)}
              style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",
                borderRadius:6,padding:"4px 10px",color:"#fff",fontSize:13,width:100,fontFamily:"DM Mono,monospace"}}/>
            <span style={{color:"rgba(255,255,255,.5)",fontSize:10,marginLeft:4}}>USD/T</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COST TABLE ────────────────────────────────────────────────────────────
function CostTable({rows,tnEntregadas}) {
  return (
    <table className="cost-table">
      <thead>
        <tr><th>Concepto</th><th>Ecuación</th><th>USD/Tn</th><th>Total USD</th></tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>{
          const usdTn=tnEntregadas>0?r.total/tnEntregadas:0;
          return (
            <tr key={i} className={r.isTotal?"total":""}>
              <td style={{fontWeight:r.isTotal?800:500,color:r.isTotal?C.navy:undefined}}>{r.label}</td>
              <td className="eq">{r.eq}</td>
              <td className="mono" style={{textAlign:"right",color:C.mid}}>${usdTn.toFixed(1)}</td>
              <td style={{textAlign:"right"}}>
                <HoverVal value={`$${r.total.toLocaleString("es-AR",{maximumFractionDigits:0})}`}
                  title={r.label} lines={r.hover||[r.eq]} isTotal={r.isTotal}/>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── MAPA SVG ──────────────────────────────────────────────────────────────
function MapaNavegacion({tramos,onUpdate,vuelta=false}) {
  const {velProm,totalMn,totalHrs}=velPromedioPonderada(tramos);
  const puntos=[
    {x:55,y:72,n:"Zárate",s:"Km 102"},{x:175,y:112,n:"Confluencia",s:"Paraná/Uruguay"},
    {x:305,y:155,n:"Río de la Plata",s:"Estuario"},{x:455,y:197,n:"Punta Indio",s:"Canal Ppal."},
    {x:635,y:255,n:"Rada BB",s:"Exterior"},{x:735,y:280,n:"Sea White",s:"Bahía Blanca"},
  ];
  const cols={"Hidrovía":"#235C96","Estuario":"#0D7490","Costero":"#166534","Puerto":"#5B21B6"};
  return (
    <div>
      <svg viewBox="0 0 800 320" className="mapa-svg" style={{minHeight:190}}>
        <defs><linearGradient id="agua" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#DBEAFE"/><stop offset="100%" stopColor="#BFDBFE"/></linearGradient></defs>
        <rect width="800" height="320" fill="url(#agua)" rx="8"/>
        <path d="M0,52 Q80,42 180,92 Q280,132 380,162 Q500,193 650,235 Q720,259 800,275 L800,320 L0,320 Z" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1"/>
        {tramos.map((t,i)=>{
          const a=puntos[i],b=puntos[i+1];if(!a||!b)return null;
          const c=cols[t.tipo]||C.blue,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
          return (<g key={t.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={vuelta?2:3} strokeDasharray={vuelta?"6,3":""} opacity={.8}/>
            <rect x={mx-18} y={my-10} width={36} height={16} rx={3} fill={c} opacity={.9}/>
            <text x={mx} y={my+2} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="DM Mono,monospace">{t.velocidad}kt</text>
          </g>);
        })}
        {puntos.map((pt,i)=>(
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={6} fill={i===0?"#213363":i===5?"#166534":"#235C96"} stroke="#fff" strokeWidth={2}/>
            <text x={pt.x} y={pt.y-11} textAnchor="middle" fontSize="8" fontWeight="700" fill="#213363">{pt.n}</text>
            <text x={pt.x} y={pt.y-3} textAnchor="middle" fontSize="6" fill="#6381A7">{pt.s}</text>
          </g>
        ))}
        <rect x={6} y={288} width={200} height={25} rx={4} fill="rgba(33,51,99,.85)"/>
        <text x={13} y={298} fontSize="7" fill="rgba(255,255,255,.5)" fontWeight="600">VELOCIDAD PROM PONDERADA</text>
        <text x={13} y={308} fontSize="11" fill="#fff" fontWeight="800" fontFamily="DM Mono,monospace">{velProm.toFixed(1)}kt · {totalMn}mn · {totalHrs.toFixed(1)}hs</text>
        {vuelta&&<text x={670} y={22} fontSize="9" fill="#6381A7" fontWeight="700">↩ VUELTA EN LASTRE</text>}
        {!vuelta&&<text x={690} y={22} fontSize="9" fill="#235C96" fontWeight="700">→ IDA CARGADO</text>}
      </svg>
      {!vuelta&&(
        <div style={{marginTop:8,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:C.navy}}>{["Tramo","Tipo","Dist (mn)","Vel (kt)","Horas","Condición"].map(h=>(
              <th key={h} style={{padding:"6px 8px",color:"rgba(255,255,255,.6)",fontSize:8,textAlign:"left",fontWeight:600,textTransform:"uppercase"}}>{h}</th>
            ))}</tr></thead>
            <tbody>{tramos.map((t,i)=>(
              <tr key={t.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"6px 8px",color:C.navy,fontWeight:600,fontSize:10}}>{t.nombre}</td>
                <td style={{padding:"6px 8px"}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:`${cols[t.tipo]||C.blue}18`,color:cols[t.tipo]||C.blue,fontWeight:700}}>{t.tipo}</span></td>
                <td style={{padding:"6px 8px"}}>
                  <input className="tramo-input" type="number" value={t.distancia} min={1} max={1000} step={5}
                    style={{background:T.formula.bg,borderColor:T.formula.border,color:T.formula.text}}
                    onChange={e=>{const arr=[...tramos];arr[i]={...t,distancia:parseFloat(e.target.value)||0};onUpdate(arr);}}/>
                </td>
                <td style={{padding:"6px 8px"}}>
                  <input className="tramo-input" type="number" value={t.velocidad} min={1} max={20} step={0.5}
                    style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}
                    onChange={e=>{const arr=[...tramos];arr[i]={...t,velocidad:parseFloat(e.target.value)||0};onUpdate(arr);}}/>
                </td>
                <td style={{padding:"6px 8px",color:C.gold,fontWeight:700,fontFamily:"DM Mono,monospace",fontSize:10}}>{(t.distancia/t.velocidad).toFixed(1)}</td>
                <td style={{padding:"6px 8px",color:C.mid,fontSize:9}}>{t.condicion}</td>
              </tr>
            ))}
            <tr style={{background:"#EEF2F7",fontWeight:700}}>
              <td style={{padding:"7px 8px",color:C.navy}} colSpan={2}>TOTAL / PROMEDIO</td>
              <td style={{padding:"7px 8px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalMn}mn</td>
              <td style={{padding:"7px 8px",color:C.blue,fontFamily:"DM Mono,monospace",fontSize:13}}>{velProm.toFixed(1)}kt ⌀</td>
              <td style={{padding:"7px 8px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalHrs.toFixed(1)}hs</td>
              <td style={{padding:"7px 8px",color:C.mid,fontSize:9}}>{(totalHrs/24).toFixed(1)}días</td>
            </tr></tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── TAB E1: CARGA ─────────────────────────────────────────────────────────
function TabCarga({p,set,tnEntregadas}) {
  const [mes,setMes]=useState(5);
  const e1=calcEtapa1(p,mes);
  const costRows=[
    {label:"Costo arena",      eq:`$${e1.precioArena}×${p.cap_capacidadBarco.toLocaleString()}Tn`,total:e1.costoArena,   hover:[e1.hoverTotal[0]]},
    {label:"Costo merma",      eq:`$${e1.precioArena}×${e1.mermaTn.toFixed(0)}Tn`,               total:e1.costoMerma,   hover:[e1.hoverTotal[1]]},
    {label:"Opex carga",       eq:`$${p.cap_opexUSDTn}/Tn×${p.cap_capacidadBarco.toLocaleString()}Tn`,total:e1.costoOpex,hover:[e1.hoverTotal[2]]},
    {label:"Combustible puerto",eq:`${e1.tReal_dias.toFixed(1)}d×${p.nav_consumoPuerto}T/d×$${e1.vlsfo}`,total:e1.combPuerto,hover:e1.hoverComb},
    {label:"Time Charter",     eq:`${e1.tReal_dias.toFixed(1)}d×$${p.nav_timeCharter}/d`,        total:e1.fleteEtapa,   hover:[e1.hoverTotal[4]]},
    {label:"Agencia Zárate",   eq:"costo fijo por escala",                                        total:e1.agencia,      hover:[e1.hoverTotal[5]]},
    {label:"TOTAL ETAPA 1",    eq:"Σ costos carga",                                               total:e1.costoTotal,   hover:e1.hoverTotal,isTotal:true},
  ];
  return (
    <div>
      <VLSFOWidget p={p} set={set}/>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:9,color:C.muted,marginBottom:4,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>Mes de análisis</div>
        <MesSelector value={mes} onChange={setMes}/>
      </div>
      <div className="kpis">
        <KPI label="Vel. carga ideal" value={`${e1.velIdeal_TnMin.toFixed(1)}Tn/min`} color={T.formula.text}/>
        <KPI label="T. ideal" value={`${e1.tIdeal_dias.toFixed(1)}d`} color={T.formula.text}/>
        <KPI label="T. real" value={`${e1.tReal_dias.toFixed(1)}d`} color={C.gold}/>
        <KPI label="Inop. clima" value={`${(e1.pInop*100).toFixed(1)}%`} color={C.orange}/>
        <KPI label="Merma carga" value={`${e1.mermaTn.toFixed(0)}Tn`} unit={`${(p.cap_pctMerma*100).toFixed(1)}%`} color={C.red}/>
        <KPI label="USD/Tn etapa" value={`$${(e1.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div className="g2">
        <div>
          <div className="card">
            <div className="ct">Parámetros Físicos <TipoBadge tipo="usuario"/></div>
            <div className="g3">
              <Campo label="Capacidad" value={p.cap_capacidadBarco} onChange={v=>set("cap_capacidadBarco",v)} tipo="usuario" unit="Tn" min={1000} max={80000} step={1000}/>
              <Campo label="Densidad" value={p.cap_densidadArena} onChange={v=>set("cap_densidadArena",v)} tipo="usuario" unit="T/m³" min={1} max={2} step={0.05}/>
              <Campo label="Grampada" value={p.cap_grampada} onChange={v=>set("cap_grampada",v)} tipo="usuario" unit="m³" min={5} max={30}/>
              <Campo label="Grúas" value={p.cap_gruas} onChange={v=>set("cap_gruas",v)} tipo="usuario" min={1} max={4}/>
              <Campo label="Mov/min" value={p.cap_movGrampa} onChange={v=>set("cap_movGrampa",v)} tipo="usuario" unit="mov/min" min={0.1} max={2} step={0.1}/>
              <Campo label="Precio arena" value={p.cap_precioArenaOrigen} onChange={v=>set("cap_precioArenaOrigen",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Opex carga" value={p.cap_opexUSDTn} onChange={v=>set("cap_opexUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Agencia Zárate" value={p.cap_agenciaZarate} onChange={v=>set("cap_agenciaZarate",v)} tipo="usuario" unit="USD" min={0} step={500}/>
              <Campo label="Espera Zárate" value={p.cap_esperaDias} onChange={v=>set("cap_esperaDias",v)} tipo="usuario" unit="días" min={0} max={5} step={0.25} nota="Puerto propio"/>
            </div>
            <Toggle label="Horas trabajo/día" options={[4,8,12,24]} value={p.cap_horasDia} onChange={v=>set("cap_horasDia",v)} tipo="usuario"/>
            <Campo label="Merma de carga" value={p.cap_pctMerma*100} onChange={v=>set("cap_pctMerma",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1} nota="Derrames grampa, vuelo de material"/>
          </div>
          <div className="card">
            <div className="ct">Inoperabilidad Climática — Zárate <TipoBadge tipo="estadistico"/> <FuenteLink fuente={FUENTES.climaZarate}/></div>
            <div className="g2">
              <Campo label="Lluvia inoperable desde" value={p.cap_inopLluvia} onChange={v=>set("cap_inopLluvia",v)} tipo="usuario" unit="mm/día" min={5} max={100} step={5}/>
              <Campo label="Viento inoperable desde" value={p.cap_inopViento} onChange={v=>set("cap_inopViento",v)} tipo="usuario" unit="km/h" min={20} max={100} step={5}/>
            </div>
            <div className="g2">
              <Campo tipo="formula" label="% días inhábiles" value={`${(e1.pInop*100).toFixed(1)}%`}/>
              <Campo tipo="formula" label="Días extra clima" value={`${e1.diasInop.toFixed(1)} días`}/>
            </div>
            <div className="warn-note">⚠️ Datos estimados — validar SMN. Ver pestaña Base Clima.</div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="ct">Fórmulas — Velocidad y Tiempo <TipoBadge tipo="formula"/></div>
            <table className="cost-table">
              <thead><tr><th>Variable</th><th>Ecuación</th><th colSpan={2}>Resultado</th></tr></thead>
              <tbody>
                {[
                  {l:"Vel. ideal",    eq:`${p.cap_gruas}×${p.cap_grampada}×${p.cap_densidadArena}×${p.cap_movGrampa}`,v:`${e1.velIdeal_TnMin.toFixed(1)}Tn/min`,hover:e1.hoverVel},
                  {l:"Vel./hora",     eq:"velMin×60",                                      v:`${e1.velIdeal_TnHr.toFixed(0)}Tn/hr`,  hover:`${e1.velIdeal_TnMin.toFixed(1)}×60=${e1.velIdeal_TnHr.toFixed(0)}Tn/hr`},
                  {l:"T ideal (hs)",  eq:"capacidad/vel_hr",                                v:`${e1.tIdeal_hr.toFixed(1)}hs`,         hover:e1.hoverTIdeal},
                  {l:"T ideal (días)",eq:"horas/horasTrab/día",                             v:`${e1.tIdeal_dias.toFixed(1)}días`,     hover:e1.hoverTIdeal},
                  {l:"Días inop.",    eq:"tIdeal×pInop÷(1−pInop)",                          v:`${e1.diasInop.toFixed(1)}días`,        hover:e1.hoverInop},
                  {l:"T real carga",  eq:"tIdeal+inop+espera",                              v:`${e1.tReal_dias.toFixed(1)}días`,      hover:e1.hoverTReal},
                  {l:"Merma (Tn)",    eq:`${p.cap_capacidadBarco}×${(p.cap_pctMerma*100).toFixed(1)}%`,v:`${e1.mermaTn.toFixed(0)}Tn`,hover:e1.hoverMerma},
                  {l:"Tn post-carga", eq:"capacidad−merma",                                 v:`${e1.tnPostCarga.toFixed(0)}Tn`,       hover:`${p.cap_capacidadBarco}−${e1.mermaTn.toFixed(0)}=${e1.tnPostCarga.toFixed(0)}Tn`},
                ].map((r,i)=>(
                  <tr key={i}><td style={{fontWeight:600,color:C.navy,fontSize:11}}>{r.l}</td>
                    <td className="eq">{r.eq}</td>
                    <td colSpan={2}><HoverVal value={r.v} title={r.l} lines={Array.isArray(r.hover)?r.hover:[r.hover]}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="ct">Costos Etapa 1</div>
            <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E2: NAVEGACIÓN ────────────────────────────────────────────────────
function TabNavegacion({p,set,tnEntregadas}) {
  const e2=calcEtapa2(p);
  const costRows=[
    {label:"Combustible ida", eq:`${e2.diasNav.toFixed(1)}d×${p.nav_consumoNavegando}T/d×$${e2.vlsfo}`,total:e2.combNav,  hover:e2.hoverComb},
    {label:"Time Charter ida",eq:`${e2.diasNav.toFixed(1)}d×$${p.nav_timeCharter}/d`,                  total:e2.fleteNav, hover:[e2.hoverTotal[1]]},
    {label:"TOTAL ETAPA 2",   eq:"Σ costos navegación ida",                                             total:e2.costoTotal,hover:e2.hoverTotal,isTotal:true},
  ];
  return (
    <div>
      <VLSFOWidget p={p} set={set}/>
      <div className="kpis">
        <KPI label="Vel. promedio" value={`${e2.velProm.toFixed(1)}kt`} color={T.formula.text}/>
        <KPI label="Distancia" value={`${e2.totalMn}mn`} color={T.input.text}/>
        <KPI label="Días navegación" value={`${e2.diasNav.toFixed(1)}d`} color={T.formula.text}/>
        <KPI label="VLSFO activo" value={`$${e2.vlsfo}/T`} color={C.orange}/>
        <KPI label="Combustible ida" value={`$${(e2.combNav/1000).toFixed(0)}k`} color={C.gold}/>
        <KPI label="USD/Tn etapa" value={`$${(e2.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div className="card">
        <div className="ct">Ruta — Zárate → Sea White</div>
        <MapaNavegacion tramos={p.nav_tramos} onUpdate={arr=>set("nav_tramos",arr)}/>
      </div>
      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros Navegación <TipoBadge tipo="usuario"/></div>
          <div className="g2">
            <Campo label="Time Charter" value={p.nav_timeCharter} onChange={v=>set("nav_timeCharter",v)} tipo="usuario" unit="USD/día" min={5000} max={50000} step={500}/>
            <Campo label="Consumo navegando" value={p.nav_consumoNavegando} onChange={v=>set("nav_consumoNavegando",v)} tipo="usuario" unit="T/día" min={5} max={40} step={0.5}/>
            <Campo label="Consumo en puerto" value={p.nav_consumoPuerto} onChange={v=>set("nav_consumoPuerto",v)} tipo="usuario" unit="T/día" min={1} max={20} step={0.5} nota="Aplica etapas 1 y 3"/>
          </div>
        </div>
        <div className="card">
          <div className="ct">Costos Etapa 2 <TipoBadge tipo="formula"/></div>
          <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
          <div style={{marginTop:8,padding:"7px 10px",background:"#EEF2F7",borderRadius:7,fontSize:10,color:C.muted}}>
            Vel. prom. ponderada: <HoverVal value={`${e2.velProm.toFixed(1)}kt`} title="Velocidad Promedio Ponderada" lines={[e2.hoverVelProm]}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E3: DESCARGA ──────────────────────────────────────────────────────
function TabDescarga({p,set,tnEntregadas}) {
  const [mes,setMes]=useState(5);
  const e1=calcEtapa1(p,mes);
  const e3=calcEtapa3(p,mes,e1.tnPostCarga);
  const costRows=[
    {label:"Opex descarga",    eq:`$${p.des_opexUSDTn}/Tn×${e3.tnEntrada.toFixed(0)}Tn`,            total:e3.costoOpex,    hover:[e3.hoverTotal[0]]},
    {label:"Camiones directo", eq:`$${p.des_costoCamionesDirUSDTn}/Tn×${e3.tnDirecto.toFixed(0)}Tn`,total:e3.costoCamiones,hover:[e3.hoverTotal[1]]},
    {label:"Acopio BB",        eq:`$${p.des_costoAcopioUSDTn}/Tn×${e3.tnAcopio.toFixed(0)}Tn`,      total:e3.costoAcopio,  hover:[e3.hoverTotal[2]]},
    {label:"Combustible puerto",eq:`${e3.tReal_dias.toFixed(1)}d×${p.nav_consumoPuerto}T/d×$${e3.vlsfo}`,total:e3.combPuerto,hover:e3.hoverComb},
    {label:"Time Charter",     eq:`${e3.tReal_dias.toFixed(1)}d×$${p.nav_timeCharter}/d`,            total:e3.fleteEtapa,   hover:[e3.hoverTotal[4]]},
    {label:"Agencia BB",       eq:"costo fijo por escala",                                            total:e3.agencia,      hover:[e3.hoverTotal[5]]},
    {label:"TOTAL ETAPA 3",    eq:"Σ costos descarga",                                               total:e3.costoTotal,   hover:e3.hoverTotal,isTotal:true},
  ];
  return (
    <div>
      <EspejoCheck p={p}/>
      <VLSFOWidget p={p} set={set}/>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:9,color:C.muted,marginBottom:4,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>Mes de análisis</div>
        <MesSelector value={mes} onChange={setMes}/>
      </div>
      <div className="kpis">
        <KPI label="Tn entrada" value={e3.tnEntrada.toFixed(0)} unit="post merma carga" color={T.formula.text}/>
        <KPI label="T. ideal" value={`${e3.tIdeal_dias.toFixed(1)}d`} color={T.formula.text}/>
        <KPI label="T. real" value={`${e3.tReal_dias.toFixed(1)}d`} color={C.gold}/>
        <KPI label="Inop. clima BB" value={`${(e3.pInop*100).toFixed(1)}%`} color={C.orange}/>
        <KPI label="Tn entregadas" value={e3.tnEntregadas.toFixed(0)} color={C.green}/>
        <KPI label="USD/Tn etapa" value={`$${(e3.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div className="g2">
        <div>
          <div className="card">
            <div className="ct">Parámetros Físicos — Descarga <TipoBadge tipo="usuario"/></div>
            <div className="g3">
              <Campo label="Grampada" value={p.des_grampada} onChange={v=>set("des_grampada",v)} tipo="usuario" unit="m³" min={5} max={30}/>
              <Campo label="Grúas" value={p.des_gruas} onChange={v=>set("des_gruas",v)} tipo="usuario" min={1} max={4}/>
              <Campo label="Mov/min" value={p.des_movGrampa} onChange={v=>set("des_movGrampa",v)} tipo="usuario" unit="mov/min" min={0.1} max={2} step={0.1}/>
              <Campo label="Opex descarga" value={p.des_opexUSDTn} onChange={v=>set("des_opexUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Camiones directo" value={p.des_costoCamionesDirUSDTn} onChange={v=>set("des_costoCamionesDirUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={1}/>
              <Campo label="Acopio BB" value={p.des_costoAcopioUSDTn} onChange={v=>set("des_costoAcopioUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Agencia BB" value={p.des_agenciaBB} onChange={v=>set("des_agenciaBB",v)} tipo="usuario" unit="USD" min={0} step={500}/>
            </div>
            <Toggle label="Horas trabajo/día" options={[4,8,12,14,24]} value={p.des_horasDia} onChange={v=>set("des_horasDia",v)} tipo="usuario"/>
            <div className="g2">
              <Campo label="Merma descarga" value={p.des_pctMermaDescarga*100} onChange={v=>set("des_pctMermaDescarga",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1}/>
              <Campo label="Merma acopio" value={p.des_pctMermaAcopio*100} onChange={v=>set("des_pctMermaAcopio",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1}/>
            </div>
            <div style={{marginTop:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:9,fontWeight:700,color:C.green}}>Despacho directo</span>
                <span style={{fontSize:14,fontWeight:800,color:C.green,fontFamily:"DM Mono,monospace"}}>{((1-p.des_pctAcopio)*100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={1-p.des_pctAcopio}
                onChange={e=>set("des_pctAcopio",parseFloat((1-e.target.value).toFixed(2)))} style={{accentColor:C.green}}/>
              <div className="g3" style={{marginTop:6}}>
                {[{l:"Directo",v:`${e3.tnDirecto.toFixed(0)}Tn`,c:C.green},{l:"Acopio",v:`${e3.tnAcopio.toFixed(0)}Tn`,c:C.gold},{l:"Entregadas",v:`${e3.tnEntregadas.toFixed(0)}Tn`,c:C.navy}].map(({l,v,c})=>(
                  <div key={l} style={{background:"#EEF2F7",borderRadius:7,padding:"7px 9px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.muted,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:c,fontFamily:"DM Mono,monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="ct">Inoperabilidad — BB <TipoBadge tipo="estadistico"/> <FuenteLink fuente={FUENTES.climaBB}/></div>
            <div className="g2">
              <Campo label="Lluvia inoperable desde" value={p.des_inopLluvia} onChange={v=>set("des_inopLluvia",v)} tipo="usuario" unit="mm/día" min={5} max={100} step={5}/>
              <Campo label="Viento inoperable desde" value={p.des_inopViento} onChange={v=>set("des_inopViento",v)} tipo="usuario" unit="km/h" min={20} max={100} step={5}/>
            </div>
            <div className="g2">
              <Campo tipo="formula" label="% días inhábiles" value={`${(e3.pInop*100).toFixed(1)}%`}/>
              <Campo tipo="formula" label="Días extra clima" value={`${e3.diasInop.toFixed(1)}días`}/>
            </div>
            <div style={{marginTop:8}}>
              <div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>Espera BB por mes (días) <TipoBadge tipo="estadistico"/></div>
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
            <div className="warn-note">⚠️ Estimados. Ver Base Clima. Espera: validar con Argelan (agencia BB).</div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="ct">Fórmulas — Tiempo Real Descarga <TipoBadge tipo="formula"/></div>
            <table className="cost-table">
              <thead><tr><th>Variable</th><th>Ecuación</th><th colSpan={2}>Resultado</th></tr></thead>
              <tbody>
                {[
                  {l:"Tn entrada",    eq:"cap.−merma carga",                                   v:`${e3.tnEntrada.toFixed(0)}Tn`,       hover:`${p.cap_capacidadBarco}−${e1.mermaTn.toFixed(0)}=${e3.tnEntrada.toFixed(0)}Tn`},
                  {l:"Vel. descarga", eq:`${p.des_gruas}×${p.des_grampada}×${p.cap_densidadArena}×${p.des_movGrampa}`,v:`${e3.velIdeal_TnMin.toFixed(1)}Tn/min`,hover:e3.hoverVel},
                  {l:"T ideal (días)",eq:"tnEntrada/vel_hr/horasDía",                          v:`${e3.tIdeal_dias.toFixed(1)}días`,   hover:`${e3.tnEntrada.toFixed(0)}÷${e3.velIdeal_TnHr.toFixed(0)}÷${p.des_horasDia}=${e3.tIdeal_dias.toFixed(1)}días`},
                  {l:"Días inop. BB", eq:"tIdeal×pInop÷(1−pInop)",                             v:`${e3.diasInop.toFixed(1)}días`,      hover:e3.hoverInop},
                  {l:"T real desc.",  eq:"tIdeal+inop+esperaBB",                               v:`${e3.tReal_dias.toFixed(1)}días`,    hover:e3.hoverTReal},
                  {l:"Merma desc.",   eq:`${e3.tnEntrada.toFixed(0)}×${(p.des_pctMermaDescarga*100).toFixed(1)}%`,v:`${e3.mermaDescarga_Tn.toFixed(0)}Tn`,hover:`${e3.tnEntrada.toFixed(0)}×${(p.des_pctMermaDescarga*100).toFixed(1)}%=${e3.mermaDescarga_Tn.toFixed(0)}Tn`},
                  {l:"Tn entregadas", eq:"tnPostDesc−mermaAcopio",                             v:`${e3.tnEntregadas.toFixed(0)}Tn`,    hover:`${e3.tnPostDescarga.toFixed(0)}−${e3.mermaAcopio_Tn.toFixed(0)}=${e3.tnEntregadas.toFixed(0)}Tn`},
                ].map((r,i)=>(
                  <tr key={i}><td style={{fontWeight:600,color:C.navy,fontSize:11}}>{r.l}</td>
                    <td className="eq">{r.eq}</td>
                    <td colSpan={2}><HoverVal value={r.v} title={r.l} lines={Array.isArray(r.hover)?r.hover:[r.hover]}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="ct">Costos Etapa 3</div>
            <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E4: VUELTA ────────────────────────────────────────────────────────
function TabVuelta({p,set,tnEntregadas}) {
  const e4=calcEtapa4(p);
  const costRows=[
    {label:"Combustible lastre",eq:`${e4.diasNav.toFixed(1)}d×${p.vta_consumoLastre}T/d×$${e4.vlsfo}`,total:e4.combLastre,hover:e4.hoverComb},
    {label:"Time Charter vuelta",eq:`${e4.diasNav.toFixed(1)}d×$${p.nav_timeCharter}/d`,               total:e4.fleteNav,  hover:[e4.hoverTotal[1]]},
    {label:"TOTAL ETAPA 4",      eq:"Σ costos vuelta",                                                  total:e4.costoTotal,hover:e4.hoverTotal,isTotal:true},
  ];
  return (
    <div>
      <VLSFOWidget p={p} set={set}/>
      <div className="kpis">
        <KPI label="Días vuelta" value={`${e4.diasNav.toFixed(1)}d`} color={T.formula.text}/>
        <KPI label="Consumo lastre" value={`${p.vta_consumoLastre}T/d`} color={T.input.text}/>
        <KPI label="VLSFO activo" value={`$${e4.vlsfo}/T`} color={C.orange}/>
        <KPI label="Combustible vuelta" value={`$${(e4.combLastre/1000).toFixed(0)}k`} color={C.gold}/>
        <KPI label="USD/Tn etapa" value={`$${(e4.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div className="card">
        <div className="ct">Ruta Vuelta — Sea White → Zárate (mismos tramos en reversa)</div>
        <MapaNavegacion tramos={p.vta_tramos} onUpdate={arr=>set("vta_tramos",arr)} vuelta={false}/>
      </div>
      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros Vuelta <TipoBadge tipo="usuario"/></div>
          <Campo label="Consumo en lastre" value={p.vta_consumoLastre} onChange={v=>set("vta_consumoLastre",v)} tipo="usuario" unit="T/día" min={5} max={35} step={0.5} nota="Barco vacío — Handysize típico: 10–13 T/día"/>
          <Campo label="Espera Zárate (vuelta)" value={p.vta_esperaZarateDias} onChange={v=>set("vta_esperaZarateDias",v)} tipo="usuario" unit="días" min={0} max={5} step={0.25}/>
          <div style={{marginTop:10,padding:"8px 12px",background:C.warn,border:`1px solid ${C.warnBorder}`,borderRadius:8}}>
            <div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase"}}>Ahorro combustible vs. ida cargado</div>
            <HoverVal value={`$${((p.nav_consumoNavegando-p.vta_consumoLastre)*e4.diasNav*e4.vlsfo).toFixed(0)}`}
              title="Ahorro combustible vuelta"
              lines={[`(${p.nav_consumoNavegando}−${p.vta_consumoLastre})T/d × ${e4.diasNav.toFixed(1)}d × $${e4.vlsfo} = $${((p.nav_consumoNavegando-p.vta_consumoLastre)*e4.diasNav*e4.vlsfo).toFixed(0)}`]}
              color={C.orange}/>
          </div>
        </div>
        <div className="card">
          <div className="ct">Costos Etapa 4 <TipoBadge tipo="formula"/></div>
          <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
        </div>
      </div>
    </div>
  );
}

// ─── TAB MC: MONTE CARLO ───────────────────────────────────────────────────

// ─── TAB MC: MONTE CARLO ───────────────────────────────────────────────────
function TabMC({p}) {
  const [n,setN]=useState(5000);
  const [mes,setMes]=useState(null);
  const [res,setRes]=useState(null);
  const [mcMes,setMcMes]=useState(null);
  const [running,setR]=useState(false);
  const [runM,setRM]=useState(false);
  const [savingMC,setSavingMC]=useState(false);
  const [nomMC,setNomMC]=useState("");
  const [msgMC,setMsgMC]=useState("");
  const det=calcTotal(p,mes??5);

  const run=useCallback(()=>{setR(true);setTimeout(()=>{setRes(runMonteCarlo(p,n,mes));setR(false);},60);},[p,n,mes]);
  const runMC=useCallback(()=>{setRM(true);setTimeout(()=>{setMcMes(runMCMensual(p,2000));setRM(false);},80);},[p]);

  const guardarMC=async()=>{
    if(!res){setMsgMC("Corré la simulación primero");return;}
    if(!nomMC.trim()){setMsgMC("Ingresá un nombre");return;}
    setSavingMC(true);
    const stats=calcVLSFOStats(p.vlsfo_historico);
    const{error}=await supabase.from("corridas_montecarlo").insert({
      escenario_nombre:nomMC.trim(),
      n_simulaciones:res.n,
      mes_analizado:mes,
      p10:res.p10,p25:res.p25,p50:res.p50,p75:res.p75,p90:res.p90,
      mean_val:res.mean,std_val:res.std,
      spread:parseFloat((res.p90-res.p10).toFixed(1)),
      vlsfo_escenario:p.nav_escenarioVLSFO,
      vlsfo_precio:getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico),
      params:p,
    });
    if(error)setMsgMC("Error: "+error.message);
    else{setMsgMC("✓ Corrida guardada");setNomMC("");}
    setSavingMC(false);
    setTimeout(()=>setMsgMC(""),3000);
  };

  const pBadges=res?[
    {l:"P10 — Optimista",   v:res.p10,bg:"#F0FDF4",bc:"#86EFAC",c:C.p10, d:"El 10% de los escenarios simulados resulta en un costo MEJOR que este. Representa condiciones favorables acumuladas."},
    {l:"P25",               v:res.p25,bg:"#F0FDF4",bc:"#86EFAC",c:"#1a7a3a",d:"El 25% de los escenarios es mejor. Cuartil optimista."},
    {l:"P50 — Más probable",v:res.p50,bg:"#FFFBEB",bc:"#D4B84A",c:C.p50, d:"La mediana. El 50% de los escenarios resulta por encima y el 50% por debajo. Es el caso más representativo."},
    {l:"P75",               v:res.p75,bg:"#FEF3C7",bc:"#D4B84A",c:C.orange,d:"El 75% de los escenarios es mejor. Cuartil pesimista."},
    {l:"P90 — Pesimista",   v:res.p90,bg:"#FEE2E2",bc:"#FECACA",c:C.p90, d:"Solo el 10% de los escenarios resulta peor que este. Representa condiciones adversas acumuladas."},
  ]:[];

  return (
    <div>
      <div className="card" style={{background:"#F0F9FF",borderColor:"#BAE6FD"}}>
        <div className="ct" style={{color:"#0369A1"}}>¿Qué es el Monte Carlo?</div>
        <p style={{fontSize:12,color:"#0369A1",lineHeight:1.7,marginBottom:8}}>
          El modelo determinístico produce <strong>un solo número</strong> para cada configuración. Pero en la realidad, variables como el precio del combustible, el clima o los tiempos de espera <strong>no son fijos</strong> — fluctúan aleatoriamente.
        </p>
        <p style={{fontSize:12,color:"#0369A1",lineHeight:1.7}}>
          El Monte Carlo corre el modelo <strong>N veces</strong>, sorteando en cada corrida un valor aleatorio para cada variable según su distribución histórica o estimada. El resultado es una <strong>distribución de probabilidad</strong> del costo final: en lugar de "$68/Tn", obtenés "$65–$72/Tn con 80% de confianza".
        </p>
      </div>

      <div className="card">
        <div className="ct">Configuración</div>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap",marginBottom:8}}>
          <div>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>N simulaciones <TipoBadge tipo="usuario"/></div>
            <select className="campo-input" value={n} onChange={e=>setN(Number(e.target.value))}
              style={{width:140,background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}>
              {[1000,3000,5000,10000].map(v=><option key={v} value={v}>{v.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Mes (vacío = año aleatorio)</div>
            <select className="campo-input" value={mes??""} onChange={e=>setMes(e.target.value===""?null:Number(e.target.value))}
              style={{width:170,background:T.stat.bg,borderColor:T.stat.border,color:T.stat.text}}>
              <option value="">Año completo</option>
              {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <button className="run" onClick={run} disabled={running}>{running?"Calculando...":"▶ Correr Simulación"}</button>
          <span style={{fontSize:11,color:C.muted}}>Base det.: <strong style={{color:C.gold}}>${det.usdTn.toFixed(1)} USD/Tn</strong></span>
        </div>
      </div>

      {res&&(
        <>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
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
              <div className="pbadge-d" style={{color:C.muted}}>σ=${res.std.toFixed(1)} · {res.n.toLocaleString()} sims</div>
            </div>
            <div className="pbadge" style={{background:"#F0F9FF",borderColor:"#BAE6FD"}}>
              <div className="pbadge-l" style={{color:"#0369A1"}}>Media (4 dec.)</div>
              <div className="pbadge-v" style={{color:"#0369A1",fontSize:15}}>${res.mean.toFixed(4)}</div>
              <div className="pbadge-d" style={{color:"#0369A1"}}>varía entre corridas ~±${(res.std/Math.sqrt(res.n)*2).toFixed(3)}</div>
            </div>
          </div>

          {/* Guardar corrida */}
          <div className="card" style={{background:"#F0FDF4",borderColor:"#86EFAC"}}>
            <div className="ct" style={{color:C.green}}>Guardar esta corrida</div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input className="campo-input" value={nomMC} onChange={e=>setNomMC(e.target.value)}
                placeholder="Ej: Junio 2026 — VLSFO hoy — 5000 sims"
                style={{flex:2,minWidth:200,background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}/>
              <button className="run" onClick={guardarMC} disabled={savingMC}
                style={{background:C.green}}>{savingMC?"Guardando...":"💾 Guardar corrida"}</button>
              {msgMC&&<span style={{fontSize:11,color:msgMC.startsWith("✓")?C.green:C.red,fontWeight:700}}>{msgMC}</span>}
            </div>
            <div style={{fontSize:10,color:C.green,marginTop:6}}>
              Se guarda: P10=${res.p10} P50=${res.p50} P90=${res.p90} · Spread=${(res.p90-res.p10).toFixed(1)} · VLSFO escenario: {VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label}
            </div>
          </div>

          <div className="card">
            <div className="ct">Distribución de Probabilidad</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={res.hist} margin={{top:10,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="x" tick={{fill:C.muted,fontSize:9}} tickCount={12}/>
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

          <div className="card">
            <div className="ct">Variables en la Simulación</div>
            <div className="mc-var-row" style={{fontWeight:700,fontSize:8,color:C.muted,background:"transparent",textTransform:"uppercase",letterSpacing:.5}}>
              <span>Variable</span><span>Valor base</span><span>Distribución</span><span>Tipo</span>
            </div>
            {res.vars.map((v,i)=>(
              <div key={i} className="mc-var-row">
                <span style={{fontWeight:600,color:C.navy}}>{v.label}</span>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:v.tipo==="usuario"?T.usuario.text:T.stat.text}}>{v.base}</span>
                <span style={{fontSize:9,color:C.muted}}>{v.dist}</span>
                <TipoBadge tipo={v.tipo}/>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card">
        <div className="ct">Análisis de Estacionalidad — USD/Tn por Mes</div>
        <p style={{fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:10}}>
          Corre 2.000 simulaciones por mes (24.000 total). Muestra cómo varía el costo según la época del año por efecto del clima, espera en BB y estacionalidad del combustible.
        </p>
        <button className="run" onClick={runMC} disabled={runM} style={{marginBottom:12}}>
          {runM?"Calculando 24.000 simulaciones...":"▶ Correr Análisis Estacional"}
        </button>

        {mcMes&&(
          <>
            {[
              {key:"p10",label:"P10 — Caso Optimista",color:C.p10,desc:"Solo el 10% de los viajes de ese mes costará menos. Condiciones más favorables: buen clima, poca espera, combustible bajo."},
              {key:"p50",label:"P50 — Caso Más Probable",color:C.p50,desc:"La mediana mensual. El resultado más representativo de lo que probablemente ocurra en un viaje típico de ese mes."},
              {key:"p90",label:"P90 — Caso Pesimista",color:C.p90,desc:"Solo el 10% de los viajes costará más. Condiciones adversas acumuladas: mal clima, demoras, combustible caro."},
            ].map(({key,label,color,desc})=>(
              <div key={key} style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color,marginBottom:3}}>{label}</div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{desc}</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={mcMes} margin={{top:5,right:10,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:10}}/>
                    <YAxis tick={{fill:C.muted,fontSize:9}} domain={["auto","auto"]}/>
                    <Tooltip {...TTip} formatter={v=>[`$${v.toFixed(1)} USD/Tn`]}/>
                    <ReferenceLine y={mcMes.reduce((a,r)=>a+r[key],0)/12} stroke={color} strokeDasharray="4 4"
                      label={{value:`Prom $${(mcMes.reduce((a,r)=>a+r[key],0)/12).toFixed(1)}`,fill:color,fontSize:9}}/>
                    <Bar dataKey={key} radius={[3,3,0,0]}>
                      {mcMes.map((d,i)=>{
                        const avg=mcMes.reduce((a,r)=>a+r[key],0)/12;
                        return <Cell key={i} fill={d[key]>avg?`${color}CC`:`${color}66`}/>;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}

            <div style={{overflowX:"auto",marginTop:8}}>
              <table className="cost-table">
                <thead><tr><th>Mes</th><th>P10</th><th>P25</th><th style={{color:"#FCD34D"}}>P50</th><th>P75</th><th>P90</th><th>Det.</th><th>Spread</th></tr></thead>
                <tbody>
                  {mcMes.map((r)=>(
                    <tr key={r.mes}>
                      <td style={{fontWeight:700}}>{r.mes}</td>
                      {[r.p10,r.p25,r.p50,r.p75,r.p90,r.det].map((v,j)=>(
                        <td key={j} className="mono" style={{textAlign:"right",color:j===2?C.p50:j===5?C.blue:C.navy}}>${v.toFixed(1)}</td>
                      ))}
                      <td className="mono" style={{textAlign:"right",color:C.orange}}>${(r.p90-r.p10).toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td>PROMEDIO</td>
                    {["p10","p25","p50","p75","p90","det"].map(k=>(
                      <td key={k} className="mono" style={{textAlign:"right",color:k==="p50"?C.p50:k==="det"?C.blue:"#fff"}}>
                        ${(mcMes.reduce((a,r)=>a+r[k],0)/12).toFixed(1)}
                      </td>
                    ))}
                    <td className="mono" style={{textAlign:"right",color:"#FCA5A5"}}>
                      ${(mcMes.reduce((a,r)=>a+(r.p90-r.p10),0)/12).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ─── TAB EV: EVALUACIÓN TOTAL ──────────────────────────────────────────────
function TabEvaluacion({p,tnEntregadas}) {
  const [mes,setMes]=useState(5);
  const tot=calcTotal(p,mes);
  const {e1,e2,e3,e4}=tot;

  const etapas=[
    {
      label:"ETAPA 1 — CARGA (ZÁRATE)", color:"#235C96",
      rows:[
        {label:"Costo arena",        total:e1.costoArena,   hover:[e1.hoverTotal[0]]},
        {label:"Costo merma carga",  total:e1.costoMerma,   hover:[e1.hoverTotal[1]]},
        {label:"Opex carga",         total:e1.costoOpex,    hover:[e1.hoverTotal[2]]},
        {label:"Combustible puerto", total:e1.combPuerto,   hover:e1.hoverComb},
        {label:"Time Charter",       total:e1.fleteEtapa,   hover:[e1.hoverTotal[4]]},
        {label:"Agencia Zárate",     total:e1.agencia,      hover:[e1.hoverTotal[5]]},
      ],
      subtotal:e1.costoTotal, dias:e1.tReal_dias,
    },
    {
      label:"ETAPA 2 — NAVEGACIÓN IDA", color:"#166534",
      rows:[
        {label:"Combustible navegación",total:e2.combNav,  hover:e2.hoverComb},
        {label:"Time Charter ida",      total:e2.fleteNav, hover:[e2.hoverTotal[1]]},
      ],
      subtotal:e2.costoTotal, dias:e2.diasNav,
    },
    {
      label:"ETAPA 3 — DESCARGA (SEA WHITE)", color:"#5B21B6",
      rows:[
        {label:"Opex descarga",      total:e3.costoOpex,    hover:[e3.hoverTotal[0]]},
        {label:"Camiones directo",   total:e3.costoCamiones,hover:[e3.hoverTotal[1]]},
        {label:"Acopio BB",          total:e3.costoAcopio,  hover:[e3.hoverTotal[2]]},
        {label:"Combustible puerto", total:e3.combPuerto,   hover:e3.hoverComb},
        {label:"Time Charter",       total:e3.fleteEtapa,   hover:[e3.hoverTotal[4]]},
        {label:"Agencia BB",         total:e3.agencia,      hover:[e3.hoverTotal[5]]},
      ],
      subtotal:e3.costoTotal, dias:e3.tReal_dias,
    },
    {
      label:"ETAPA 4 — VUELTA EN LASTRE", color:"#92400E",
      rows:[
        {label:"Combustible lastre",total:e4.combLastre,hover:e4.hoverComb},
        {label:"Time Charter vuelta",total:e4.fleteNav, hover:[e4.hoverTotal[1]]},
      ],
      subtotal:e4.costoTotal, dias:e4.diasNav,
    },
  ];

  return (
    <div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,color:C.muted,marginBottom:4,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>Mes de análisis</div>
        <MesSelector value={mes} onChange={setMes}/>
      </div>
      <div className="kpis">
        <KPI label="USD/Tn final"   value={`$${tot.usdTn.toFixed(1)}`}              color={C.gold}/>
        <KPI label="Tn entregadas"  value={tot.tnEntregadas.toFixed(0)}              color={C.green}/>
        <KPI label="Días totales"   value={`${tot.diasTotales.toFixed(1)}d`}         color={C.navy}/>
        <KPI label="Costo total"    value={`$${(tot.costoTotal/1000).toFixed(0)}k`}  color={C.navy}/>
        <KPI label="VLSFO activo"   value={`$${e1.vlsfo}/T`}                         color={C.orange}/>
      </div>
      <div className="card">
        <div className="ct">Tabla Consolidada — Todas las Etapas</div>
        <table className="eval-table">
          <thead><tr><th>Concepto</th><th>Días</th><th>USD/Tn</th><th>Total USD</th></tr></thead>
          <tbody>
            {etapas.map(etapa=>(
              <React.Fragment key={etapa.label}>
                <tr className="etapa-hdr">
                  <td colSpan={4} style={{borderLeft:`4px solid ${etapa.color}`}}>{etapa.label}</td>
                </tr>
                {etapa.rows.map((r,i)=>(
                  <tr key={i}>
                    <td style={{paddingLeft:20,color:C.muted,fontSize:11}}>{r.label}</td>
                    <td className="mono" style={{textAlign:"right",color:C.muted,fontSize:11}}>—</td>
                    <td className="mono" style={{textAlign:"right",color:C.mid,fontSize:11}}>${(r.total/tnEntregadas).toFixed(1)}</td>
                    <td style={{textAlign:"right"}}>
                      <HoverVal value={`$${r.total.toLocaleString("es-AR",{maximumFractionDigits:0})}`}
                        title={r.label} lines={Array.isArray(r.hover)?r.hover:[r.hover]}/>
                    </td>
                  </tr>
                ))}
                <tr className="subtotal">
                  <td style={{paddingLeft:20}}>Subtotal {etapa.label.split("—")[0].trim()}</td>
                  <td className="mono" style={{textAlign:"right",color:etapa.color}}>{etapa.dias.toFixed(1)}d</td>
                  <td className="mono" style={{textAlign:"right",color:etapa.color}}>${(etapa.subtotal/tnEntregadas).toFixed(1)}</td>
                  <td className="mono" style={{textAlign:"right",color:etapa.color}}>${etapa.subtotal.toLocaleString("es-AR",{maximumFractionDigits:0})}</td>
                </tr>
              </React.Fragment>
            ))}
            <tr className="grand-total">
              <td>TOTAL — USD / TN ENTREGADA</td>
              <td className="mono" style={{textAlign:"right"}}>{tot.diasTotales.toFixed(1)}d</td>
              <td className="mono" style={{textAlign:"right",color:"#FCD34D",fontSize:16}}>${tot.usdTn.toFixed(1)}</td>
              <td className="mono" style={{textAlign:"right"}}>${tot.costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="ct">Waterfall — Contribución por Etapa (USD/Tn)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={etapas.map(e=>({name:e.label.split("—")[1]?.trim()||e.label,val:parseFloat((e.subtotal/tnEntregadas).toFixed(1)),color:e.color}))}
            margin={{top:10,right:10,left:0,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}}/>
            <YAxis tick={{fill:C.muted,fontSize:9}}/>
            <Tooltip {...TTip} formatter={v=>[`$${v} USD/Tn`]}/>
            <Bar dataKey="val" radius={[4,4,0,0]}>
              {etapas.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── TAB CL: BASE CLIMA ────────────────────────────────────────────────────
function TabClima({p,set}) {
  const inopZ=getPctInopFromDB(p.clima_zarate,p.cap_inopLluvia,p.cap_inopViento);
  const inopB=getPctInopFromDB(p.clima_bb,p.des_inopLluvia,p.des_inopViento);

  const updateClima=(puerto,mesIdx,field,val)=>{
    const key=puerto==="zarate"?"clima_zarate":"clima_bb";
    const arr=[...p[key]];arr[mesIdx]={...arr[mesIdx],[field]:parseFloat(val)||0};set(key,arr);
  };
  const resetClima=(puerto)=>set(puerto==="zarate"?"clima_zarate":"clima_bb",CLIMA_DB_DEFAULT[puerto]);

  const ClimaSec=({puerto,titulo,climaDB,inop,fuente})=>(
    <div className="card">
      <div className="ct">{titulo} <TipoBadge tipo="estadistico"/> <FuenteLink fuente={fuente}/>
        <button onClick={()=>resetClima(puerto)} style={{marginLeft:"auto",padding:"2px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:8,fontWeight:700,cursor:"pointer"}}>Resetear</button>
      </div>
      <div className="warn-note" style={{marginBottom:8}}>⚠️ Datos ESTIMADOS — reemplazar con datos reales SMN. μ = promedio diario del mes. σ = desviación estándar.</div>
      <div style={{overflowX:"auto"}}>
        <table className="clima-table">
          <thead><tr><th>Mes</th><th>Lluvia μ (mm/d)</th><th>Lluvia σ</th><th>Viento μ (km/h)</th><th>Viento σ</th><th>% Inop. calc.</th></tr></thead>
          <tbody>{climaDB.map((d,i)=>(
            <tr key={d.mes}>
              <td style={{fontWeight:700,color:C.navy}}>{d.mes}</td>
              <td><input type="number" value={d.lluviaProm} step={0.1} min={0} onChange={e=>updateClima(puerto,i,"lluviaProm",e.target.value)}/></td>
              <td><input type="number" value={d.lluviaSigma} step={0.1} min={0} onChange={e=>updateClima(puerto,i,"lluviaSigma",e.target.value)}/></td>
              <td><input type="number" value={d.vientoProm} step={0.5} min={0} onChange={e=>updateClima(puerto,i,"vientoProm",e.target.value)}/></td>
              <td><input type="number" value={d.vientoSigma} step={0.5} min={0} onChange={e=>updateClima(puerto,i,"vientoSigma",e.target.value)}/></td>
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
        <div style={{fontSize:11,color:C.orange,fontWeight:700,marginBottom:4}}>⚠️ Fuentes para reemplazar los estimados</div>
        <div style={{fontSize:11,color:C.orange,lineHeight:1.7}}>
          • <strong>SMN San Fernando / Ezeiza:</strong> <a href="https://www.smn.gob.ar/descarga-de-datos" target="_blank" rel="noreferrer" style={{color:C.navy}}>smn.gob.ar ↗</a><br/>
          • <strong>SMN Bahía Blanca:</strong> misma URL, estación 87750<br/>
          • μ = media del valor diario para ese mes en el histórico. σ = desviación estándar de esos valores diarios.
        </div>
      </div>
      <ClimaSec puerto="zarate" titulo="Zárate — Lluvia y Viento" climaDB={p.clima_zarate} inop={inopZ} fuente={FUENTES.climaZarate}/>
      <ClimaSec puerto="bb"     titulo="Bahía Blanca — Lluvia y Viento" climaDB={p.clima_bb} inop={inopB} fuente={FUENTES.climaBB}/>
    </div>
  );
}

// ─── TAB CB: BASE COMBUSTIBLE ──────────────────────────────────────────────
function TabCombustible({p,set}) {
  const stats=calcVLSFOStats(p.vlsfo_historico);

  const updatePrecio=(idx,val)=>{
    const arr=[...p.vlsfo_historico];arr[idx]={...arr[idx],precio:parseFloat(val)||0};set("vlsfo_historico",arr);
  };
  const resetHistorico=()=>set("vlsfo_historico",VLSFO_HISTORICO_DEFAULT);
  const años=[...new Set(p.vlsfo_historico.map(h=>h.año))];
  const chartData=p.vlsfo_historico.map(h=>({name:`${MESES[h.mes]}'${String(h.año).slice(2)}`,precio:h.precio}));

  return (
    <div>
      <div className="card" style={{background:"#1E293B",borderColor:"#334155"}}>
        <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>VLSFO 0.5%S Rotterdam — Resumen estadístico</div>
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          {[
            {l:"Valor más reciente",v:`$${stats.actual}/T`,       c:"#fff",   sub:"⚠️ Pico histórico"},
            {l:"Promedio 12 meses", v:`$${stats.prom12m.toFixed(0)}/T`,c:"#93C5FD"},
            {l:"Promedio 5 años",   v:`$${stats.prom5a.toFixed(0)}/T`, c:"#93C5FD"},
            {l:"Mínimo 5 años",     v:`$${stats.min5a}/T`,         c:"#86EFAC"},
            {l:"Máximo 5 años",     v:`$${stats.max5a}/T`,         c:"#FCA5A5"},
            {l:"vs Prom. 12M",      v:`${stats.pctVsPromedio12m>0?"+":""}${stats.pctVsPromedio12m.toFixed(1)}%`,c:stats.pctVsPromedio12m>10?"#FCA5A5":"#86EFAC"},
            {l:"σ últimos 12M",     v:`$${stats.sigma12m.toFixed(0)}/T`,c:"#FCD34D",sub:"usado en MC"},
          ].map(({l,v,c,sub})=>(
            <div key={l}>
              <div style={{fontSize:8,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>{l}</div>
              <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:"DM Mono,monospace"}}>{v}</div>
              {sub&&<div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:1}}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="warn-note">⚠️ Datos ESTIMADOS (placeholder). Reemplazar con datos reales de <a href="https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam" target="_blank" rel="noreferrer" style={{color:C.navy}}>Ship & Bunker Rotterdam ↗</a></div>
      <div className="card">
        <div className="ct">Histórico VLSFO — Gráfico</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{top:10,right:10,left:0,bottom:5}}>
            <defs>
              <linearGradient id="vlsfoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#235C96" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#235C96" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:8}} interval={5}/>
            <YAxis tick={{fill:C.muted,fontSize:9}} domain={["auto","auto"]}/>
            <Tooltip {...TTip} formatter={v=>[`$${v}/T`,"VLSFO"]}/>
            <ReferenceLine y={stats.prom12m} stroke="#93C5FD" strokeDasharray="4 4" label={{value:`Prom 12M: $${stats.prom12m.toFixed(0)}`,fill:"#93C5FD",fontSize:9}}/>
            <ReferenceLine y={stats.prom5a}  stroke="#6B7280" strokeDasharray="4 4" label={{value:`Prom 5a: $${stats.prom5a.toFixed(0)}`,fill:"#6B7280",fontSize:9}}/>
            <Area type="monotone" dataKey="precio" stroke="#235C96" fill="url(#vlsfoGrad)" strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div className="ct">Tabla de Precios Históricos — Editable <TipoBadge tipo="usuario"/>
          <button onClick={resetHistorico} style={{marginLeft:"auto",padding:"2px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:8,fontWeight:700,cursor:"pointer"}}>Resetear</button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="clima-table">
            <thead><tr><th>Mes</th>{años.map(a=><th key={a}>{a}</th>)}</tr></thead>
            <tbody>
              {MESES.map((m,mi)=>(
                <tr key={m}>
                  <td style={{fontWeight:700,color:C.navy}}>{m}</td>
                  {años.map(a=>{
                    const idx=p.vlsfo_historico.findIndex(h=>h.año===a&&h.mes===mi);
                    return (
                      <td key={a}>
                        {idx>=0?(
                          <input type="number" value={p.vlsfo_historico[idx].precio} step={5} min={100} max={2000}
                            onChange={e=>updatePrecio(idx,e.target.value)}/>
                        ):<span style={{color:C.muted,fontSize:10}}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB SC: ESCENARIOS ────────────────────────────────────────────────────
function TabEscenarios({p}) {
  const [esc,setEsc]=useState([]);
  const [corridas,setCorridas]=useState([]);
  const [nom,setNom]=useState("");
  const [desc,setDesc]=useState("");
  const [sav,setSav]=useState(false);
  const [load,setLoad]=useState(false);
  const [msg,setMsg]=useState("");
  const [vistaActiva,setVistaActiva]=useState("escenarios");
  const det=calcTotal(p);

  const cargar=async()=>{
    setLoad(true);
    const[{data:escData},{data:corrData}]=await Promise.all([
      supabase.from("escenarios_arena").select("*").order("created_at",{ascending:false}),
      supabase.from("corridas_montecarlo").select("*").order("created_at",{ascending:false}),
    ]);
    setEsc(escData||[]);setCorridas(corrData||[]);
    setLoad(false);
  };

  const guardar=async()=>{
    if(!nom.trim()){setMsg("Ingresá un nombre");return;}
    setSav(true);
    const{error}=await supabase.from("escenarios_arena").insert({
      nombre:nom.trim(),descripcion:desc.trim(),params:p,
      usd_tn:parseFloat(det.usdTn.toFixed(1))
    });
    if(error)setMsg("Error: "+error.message);
    else{setMsg("✓ Guardado");setNom("");setDesc("");cargar();}
    setSav(false);setTimeout(()=>setMsg(""),3000);
  };

  const eliminar=async(tabla,id)=>{await supabase.from(tabla).delete().eq("id",id);cargar();};

  return (
    <div>
      <div className="card">
        <div className="ct">Guardar Escenario Actual</div>
        <div className="g2" style={{marginBottom:10}}>
          <div className="campo">
            <div className="campo-label" style={{color:T.usuario.label}}>Nombre <TipoBadge tipo="usuario"/></div>
            <input className="campo-input" type="text" value={nom} onChange={e=>setNom(e.target.value)}
              placeholder="Ej: Caso base junio 2026 VLSFO hoy"
              style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}/>
          </div>
          <div className="campo">
            <div className="campo-label" style={{color:T.usuario.label}}>Descripción <TipoBadge tipo="usuario"/></div>
            <input className="campo-input" type="text" value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Notas sobre este escenario"
              style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <button className="run" onClick={guardar} disabled={sav}>{sav?"Guardando...":"💾 Guardar escenario"}</button>
          <span style={{fontSize:11,color:C.muted}}>USD/Tn: <strong style={{color:C.gold}}>${det.usdTn.toFixed(1)}</strong></span>
          <span style={{fontSize:11,color:C.muted}}>VLSFO: <strong style={{color:C.orange}}>${calcVLSFOStats(p.vlsfo_historico).actual}/T ({VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label})</strong></span>
          {msg&&<span style={{fontSize:11,color:msg.startsWith("✓")?C.green:C.red,fontWeight:700}}>{msg}</span>}
        </div>
      </div>

      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",gap:6}}>
            {[{id:"escenarios",l:"Escenarios guardados"},{id:"corridas",l:"Corridas Monte Carlo"}].map(v=>(
              <button key={v.id} className={`tbtn ${vistaActiva===v.id?"on":""}`} onClick={()=>setVistaActiva(v.id)}>{v.l}</button>
            ))}
          </div>
          <button className="run" style={{padding:"5px 12px",fontSize:10}} onClick={cargar}>{load?"...":"↻ Actualizar"}</button>
        </div>

        {vistaActiva==="escenarios"&&(
          esc.length===0?(
            <div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:12}}>No hay escenarios guardados.</div>
          ):esc.map(e=>(
            <div key={e.id} style={{background:"#EEF2F7",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{e.nombre}</div>
                {e.descripcion&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>{e.descripcion}</div>}
                <div style={{fontSize:8,color:C.muted,marginTop:3,fontFamily:"DM Mono,monospace"}}>{new Date(e.created_at).toLocaleDateString("es-AR")}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:16,fontWeight:800,color:C.blue,fontFamily:"DM Mono,monospace"}}>${e.usd_tn?.toFixed(1)} USD/Tn</div>
                <button onClick={()=>eliminar("escenarios_arena",e.id)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:9,fontWeight:600}}>Eliminar</button>
              </div>
            </div>
          ))
        )}

        {vistaActiva==="corridas"&&(
          corridas.length===0?(
            <div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:12}}>No hay corridas guardadas. Corré el Monte Carlo y guardalo desde la pestaña 5.</div>
          ):(
            <>
              {/* Tabla comparativa */}
              <div style={{overflowX:"auto",marginBottom:12}}>
                <table className="cost-table">
                  <thead>
                    <tr>
                      <th>Nombre</th><th>Mes</th><th>N sims</th><th>VLSFO</th>
                      <th style={{color:"#86EFAC"}}>P10</th>
                      <th style={{color:"#FCD34D"}}>P50</th>
                      <th style={{color:"#FCA5A5"}}>P90</th>
                      <th>Spread</th><th>Fecha</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {corridas.map(c=>(
                      <tr key={c.id}>
                        <td style={{fontWeight:600,color:C.navy,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.escenario_nombre}</td>
                        <td className="mono" style={{textAlign:"right"}}>{c.mes_analizado!==null?MESES[c.mes_analizado]:"Anual"}</td>
                        <td className="mono" style={{textAlign:"right"}}>{c.n_simulaciones?.toLocaleString()}</td>
                        <td className="mono" style={{textAlign:"right",color:C.orange}}>${c.vlsfo_precio}<span style={{fontSize:9,color:C.muted,marginLeft:3}}>{c.vlsfo_escenario}</span></td>
                        <td className="mono" style={{textAlign:"right",color:C.p10}}>${c.p10?.toFixed(1)}</td>
                        <td className="mono" style={{textAlign:"right",color:C.p50}}>${c.p50?.toFixed(1)}</td>
                        <td className="mono" style={{textAlign:"right",color:C.p90}}>${c.p90?.toFixed(1)}</td>
                        <td className="mono" style={{textAlign:"right",color:C.orange}}>${c.spread?.toFixed(1)}</td>
                        <td style={{fontSize:9,color:C.muted}}>{new Date(c.created_at).toLocaleDateString("es-AR")}</td>
                        <td><button onClick={()=>eliminar("corridas_montecarlo",c.id)} style={{padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:9,fontWeight:600,cursor:"pointer"}}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gráfico comparativo de P50 */}
              {corridas.length>1&&(
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Comparativa P50 entre corridas</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={corridas.slice(0,10).map(c=>({
                        name:c.escenario_nombre.slice(0,15)+"...",
                        p10:c.p10,p50:c.p50,p90:c.p90,
                      })).reverse()}
                      margin={{top:5,right:10,left:0,bottom:40}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}} angle={-25} textAnchor="end"/>
                      <YAxis tick={{fill:C.muted,fontSize:9}} domain={["auto","auto"]}/>
                      <Tooltip {...TTip} formatter={v=>[`$${v?.toFixed(1)} USD/Tn`]}/>
                      <Legend wrapperStyle={{fontSize:10}}/>
                      <Bar dataKey="p10" name="P10" fill={`${C.p10}88`} radius={[3,3,0,0]}/>
                      <Bar dataKey="p50" name="P50" fill={C.p50} radius={[3,3,0,0]}/>
                      <Bar dataKey="p90" name="P90" fill={`${C.p90}88`} radius={[3,3,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("e1");
  const [params,setParams]=useState(DEFAULT_PARAMS);
  const set=useCallback((k,v)=>setParams(prev=>({...prev,[k]:v})),[]);
  const tot=useMemo(()=>calcTotal(params),[params]);

  const tabMap={
    e1:<TabCarga       p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e2:<TabNavegacion  p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e3:<TabDescarga    p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e4:<TabVuelta      p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    mc:<TabMC          p={params}/>,
    ev:<TabEvaluacion  p={params} tnEntregadas={tot.tnEntregadas}/>,
    cl:<TabClima       p={params} set={set}/>,
    cb:<TabCombustible p={params} set={set}/>,
    sc:<TabEscenarios  p={params}/>,
  };

  return (
    <>
      <style>{CSS}</style>
      <header className="hdr">
        <div className="hdr-brand">
          <div className="hdr-title">⛴️ Transporte de Arena — Zárate → Sea White</div>
          <div className="hdr-sub">Terra Mare Services · Análisis Económico</div>
        </div>
        <div className="hdr-kpis">
          {[
            {l:"USD/Tn",        v:`$${tot.usdTn.toFixed(1)}`},
            {l:"Tn entregadas", v:tot.tnEntregadas.toFixed(0)},
            {l:"Días totales",  v:`${tot.diasTotales.toFixed(1)}d`},
            {l:"Costo total",   v:`$${(tot.costoTotal/1000).toFixed(0)}k`},
          ].map(({l,v})=>(
            <div key={l} className="hdr-kpi">
              <div className="hdr-kpi-v">{v}</div>
              <div className="hdr-kpi-l">{l}</div>
            </div>
          ))}
        </div>
        <button className="back" onClick={()=>window.open("https://terra-mare-portal-9w3x.vercel.app","_self")}>← Portal</button>
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
