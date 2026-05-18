// ─── CONSTANTES ────────────────────────────────────────────────────────────
export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export const FUENTES = {
  climaZarate: { label:"SMN — Estación San Fernando", url:"https://www.smn.gob.ar/descarga-de-datos" },
  climaBB:     { label:"SMN — Estación Bahía Blanca",  url:"https://www.smn.gob.ar/descarga-de-datos" },
  esperaBB:    { label:"CGPBB — Estadísticas portuarias", url:"https://puertobahiablanca.com" },
  vlsfo:       { label:"Ship & Bunker — Rotterdam VLSFO", url:"https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam" },
};

// ─── TABLA VELOCIDAD/CONSUMO HANDYSIZE 28.000 Tn ──────────────────────────
// Fuente: valores típicos de mercado para Handysize bulk carrier
// Consumo sigue relación cúbica: C ∝ v³
export const TABLA_VEL_CONSUMO_DEFAULT = [
  { vel:9,  cargado:9.8,  lastre:7.8  },
  { vel:10, cargado:11.5, lastre:9.2  },
  { vel:11, cargado:13.5, lastre:10.8 },
  { vel:12, cargado:15.6, lastre:12.5 },
  { vel:13, cargado:18.2, lastre:14.5 },
  { vel:14, cargado:21.4, lastre:17.1 },
  { vel:15, cargado:25.1, lastre:20.1 },
];

// Interpolación lineal del consumo dado una velocidad
export function interpolarConsumo(tablaVelConsumo, velocidad, tipo="cargado") {
  const tabla = tablaVelConsumo;
  if (velocidad <= tabla[0].vel) return tabla[0][tipo];
  if (velocidad >= tabla[tabla.length-1].vel) return tabla[tabla.length-1][tipo];
  for (let i = 0; i < tabla.length-1; i++) {
    if (velocidad >= tabla[i].vel && velocidad <= tabla[i+1].vel) {
      const t = (velocidad - tabla[i].vel) / (tabla[i+1].vel - tabla[i].vel);
      return tabla[i][tipo] + t * (tabla[i+1][tipo] - tabla[i][tipo]);
    }
  }
  return tabla[3][tipo]; // fallback 12kt
}

// ─── HISTÓRICO VLSFO ───────────────────────────────────────────────────────
export const VLSFO_HISTORICO_DEFAULT = [
  {año:2020,mes:0,precio:370},{año:2020,mes:1,precio:360},{año:2020,mes:2,precio:290},
  {año:2020,mes:3,precio:220},{año:2020,mes:4,precio:200},{año:2020,mes:5,precio:230},
  {año:2020,mes:6,precio:280},{año:2020,mes:7,precio:310},{año:2020,mes:8,precio:330},
  {año:2020,mes:9,precio:360},{año:2020,mes:10,precio:380},{año:2020,mes:11,precio:410},
  {año:2021,mes:0,precio:430},{año:2021,mes:1,precio:450},{año:2021,mes:2,precio:470},
  {año:2021,mes:3,precio:500},{año:2021,mes:4,precio:520},{año:2021,mes:5,precio:540},
  {año:2021,mes:6,precio:560},{año:2021,mes:7,precio:580},{año:2021,mes:8,precio:600},
  {año:2021,mes:9,precio:620},{año:2021,mes:10,precio:650},{año:2021,mes:11,precio:680},
  {año:2022,mes:0,precio:720},{año:2022,mes:1,precio:780},{año:2022,mes:2,precio:900},
  {año:2022,mes:3,precio:950},{año:2022,mes:4,precio:980},{año:2022,mes:5,precio:1020},
  {año:2022,mes:6,precio:960},{año:2022,mes:7,precio:900},{año:2022,mes:8,precio:870},
  {año:2022,mes:9,precio:840},{año:2022,mes:10,precio:810},{año:2022,mes:11,precio:790},
  {año:2023,mes:0,precio:760},{año:2023,mes:1,precio:740},{año:2023,mes:2,precio:720},
  {año:2023,mes:3,precio:700},{año:2023,mes:4,precio:680},{año:2023,mes:5,precio:660},
  {año:2023,mes:6,precio:640},{año:2023,mes:7,precio:650},{año:2023,mes:8,precio:670},
  {año:2023,mes:9,precio:690},{año:2023,mes:10,precio:710},{año:2023,mes:11,precio:730},
  {año:2024,mes:0,precio:750},{año:2024,mes:1,precio:770},{año:2024,mes:2,precio:790},
  {año:2024,mes:3,precio:810},{año:2024,mes:4,precio:830},{año:2024,mes:5,precio:850},
  {año:2024,mes:6,precio:870},{año:2024,mes:7,precio:890},{año:2024,mes:8,precio:910},
  {año:2024,mes:9,precio:930},{año:2024,mes:10,precio:950},{año:2024,mes:11,precio:970},
  {año:2025,mes:0,precio:980},{año:2025,mes:1,precio:985},{año:2025,mes:2,precio:988},
  {año:2025,mes:3,precio:990},{año:2025,mes:4,precio:992},{año:2025,mes:5,precio:990},
];

export function calcVLSFOStats(historico) {
  const precios = historico.map(h=>h.precio);
  const ultimos12 = precios.slice(-12);
  const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
  const prom12m = avg(ultimos12);
  const prom5a  = avg(precios.slice(-60));
  const actual  = precios[precios.length-1];
  const min5a   = Math.min(...precios.slice(-60));
  const max5a   = Math.max(...precios.slice(-60));
  const sigma12m = Math.sqrt(ultimos12.reduce((a,b)=>a+(b-prom12m)**2,0)/ultimos12.length);
  return { actual, prom12m, prom5a, min5a, max5a, sigma12m,
    pctVsPromedio12m: ((actual-prom12m)/prom12m*100),
    pctVsPromedio5a:  ((actual-prom5a)/prom5a*100),
  };
}

// ─── CLIMA ─────────────────────────────────────────────────────────────────
export const CLIMA_DB_DEFAULT = {
  zarate: [
    {mes:"Ene",lluviaProm:4.2,lluviaSigma:3.1,vientoProm:18,vientoSigma:6},
    {mes:"Feb",lluviaProm:4.0,lluviaSigma:3.0,vientoProm:17,vientoSigma:6},
    {mes:"Mar",lluviaProm:3.5,lluviaSigma:2.8,vientoProm:17,vientoSigma:5},
    {mes:"Abr",lluviaProm:2.8,lluviaSigma:2.4,vientoProm:16,vientoSigma:5},
    {mes:"May",lluviaProm:2.2,lluviaSigma:2.0,vientoProm:17,vientoSigma:6},
    {mes:"Jun",lluviaProm:1.8,lluviaSigma:1.6,vientoProm:18,vientoSigma:6},
    {mes:"Jul",lluviaProm:1.5,lluviaSigma:1.4,vientoProm:19,vientoSigma:6},
    {mes:"Ago",lluviaProm:1.7,lluviaSigma:1.5,vientoProm:19,vientoSigma:6},
    {mes:"Sep",lluviaProm:2.4,lluviaSigma:2.1,vientoProm:19,vientoSigma:6},
    {mes:"Oct",lluviaProm:3.2,lluviaSigma:2.6,vientoProm:18,vientoSigma:6},
    {mes:"Nov",lluviaProm:3.8,lluviaSigma:2.9,vientoProm:17,vientoSigma:5},
    {mes:"Dic",lluviaProm:4.1,lluviaSigma:3.0,vientoProm:17,vientoSigma:5},
  ],
  bb: [
    {mes:"Ene",lluviaProm:1.2,lluviaSigma:1.4,vientoProm:28,vientoSigma:9},
    {mes:"Feb",lluviaProm:1.1,lluviaSigma:1.3,vientoProm:27,vientoSigma:9},
    {mes:"Mar",lluviaProm:1.0,lluviaSigma:1.2,vientoProm:27,vientoSigma:9},
    {mes:"Abr",lluviaProm:0.8,lluviaSigma:1.0,vientoProm:28,vientoSigma:9},
    {mes:"May",lluviaProm:0.7,lluviaSigma:0.9,vientoProm:29,vientoSigma:10},
    {mes:"Jun",lluviaProm:0.5,lluviaSigma:0.7,vientoProm:31,vientoSigma:10},
    {mes:"Jul",lluviaProm:0.4,lluviaSigma:0.6,vientoProm:32,vientoSigma:11},
    {mes:"Ago",lluviaProm:0.5,lluviaSigma:0.7,vientoProm:31,vientoSigma:10},
    {mes:"Sep",lluviaProm:0.7,lluviaSigma:0.9,vientoProm:30,vientoSigma:10},
    {mes:"Oct",lluviaProm:0.9,lluviaSigma:1.1,vientoProm:29,vientoSigma:9},
    {mes:"Nov",lluviaProm:1.0,lluviaSigma:1.2,vientoProm:28,vientoSigma:9},
    {mes:"Dic",lluviaProm:1.1,lluviaSigma:1.3,vientoProm:27,vientoSigma:9},
  ],
};

// ─── TRAMOS ────────────────────────────────────────────────────────────────
export const TRAMOS_DEFAULT = [
  {id:1,nombre:"Zárate → Confluencia",          tipo:"Hidrovía",distancia:80, velocidad:10,  condicion:"Corriente favorable"},
  {id:2,nombre:"Confluencia → Río de la Plata", tipo:"Hidrovía",distancia:120,velocidad:11,  condicion:"Marea variable"},
  {id:3,nombre:"Río de la Plata → Punta Indio", tipo:"Estuario",distancia:95, velocidad:11.5,condicion:"Viento ENE frecuente"},
  {id:4,nombre:"Punta Indio → Rada BB",          tipo:"Costero", distancia:240,velocidad:13,  condicion:"Mar abierto"},
  {id:5,nombre:"Rada BB → Muelle Sea White",     tipo:"Puerto",  distancia:28, velocidad:7,   condicion:"Canal Belgrano — práctico"},
];

export const CAMPOS_ESPEJO = [
  {cap:"cap_grampada", des:"des_grampada", label:"Grampada (m³)"},
  {cap:"cap_gruas",    des:"des_gruas",    label:"Grúas"},
  {cap:"cap_movGrampa",des:"des_movGrampa",label:"Mov/min grúa"},
];

export const VLSFO_ESCENARIOS = [
  {id:"hoy",    label:"Valor hoy",       desc:"Precio más reciente"},
  {id:"prom12", label:"Prom. 12 meses",  desc:"Promedio últimos 12 meses"},
  {id:"prom5a", label:"Prom. 5 años",    desc:"Promedio últimos 5 años"},
  {id:"manual", label:"Manual",          desc:"Ingresás el valor vos"},
];

export function getPrecioVLSFO(escenario, vlsfoManual, vlsfoHistorico) {
  const stats = calcVLSFOStats(vlsfoHistorico);
  switch(escenario) {
    case "hoy":    return stats.actual;
    case "prom12": return Math.round(stats.prom12m);
    case "prom5a": return Math.round(stats.prom5a);
    case "manual": return vlsfoManual;
    default:       return stats.actual;
  }
}

// ─── DEFAULT PARAMS ────────────────────────────────────────────────────────
export const DEFAULT_PARAMS = {
  // CONTRATO BARCO
  barco_timeCharter:         20000,  // USD/día — centralizado acá
  barco_tripulacion:         0,      // USD/día — por ahora 0
  barco_tablaVelConsumo:     TABLA_VEL_CONSUMO_DEFAULT,
  barco_consumoPuerto:       4.6,    // T/día en puerto (carga y descarga)

  // ETAPA 1 — CARGA
  cap_capacidadBarco:        28000,
  cap_densidadArena:         1.45,
  cap_grampada:              15,
  cap_gruas:                 2,
  cap_movGrampa:             0.5,
  cap_horasDia:              12,
  cap_esperaDias:            0.5,
  cap_agenciaZarate:         83948,
  cap_inopLluvia:            20,
  cap_inopViento:            35,
  cap_pctMerma:              0.02,
  cap_opexUSDTn:             1,
  cap_precioArenaOrigen:     13.5,
  cap_arenaFijaPorMes:       false,
  cap_precioArenaMes:        Array(12).fill(13.5),

  // ETAPA 2 — NAVEGACIÓN IDA
  nav_tramos:                TRAMOS_DEFAULT,
  nav_escenarioVLSFO:        "hoy",
  nav_vlsfoManual:           990,

  // ETAPA 3 — DESCARGA
  des_grampada:              15,
  des_gruas:                 2,
  des_movGrampa:             0.5,
  des_horasDia:              14,
  des_esperaBBMes:           [3.2,2.8,2.1,1.9,1.5,1.2,0.9,1.1,1.4,2.0,2.5,3.0],
  des_esperaZarateDias:      0.5,   // espera vuelta a Zárate — acá en descarga
  des_agenciaBB:             106204,
  des_inopLluvia:            20,
  des_inopViento:            35,
  des_pctMermaDescarga:      0.015,
  des_pctMermaAcopio:        0.01,
  des_pctAcopio:             0.30,
  des_opexUSDTn:             8,
  des_costoAcopioUSDTn:      2.5,
  des_costoCamionesDirUSDTn: 37.14,

  // ETAPA 4 — VUELTA EN LASTRE
  vta_tramos:                [...TRAMOS_DEFAULT].reverse(),

  // BASE DE DATOS
  clima_zarate:              CLIMA_DB_DEFAULT.zarate,
  clima_bb:                  CLIMA_DB_DEFAULT.bb,
  vlsfo_historico:           VLSFO_HISTORICO_DEFAULT,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
function probSuperaUmbral(mu, sigma, umbral) {
  if(sigma<=0) return mu>=umbral?1:0;
  const z=(umbral-mu)/sigma;
  return 0.5*erfc(z/Math.sqrt(2));
}
function erfc(x) {
  const t=1/(1+0.3275911*Math.abs(x));
  const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
  return x>=0?1-y:1+y;
}

export function getPctInopFromDB(climaDB, umbralLluvia, umbralViento) {
  return climaDB.map(d=>{
    const pL=probSuperaUmbral(d.lluviaProm,d.lluviaSigma,umbralLluvia);
    const pV=probSuperaUmbral(d.vientoProm,d.vientoSigma,umbralViento);
    return Math.min(pL+pV-pL*pV,0.95);
  });
}

export function getInopDetalle(climaDB, umbralLluvia, umbralViento, mesIdx) {
  const d=climaDB[mesIdx];
  const pL=probSuperaUmbral(d.lluviaProm,d.lluviaSigma,umbralLluvia);
  const pV=probSuperaUmbral(d.vientoProm,d.vientoSigma,umbralViento);
  return {pL,pV,pInop:Math.min(pL+pV-pL*pV,0.95),
    lluviaProm:d.lluviaProm,lluviaSigma:d.lluviaSigma,
    vientoProm:d.vientoProm,vientoSigma:d.vientoSigma,
    umbralLluvia,umbralViento};
}

export function velPromedioPonderada(tramos) {
  const totalMn =tramos.reduce((a,t)=>a+t.distancia,0);
  const totalHrs=tramos.reduce((a,t)=>a+t.distancia/t.velocidad,0);
  return {velProm:totalMn/totalHrs,totalMn,totalHrs,diasNav:totalHrs/24};
}

export function checkEspejo(p) {
  return (CAMPOS_ESPEJO||[]).map(c=>({label:c.label,valCap:p[c.cap],valDes:p[c.des],difiere:p[c.cap]!==p[c.des]}));
}

// ─── ETAPA 1: CARGA ────────────────────────────────────────────────────────
export function calcEtapa1(p, mesIdx=5) {
  const vlsfo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const tc=p.barco_timeCharter+p.barco_tripulacion;

  const velIdeal_TnMin=p.cap_gruas*p.cap_grampada*p.cap_densidadArena*p.cap_movGrampa;
  const velIdeal_TnHr =velIdeal_TnMin*60;
  const tIdeal_hr     =p.cap_capacidadBarco/velIdeal_TnHr;
  const tIdeal_dias   =tIdeal_hr/p.cap_horasDia;

  const inopDet =getInopDetalle(p.clima_zarate,p.cap_inopLluvia,p.cap_inopViento,mesIdx);
  const pInop   =inopDet.pInop;
  const diasInop=tIdeal_dias*pInop/Math.max(0.01,1-pInop);
  const tReal_dias=tIdeal_dias+diasInop+p.cap_esperaDias;

  const mermaTn    =p.cap_capacidadBarco*p.cap_pctMerma;
  const tnPostCarga=p.cap_capacidadBarco; // zarpa siempre lleno
  const precioArena=p.cap_arenaFijaPorMes?p.cap_precioArenaMes[mesIdx]:p.cap_precioArenaOrigen;

  const costoArena =precioArena*p.cap_capacidadBarco;
  const costoMerma =precioArena*mermaTn;
  const costoOpex  =p.cap_opexUSDTn*p.cap_capacidadBarco;
  const combPuerto =tReal_dias*p.barco_consumoPuerto*vlsfo;
  const fleteEtapa =tReal_dias*tc;
  const agencia    =p.cap_agenciaZarate;
  const costoTotal =costoArena+costoMerma+costoOpex+combPuerto+fleteEtapa+agencia;

  return {
    velIdeal_TnMin,velIdeal_TnHr,tIdeal_hr,tIdeal_dias,
    pInop,diasInop,tReal_dias,mermaTn,tnPostCarga,precioArena,vlsfo,vlsfoStats,tc,
    costoArena,costoMerma,costoOpex,combPuerto,fleteEtapa,agencia,costoTotal,
    hoverVel:`${p.cap_gruas}×${p.cap_grampada}m³×${p.cap_densidadArena}T/m³×${p.cap_movGrampa}mov/min = ${velIdeal_TnMin.toFixed(1)}Tn/min`,
    hoverTIdeal:`${p.cap_capacidadBarco}÷${velIdeal_TnHr.toFixed(0)}Tn/hr÷${p.cap_horasDia}hr/día = ${tIdeal_dias.toFixed(1)}días`,
    hoverInop:[
      `Lluvia Zárate: μ=${inopDet.lluviaProm}mm σ=${inopDet.lluviaSigma}mm → P(>${inopDet.umbralLluvia}mm) = ${(inopDet.pL*100).toFixed(2)}%`,
      `Viento Zárate: μ=${inopDet.vientoProm}km/h σ=${inopDet.vientoSigma}km/h → P(>${inopDet.umbralViento}km/h) = ${(inopDet.pV*100).toFixed(2)}%`,
      `P(inop) = ${(inopDet.pL*100).toFixed(2)}%+${(inopDet.pV*100).toFixed(2)}% = ${(pInop*100).toFixed(2)}%`,
      `Días extra = ${(pInop*100).toFixed(2)}%×${tIdeal_dias.toFixed(1)}d÷(1-${(pInop*100).toFixed(2)}%) = ${diasInop.toFixed(1)}d`,
      `⚠️ Estimado — validar SMN. Ver Base Clima.`,
    ],
    hoverTReal:`${tIdeal_dias.toFixed(1)}+${diasInop.toFixed(1)}+${p.cap_esperaDias} = ${tReal_dias.toFixed(1)}días`,
    hoverMerma:`${p.cap_capacidadBarco}×${(p.cap_pctMerma*100).toFixed(1)}% = ${mermaTn.toFixed(0)}Tn`,
    hoverComb:[
      `Escenario VLSFO: ${VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label}`,
      `Precio: $${vlsfo}/T | Hoy: $${vlsfoStats.actual} | Prom12M: $${vlsfoStats.prom12m.toFixed(0)}`,
      `Posición: ${vlsfoStats.pctVsPromedio12m>0?"+":""}${vlsfoStats.pctVsPromedio12m.toFixed(1)}% vs prom 12M`,
      `${tReal_dias.toFixed(1)}d × ${p.barco_consumoPuerto}T/d × $${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTC:[
      `Time Charter: $${p.barco_timeCharter}/día`,
      `Tripulación: $${p.barco_tripulacion}/día`,
      `Total diario: $${tc}/día`,
      `${tReal_dias.toFixed(1)}d × $${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Arena: $${precioArena}×${p.cap_capacidadBarco.toLocaleString()}Tn = $${costoArena.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Merma: $${precioArena}×${mermaTn.toFixed(0)}Tn = $${costoMerma.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Opex: $${p.cap_opexUSDTn}/Tn×${p.cap_capacidadBarco.toLocaleString()}Tn = $${costoOpex.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Comb. puerto: ${tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC+Trip: ${tReal_dias.toFixed(1)}d×$${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Agencia Zárate: $${agencia.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 2: NAVEGACIÓN IDA ───────────────────────────────────────────────
export function calcEtapa2(p) {
  const vlsfo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const tc=p.barco_timeCharter+p.barco_tripulacion;
  const nav=velPromedioPonderada(p.nav_tramos);

  // Consumo interpolado por tramo
  const combNavTotal = p.nav_tramos.reduce((acc,t)=>{
    const hs = t.distancia/t.velocidad;
    const consumoDia = interpolarConsumo(p.barco_tablaVelConsumo, t.velocidad, "cargado");
    return acc + (hs/24)*consumoDia;
  }, 0);
  const combNav  = combNavTotal*vlsfo;
  const fleteNav = nav.diasNav*tc;
  const costoTotal=combNav+fleteNav;

  return {
    ...nav, vlsfo, vlsfoStats, tc, combNavTotal, combNav, fleteNav, costoTotal,
    hoverVelProm:`${nav.totalMn}mn÷${nav.totalHrs.toFixed(1)}hs = ${nav.velProm.toFixed(1)}kt`,
    hoverComb:[
      `Consumo interpolado por tramo (tabla Contrato Barco)`,
      `Total combustible: ${combNavTotal.toFixed(1)}T × $${vlsfo} = $${combNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Escenario: ${VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label}`,
    ],
    hoverTC:[
      `TC: $${p.barco_timeCharter}/d + Trip: $${p.barco_tripulacion}/d = $${tc}/d`,
      `${nav.diasNav.toFixed(1)}d × $${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Comb. ida: ${combNavTotal.toFixed(1)}T×$${vlsfo} = $${combNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC+Trip: ${nav.diasNav.toFixed(1)}d×$${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 3: DESCARGA ─────────────────────────────────────────────────────
export function calcEtapa3(p, mesIdx=5, tnEntrada=null) {
  const vlsfo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const tc=p.barco_timeCharter+p.barco_tripulacion;
  const tn=tnEntrada??(p.cap_capacidadBarco*(1-p.cap_pctMerma));

  const velIdeal_TnMin=p.des_gruas*p.des_grampada*p.cap_densidadArena*p.des_movGrampa;
  const velIdeal_TnHr =velIdeal_TnMin*60;
  const tIdeal_hr     =tn/velIdeal_TnHr;
  const tIdeal_dias   =tIdeal_hr/p.des_horasDia;

  const inopDet =getInopDetalle(p.clima_bb,p.des_inopLluvia,p.des_inopViento,mesIdx);
  const pInop   =inopDet.pInop;
  const diasInop=tIdeal_dias*pInop/Math.max(0.01,1-pInop);
  const esperaBB=p.des_esperaBBMes[mesIdx];
  // Espera vuelta Zárate incluida acá
  const tReal_dias=tIdeal_dias+diasInop+esperaBB+p.des_esperaZarateDias;

  const mermaDescarga_Tn=tn*p.des_pctMermaDescarga;
  const tnPostDescarga  =tn-mermaDescarga_Tn;
  const tnAcopio        =tnPostDescarga*p.des_pctAcopio;
  const tnDirecto       =tnPostDescarga*(1-p.des_pctAcopio);
  const mermaAcopio_Tn  =tnAcopio*p.des_pctMermaAcopio;
  const tnEntregadas    =tnPostDescarga-mermaAcopio_Tn;

  const costoOpex    =p.des_opexUSDTn*tn;
  const costoCamiones=p.des_costoCamionesDirUSDTn*tnDirecto;
  const costoAcopio  =p.des_costoAcopioUSDTn*tnAcopio;
  const combPuerto   =tReal_dias*p.barco_consumoPuerto*vlsfo;
  const fleteEtapa   =tReal_dias*tc;
  const agencia      =p.des_agenciaBB;
  const costoTotal   =costoOpex+costoCamiones+costoAcopio+combPuerto+fleteEtapa+agencia;

  return {
    tnEntrada:tn, velIdeal_TnMin, velIdeal_TnHr, tIdeal_hr, tIdeal_dias,
    pInop, diasInop, esperaBB, tReal_dias, vlsfo, vlsfoStats, tc,
    mermaDescarga_Tn, tnPostDescarga, tnAcopio, tnDirecto, mermaAcopio_Tn, tnEntregadas,
    costoOpex, costoCamiones, costoAcopio, combPuerto, fleteEtapa, agencia, costoTotal,
    hoverVel:`${p.des_gruas}×${p.des_grampada}m³×${p.cap_densidadArena}T/m³×${p.des_movGrampa}mov/min = ${velIdeal_TnMin.toFixed(1)}Tn/min`,
    hoverTReal:`${tIdeal_dias.toFixed(1)}+${diasInop.toFixed(1)}+${esperaBB}+${p.des_esperaZarateDias}(Z) = ${tReal_dias.toFixed(1)}días`,
    hoverInop:[
      `Lluvia BB: μ=${inopDet.lluviaProm}mm σ=${inopDet.lluviaSigma}mm → P(>${inopDet.umbralLluvia}mm) = ${(inopDet.pL*100).toFixed(2)}%`,
      `Viento BB: μ=${inopDet.vientoProm}km/h σ=${inopDet.vientoSigma}km/h → P(>${inopDet.umbralViento}km/h) = ${(inopDet.pV*100).toFixed(2)}%`,
      `P(inop) = ${(inopDet.pL*100).toFixed(2)}%+${(inopDet.pV*100).toFixed(2)}% = ${(pInop*100).toFixed(2)}%`,
      `Días extra = ${diasInop.toFixed(1)}d | Espera BB: ${esperaBB}d | Espera Zárate: ${p.des_esperaZarateDias}d`,
      `⚠️ Estimado — validar SMN/Argelan.`,
    ],
    hoverComb:[
      `Escenario VLSFO: ${VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label}`,
      `Precio: $${vlsfo}/T | Hoy: $${vlsfoStats.actual} | Prom12M: $${vlsfoStats.prom12m.toFixed(0)}`,
      `${tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTC:[
      `TC: $${p.barco_timeCharter}/d + Trip: $${p.barco_tripulacion}/d = $${tc}/d`,
      `Incluye: t_ideal + inop + espera BB + espera Zárate`,
      `${tReal_dias.toFixed(1)}d×$${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Opex: $${p.des_opexUSDTn}/Tn×${tn.toFixed(0)}Tn = $${costoOpex.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Camiones: $${p.des_costoCamionesDirUSDTn}/Tn×${tnDirecto.toFixed(0)}Tn = $${costoCamiones.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Acopio: $${p.des_costoAcopioUSDTn}/Tn×${tnAcopio.toFixed(0)}Tn = $${costoAcopio.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Comb. puerto: ${tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC+Trip: ${tReal_dias.toFixed(1)}d×$${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Agencia BB: $${agencia.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 4: VUELTA EN LASTRE ─────────────────────────────────────────────
export function calcEtapa4(p) {
  const vlsfo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const tc=p.barco_timeCharter+p.barco_tripulacion;
  const nav=velPromedioPonderada(p.vta_tramos||p.nav_tramos);

  const combLastreTotal = (p.vta_tramos||p.nav_tramos).reduce((acc,t)=>{
    const hs=t.distancia/t.velocidad;
    const consumoDia=interpolarConsumo(p.barco_tablaVelConsumo,t.velocidad,"lastre");
    return acc+(hs/24)*consumoDia;
  },0);
  const combLastre=combLastreTotal*vlsfo;
  const fleteNav  =nav.diasNav*tc;
  const costoTotal=combLastre+fleteNav;

  return {
    ...nav, vlsfo, vlsfoStats, tc, combLastreTotal, combLastre, fleteNav, costoTotal,
    hoverComb:[
      `Consumo lastre interpolado por tramo (tabla Contrato Barco)`,
      `Total combustible: ${combLastreTotal.toFixed(1)}T×$${vlsfo} = $${combLastre.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTC:[
      `TC: $${p.barco_timeCharter}/d + Trip: $${p.barco_tripulacion}/d = $${tc}/d`,
      `${nav.diasNav.toFixed(1)}d×$${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Comb. lastre: ${combLastreTotal.toFixed(1)}T×$${vlsfo} = $${combLastre.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC+Trip: ${nav.diasNav.toFixed(1)}d×$${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── TOTAL ─────────────────────────────────────────────────────────────────
export function calcTotal(p, mesIdx=5) {
  const e1=calcEtapa1(p,mesIdx);
  const e2=calcEtapa2(p);
  const e3=calcEtapa3(p,mesIdx,e1.tnPostCarga);
  const e4=calcEtapa4(p);
  const costoTotal =e1.costoTotal+e2.costoTotal+e3.costoTotal+e4.costoTotal;
  const usdTn      =costoTotal/e3.tnEntregadas;
  const diasTotales=e1.tReal_dias+e2.diasNav+e3.tReal_dias+e4.diasNav;
  return {e1,e2,e3,e4,costoTotal,usdTn,diasTotales,tnEntregadas:e3.tnEntregadas};
}

// ─── MONTE CARLO ───────────────────────────────────────────────────────────
function randn(){
  let u=0,v=0;
  while(u===0)u=Math.random();
  while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

function sampleInop(climaDB,mesIdx,umbralL,umbralV){
  const d=climaDB[mesIdx];
  const pL=probSuperaUmbral(d.lluviaProm,d.lluviaSigma,umbralL);
  const pV=probSuperaUmbral(d.vientoProm,d.vientoSigma,umbralV);
  const pBase=Math.min(pL+pV-pL*pV,0.90);
  return Math.max(0,Math.min(0.50,pBase+randn()*pBase*0.2));
}

export function runMonteCarlo(p, n=5000, mesIdx=null) {
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const basePrecio=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const results=[];

  for(let i=0;i<n;i++){
    const mes  =mesIdx!==null?mesIdx:Math.floor(Math.random()*12);
    const vlsfo=Math.max(300,basePrecio+randn()*vlsfoStats.sigma12m);
    const tc   =Math.max(5000,p.barco_timeCharter+randn()*1500)+p.barco_tripulacion;
    const espBB=Math.max(0,p.des_esperaBBMes[mes]+randn()*0.6);
    const espZ =Math.max(0,p.des_esperaZarateDias+randn()*0.2);
    const mC   =Math.max(0,p.cap_pctMerma+randn()*0.005);
    const mD   =Math.max(0,p.des_pctMermaDescarga+randn()*0.004);
    const mA   =Math.max(0,p.des_pctMermaAcopio+randn()*0.003);
    const vF   =Math.max(0.5,1+randn()*0.08);
    const pa   =p.cap_arenaFijaPorMes?p.cap_precioArenaMes[mes]:p.cap_precioArenaOrigen;
    const pZ   =sampleInop(p.clima_zarate,mes,p.cap_inopLluvia,p.cap_inopViento);
    const pB   =sampleInop(p.clima_bb,mes,p.des_inopLluvia,p.des_inopViento);

    // E1
    const vH1=p.cap_gruas*p.cap_grampada*p.cap_densidadArena*p.cap_movGrampa*60;
    const tI1=p.cap_capacidadBarco/vH1/p.cap_horasDia;
    const tR1=tI1+tI1*pZ/Math.max(0.01,1-pZ)+p.cap_esperaDias;
    const mCTn=p.cap_capacidadBarco*mC;
    const tnPC=p.cap_capacidadBarco-mCTn;
    const c1=pa*p.cap_capacidadBarco+pa*mCTn+p.cap_opexUSDTn*p.cap_capacidadBarco
             +tR1*p.barco_consumoPuerto*vlsfo+tR1*tc+p.cap_agenciaZarate;

    // E2
    const tramosV=p.nav_tramos.map(t=>({...t,velocidad:t.velocidad*vF}));
    const {diasNav}=velPromedioPonderada(tramosV);
    const combNavT=tramosV.reduce((acc,t)=>{const hs=t.distancia/t.velocidad;return acc+(hs/24)*interpolarConsumo(p.barco_tablaVelConsumo,t.velocidad,"cargado");},0);
    const c2=combNavT*vlsfo+diasNav*tc;

    // E3
    const vH3=p.des_gruas*p.des_grampada*p.cap_densidadArena*p.des_movGrampa*60;
    const tI3=tnPC/vH3/p.des_horasDia;
    const tR3=tI3+tI3*pB/Math.max(0.01,1-pB)+espBB+espZ;
    const mDTn=tnPC*mD;const tnPD=tnPC-mDTn;
    const tnAc=tnPD*p.des_pctAcopio;const tnDi=tnPD*(1-p.des_pctAcopio);
    const mATn=tnAc*mA;const tnEnt=tnPD-mATn;
    const c3=p.des_opexUSDTn*tnPC+p.des_costoCamionesDirUSDTn*tnDi
             +p.des_costoAcopioUSDTn*tnAc+tR3*p.barco_consumoPuerto*vlsfo+tR3*tc+p.des_agenciaBB;

    // E4
    const tramosVL=(p.vta_tramos||p.nav_tramos).map(t=>({...t,velocidad:t.velocidad*vF}));
    const {diasNav:diasNavL}=velPromedioPonderada(tramosVL);
    const combLastT=tramosVL.reduce((acc,t)=>{const hs=t.distancia/t.velocidad;return acc+(hs/24)*interpolarConsumo(p.barco_tablaVelConsumo,t.velocidad,"lastre");},0);
    const c4=combLastT*vlsfo+diasNavL*tc;

    results.push(parseFloat(((c1+c2+c3+c4)/tnEnt).toFixed(3)));
  }

  results.sort((a,b)=>a-b);
  const pct=q=>results[Math.floor(q*n)];
  const mean=results.reduce((a,b)=>a+b,0)/n;
  const std=Math.sqrt(results.reduce((a,b)=>a+(b-mean)**2,0)/n);
  const mn=results[0],mx=results[n-1],bins=40,bs=(mx-mn)/bins;
  const hist=Array.from({length:bins},(_,i)=>({x:parseFloat((mn+i*bs+bs/2).toFixed(1)),count:0,pct:0}));
  results.forEach(v=>{const bi=Math.min(Math.floor((v-mn)/bs),bins-1);hist[bi].count++;});
  hist.forEach(h=>h.pct=parseFloat(((h.count/n)*100).toFixed(1)));

  return {
    hist,n,
    mean:parseFloat(mean.toFixed(4)),
    std:parseFloat(std.toFixed(4)),
    p10:pct(0.10),p25:pct(0.25),p50:pct(0.50),p75:pct(0.75),p90:pct(0.90),
    min:mn,max:mx,
    vars:[
      {label:"Precio VLSFO",     base:`$${basePrecio}/T (${VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label})`,dist:`Normal(base,σ=$${vlsfoStats.sigma12m.toFixed(0)}) volatilidad 12M`,tipo:"estadistico"},
      {label:"Time Charter",     base:`$${p.barco_timeCharter}/día`,dist:"Normal(base,σ=$1.500)",tipo:"usuario"},
      {label:"Velocidad barco",  base:`±8% relativo`,dist:"Factor Normal(1,σ=0.08)",tipo:"usuario"},
      {label:"Espera BB",        base:`${p.des_esperaBBMes[mesIdx??5]}d`,dist:"Normal(base,σ=0.6d)",tipo:"estadistico"},
      {label:"Espera Zárate",    base:`${p.des_esperaZarateDias}d`,dist:"Normal(base,σ=0.2d)",tipo:"usuario"},
      {label:"Lluvia/Viento Z",  base:`μ=${p.clima_zarate[mesIdx??5].lluviaProm}mm,${p.clima_zarate[mesIdx??5].vientoProm}km/h`,dist:"Normal→vs umbral (cap 50%)",tipo:"estadistico"},
      {label:"Lluvia/Viento BB", base:`μ=${p.clima_bb[mesIdx??5].lluviaProm}mm,${p.clima_bb[mesIdx??5].vientoProm}km/h`,dist:"Normal→vs umbral (cap 50%)",tipo:"estadistico"},
      {label:"Mermas",           base:`C:${(p.cap_pctMerma*100).toFixed(1)}% D:${(p.des_pctMermaDescarga*100).toFixed(1)}% A:${(p.des_pctMermaAcopio*100).toFixed(1)}%`,dist:"Normal(base,σ~0.4%)",tipo:"usuario"},
    ],
  };
}

export function runMCMensual(p, n=2000) {
  return MESES.map((_,i)=>{
    const r  =runMonteCarlo(p,n,i);
    const det=calcTotal(p,i);
    return {mes:MESES[i],p10:r.p10,p25:r.p25,p50:r.p50,p75:r.p75,p90:r.p90,det:parseFloat(det.usdTn.toFixed(1))};
  });
}
