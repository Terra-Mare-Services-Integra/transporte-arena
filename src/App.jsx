import { useState, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  DEFAULT_PARAMS, MESES, FUENTES, CLIMA_DB_DEFAULT,
  calcEtapa1, calcEtapa2, calcEtapa3, calcEtapa4, calcTotal,
  getPctInopFromDB, velPromedioPonderada, checkEspejo,
  runMonteCarlo, runMCMensual,
} from "./lib/motor";
import { supabase } from "./lib/supabase";

// ─── COLORES ───────────────────────────────────────────────────────────────
const T = {
  usuario:     { bg:"#FFFBEB", border:"#D4B84A", text:"#78610E", label:"#92740F" },
  input:       { bg:"#FFFBEB", border:"#D4B84A", text:"#78610E", label:"#92740F" },
  formula:     { bg:"#F9FAFB", border:"#D1D5DB", text:"#374151", label:"#6B7280" },
  stat:        { bg:"#F0FDF4", border:"#86EFAC", text:"#166534", label:"#15803D" },
  estadistico: { bg:"#F0FDF4", border:"#86EFAC", text:"#166534", label:"#15803D" },
};
const C = {
  navy:"#213363", blue:"#235C96", mid:"#6381A7", light:"#A5B5CC",
  bg:"#EEF2F7", surface:"#FFFFFF", border:"#D6E0ED",
  gold:"#B07D0A", green:"#166534", red:"#991B1B", orange:"#92400E",
  warn:"#FEF3C7", warnBorder:"#D4B84A",
};

const TABS = [
  { id:"e1", label:"1. Carga",        icon:"⚓" },
  { id:"e2", label:"2. Navegación Ida", icon:"🧭" },
  { id:"e3", label:"3. Descarga",     icon:"🏭" },
  { id:"e4", label:"4. Vuelta Lastre", icon:"↩️" },
  { id:"mc", label:"5. Monte Carlo",  icon:"🎲" },
  { id:"cl", label:"6. Base Clima",   icon:"🌦️" },
  { id:"sc", label:"7. Escenarios",   icon:"💾" },
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

.hdr{background:#213363;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:56px;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(33,51,99,.3)}
.hdr-brand{display:flex;flex-direction:column}
.hdr-title{font-size:12px;font-weight:800;color:#fff;letter-spacing:.3px}
.hdr-sub{font-size:9px;color:rgba(255,255,255,.4);font-family:'DM Mono',monospace;letter-spacing:.5px}
.hdr-kpis{display:flex}
.hdr-kpi{padding:3px 16px;border-left:1px solid rgba(255,255,255,.12);text-align:right}
.hdr-kpi-v{font-size:15px;font-weight:800;color:#fff;font-family:'DM Mono',monospace}
.hdr-kpi-l{font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px}
.back{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);font-size:10px;font-weight:600;padding:4px 12px;border-radius:6px;letter-spacing:.3px}
.back:hover{background:rgba(255,255,255,.2);color:#fff}

.tabs{background:#fff;border-bottom:1px solid #D6E0ED;display:flex;padding:0 28px;overflow-x:auto;position:sticky;top:56px;z-index:99}
.tab{padding:12px 16px;border:none;background:transparent;color:#6381A7;font-size:11px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;letter-spacing:.3px}
.tab.on{color:#213363;border-bottom-color:#235C96}
.tab:hover:not(.on){color:#213363;background:#EEF2F7}

.page{max-width:1240px;margin:0 auto;padding:20px 24px 60px}
.card{background:#fff;border:1px solid #D6E0ED;border-radius:10px;padding:16px 20px;margin-bottom:12px}
.ct{font-size:9px;font-weight:700;color:#235C96;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #D6E0ED;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}

.kpis{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.kpi{flex:1;min-width:100px;background:#EEF2F7;border:1px solid #D6E0ED;border-radius:8px;padding:10px 12px}
.kpi-v{font-size:18px;font-weight:800;line-height:1;font-family:'DM Mono',monospace}
.kpi-l{font-size:9px;color:#6381A7;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.kpi-u{font-size:10px;color:#6381A7;margin-top:2px}

.campo{margin-bottom:8px}
.campo-label{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.campo-input{width:100%;border-radius:6px;padding:6px 10px;font-size:13px;border-width:1px;border-style:solid;font-family:'Montserrat',sans-serif}
.campo-formula{width:100%;border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Mono',monospace;border-width:1px;border-style:solid;cursor:default}
.campo-nota{font-size:10px;margin-top:2px;color:#6381A7}

.tipo-badge{display:inline-flex;align-items:center;font-size:8px;font-weight:700;padding:1px 6px;border-radius:3px;letter-spacing:.3px;text-transform:uppercase}

.trow{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.tbtn{padding:4px 11px;border-radius:6px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:11px;font-weight:600;transition:all .15s}
.tbtn.on{background:#213363;border-color:#213363;color:#fff}

/* COST TABLE */
.cost-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
.cost-table th{padding:6px 10px;background:#213363;color:rgba(255,255,255,.7);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:left}
.cost-table th:last-child,.cost-table td:last-child{text-align:right}
.cost-table th:nth-child(3),.cost-table td:nth-child(3){text-align:right;color:#6381A7}
.cost-table td{padding:7px 10px;border-bottom:1px solid #EEF2F7}
.cost-table tr:nth-child(even) td{background:#F9FAFB}
.cost-table tr.total td{background:#EEF2F7;font-weight:800;font-size:13px}
.cost-table .mono{font-family:'DM Mono',monospace}
.cost-table .ecuacion{font-size:10px;color:#6381A7;font-family:'DM Mono',monospace}

/* HOVER TOOLTIP */
.hover-wrap{position:relative;display:inline-block;cursor:help}
.hover-wrap:hover .hover-tip{display:block}
.hover-tip{display:none;position:absolute;bottom:calc(100% + 6px);right:0;background:#213363;border:1px solid #1a3356;border-radius:8px;padding:10px 14px;min-width:280px;max-width:380px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.hover-tip-title{font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:700}
.hover-tip-line{font-size:11px;color:rgba(255,255,255,.85);font-family:'DM Mono',monospace;padding:2px 0;line-height:1.5}
.hover-tip-total{font-size:12px;color:#fff;font-weight:800;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.2);font-family:'DM Mono',monospace}

.run{padding:8px 22px;border-radius:8px;border:none;background:#213363;color:#fff;font-size:12px;font-weight:700;transition:all .2s;letter-spacing:.3px}
.run:hover:not(:disabled){background:#235C96}
.run:disabled{background:#A5B5CC;cursor:not-allowed}

.pbadge{flex:1;min-width:110px;border-radius:8px;padding:10px 14px;border-width:1px;border-style:solid}
.pbadge-v{font-size:19px;font-weight:800;font-family:'DM Mono',monospace;line-height:1}
.pbadge-l{font-size:9px;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.pbadge-d{font-size:10px;margin-top:3px;opacity:.7}

.espejo-warn{background:#FEF3C7;border:1px solid #D4B84A;border-radius:8px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#92400E}
.espejo-ok{background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:7px 14px;margin-bottom:10px;font-size:11px;color:#166534}
.src-note{font-size:10px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:6px;padding:7px 11px;margin-top:6px;color:#166534;border-left:3px solid #86EFAC}
.warn-note{font-size:10px;background:#FEF3C7;border:1px solid #D4B84A;border-radius:6px;padding:7px 11px;margin-top:6px;color:#92400E;border-left:3px solid #D4B84A}

.mc-var-row{display:grid;grid-template-columns:170px 150px 200px 80px;gap:8px;padding:6px 10px;border-radius:6px;font-size:11px;align-items:center}
.mc-var-row:nth-child(odd){background:#EEF2F7}

.tramo-input{width:58px;border-radius:5px;padding:3px 6px;font-size:12px;font-weight:700;font-family:'DM Mono',monospace;text-align:center;border-width:1px;border-style:solid}

.mapa-svg{width:100%;border-radius:8px;background:#EFF6FF;border:1px solid #D6E0ED}

.mes-selector{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.mes-btn{padding:3px 10px;border-radius:5px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:10px;font-weight:600;transition:all .15s}
.mes-btn.on{background:#213363;border-color:#213363;color:#fff}

/* CLIMA TABLE */
.clima-table{width:100%;border-collapse:collapse;font-size:12px}
.clima-table th{padding:7px 10px;background:#213363;color:rgba(255,255,255,.7);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:center}
.clima-table td{padding:5px 8px;border-bottom:1px solid #EEF2F7;text-align:center}
.clima-table tr:nth-child(even) td{background:#F9FAFB}
.clima-table input{width:60px;background:#FFFBEB;border:1px solid #D4B84A;border-radius:4px;padding:3px 5px;color:#78610E;font-size:11px;text-align:center;font-family:'DM Mono',monospace}
.clima-table .calc{background:#F9FAFB;border:1px solid #D1D5DB;border-radius:4px;padding:3px 5px;color:#374151;font-size:11px;font-family:'DM Mono',monospace;display:inline-block;min-width:60px}
`;

// ─── UI HELPERS ────────────────────────────────────────────────────────────
const TipoBadge = ({ tipo }) => {
  const cfg = {
    usuario:    {bg:"#FFFBEB",c:"#78610E",l:"Input"},
    input:      {bg:"#FFFBEB",c:"#78610E",l:"Input"},
    estadistico:{bg:"#DCFCE7",c:"#166534",l:"Estadístico"},
    stat:       {bg:"#DCFCE7",c:"#166534",l:"Estadístico"},
    formula:    {bg:"#F3F4F6",c:"#374151",l:"Fórmula"},
  };
  const s = cfg[tipo] || cfg.formula;
  return <span className="tipo-badge" style={{background:s.bg,color:s.c}}>{s.l}</span>;
};

const FuenteLink = ({ fuente }) => (
  <a href={fuente.url} target="_blank" rel="noreferrer"
    style={{fontSize:9,color:C.blue,textDecoration:"none",borderBottom:"1px dashed #235C96",marginLeft:4}}>
    {fuente.label} ↗
  </a>
);

const Campo = ({ label, value, onChange, tipo="usuario", unit, min, max, step=1, nota }) => {
  const st = T[tipo] || T.formula;
  return (
    <div className="campo">
      <div className="campo-label" style={{color:st.label}}>
        {label}{unit?` (${unit})`:""}
        <TipoBadge tipo={tipo}/>
      </div>
      {tipo==="formula" || tipo==="stat" ? (
        <div className="campo-formula" style={{background:st.bg,borderColor:st.border,color:st.text}}>{value}</div>
      ) : (
        <input className="campo-input" type="number" value={value} min={min} max={max} step={step}
          onChange={e=>onChange&&onChange(parseFloat(e.target.value)||0)}
          style={{background:st.bg,borderColor:st.border,color:st.text}}/>
      )}
      {nota&&<div className="campo-nota">{nota}</div>}
    </div>
  );
};

const Toggle = ({ label, options, value, onChange, tipo="usuario" }) => {
  const st = T[tipo] || T.formula;
  return (
    <div style={{marginBottom:10}}>
      <div className="campo-label" style={{color:st.label}}>{label}<TipoBadge tipo={tipo}/></div>
      <div className="trow">
        {options.map(o=>(
          <button key={o} className={`tbtn ${value===o?"on":""}`} onClick={()=>onChange(o)}>{o}</button>
        ))}
      </div>
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

// Hover tooltip para valores calculados
const HoverVal = ({ value, title, lines, isTotal }) => (
  <div className="hover-wrap">
    <span style={{
      fontFamily:"DM Mono,monospace", fontWeight:isTotal?800:700,
      fontSize:isTotal?14:13, color:isTotal?C.navy:C.navy,
      borderBottom:"1px dashed #A5B5CC", cursor:"help",
    }}>{value}</span>
    <div className="hover-tip">
      <div className="hover-tip-title">{title}</div>
      {lines.map((l,i)=><div key={i} className="hover-tip-line">{l}</div>)}
    </div>
  </div>
);

const EspejoCheck = ({p}) => {
  const checks = (checkEspejo(p)||[]).filter(Boolean);
  const hasDiff = checks.some(c=>c.difiere);
  if(!hasDiff) return <div className="espejo-ok">✓ Campos espejo carga ↔ descarga iguales.</div>;
  return (
    <div className="espejo-warn">
      ⚠️ Difieren entre Carga y Descarga:
      {checks.filter(c=>c.difiere).map((c,i)=>(
        <span key={i} style={{marginLeft:8}}><strong>{c.label}</strong>: C={c.valCap} D={c.valDes}</span>
      ))}
    </div>
  );
};

const MesSelector = ({ value, onChange }) => (
  <div className="mes-selector">
    {MESES.map((m,i)=>(
      <button key={m} className={`mes-btn ${value===i?"on":""}`} onClick={()=>onChange(i)}>{m}</button>
    ))}
  </div>
);

const TTip = { contentStyle:{background:"#213363",border:"1px solid #1a3356",color:"#fff",fontSize:11} };

// ─── TABLA DE COSTOS ───────────────────────────────────────────────────────
function CostTable({ rows, tnEntregadas }) {
  return (
    <table className="cost-table">
      <thead>
        <tr>
          <th>Concepto</th>
          <th>Ecuación</th>
          <th>USD/Tn</th>
          <th>Total USD</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i) => {
          const usdTn = tnEntregadas > 0 ? r.total / tnEntregadas : 0;
          const isTotal = r.isTotal;
          return (
            <tr key={i} className={isTotal?"total":""}>
              <td style={{fontWeight:isTotal?800:500,color:isTotal?C.navy:undefined}}>{r.label}</td>
              <td className="ecuacion">{r.eq}</td>
              <td className="mono" style={{color:C.mid,textAlign:"right"}}>
                {isTotal?<strong>${usdTn.toFixed(1)}</strong>:`$${usdTn.toFixed(1)}`}
              </td>
              <td style={{textAlign:"right"}}>
                <HoverVal
                  value={`$${r.total.toLocaleString("es-AR",{maximumFractionDigits:0})}`}
                  title={r.label}
                  lines={r.hover||[r.eq]}
                  isTotal={isTotal}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── MAPA SVG ──────────────────────────────────────────────────────────────
function MapaNavegacion({ tramos, onUpdate, vuelta=false }) {
  const { velProm, totalMn, totalHrs } = velPromedioPonderada(tramos);
  const puntos = [
    {x:55, y:75,  n:"Zárate",       s:"Km 102"},
    {x:175,y:115, n:"Confluencia",  s:"Paraná/Uruguay"},
    {x:305,y:158, n:"Río de la Plata", s:"Estuario"},
    {x:455,y:200, n:"Punta Indio",  s:"Canal Ppal."},
    {x:635,y:258, n:"Rada BB",      s:"Exterior"},
    {x:735,y:282, n:"Sea White",    s:"Bahía Blanca"},
  ];
  const cols = {"Hidrovía":"#235C96","Estuario":"#0D7490","Costero":"#166534","Puerto":"#5B21B6"};

  return (
    <div>
      <svg viewBox="0 0 800 330" className="mapa-svg" style={{minHeight:200}}>
        <defs>
          <linearGradient id="agua" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DBEAFE"/>
            <stop offset="100%" stopColor="#BFDBFE"/>
          </linearGradient>
        </defs>
        <rect width="800" height="330" fill="url(#agua)" rx="8"/>
        <path d="M0,55 Q80,45 180,95 Q280,135 380,165 Q500,196 650,238 Q720,262 800,278 L800,330 L0,330 Z"
          fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1"/>
        {tramos.map((t,i)=>{
          const a=puntos[i],b=puntos[i+1];
          if(!a||!b) return null;
          const c=cols[t.tipo]||C.blue;
          const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
          return (
            <g key={t.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c}
                strokeWidth={vuelta?2:3} strokeDasharray={vuelta?"6,3":""} opacity={.8}/>
              <rect x={mx-20} y={my-11} width={40} height={18} rx={4} fill={c} opacity={.9}/>
              <text x={mx} y={my+2} textAnchor="middle" fontSize="10" fontWeight="700"
                fill="#fff" fontFamily="DM Mono,monospace">{t.velocidad}kt</text>
            </g>
          );
        })}
        {puntos.map((pt,i)=>(
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={7}
              fill={i===0?"#213363":i===5?"#166534":"#235C96"} stroke="#fff" strokeWidth={2}/>
            <text x={pt.x} y={pt.y-13} textAnchor="middle" fontSize="9" fontWeight="700" fill="#213363">{pt.n}</text>
            <text x={pt.x} y={pt.y-4}  textAnchor="middle" fontSize="7" fill="#6381A7">{pt.s}</text>
          </g>
        ))}
        <rect x={8} y={295} width={220} height={28} rx={5} fill="rgba(33,51,99,.85)"/>
        <text x={16} y={306} fontSize="8" fill="rgba(255,255,255,.5)" fontWeight="600">VELOCIDAD PROMEDIO PONDERADA</text>
        <text x={16} y={318} fontSize="12" fill="#fff" fontWeight="800" fontFamily="DM Mono,monospace">
          {velProm.toFixed(1)}kt · {totalMn}mn · {totalHrs.toFixed(1)}hs
        </text>
        {vuelta&&<text x={670} y={25} fontSize="10" fill="#6381A7" fontWeight="700">↩ VUELTA EN LASTRE</text>}
        {!vuelta&&<text x={680} y={25} fontSize="10" fill="#235C96" fontWeight="700">→ IDA CARGADO</text>}
      </svg>

      {!vuelta&&(
        <div style={{marginTop:10,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.navy}}>
                {["Tramo","Tipo","Dist (mn)","Vel (kt)","Horas","Condición"].map(h=>(
                  <th key={h} style={{padding:"7px 9px",color:"rgba(255,255,255,.6)",fontSize:9,textAlign:"left",fontWeight:600,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tramos.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"7px 9px",color:C.navy,fontWeight:600,fontSize:11}}>{t.nombre}</td>
                  <td style={{padding:"7px 9px"}}>
                    <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:`${cols[t.tipo]||C.blue}18`,color:cols[t.tipo]||C.blue,fontWeight:700}}>{t.tipo}</span>
                  </td>
                  <td style={{padding:"7px 9px"}}>
                    <input className="tramo-input" type="number" value={t.distancia} min={1} max={1000} step={5}
                      style={{background:T.formula.bg,borderColor:T.formula.border,color:T.formula.text}}
                      onChange={e=>{const arr=[...tramos];arr[i]={...t,distancia:parseFloat(e.target.value)||0};onUpdate(arr);}}/>
                  </td>
                  <td style={{padding:"7px 9px"}}>
                    <input className="tramo-input" type="number" value={t.velocidad} min={1} max={20} step={0.5}
                      style={{background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}
                      onChange={e=>{const arr=[...tramos];arr[i]={...t,velocidad:parseFloat(e.target.value)||0};onUpdate(arr);}}/>
                  </td>
                  <td style={{padding:"7px 9px",color:C.gold,fontWeight:700,fontFamily:"DM Mono,monospace",fontSize:11}}>
                    {(t.distancia/t.velocidad).toFixed(1)}
                  </td>
                  <td style={{padding:"7px 9px",color:C.mid,fontSize:10}}>{t.condicion}</td>
                </tr>
              ))}
              <tr style={{background:"#EEF2F7",fontWeight:700}}>
                <td style={{padding:"8px 9px",color:C.navy}} colSpan={2}>TOTAL / PROMEDIO</td>
                <td style={{padding:"8px 9px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalMn} mn</td>
                <td style={{padding:"8px 9px",color:C.blue,fontFamily:"DM Mono,monospace",fontSize:14}}>{velProm.toFixed(1)} kt ⌀</td>
                <td style={{padding:"8px 9px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalHrs.toFixed(1)} hs</td>
                <td style={{padding:"8px 9px",color:C.mid,fontSize:10}}>{(totalHrs/24).toFixed(1)} días</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── TAB E1: CARGA ─────────────────────────────────────────────────────────
function TabCarga({p,set,tnEntregadas}) {
  const [mes,setMes] = useState(5);
  const e1 = calcEtapa1(p,mes);

  const costRows = [
    {label:"Costo arena",      eq:`$${e1.precioArena}×${p.cap_capacidadBarco.toLocaleString()}Tn`, total:e1.costoArena,    hover:[e1.hoverTotal[0]]},
    {label:"Costo merma",      eq:`$${e1.precioArena}×${e1.mermaTn.toFixed(0)}Tn`,                 total:e1.costoMerma,    hover:[e1.hoverTotal[1]]},
    {label:"Opex carga",       eq:`$${p.cap_opexUSDTn}/Tn×${p.cap_capacidadBarco.toLocaleString()}Tn`, total:e1.costoOpex, hover:[e1.hoverTotal[2]]},
    {label:"Combustible puerto",eq:`${e1.tReal_dias.toFixed(1)}d×${p.nav_consumoPuerto}T/d×$${p.nav_precioVLSFO}`,total:e1.combPuerto, hover:[e1.hoverTotal[3]]},
    {label:"Time Charter",     eq:`${e1.tReal_dias.toFixed(1)}d×$${p.nav_timeCharter}/d`,          total:e1.fleteEtapa,    hover:[e1.hoverTotal[4]]},
    {label:"Agencia Zárate",   eq:"costo fijo por escala",                                          total:e1.agencia,       hover:[e1.hoverTotal[5]]},
    {label:"TOTAL ETAPA 1",    eq:"Σ costos etapa carga",                                           total:e1.costoTotal,    hover:e1.hoverTotal, isTotal:true},
  ];

  return (
    <div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:4,fontWeight:600}}>MES DE ANÁLISIS</div>
        <MesSelector value={mes} onChange={setMes}/>
      </div>

      <div className="kpis">
        <KPI label="Vel. carga ideal" value={`${e1.velIdeal_TnMin.toFixed(1)} Tn/min`} color={T.formula.text}/>
        <KPI label="Tiempo ideal" value={`${e1.tIdeal_dias.toFixed(1)} días`} color={T.formula.text}/>
        <KPI label="Tiempo real" value={`${e1.tReal_dias.toFixed(1)} días`} color={C.gold}/>
        <KPI label="Merma carga" value={`${e1.mermaTn.toFixed(0)} Tn`} unit={`${(p.cap_pctMerma*100).toFixed(1)}%`} color={C.red}/>
        <KPI label="Costo etapa 1" value={`$${(e1.costoTotal/1000).toFixed(0)}k`} color={C.navy}/>
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
              <Campo tipo="formula" label="Días extra por clima" value={`${e1.diasInop.toFixed(1)} días`}/>
            </div>
            <div className="warn-note">⚠️ Datos estimados — pendiente validación con SMN. Ver pestaña Base Clima.</div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="ct">Fórmulas — Velocidad y Tiempo <TipoBadge tipo="formula"/></div>
            <table className="cost-table">
              <thead><tr><th>Variable</th><th>Ecuación</th><th colSpan={2}>Resultado</th></tr></thead>
              <tbody>
                {[
                  {l:"Vel. ideal",      eq:`${p.cap_gruas}×${p.cap_grampada}×${p.cap_densidadArena}×${p.cap_movGrampa}`, v:e1.velIdeal_TnMin.toFixed(1)+" Tn/min", hover:e1.hoverVel},
                  {l:"Vel. / hora",     eq:"velMin × 60",  v:e1.velIdeal_TnHr.toFixed(1)+" Tn/hr",  hover:`${e1.velIdeal_TnMin.toFixed(1)} × 60 = ${e1.velIdeal_TnHr.toFixed(1)} Tn/hr`},
                  {l:"T ideal (hs)",    eq:"capacidad / vel_hr", v:e1.tIdeal_hr.toFixed(1)+" hs",   hover:`${p.cap_capacidadBarco} ÷ ${e1.velIdeal_TnHr.toFixed(1)} = ${e1.tIdeal_hr.toFixed(1)} hs`},
                  {l:"T ideal (días)",  eq:"horas / horastrabajadasDía", v:e1.tIdeal_dias.toFixed(1)+" días", hover:e1.hoverTIdeal},
                  {l:"Días inop.",      eq:"tIdeal×pInop÷(1−pInop)", v:e1.diasInop.toFixed(1)+" días", hover:e1.hoverInop},
                  {l:"T real carga",    eq:"tIdeal + inop + espera", v:e1.tReal_dias.toFixed(1)+" días", hover:e1.hoverTReal},
                  {l:"Merma (Tn)",      eq:`${p.cap_capacidadBarco}×${(p.cap_pctMerma*100).toFixed(1)}%`, v:e1.mermaTn.toFixed(0)+" Tn", hover:e1.hoverMerma},
                  {l:"Tn post-carga",   eq:"capacidad − merma", v:e1.tnPostCarga.toFixed(0)+" Tn",  hover:`${p.cap_capacidadBarco} − ${e1.mermaTn.toFixed(0)} = ${e1.tnPostCarga.toFixed(0)} Tn`},
                ].map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600,color:C.navy}}>{r.l}</td>
                    <td className="ecuacion">{r.eq}</td>
                    <td colSpan={2}>
                      <HoverVal value={r.v} title={r.l} lines={[r.hover]}/>
                    </td>
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

// ─── TAB E2: NAVEGACIÓN IDA ────────────────────────────────────────────────
function TabNavegacion({p,set,tnEntregadas}) {
  const e2 = calcEtapa2(p);

  const costRows = [
    {label:"Combustible ida",  eq:`${e2.diasNav.toFixed(1)}d×${p.nav_consumoNavegando}T/d×$${p.nav_precioVLSFO}`, total:e2.combNav,    hover:[e2.hoverTotal[0]]},
    {label:"Time Charter ida", eq:`${e2.diasNav.toFixed(1)}d×$${p.nav_timeCharter}/d`,                            total:e2.fleteNav,   hover:[e2.hoverTotal[1]]},
    {label:"TOTAL ETAPA 2",    eq:"Σ costos navegación ida",                                                        total:e2.costoTotal, hover:e2.hoverTotal, isTotal:true},
  ];

  return (
    <div>
      <div className="kpis">
        <KPI label="Vel. promedio" value={`${e2.velProm.toFixed(1)} kt`} color={T.formula.text}/>
        <KPI label="Distancia" value={`${e2.totalMn} mn`} color={T.input.text}/>
        <KPI label="Días navegación" value={`${e2.diasNav.toFixed(1)} días`} color={T.formula.text}/>
        <KPI label="Combustible ida" value={`$${(e2.combNav/1000).toFixed(1)}k`} color={C.gold}/>
        <KPI label="Costo etapa 2" value={`$${(e2.costoTotal/1000).toFixed(1)}k`} color={C.navy}/>
        <KPI label="USD/Tn etapa" value={`$${(e2.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>

      <div className="card">
        <div className="ct">Ruta — Zárate → Sea White (Bahía Blanca)</div>
        <MapaNavegacion tramos={p.nav_tramos} onUpdate={arr=>set("nav_tramos",arr)}/>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros Económicos <TipoBadge tipo="usuario"/></div>
          <div className="g2">
            <Campo label="Time Charter" value={p.nav_timeCharter} onChange={v=>set("nav_timeCharter",v)} tipo="usuario" unit="USD/día" min={5000} max={50000} step={500}/>
            <Campo label="Precio VLSFO" value={p.nav_precioVLSFO} onChange={v=>set("nav_precioVLSFO",v)} tipo="usuario" unit="USD/T" min={400} max={1500} step={10}/>
            <Campo label="Consumo navegando" value={p.nav_consumoNavegando} onChange={v=>set("nav_consumoNavegando",v)} tipo="usuario" unit="T/día" min={5} max={40} step={0.5}/>
            <Campo label="Consumo en puerto" value={p.nav_consumoPuerto} onChange={v=>set("nav_consumoPuerto",v)} tipo="usuario" unit="T/día" min={1} max={20} step={0.5} nota="Aplica en etapas 1 y 3"/>
          </div>
        </div>
        <div className="card">
          <div className="ct">Costos Etapa 2 <TipoBadge tipo="formula"/></div>
          <CostTable rows={costRows} tnEntregadas={tnEntregadas}/>
          <div style={{marginTop:10,padding:"8px 12px",background:"#EEF2F7",borderRadius:8,fontSize:11,color:C.muted}}>
            Vel. promedio ponderada = <HoverVal value={`${e2.velProm.toFixed(1)} kt`} title="Velocidad Promedio" lines={[e2.hoverVelProm]}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E3: DESCARGA ──────────────────────────────────────────────────────
function TabDescarga({p,set,tnEntregadas}) {
  const [mes,setMes] = useState(5);
  const e1 = calcEtapa1(p,mes);
  const e3 = calcEtapa3(p,mes,e1.tnPostCarga);

  const costRows = [
    {label:"Opex descarga",     eq:`$${p.des_opexUSDTn}/Tn×${e3.tnEntrada.toFixed(0)}Tn`,                       total:e3.costoOpex,     hover:[e3.hoverTotal[0]]},
    {label:"Camiones directo",  eq:`$${p.des_costoCamionesDirUSDTn}/Tn×${e3.tnDirecto.toFixed(0)}Tn`,           total:e3.costoCamiones, hover:[e3.hoverTotal[1]]},
    {label:"Acopio BB",         eq:`$${p.des_costoAcopioUSDTn}/Tn×${e3.tnAcopio.toFixed(0)}Tn`,                 total:e3.costoAcopio,   hover:[e3.hoverTotal[2]]},
    {label:"Combustible puerto",eq:`${e3.tReal_dias.toFixed(1)}d×${p.nav_consumoPuerto}T/d×$${p.nav_precioVLSFO}`, total:e3.combPuerto, hover:[e3.hoverTotal[3]]},
    {label:"Time Charter",      eq:`${e3.tReal_dias.toFixed(1)}d×$${p.nav_timeCharter}/d`,                       total:e3.fleteEtapa,    hover:[e3.hoverTotal[4]]},
    {label:"Agencia BB",        eq:"costo fijo por escala",                                                        total:e3.agencia,       hover:[e3.hoverTotal[5]]},
    {label:"TOTAL ETAPA 3",     eq:"Σ costos etapa descarga",                                                      total:e3.costoTotal,    hover:e3.hoverTotal, isTotal:true},
  ];

  return (
    <div>
      <EspejoCheck p={p}/>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:4,fontWeight:600}}>MES DE ANÁLISIS</div>
        <MesSelector value={mes} onChange={setMes}/>
      </div>

      <div className="kpis">
        <KPI label="Tn entrada" value={e3.tnEntrada.toFixed(0)} unit="post merma carga" color={T.formula.text}/>
        <KPI label="T. ideal descarga" value={`${e3.tIdeal_dias.toFixed(1)} días`} color={T.formula.text}/>
        <KPI label="T. real descarga" value={`${e3.tReal_dias.toFixed(1)} días`} color={C.gold}/>
        <KPI label="Tn entregadas" value={e3.tnEntregadas.toFixed(0)} color={C.green}/>
        <KPI label="Costo etapa 3" value={`$${(e3.costoTotal/1000).toFixed(0)}k`} color={C.navy}/>
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
              <Campo label="Camiones (directo)" value={p.des_costoCamionesDirUSDTn} onChange={v=>set("des_costoCamionesDirUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={1}/>
              <Campo label="Acopio BB" value={p.des_costoAcopioUSDTn} onChange={v=>set("des_costoAcopioUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Agencia BB" value={p.des_agenciaBB} onChange={v=>set("des_agenciaBB",v)} tipo="usuario" unit="USD" min={0} step={500}/>
            </div>
            <Toggle label="Horas trabajo/día" options={[4,8,12,14,24]} value={p.des_horasDia} onChange={v=>set("des_horasDia",v)} tipo="usuario"/>
            <div className="g2">
              <Campo label="Merma descarga" value={p.des_pctMermaDescarga*100} onChange={v=>set("des_pctMermaDescarga",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1}/>
              <Campo label="Merma acopio" value={p.des_pctMermaAcopio*100} onChange={v=>set("des_pctMermaAcopio",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1}/>
            </div>
            <div style={{marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,fontWeight:700,color:C.green}}>Despacho directo</span>
                <span style={{fontSize:15,fontWeight:800,color:C.green,fontFamily:"DM Mono,monospace"}}>{((1-p.des_pctAcopio)*100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={1-p.des_pctAcopio}
                onChange={e=>set("des_pctAcopio",parseFloat((1-e.target.value).toFixed(1)))}
                style={{accentColor:C.green}}/>
              <div className="g3" style={{marginTop:8}}>
                {[{l:"Directo",v:`${e3.tnDirecto.toFixed(0)} Tn`,c:C.green},{l:"Acopio",v:`${e3.tnAcopio.toFixed(0)} Tn`,c:C.gold},{l:"Entregadas",v:`${e3.tnEntregadas.toFixed(0)} Tn`,c:C.navy}].map(({l,v,c})=>(
                  <div key={l} style={{background:"#EEF2F7",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:C.muted,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:c,fontFamily:"DM Mono,monospace"}}>{v}</div>
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
              <Campo tipo="formula" label="Días extra clima" value={`${e3.diasInop.toFixed(1)} días`}/>
            </div>
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6}}>ESPERA BB POR MES (días) <TipoBadge tipo="estadistico"/></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
                {MESES.map((m,i)=>(
                  <div key={m}>
                    <div style={{fontSize:8,color:T.stat.label,textAlign:"center",marginBottom:2,fontWeight:700}}>{m}</div>
                    <input type="number" value={p.des_esperaBBMes[i]} step={0.1} min={0} max={15}
                      onChange={e=>{const arr=[...p.des_esperaBBMes];arr[i]=parseFloat(e.target.value)||0;set("des_esperaBBMes",arr);}}
                      style={{width:"100%",background:T.stat.bg,border:`1px solid ${T.stat.border}`,
                        borderRadius:5,padding:"3px 4px",color:T.stat.text,fontSize:11,textAlign:"center",fontFamily:"DM Mono,monospace"}}/>
                  </div>
                ))}
              </div>
            </div>
            <div className="warn-note">⚠️ Datos estimados. Ver pestaña Base Clima. Fuente espera: validar con Argelan (agencia BB).</div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="ct">Fórmulas — Tiempo Real Descarga <TipoBadge tipo="formula"/></div>
            <table className="cost-table">
              <thead><tr><th>Variable</th><th>Ecuación</th><th colSpan={2}>Resultado</th></tr></thead>
              <tbody>
                {[
                  {l:"Tn entrada",      eq:"cap. − merma carga",                         v:`${e3.tnEntrada.toFixed(0)} Tn`,       hover:`${p.cap_capacidadBarco} − ${e1.mermaTn.toFixed(0)} = ${e3.tnEntrada.toFixed(0)} Tn`},
                  {l:"Vel. descarga",   eq:`${p.des_gruas}×${p.des_grampada}×${p.cap_densidadArena}×${p.des_movGrampa}`, v:`${e3.velIdeal_TnMin.toFixed(1)} Tn/min`, hover:e3.hoverVel},
                  {l:"T ideal (días)",  eq:"tnEntrada / vel_hr / horastrabajadasDía",              v:`${e3.tIdeal_dias.toFixed(1)} días`,   hover:`${e3.tnEntrada.toFixed(0)} ÷ ${e3.velIdeal_TnHr.toFixed(1)} ÷ ${p.des_horasDia} = ${e3.tIdeal_dias.toFixed(1)} días`},
                  {l:"T real descarga", eq:"tIdeal + inop + esperaBB",                  v:`${e3.tReal_dias.toFixed(1)} días`,    hover:e3.hoverTReal},
                  {l:"Merma descarga",  eq:`${e3.tnEntrada.toFixed(0)}×${(p.des_pctMermaDescarga*100).toFixed(1)}%`,  v:`${e3.mermaDescarga_Tn.toFixed(0)} Tn`, hover:`${e3.tnEntrada.toFixed(0)} × ${(p.des_pctMermaDescarga*100).toFixed(1)}% = ${e3.mermaDescarga_Tn.toFixed(0)} Tn`},
                  {l:"Merma acopio",    eq:`${e3.tnAcopio.toFixed(0)}×${(p.des_pctMermaAcopio*100).toFixed(1)}%`,    v:`${e3.mermaAcopio_Tn.toFixed(0)} Tn`,  hover:`${e3.tnAcopio.toFixed(0)} × ${(p.des_pctMermaAcopio*100).toFixed(1)}% = ${e3.mermaAcopio_Tn.toFixed(0)} Tn`},
                  {l:"Tn entregadas",   eq:"tnPostDesc − mermaAcopio",                  v:`${e3.tnEntregadas.toFixed(0)} Tn`,    hover:`${e3.tnPostDescarga.toFixed(0)} − ${e3.mermaAcopio_Tn.toFixed(0)} = ${e3.tnEntregadas.toFixed(0)} Tn`},
                ].map((r,i)=>(
                  <tr key={i}><td style={{fontWeight:600,color:C.navy}}>{r.l}</td><td className="ecuacion">{r.eq}</td>
                    <td colSpan={2}><HoverVal value={r.v} title={r.l} lines={[r.hover]}/></td>
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
  const e4 = calcEtapa4(p);
  const costRows = [
    {label:"Combustible lastre", eq:`${e4.diasNav.toFixed(1)}d×${p.vta_consumoLastre}T/d×$${p.nav_precioVLSFO}`, total:e4.combLastre, hover:[e4.hoverTotal[0]]},
    {label:"Time Charter vuelta",eq:`${e4.diasNav.toFixed(1)}d×$${p.nav_timeCharter}/d`,                          total:e4.fleteNav,   hover:[e4.hoverTotal[1]]},
    {label:"TOTAL ETAPA 4",      eq:"Σ costos vuelta en lastre",                                                    total:e4.costoTotal, hover:e4.hoverTotal, isTotal:true},
  ];
  return (
    <div>
      <div className="kpis">
        <KPI label="Días vuelta" value={`${e4.diasNav.toFixed(1)} días`} color={T.formula.text}/>
        <KPI label="Consumo lastre" value={`${p.vta_consumoLastre} T/día`} color={T.input.text}/>
        <KPI label="Combustible vuelta" value={`$${(e4.combLastre/1000).toFixed(1)}k`} color={C.gold}/>
        <KPI label="Costo etapa 4" value={`$${(e4.costoTotal/1000).toFixed(1)}k`} color={C.navy}/>
        <KPI label="USD/Tn etapa" value={`$${(e4.costoTotal/tnEntregadas).toFixed(1)}`} color={C.gold}/>
      </div>
      <div className="card">
        <div className="ct">Ruta Vuelta — Sea White → Zárate (mismos tramos en reversa)</div>
        <MapaNavegacion tramos={[...p.nav_tramos].reverse()} onUpdate={()=>{}} vuelta={true}/>
      </div>
      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros Vuelta <TipoBadge tipo="usuario"/></div>
          <Campo label="Consumo en lastre" value={p.vta_consumoLastre} onChange={v=>set("vta_consumoLastre",v)} tipo="usuario" unit="T/día" min={5} max={35} step={0.5} nota="Barco vacío — típico Handysize: 10–13 T/día"/>
          <Campo label="Espera Zárate (vuelta)" value={p.vta_esperaZarateDias} onChange={v=>set("vta_esperaZarateDias",v)} tipo="usuario" unit="días" min={0} max={5} step={0.25}/>
          <div style={{marginTop:10,padding:"10px 14px",background:C.warn,border:`1px solid ${C.warnBorder}`,borderRadius:8}}>
            <div style={{fontSize:10,color:C.orange,fontWeight:700}}>Ahorro combustible vs. ida cargado</div>
            <HoverVal
              value={`$${((p.nav_consumoNavegando-p.vta_consumoLastre)*e4.diasNav*p.nav_precioVLSFO).toFixed(0)} USD`}
              title="Ahorro combustible"
              lines={[`(${p.nav_consumoNavegando} − ${p.vta_consumoLastre}) T/d × ${e4.diasNav.toFixed(1)}d × $${p.nav_precioVLSFO} = $${((p.nav_consumoNavegando-p.vta_consumoLastre)*e4.diasNav*p.nav_precioVLSFO).toFixed(0)}`]}
            />
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
function TabMC({p}) {
  const [n,setN]     = useState(5000);
  const [mes,setMes] = useState(null);
  const [res,setRes] = useState(null);
  const [mcMes,setMcMes] = useState(null);
  const [running,setR]   = useState(false);
  const [runM,setRM]     = useState(false);
  const det = calcTotal(p, mes??5);

  const run = useCallback(()=>{
    setR(true);
    setTimeout(()=>{setRes(runMonteCarlo(p,n,mes));setR(false);},60);
  },[p,n,mes]);

  const runMC = useCallback(()=>{
    setRM(true);
    setTimeout(()=>{setMcMes(runMCMensual(p,2000));setRM(false);},80);
  },[p]);

  const pBadges = res ? [
    {l:"P10 Optimista", v:res.p10, bg:"#F0FDF4", bc:"#86EFAC", c:C.green,  d:"10% de escenarios es mejor"},
    {l:"P25",           v:res.p25, bg:"#F0FDF4", bc:"#86EFAC", c:"#1a7a3a",d:"Cuartil optimista"},
    {l:"P50 Probable",  v:res.p50, bg:"#FFFBEB", bc:"#D4B84A", c:C.gold,   d:"Mediana — más frecuente"},
    {l:"P75",           v:res.p75, bg:"#FEF3C7", bc:"#D4B84A", c:C.orange, d:"Cuartil pesimista"},
    {l:"P90 Pesimista", v:res.p90, bg:"#FEE2E2", bc:"#FECACA", c:C.red,    d:"10% de escenarios es peor"},
  ] : [];

  return (
    <div>
      <div className="card">
        <div className="ct">Configuración</div>
        <div style={{display:"flex",gap:14,alignItems:"flex-end",flexWrap:"wrap",marginBottom:8}}>
          <div>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>N simulaciones <TipoBadge tipo="usuario"/></div>
            <select className="campo-input" value={n} onChange={e=>setN(Number(e.target.value))}
              style={{width:150,background:T.usuario.bg,borderColor:T.usuario.border,color:T.usuario.text}}>
              {[1000,3000,5000,10000].map(v=><option key={v} value={v}>{v.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Mes (vacío = año aleatorio)</div>
            <select className="campo-input" value={mes??""} onChange={e=>setMes(e.target.value===""?null:Number(e.target.value))}
              style={{width:180,background:T.stat.bg,borderColor:T.stat.border,color:T.stat.text}}>
              <option value="">Año completo</option>
              {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <button className="run" onClick={run} disabled={running}>{running?"Calculando...":"▶ Correr"}</button>
          <span style={{fontSize:12,color:C.muted}}>Base det.: <strong style={{color:C.gold}}>${det.usdTn.toFixed(1)} USD/Tn</strong></span>
        </div>
      </div>

      {res&&(
        <>
          <div className="card">
            <div className="ct">Variables en la Simulación — Rangos</div>
            <div className="mc-var-row" style={{fontWeight:700,fontSize:9,color:C.muted,background:"transparent"}}>
              <span>Variable</span><span>Valor base</span><span>Distribución</span><span>Tipo</span>
            </div>
            {res.vars.map((v,i)=>(
              <div key={i} className="mc-var-row">
                <span style={{fontWeight:600,color:C.navy}}>{v.label}</span>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:v.tipo==="usuario"?T.usuario.text:T.stat.text}}>{v.base}</span>
                <span style={{fontSize:10,color:C.muted}}>{v.dist}</span>
                <TipoBadge tipo={v.tipo}/>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {pBadges.map(({l,v,bg,bc,c,d})=>(
              <div key={l} className="pbadge" style={{background:bg,borderColor:bc}}>
                <div className="pbadge-l" style={{color:c}}>{l}</div>
                <div className="pbadge-v" style={{color:c}}>${v.toFixed(1)}</div>
                <div className="pbadge-d" style={{color:c}}>USD/Tn · {d}</div>
              </div>
            ))}
            <div className="pbadge" style={{background:"#EEF2F7",borderColor:C.border}}>
              <div className="pbadge-l" style={{color:C.muted}}>Spread P10–P90</div>
              <div className="pbadge-v" style={{color:C.navy}}>${(res.p90-res.p10).toFixed(1)}</div>
              <div className="pbadge-d" style={{color:C.muted}}>σ = ${res.std.toFixed(1)}</div>
            </div>
          </div>

          <div className="card">
            <div className="ct">Distribución — {res.n.toLocaleString()} simulaciones</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={res.hist} margin={{top:10,right:10,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="x" tick={{fill:C.muted,fontSize:10}} tickCount={12}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} unit="%"/>
                <Tooltip {...TTip} formatter={(v,_,{payload})=>[`${v.toFixed(1)}% a $${payload.x}`]}/>
                <ReferenceLine x={res.p10} stroke={C.green}  strokeWidth={2} label={{value:"P10",fill:C.green, fontSize:9}}/>
                <ReferenceLine x={res.p50} stroke={C.gold}   strokeWidth={2} label={{value:"P50",fill:C.gold,  fontSize:9}}/>
                <ReferenceLine x={res.p90} stroke={C.red}    strokeWidth={2} label={{value:"P90",fill:C.red,   fontSize:9}}/>
                <ReferenceLine x={det.usdTn} stroke={C.mid}  strokeDasharray="4 4" label={{value:"Det.",fill:C.mid,fontSize:9}}/>
                <Bar dataKey="pct" radius={[2,2,0,0]}>
                  {res.hist.map((h,i)=>(
                    <Cell key={i} fill={h.x<=res.p10?C.green:h.x<=res.p25?"#2a9a5a":h.x<=res.p75?C.blue:h.x<=res.p90?C.orange:C.red}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="card">
        <div className="ct">Monte Carlo Mensual</div>
        <button className="run" onClick={runMC} disabled={runM} style={{marginBottom:12}}>
          {runM?"Calculando 24.000 simulaciones...":"▶ Correr Análisis Mensual"}
        </button>
        {mcMes&&(
          <>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={mcMes} margin={{top:10,right:10,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:11}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} domain={["auto","auto"]}/>
                <Tooltip {...TTip} formatter={(v,n)=>[`$${v.toFixed(1)} USD/Tn`,n]}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="p90" name="P90" fill="#FCA5A544" radius={[3,3,0,0]}/>
                <Bar dataKey="p50" name="P50" fill="#FCD34D44" radius={[3,3,0,0]}/>
                <Bar dataKey="p10" name="P10" fill="#A7F3D044" radius={[3,3,0,0]}/>
                <Line type="monotone" dataKey="det" name="Det." stroke={C.blue} strokeWidth={2} dot={{r:3}}/>
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{overflowX:"auto",marginTop:10}}>
              <table className="cost-table">
                <thead>
                  <tr><th>Mes</th><th>P10</th><th>P25</th><th style={{color:"#FCD34D"}}>P50</th><th>P75</th><th>P90</th><th>Det.</th><th>Spread</th></tr>
                </thead>
                <tbody>
                  {mcMes.map((r,i)=>(
                    <tr key={r.mes}>
                      <td style={{fontWeight:700}}>{r.mes}</td>
                      {[r.p10,r.p25,r.p50,r.p75,r.p90,r.det].map((v,j)=>(
                        <td key={j} className="mono" style={{textAlign:"right",color:j===2?C.gold:j===5?C.blue:C.navy}}>${v.toFixed(1)}</td>
                      ))}
                      <td className="mono" style={{textAlign:"right",color:C.orange}}>${(r.p90-r.p10).toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td>PROMEDIO</td>
                    {["p10","p25","p50","p75","p90","det"].map(k=>(
                      <td key={k} className="mono" style={{textAlign:"right",color:k==="p50"?C.gold:k==="det"?C.blue:C.navy}}>
                        ${(mcMes.reduce((a,r)=>a+r[k],0)/12).toFixed(1)}
                      </td>
                    ))}
                    <td className="mono" style={{textAlign:"right",color:C.orange}}>
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

// ─── TAB CL: BASE CLIMA ────────────────────────────────────────────────────
function TabClima({p,set}) {
  const inopZ = getPctInopFromDB(p.clima_zarate, p.cap_inopLluvia, p.cap_inopViento);
  const inopB = getPctInopFromDB(p.clima_bb,     p.des_inopLluvia, p.des_inopViento);

  const updateClima = (puerto, mesIdx, field, val) => {
    const key = puerto === "zarate" ? "clima_zarate" : "clima_bb";
    const arr = [...p[key]];
    arr[mesIdx] = { ...arr[mesIdx], [field]: parseFloat(val)||0 };
    set(key, arr);
  };

  const resetClima = (puerto) => {
    const key = puerto === "zarate" ? "clima_zarate" : "clima_bb";
    set(key, CLIMA_DB_DEFAULT[puerto]);
  };

  const ClimaSec = ({ puerto, titulo, climaDB, inop, fuente }) => (
    <div className="card">
      <div className="ct">
        {titulo} <TipoBadge tipo="estadistico"/>
        <FuenteLink fuente={fuente}/>
        <button onClick={()=>resetClima(puerto)}
          style={{marginLeft:"auto",padding:"2px 10px",borderRadius:5,border:`1px solid ${C.border}`,
            background:"#fff",color:C.muted,fontSize:9,fontWeight:700,cursor:"pointer"}}>
          Resetear
        </button>
      </div>
      <div className="warn-note" style={{marginBottom:10}}>
        ⚠️ Datos actuales son ESTIMACIONES. Reemplazalos con datos reales del SMN.
        Promedio = mm o km/h promedio diario del mes. σ = desviación estándar.
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="clima-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Lluvia μ (mm/d)</th>
              <th>Lluvia σ</th>
              <th>Viento μ (km/h)</th>
              <th>Viento σ</th>
              <th>% Inop. calc.</th>
            </tr>
          </thead>
          <tbody>
            {climaDB.map((d,i)=>(
              <tr key={d.mes}>
                <td style={{fontWeight:700,color:C.navy}}>{d.mes}</td>
                <td><input type="number" value={d.lluviaProm} step={0.1} min={0}
                  onChange={e=>updateClima(puerto,i,"lluviaProm",e.target.value)}/></td>
                <td><input type="number" value={d.lluviaSigma} step={0.1} min={0}
                  onChange={e=>updateClima(puerto,i,"lluviaSigma",e.target.value)}/></td>
                <td><input type="number" value={d.vientoProm} step={0.5} min={0}
                  onChange={e=>updateClima(puerto,i,"vientoProm",e.target.value)}/></td>
                <td><input type="number" value={d.vientoSigma} step={0.5} min={0}
                  onChange={e=>updateClima(puerto,i,"vientoSigma",e.target.value)}/></td>
                <td><span className="calc" style={{color:inop[i]>0.3?C.red:inop[i]>0.15?C.orange:C.green}}>
                  {(inop[i]*100).toFixed(1)}%
                </span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="card" style={{background:C.warn,borderColor:C.warnBorder}}>
        <div style={{fontSize:12,color:C.orange,fontWeight:700,marginBottom:6}}>⚠️ Fuentes de datos para validar</div>
        <div style={{fontSize:12,color:C.orange,lineHeight:1.7}}>
          Los datos por defecto son ESTIMACIONES. Para producción, reemplazarlos con datos reales:<br/>
          • <strong>SMN San Fernando / Ezeiza</strong>: <a href="https://www.smn.gob.ar/descarga-de-datos" target="_blank" rel="noreferrer" style={{color:C.navy}}>smn.gob.ar/descarga-de-datos ↗</a> — estadísticas climatológicas mensuales<br/>
          • <strong>SMN Bahía Blanca</strong>: misma URL, seleccionar estación 87750<br/>
          • Promedio = media del valor diario del mes histórico. σ = desviación estándar de esos valores diarios.
        </div>
      </div>

      <ClimaSec puerto="zarate" titulo="Zárate — Lluvia y Viento" climaDB={p.clima_zarate} inop={inopZ} fuente={FUENTES.climaZarate}/>
      <ClimaSec puerto="bb"     titulo="Bahía Blanca — Lluvia y Viento" climaDB={p.clima_bb} inop={inopB} fuente={FUENTES.climaBB}/>
    </div>
  );
}

// ─── TAB SC: ESCENARIOS ────────────────────────────────────────────────────
function TabEscenarios({p}) {
  const [esc,setEsc]   = useState([]);
  const [nom,setNom]   = useState("");
  const [desc,setDesc] = useState("");
  const [sav,setSav]   = useState(false);
  const [load,setLoad] = useState(false);
  const [msg,setMsg]   = useState("");
  const det = calcTotal(p);

  const cargar = async()=>{
    setLoad(true);
    const{data}=await supabase.from("escenarios_arena").select("*").order("created_at",{ascending:false});
    setEsc(data||[]);setLoad(false);
  };
  const guardar = async()=>{
    if(!nom.trim()){setMsg("Ingresá un nombre");return;}
    setSav(true);
    const{error}=await supabase.from("escenarios_arena").insert({nombre:nom.trim(),descripcion:desc.trim(),params:p,usd_tn:parseFloat(det.usdTn.toFixed(1))});
    if(error)setMsg("Error: "+error.message);
    else{setMsg("✓ Guardado");setNom("");setDesc("");cargar();}
    setSav(false);setTimeout(()=>setMsg(""),3000);
  };
  const eliminar = async(id)=>{await supabase.from("escenarios_arena").delete().eq("id",id);cargar();};

  return (
    <div>
      <div className="card">
        <div className="ct">Guardar Escenario Actual</div>
        <div className="g2" style={{marginBottom:10}}>
          <Campo label="Nombre" value={nom} onChange={v=>setNom(v)} tipo="usuario" nota="Ej: Caso base junio 2026"/>
          <Campo label="Descripción" value={desc} onChange={v=>setDesc(v)} tipo="usuario"/>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button className="run" onClick={guardar} disabled={sav}>{sav?"Guardando...":"💾 Guardar"}</button>
          <span style={{fontSize:12,color:C.muted}}>USD/Tn actual: <strong style={{color:C.gold}}>${det.usdTn.toFixed(1)}</strong></span>
          {msg&&<span style={{fontSize:12,color:msg.startsWith("✓")?C.green:C.red,fontWeight:700}}>{msg}</span>}
        </div>
      </div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div className="ct" style={{margin:0}}>Escenarios Guardados</div>
          <button className="run" style={{padding:"5px 14px",fontSize:10}} onClick={cargar}>{load?"...":"↻ Actualizar"}</button>
        </div>
        {esc.length===0?(
          <div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:13}}>No hay escenarios guardados aún.</div>
        ):esc.map(e=>(
          <div key={e.id} style={{background:"#EEF2F7",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{e.nombre}</div>
              {e.descripcion&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{e.descripcion}</div>}
              <div style={{fontSize:9,color:C.muted,marginTop:3,fontFamily:"DM Mono,monospace"}}>{new Date(e.created_at).toLocaleDateString("es-AR")}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:18,fontWeight:800,color:C.blue,fontFamily:"DM Mono,monospace"}}>${e.usd_tn?.toFixed(1)} USD/Tn</div>
              <button onClick={()=>eliminar(e.id)} style={{padding:"3px 10px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:10,fontWeight:600}}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]     = useState("e1");
  const [params,setParams] = useState(DEFAULT_PARAMS);
  const set = useCallback((k,v)=>setParams(prev=>({...prev,[k]:v})),[]);
  const tot = useMemo(()=>calcTotal(params),[params]);

  const tabMap = {
    e1:<TabCarga      p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e2:<TabNavegacion p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e3:<TabDescarga   p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    e4:<TabVuelta     p={params} set={set} tnEntregadas={tot.tnEntregadas}/>,
    mc:<TabMC         p={params}/>,
    cl:<TabClima      p={params} set={set}/>,
    sc:<TabEscenarios p={params}/>,
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
            {l:"USD/Tn final",  v:`$${tot.usdTn.toFixed(1)}`},
            {l:"Tn entregadas", v:tot.tnEntregadas.toFixed(0)},
            {l:"Días totales",  v:tot.diasTotales.toFixed(1)},
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
