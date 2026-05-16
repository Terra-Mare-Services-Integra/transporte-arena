// ─── DATOS HISTÓRICOS ──────────────────────────────────────────────────────
// Fuente: estimación basada en climatología regional argentina.
// Validar con SMN (smn.gob.ar) y CGPBB para datos reales.

export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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

// ─── DEFAULT PARAMS ────────────────────────────────────────────────────────
export const DEFAULT_PARAMS = {
  // Barco
  capacidadBarco: 28000,
  densidadArena: 1.45,
  grampada: 15,
  gruas: 2,
  movGrampa: 0.5,
  velocidadBarco: 12,
  distanciaZBB: 563,
  timeCharter: 20000,
  precioVLSFO: 990,
  consumoNavegando: 15.6,
  consumoPuerto: 4.6,
  // Horas de trabajo
  horasDiaZarate: 12,
  horasDiaBB: 14,
  // Arena
  precioArenaOrigen: 13.5,
  arenaFijaPorMes: false,
  precioArenaMes: Array(12).fill(13.5),
  // Agencias
  agenciaZarate: 83948,
  agenciaBB: 106204,
  // Opex
  opexCargaUSDTn: 1,
  opexDescargaUSDTn: 8,
  costoAcopioUSDTn: 2.5,
  costoCamionesDirUSDTn: 37.14,
  // Espera
  esperaZarate: 0.5,
  esperaBBMes: [3.2,2.8,2.1,1.9,1.5,1.2,0.9,1.1,1.4,2.0,2.5,3.0],
  // Mermas
  pctMermaCarga: 0.02,
  pctMermaDescarga: 0.015,
  pctMermaAcopio: 0.01,
  // Split descarga
  pctAcopio: 0.30,
  // Umbrales inoperabilidad
  inopZarateLluvia: 20,
  inopZarateViento: 35,
  inopBBLluvia: 20,
  inopBBViento: 35,
};

// ─── INOPERABILIDAD ────────────────────────────────────────────────────────
export function getPctInop(climaData, umbralLluvia, umbralViento) {
  return climaData.map(d => {
    let pLluvia = umbralLluvia <= 20 ? d.lluvia_p20 : umbralLluvia <= 50 ? d.lluvia_p50 : d.lluvia_p80;
    let pViento = umbralViento <= 35 ? d.viento_p35 : umbralViento <= 50 ? d.viento_p50 : d.viento_p80;
    const pInop = (pLluvia + pViento - pLluvia * pViento / 100) / 100;
    return Math.min(pInop, 0.95);
  });
}

// ─── MODELO IDEAL ──────────────────────────────────────────────────────────
export function modeloIdeal(p) {
  const velCarga_TnMin    = p.gruas * p.grampada * p.densidadArena * p.movGrampa;
  const velCarga_TnHr     = velCarga_TnMin * 60;
  const velDescarga_TnMin = velCarga_TnMin;
  const velDescarga_TnHr  = velDescarga_TnMin * 60;
  const tCarga_hr         = p.capacidadBarco / velCarga_TnHr;
  const tCarga_dias       = tCarga_hr / p.horasDiaZarate;
  const tDescarga_hr      = p.capacidadBarco / velDescarga_TnHr;
  const tDescarga_dias    = tDescarga_hr / p.horasDiaBB;
  const diasNav           = p.distanciaZBB / (p.velocidadBarco * 24);
  return {
    velCarga_TnMin, velCarga_TnHr,
    velDescarga_TnMin, velDescarga_TnHr,
    tCarga_hr, tCarga_dias,
    tDescarga_hr, tDescarga_dias,
    diasNav,
    totalDias: tCarga_dias + tDescarga_dias + diasNav * 2,
  };
}

// ─── MODELO CON FRICCIONES ─────────────────────────────────────────────────
export function calcularConFricciones(p, mesIdx = 5) {
  const ideal  = modeloIdeal(p);
  const inopZ  = getPctInop(CLIMA_ZARATE, p.inopZarateLluvia, p.inopZarateViento);
  const inopB  = getPctInop(CLIMA_BB,     p.inopBBLluvia,    p.inopBBViento);
  const pInopZ = inopZ[mesIdx];
  const pInopB = inopB[mesIdx];

  const diasInopZ = ideal.tCarga_dias    * pInopZ / Math.max(0.01, 1 - pInopZ);
  const diasInopB = ideal.tDescarga_dias * pInopB / Math.max(0.01, 1 - pInopB);
  const esperaBB  = p.esperaBBMes[mesIdx];

  const tCarga_real    = ideal.tCarga_dias    + diasInopZ + p.esperaZarate;
  const tDescarga_real = ideal.tDescarga_dias + diasInopB + esperaBB;
  const totalDias      = tCarga_real + tDescarga_real + ideal.diasNav * 2;

  // Mermas
  const mermaCarga_Tn    = p.capacidadBarco   * p.pctMermaCarga;
  const tnPostCarga      = p.capacidadBarco   - mermaCarga_Tn;
  const mermaDescarga_Tn = tnPostCarga        * p.pctMermaDescarga;
  const tnPostDescarga   = tnPostCarga        - mermaDescarga_Tn;
  const tnAcopio         = tnPostDescarga     * p.pctAcopio;
  const tnDirecto        = tnPostDescarga     * (1 - p.pctAcopio);
  const mermaAcopio_Tn   = tnAcopio          * p.pctMermaAcopio;
  const tnEntregadas     = tnPostDescarga     - mermaAcopio_Tn;
  const totalMermas_Tn   = mermaCarga_Tn + mermaDescarga_Tn + mermaAcopio_Tn;

  // Precio arena
  const precioArena = p.arenaFijaPorMes ? p.precioArenaMes[mesIdx] : p.precioArenaOrigen;

  // Costos
  const combNav       = ideal.diasNav * 2   * p.consumoNavegando * p.precioVLSFO;
  const combPuerto    = (tCarga_real + tDescarga_real) * p.consumoPuerto * p.precioVLSFO;
  const flete         = totalDias            * p.timeCharter;
  const costoArena    = precioArena          * p.capacidadBarco;
  const costoAgencias = p.agenciaZarate + p.agenciaBB;
  const costoOpex     = p.opexCargaUSDTn    * p.capacidadBarco + p.opexDescargaUSDTn * tnPostCarga;
  const costoCamiones = p.costoCamionesDirUSDTn * tnDirecto;
  const costoAcopio   = p.costoAcopioUSDTn  * tnAcopio;
  const costoMermas   = precioArena          * totalMermas_Tn;
  const costoTotal    = combNav + combPuerto + flete + costoArena +
                        costoAgencias + costoOpex + costoCamiones + costoAcopio + costoMermas;
  const usdTn         = costoTotal / tnEntregadas;

  return {
    ideal, pInopZ, pInopB, diasInopZ, diasInopB, esperaBB,
    tCarga_real, tDescarga_real, totalDias,
    mermaCarga_Tn, mermaDescarga_Tn, mermaAcopio_Tn, totalMermas_Tn,
    tnPostCarga, tnPostDescarga, tnAcopio, tnDirecto, tnEntregadas,
    combNav, combPuerto, flete, costoArena, costoAgencias,
    costoOpex, costoCamiones, costoAcopio, costoMermas,
    costoTotal, usdTn, precioArena,
  };
}

// ─── MONTE CARLO ───────────────────────────────────────────────────────────
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function runMonteCarlo(p, n = 5000, mesIdx = null) {
  const inopZ = getPctInop(CLIMA_ZARATE, p.inopZarateLluvia, p.inopZarateViento);
  const inopB = getPctInop(CLIMA_BB,     p.inopBBLluvia,    p.inopBBViento);
  const results = [];

  for (let i = 0; i < n; i++) {
    const mes      = mesIdx !== null ? mesIdx : Math.floor(Math.random() * 12);
    const pZ       = inopZ[mes];
    const pB       = inopB[mes];
    const velBarco = Math.max(8, p.velocidadBarco + randn() * 1.2);
    const vlsfo    = Math.max(500, p.precioVLSFO   + randn() * 100);
    const esperaBB = Math.max(0,  p.esperaBBMes[mes] + randn() * 0.6);
    const esperaZ  = Math.max(0,  p.esperaZarate   + randn() * 0.2);
    const inopZs   = Math.max(0,  pZ * (1 + randn() * 0.2));
    const inopBs   = Math.max(0,  pB * (1 + randn() * 0.2));
    const mC       = Math.max(0,  p.pctMermaCarga    + randn() * 0.005);
    const mD       = Math.max(0,  p.pctMermaDescarga + randn() * 0.004);
    const mA       = Math.max(0,  p.pctMermaAcopio   + randn() * 0.003);

    const ideal    = modeloIdeal({ ...p, velocidadBarco: velBarco });
    const dZ       = ideal.tCarga_dias    * inopZs / Math.max(0.01, 1 - inopZs);
    const dB       = ideal.tDescarga_dias * inopBs / Math.max(0.01, 1 - inopBs);
    const tC       = ideal.tCarga_dias    + dZ + esperaZ;
    const tD       = ideal.tDescarga_dias + dB + esperaBB;
    const totalD   = tC + tD + ideal.diasNav * 2;

    const mCTn  = p.capacidadBarco * mC;
    const tnPC  = p.capacidadBarco - mCTn;
    const mDTn  = tnPC * mD;
    const tnPD  = tnPC - mDTn;
    const tnAc  = tnPD * p.pctAcopio;
    const tnDi  = tnPD * (1 - p.pctAcopio);
    const mATn  = tnAc * mA;
    const tnEnt = tnPD - mATn;

    const pa    = p.arenaFijaPorMes ? p.precioArenaMes[mes] : p.precioArenaOrigen;
    const comb  = ideal.diasNav * 2 * p.consumoNavegando * vlsfo + (tC + tD) * p.consumoPuerto * vlsfo;
    const total = comb + totalD * p.timeCharter + pa * p.capacidadBarco +
                  p.agenciaZarate + p.agenciaBB +
                  p.opexCargaUSDTn * p.capacidadBarco + p.opexDescargaUSDTn * tnPC +
                  p.costoCamionesDirUSDTn * tnDi + p.costoAcopioUSDTn * tnAc +
                  pa * (mCTn + mDTn + mATn);

    results.push(parseFloat((total / tnEnt).toFixed(3)));
  }

  results.sort((a, b) => a - b);
  const pct  = (q) => results[Math.floor(q * n)];
  const mean = results.reduce((a, b) => a + b, 0) / n;
  const std  = Math.sqrt(results.reduce((a, b) => a + (b - mean) ** 2, 0) / n);

  const mn = results[0], mx = results[n - 1];
  const bins = 40, bs = (mx - mn) / bins;
  const hist = Array.from({ length: bins }, (_, i) => ({
    x: parseFloat((mn + i * bs + bs / 2).toFixed(2)), count: 0, pct: 0,
  }));
  results.forEach(v => {
    const bi = Math.min(Math.floor((v - mn) / bs), bins - 1);
    hist[bi].count++;
  });
  hist.forEach(h => h.pct = parseFloat(((h.count / n) * 100).toFixed(2)));

  return {
    hist, n,
    mean:  parseFloat(mean.toFixed(2)),
    std:   parseFloat(std.toFixed(2)),
    p10:   pct(0.10),
    p25:   pct(0.25),
    p50:   pct(0.50),
    p75:   pct(0.75),
    p90:   pct(0.90),
    min: mn, max: mx,
  };
}
