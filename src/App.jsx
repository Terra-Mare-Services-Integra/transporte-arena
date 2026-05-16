import { useState, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  DEFAULT_PARAMS, MESES, FUENTES, CAMPOS_ESPEJO,
  calcEtapa1, calcEtapa2, calcEtapa3, calcEtapa4, calcTotal,
  getPctInop, velPromedioPonderada, checkEspejo,
  runMonteCarlo, runMCMensual, CLIMA_ZARATE, CLIMA_BB,
} from "./lib/motor";
import { supabase } from "./lib/supabase";

// ─── COLORES ───────────────────────────────────────────────────────────────
// 🟨 Input usuario   → amarillo pastel
// 🔲 Fórmula         → gris
// 🟩 Estadístico     → verde apagado
const T = {
  input:  { bg:"#FEFCE8", border:"#D4B84A", text:"#7A6210", label:"#9A7A20" },
  formula:{ bg:"#F4F4F5", border:"#C4C4C8", text:"#3F3F46", label:"#71717A" },
  stat:   { bg:"#F0FDF4", border:"#86BFAB", text:"#166534", label:"#15803D" },
};

const C = {
  navy:"#213363", blue:"#235C96", mid:"#6381A7", light:"#A5B5CC",
  bg:"#EEF2F7", surface:"#FFFFFF", border:"#D6E0ED", text:"#213363", muted:"#6381A7",
  gold:"#B07D0A", green:"#166534", red:"#991B1B", orange:"#92400E",
  warn:"#FEF3C7", warnBorder:"#D4B84A",
};

const TABS = [
  { id:"e1", label:"1. Carga (Zárate)",        icon:"⚓" },
  { id:"e2", label:"2. Navegación Ida",         icon:"🧭" },
  { id:"e3", label:"3. Descarga (Sea White)",   icon:"🏭" },
  { id:"e4", label:"4. Vuelta en Lastre",       icon:"↩️" },
  { id:"mc", label:"5. Monte Carlo",            icon:"🎲" },
  { id:"sc", label:"6. Escenarios",             icon:"💾" },
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
.tab{padding:12px 18px;border:none;background:transparent;color:#6381A7;font-size:11px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;letter-spacing:.3px}
.tab.on{color:#213363;border-bottom-color:#235C96}
.tab:hover:not(.on){color:#213363;background:#EEF2F7}

.page{max-width:1200px;margin:0 auto;padding:22px 28px 60px}

.card{background:#fff;border:1px solid #D6E0ED;border-radius:10px;padding:18px 22px;margin-bottom:14px}
.ct{font-size:9px;font-weight:700;color:#235C96;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;padding-bottom:7px;border-bottom:1px solid #D6E0ED;display:flex;align-items:center;gap:8px}
.ct-sub{font-size:10px;color:#6381A7;font-weight:400;text-transform:none;letter-spacing:0}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}

/* TIPO-BADGE */
.tipo-badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;letter-spacing:.3px;text-transform:uppercase;margin-left:6px;vertical-align:middle}

/* CAMPO por tipo */
.campo{margin-bottom:10px}
.campo-label{font-size:10px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;margin-bottom:3px;display:flex;align-items:center;gap:4px}
.campo-input{width:100%;border-radius:6px;padding:7px 10px;font-size:13px;border-width:1px;border-style:solid}
.campo-formula{width:100%;border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Mono',monospace;border-width:1px;border-style:solid;cursor:default}
.campo-nota{font-size:10px;margin-top:2px}

/* DATA ROW */
.drow{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:6px;font-size:12px}
.drow:nth-child(odd){background:#EEF2F7}
.dk{color:#6381A7}.dv{font-weight:700;font-family:'DM Mono',monospace;color:#213363}

/* KPI */
.kpis{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.kpi{flex:1;min-width:110px;background:#EEF2F7;border:1px solid #D6E0ED;border-radius:8px;padding:11px 14px}
.kpi-v{font-size:20px;font-weight:800;line-height:1;font-family:'DM Mono',monospace}
.kpi-l{font-size:9px;color:#6381A7;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.kpi-u{font-size:10px;color:#6381A7;margin-top:2px}

/* TOGGLE */
.trow{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.tbtn{padding:5px 13px;border-radius:6px;border:1px solid #D6E0ED;background:#EEF2F7;color:#6381A7;font-size:11px;font-weight:600;transition:all .15s}
.tbtn.on{background:#213363;border-color:#213363;color:#fff}

/* ESPEJO */
.espejo-warn{background:#FEF3C7;border:1px solid #D4B84A;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:12px;color:#92400E}
.espejo-ok{background:#F0FDF4;border:1px solid #86BFAB;border-radius:8px;padding:8px 14px;margin-bottom:10px;font-size:11px;color:#166534}

/* FUENTE LINK */
.src-link{font-size:10px;color:#235C96;text-decoration:none;border-bottom:1px dashed #235C96}
.src-link:hover{color:#213363}
.src-note{font-size:10px;background:#F0FDF4;border:1px solid #86BFAB;border-radius:6px;padding:7px 11px;margin-top:6px;color:#166534;border-left:3px solid #86BFAB}

/* RUN BTN */
.run{padding:9px 26px;border-radius:8px;border:none;background:#213363;color:#fff;font-size:12px;font-weight:700;transition:all .2s;letter-spacing:.3px}
.run:hover:not(:disabled){background:#235C96}
.run:disabled{background:#A5B5CC;cursor:not-allowed}

/* P-BADGE */
.pbadge{flex:1;min-width:110px;border-radius:8px;padding:11px 14px;border-width:1px;border-style:solid}
.pbadge-v{font-size:20px;font-weight:800;font-family:'DM Mono',monospace;line-height:1}
.pbadge-l{font-size:9px;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.pbadge-d{font-size:10px;margin-top:3px;opacity:.7}

/* MAPA */
.mapa-svg{width:100%;border-radius:8px;background:#F0F6FF;border:1px solid #D6E0ED}
.tramo-input{width:60px;background:#FEFCE8;border:1px solid #D4B84A;border-radius:5px;padding:3px 6px;color:#7A6210;font-size:12px;font-weight:700;font-family:'DM Mono',monospace;text-align:center}

/* TABLA MC VARS */
.mc-var-row{display:grid;grid-template-columns:180px 120px 180px 80px;gap:8px;padding:7px 10px;border-radius:6px;font-size:12px;align-items:center}
.mc-var-row:nth-child(odd){background:#EEF2F7}
`;

// ─── HELPERS UI ────────────────────────────────────────────────────────────
const TipoBadge = ({ tipo }) => {
  const cfg = { usuario:{bg:"#FEFCE8",c:"#7A6210",lbl:"Input"}, estadistico:{bg:"#F0FDF4",c:"#166534",lbl:"Estadístico"}, formula:{bg:"#F4F4F5",c:"#3F3F46",lbl:"Fórmula"} };
  const s = cfg[tipo] || cfg.formula;
  return <span className="tipo-badge" style={{background:s.bg,color:s.c}}>{s.lbl}</span>;
};

const FuenteLink = ({ fuente }) => (
  <span> · <a className="src-link" href={fuente.url} target="_blank" rel="noreferrer">{fuente.label} ↗</a></span>
);

const Campo = ({ label, value, onChange, tipo="usuario", unit, min, max, step=1, formula, nota, mesGrid }) => {
  const st = T[tipo];
  return (
    <div className="campo" style={mesGrid ? {flex:"1 1 80px"} : {}}>
      <div className="campo-label" style={{color:st.label}}>
        {label}{unit ? ` (${unit})` : ""}
        <TipoBadge tipo={tipo}/>
      </div>
      {tipo==="formula" ? (
        <div className="campo-formula" style={{background:st.bg,borderColor:st.border,color:st.text}}>
          {formula ?? value}
        </div>
      ) : (
        <input className="campo-input" type="number" value={value} min={min} max={max} step={step}
          onChange={e=>onChange && onChange(parseFloat(e.target.value)||0)}
          style={{background:st.bg,borderColor:st.border,color:st.text}}/>
      )}
      {nota && <div className="campo-nota" style={{color:st.label}}>{nota}</div>}
    </div>
  );
};

const Toggle = ({ label, options, value, onChange, tipo="usuario" }) => {
  const st = T[tipo];
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
  <div className="kpi" style={{borderColor:color?`${color}44`:undefined}}>
    <div className="kpi-v" style={{color:color||C.navy}}>{value}</div>
    <div className="kpi-l">{label}</div>
    {unit&&<div className="kpi-u">{unit}</div>}
  </div>
);

const DRow = ({label,val1,val2,tipo="formula"}) => (
  <div className="drow">
    <span className="dk">{label}</span>
    {val1&&<span style={{fontSize:10,color:C.muted,fontFamily:"DM Mono,monospace"}}>{val1}</span>}
    <span className="dv" style={{color:tipo==="usuario"?T.input.text:tipo==="stat"?T.stat.text:C.navy}}>{val2}</span>
  </div>
);

const TTip = { contentStyle:{background:"#213363",border:"1px solid #1a3356",color:"#fff",fontSize:11} };

// ─── ESPEJO CHECK ──────────────────────────────────────────────────────────
const EspejoCheck = ({p}) => {
  const checks = checkEspejo(p);
  const hasDiff = checks.some(c=>c.difiere);
  if(!hasDiff) return <div className="espejo-ok">✓ Todos los campos espejo (carga ↔ descarga) son iguales.</div>;
  return (
    <div className="espejo-warn">
      ⚠️ Campos que difieren entre Carga y Descarga:
      {checks.filter(c=>c.difiere).map(c=>(
        <div key={c.label} style={{marginTop:4}}>
          <strong>{c.label}</strong>: Carga = {c.valCap} · Descarga = {c.valDes}
        </div>
      ))}
    </div>
  );
};

// ─── MAPA SVG ──────────────────────────────────────────────────────────────
function MapaNavegacion({ tramos, onUpdate, vuelta=false }) {
  const { velProm, totalMn, totalHrs } = velPromedioPonderada(tramos);

  // Coordenadas aproximadas de los puntos clave (SVG 800×320)
  const puntos = [
    { id:1, x:60,  y:80,  nombre:"Zárate",        sub:"Km 102 Río Paraná" },
    { id:2, x:180, y:120, nombre:"Confluencia",    sub:"Paraná / Uruguay" },
    { id:3, x:310, y:160, nombre:"Río de la Plata",sub:"Estuario" },
    { id:4, x:460, y:200, nombre:"Punta Indio",    sub:"Canal Principal" },
    { id:5, x:640, y:260, nombre:"Rada BB",        sub:"Exterior" },
    { id:6, x:740, y:285, nombre:"Sea White",      sub:"Bahía Blanca" },
  ];

  const coloresTipo = { "Hidrovía":"#235C96","Estuario":"#2a7a8a","Costero":"#1a6b4a","Puerto":"#6B4FA0" };

  return (
    <div>
      <svg viewBox="0 0 800 340" className="mapa-svg" style={{minHeight:220}}>
        {/* Fondo agua */}
        <defs>
          <linearGradient id="agua" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DBEAFE"/>
            <stop offset="100%" stopColor="#BFDBFE"/>
          </linearGradient>
        </defs>
        <rect width="800" height="340" fill="url(#agua)" rx="8"/>

        {/* Costa esquemática */}
        <path d="M0,60 Q80,50 180,100 Q280,140 380,170 Q500,200 650,240 Q720,265 800,280 L800,340 L0,340 Z"
          fill="#E8F5E9" stroke="#A5C8A0" strokeWidth="1.5"/>

        {/* Líneas de tramos */}
        {tramos.map((t,i)=>{
          const a=puntos[i], b=puntos[i+1];
          if(!a||!b) return null;
          const color = coloresTipo[t.tipo]||C.blue;
          return (
            <g key={t.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color} strokeWidth={vuelta?2:3} strokeDasharray={vuelta?"6,3":""} opacity={.85}/>
              {/* Badge velocidad en el punto medio */}
              <rect x={(a.x+b.x)/2-22} y={(a.y+b.y)/2-12} width={44} height={20} rx={4}
                fill={color} opacity={.9}/>
              <text x={(a.x+b.x)/2} y={(a.y+b.y)/2+3} textAnchor="middle"
                fontSize="10" fontWeight="700" fill="#fff" fontFamily="DM Mono,monospace">
                {t.velocidad} kt
              </text>
            </g>
          );
        })}

        {/* Puntos */}
        {puntos.map((pt,i)=>(
          <g key={pt.id}>
            <circle cx={pt.x} cy={pt.y} r={8} fill={i===0?"#213363":i===5?"#166534":"#235C96"} stroke="#fff" strokeWidth={2}/>
            <text x={pt.x} y={pt.y-14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#213363">{pt.nombre}</text>
            <text x={pt.x} y={pt.y-4} textAnchor="middle" fontSize="8" fill="#6381A7">{pt.sub}</text>
          </g>
        ))}

        {/* Leyenda velocidad promedio */}
        <rect x={10} y={300} width={200} height={32} rx={6} fill="rgba(33,51,99,.85)"/>
        <text x={20} y={312} fontSize="9" fill="rgba(255,255,255,.6)" fontWeight="600">VELOCIDAD PROMEDIO PONDERADA</text>
        <text x={20} y={325} fontSize="13" fill="#fff" fontWeight="800" fontFamily="DM Mono,monospace">
          {velProm.toFixed(2)} kt · {totalMn} mn · {totalHrs.toFixed(1)} hs
        </text>

        {/* Flecha dirección */}
        {vuelta && <text x={700} y={30} fontSize="11" fill="#6381A7" fontWeight="700">↩ VUELTA EN LASTRE</text>}
        {!vuelta && <text x={680} y={30} fontSize="11" fill="#235C96" fontWeight="700">→ IDA CARGADO</text>}
      </svg>

      {/* Tabla editable de tramos */}
      {!vuelta && (
        <div style={{marginTop:12,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.navy}}>
                {["Tramo","Tipo","Distancia (mn)","Velocidad (kt)","Horas","Condición"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",color:"rgba(255,255,255,.7)",fontSize:10,
                    textAlign:"left",fontWeight:600,textTransform:"uppercase",letterSpacing:.3}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tramos.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"8px 10px",color:C.navy,fontWeight:600,fontSize:12}}>{t.nombre}</td>
                  <td style={{padding:"8px 10px"}}>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,
                      background:`${coloresTipo[t.tipo]||C.blue}18`,color:coloresTipo[t.tipo]||C.blue,fontWeight:700}}>
                      {t.tipo}
                    </span>
                  </td>
                  <td style={{padding:"8px 10px"}}>
                    <input type="number" className="tramo-input" value={t.distancia} min={1} max={1000} step={5}
                      onChange={e=>{
                        const arr=[...tramos];
                        arr[i]={...t,distancia:parseFloat(e.target.value)||0};
                        onUpdate(arr);
                      }}/>
                  </td>
                  <td style={{padding:"8px 10px"}}>
                    <input type="number" className="tramo-input" value={t.velocidad} min={1} max={20} step={0.5}
                      style={{background:T.input.bg,borderColor:T.input.border,color:T.input.text}}
                      onChange={e=>{
                        const arr=[...tramos];
                        arr[i]={...t,velocidad:parseFloat(e.target.value)||0};
                        onUpdate(arr);
                      }}/>
                  </td>
                  <td style={{padding:"8px 10px",color:C.gold,fontWeight:700,fontFamily:"DM Mono,monospace"}}>
                    {(t.distancia/t.velocidad).toFixed(1)}
                  </td>
                  <td style={{padding:"8px 10px",color:C.muted,fontSize:11}}>{t.condicion}</td>
                </tr>
              ))}
              <tr style={{background:"#EEF2F7",fontWeight:700}}>
                <td style={{padding:"10px",color:C.navy}} colSpan={2}>TOTAL / PROMEDIO</td>
                <td style={{padding:"10px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalMn} mn</td>
                <td style={{padding:"10px",color:C.blue,fontFamily:"DM Mono,monospace",fontSize:15}}>{velProm.toFixed(2)} kt ⌀</td>
                <td style={{padding:"10px",color:C.gold,fontFamily:"DM Mono,monospace"}}>{totalHrs.toFixed(1)} hs</td>
                <td style={{padding:"10px",color:C.muted,fontSize:11}}>{(totalHrs/24).toFixed(2)} días</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── TAB E1: CARGA ─────────────────────────────────────────────────────────
function TabCarga({p,set}) {
  const mesIdx = 5;
  const e1 = calcEtapa1(p,mesIdx);
  const inopZ = getPctInop(CLIMA_ZARATE,p.cap_inopLluvia,p.cap_inopViento);

  return (
    <div>
      <div className="kpis">
        <KPI label="Vel. carga ideal" value={`${e1.velIdeal_TnMin.toFixed(2)} Tn/min`} color={T.formula.text}/>
        <KPI label="Tiempo carga ideal" value={`${e1.tIdeal_dias.toFixed(3)} días`} color={T.formula.text}/>
        <KPI label="Tiempo carga real" value={`${e1.tReal_dias.toFixed(3)} días`} color={C.gold}/>
        <KPI label="Merma carga" value={`${e1.mermaTn.toFixed(0)} Tn`} unit={`${(p.cap_pctMerma*100).toFixed(2)}%`} color={C.red}/>
        <KPI label="Costo etapa 1" value={`$${(e1.costoTotal/1000).toFixed(1)}k`} color={C.navy}/>
      </div>

      <div className="g2">
        <div>
          <div className="card">
            <div className="ct">Parámetros Físicos del Barco</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              <Campo label="Capacidad" value={p.cap_capacidadBarco} onChange={v=>set("cap_capacidadBarco",v)} tipo="usuario" unit="Tn" min={1000} max={80000} step={1000}/>
              <Campo label="Densidad arena" value={p.cap_densidadArena} onChange={v=>set("cap_densidadArena",v)} tipo="usuario" unit="T/m³" min={1} max={2} step={0.05}/>
              <Campo label="Grampada grúa" value={p.cap_grampada} onChange={v=>set("cap_grampada",v)} tipo="usuario" unit="m³" min={5} max={30}/>
              <Campo label="Grúas" value={p.cap_gruas} onChange={v=>set("cap_gruas",v)} tipo="usuario" min={1} max={4}/>
              <Campo label="Movimientos/min" value={p.cap_movGrampa} onChange={v=>set("cap_movGrampa",v)} tipo="usuario" unit="mov/min" min={0.1} max={2} step={0.1}/>
            </div>
            <div style={{height:1,background:C.border,margin:"12px 0"}}/>
            <Toggle label="Horas de trabajo / día" options={[4,8,12,24]} value={p.cap_horasDia} onChange={v=>set("cap_horasDia",v)} tipo="usuario"/>
          </div>

          <div className="card">
            <div className="ct">Fórmulas — Velocidad de Carga <TipoBadge tipo="formula"/></div>
            <DRow label="Vel. carga ideal" val1="grúas × grampada × densidad × mov/min" val2={`${e1.velIdeal_TnMin.toFixed(4)} Tn/min`}/>
            <DRow label="Vel. carga / hora" val1="velMin × 60" val2={`${e1.velIdeal_TnHr.toFixed(2)} Tn/hr`}/>
            <DRow label="Tiempo ideal (horas)" val1="capacidad / vel_hr" val2={`${e1.tIdeal_hr.toFixed(2)} hs`}/>
            <DRow label="Tiempo ideal (días)" val1="horas / horasDía" val2={`${e1.tIdeal_dias.toFixed(4)} días`}/>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="ct">Inoperabilidad Climática <TipoBadge tipo="estadistico"/>
              <FuenteLink fuente={FUENTES.climaZarate}/>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:10}}>
              <Campo label="Lluvia inoperable desde" value={p.cap_inopLluvia} onChange={v=>set("cap_inopLluvia",v)} tipo="usuario" unit="mm/día" min={5} max={100} step={5}/>
              <Campo label="Viento inoperable desde" value={p.cap_inopViento} onChange={v=>set("cap_inopViento",v)} tipo="usuario" unit="km/h" min={20} max={100} step={5}/>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:8}}>
              <Campo tipo="formula" label="% días inhábiles (mes actual)" formula={`${(e1.pInop*100).toFixed(2)}%`} value={e1.pInop}/>
              <Campo tipo="formula" label="Días extra por clima" formula={`${e1.diasInop.toFixed(3)} días`} value={e1.diasInop}/>
            </div>
            <div className="src-note">
              Fórmula inop: P(lluvia &gt; umbral) ∪ P(viento &gt; umbral) = P(L) + P(V) − P(L)×P(V) / 100
            </div>
            <div style={{height:140,marginTop:10}}>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={CLIMA_ZARATE.map((d,i)=>({mes:d.mes,pct:parseFloat((inopZ[i]*100).toFixed(1))}))} margin={{top:5,right:5,left:0,bottom:0}}>
                  <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:9}}/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} unit="%"/>
                  <Tooltip {...TTip} formatter={v=>[`${v}%`]}/>
                  <Bar dataKey="pct" fill={T.stat.border} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="ct">Espera y Merma en Carga</div>
            <Campo label="Espera en Zárate (puerto propio)" value={p.cap_esperaDias} onChange={v=>set("cap_esperaDias",v)} tipo="usuario" unit="días" min={0} max={5} step={0.25} nota="Input directo — puerto propio, mayor control."/>
            <div style={{height:1,background:C.border,margin:"10px 0"}}/>
            <Campo label="Merma de carga" value={p.cap_pctMerma*100} onChange={v=>set("cap_pctMerma",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1} nota="Pérdida física: derrames grampa, vuelo de material, limpieza bodegas."/>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:8}}>
              <Campo tipo="formula" label="Merma en Tn" formula={`${e1.mermaTn.toFixed(0)} Tn`} value={e1.mermaTn}/>
              <Campo tipo="formula" label="Tn post-carga" formula={`${e1.tnPostCarga.toFixed(0)} Tn`} value={e1.tnPostCarga}/>
            </div>
          </div>

          <div className="card">
            <div className="ct">Costos Etapa 1</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:8}}>
              <Campo label="Precio arena origen" value={p.cap_precioArenaOrigen} onChange={v=>set("cap_precioArenaOrigen",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Opex carga" value={p.cap_opexUSDTn} onChange={v=>set("cap_opexUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
            </div>
            <div className="src-note" style={{marginBottom:8}}>
              Consumo en puerto usa: VLSFO y consumo/día configurados en pestaña Navegación.
            </div>
            <DRow label="Costo arena" val1={`$${p.cap_precioArenaOrigen} × ${p.cap_capacidadBarco.toLocaleString()} Tn`} val2={`$${e1.costoArena.toLocaleString("es-AR",{maximumFractionDigits:0})}`}/>
            <DRow label="Costo merma" val1={`$${p.cap_precioArenaOrigen} × ${e1.mermaTn.toFixed(0)} Tn`} val2={`$${e1.costoMerma.toFixed(0)}`}/>
            <DRow label="Opex carga" val1={`$${p.cap_opexUSDTn}/Tn × ${p.cap_capacidadBarco.toLocaleString()} Tn`} val2={`$${e1.costoOpex.toFixed(0)}`}/>
            <DRow label="Combustible puerto" val1={`${e1.tReal_dias.toFixed(2)}d × ${p.nav_consumoPuerto}T/d × $${p.nav_precioVLSFO}`} val2={`$${e1.combPuerto.toFixed(0)}`}/>
            <DRow label="Time Charter" val1={`${e1.tReal_dias.toFixed(2)}d × $${p.nav_timeCharter}/d`} val2={`$${e1.fleteEtapa.toFixed(0)}`}/>
            <DRow label="TOTAL ETAPA 1" val2={`$${e1.costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}`} tipo="formula"/>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="ct">Tiempo Real de Carga <TipoBadge tipo="formula"/></div>
        <DRow label="Tiempo ideal" val2={`${e1.tIdeal_dias.toFixed(4)} días`}/>
        <DRow label="+ Días inop. clima" val1="tIdeal × pInop / (1 − pInop)" val2={`+ ${e1.diasInop.toFixed(4)} días`}/>
        <DRow label="+ Espera Zárate" val2={`+ ${p.cap_esperaDias} días`} tipo="usuario"/>
        <DRow label="= TIEMPO REAL CARGA" val2={`${e1.tReal_dias.toFixed(4)} días`}/>
      </div>
    </div>
  );
}

// ─── TAB E2: NAVEGACIÓN IDA ────────────────────────────────────────────────
function TabNavegacion({p,set}) {
  const e2 = calcEtapa2(p);
  const updateTramos = (arr) => set("nav_tramos",arr);

  return (
    <div>
      <div className="kpis">
        <KPI label="Vel. promedio ponderada" value={`${e2.velProm.toFixed(2)} kt`} color={T.formula.text}/>
        <KPI label="Distancia total" value={`${e2.totalMn} mn`} color={T.input.text}/>
        <KPI label="Días navegación" value={`${e2.diasNav.toFixed(3)} días`} color={T.formula.text}/>
        <KPI label="Combustible ida" value={`$${(e2.combNav/1000).toFixed(1)}k`} color={C.gold}/>
        <KPI label="Costo etapa 2" value={`$${(e2.costoTotal/1000).toFixed(1)}k`} color={C.navy}/>
      </div>

      <div className="card">
        <div className="ct">Mapa de Ruta — Zárate → Sea White (Bahía Blanca)</div>
        <MapaNavegacion tramos={p.nav_tramos} onUpdate={updateTramos}/>
        <div className="src-note" style={{marginTop:10}}>
          Velocidad promedio ponderada = Σ(distancias) / Σ(distancia/velocidad por tramo). Fuente distancias: carta náutica argentina H-226 — validar con práctico.
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros Económicos de Navegación</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            <Campo label="Time Charter" value={p.nav_timeCharter} onChange={v=>set("nav_timeCharter",v)} tipo="usuario" unit="USD/día" min={5000} max={50000} step={500}/>
            <Campo label="Precio VLSFO" value={p.nav_precioVLSFO} onChange={v=>set("nav_precioVLSFO",v)} tipo="usuario" unit="USD/T" min={400} max={1500} step={10}
              nota="Aplica a todas las etapas del viaje."/>
            <Campo label="Consumo navegando" value={p.nav_consumoNavegando} onChange={v=>set("nav_consumoNavegando",v)} tipo="usuario" unit="T/día" min={5} max={40} step={0.5}/>
            <Campo label="Consumo en puerto" value={p.nav_consumoPuerto} onChange={v=>set("nav_consumoPuerto",v)} tipo="usuario" unit="T/día" min={1} max={20} step={0.5}
              nota="Aplica en Etapas 1 (carga) y 3 (descarga)."/>
            <Campo label="Agencia Zárate" value={p.nav_agenciaZarate} onChange={v=>set("nav_agenciaZarate",v)} tipo="usuario" unit="USD" min={0} step={500}/>
            <Campo label="Agencia Bahía Blanca" value={p.nav_agenciaBB} onChange={v=>set("nav_agenciaBB",v)} tipo="usuario" unit="USD" min={0} step={500}/>
          </div>
        </div>

        <div className="card">
          <div className="ct">Fórmulas — Costo Navegación Ida <TipoBadge tipo="formula"/></div>
          <DRow label="Vel. promedio ponderada" val1="Σdist / Σ(dist/vel)" val2={`${e2.velProm.toFixed(4)} kt`}/>
          <DRow label="Total horas" val1="Σ(distancia/velocidad)" val2={`${e2.totalHrs.toFixed(2)} hs`}/>
          <DRow label="Días navegación" val1="horas / 24" val2={`${e2.diasNav.toFixed(4)} días`}/>
          <div style={{height:8}}/>
          <DRow label="Combustible ida" val1={`${e2.diasNav.toFixed(2)}d × ${p.nav_consumoNavegando}T/d × $${p.nav_precioVLSFO}`} val2={`$${e2.combNav.toFixed(0)}`}/>
          <DRow label="Flete TC ida" val1={`${e2.diasNav.toFixed(2)}d × $${p.nav_timeCharter}/d`} val2={`$${e2.fleteNav.toFixed(0)}`}/>
          <DRow label="Agencias (Z+BB)" val1="costo fijo por escala" val2={`$${e2.agencias.toFixed(0)}`} tipo="usuario"/>
          <DRow label="TOTAL ETAPA 2" val2={`$${e2.costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}`}/>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E3: DESCARGA ──────────────────────────────────────────────────────
function TabDescarga({p,set}) {
  const mesIdx = 5;
  const e1 = calcEtapa1(p,mesIdx);
  const e3 = calcEtapa3(p,mesIdx,e1.tnPostCarga);
  const inopB = getPctInop(CLIMA_BB,p.des_inopLluvia,p.des_inopViento);

  return (
    <div>
      <EspejoCheck p={p}/>
      <div className="kpis">
        <KPI label="Tn entrada a descarga" value={e3.tnEntrada.toFixed(0)} unit="post merma carga" color={T.formula.text}/>
        <KPI label="Tiempo descarga ideal" value={`${e3.tIdeal_dias.toFixed(3)} días`} color={T.formula.text}/>
        <KPI label="Tiempo descarga real" value={`${e3.tReal_dias.toFixed(3)} días`} color={C.gold}/>
        <KPI label="Tn entregadas" value={e3.tnEntregadas.toFixed(0)} color={C.green}/>
        <KPI label="Costo etapa 3" value={`$${(e3.costoTotal/1000).toFixed(1)}k`} color={C.navy}/>
      </div>

      <div className="g2">
        <div>
          <div className="card">
            <div className="ct">Parámetros Físicos — Descarga</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              <Campo label="Grampada grúa" value={p.des_grampada} onChange={v=>set("des_grampada",v)} tipo="usuario" unit="m³" min={5} max={30}/>
              <Campo label="Grúas" value={p.des_gruas} onChange={v=>set("des_gruas",v)} tipo="usuario" min={1} max={4}/>
              <Campo label="Movimientos/min" value={p.des_movGrampa} onChange={v=>set("des_movGrampa",v)} tipo="usuario" unit="mov/min" min={0.1} max={2} step={0.1}/>
            </div>
            <Toggle label="Horas de trabajo / día" options={[4,8,12,14,24]} value={p.des_horasDia} onChange={v=>set("des_horasDia",v)} tipo="usuario"/>
          </div>

          <div className="card">
            <div className="ct">Fórmulas — Velocidad de Descarga <TipoBadge tipo="formula"/></div>
            <DRow label="Tn entrada" val1="capacidad − merma carga" val2={`${e3.tnEntrada.toFixed(0)} Tn`}/>
            <DRow label="Vel. descarga ideal" val1="grúas × grampada × densidad × mov/min" val2={`${e3.velIdeal_TnMin.toFixed(4)} Tn/min`}/>
            <DRow label="Vel. descarga / hora" val1="velMin × 60" val2={`${e3.velIdeal_TnHr.toFixed(2)} Tn/hr`}/>
            <DRow label="Tiempo ideal (horas)" val1="tnEntrada / vel_hr" val2={`${e3.tIdeal_hr.toFixed(2)} hs`}/>
            <DRow label="Tiempo ideal (días)" val1="horas / horasDía" val2={`${e3.tIdeal_dias.toFixed(4)} días`}/>
          </div>

          <div className="card">
            <div className="ct">Mermas y Split Descarga</div>
            <Campo label="Merma descarga" value={p.des_pctMermaDescarga*100} onChange={v=>set("des_pctMermaDescarga",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1} nota="Arena que queda en bodega o cae al agua."/>
            <Campo label="Merma acopio" value={p.des_pctMermaAcopio*100} onChange={v=>set("des_pctMermaAcopio",v/100)} tipo="usuario" unit="%" min={0} max={10} step={0.1} nota="Pérdida en stockpile BB por viento/lluvia."/>
            <div style={{height:1,background:C.border,margin:"10px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:700,color:C.green}}>Despacho directo</span>
              <span style={{fontSize:16,fontWeight:800,color:C.green,fontFamily:"DM Mono,monospace"}}>{((1-p.des_pctAcopio)*100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={1-p.des_pctAcopio}
              onChange={e=>set("des_pctAcopio",parseFloat((1-e.target.value).toFixed(2)))}
              style={{accentColor:C.green}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10}}>
              {[
                {l:"Directo",val:`${e3.tnDirecto.toFixed(0)} Tn`,c:C.green},
                {l:"Acopio", val:`${e3.tnAcopio.toFixed(0)} Tn`,c:C.gold},
                {l:"Entregadas",val:`${e3.tnEntregadas.toFixed(0)} Tn`,c:C.navy},
              ].map(({l,val,c})=>(
                <div key={l} style={{background:"#EEF2F7",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                  <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"DM Mono,monospace"}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="ct">Inoperabilidad Climática BB <TipoBadge tipo="estadistico"/>
              <FuenteLink fuente={FUENTES.climaBB}/>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:10}}>
              <Campo label="Lluvia inoperable desde" value={p.des_inopLluvia} onChange={v=>set("des_inopLluvia",v)} tipo="usuario" unit="mm/día" min={5} max={100} step={5}/>
              <Campo label="Viento inoperable desde" value={p.des_inopViento} onChange={v=>set("des_inopViento",v)} tipo="usuario" unit="km/h" min={20} max={100} step={5}/>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:8}}>
              <Campo tipo="formula" label="% días inhábiles" formula={`${(e3.pInop*100).toFixed(2)}%`} value={e3.pInop}/>
              <Campo tipo="formula" label="Días extra por clima" formula={`${e3.diasInop.toFixed(3)} días`} value={e3.diasInop}/>
            </div>
            <div style={{height:130}}>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={CLIMA_BB.map((d,i)=>({mes:d.mes,pct:parseFloat((inopB[i]*100).toFixed(1))}))} margin={{top:5,right:5,left:0,bottom:0}}>
                  <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:9}}/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} unit="%"/>
                  <Tooltip {...TTip} formatter={v=>[`${v}%`]}/>
                  <Bar dataKey="pct" fill={T.stat.border} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="ct">Espera en Bahía Blanca <TipoBadge tipo="estadistico"/>
              <FuenteLink fuente={FUENTES.esperaBB}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
              {MESES.map((m,i)=>(
                <div key={m}>
                  <div style={{fontSize:9,color:T.stat.label,textAlign:"center",marginBottom:2,fontWeight:700}}>{m}</div>
                  <input type="number" value={p.des_esperaBBMes[i]} step={0.1} min={0} max={15}
                    onChange={e=>{const arr=[...p.des_esperaBBMes];arr[i]=parseFloat(e.target.value)||0;set("des_esperaBBMes",arr);}}
                    style={{width:"100%",background:T.stat.bg,border:`1px solid ${T.stat.border}`,
                      borderRadius:5,padding:"4px 5px",color:T.stat.text,fontSize:12,textAlign:"center",fontFamily:"DM Mono,monospace"}}/>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="ct">Costos Etapa 3 y Tiempo Real</div>
            <DRow label="Tiempo ideal" val2={`${e3.tIdeal_dias.toFixed(4)} días`}/>
            <DRow label="+ Días inop. clima BB" val2={`+ ${e3.diasInop.toFixed(4)} días`}/>
            <DRow label="+ Espera BB (mes actual)" val2={`+ ${e3.esperaBB} días`} tipo="stat"/>
            <DRow label="= TIEMPO REAL DESCARGA" val2={`${e3.tReal_dias.toFixed(4)} días`}/>
            <div style={{height:8}}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:8}}>
              <Campo label="Opex descarga" value={p.des_opexUSDTn} onChange={v=>set("des_opexUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
              <Campo label="Camiones (directo)" value={p.des_costoCamionesDirUSDTn} onChange={v=>set("des_costoCamionesDirUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={1}/>
              <Campo label="Costo acopio BB" value={p.des_costoAcopioUSDTn} onChange={v=>set("des_costoAcopioUSDTn",v)} tipo="usuario" unit="USD/Tn" min={0} step={0.5}/>
            </div>
            <DRow label="Opex descarga" val1={`$${p.des_opexUSDTn}/Tn × ${e3.tnEntrada.toFixed(0)} Tn`} val2={`$${e3.costoOpex.toFixed(0)}`}/>
            <DRow label="Camiones directo" val1={`$${p.des_costoCamionesDirUSDTn}/Tn × ${e3.tnDirecto.toFixed(0)} Tn`} val2={`$${e3.costoCamiones.toFixed(0)}`}/>
            <DRow label="Acopio" val1={`$${p.des_costoAcopioUSDTn}/Tn × ${e3.tnAcopio.toFixed(0)} Tn`} val2={`$${e3.costoAcopio.toFixed(0)}`}/>
            <DRow label="Combustible puerto" val1={`${e3.tReal_dias.toFixed(2)}d × ${p.nav_consumoPuerto}T/d × $${p.nav_precioVLSFO}`} val2={`$${e3.combPuerto.toFixed(0)}`}/>
            <DRow label="Time Charter" val1={`${e3.tReal_dias.toFixed(2)}d × $${p.nav_timeCharter}/d`} val2={`$${e3.fleteEtapa.toFixed(0)}`}/>
            <DRow label="TOTAL ETAPA 3" val2={`$${e3.costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}`}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB E4: VUELTA EN LASTRE ──────────────────────────────────────────────
function TabVuelta({p,set}) {
  const e4 = calcEtapa4(p);

  return (
    <div>
      <div className="kpis">
        <KPI label="Días vuelta" value={`${e4.diasNav.toFixed(3)} días`} color={T.formula.text}/>
        <KPI label="Consumo lastre" value={`${p.vta_consumoLastre} T/día`} color={T.input.text}/>
        <KPI label="Combustible vuelta" value={`$${(e4.combLastre/1000).toFixed(1)}k`} color={C.gold}/>
        <KPI label="Costo etapa 4" value={`$${(e4.costoTotal/1000).toFixed(1)}k`} color={C.navy}/>
      </div>

      <div className="card">
        <div className="ct">Ruta de Vuelta — Sea White → Zárate (mismos tramos en reversa)</div>
        <MapaNavegacion tramos={[...p.nav_tramos].reverse()} onUpdate={()=>{}} vuelta={true}/>
        <div className="src-note" style={{marginTop:10}}>
          La vuelta usa los mismos tramos y distancias que la ida pero en orden inverso. La velocidad puede diferir por corriente y marea — actualmente usa la misma velocidad por tramo. Si querés velocidades distintas para la vuelta, se puede agregar en la próxima versión.
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ct">Parámetros de Navegación en Lastre</div>
          <Campo label="Consumo en lastre" value={p.vta_consumoLastre} onChange={v=>set("vta_consumoLastre",v)} tipo="usuario" unit="T/día" min={5} max={35} step={0.5}
            nota="Barco vacío — típicamente 15–25% menos que cargado. Handysize en lastre: ~10–13 T/día."/>
          <Campo label="Espera en Zárate (vuelta)" value={p.vta_esperaZarateDias} onChange={v=>set("vta_esperaZarateDias",v)} tipo="usuario" unit="días" min={0} max={5} step={0.25}
            nota="Espera para nuevo ciclo de carga — muelle propio."/>
          <div style={{height:1,background:C.border,margin:"12px 0"}}/>
          <div className="src-note">
            Time Charter y VLSFO configurados en Etapa 2 (Navegación). El barco sigue contratado y consumiendo en la vuelta.
          </div>
        </div>

        <div className="card">
          <div className="ct">Fórmulas — Costo Vuelta en Lastre <TipoBadge tipo="formula"/></div>
          <DRow label="Distancia (misma que ida)" val2={`${e4.totalMn} mn`}/>
          <DRow label="Horas navegación" val2={`${e4.totalHrs.toFixed(2)} hs`}/>
          <DRow label="Días navegación" val1="horas / 24" val2={`${e4.diasNav.toFixed(4)} días`}/>
          <div style={{height:8}}/>
          <DRow label="Combustible lastre" val1={`${e4.diasNav.toFixed(2)}d × ${p.vta_consumoLastre}T/d × $${p.nav_precioVLSFO}`} val2={`$${e4.combLastre.toFixed(0)}`}/>
          <DRow label="Flete TC vuelta" val1={`${e4.diasNav.toFixed(2)}d × $${p.nav_timeCharter}/d`} val2={`$${e4.fleteNav.toFixed(0)}`}/>
          <DRow label="TOTAL ETAPA 4" val2={`$${e4.costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}`}/>
          <div style={{background:C.warn,border:`1px solid ${C.warnBorder}`,borderRadius:8,padding:"10px 14px",marginTop:12}}>
            <div style={{fontSize:10,color:C.orange,fontWeight:700}}>Ahorro vs. ida cargado</div>
            <div style={{fontSize:15,fontWeight:800,color:C.orange,fontFamily:"DM Mono,monospace"}}>
              ${((p.nav_consumoNavegando-p.vta_consumoLastre)*e4.diasNav*p.nav_precioVLSFO).toFixed(0)} USD en combustible
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB MC: MONTE CARLO ───────────────────────────────────────────────────
function TabMC({p}) {
  const [n,setN]       = useState(5000);
  const [mesIdx,setMes]= useState(null);
  const [res,setRes]   = useState(null);
  const [mcMes,setMcMes]= useState(null);
  const [running,setR] = useState(false);
  const [runningM,setRM]= useState(false);

  const det = calcTotal(p,mesIdx??5);

  const run = useCallback(()=>{
    setR(true);
    setTimeout(()=>{setRes(runMonteCarlo(p,n,mesIdx));setR(false);},60);
  },[p,n,mesIdx]);

  const runMes = useCallback(()=>{
    setRM(true);
    setTimeout(()=>{setMcMes(runMCMensual(p,2000));setRM(false);},80);
  },[p]);

  const pBadges = res ? [
    {l:"P10 Optimista", v:res.p10, bg:"#F0FDF4", bc:"#86BFAB", c:C.green,  d:"Solo 10% de escenarios mejora esto"},
    {l:"P25",           v:res.p25, bg:"#F0FDF4", bc:"#86BFAB", c:"#1a7a3a",d:"Cuartil optimista"},
    {l:"P50 Probable",  v:res.p50, bg:"#FEFCE8", bc:"#D4B84A", c:C.gold,   d:"Mediana — caso más frecuente"},
    {l:"P75",           v:res.p75, bg:"#FEF3C7", bc:"#D4B84A", c:C.orange, d:"Cuartil pesimista"},
    {l:"P90 Pesimista", v:res.p90, bg:"#FEE2E2", bc:"#FECACA", c:C.red,    d:"Solo 10% de escenarios es peor"},
  ] : [];

  return (
    <div>
      <div className="card">
        <div className="ct">Configuración de la Simulación</div>
        <p style={{fontSize:12,color:C.muted,lineHeight:1.7,marginBottom:12}}>
          El Monte Carlo corre el modelo completo N veces, variando aleatoriamente las variables con incertidumbre.
          Cada corrida produce un USD/Tn distinto. El resultado es la distribución de probabilidad del costo final.
        </p>
        <div style={{display:"flex",gap:14,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div>
            <div className="campo-label" style={{color:C.muted}}>N simulaciones</div>
            <select className="campo-input" value={n} onChange={e=>setN(Number(e.target.value))} style={{width:160,background:T.input.bg,borderColor:T.input.border,color:T.input.text}}>
              {[1000,3000,5000,10000].map(v=><option key={v} value={v}>{v.toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <div className="campo-label" style={{color:C.muted}}>Mes (vacío = año completo aleatorio)</div>
            <select className="campo-input" value={mesIdx??""} onChange={e=>setMes(e.target.value===""?null:Number(e.target.value))} style={{width:200,background:T.stat.bg,borderColor:T.stat.border,color:T.stat.text}}>
              <option value="">Año completo</option>
              {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <button className="run" onClick={run} disabled={running}>{running?"Calculando...":"▶ Correr Simulación"}</button>
          <span style={{fontSize:12,color:C.muted}}>Base determinística: <strong style={{color:C.gold}}>${det.usdTn.toFixed(2)} USD/Tn</strong></span>
        </div>
      </div>

      {/* Variables del MC */}
      {res && (
        <div className="card">
          <div className="ct">Variables en la Simulación — Rangos</div>
          <div className="mc-var-row" style={{fontWeight:700,fontSize:10,color:C.muted,background:"transparent"}}>
            <span>Variable</span><span>Valor base</span><span>Distribución</span><span>Tipo</span>
          </div>
          {res.vars.map((v,i)=>(
            <div key={i} className="mc-var-row">
              <span style={{fontWeight:600,color:C.navy}}>{v.label}</span>
              <span style={{fontFamily:"DM Mono,monospace",color:v.tipo==="usuario"?T.input.text:T.stat.text}}>{v.base}</span>
              <span style={{fontSize:11,color:C.muted}}>{v.dist}</span>
              <TipoBadge tipo={v.tipo}/>
            </div>
          ))}
        </div>
      )}

      {res && (
        <>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {pBadges.map(({l,v,bg,bc,c,d})=>(
              <div key={l} className="pbadge" style={{background:bg,borderColor:bc}}>
                <div className="pbadge-l" style={{color:c}}>{l}</div>
                <div className="pbadge-v" style={{color:c}}>${v.toFixed(2)}</div>
                <div className="pbadge-d" style={{color:c}}>USD/Tn · {d}</div>
              </div>
            ))}
            <div className="pbadge" style={{background:"#EEF2F7",borderColor:C.border}}>
              <div className="pbadge-l" style={{color:C.muted}}>Spread P10–P90</div>
              <div className="pbadge-v" style={{color:C.navy}}>${(res.p90-res.p10).toFixed(2)}</div>
              <div className="pbadge-d" style={{color:C.muted}}>σ = ${res.std.toFixed(2)}</div>
            </div>
          </div>

          <div className="card">
            <div className="ct">Distribución de Probabilidad — {res.n.toLocaleString()} simulaciones</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={res.hist} margin={{top:10,right:10,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="x" tick={{fill:C.muted,fontSize:10}} tickCount={12}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} unit="%"/>
                <Tooltip {...TTip} formatter={(v,_,{payload})=>[`${v.toFixed(1)}% a $${payload.x}`]}/>
                <ReferenceLine x={res.p10} stroke={C.green}  strokeWidth={2} label={{value:"P10",fill:C.green, fontSize:10}}/>
                <ReferenceLine x={res.p50} stroke={C.gold}   strokeWidth={2} label={{value:"P50",fill:C.gold,  fontSize:10}}/>
                <ReferenceLine x={res.p90} stroke={C.red}    strokeWidth={2} label={{value:"P90",fill:C.red,   fontSize:10}}/>
                <ReferenceLine x={det.usdTn} stroke={C.mid}  strokeDasharray="4 4" label={{value:"Det.",fill:C.mid,fontSize:10}}/>
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
        <div className="ct">Resultado Mes a Mes — Monte Carlo</div>
        <p style={{fontSize:12,color:C.muted,marginBottom:12}}>
          Corre 2.000 simulaciones por mes (24.000 total). Muestra la variación estacional del costo.
        </p>
        <button className="run" onClick={runMes} disabled={runningM} style={{marginBottom:14}}>
          {runningM?"Calculando 24.000 simulaciones...":"▶ Correr Monte Carlo Mensual"}
        </button>

        {mcMes && (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={mcMes} margin={{top:10,right:10,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:11}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} domain={["auto","auto"]}/>
                <Tooltip {...TTip} formatter={(v,n)=>[`$${v.toFixed(2)} USD/Tn`,n]}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Bar dataKey="p90" name="P90 (pesimista)"  fill="#FCA5A544" radius={[3,3,0,0]}/>
                <Bar dataKey="p50" name="P50 (probable)"   fill="#FCD34D44" radius={[3,3,0,0]}/>
                <Bar dataKey="p10" name="P10 (optimista)"  fill="#A7F3D044" radius={[3,3,0,0]}/>
                <Line type="monotone" dataKey="det" name="Determinístico" stroke={C.blue} strokeWidth={2} dot={{r:3}}/>
              </ComposedChart>
            </ResponsiveContainer>

            {/* Tabla mes a mes */}
            <div style={{overflowX:"auto",marginTop:14}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:C.navy}}>
                    {["Mes","P10","P25","P50","P75","P90","Det.","Spread"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",color:"rgba(255,255,255,.7)",fontSize:10,textAlign:"right",fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mcMes.map((r,i)=>(
                    <tr key={r.mes} style={{background:i%2===0?"#EEF2F7":"#fff",borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:"7px 10px",fontWeight:700,color:C.navy}}>{r.mes}</td>
                      {[r.p10,r.p25,r.p50,r.p75,r.p90,r.det].map((v,j)=>(
                        <td key={j} style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",
                          color:j===2?C.gold:j===5?C.blue:C.navy}}>${v.toFixed(2)}</td>
                      ))}
                      <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.orange}}>
                        ${(r.p90-r.p10).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{background:C.navy,fontWeight:700}}>
                    <td style={{padding:"9px 10px",color:"#fff"}}>PROMEDIO</td>
                    {["p10","p25","p50","p75","p90","det"].map(k=>(
                      <td key={k} style={{padding:"9px 10px",textAlign:"right",
                        fontFamily:"DM Mono,monospace",color:k==="p50"?C.warnBorder:k==="det"?"#7EB8E8":"rgba(255,255,255,.8)"}}>
                        ${(mcMes.reduce((a,r)=>a+r[k],0)/12).toFixed(2)}
                      </td>
                    ))}
                    <td style={{padding:"9px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:"#FCA5A5"}}>
                      ${(mcMes.reduce((a,r)=>a+(r.p90-r.p10),0)/12).toFixed(2)}
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

// ─── TAB SC: ESCENARIOS ────────────────────────────────────────────────────
function TabEscenarios({p}) {
  const [escenarios,setEsc] = useState([]);
  const [nombre,setNombre]  = useState("");
  const [desc,setDesc]      = useState("");
  const [saving,setSaving]  = useState(false);
  const [loading,setLoading]= useState(false);
  const [msg,setMsg]        = useState("");
  const det = calcTotal(p);

  const cargar = async()=>{
    setLoading(true);
    const {data} = await supabase.from("escenarios_arena").select("*").order("created_at",{ascending:false});
    setEsc(data||[]);setLoading(false);
  };

  const guardar = async()=>{
    if(!nombre.trim()){setMsg("Ingresá un nombre");return;}
    setSaving(true);
    const {error} = await supabase.from("escenarios_arena").insert({
      nombre:nombre.trim(),descripcion:desc.trim(),params:p,
      usd_tn:parseFloat(det.usdTn.toFixed(2)),
    });
    if(error){setMsg("Error: "+error.message);}
    else{setMsg("✓ Guardado");setNombre("");setDesc("");cargar();}
    setSaving(false);
    setTimeout(()=>setMsg(""),3000);
  };

  const eliminar = async(id)=>{
    await supabase.from("escenarios_arena").delete().eq("id",id);cargar();
  };

  return (
    <div>
      <div className="card">
        <div className="ct">Guardar Escenario Actual</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:12}}>
          <div style={{flex:2,minWidth:200}}>
            <div className="campo-label" style={{color:T.input.label}}>Nombre</div>
            <input className="campo-input" value={nombre} onChange={e=>setNombre(e.target.value)}
              placeholder="Ej: Caso base junio 2026"
              style={{background:T.input.bg,borderColor:T.input.border,color:T.input.text}}/>
          </div>
          <div style={{flex:3,minWidth:200}}>
            <div className="campo-label" style={{color:T.input.label}}>Descripción</div>
            <input className="campo-input" value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Notas sobre este escenario"
              style={{background:T.input.bg,borderColor:T.input.border,color:T.input.text}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button className="run" onClick={guardar} disabled={saving}>{saving?"Guardando...":"💾 Guardar"}</button>
          <span style={{fontSize:12,color:C.muted}}>USD/Tn actual: <strong style={{color:C.gold}}>${det.usdTn.toFixed(2)}</strong></span>
          {msg&&<span style={{fontSize:12,color:msg.startsWith("✓")?C.green:C.red,fontWeight:700}}>{msg}</span>}
        </div>
      </div>

      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div className="ct" style={{margin:0}}>Escenarios Guardados</div>
          <button className="run" style={{padding:"6px 16px",fontSize:11}} onClick={cargar}>{loading?"Cargando...":"↻ Actualizar"}</button>
        </div>
        {escenarios.length===0?(
          <div style={{textAlign:"center",padding:"28px 0",color:C.muted,fontSize:13}}>No hay escenarios guardados aún.</div>
        ):escenarios.map(e=>(
          <div key={e.id} style={{background:"#EEF2F7",border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{e.nombre}</div>
              {e.descripcion&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{e.descripcion}</div>}
              <div style={{fontSize:10,color:C.muted,marginTop:3,fontFamily:"DM Mono,monospace"}}>{new Date(e.created_at).toLocaleDateString("es-AR")}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:20,fontWeight:800,color:C.blue,fontFamily:"DM Mono,monospace"}}>${e.usd_tn?.toFixed(2)} USD/Tn</div>
              <button onClick={()=>eliminar(e.id)}
                style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:10,fontWeight:600}}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]       = useState("e1");
  const [params,setParams] = useState(DEFAULT_PARAMS);
  const set = useCallback((k,v)=>setParams(prev=>({...prev,[k]:v})),[]);
  const tot = calcTotal(params);

  const tabMap = {
    e1:<TabCarga      p={params} set={set}/>,
    e2:<TabNavegacion p={params} set={set}/>,
    e3:<TabDescarga   p={params} set={set}/>,
    e4:<TabVuelta     p={params} set={set}/>,
    mc:<TabMC         p={params}/>,
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
            {l:"USD/Tn final",   v:`$${tot.usdTn.toFixed(2)}`},
            {l:"Tn entregadas",  v:tot.tnEntregadas.toFixed(0)},
            {l:"Días totales",   v:tot.diasTotales.toFixed(1)},
            {l:"Costo total",    v:`$${(tot.costoTotal/1000).toFixed(0)}k`},
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
