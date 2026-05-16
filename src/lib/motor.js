// ─── CONSTANTES ────────────────────────────────────────────────────────────
export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export const FUENTES = {
  climaZarate: { label: "SMN — Estación San Fernando", url: "https://www.smn.gob.ar/descarga-de-datos" },
  climaBB:     { label: "SMN — Estación Bahía Blanca", url: "https://www.smn.gob.ar/descarga-de-datos" },
  esperaBB:    { label: "CGPBB — Estadísticas portuarias", url: "https://puertobahiablanca.com" },
  vlsfo:       { label: "Ship & Bunker — Rotterdam VLSFO", url: "https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam" },
};

// ─── BASE DE DATOS CLIMA DEFAULT ───────────────────────────────────────────
// Fuente: ESTIMACIÓN — pendiente validación con SMN San Fernando y SMN Bahía Blanca
// Unidades: lluvia en mm/día promedio, viento en km/h promedio
export const CLIMA_DB_DEFAULT = {
  zarate: [
    { mes:"Ene", lluviaProm:4.2,  lluviaSigma:3.1, vientoProm:18, vientoSigma:6 },
    { mes:"Feb", lluviaProm:4.0,  lluviaSigma:3.0, vientoProm:17, vientoSigma:6 },
    { mes:"Mar", lluviaProm:3.5,  lluviaSigma:2.8, vientoProm:17, vientoSigma:5 },
    { mes:"Abr", lluviaProm:2.8,  lluviaSigma:2.4, vientoProm:16, vientoSigma:5 },
    { mes:"May", lluviaProm:2.2,  lluviaSigma:2.0, vientoProm:17, vientoSigma:6 },
    { mes:"Jun", lluviaProm:1.8,  lluviaSigma:1.6, vientoProm:18, vientoSigma:6 },
    { mes:"Jul", lluviaProm:1.5,  lluviaSigma:1.4, vientoProm:19, vientoSigma:6 },
    { mes:"Ago", lluviaProm:1.7,  lluviaSigma:1.5, vientoProm:19, vientoSigma:6 },
    { mes:"Sep", lluviaProm:2.4,  lluviaSigma:2.1, vientoProm:19, vientoSigma:6 },
    { mes:"Oct", lluviaProm:3.2,  lluviaSigma:2.6, vientoProm:18, vientoSigma:6 },
    { mes:"Nov", lluviaProm:3.8,  lluviaSigma:2.9, vientoProm:17, vientoSigma:5 },
    { mes:"Dic", lluviaProm:4.1,  lluviaSigma:3.0, vientoProm:17, vientoSigma:5 },
  ],
  bb: [
    { mes:"Ene", lluviaProm:1.2,  lluviaSigma:1.4, vientoProm:28, vientoSigma:9 },
    { mes:"Feb", lluviaProm:1.1,  lluviaSigma:1.3, vientoProm:27, vientoSigma:9 },
    { mes:"Mar", lluviaProm:1.0,  lluviaSigma:1.2, vientoProm:27, vientoSigma:9 },
    { mes:"Abr", lluviaProm:0.8,  lluviaSigma:1.0, vientoProm:28, vientoSigma:9 },
    { mes:"May", lluviaProm:0.7,  lluviaSigma:0.9, vientoProm:29, vientoSigma:10 },
    { mes:"Jun", lluviaProm:0.5,  lluviaSigma:0.7, vientoProm:31, vientoSigma:10 },
    { mes:"Jul", lluviaProm:0.4,  lluviaSigma:0.6, vientoProm:32, vientoSigma:11 },
    { mes:"Ago", lluviaProm:0.5,  lluviaSigma:0.7, vientoProm:31, vientoSigma:10 },
    { mes:"Sep", lluviaProm:0.7,  lluviaSigma:0.9, vientoProm:30, vientoSigma:10 },
    { mes:"Oct", lluviaProm:0.9,  lluviaSigma:1.1, vientoProm:29, vientoSigma:9 },
    { mes:"Nov", lluviaProm:1.0,  lluviaSigma:1.2, vientoProm:28, vientoSigma:9 },
    { mes:"Dic", lluviaProm:1.1,  lluviaSigma:1.3, vientoProm:27, vientoSigma:9 },
  ],
};

// ─── TRAMOS ────────────────────────────────────────────────────────────────
export const TRAMOS_DEFAULT = [
  { id:1, nombre:"Zárate → Confluencia",           tipo:"Hidrovía",  distancia:80,  velocidad:10,   condicion:"Corriente favorable" },
  { id:2, nombre:"Confluencia → Río de la Plata",  tipo:"Hidrovía",  distancia:120, velocidad:11,   condicion:"Marea variable" },
  { id:3, nombre:"Río de la Plata → Punta Indio",  tipo:"Estuario",  distancia:95,  velocidad:11.5, condicion:"Viento ENE frecuente" },
  { id:4, nombre:"Punta Indio → Rada BB",           tipo:"Costero",   distancia:240, velocidad:13,   condicion:"Mar abierto" },
  { id:5, nombre:"Rada BB → Muelle Sea White",      tipo:"Puerto",    distancia:28,  velocidad:7,    condicion:"Canal Belgrano — práctico" },
];

// ─── CAMPOS ESPEJO ─────────────────────────────────────────────────────────
export const CAMPOS_ESPEJO = [
  { cap:"cap_grampada",  des:"des_grampada",  label:"Grampada (m³)" },
  { cap:"cap_gruas",     des:"des_gruas",      label:"Grúas" },
  { cap:"cap_movGrampa", des:"des_movGrampa",  label:"Mov/min grúa" },
];

// ─── DEFAULT PARAMS ────────────────────────────────────────────────────────
export const DEFAULT_PARAMS = {
  // Etapa 1 — Carga
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
  // Etapa 2 — Navegación
  nav_tramos:                TRAMOS_DEFAULT,
  nav_timeCharter:           20000,
  nav_precioVLSFO:           990,
  nav_consumoNavegando:      15.6,
  nav_consumoPuerto:         4.6,
  // Etapa 3 — Descarga
  des_grampada:              15,
  des_gruas:                 2,
  des_movGrampa:             0.5,
  des_horasDia:              14,
  des_esperaBBMes:           [3.2,2.8,2.1,1.9,1.5,1.2,0.9,1.1,1.4,2.0,2.5,3.0],
  des_agenciaBB:             106204,
  des_inopLluvia:            20,
  des_inopViento:            35,
  des_pctMermaDescarga:      0.015,
  des_pctMermaAcopio:        0.01,
  des_pctAcopio:             0.30,
  des_opexUSDTn:             8,
  des_costoAcopioUSDTn:      2.5,
  des_costoCamionesDirUSDTn: 37.14,
  // Etapa 4 — Vuelta
  vta_consumoLastre:         12.5,
  vta_esperaZarateDias:      0.5,
  // Base de datos clima
  clima_zarate:              CLIMA_DB_DEFAULT.zarate,
  clima_bb:                  CLIMA_DB_DEFAULT.bb,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
// Probabilidad de que una variable Normal(mu, sigma) supere un umbral
function probSuperaUmbral(mu, sigma, umbral) {
  if (sigma <= 0) return mu >= umbral ? 1 : 0;
  // Aproximación de la función de distribución normal complementaria
  const z = (umbral - mu) / sigma;
  return 0.5 * erfc(z / Math.sqrt(2));
}

function erfc(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? 1 - y : 1 + y;
}

export function getPctInopFromDB(climaDB, umbralLluvia, umbralViento) {
  return climaDB.map(d => {
    const pL = probSuperaUmbral(d.lluviaProm, d.lluviaSigma, umbralLluvia);
    const pV = probSuperaUmbral(d.vientoProm, d.vientoSigma, umbralViento);
    return Math.min(pL + pV - pL * pV, 0.95);
  });
}

export function velPromedioPonderada(tramos) {
  const totalMn  = tramos.reduce((a, t) => a + t.distancia, 0);
  const totalHrs = tramos.reduce((a, t) => a + t.distancia / t.velocidad, 0);
  return { velProm: totalMn / totalHrs, totalMn, totalHrs, diasNav: totalHrs / 24 };
}

export function checkEspejo(p) {
  return (CAMPOS_ESPEJO || []).map(c => ({
    label: c.label, valCap: p[c.cap], valDes: p[c.des], difiere: p[c.cap] !== p[c.des],
  }));
}

// ─── ETAPA 1: CARGA ────────────────────────────────────────────────────────
export function calcEtapa1(p, mesIdx = 5) {
  const velIdeal_TnMin = p.cap_gruas * p.cap_grampada * p.cap_densidadArena * p.cap_movGrampa;
  const velIdeal_TnHr  = velIdeal_TnMin * 60;
  const tIdeal_hr      = p.cap_capacidadBarco / velIdeal_TnHr;
  const tIdeal_dias    = tIdeal_hr / p.cap_horasDia;

  const inopZ    = getPctInopFromDB(p.clima_zarate, p.cap_inopLluvia, p.cap_inopViento);
  const pInop    = inopZ[mesIdx];
  const diasInop = tIdeal_dias * pInop / Math.max(0.01, 1 - pInop);
  const tReal_dias = tIdeal_dias + diasInop + p.cap_esperaDias;

  const mermaTn     = p.cap_capacidadBarco * p.cap_pctMerma;
  const tnPostCarga = p.cap_capacidadBarco - mermaTn;
  const precioArena = p.cap_arenaFijaPorMes ? p.cap_precioArenaMes[mesIdx] : p.cap_precioArenaOrigen;

  const costoArena    = precioArena * p.cap_capacidadBarco;
  const costoMerma    = precioArena * mermaTn;
  const costoOpex     = p.cap_opexUSDTn * p.cap_capacidadBarco;
  const combPuerto    = tReal_dias * p.nav_consumoPuerto * p.nav_precioVLSFO;
  const fleteEtapa    = tReal_dias * p.nav_timeCharter;
  const agencia       = p.cap_agenciaZarate;
  const costoTotal    = costoArena + costoMerma + costoOpex + combPuerto + fleteEtapa + agencia;

  return {
    velIdeal_TnMin, velIdeal_TnHr, tIdeal_hr, tIdeal_dias,
    pInop, diasInop, tReal_dias,
    mermaTn, tnPostCarga, precioArena,
    costoArena, costoMerma, costoOpex, combPuerto, fleteEtapa, agencia, costoTotal,
    // Breakdowns para hover
    hoverVel: `${p.cap_gruas} grúas × ${p.cap_grampada} m³ × ${p.cap_densidadArena} T/m³ × ${p.cap_movGrampa} mov/min = ${velIdeal_TnMin.toFixed(4)} Tn/min`,
    hoverTIdeal: `${p.cap_capacidadBarco.toLocaleString()} Tn ÷ ${velIdeal_TnHr.toFixed(2)} Tn/hr ÷ ${p.cap_horasDia} hr/día = ${tIdeal_dias.toFixed(4)} días`,
    hoverInop: `${(pInop*100).toFixed(2)}% × ${tIdeal_dias.toFixed(4)} días ÷ (1 − ${(pInop*100).toFixed(2)}%) = ${diasInop.toFixed(4)} días extra`,
    hoverTReal: `${tIdeal_dias.toFixed(4)} + ${diasInop.toFixed(4)} + ${p.cap_esperaDias} = ${tReal_dias.toFixed(4)} días`,
    hoverMerma: `${p.cap_capacidadBarco.toLocaleString()} × ${(p.cap_pctMerma*100).toFixed(2)}% = ${mermaTn.toFixed(0)} Tn`,
    hoverTotal: [
      `Arena: $${precioArena} × ${p.cap_capacidadBarco.toLocaleString()} = $${costoArena.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Merma: $${precioArena} × ${mermaTn.toFixed(0)} Tn = $${costoMerma.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Opex: $${p.cap_opexUSDTn}/Tn × ${p.cap_capacidadBarco.toLocaleString()} = $${costoOpex.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Comb. puerto: ${tReal_dias.toFixed(2)}d × ${p.nav_consumoPuerto}T/d × $${p.nav_precioVLSFO} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC: ${tReal_dias.toFixed(2)}d × $${p.nav_timeCharter}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Agencia Zárate: $${agencia.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 2: NAVEGACIÓN IDA ───────────────────────────────────────────────
export function calcEtapa2(p) {
  const nav = velPromedioPonderada(p.nav_tramos);
  const combNav    = nav.diasNav * p.nav_consumoNavegando * p.nav_precioVLSFO;
  const fleteNav   = nav.diasNav * p.nav_timeCharter;
  const costoTotal = combNav + fleteNav;
  return {
    ...nav, combNav, fleteNav, costoTotal,
    hoverVelProm: `${nav.totalMn} mn ÷ ${nav.totalHrs.toFixed(2)} hs = ${nav.velProm.toFixed(4)} kt`,
    hoverTotal: [
      `Comb. ida: ${nav.diasNav.toFixed(3)}d × ${p.nav_consumoNavegando}T/d × $${p.nav_precioVLSFO} = $${combNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC ida: ${nav.diasNav.toFixed(3)}d × $${p.nav_timeCharter}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 3: DESCARGA ─────────────────────────────────────────────────────
export function calcEtapa3(p, mesIdx = 5, tnEntrada = null) {
  const tn = tnEntrada ?? (p.cap_capacidadBarco * (1 - p.cap_pctMerma));

  const velIdeal_TnMin = p.des_gruas * p.des_grampada * p.cap_densidadArena * p.des_movGrampa;
  const velIdeal_TnHr  = velIdeal_TnMin * 60;
  const tIdeal_hr      = tn / velIdeal_TnHr;
  const tIdeal_dias    = tIdeal_hr / p.des_horasDia;

  const inopB    = getPctInopFromDB(p.clima_bb, p.des_inopLluvia, p.des_inopViento);
  const pInop    = inopB[mesIdx];
  const diasInop = tIdeal_dias * pInop / Math.max(0.01, 1 - pInop);
  const esperaBB = p.des_esperaBBMes[mesIdx];
  const tReal_dias = tIdeal_dias + diasInop + esperaBB;

  const mermaDescarga_Tn = tn * p.des_pctMermaDescarga;
  const tnPostDescarga   = tn - mermaDescarga_Tn;
  const tnAcopio         = tnPostDescarga * p.des_pctAcopio;
  const tnDirecto        = tnPostDescarga * (1 - p.des_pctAcopio);
  const mermaAcopio_Tn   = tnAcopio * p.des_pctMermaAcopio;
  const tnEntregadas     = tnPostDescarga - mermaAcopio_Tn;

  const costoOpex     = p.des_opexUSDTn * tn;
  const costoCamiones = p.des_costoCamionesDirUSDTn * tnDirecto;
  const costoAcopio   = p.des_costoAcopioUSDTn * tnAcopio;
  const combPuerto    = tReal_dias * p.nav_consumoPuerto * p.nav_precioVLSFO;
  const fleteEtapa    = tReal_dias * p.nav_timeCharter;
  const agencia       = p.des_agenciaBB;
  const costoTotal    = costoOpex + costoCamiones + costoAcopio + combPuerto + fleteEtapa + agencia;

  return {
    tnEntrada: tn, velIdeal_TnMin, velIdeal_TnHr, tIdeal_hr, tIdeal_dias,
    pInop, diasInop, esperaBB, tReal_dias,
    mermaDescarga_Tn, tnPostDescarga, tnAcopio, tnDirecto, mermaAcopio_Tn, tnEntregadas,
    costoOpex, costoCamiones, costoAcopio, combPuerto, fleteEtapa, agencia, costoTotal,
    hoverVel: `${p.des_gruas} grúas × ${p.des_grampada} m³ × ${p.cap_densidadArena} T/m³ × ${p.des_movGrampa} mov/min = ${velIdeal_TnMin.toFixed(4)} Tn/min`,
    hoverTReal: `${tIdeal_dias.toFixed(4)} + ${diasInop.toFixed(4)} + ${esperaBB} = ${tReal_dias.toFixed(4)} días`,
    hoverTotal: [
      `Opex: $${p.des_opexUSDTn}/Tn × ${tn.toFixed(0)} Tn = $${costoOpex.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Camiones: $${p.des_costoCamionesDirUSDTn}/Tn × ${tnDirecto.toFixed(0)} Tn = $${costoCamiones.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Acopio: $${p.des_costoAcopioUSDTn}/Tn × ${tnAcopio.toFixed(0)} Tn = $${costoAcopio.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Comb. puerto: ${tReal_dias.toFixed(2)}d × ${p.nav_consumoPuerto}T/d × $${p.nav_precioVLSFO} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC: ${tReal_dias.toFixed(2)}d × $${p.nav_timeCharter}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Agencia BB: $${agencia.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 4: VUELTA EN LASTRE ─────────────────────────────────────────────
export function calcEtapa4(p) {
  const nav        = velPromedioPonderada(p.nav_tramos);
  const combLastre = nav.diasNav * p.vta_consumoLastre * p.nav_precioVLSFO;
  const fleteNav   = nav.diasNav * p.nav_timeCharter;
  const costoTotal = combLastre + fleteNav;
  return {
    ...nav, combLastre, fleteNav, costoTotal,
    hoverTotal: [
      `Comb. lastre: ${nav.diasNav.toFixed(3)}d × ${p.vta_consumoLastre}T/d × $${p.nav_precioVLSFO} = $${combLastre.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `TC vuelta: ${nav.diasNav.toFixed(3)}d × $${p.nav_timeCharter}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── TOTAL ─────────────────────────────────────────────────────────────────
export function calcTotal(p, mesIdx = 5) {
  const e1 = calcEtapa1(p, mesIdx);
  const e2 = calcEtapa2(p);
  const e3 = calcEtapa3(p, mesIdx, e1.tnPostCarga);
  const e4 = calcEtapa4(p);
  const costoTotal  = e1.costoTotal + e2.costoTotal + e3.costoTotal + e4.costoTotal;
  const usdTn       = costoTotal / e3.tnEntregadas;
  const diasTotales = e1.tReal_dias + e2.diasNav + e3.tReal_dias + e4.diasNav;
  return { e1, e2, e3, e4, costoTotal, usdTn, diasTotales, tnEntregadas: e3.tnEntregadas };
}

// ─── MONTE CARLO ───────────────────────────────────────────────────────────
function randn() {
  let u=0,v=0;
  while(u===0) u=Math.random();
  while(v===0) v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

// Samplea un valor de lluvia o viento del mes dado y retorna si supera el umbral
function sampleInop(climaDB, mesIdx, umbralLluvia, umbralViento) {
  const d = climaDB[mesIdx];
  const lluvia = Math.max(0, d.lluviaProm + randn() * d.lluviaSigma);
  const viento = Math.max(0, d.vientoProm + randn() * d.vientoSigma);
  const inopL  = lluvia > umbralLluvia ? 1 : 0;
  const inopV  = viento > umbralViento ? 1 : 0;
  // Probabilidad = P(L OR V)
  return Math.min(inopL + inopV - inopL * inopV, 1);
}

export function runMonteCarlo(p, n = 5000, mesIdx = null) {
  const results = [];

  for (let i = 0; i < n; i++) {
    const mes   = mesIdx !== null ? mesIdx : Math.floor(Math.random() * 12);
    const vlsfo = Math.max(500, p.nav_precioVLSFO + randn() * 100);
    const tc    = Math.max(5000, p.nav_timeCharter + randn() * 1500);
    const espBB = Math.max(0, p.des_esperaBBMes[mes] + randn() * 0.6);
    const espZ  = Math.max(0, p.cap_esperaDias + randn() * 0.2);
    const mC    = Math.max(0, p.cap_pctMerma + randn() * 0.005);
    const mD    = Math.max(0, p.des_pctMermaDescarga + randn() * 0.004);
    const mA    = Math.max(0, p.des_pctMermaAcopio + randn() * 0.003);
    const vFact = Math.max(0.5, 1 + randn() * 0.08);
    const pa    = p.cap_arenaFijaPorMes ? p.cap_precioArenaMes[mes] : p.cap_precioArenaOrigen;

    // Inop basada en distribuciones de la DB
    const pZ = sampleInop(p.clima_zarate, mes, p.cap_inopLluvia, p.cap_inopViento);
    const pB = sampleInop(p.clima_bb,     mes, p.des_inopLluvia, p.des_inopViento);

    // E1
    const vH1  = p.cap_gruas * p.cap_grampada * p.cap_densidadArena * p.cap_movGrampa * 60;
    const tI1  = p.cap_capacidadBarco / vH1 / p.cap_horasDia;
    const tR1  = tI1 + tI1 * pZ / Math.max(0.01,1-pZ) + espZ;
    const mCTn = p.cap_capacidadBarco * mC;
    const tnPC = p.cap_capacidadBarco - mCTn;
    const c1   = pa*p.cap_capacidadBarco + pa*mCTn + p.cap_opexUSDTn*p.cap_capacidadBarco
                 + tR1*p.nav_consumoPuerto*vlsfo + tR1*tc + p.cap_agenciaZarate;

    // E2
    const { diasNav } = velPromedioPonderada(p.nav_tramos.map(t=>({...t,velocidad:t.velocidad*vFact})));
    const c2 = diasNav*p.nav_consumoNavegando*vlsfo + diasNav*tc;

    // E3
    const vH3  = p.des_gruas*p.des_grampada*p.cap_densidadArena*p.des_movGrampa*60;
    const tI3  = tnPC/vH3/p.des_horasDia;
    const tR3  = tI3 + tI3*pB/Math.max(0.01,1-pB) + espBB;
    const mDTn = tnPC*mD;
    const tnPD = tnPC-mDTn;
    const tnAc = tnPD*p.des_pctAcopio;
    const tnDi = tnPD*(1-p.des_pctAcopio);
    const mATn = tnAc*mA;
    const tnEnt= tnPD-mATn;
    const c3   = p.des_opexUSDTn*tnPC + p.des_costoCamionesDirUSDTn*tnDi
                 + p.des_costoAcopioUSDTn*tnAc + tR3*p.nav_consumoPuerto*vlsfo + tR3*tc + p.des_agenciaBB;

    // E4
    const c4 = diasNav*p.vta_consumoLastre*vlsfo + diasNav*tc;

    results.push(parseFloat(((c1+c2+c3+c4)/tnEnt).toFixed(3)));
  }

  results.sort((a,b)=>a-b);
  const pct  = q => results[Math.floor(q*n)];
  const mean = results.reduce((a,b)=>a+b,0)/n;
  const std  = Math.sqrt(results.reduce((a,b)=>a+(b-mean)**2,0)/n);
  const mn=results[0], mx=results[n-1], bins=40, bs=(mx-mn)/bins;
  const hist = Array.from({length:bins},(_,i)=>({x:parseFloat((mn+i*bs+bs/2).toFixed(2)),count:0,pct:0}));
  results.forEach(v=>{const bi=Math.min(Math.floor((v-mn)/bs),bins-1);hist[bi].count++;});
  hist.forEach(h=>h.pct=parseFloat(((h.count/n)*100).toFixed(2)));

  const inopZprom = getPctInopFromDB(p.clima_zarate, p.cap_inopLluvia, p.cap_inopViento);
  const inopBprom = getPctInopFromDB(p.clima_bb, p.des_inopLluvia, p.des_inopViento);

  return {
    hist, n,
    mean:parseFloat(mean.toFixed(2)), std:parseFloat(std.toFixed(2)),
    p10:pct(0.10), p25:pct(0.25), p50:pct(0.50), p75:pct(0.75), p90:pct(0.90),
    min:mn, max:mx,
    vars:[
      {label:"Velocidad barco",  base:`±8% relativo`,               dist:"Factor Normal(1, σ=0.08)",   tipo:"usuario"},
      {label:"VLSFO",            base:`$${p.nav_precioVLSFO}/T`,    dist:"Normal(base, σ=$100)",        tipo:"usuario"},
      {label:"Time Charter",     base:`$${p.nav_timeCharter}/día`,  dist:"Normal(base, σ=$1.500)",      tipo:"usuario"},
      {label:"Espera BB",        base:`${p.des_esperaBBMes[mesIdx??5]}d (mes sel.)`, dist:"Normal(base, σ=0.6d)", tipo:"estadistico"},
      {label:"Espera Zárate",    base:`${p.cap_esperaDias}d`,        dist:"Normal(base, σ=0.2d)",        tipo:"usuario"},
      {label:"Lluvia Zárate",    base:`μ=${p.clima_zarate[mesIdx??5].lluviaProm}mm σ=${p.clima_zarate[mesIdx??5].lluviaSigma}mm`, dist:"Normal → vs umbral", tipo:"estadistico"},
      {label:"Viento Zárate",    base:`μ=${p.clima_zarate[mesIdx??5].vientoProm}km/h σ=${p.clima_zarate[mesIdx??5].vientoSigma}km/h`, dist:"Normal → vs umbral", tipo:"estadistico"},
      {label:"Lluvia BB",        base:`μ=${p.clima_bb[mesIdx??5].lluviaProm}mm σ=${p.clima_bb[mesIdx??5].lluviaSigma}mm`, dist:"Normal → vs umbral", tipo:"estadistico"},
      {label:"Viento BB",        base:`μ=${p.clima_bb[mesIdx??5].vientoProm}km/h σ=${p.clima_bb[mesIdx??5].vientoSigma}km/h`, dist:"Normal → vs umbral", tipo:"estadistico"},
      {label:"Merma carga",      base:`${(p.cap_pctMerma*100).toFixed(2)}%`, dist:"Normal(base, σ=0.5%)", tipo:"usuario"},
      {label:"Merma descarga",   base:`${(p.des_pctMermaDescarga*100).toFixed(2)}%`, dist:"Normal(base, σ=0.4%)", tipo:"usuario"},
      {label:"Merma acopio",     base:`${(p.des_pctMermaAcopio*100).toFixed(2)}%`, dist:"Normal(base, σ=0.3%)", tipo:"usuario"},
    ],
  };
}

export function runMCMensual(p, n=2000) {
  return MESES.map((_,i)=>{
    const r   = runMonteCarlo(p,n,i);
    const det = calcTotal(p,i);
    return {mes:MESES[i], p10:r.p10, p25:r.p25, p50:r.p50, p75:r.p75, p90:r.p90, det:parseFloat(det.usdTn.toFixed(2))};
  });
}
