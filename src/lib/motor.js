// ─── CONSTANTES ────────────────────────────────────────────────────────────
export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export const FUENTES = {
  climaZarate: { label: "SMN — Estación Zárate", url: "https://www.smn.gob.ar/descarga-de-datos" },
  climaBB:     { label: "SMN — Estación Bahía Blanca", url: "https://www.smn.gob.ar/descarga-de-datos" },
  esperaBB:    { label: "CGPBB — Estadísticas portuarias", url: "https://puertobahiablanca.com" },
  vlsfo:       { label: "Ship & Bunker — Rotterdam VLSFO", url: "https://shipandbunker.com/prices/emea/nwe/nl-rtm-rotterdam" },
};

export const CLIMA_ZARATE = [
  { mes:"Ene", lluvia_p20:30, lluvia_p50:15, lluvia_p80:5, viento_p35:15, viento_p50:10, viento_p80:3 },
  { mes:"Feb", lluvia_p20:28, lluvia_p50:18, lluvia_p80:5, viento_p35:16, viento_p50:10, viento_p80:3 },
  { mes:"Mar", lluvia_p20:25, lluvia_p50:14, lluvia_p80:4, viento_p35:17, viento_p50:11, viento_p80:3 },
  { mes:"Abr", lluvia_p20:20, lluvia_p50:12, lluvia_p80:3, viento_p35:18, viento_p50:12, viento_p80:4 },
  { mes:"May", lluvia_p20:15, lluvia_p50:10, lluvia_p80:3, viento_p35:20, viento_p50:13, viento_p80:4 },
  { mes:"Jun", lluvia_p20:10, lluvia_p50:8,  lluvia_p80:2, viento_p35:22, viento_p50:14, viento_p80:5 },
  { mes:"Jul", lluvia_p20:8,  lluvia_p50:6,  lluvia_p80:2, viento_p35:23, viento_p50:15, viento_p80:5 },
  { mes:"Ago", lluvia_p20:10, lluvia_p50:7,  lluvia_p80:2, viento_p35:21, viento_p50:14, viento_p80:5 },
  { mes:"Sep", lluvia_p20:15, lluvia_p50:9,  lluvia_p80:3, viento_p35:19, viento_p50:13, viento_p80:4 },
  { mes:"Oct", lluvia_p20:22, lluvia_p50:12, lluvia_p80:3, viento_p35:17, viento_p50:11, viento_p80:4 },
  { mes:"Nov", lluvia_p20:27, lluvia_p50:14, lluvia_p80:4, viento_p35:16, viento_p50:10, viento_p80:3 },
  { mes:"Dic", lluvia_p20:29, lluvia_p50:15, lluvia_p80:5, viento_p35:15, viento_p50:10, viento_p80:3 },
];

export const CLIMA_BB = [
  { mes:"Ene", lluvia_p20:14, lluvia_p50:7,  lluvia_p80:2, viento_p35:27, viento_p50:18, viento_p80:7 },
  { mes:"Feb", lluvia_p20:13, lluvia_p50:7,  lluvia_p80:2, viento_p35:28, viento_p50:18, viento_p80:7 },
  { mes:"Mar", lluvia_p20:12, lluvia_p50:6,  lluvia_p80:2, viento_p35:29, viento_p50:19, viento_p80:8 },
  { mes:"Abr", lluvia_p20:10, lluvia_p50:5,  lluvia_p80:1, viento_p35:32, viento_p50:21, viento_p80:9 },
  { mes:"May", lluvia_p20:9,  lluvia_p50:4,  lluvia_p80:1, viento_p35:35, viento_p50:23, viento_p80:10 },
  { mes:"Jun", lluvia_p20:7,  lluvia_p50:3,  lluvia_p80:1, viento_p35:38, viento_p50:25, viento_p80:12 },
  { mes:"Jul", lluvia_p20:6,  lluvia_p50:3,  lluvia_p80:1, viento_p35:40, viento_p50:27, viento_p80:13 },
  { mes:"Ago", lluvia_p20:7,  lluvia_p50:3,  lluvia_p80:1, viento_p35:37, viento_p50:25, viento_p80:11 },
  { mes:"Sep", lluvia_p20:9,  lluvia_p50:4,  lluvia_p80:1, viento_p35:33, viento_p50:22, viento_p80:9 },
  { mes:"Oct", lluvia_p20:11, lluvia_p50:5,  lluvia_p80:1, viento_p35:30, viento_p50:20, viento_p80:8 },
  { mes:"Nov", lluvia_p20:12, lluvia_p50:6,  lluvia_p80:2, viento_p35:28, viento_p50:19, viento_p80:7 },
  { mes:"Dic", lluvia_p20:13, lluvia_p50:7,  lluvia_p80:2, viento_p35:27, viento_p50:18, viento_p80:7 },
];

export const TRAMOS_DEFAULT = [
  { id:1, nombre:"Zárate → Confluencia",           tipo:"Hidrovía",  distancia:80,  velocidad:10,   condicion:"Corriente favorable" },
  { id:2, nombre:"Confluencia → Río de la Plata",  tipo:"Hidrovía",  distancia:120, velocidad:11,   condicion:"Marea variable" },
  { id:3, nombre:"Río de la Plata → Punta Indio",  tipo:"Estuario",  distancia:95,  velocidad:11.5, condicion:"Viento ENE frecuente" },
  { id:4, nombre:"Punta Indio → Rada BB",           tipo:"Costero",   distancia:240, velocidad:13,   condicion:"Mar abierto" },
  { id:5, nombre:"Rada BB → Muelle Sea White",      tipo:"Puerto",    distancia:28,  velocidad:7,    condicion:"Canal Belgrano — práctico" },
];

export const CAMPOS_ESPEJO = [
  { cap:"cap_grampada",  des:"des_grampada",  label:"Grampada (m³)" },
  { cap:"cap_gruas",     des:"des_gruas",      label:"Grúas" },
  { cap:"cap_movGrampa", des:"des_movGrampa",  label:"Mov/min grúa" },
];

export const DEFAULT_PARAMS = {
  cap_capacidadBarco:        28000,
  cap_densidadArena:         1.45,
  cap_grampada:              15,
  cap_gruas:                 2,
  cap_movGrampa:             0.5,
  cap_horasDia:              12,
  cap_esperaDias:            0.5,
  cap_inopLluvia:            20,
  cap_inopViento:            35,
  cap_pctMerma:              0.02,
  cap_opexUSDTn:             1,
  cap_precioArenaOrigen:     13.5,
  cap_arenaFijaPorMes:       false,
  cap_precioArenaMes:        Array(12).fill(13.5),
  nav_tramos:                TRAMOS_DEFAULT,
  nav_timeCharter:           20000,
  nav_precioVLSFO:           990,
  nav_consumoNavegando:      15.6,
  nav_consumoPuerto:         4.6,
  nav_agenciaZarate:         83948,
  nav_agenciaBB:             106204,
  des_grampada:              15,
  des_gruas:                 2,
  des_movGrampa:             0.5,
  des_horasDia:              14,
  des_esperaBBMes:           [3.2,2.8,2.1,1.9,1.5,1.2,0.9,1.1,1.4,2.0,2.5,3.0],
  des_inopLluvia:            20,
  des_inopViento:            35,
  des_pctMermaDescarga:      0.015,
  des_pctMermaAcopio:        0.01,
  des_pctAcopio:             0.30,
  des_opexUSDTn:             8,
  des_costoAcopioUSDTn:      2.5,
  des_costoCamionesDirUSDTn: 37.14,
  vta_consumoLastre:         12.5,
  vta_esperaZarateDias:      0.5,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
export function getPctInop(climaData, umbralLluvia, umbralViento) {
  return climaData.map(d => {
    const pL = umbralLluvia <= 20 ? d.lluvia_p20 : umbralLluvia <= 50 ? d.lluvia_p50 : d.lluvia_p80;
    const pV = umbralViento <= 35 ? d.viento_p35 : umbralViento <= 50 ? d.viento_p50 : d.viento_p80;
    return Math.min((pL + pV - pL * pV / 100) / 100, 0.95);
  });
}

export function velPromedioPonderada(tramos) {
  const totalMn  = tramos.reduce((a, t) => a + t.distancia, 0);
  const totalHrs = tramos.reduce((a, t) => a + t.distancia / t.velocidad, 0);
  return { velProm: totalMn / totalHrs, totalMn, totalHrs, diasNav: totalHrs / 24 };
}

export function checkEspejo(p) {
  return CAMPOS_ESPEJO.map(c => ({
    label: c.label, valCap: p[c.cap], valDes: p[c.des], difiere: p[c.cap] !== p[c.des],
  }));
}

// ─── ETAPAS ────────────────────────────────────────────────────────────────
export function calcEtapa1(p, mesIdx = 5) {
  const velIdeal_TnMin = p.cap_gruas * p.cap_grampada * p.cap_densidadArena * p.cap_movGrampa;
  const velIdeal_TnHr  = velIdeal_TnMin * 60;
  const tIdeal_hr      = p.cap_capacidadBarco / velIdeal_TnHr;
  const tIdeal_dias    = tIdeal_hr / p.cap_horasDia;
  const inopZ          = getPctInop(CLIMA_ZARATE, p.cap_inopLluvia, p.cap_inopViento);
  const pInop          = inopZ[mesIdx];
  const diasInop       = tIdeal_dias * pInop / Math.max(0.01, 1 - pInop);
  const tReal_dias     = tIdeal_dias + diasInop + p.cap_esperaDias;
  const mermaTn        = p.cap_capacidadBarco * p.cap_pctMerma;
  const tnPostCarga    = p.cap_capacidadBarco - mermaTn;
  const precioArena    = p.cap_arenaFijaPorMes ? p.cap_precioArenaMes[mesIdx] : p.cap_precioArenaOrigen;
  const costoArena     = precioArena * p.cap_capacidadBarco;
  const costoMerma     = precioArena * mermaTn;
  const costoOpex      = p.cap_opexUSDTn * p.cap_capacidadBarco;
  const combPuerto     = tReal_dias * p.nav_consumoPuerto * p.nav_precioVLSFO;
  const fleteEtapa     = tReal_dias * p.nav_timeCharter;
  const costoTotal     = costoArena + costoMerma + costoOpex + combPuerto + fleteEtapa;
  return {
    velIdeal_TnMin, velIdeal_TnHr, tIdeal_hr, tIdeal_dias,
    pInop, diasInop, tReal_dias, mermaTn, tnPostCarga,
    precioArena, costoArena, costoMerma, costoOpex,
    combPuerto, fleteEtapa, costoTotal,
  };
}

export function calcEtapa2(p) {
  const nav = velPromedioPonderada(p.nav_tramos);
  const combNav    = nav.diasNav * p.nav_consumoNavegando * p.nav_precioVLSFO;
  const fleteNav   = nav.diasNav * p.nav_timeCharter;
  const agencias   = p.nav_agenciaZarate + p.nav_agenciaBB;
  const costoTotal = combNav + fleteNav + agencias;
  return { ...nav, combNav, fleteNav, agencias, costoTotal };
}

export function calcEtapa3(p, mesIdx = 5, tnEntrada = null) {
  const tn             = tnEntrada ?? (p.cap_capacidadBarco * (1 - p.cap_pctMerma));
  const velIdeal_TnMin = p.des_gruas * p.des_grampada * p.cap_densidadArena * p.des_movGrampa;
  const velIdeal_TnHr  = velIdeal_TnMin * 60;
  const tIdeal_hr      = tn / velIdeal_TnHr;
  const tIdeal_dias    = tIdeal_hr / p.des_horasDia;
  const inopB          = getPctInop(CLIMA_BB, p.des_inopLluvia, p.des_inopViento);
  const pInop          = inopB[mesIdx];
  const diasInop       = tIdeal_dias * pInop / Math.max(0.01, 1 - pInop);
  const esperaBB       = p.des_esperaBBMes[mesIdx];
  const tReal_dias     = tIdeal_dias + diasInop + esperaBB;
  const mermaDescarga_Tn = tn * p.des_pctMermaDescarga;
  const tnPostDescarga   = tn - mermaDescarga_Tn;
  const tnAcopio         = tnPostDescarga * p.des_pctAcopio;
  const tnDirecto        = tnPostDescarga * (1 - p.des_pctAcopio);
  const mermaAcopio_Tn   = tnAcopio * p.des_pctMermaAcopio;
  const tnEntregadas     = tnPostDescarga - mermaAcopio_Tn;
  const costoOpex        = p.des_opexUSDTn * tn;
  const costoCamiones    = p.des_costoCamionesDirUSDTn * tnDirecto;
  const costoAcopio      = p.des_costoAcopioUSDTn * tnAcopio;
  const combPuerto       = tReal_dias * p.nav_consumoPuerto * p.nav_precioVLSFO;
  const fleteEtapa       = tReal_dias * p.nav_timeCharter;
  const costoTotal       = costoOpex + costoCamiones + costoAcopio + combPuerto + fleteEtapa;
  return {
    tnEntrada: tn, velIdeal_TnMin, velIdeal_TnHr, tIdeal_hr, tIdeal_dias,
    pInop, diasInop, esperaBB, tReal_dias,
    mermaDescarga_Tn, tnPostDescarga, tnAcopio, tnDirecto, mermaAcopio_Tn, tnEntregadas,
    costoOpex, costoCamiones, costoAcopio, combPuerto, fleteEtapa, costoTotal,
  };
}

export function calcEtapa4(p) {
  const nav        = velPromedioPonderada(p.nav_tramos);
  const combLastre = nav.diasNav * p.vta_consumoLastre * p.nav_precioVLSFO;
  const fleteNav   = nav.diasNav * p.nav_timeCharter;
  const costoTotal = combLastre + fleteNav;
  return { ...nav, combLastre, fleteNav, costoTotal };
}

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

export function runMonteCarlo(p, n=5000, mesIdx=null) {
  const inopZ = getPctInop(CLIMA_ZARATE, p.cap_inopLluvia, p.cap_inopViento);
  const inopB = getPctInop(CLIMA_BB, p.des_inopLluvia, p.des_inopViento);
  const results = [];

  for(let i=0;i<n;i++){
    const mes   = mesIdx!==null ? mesIdx : Math.floor(Math.random()*12);
    const vlsfo = Math.max(500, p.nav_precioVLSFO + randn()*100);
    const tc    = Math.max(5000, p.nav_timeCharter + randn()*1500);
    const pZ    = Math.max(0, inopZ[mes]*(1+randn()*0.2));
    const pB    = Math.max(0, inopB[mes]*(1+randn()*0.2));
    const espBB = Math.max(0, p.des_esperaBBMes[mes]+randn()*0.6);
    const espZ  = Math.max(0, p.cap_esperaDias+randn()*0.2);
    const mC    = Math.max(0, p.cap_pctMerma+randn()*0.005);
    const mD    = Math.max(0, p.des_pctMermaDescarga+randn()*0.004);
    const mA    = Math.max(0, p.des_pctMermaAcopio+randn()*0.003);
    const vFact = Math.max(0.5, 1+randn()*0.08);
    const pa    = p.cap_arenaFijaPorMes ? p.cap_precioArenaMes[mes] : p.cap_precioArenaOrigen;

    const vH1  = p.cap_gruas*p.cap_grampada*p.cap_densidadArena*p.cap_movGrampa*60;
    const tI1  = p.cap_capacidadBarco/vH1/p.cap_horasDia;
    const tR1  = tI1+tI1*pZ/Math.max(0.01,1-pZ)+espZ;
    const mCTn = p.cap_capacidadBarco*mC;
    const tnPC = p.cap_capacidadBarco-mCTn;
    const c1   = pa*p.cap_capacidadBarco+pa*mCTn+p.cap_opexUSDTn*p.cap_capacidadBarco
                 +tR1*p.nav_consumoPuerto*vlsfo+tR1*tc;

    const { diasNav } = velPromedioPonderada(p.nav_tramos.map(t=>({...t,velocidad:t.velocidad*vFact})));
    const c2 = diasNav*p.nav_consumoNavegando*vlsfo+diasNav*tc+p.nav_agenciaZarate+p.nav_agenciaBB;

    const vH3  = p.des_gruas*p.des_grampada*p.cap_densidadArena*p.des_movGrampa*60;
    const tI3  = tnPC/vH3/p.des_horasDia;
    const tR3  = tI3+tI3*pB/Math.max(0.01,1-pB)+espBB;
    const mDTn = tnPC*mD;
    const tnPD = tnPC-mDTn;
    const tnAc = tnPD*p.des_pctAcopio;
    const tnDi = tnPD*(1-p.des_pctAcopio);
    const mATn = tnAc*mA;
    const tnEnt= tnPD-mATn;
    const c3   = p.des_opexUSDTn*tnPC+p.des_costoCamionesDirUSDTn*tnDi
                 +p.des_costoAcopioUSDTn*tnAc+tR3*p.nav_consumoPuerto*vlsfo+tR3*tc;

    const c4 = diasNav*p.vta_consumoLastre*vlsfo+diasNav*tc;
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

  return {
    hist, n,
    mean: parseFloat(mean.toFixed(2)), std: parseFloat(std.toFixed(2)),
    p10:pct(0.10), p25:pct(0.25), p50:pct(0.50), p75:pct(0.75), p90:pct(0.90),
    min:mn, max:mx,
    vars: [
      { label:"Velocidad barco",  base:`${p.nav_tramos.reduce((a,t)=>a+t.distancia,0)/p.nav_tramos.reduce((a,t)=>a+t.distancia/t.velocidad,0).toFixed(1)} kt`, dist:"±8% relativo",   tipo:"usuario" },
      { label:"VLSFO",            base:`$${p.nav_precioVLSFO}`,  dist:"Normal σ=$100",   tipo:"usuario" },
      { label:"Time Charter",     base:`$${p.nav_timeCharter}`,  dist:"Normal σ=$1.500", tipo:"usuario" },
      { label:"Espera BB",        base:`${p.des_esperaBBMes[mesIdx??5]}d`, dist:"Normal σ=0.6d",  tipo:"estadistico" },
      { label:"Inop. clima Z",    base:`${((getPctInop(CLIMA_ZARATE,p.cap_inopLluvia,p.cap_inopViento)[mesIdx??5])*100).toFixed(1)}%`, dist:"±20% relativo", tipo:"estadistico" },
      { label:"Inop. clima BB",   base:`${((getPctInop(CLIMA_BB,p.des_inopLluvia,p.des_inopViento)[mesIdx??5])*100).toFixed(1)}%`, dist:"±20% relativo", tipo:"estadistico" },
      { label:"Merma carga",      base:`${(p.cap_pctMerma*100).toFixed(2)}%`, dist:"Normal σ=0.5%", tipo:"usuario" },
      { label:"Merma descarga",   base:`${(p.des_pctMermaDescarga*100).toFixed(2)}%`, dist:"Normal σ=0.4%", tipo:"usuario" },
      { label:"Merma acopio",     base:`${(p.des_pctMermaAcopio*100).toFixed(2)}%`, dist:"Normal σ=0.3%", tipo:"usuario" },
    ],
  };
}

export function runMCMensual(p, n=2000) {
  return MESES.map((_,i)=>{
    const r   = runMonteCarlo(p,n,i);
    const det = calcTotal(p,i);
    return { mes:MESES[i], p10:r.p10, p25:r.p25, p50:r.p50, p75:r.p75, p90:r.p90, det:parseFloat(det.usdTn.toFixed(2)) };
  });
}
