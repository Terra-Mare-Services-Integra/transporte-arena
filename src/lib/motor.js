// ─── CONSTANTES ────────────────────────────────────────────────────────────
export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export const FUENTES = {
  climaZarate: { label:"SMN — Estación San Fernando", url:"https://www.smn.gob.ar/descarga-de-datos" },
  climaBB:     { label:"SMN — Estación Bahía Blanca",  url:"https://www.smn.gob.ar/descarga-de-datos" },
  esperaBB:    { label:"CGPBB — Estadísticas portuarias", url:"https://puertobahiablanca.com" },
  vlsfo:       { label:"Ship & Bunker — Santos VLSFO", url:"https://shipandbunker.com/prices/am/samatl/br-ssz-santos" },
};

// ─── TABLA VELOCIDAD/CONSUMO HANDYSIZE 28.000 Tn ──────────────────────────
// Consumo cargado: a 11kt → 16 T/día base, relación cúbica C ∝ v³
// Lastre = igual que cargado (sin descuento — operan prácticamente igual en consumo)
export const TABLA_VEL_CONSUMO_DEFAULT = [
  { vel:9,  cargado:8.8,  lastre:8.8  },
  { vel:10, cargado:11.9, lastre:11.9 },
  { vel:11, cargado:16.0, lastre:16.0 },
  { vel:12, cargado:20.8, lastre:20.8 },
  { vel:13, cargado:26.5, lastre:26.5 },
  { vel:14, cargado:33.1, lastre:33.1 },
  { vel:15, cargado:40.9, lastre:40.9 },
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
// Fuente: Rotterdam (VLSFO) + spread +$40/MT para 2020–May2023 (estimado, fuente: Ship&Bunker histórico)
// Fuente: Santos VLSFO real (Ship&Bunker via Claude addon) para Jun2023–Jun2026
// Nota: valores son el MÁXIMO del mes, no promedio — conservador para modelado de costos
export const VLSFO_HISTORICO_DEFAULT = [
  // 2020 — Rotterdam + $40 (COVID crash y recuperación)
  {año:2020,mes:0,precio:689},{año:2020,mes:1,precio:590},{año:2020,mes:2,precio:430},
  {año:2020,mes:3,precio:291},{año:2020,mes:4,precio:270},{año:2020,mes:5,precio:310},
  {año:2020,mes:6,precio:360},{año:2020,mes:7,precio:390},{año:2020,mes:8,precio:400},
  {año:2020,mes:9,precio:415},{año:2020,mes:10,precio:430},{año:2020,mes:11,precio:460},
  // 2021 — Rotterdam + $40 (recuperación gradual)
  {año:2021,mes:0,precio:480},{año:2021,mes:1,precio:510},{año:2021,mes:2,precio:530},
  {año:2021,mes:3,precio:560},{año:2021,mes:4,precio:580},{año:2021,mes:5,precio:600},
  {año:2021,mes:6,precio:620},{año:2021,mes:7,precio:640},{año:2021,mes:8,precio:660},
  {año:2021,mes:9,precio:680},{año:2021,mes:10,precio:710},{año:2021,mes:11,precio:740},
  // 2022 — Rotterdam + $40 (guerra Ucrania — pico Jun)
  {año:2022,mes:0,precio:780},{año:2022,mes:1,precio:840},{año:2022,mes:2,precio:960},
  {año:2022,mes:3,precio:1010},{año:2022,mes:4,precio:1040},{año:2022,mes:5,precio:1080},
  {año:2022,mes:6,precio:1020},{año:2022,mes:7,precio:960},{año:2022,mes:8,precio:930},
  {año:2022,mes:9,precio:900},{año:2022,mes:10,precio:870},{año:2022,mes:11,precio:840},
  // 2023 Ene–May — Rotterdam + $40 (normalización post-Ucrania)
  {año:2023,mes:0,precio:810},{año:2023,mes:1,precio:790},{año:2023,mes:2,precio:770},
  {año:2023,mes:3,precio:750},{año:2023,mes:4,precio:730},
  // 2023 Jun en adelante — Santos VLSFO REAL (Ship&Bunker, máximo del mes)
  {año:2023,mes:5,precio:604.5},
  {año:2023,mes:6,precio:627},{año:2023,mes:7,precio:669.5},{año:2023,mes:8,precio:706},
  {año:2023,mes:9,precio:710.5},{año:2023,mes:10,precio:706.5},{año:2023,mes:11,precio:638},
  {año:2024,mes:0,precio:649},{año:2024,mes:1,precio:659.5},{año:2024,mes:2,precio:664.5},
  {año:2024,mes:3,precio:675},{año:2024,mes:4,precio:658.5},{año:2024,mes:5,precio:667},
  {año:2024,mes:6,precio:671},{año:2024,mes:7,precio:643.5},{año:2024,mes:8,precio:635.5},
  {año:2024,mes:9,precio:626.5},{año:2024,mes:10,precio:559.5},{año:2024,mes:11,precio:526},
  {año:2025,mes:0,precio:594.5},{año:2025,mes:1,precio:570},{año:2025,mes:2,precio:563},
  {año:2025,mes:3,precio:545},{año:2025,mes:4,precio:512},{año:2025,mes:5,precio:580},
  {año:2025,mes:6,precio:556.5},{año:2025,mes:7,precio:558.5},{año:2025,mes:8,precio:523.5},
  {año:2025,mes:9,precio:487.5},{año:2025,mes:10,precio:505},{año:2025,mes:11,precio:486},
  {año:2026,mes:0,precio:483},{año:2026,mes:1,precio:515},{año:2026,mes:2,precio:1193},
  {año:2026,mes:3,precio:868},{año:2026,mes:4,precio:880.5},{año:2026,mes:5,precio:808.5},
];

export function calcVLSFOStats(historico) {
  // Solo entradas con precio real (> 0) — evita contaminar promedios con celdas vacías
  const histValido = historico.filter(h => h.precio > 0);
  const precios    = histValido.map(h => h.precio);
  if (precios.length === 0) {
    return { actual:0, prom12m:0, prom5a:0, min5a:0, max5a:0, sigma12m:0,
      pctVsPromedio12m:0, pctVsPromedio5a:0 };
  }
  const avg = arr => arr.length > 0 ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

  // "Últimos N meses con dato" — los precios más recientes del histórico válido
  const ultimos12 = precios.slice(-12);
  const ultimos24 = precios.slice(-24);
  const ultimos60 = precios.slice(-60);

  const prom12m  = avg(ultimos12);
  const prom5a   = avg(ultimos60);
  const actual   = precios[precios.length-1];
  const min5a    = Math.min(...ultimos60);
  const max5a    = Math.max(...ultimos60);
  const sigma12m = ultimos12.length > 1
    ? Math.sqrt(ultimos12.reduce((a,b)=>a+(b-prom12m)**2,0)/ultimos12.length)
    : 0;
  const prom24m  = avg(ultimos24);
  const sigma24m = ultimos24.length > 1
    ? Math.sqrt(ultimos24.reduce((a,b)=>a+(b-prom24m)**2,0)/ultimos24.length)
    : 0;
  const min24m   = Math.min(...ultimos24);
  const max24m   = Math.max(...ultimos24);

  return { actual, prom12m, prom24m, prom5a, min5a, max5a, sigma12m, sigma24m, min24m, max24m,
    pctVsPromedio12m: prom12m > 0 ? ((actual-prom12m)/prom12m*100) : 0,
    pctVsPromedio5a:  prom5a  > 0 ? ((actual-prom5a) /prom5a *100) : 0,
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
// ─── WAYPOINTS NÁUTICOS REALES ─────────────────────────────────────────────
// Ruta Zárate → Sea White — optimizada para bulk carriers y supply vessels
// Fuente: cartas SHN Argentina + análisis operacional AIS
export const WAYPOINTS_RUTA = [
  {id:0,  lat:-32.03, lng:-52.10, nombre:"Rio Grande do Sul (Brasil)",  tipo:"Origen",   operacional:true},
  {id:1,  lat:-34.09, lng:-59.02, nombre:"Zárate (PIAPSA)",             tipo:"Hidrovía", operacional:true},
  {id:2,  lat:-34.30, lng:-58.90, nombre:"Canal Mitre Km 49",        tipo:"Hidrovía", operacional:true},
  {id:3,  lat:-34.45, lng:-58.55, nombre:"Paraná Guazú Sur",         tipo:"Hidrovía", operacional:true},
  {id:4,  lat:-34.78, lng:-57.80, nombre:"Canal Intermedio",         tipo:"Hidrovía", operacional:true},
  {id:5,  lat:-35.02, lng:-56.70, nombre:"El Codillo",               tipo:"Hidrovía", operacional:true},
  {id:6,  lat:-35.03, lng:-55.85, nombre:"Pontón Recalada",          tipo:"Estuario", operacional:true},
  {id:7,  lat:-35.30, lng:-55.60, nombre:"Giro SE",                  tipo:"Estuario", operacional:false},
  {id:8,  lat:-36.00, lng:-56.90, nombre:"Ext. Samborombón",         tipo:"Costero",  operacional:false},
  {id:9,  lat:-36.55, lng:-57.20, nombre:"Frente Mar del Tuyú",      tipo:"Costero",  operacional:false},
  {id:10, lat:-37.10, lng:-57.35, nombre:"Frente Pinamar",           tipo:"Costero",  operacional:false},
  {id:11, lat:-38.10, lng:-57.40, nombre:"Frente Mar del Plata",     tipo:"Costero",  operacional:true},
  {id:12, lat:-38.85, lng:-58.45, nombre:"Frente Necochea",          tipo:"Costero",  operacional:false},
  {id:13, lat:-39.20, lng:-59.20, nombre:"Frente Claromecó",         tipo:"Costero",  operacional:false},
  {id:14, lat:-39.20, lng:-60.10, nombre:"Frente 60°W",              tipo:"Costero",  operacional:false},
  {id:15, lat:-39.05, lng:-61.10, nombre:"Frente Monte Hermoso",     tipo:"Costero",  operacional:false},
  {id:16, lat:-39.00, lng:-61.50, nombre:"Recalada BB",              tipo:"Costero",  operacional:true},
  {id:17, lat:-38.95, lng:-61.90, nombre:"Canal Externo BB",         tipo:"Puerto",   operacional:true},
  {id:18, lat:-38.76, lng:-61.90, nombre:"Puerto Rosales",           tipo:"Puerto",   operacional:true},
  {id:19, lat:-38.75, lng:-62.05, nombre:"Puerto Belgrano",          tipo:"Puerto",   operacional:true},
  {id:20, lat:-38.72, lng:-62.27, nombre:"Sea White",                tipo:"Puerto",   operacional:true},
];

// Haversine — distancia en millas náuticas entre dos puntos
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 3440.065;
  const phi1 = lat1 * Math.PI/180, phi2 = lat2 * Math.PI/180;
  const dphi = (lat2-lat1) * Math.PI/180;
  const dlambda = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dphi/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(dlambda/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Calcula distancia total de un conjunto de waypoints
export function calcDistanciaWaypoints(waypoints) {
  let total = 0;
  for (let i = 0; i < waypoints.length-1; i++) {
    total += haversine(waypoints[i].lat, waypoints[i].lng, waypoints[i+1].lat, waypoints[i+1].lng);
  }
  return total;
}

// Tramos: agrupan waypoints y tienen velocidad editable
// La distancia se calcula automáticamente de los waypoints
// Tramo de reposicionamiento: Rio Grande do Sul → Zárate (en lastre)
export const TRAMOS_REPO_DEFAULT = [
  {id:1, nombre:"Rio Grande do Sul → Zárate", tipo:"Costero", velocidad:12, distancia:369,
   condicion:"Atlántico Sur — costa brasileña/uruguaya/argentina, lastre"},
];

export const TRAMOS_DEFAULT = [
  {id:1, nombre:"Zárate → Confluencia",      tipo:"Hidrovía", velocidad:10,   distancia:173, condicion:"Hidrovía dragada — corriente favorable"},
  {id:2, nombre:"Confluencia → Punta Indio", tipo:"Estuario", velocidad:11,   distancia:20,  condicion:"Estuario — marea variable"},
  {id:3, nombre:"Punta Indio → Rada BB",     tipo:"Costero",  velocidad:12.5, distancia:422, condicion:"Mar abierto — costa bonaerense"},
  {id:4, nombre:"Rada BB → Pto. Rosales",    tipo:"Puerto",   velocidad:8,    distancia:30,  condicion:"Canal principal BB — 98km, práctico"},
  {id:5, nombre:"Pto. Rosales → Sea White",  tipo:"Puerto",   velocidad:7,    distancia:18,  condicion:"Canal interior — ing. White"},
];

// Calcula distancia de un tramo usando sus wpIds
export function calcDistanciaTramo(tramo) {
  const wps = tramo.wpIds.map(id => WAYPOINTS_RUTA.find(w => w.id === id)).filter(Boolean);
  return calcDistanciaWaypoints(wps);
}

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

// ─── TRIPULACIÓN PROPIA (Bare Boat Charter) ───────────────────────────────
// Réplica del Cotizador V22 (Comercial/Arena): pestañas "Sueldos Basicos y Divisas",
// "EVENTUALES", "2. Calculadora Crewing" y "3. Posicion Dia".
// Básico de cada cargo = coeficiente × básico del Jefe de Máquina (escala FENA).
// Pilotaje y CAR tienen básico propio (no siguen la escala).

// Reglas de liquidación por convenio. En EVENTUALES cada bloque de columnas liquida
// distinto; se copian tal cual:
//   cubierta    (cols C–F):  sin feriados, SAC sin francos, cuota sindical 6%
//   maquinas    (cols G–J, y CAR AC–AF): feriados ÷25 dentro del acta, SAC con francos, 4%
//   subalternos (cols K–Y):  feriados ÷30 fuera del acta, SAC con francos, 4%
//   pilotaje    (cols Z–AB): solo básico — sin adicionales, SAC ni estabilidad, 4%
export const CONVENIOS = {
  cubierta:    { label:"Oficiales de cubierta", feriados:false, divFeriados:25, actaConFeriados:true,  sacConFrancos:false, cuotaSindical:0.06 },
  maquinas:    { label:"Oficiales de máquinas", feriados:true,  divFeriados:25, actaConFeriados:true,  sacConFrancos:true,  cuotaSindical:0.04 },
  subalternos: { label:"Subalternos",           feriados:true,  divFeriados:30, actaConFeriados:false, sacConFrancos:true,  cuotaSindical:0.04 },
  pilotaje:    { label:"Pilotaje",              soloBasico:true, cuotaSindical:0.04 },
};

export const ESCALA_SUELDOS_DEFAULT = [
  { cargo:"CAPITAN ULTRAMAR",         coef:1.31428599390423,    convenio:"cubierta" },
  { cargo:"1ER OF CUBIERTA",          coef:0.937143056523019,   convenio:"cubierta" },
  { cargo:"2DO OF CUBIERTA",          coef:0.708571579322283,   convenio:"cubierta" },
  { cargo:"3ER OF CUBIERTA",          coef:0.708571579322283,   convenio:"cubierta" },
  { cargo:"JEFE DE MÁQUINA",          coef:1,                   convenio:"maquinas" },
  { cargo:"1ER OF MÁQUINA",           coef:0.8199999366746293,  convenio:"maquinas" },
  { cargo:"2DO OF MÁQUINA",           coef:0.6200002820857421,  convenio:"maquinas" },
  { cargo:"3ER OF MÁQUINA",           coef:0.6200002820857421,  convenio:"maquinas" },
  { cargo:"ELECTRICISTA",             coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"1ER.BOMBERO",              coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"2DO.BOMBERO",              coef:0.5100000834743522,  convenio:"subalternos" },
  { cargo:"CONTRAMAESTRE",            coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"MARINERO",                 coef:0.42000005181166683, convenio:"subalternos" },
  { cargo:"COCINERO",                 coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"2DO. COCINERO",            coef:0.510000083474352,   convenio:"subalternos" },
  { cargo:"AYUDANTE DE COCINA",       coef:0.42000005181166683, convenio:"subalternos" },
  { cargo:"1ER.MOZO",                 coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"2DO.MOZO",                 coef:0.42000005181166683, convenio:"subalternos" },
  { cargo:"MECÁNICO",                 coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"1ER.CABO",                 coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"ENFERMERO",                coef:0.5500001295291672,  convenio:"subalternos" },
  { cargo:"AUX DE MAQUINA",           coef:0.42000005181166683, convenio:"subalternos" },
  { cargo:"ENGRASADOR",               coef:0.42000005181166683, convenio:"subalternos" },
  { cargo:"CAPITAN PILOTAJE",         basico:1122206*365/12,    convenio:"pilotaje" },
  { cargo:"1ER OF CUBIERTA-PILOTAJE", basico:1047393*365/12,    convenio:"pilotaje" },
  { cargo:"2DO OF CUBIERTA-PILOTAJE", basico:935179*365/12,     convenio:"pilotaje" },
  { cargo:"CAR - Capitan",            basico:1892968.38*0.9*1.15,   convenio:"maquinas" },
  { cargo:"CAR - Jefe de Maquina",    basico:1892968.38*0.9,        convenio:"maquinas" },
  { cargo:"CAR - Contramaestre",      basico:1892968.38*0.9*0.62,   convenio:"maquinas" },
  { cargo:"CAR - Marinero",           basico:1892968.38*0.9*0.5853, convenio:"maquinas" },
];

// Adicionales por posición (fracciones). Ver ayuda de la Calculadora Crewing:
// RJ/Plus Op 84% (140% con faltante, 218,69% escala CAR) · Supply A 0 / B 25% / C 50% ·
// Costa afuera 25% · Acta 42,5% · Régimen de franco 0,8 · Precio del franco 0,95 (capitanes 0,8).
const POS = (cargo, cantidad, rj, supply, precioFranco) =>
  ({ cargo, cantidad, rj, supply, locacion:0.15, acta:0.425, regFranco:0.8, precioFranco, lavanderia:false });
export const DOTACION_DEFAULT = [
  POS("CAPITAN ULTRAMAR",   1, 0.84, 0.07, 0.8),
  POS("1ER OF CUBIERTA",    1, 1.4,  0.07, 0.8),
  POS("2DO OF CUBIERTA",    1, 1.4,  0.07, 0.8),
  POS("JEFE DE MÁQUINA",    1, 0.84, 0,    0.95),
  POS("1ER OF MÁQUINA",     1, 0.84, 0,    0.95),
  POS("2DO OF MÁQUINA",     1, 0.84, 0,    0.95),
  POS("CONTRAMAESTRE",      1, 0.84, 0,    0.95),
  POS("1ER.CABO",           1, 0.84, 0,    0.95),
  POS("ENGRASADOR",         2, 0.84, 0,    0.95),
  POS("COCINERO",           1, 0.84, 0,    0.95),
  POS("1ER.MOZO",           1, 0.84, 0,    0.95),
  POS("MARINERO",           5, 0.84, 0,    0.95),
  POS("AYUDANTE DE COCINA", 1, 0.84, 0,    0.95),
].map((r, i) => ({ id:`pos_${i+1}`, ...r }));

// Costos fijos del barco en BBC (pestaña "Proyecto" del cotizador)
// unidad: "dia" = USD/día | "anio" = USD/año (se prorratea por bbc_diasAnio)
export const BBC_ITEMS_DEFAULT = [
  { id:"bbc_mant",    label:"Mantenimiento / consumibles",        valor:1000,   unidad:"dia",  activo:true },
  { id:"bbc_dique",   label:"Provisión dique seco / mant. mayor", valor:200000, unidad:"anio", activo:true },
  { id:"bbc_com",     label:"Comunicaciones / aceite / agua / slop", valor:500, unidad:"dia",  activo:true },
  { id:"bbc_viveres", label:"Víveres / ropa / viajes",            valor:200,    unidad:"dia",  activo:true },
  { id:"bbc_seguro",  label:"Seguro",                             valor:100000, unidad:"anio", activo:true },
  { id:"bbc_otros",   label:"Otros",                              valor:100000, unidad:"anio", activo:true },
  { id:"bbc_admin",   label:"Administración anual",               valor:450000, unidad:"anio", activo:true },
];

// ─── ALCANCE DEL PROYECTO ──────────────────────────────────────────────────
// Qué bloques de costo son responsabilidad nuestra. Un bloque fuera de alcance se
// oculta y su costo no suma; los días (carga, navegación, descarga) se siguen
// calculando porque el barco los paga igual.
export const ALCANCE_BLOQUES = [
  { id:"barco",           label:"Barco",                         fijo:true,   desc:"Costo diario del barco por todos los días del ciclo, incluida la vuelta en lastre entre viajes." },
  { id:"tripulacion",     label:"Tripulación propia",            soloBBC:true, fijo:true, desc:"Se incluye siempre en Bare Boat Charter, dentro del costo diario del barco." },
  { id:"movilizacion",    label:"Movilización, adecuación y desmovilización", soloBBC:true, desc:"Costos únicos del contrato: movilización y adecuación al inicio, desmovilización al final." },
  { id:"combustible",     label:"Combustible",                   desc:"VLSFO navegando y en puerto." },
  { id:"repo",            label:"Viaje a puerto de carga",       desc:"Reposicionamiento inicial en lastre: días, combustible, limpieza de bodega y waiver." },
  { id:"agenciaCarga",    label:"Agencia puerto de carga",       desc:"Peajes, prácticos, muellaje y servicios en Zárate." },
  { id:"agenciaDescarga", label:"Agencia puerto de descarga",    desc:"Prácticos, remolques, canal y servicios en Bahía Blanca." },
  { id:"arena",           label:"Compra de arena y mermas",      desc:"Arena en origen y valor de las mermas de carga, descarga y acopio." },
  { id:"operacion",       label:"Operación portuaria",           desc:"OPEX por tonelada de carga y descarga." },
  { id:"logistica",       label:"Logística terrestre",           desc:"Camiones directos, calesitas, acopio y flete a Neuquén." },
];
// Pestañas que dependen de un bloque: se ocultan si el bloque está fuera de alcance
export const TABS_POR_BLOQUE = { combustible:["cb"], repo:["repo"], agenciaCarga:["az"], agenciaDescarga:["abb"] };
export const ALCANCE_COMPLETO = Object.fromEntries(ALCANCE_BLOQUES.map(b => [b.id, true]));
export const ALCANCE_SOLO_BARCO = { ...ALCANCE_COMPLETO, agenciaCarga:false, agenciaDescarga:false, arena:false, operacion:false, logistica:false };
// 1 si el bloque está en alcance, 0 si no (escenarios viejos sin alcance = proyecto completo)
export const inc = (p, id) => (p.alcance?.[id] === false ? 0 : 1);

// ─── DEFAULT PARAMS ────────────────────────────────────────────────────────
export const DEFAULT_PARAMS = {
  // ALCANCE — bloques de costo a cargo nuestro
  alcance:                   ALCANCE_COMPLETO,

  // IDENTIFICACIÓN DEL PROYECTO
  proyecto_titulo:           "Transporte Arena",

  // MODALIDAD DEL BARCO
  // "tc"  = barco con waiver y daily hire (time charter, tripulación del armador)
  // "bbc" = bare boat charter: administramos barco y tripulación, sin waiver
  barco_modalidad:           "tc",

  // CONTRATO BARCO
  barco_timeCharter:         20000,  // USD/día — centralizado acá
  barco_tripulacion:         0,      // USD/día — por ahora 0
  barco_limpiezaBodega:      15000,  // USD por escala
  barco_importacionWaiver:   8000,   // USD por escala
  barco_diasWaiver:          30,     // días de vigencia del waiver de importación
  barco_miscPorDia:          500,    // USD/día — misceláneos operativos
  barco_tablaVelConsumo:     TABLA_VEL_CONSUMO_DEFAULT,
  barco_consumoPuerto:       4.6,    // T/día en puerto (carga y descarga)

  // BARE BOAT CHARTER — costo diario del barco a casco desnudo
  bbc_hire:                  12000,  // USD/día — alquiler a casco desnudo
  bbc_items:                 BBC_ITEMS_DEFAULT,
  bbc_diasAnio:              365,    // días para prorratear los costos anuales
  bbc_pctImprevistos:        0.10,   // sobre el subtotal diario
  bbc_pctImpVentas:          0.025,  // sobre subtotal + imprevistos
  bbc_pctImpTransf:          0.008,  // sobre subtotal + imprevistos
  bbc_diasPeriodo:           1095,   // duración del contrato (3 años): define los viajes del análisis multi-viaje
  bbc_movilizacion:          300000, // USD, al inicio del contrato
  bbc_adecuacion:            500000, // USD, al inicio del contrato
  bbc_desmovilizacion:       200000, // USD, al final del contrato

  // TRIPULACIÓN PROPIA — liquidación tipo EVENTUALES, contrato a tercero
  crew_fx:                   1550,   // ARS/USD
  crew_managementFee:        500,    // USD/día — fijo en USD
  crew_basicoJM:             4855635.21420186, // ARS/mes — básico Jefe de Máquina
  crew_escalaVigencia:       "Septiembre 2026",
  crew_escala:               ESCALA_SUELDOS_DEFAULT,
  crew_dotacion:             DOTACION_DEFAULT,
  crew_contratoTercero:      true,   // si true aplica Ingresos Brutos e Imp. Créd/Déb
  crew_decreto633:           false,  // Decreto 633/2018 (+2%)
  crew_art:                  0.03,   // prima ART
  crew_antiguedad:           0,      // años promedio
  crew_vacaciones:           24,     // días de vacaciones promedio
  crew_feriados:             20,     // feriados al año (entran en los francos)
  crew_diasMes:              30,
  crew_divisorVac:           25,
  crew_cargasSociales:       0.24,
  crew_estabilidad:          0.0833, // estabilidad laboral / previsión por despido
  crew_seguroVida:           335,    // ARS/mes por persona
  crew_ffep:                 1521,   // ARS/mes — fondo fiduciario enf. profesionales
  crew_iibb:                 0.05,
  crew_impCredDeb:           0.012,
  crew_lavanderiaUSD:        500,    // USD/mes por persona con tarea programada

  // VIAJE A PUERTO DE CARGA (reposicionamiento Rio Grande → Zárate)
  repo_tramos:               TRAMOS_REPO_DEFAULT,
  repo_itemsExtra:           [],  // items adicionales editables por el usuario

  // VUELTA EN LASTRE (BB → Zárate, entre viajes consecutivos)
  vta_tramos: [
    {id:1, nombre:"Sea White → Punta Indio", tipo:"Costero",  velocidad:12.5, distancia:470, condicion:"Mar abierto — costa bonaerense, lastre"},
    {id:2, nombre:"Punta Indio → Zárate",    tipo:"Hidrovía", velocidad:10,   distancia:193, condicion:"Estuario + Hidrovía — lastre"},
  ],

  // ETAPA 1 — CARGA
  cap_capacidadBarco:        28000,
  cap_densidadArena:         1.45,
  cap_grampada:              15,
  cap_gruas:                 2,
  cap_movGrampa:             0.5,
  cap_horasDia:              12,
  cap_esperaDias:            0.5,
  cap_agenciaZarate:         83948,  // calculado desde items abajo

  // ─── AGENCIA ZÁRATE (PIAPSA / CAMPANA) ───────────────────────────────────
  // tipo: "fijo" = USD fijo por escala | "diario" = USD/día × tReal_dias_carga
  agz_items: [
    { id:"agz_01", label:"Hidrovía Waterway Tolls (RECA→ZTE)", tipo:"fijo",    usd:28700, activo:true,  nota:"Ida: RECA-ZTE",   categoria:"Canal Dues" },
    { id:"agz_02", label:"Hidrovía Waterway Tolls (ZTE→RECA)", tipo:"fijo",    usd:28700, activo:true,  nota:"Vuelta: ZTE-RECA", categoria:"Canal Dues" },
    { id:"agz_03", label:"Port Pilots (IN/OUT)",                tipo:"fijo",    usd:8750,  activo:true,  nota:"Prácticos entrada/salida", categoria:"Pilotaje" },
    { id:"agz_04", label:"Wharfage",                           tipo:"diario",  usd:4455,  activo:true,  nota:"USD 0.33×NRT×día (NRT≈13.500)", categoria:"Muellaje" },
    { id:"agz_05", label:"Entrance Dues / Nav. Waters Tax",     tipo:"fijo",    usd:392,   activo:true,  nota:"" },
    { id:"agz_06", label:"Free Pratique expenses",              tipo:"fijo",    usd:550,   activo:true,  nota:"" },
    { id:"agz_07", label:"Migrations Taxes",                    tipo:"fijo",    usd:2500,  activo:true,  nota:"IN+OUT" },
    { id:"agz_08", label:"SENASA tax",                          tipo:"fijo",    usd:50,    activo:true,  nota:"" },
    { id:"agz_09", label:"Customs (Clearance)",                 tipo:"fijo",    usd:290,   activo:true,  nota:"" },
    { id:"agz_10", label:"Customs O/T Week Days",               tipo:"fijo",    usd:1120,  activo:false, nota:"Solo si opera 19-07hs" },
    { id:"agz_11", label:"Customs O/T Saturdays",               tipo:"fijo",    usd:2370,  activo:false, nota:"Solo sábados 24hs" },
    { id:"agz_12", label:"Customs O/T Sundays",                 tipo:"fijo",    usd:2715,  activo:false, nota:"Solo domingos 24hs" },
    { id:"agz_13", label:"Authorities Transportation",          tipo:"fijo",    usd:175,   activo:true,  nota:"" },
    { id:"agz_14", label:"Watchmen services",                   tipo:"diario",  usd:460,   activo:true,  nota:"USD 460/turno × turnos (4 turnos/día ~ USD 1840/día)", categoria:"Servicios" },
    { id:"agz_15", label:"Head Tally Clerk",                    tipo:"diario",  usd:568,   activo:true,  nota:"USD 568/turno × turnos (4 turnos/día ~ USD 2275/día)", categoria:"Servicios" },
    { id:"agz_16", label:"Linemen services",                    tipo:"fijo",    usd:3200,  activo:true,  nota:"Normal time. Extra si nocturno/OT" },
    { id:"agz_17", label:"CN Charge (Full Agents)",              tipo:"fijo",    usd:130,   activo:true,  nota:"" },
    { id:"agz_18", label:"Lumpsum (Agency expenses)",           tipo:"fijo",    usd:350,   activo:true,  nota:"" },
    { id:"agz_19", label:"Bank Charges/Commissions",            tipo:"fijo",    usd:1174,  activo:true,  nota:"~1.2% del total" },
    { id:"agz_20", label:"Agency Fee",                          tipo:"fijo",    usd:2500,  activo:true,  nota:"",               categoria:"Honorarios" },
    { id:"agz_21", label:"ISPS charge",                         tipo:"fijo",    usd:0,     activo:false, nota:"Consultar terminal" },
    { id:"agz_22", label:"Oil boom",                            tipo:"fijo",    usd:0,     activo:false, nota:"Si aplica" },
    { id:"agz_23", label:"Río de la Plata Pilotage",            tipo:"fijo",    usd:0,     activo:false, nota:"Solo si requiere" },
    { id:"agz_24", label:"Paraná River Pilotage",               tipo:"fijo",    usd:0,     activo:false, nota:"Solo si requiere" },
    { id:"agz_25", label:"Tugboats",                            tipo:"fijo",    usd:0,     activo:false, nota:"Consultar" },
  ],
  agz_redondearDias: false,  // si true → Math.ceil(tReal_dias)
  cap_inopLluvia:            20,
  cap_inopViento:            35,
  cap_pctMerma:              0.02,
  cap_opexUSDTn:             1,
  cap_precioArenaOrigen:     13.5,
  cap_arenaFijaPorMes:       false,
  cap_precioArenaMes:        Array(12).fill(13.5),

  // ETAPA 2 — NAVEGACIÓN IDA
  nav_tramos:                TRAMOS_DEFAULT,
  nav_escenarioVLSFO:        "prom12",
  nav_vlsfoManual:           990,

  // ETAPA 3 — DESCARGA
  des_grampada:              15,    // m³ por grampa
  des_gruas:                 2,     // número de grúas/tolvas
  des_movGrampa:             0.5,   // mov/min por grúa
  des_horasDia:              14,
  des_esperaBBMes:           [3.2,2.8,2.1,1.9,1.5,1.2,0.9,1.1,1.4,2.0,2.5,3.0],
  des_esperaZarateDias:      0.5,   // espera vuelta a Zárate — acá en descarga
  des_agenciaBB:             106204,  // calculado desde items abajo

  // ─── TOLVA ───────────────────────────────────────────────────────────────
  des_tolva_vol_m3:          60,    // volumen de cada tolva [m³]
  des_t_posicion_min:        3,     // tiempo posicionamiento camión bajo tolva [min]
  des_t_caida_min:           4,     // tiempo vaciado tolva → camión por gravedad [min]
  des_t_cierre_min:          1,     // tiempo cierre compuerta [min]

  // ─── CAMIONES DIRECTOS (NEUQUÉN) ─────────────────────────────────────────
  des_camDir_cantidad:       20,    // total de camiones directos disponibles
  des_camDir_volM3:          30,    // volumen por camión [m³]
  des_costoCamionesDirUSDTn:  37.14, // USD/Tn flete BB → Neuquén (directos)
  des_costoFleteAcopioUSDTn: 37.14, // USD/Tn flete depósito → Neuquén (segunda etapa calesitas)

  // ─── CAMIONES CALESITA (DEPÓSITO LOCAL) ──────────────────────────────────
  des_camAco_cantidad:       6,     // total de calesitas disponibles
  des_camAco_volM3:          30,    // volumen por camión [m³]
  des_camAco_distKm:         15,    // distancia tolva → depósito [km, solo ida]
  des_camAco_velKmh:         60,    // velocidad del camión [km/h]
  des_tDescargaAcoMin:       10,    // tiempo descarga en depósito [min]
  des_camAco_costoKmTon:     0.08,  // USD/(Tn·km) ida+vuelta — usado si costoUSDTn no está seteado
  des_camAco_costoUSDTn:     null,  // USD/Tn directo (override); null = calcular desde km
  des_alquilerPredioUSDTn:   0,     // USD/Tn almacenada en predio

  // ─── AGENCIA BAHÍA BLANCA (ARGELAN) ──────────────────────────────────────
  // tipo: "fijo" = USD fijo por escala | "diario" = USD/día × tReal_dias_descarga
  abb_items: [
    { id:"abb_01", label:"Pilotage (IN/OUT)", categoria:"Pilotaje",                   tipo:"fijo",    usd:22308, activo:true,  nota:"Prácticos IN+OUT" },
    { id:"abb_02", label:"Towage (remolques obligatorios)", categoria:"Remolques",      tipo:"fijo",    usd:56000, activo:true,  nota:"IN+OUT obligatorio" },
    { id:"abb_03", label:"Wharfage dues", categoria:"Muellaje",                       tipo:"diario",  usd:9948,  activo:true,  nota:"USD 9.948/día" },
    { id:"abb_04", label:"Canal dues (IN/OUT)", categoria:"Canal Dues",                  tipo:"fijo",    usd:100913,activo:true,  nota:"Peaje canal de acceso" },
    { id:"abb_05", label:"Mooring / Unmooring",                 tipo:"fijo",    usd:4500,  activo:true,  nota:"" },
    { id:"abb_06", label:"Tally", categoria:"Servicios",                               tipo:"fijo",    usd:14111, activo:true,  nota:"" },
    { id:"abb_07", label:"Customs overtime",                    tipo:"fijo",    usd:0,     activo:false, nota:"USD 200/turno 6hs — obligatorio si opera" },
    { id:"abb_08", label:"Migration dues",                      tipo:"fijo",    usd:1250,  activo:true,  nota:"Servicio de salida" },
    { id:"abb_09", label:"SENASA inspection",                   tipo:"fijo",    usd:150,   activo:true,  nota:"" },
    { id:"abb_10", label:"Sistema Mercuria",                    tipo:"fijo",    usd:200,   activo:true,  nota:"" },
    { id:"abb_11", label:"Transportation (traslado autoridades)",tipo:"fijo",   usd:350,   activo:true,  nota:"" },
    { id:"abb_12", label:"Watchmen (recomendado)",              tipo:"fijo",    usd:0,     activo:false, nota:"USD 24.298 aprox. — no obligatorio" },
    { id:"abb_13", label:"ISPS charges",                        tipo:"fijo",    usd:300,   activo:true,  nota:"" },
    { id:"abb_14", label:"Local taxes (Ley 25413 + gastos bancarios)", tipo:"fijo", usd:3098, activo:true, nota:"" },
    { id:"abb_15", label:"Agency fee",                          tipo:"fijo",    usd:3500,  activo:true,  nota:"" },
  ],
  abb_redondearDias: false,  // si true → Math.ceil(tReal_dias)
  des_inopLluvia:            20,
  des_inopViento:            35,
  des_pctMermaDescarga:      0.015,
  des_pctMermaAcopio:        0.01,
  des_opexUSDTn:             8,

  // BASE DE DATOS
  clima_zarate:              CLIMA_DB_DEFAULT.zarate,
  clima_bb:                  CLIMA_DB_DEFAULT.bb,
  vlsfo_historico:           VLSFO_HISTORICO_DEFAULT,

  // MONTE CARLO — control de variables estocásticas
  mc_vars: [
    { id:"vlsfo",   label:"Precio VLSFO",     activa:true,  sigma:null,  unit:"USD/T",  nota:"Bootstrap histórico — sorteo directo de los últimos 24 meses reales (Ship&Bunker Santos)" },
    { id:"tc",      label:"Time Charter",      activa:true,  sigma:1500,  unit:"USD/d",  nota:"Volatilidad del mercado spot de fletamento" },
    { id:"velFact", label:"Factor velocidad",  activa:true,  sigma:0.08,  unit:"factor", nota:"Relativo sobre velocidad de todos los tramos (corrientes, estado del casco)" },
    { id:"espBB",   label:"Espera en BB",      activa:true,  sigma:0.6,   unit:"dias",   nota:"Variabilidad alrededor de la espera media mensual configurada" },
    { id:"espZ",    label:"Espera en Zarate",  activa:true,  sigma:0.2,   unit:"dias",   nota:"Variabilidad de la espera configurada en Etapa Carga" },
    { id:"espCarga",label:"Espera en carga",   activa:false, sigma:0.2,   unit:"dias",   nota:"Espera en el puerto de carga (Etapa Carga). Arranca fija para no cambiar corridas viejas" },
    { id:"mCarga",  label:"Merma carga",       activa:true,  sigma:0.005, unit:"frac.",  nota:"Equivale a variabilidad alrededor del % configurado" },
    { id:"mDesc",   label:"Merma descarga",    activa:true,  sigma:0.004, unit:"frac.",  nota:"Variabilidad alrededor del % configurado" },
    { id:"mAcopio", label:"Merma acopio",      activa:true,  sigma:0.003, unit:"frac.",  nota:"Variabilidad alrededor del % configurado" },
    { id:"inop",    label:"Inop. climatica",   activa:true,  sigma:0.20,  unit:"factor", nota:"sigma% multiplicado por pBase calculado del clima" },
  ],
};

// ─── HELPERS AGENCIA ───────────────────────────────────────────────────────
export function calcAgenciaZarate(p, tReal_dias) {
  const dias = p.agz_redondearDias ? Math.ceil(tReal_dias) : tReal_dias;
  return (p.agz_items||[]).reduce((sum, item) => {
    if (!item.activo) return sum;
    return sum + (item.tipo === "diario" ? item.usd * dias : item.usd);
  }, 0);
}
export function calcAgenciaBB(p, tReal_dias) {
  const dias = p.abb_redondearDias ? Math.ceil(tReal_dias) : tReal_dias;
  return (p.abb_items||[]).reduce((sum, item) => {
    if (!item.activo) return sum;
    return sum + (item.tipo === "diario" ? item.usd * dias : item.usd);
  }, 0);
}
// Precio equivalente de la arena en descarga = costo total hasta llegada / tn entregadas
export function precioArenaEquivalenteDescarga(p) {
  const e1 = calcEtapa1(p);
  const e2 = calcEtapa2(p);
  const costoHastaLlegada = e1.costoTotal + e2.costoTotal;
  return e1.tnPostCarga > 0 ? costoHastaLlegada / e1.tnPostCarga : 0;
}

// ─── TRIPULACIÓN PROPIA: LIQUIDACIÓN POR POSICIÓN ─────────────────────────
export function basicoCargo(p, cargo) {
  const e = (p.crew_escala || ESCALA_SUELDOS_DEFAULT).find(x => x.cargo === cargo);
  if (!e) return { basico:0, convenio:"subalternos" };
  return { basico: e.coef != null ? e.coef * p.crew_basicoJM : (e.basico || 0), convenio: e.convenio || "subalternos" };
}

function pctAntiguedad(anios) {
  if (anios <= 0) return 0;
  if (anios <= 5) return 0.01;
  if (anios <= 9) return 0.015;
  return 0.02;
}

// Costo mensual (ARS) de una persona en la posición, días navegados.
// Réplica de EVENTUALES filas 34–56 + lavandería de la Calculadora Crewing.
export function calcLiquidacion(p, pos) {
  const { basico:B, convenio } = basicoCargo(p, pos.cargo);
  const cv = CONVENIOS[convenio] || CONVENIOS.subalternos;
  const diasMes = p.crew_diasMes || 30;
  // Pilotaje: solo el básico, sin adicionales, vacaciones, francos, SAC ni estabilidad
  const k = cv.soloBasico ? 0 : 1;
  const conformado = B * (1+pos.rj) * (1+pos.supply) * (1+pos.locacion);
  const rj        = k * pos.rj * B;
  const supply    = k * pos.supply * (B + rj);
  const locacion  = k * pos.locacion * (B + rj + supply);
  const feriados  = cv.feriados ? conformado / cv.divFeriados * p.crew_feriados / 12 : 0;
  const acta      = k * pos.acta * (B + rj + supply + locacion + (cv.actaConFeriados ? feriados : 0));
  const antiguedad= k * (B + rj) * p.crew_antiguedad * pctAntiguedad(p.crew_antiguedad);
  const bruto     = B + rj + supply + locacion + feriados + acta + antiguedad;
  const licAnual  = k * conformado / p.crew_divisorVac * p.crew_vacaciones / 12;
  const diasFranco= diasMes + p.crew_feriados / 12;
  const francos   = k * conformado / diasMes * diasFranco * pos.precioFranco * pos.regFranco;
  const sac       = k * (bruto + licAnual + (cv.sacConFrancos ? francos : 0)) / 12;
  const preEstab  = bruto + licAnual + francos + sac;
  const estabilidad = k * p.crew_estabilidad * preEstab;
  const salarioFinal= preEstab + estabilidad;
  const cargas    = (salarioFinal - licAnual - francos) * (p.crew_cargasSociales + p.crew_art)
                  + p.crew_seguroVida + p.crew_ffep;
  const sindical  = (bruto + sac) * cv.cuotaSindical;
  const decreto633= salarioFinal * (p.crew_decreto633 ? 0.02 : 0);
  const costoBruto= salarioFinal + cargas + sindical + decreto633;
  const iibb      = costoBruto * (p.crew_contratoTercero ? p.crew_iibb : 0);
  const credDeb   = costoBruto * (p.crew_contratoTercero ? p.crew_impCredDeb : 0);
  const lavanderia= pos.lavanderia ? p.crew_lavanderiaUSD * p.crew_fx : 0;
  const mensual   = costoBruto + iibb + credDeb + lavanderia;
  return {
    convenio, basico:B, conformado, rj, supply, locacion, feriados, acta, antiguedad, bruto,
    licAnual, francos, sac, preEstab, estabilidad, salarioFinal,
    cargas, sindical, decreto633, costoBruto, iibb, credDeb, lavanderia,
    mensual, diarioARS: mensual / diasMes, diarioUSD: mensual / diasMes / p.crew_fx,
  };
}

// "Posición por día": costo diario de toda la dotación + management fee
export function calcTripulacion(p) {
  const filas = (p.crew_dotacion || []).map(pos => {
    const liq = calcLiquidacion(p, pos);
    return { ...pos, liq, usdDia: liq.diarioUSD * pos.cantidad };
  });
  const personas  = filas.reduce((s, f) => s + f.cantidad, 0);
  const crewUSDDia= filas.reduce((s, f) => s + f.usdDia, 0);
  const total     = crewUSDDia + (p.crew_managementFee || 0);
  return { filas, personas, crewUSDDia, managementFee: p.crew_managementFee || 0, total };
}

// ─── COSTO DIARIO DEL BARCO (según modalidad) ─────────────────────────────
export const esBBC = p => p.barco_modalidad === "bbc";
// Variable de alquiler que se sortea en Monte Carlo y se mueve en sensibilidades
export const hireKey = p => esBBC(p) ? "bbc_hire" : "barco_timeCharter";
export const hireLabel = p => esBBC(p) ? "Bare Boat hire" : "Time Charter";

export function costoDiarioBarco(p) {
  const fmt = v => `$${Math.round(v).toLocaleString("es-AR")}`;
  if (!esBBC(p)) {
    const hire = p.barco_timeCharter, trip = p.barco_tripulacion, misc = p.barco_miscPorDia || 0;
    const total = hire + trip + misc;
    return {
      modalidad:"tc", total, hire, tripulacion:trip, misc, factorHire:1,
      resumen:`TC: $${hire}/d + Trip: $${trip}/d + Misc: $${misc}/d = $${total}/d`,
    };
  }
  const crew = calcTripulacion(p);
  const diasAnio = p.bbc_diasAnio || 365;
  const items = (p.bbc_items || []).filter(i => i.activo !== false)
    .map(i => ({ ...i, usdDia: i.unidad === "anio" ? i.valor / diasAnio : i.valor }));
  const fijos = items.reduce((s, i) => s + i.usdDia, 0);
  const subtotal = p.bbc_hire + crew.total + fijos;
  const imprevistos = subtotal * (p.bbc_pctImprevistos || 0);
  const pctImp = (p.bbc_pctImpVentas || 0) + (p.bbc_pctImpTransf || 0);
  const impuestos = (subtotal + imprevistos) * pctImp;
  const total = subtotal + imprevistos + impuestos;
  return {
    modalidad:"bbc", total, hire:p.bbc_hire, tripulacion:crew.total, misc:0,
    crew, items, fijos, subtotal, imprevistos, impuestos,
    // Cuánto sube el total por cada USD de hire (los recargos son porcentuales)
    factorHire:(1 + (p.bbc_pctImprevistos || 0)) * (1 + pctImp),
    resumen:`BBC ${fmt(p.bbc_hire)} + Trip ${fmt(crew.total)} + Fijos ${fmt(fijos)} + Recargos ${fmt(imprevistos+impuestos)} = ${fmt(total)}/d`,
  };
}

// Días del análisis multi-viaje: vigencia del waiver (TC) o período elegido (BBC)
export const diasPeriodoMultiViaje = p => esBBC(p) ? (p.bbc_diasPeriodo || 30) : (p.barco_diasWaiver || 30);
// Costos únicos del contrato BBC: inicio (movilización + adecuación) y fin (desmovilización)
export function costoMovilizacion(p) {
  const k = esBBC(p) ? inc(p,"movilizacion") : 0;
  const inicio = ((p.bbc_movilizacion || 0) + (p.bbc_adecuacion || 0)) * k;
  const fin    = (p.bbc_desmovilizacion || 0) * k;
  return { inicio, fin, total: inicio + fin };
}
// En BBC no hay importación temporal ni waiver
export const costoWaiver = p => esBBC(p) ? 0 : (p.barco_importacionWaiver || 0);

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

// Promedia los 12 meses del climaDB en un único registro anual
export function getClimaAnual(climaDB) {
  const n = climaDB.length || 1;
  return {
    lluviaProm:  climaDB.reduce((s,d)=>s+d.lluviaProm, 0)  / n,
    lluviaSigma: climaDB.reduce((s,d)=>s+d.lluviaSigma, 0) / n,
    vientoProm:  climaDB.reduce((s,d)=>s+d.vientoProm, 0)  / n,
    vientoSigma: climaDB.reduce((s,d)=>s+d.vientoSigma, 0) / n,
  };
}

// getInopDetalle ahora trabaja sobre el promedio anual — sin mesIdx
export function getInopDetalle(climaDB, umbralLluvia, umbralViento) {
  const d = getClimaAnual(climaDB);
  const pL=probSuperaUmbral(d.lluviaProm,d.lluviaSigma,umbralLluvia);
  const pV=probSuperaUmbral(d.vientoProm,d.vientoSigma,umbralViento);
  return {pL,pV,pInop:Math.min(pL+pV-pL*pV,0.95),
    lluviaProm:d.lluviaProm,lluviaSigma:d.lluviaSigma,
    vientoProm:d.vientoProm,vientoSigma:d.vientoSigma,
    umbralLluvia,umbralViento};
}

export function velPromedioPonderada(tramos) {
  // Prioridad: distancia manual del usuario (>0) → wpIds Haversine → 0
  const tramosConDist = tramos.map(t => ({
    ...t,
    distanciaCalc: (t.distancia > 0) ? t.distancia : (t.wpIds ? calcDistanciaTramo(t) : 0),
  }));
  const totalMn  = tramosConDist.reduce((a,t)=>a+t.distanciaCalc, 0);
  const totalHrs = tramosConDist.reduce((a,t)=>a+t.distanciaCalc/t.velocidad, 0);
  return {velProm:totalMn/totalHrs, totalMn:parseFloat(totalMn.toFixed(1)), totalHrs, diasNav:totalHrs/24, tramosConDist};
}

export function checkEspejo(p) {
  return (CAMPOS_ESPEJO||[]).map(c=>({label:c.label,valCap:p[c.cap],valDes:p[c.des],difiere:p[c.cap]!==p[c.des]}));
}

// ─── ETAPA 1: CARGA ────────────────────────────────────────────────────────
export function calcEtapa1(p) {
  const vlsfo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const cd=costoDiarioBarco(p); const tc=cd.total;

  const velIdeal_TnMin=p.cap_gruas*p.cap_grampada*p.cap_densidadArena*p.cap_movGrampa;
  const velIdeal_TnHr =velIdeal_TnMin*60;
  const tIdeal_hr     =p.cap_capacidadBarco/velIdeal_TnHr;
  const tIdeal_dias   =tIdeal_hr/p.cap_horasDia;

  const inopDet =getInopDetalle(p.clima_zarate,p.cap_inopLluvia,p.cap_inopViento);
  const pInop   =inopDet.pInop;
  const diasInop=tIdeal_dias*pInop/Math.max(0.01,1-pInop);
  const tReal_dias=tIdeal_dias+diasInop+p.cap_esperaDias;

  const mermaTn    =p.cap_capacidadBarco*p.cap_pctMerma;
  const tnPostCarga=p.cap_capacidadBarco;
  const precioArena=p.cap_precioArenaOrigen;

  const costoArena =precioArena*p.cap_capacidadBarco*inc(p,"arena");
  const costoMerma =precioArena*mermaTn*inc(p,"arena");
  const costoOpex  =p.cap_opexUSDTn*p.cap_capacidadBarco*inc(p,"operacion");
  const combPuerto =tReal_dias*p.barco_consumoPuerto*vlsfo*inc(p,"combustible");
  const fleteEtapa =tReal_dias*tc;
  const agencia    =calcAgenciaZarate(p, tReal_dias)*inc(p,"agenciaCarga");
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
    hoverMerma:`Merma carga (bruta): ${p.cap_capacidadBarco.toLocaleString()}Tn × ${(p.cap_pctMerma*100).toFixed(1)}% = ${mermaTn.toFixed(0)}Tn extra desde origen. Barco zarpa con ${p.cap_capacidadBarco.toLocaleString()}Tn.`,
    hoverComb:[
      `Escenario VLSFO: ${VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label}`,
      `Precio: $${vlsfo}/T | Hoy: $${vlsfoStats.actual} | Prom12M: $${vlsfoStats.prom12m.toFixed(0)}`,
      `Posición: ${vlsfoStats.pctVsPromedio12m>0?"+":""}${vlsfoStats.pctVsPromedio12m.toFixed(1)}% vs prom 12M`,
      `${tReal_dias.toFixed(1)}d × ${p.barco_consumoPuerto}T/d × $${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTC:[
      cd.resumen,
      `${tReal_dias.toFixed(1)}d × $${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Arena: $${precioArena}×${p.cap_capacidadBarco.toLocaleString()}Tn = $${costoArena.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Merma: $${precioArena}×${mermaTn.toFixed(0)}Tn = $${costoMerma.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Opex: $${p.cap_opexUSDTn}/Tn×${p.cap_capacidadBarco.toLocaleString()}Tn = $${costoOpex.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Comb. puerto: ${tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Barco: ${tReal_dias.toFixed(1)}d×$${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Agencia Zárate: $${agencia.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 2: NAVEGACIÓN IDA ───────────────────────────────────────────────
export function calcEtapa2(p) {
  const vlsfo=getPrecioVLSFO(p.nav_escenarioVLSFO,p.nav_vlsfoManual,p.vlsfo_historico);
  const vlsfoStats=calcVLSFOStats(p.vlsfo_historico);
  const cd=costoDiarioBarco(p); const tc=cd.total;
  const nav=velPromedioPonderada(p.nav_tramos);

  // Consumo interpolado por tramo — prioridad: distancia manual (>0) → wpIds Haversine → 0
  const combNavTotal = p.nav_tramos.reduce((acc,t)=>{
    const dist = (t.distancia > 0) ? t.distancia : (t.wpIds ? calcDistanciaTramo(t) : 0);
    const hs = dist/t.velocidad;
    const consumoDia = interpolarConsumo(p.barco_tablaVelConsumo, t.velocidad, "cargado");
    return acc + (hs/24)*consumoDia;
  }, 0);
  const combNav  = combNavTotal*vlsfo*inc(p,"combustible");
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
      cd.resumen,
      `${nav.diasNav.toFixed(1)}d × $${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Comb. ida: ${combNavTotal.toFixed(1)}T×$${vlsfo} = $${combNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Barco: ${nav.diasNav.toFixed(1)}d×$${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── SCHEDULER DE DESCARGA ────────────────────────────────────────────────
// Modela el sistema tolva/compuerta con camiones directos (Neuquén) y calesitas
// (depósito local). Toda la lógica sale de parámetros físicos — sin porcentajes forzados.
// Los dos pools operan EN PARALELO desde el minuto 0.
// Pool A (directos): prioridad absoluta, se agotan, no vuelven.
// Pool B (calesitas): ciclo continuo durante toda la operación.
// Las fases emergen naturalmente: Fase 1 = ambos pools activos, Fase 2 = solo calesitas.
export function calcScheduler(p, tnTotal) {
  const safe = (v, fallback = 0) => (isFinite(v) && !isNaN(v) ? parseFloat(v.toFixed(4)) : fallback);
  const tn = (typeof tnTotal === 'number' && isFinite(tnTotal) && tnTotal > 0) ? tnTotal : 0;

  const densidad    = p.cap_densidadArena || 1.45;
  const nTolvas     = Math.max(1, p.des_gruas || 2);
  const grampada_m3 = p.des_grampada      || 15;
  const movPorMin   = p.des_movGrampa     || 0.5;
  const tolva_m3    = p.des_tolva_vol_m3  || 60;
  const tPosMin     = p.des_t_posicion_min || 3;
  const tCaidaMin   = p.des_t_caida_min   || 4;
  const tCierreMin  = p.des_t_cierre_min  || 1;
  const horas_dia   = Math.max(1, p.des_horasDia || 14);

  // ── GRÚA ────────────────────────────────────────────────────────────────
  const vel_grua_TnMin = Math.max(0.001, grampada_m3 * densidad * movPorMin);
  const vel_grua_TnHr  = vel_grua_TnMin * 60;

  // ── TOLVA ───────────────────────────────────────────────────────────────
  const Tn_tolva      = tolva_m3 * densidad;
  const t_llenar      = Tn_tolva / vel_grua_TnMin;
  const t_ciclo_tolva = Math.max(0.1, tPosMin + tCaidaMin + tCierreMin);
  const tolva_rebosa  = (vel_grua_TnMin * tPosMin) > Tn_tolva;

  // ── POOL A — DIRECTOS (no vuelven) ──────────────────────────────────────
  const nDir         = Math.max(0, p.des_camDir_cantidad || 0);
  const Tn_cam_dir   = (p.des_camDir_volM3 || 30) * densidad;
  const Tn_por_dir   = Math.min(Tn_cam_dir, Tn_tolva);
  // Throughput pool A: cada tolva despacha 1 directo cada t_ciclo_tolva min
  // Con nTolvas en paralelo, la tasa de consumo de directos es nTolvas/t_ciclo_tolva cam/min
  // El throughput en Tn/hr está limitado por la grúa
  const tp_dir_max_TnHr = Math.min(
    nTolvas * (Tn_por_dir / t_ciclo_tolva) * 60,  // capacidad física tolvas con directos
    vel_grua_TnHr * nTolvas                         // techo grúa
  );
  // Tn totales que puede sacar el pool A antes de agotarse
  const Tn_max_dir   = nDir * Tn_por_dir;

  // ── POOL B — CALESITAS (ciclo continuo) ─────────────────────────────────
  const nCal         = Math.max(0, p.des_camAco_cantidad || 0);
  const Tn_cam_cal   = (p.des_camAco_volM3 || 30) * densidad;
  const distAcoKm    = p.des_camAco_distKm  || 15;
  const velCamKmh    = Math.max(1, p.des_camAco_velKmh || 60);
  const tDescDepMin  = p.des_tDescargaAcoMin || 10;
  const t_viaje      = (distAcoKm / velCamKmh) * 60;
  const t_ciclo_cal  = t_ciclo_tolva + t_viaje + tDescDepMin + t_viaje;
  const Tn_por_cal   = Math.min(Tn_cam_cal, Tn_tolva);
  // n_cal_min: mínimo de calesitas para que ninguna tolva espere (solo relevante si hay Tn para ellas)
  const n_cal_min_por_tolva = Math.ceil(t_ciclo_cal / t_ciclo_tolva);
  const n_cal_min_total     = n_cal_min_por_tolva * nTolvas;
  const tp_cal_TnHr = calcTpCalesitas(nCal, nTolvas, t_ciclo_cal, t_ciclo_tolva,
                                       Tn_por_cal, vel_grua_TnHr);

  // ── THROUGHPUT COMBINADO ─────────────────────────────────────────────────
  // Ambos pools operan en paralelo. El throughput total no puede superar
  // el techo físico de las grúas (vel_grua_TnHr × nTolvas).
  // Cuando hay directos disponibles, ocupan tolvas con prioridad.
  // Las calesitas toman la capacidad restante de las tolvas.
  //
  // Simplificación práctica: ambos pools acceden libremente a las nTolvas tolvas.
  // El throughput total es la suma, acotada por el techo de las grúas.
  const tp_total_max = vel_grua_TnHr * nTolvas;
  const tp_combinado = Math.min(tp_dir_max_TnHr + tp_cal_TnHr, tp_total_max);

  // ── FASE 1: ambos pools activos ───────────────────────────────────────────
  // Dura hasta que se agotan los directos O se vacía el barco.
  // Durante fase 1, el throughput es tp_combinado.
  // Las Tn que absorbe cada pool es proporcional a su throughput.
  let Tn_directos, Tn_calesitas_f1, t_fase1_hrs;

  if (tp_combinado <= 0 || tn <= 0) {
    Tn_directos      = 0;
    Tn_calesitas_f1  = 0;
    t_fase1_hrs      = 0;
  } else {
    // Fracción del throughput que corresponde a directos
    const frac_dir = tp_dir_max_TnHr > 0 ? tp_dir_max_TnHr / tp_combinado : 0;
    // Tn que consumirían los directos si el barco no se agota antes
    const Tn_dir_a_ritmo = Tn_max_dir;  // cap del pool A
    // Tn que consume el sistema hasta agotar el pool A
    // Si frac_dir > 0: los directos se agotan cuando sistema descargó Tn_max_dir/frac_dir Tn
    const Tn_sistema_cuando_dir_terminan = frac_dir > 0 ? Tn_max_dir / frac_dir : tn + 1;
    // Fase 1 termina al mínimo entre: agota directos o vacía el barco
    const Tn_f1 = Math.min(Tn_sistema_cuando_dir_terminan, tn);
    t_fase1_hrs      = Tn_f1 / tp_combinado;
    Tn_directos      = Math.min(Tn_f1 * frac_dir, Tn_max_dir);
    Tn_calesitas_f1  = Tn_f1 - Tn_directos;
  }

  // ── FASE 2: solo calesitas ───────────────────────────────────────────────
  const Tn_restantes   = Math.max(0, tn - Tn_directos - Tn_calesitas_f1);
  const tp_fase2       = tp_cal_TnHr;  // solo calesitas
  const t_fase2_hrs    = (tp_fase2 > 0 && Tn_restantes > 0) ? Tn_restantes / tp_fase2 : 0;
  const Tn_calesitas   = Tn_calesitas_f1 + Tn_restantes;

  // ── TOTALES ──────────────────────────────────────────────────────────────
  const t_total_hrs  = t_fase1_hrs + t_fase2_hrs;
  const t_total_dias = t_total_hrs / horas_dia;

  // ── COSTOS ───────────────────────────────────────────────────────────────
  const costoDir      = (p.des_costoCamionesDirUSDTn || 0) * Tn_directos;
  const costoKmTon    = p.des_camAco_costoKmTon  || 0.08;
  const costoAlq      = p.des_alquilerPredioUSDTn || 0;
  const costoTranspUSDTn = p.des_camAco_costoUSDTn != null
    ? p.des_camAco_costoUSDTn
    : distAcoKm * 2 * costoKmTon;
  const costoCalUSDTn = costoTranspUSDTn + costoAlq;  // alquiler siempre se suma
  const costoAlqTotal = costoAlq * Tn_calesitas;
  const costoCal      = costoCalUSDTn * Tn_calesitas;

  const pct_dir = tn > 0 ? Tn_directos / tn : 0;
  const pct_cal = 1 - pct_dir;

  // ── ALERTAS ──────────────────────────────────────────────────────────────
  const alertas = [];
  if (tolva_rebosa)
    alertas.push(`⚠️ Posicionamiento (${tPosMin}min) puede llenar la tolva — reducí t_posicionamiento o aumentá volumen tolva`);
  if (nDir === 0 && nCal === 0)
    alertas.push(`🚫 Sin camiones asignados — throughput = 0`);
  if (nDir === 0 && nCal > 0 && nCal < n_cal_min_total)
    alertas.push(`⚠️ Calesitas insuficientes — necesitás ≥${n_cal_min_total} para flujo continuo (tenés ${nCal})`);
  if (Tn_restantes > 0 && tp_fase2 <= 0)
    alertas.push(`⚠️ Sin calesitas para fase 2 — quedan ${Tn_restantes.toFixed(0)} Tn sin descargar`);

  return {
    // Grúa y tolva
    vel_grua_TnMin:      safe(vel_grua_TnMin),
    vel_grua_TnHr:       safe(vel_grua_TnHr),
    Tn_tolva:            safe(Tn_tolva),
    t_llenar:            safe(t_llenar),
    t_ciclo_tolva:       safe(t_ciclo_tolva),
    tolva_rebosa,
    // Calesitas
    t_ciclo_cal:         safe(t_ciclo_cal),
    t_viaje:             safe(t_viaje),
    n_cal_min_por_tolva,
    n_cal_min_total,
    Tn_cam_dir:          safe(Tn_cam_dir),
    Tn_cam_cal:          safe(Tn_cam_cal),
    nDir, nCal,
    // Split Tn
    Tn_directos:         safe(Tn_directos),
    Tn_calesitas:        safe(Tn_calesitas),
    pct_dir:             safe(pct_dir),
    pct_cal:             safe(pct_cal),
    // Throughput
    tp_fase1:            safe(tp_combinado),    // throughput durante fase 1 (ambos pools)
    tp_fase2:            safe(tp_fase2),         // throughput durante fase 2 (solo cal)
    tp_grua_max_total:   safe(tp_total_max),
    // Tiempos
    t_fase1_hrs:         safe(t_fase1_hrs),
    t_fase2_hrs:         safe(t_fase2_hrs),
    t_total_hrs:         safe(t_total_hrs),
    t_total_dias:        safe(t_total_dias, 999),
    // Costos
    costoDir:            safe(costoDir),
    costoCal:            safe(costoCal),
    costoCalUSDTn:       safe(costoCalUSDTn),
    costoTranspUSDTn:    safe(costoTranspUSDTn),
    costoAlqTotal:       safe(costoAlqTotal),
    costoAlqUSDTn:       safe(costoAlq),
    costoTotalCamiones:  safe(costoDir + costoCal),
    alertas,
  };
}

// Helper interno — throughput real de n_cal calesitas en n_tolvas tolvas
function calcTpCalesitas(nCal, nTolvas, t_ciclo_cal, t_ciclo_tolva, Tn_por_ciclo, tp_grua_max) {
  if (nCal <= 0 || nTolvas <= 0) return 0;
  // Cuántas calesitas tiene en promedio cada tolva
  const cal_por_tolva = nCal / nTolvas;
  const n_cal_min     = t_ciclo_cal / t_ciclo_tolva;  // mínimo para flujo sin espera
  let tp_por_tolva;
  if (cal_por_tolva >= n_cal_min) {
    // Flujo continuo — cuello es la grúa
    tp_por_tolva = Math.min(Tn_por_ciclo / t_ciclo_tolva * 60, tp_grua_max);
  } else {
    // Tolva espera camión — penalización
    const t_espera   = t_ciclo_cal / cal_por_tolva - t_ciclo_tolva;
    tp_por_tolva = Tn_por_ciclo / (t_ciclo_tolva + t_espera) * 60;
  }
  return tp_por_tolva * nTolvas;
}

// ─── ETAPA 3: DESCARGA ─────────────────────────────────────────────────────
export function calcEtapa3(p, tnEntrada=null) {
  const vlsfo     = getPrecioVLSFO(p.nav_escenarioVLSFO, p.nav_vlsfoManual, p.vlsfo_historico);
  const vlsfoStats= calcVLSFOStats(p.vlsfo_historico);
  const cd        = costoDiarioBarco(p); const tc = cd.total;
  const tn        = tnEntrada ?? (p.cap_capacidadBarco * (1 - p.cap_pctMerma));

  const sch = calcScheduler(p, tn);
  const tIdeal_dias   = isFinite(sch.t_total_dias) && sch.t_total_dias < 500
    ? sch.t_total_dias
    : (sch.t_fase1_hrs / Math.max(1, p.des_horasDia || 14));
  const velIdeal_TnHr = sch.vel_grua_TnHr;

  // Inoperabilidad — promedio anual
  const inopDet = getInopDetalle(p.clima_bb, p.des_inopLluvia, p.des_inopViento);
  const pInop   = inopDet.pInop;
  const diasInop= tIdeal_dias * pInop / Math.max(0.01, 1 - pInop);
  // Espera BB — promedio anual del array (o valor escalar si ya migrado)
  const esperaBB= Array.isArray(p.des_esperaBBMes)
    ? p.des_esperaBBMes.reduce((s,v)=>s+v,0) / p.des_esperaBBMes.length
    : (p.des_esperaBB ?? 1.97);
  const tReal_dias = tIdeal_dias + diasInop + esperaBB + p.des_esperaZarateDias;

  // ── Mermas ──────────────────────────────────────────────────────────────
  const mermaDescarga_Tn = tn * p.des_pctMermaDescarga;
  const tnPostDescarga   = tn - mermaDescarga_Tn;
  // Split sale del scheduler (proporcional a Tn_directos / Tn_calesitas)
  const tnDirecto        = Math.min(sch.Tn_directos, tnPostDescarga);
  const tnAcopio         = tnPostDescarga - tnDirecto;
  const mermaAcopio_Tn   = tnAcopio * p.des_pctMermaAcopio;
  const tnEntregadas     = tnPostDescarga - mermaAcopio_Tn;

  // ── Costos ──────────────────────────────────────────────────────────────
  const kLog         = inc(p,"logistica");
  const costoOpex    = p.des_opexUSDTn * tn * inc(p,"operacion");
  const costoCamiones= sch.costoDir * kLog;
  const costoAcopio  = sch.costoCal * kLog;  // ciclo local calesitas (BB → depósito → BB)
  const costoFleteAcopio = (p.des_costoFleteAcopioUSDTn ?? 37.14) * tnAcopio * kLog; // flete depósito → Neuquén
  const combPuerto   = tReal_dias * p.barco_consumoPuerto * vlsfo * inc(p,"combustible");
  const fleteEtapa   = tReal_dias * tc;
  const agencia      = calcAgenciaBB(p, tReal_dias) * inc(p,"agenciaDescarga");
  const precioArenaEq= (p._costoArenaEq != null && p._costoArenaEq > 0)
    ? p._costoArenaEq
    : (p.cap_precioArenaOrigen || 13.5);
  const costoMermaDescarga = mermaDescarga_Tn * precioArenaEq * inc(p,"arena");
  const costoMermaAcopio   = mermaAcopio_Tn  * precioArenaEq * inc(p,"arena");
  const costoTotal   = costoOpex + costoCamiones + costoAcopio + costoFleteAcopio
                     + combPuerto + fleteEtapa + agencia + costoMermaDescarga + costoMermaAcopio;

  return {
    tnEntrada: tn, velIdeal_TnHr, tIdeal_dias,
    // Propiedades de compatibilidad para SeccionFormulas y SeccionInop
    velIdeal_TnMin: isFinite(sch.vel_grua_TnMin) ? sch.vel_grua_TnMin : 0,
    tIdeal_dias,
    pInop, diasInop, esperaBB, tReal_dias, vlsfo, vlsfoStats, tc,
    mermaDescarga_Tn, tnPostDescarga, tnAcopio, tnDirecto, mermaAcopio_Tn, tnEntregadas,
    costoOpex, costoCamiones, costoAcopio, costoFleteAcopio, combPuerto, fleteEtapa, agencia,
    precioArenaEq, costoMermaDescarga, costoMermaAcopio, costoTotal,
    sch,  // scheduler completo disponible para la UI
    hoverVel:`Grúa: ${p.des_grampada}m³×${p.cap_densidadArena}T/m³×${p.des_movGrampa}mov/min = ${(p.des_grampada*(p.cap_densidadArena||1.45)*(p.des_movGrampa||0.5)).toFixed(2)}Tn/min`,
    hoverTIdeal:`${tn.toFixed(0)}Tn ÷ ${velIdeal_TnHr.toFixed(0)}Tn/hr ÷ ${p.des_horasDia||14}hr/día = ${tIdeal_dias.toFixed(1)}días`,
    hoverTReal:`${tIdeal_dias.toFixed(1)}(scheduler)+${diasInop.toFixed(1)}(inop)+${esperaBB}(espBB)+${p.des_esperaZarateDias}(Z) = ${tReal_dias.toFixed(1)}días`,
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
      cd.resumen,
      `Incluye: t_scheduler + inop + espera BB + espera Zárate`,
      `${tReal_dias.toFixed(1)}d×$${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Opex: $${p.des_opexUSDTn}/Tn×${tn.toFixed(0)}Tn = $${costoOpex.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Directos: ${sch.nDir} cam×${sch.Tn_cam_dir.toFixed(1)}Tn = ${sch.Tn_directos.toFixed(0)}Tn → $${costoCamiones.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Calesitas transp: ${sch.nCal} cam → ${sch.Tn_calesitas.toFixed(0)}Tn × $${sch.costoTranspUSDTn.toFixed(2)}/Tn = $${(sch.costoTranspUSDTn*sch.Tn_calesitas).toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Alquiler predio: ${sch.Tn_calesitas.toFixed(0)}Tn × $${sch.costoAlqUSDTn.toFixed(2)}/Tn = $${sch.costoAlqTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Flete acopio → Neuquén: ${tnAcopio.toFixed(0)}Tn × $${(p.des_costoFleteAcopioUSDTn??37.14).toFixed(2)}/Tn = $${costoFleteAcopio.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Comb. puerto: ${tReal_dias.toFixed(1)}d×${p.barco_consumoPuerto}T/d×$${vlsfo} = $${combPuerto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Barco: ${tReal_dias.toFixed(1)}d×$${tc}/d = $${fleteEtapa.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Agencia BB: $${agencia.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Merma desc: ${mermaDescarga_Tn.toFixed(0)}Tn × $${precioArenaEq.toFixed(1)}/Tn eq. = $${costoMermaDescarga.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── ETAPA 0: REPOSICIONAMIENTO (Rio Grande → Zárate) ─────────────────────
export function calcEtapaRepo(p) {
  const vlsfo    = getPrecioVLSFO(p.nav_escenarioVLSFO, p.nav_vlsfoManual, p.vlsfo_historico);
  const vlsfoStats = calcVLSFOStats(p.vlsfo_historico);
  const cd       = costoDiarioBarco(p); const tc = cd.total;
  const tramos   = p.repo_tramos || TRAMOS_REPO_DEFAULT;
  const nav      = velPromedioPonderada(tramos);

  const combTotal = tramos.reduce((acc, t) => {
    const dist = (t.distancia > 0) ? t.distancia : (t.wpIds ? calcDistanciaTramo(t) : 0);
    const hs   = dist / t.velocidad;
    // Viaje en lastre al puerto de carga
    const consumoDia = interpolarConsumo(p.barco_tablaVelConsumo, t.velocidad, "lastre");
    return acc + (hs / 24) * consumoDia;
  }, 0);

  // Fuera de alcance: el barco se recibe en el puerto de carga, el viaje no suma
  const kR         = inc(p,"repo");
  const combCosto  = combTotal * vlsfo * inc(p,"combustible") * kR;
  const fleteCosto = nav.diasNav * tc * kR;
  // Costos únicos por escala (se cargan en este viaje)
  const limpiezaBodega     = (p.barco_limpiezaBodega || 0) * kR;
  const importacionWaiver  = costoWaiver(p) * kR;
  const extrasTotal        = (p.repo_itemsExtra||[]).reduce((s,it)=>s+(it.activo?it.usd:0),0) * kR;
  // F-03: fleteCosto incluido en costoTotal para que grand total cierre correctamente
  const costoViaje = combCosto + fleteCosto + limpiezaBodega + importacionWaiver + extrasTotal;
  // Movilización/adecuación/desmovilización: un solo contrato de un viaje → se cargan acá,
  // aunque el viaje a puerto de carga esté fuera de alcance
  const mov = costoMovilizacion(p);
  const costoTotal = costoViaje + mov.total;

  return {
    ...nav, vlsfo, vlsfoStats, tc,
    combTotal, combCosto, fleteCosto,
    limpiezaBodega, importacionWaiver, costoViaje, movInicio:mov.inicio, movFin:mov.fin, costoTotal,
    hoverComb:[
      `Consumo lastre interpolado por tramo`,
      `Total: ${combTotal.toFixed(1)}T × $${vlsfo} = $${combCosto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTC:[
      cd.resumen,
      `${nav.diasNav.toFixed(1)}d × $${tc}/d = $${fleteCosto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Combustible lastre: ${combTotal.toFixed(1)}T×$${vlsfo} = $${combCosto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Barco: ${nav.diasNav.toFixed(1)}d×$${tc}/d = $${fleteCosto.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Limpieza bodega: $${limpiezaBodega.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Importación/Waiver: $${importacionWaiver.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      ...(p.repo_itemsExtra||[]).filter(it=>it.activo).map(it=>`${it.label}: $${it.usd.toLocaleString("es-AR",{maximumFractionDigits:0})}`),
    ],
  };
}
// calcEtapa4 mantenida como alias de calcEtapaRepo para compatibilidad con MC
export function calcEtapa4(p) { return calcEtapaVuelta(p); }

// ─── ETAPA VUELTA: BB → ZÁRATE (en lastre, entre viajes consecutivos) ─────
export function calcEtapaVuelta(p) {
  const vlsfo    = getPrecioVLSFO(p.nav_escenarioVLSFO, p.nav_vlsfoManual, p.vlsfo_historico);
  const vlsfoStats = calcVLSFOStats(p.vlsfo_historico);
  const cd       = costoDiarioBarco(p); const tc = cd.total;
  const tramos   = p.vta_tramos || DEFAULT_PARAMS.vta_tramos;
  const nav      = velPromedioPonderada(tramos);

  const combLastreTotal = tramos.reduce((acc, t) => {
    const dist = (t.distancia > 0) ? t.distancia : (t.wpIds ? calcDistanciaTramo(t) : 0);
    const hs   = dist / t.velocidad;
    const consumoDia = interpolarConsumo(p.barco_tablaVelConsumo, t.velocidad, "lastre");
    return acc + (hs / 24) * consumoDia;
  }, 0);

  const combLastre = combLastreTotal * vlsfo * inc(p,"combustible");
  const fleteNav   = nav.diasNav * tc;
  const costoTotal = combLastre + fleteNav;

  return {
    ...nav, vlsfo, vlsfoStats, tc,
    combLastreTotal, combLastre, fleteNav, costoTotal,
    hoverComb:[
      `Consumo lastre interpolado por tramo`,
      `Total: ${combLastreTotal.toFixed(1)}T × $${vlsfo} = $${combLastre.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTC:[
      cd.resumen,
      `${nav.diasNav.toFixed(1)}d × $${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
    hoverTotal:[
      `Combustible lastre: ${combLastreTotal.toFixed(1)}T×$${vlsfo} = $${combLastre.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
      `Barco: ${nav.diasNav.toFixed(1)}d×$${tc}/d = $${fleteNav.toLocaleString("es-AR",{maximumFractionDigits:0})}`,
    ],
  };
}

// ─── MODELO MULTI-VIAJE (N viajes dentro del waiver) ──────────────────────
// Viaje 1: E0(repo) + E1 + E2 + E3
// Viaje 2..N: E4(vuelta BB→ZTE) + E1 + E2 + E3
// Costos únicos (1 sola vez): limpiezaBodega + importacionWaiver
// diasCiclo = E1 + E2 + E3 (días operativos por viaje, sin el posicionamiento inicial)
export function calcNViajes(p, tot) {
  // tot = resultado de calcTotal ya calculado — usamos sus días directamente
  // sin recalcular nada con meses
  const diasWaiver = diasPeriodoMultiViaje(p);

  // Ciclo viaje 1 dentro del waiver: E1.tReal + E2.nav + E3.tReal (sin E0 repo)
  const diasE1  = tot.e1.tReal_dias;
  const diasE2  = tot.e2.diasNav;
  const diasE3  = tot.e3.tReal_dias;
  const diasCiclo1 = diasE1 + diasE2 + diasE3;

  // Vuelta BB→ZTE en lastre: ruta y velocidades de la pestaña "Vuelta en lastre" (vta_tramos)
  const e4 = calcEtapaVuelta(p);
  const costoVuelta = e4.costoTotal;
  const diasVuelta  = e4.diasNav;

  // Ciclo viaje 2+: vuelta + ciclo1
  const diasCiclo2 = diasVuelta + diasCiclo1;

  // Cuántos viajes adicionales caben
  const diasRestantes = diasWaiver - diasCiclo1;
  const viajesExtra   = diasRestantes > 0 ? Math.floor(diasRestantes / diasCiclo2) : 0;
  const nViajes       = 1 + viajesExtra;
  const diasTotalesWaiver = diasCiclo1 + viajesExtra * diasCiclo2;

  // Costo viaje adicional: vuelta + E1 + E2 + E3 (sin limpieza ni waiver)
  const costoViajeAdicional = costoVuelta + tot.e1.costoTotal + tot.e2.costoTotal + tot.e3.costoTotal;

  // Array de viajes para tabla columnar
  const viajes = [];
  let diasAcum = 0, costoAcum = 0, tnAcum = 0;
  for (let i = 1; i <= nViajes; i++) {
    if (i === 1) {
      diasAcum  = diasCiclo1;
      costoAcum = tot.costoTotal - tot.e0.movFin;  // la desmovilización va al final del contrato
      tnAcum    = tot.tnEntregadas;
    } else {
      diasAcum  += diasCiclo2;
      costoAcum += costoViajeAdicional;
      tnAcum    += tot.tnEntregadas;
    }
    if (i === nViajes) costoAcum += tot.e0.movFin;
    viajes.push({
      n: i,
      diasWaiverAcum: diasAcum,
      pctWaiver: diasAcum / diasWaiver,
      costoAcum,
      tnAcum,
      usdTn: costoAcum / tnAcum,
    });
  }

  const costoTotalSistema = viajes[nViajes-1].costoAcum;
  const tnTotales         = viajes[nViajes-1].tnAcum;
  const usdTnSistema      = costoTotalSistema / tnTotales;
  const diasTotales       = tot.diasTotales + viajesExtra * diasCiclo2;

  return {
    nViajes, diasWaiver, diasCiclo1, diasCiclo2, diasVuelta, costoVuelta,
    diasTotalesWaiver, diasTotales,
    viajes,
    costoViajeAdicional, costoTotalSistema, tnTotales, usdTnSistema,
    ahorroPorWaiver:   costoWaiver(p) * inc(p,"repo") * viajesExtra,
    ahorroPorLimpieza: (p.barco_limpiezaBodega||0) * inc(p,"repo") * viajesExtra,
    ahorroTotal:       (costoWaiver(p) + (p.barco_limpiezaBodega||0)) * inc(p,"repo") * viajesExtra,
  };
}

// ─── TOTAL ─────────────────────────────────────────────────────────────────
// Mes más pesimista (mayor inoperabilidad en BB — afecta E3)
export function calcTotal(p) {
  const e0=calcEtapaRepo(p);
  const e1=calcEtapa1(p);
  const e2=calcEtapa2(p);
  // Arena puesta en destino: sin movilización/adecuación, que son costos del contrato, no de la arena
  const costoArenaEq = e1.tnPostCarga > 0 ? (e1.costoTotal+e2.costoTotal+e0.costoViaje)/e1.tnPostCarga : (p.cap_precioArenaOrigen||13.5);
  const pConEq = {...p, _costoArenaEq: costoArenaEq};
  const e3=calcEtapa3(pConEq,e1.tnPostCarga);
  const costoTotal =e0.costoTotal+e1.costoTotal+e2.costoTotal+e3.costoTotal;
  const usdTn      =costoTotal/e3.tnEntregadas;
  const diasTotales=e0.diasNav*inc(p,"repo")+e1.tReal_dias+e2.diasNav+e3.tReal_dias;
  return {e0,e1,e2,e3,costoTotal,usdTn,diasTotales,tnEntregadas:e3.tnEntregadas};
}

// ─── MONTE CARLO ───────────────────────────────────────────────────────────
function randn(){
  let u=0,v=0;
  while(u===0)u=Math.random();
  while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

// Triangular: mínimo, más probable, máximo. Acepta los tres en cualquier orden.
export function sampleTriangular(a, c, b) {
  const [min, max] = a <= b ? [a, b] : [b, a];
  if (max === min) return min;
  const moda = Math.min(max, Math.max(min, c ?? (min + max) / 2));
  const u = Math.random();
  const F = (moda - min) / (max - min);
  return u < F
    ? min + Math.sqrt(u * (max - min) * (moda - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - moda));
}

// Variables del Monte Carlo de un escenario. Los escenarios guardados antes de que
// existiera una variable no la traen: se completa con la de DEFAULT_PARAMS.
export function mcVarsDe(p) {
  const guardadas = p.mc_vars || [];
  return DEFAULT_PARAMS.mc_vars.map(d => ({ ...d, ...(guardadas.find(v => v.id === d.id) || {}) }));
}

// sampleInop usa promedio anual — sin selección de mes
function sampleInop(climaDB, umbralL, umbralV, sigmaFactor=0.20){
  const d = getClimaAnual(climaDB);
  const pL=probSuperaUmbral(d.lluviaProm,d.lluviaSigma,umbralL);
  const pV=probSuperaUmbral(d.vientoProm,d.vientoSigma,umbralV);
  const pBase=Math.min(pL+pV-pL*pV,0.90);
  return Math.max(0,Math.min(0.50,pBase+randn()*pBase*sigmaFactor));
}

export function runMonteCarlo(p, n=5000) {
  const mcVars = mcVarsDe(p);
  const cfg = {};
  mcVars.forEach(v => { cfg[v.id] = v; });
  const S = id => cfg[id]?.activa !== false;
  const sigma = id => cfg[id]?.sigma ?? DEFAULT_PARAMS.mc_vars.find(v=>v.id===id)?.sigma ?? 0;
  // Rango: la variable se sortea con una triangular (mín, más probable, máx) en vez de la Normal
  const R = id => cfg[id]?.dist === "rango";
  const tri = id => sampleTriangular(cfg[id].min, cfg[id].moda, cfg[id].max);

  const vlsfoStats = calcVLSFOStats(p.vlsfo_historico);
  const basePrecio = getPrecioVLSFO(p.nav_escenarioVLSFO, p.nav_vlsfoManual, p.vlsfo_historico);
  const sigmaVLSFO = sigma('vlsfo') !== null ? sigma('vlsfo') : vlsfoStats.sigma12m;

  // Bootstrap histórico VLSFO — últimos 24 meses con precio real (> 0)
  // En lugar de asumir distribución Normal, sorteamos directamente del histórico real.
  // Esto captura la asimetría real del mercado (spikes, colas largas al alza).
  const vlsfoPool = p.vlsfo_historico
    .filter(h => h.precio > 0)
    .slice(-24)
    .map(h => h.precio);
  // Si no hay suficientes datos, caemos en distribución Normal (fallback)
  const usarBootstrap = vlsfoPool.length >= 6;

  // Promedio anual de esperaBB
  const esperaBBBase = Array.isArray(p.des_esperaBBMes)
    ? p.des_esperaBBMes.reduce((s,v)=>s+v,0) / p.des_esperaBBMes.length
    : (p.des_esperaBB ?? 1.97);

  // Inop base anual para rama S('inop')=false
  const dZanual = getClimaAnual(p.clima_zarate);
  const dBanual = getClimaAnual(p.clima_bb);
  const pLzBase = probSuperaUmbral(dZanual.lluviaProm,dZanual.lluviaSigma,p.cap_inopLluvia);
  const pVzBase = probSuperaUmbral(dZanual.vientoProm,dZanual.vientoSigma,p.cap_inopViento);
  const pZbase  = Math.min(pLzBase+pVzBase-pLzBase*pVzBase, 0.90);
  const pLbBase = probSuperaUmbral(dBanual.lluviaProm,dBanual.lluviaSigma,p.des_inopLluvia);
  const pVbBase = probSuperaUmbral(dBanual.vientoProm,dBanual.vientoSigma,p.des_inopViento);
  const pBbase  = Math.min(pLbBase+pVbBase-pLbBase*pVbBase, 0.90);

  // Costo diario del barco: se calcula una vez (la liquidación de tripulación no se sortea)
  const cdBase   = costoDiarioBarco(p);
  const hireBase = cdBase.hire;
  // Alcance: 1 = bloque a nuestro cargo, 0 = no suma
  const kComb = inc(p,"combustible"), kRepo = inc(p,"repo"), kAgZ = inc(p,"agenciaCarga"), kAgB = inc(p,"agenciaDescarga");
  const kAre  = inc(p,"arena"), kOpe = inc(p,"operacion"), kLog = inc(p,"logistica");
  const movContrato = costoMovilizacion(p).total;

  const results = [];

  for (let i = 0; i < n; i++) {
    const vlsfo  = !S('vlsfo') ? basePrecio
      : R('vlsfo') ? tri('vlsfo')
      : usarBootstrap
          ? vlsfoPool[Math.floor(Math.random() * vlsfoPool.length)]  // bootstrap: sorteo directo del histórico 24M
          : Math.max(300, basePrecio + randn()*sigmaVLSFO);           // fallback: Normal si hay pocos datos
    const tcBase = !S('tc') ? hireBase
      : R('tc') ? tri('tc')
      : Math.max(5000, hireBase + randn()*sigma('tc'));
    // El resto del costo diario no varía; en BBC los recargos % se aplican sobre el hire sorteado
    const tc     = cdBase.total + (tcBase - hireBase) * cdBase.factorHire;
    // Cada variable: fija → valor base; rango → triangular; si no → Normal alrededor del base
    const sortear = (id, base, piso) => !S(id) ? base : R(id) ? tri(id) : Math.max(piso, base + randn()*sigma(id));
    const espBB  = sortear('espBB',    esperaBBBase,              0);
    const espZ   = sortear('espZ',     p.des_esperaZarateDias,    0);
    const espC   = sortear('espCarga', p.cap_esperaDias,          0);
    const mC     = sortear('mCarga',   p.cap_pctMerma,            0);
    const mD     = sortear('mDesc',    p.des_pctMermaDescarga,    0);
    const mA     = sortear('mAcopio',  p.des_pctMermaAcopio,      0);
    const vF     = sortear('velFact',  1,                         0.5);
    const pa     = p.cap_precioArenaOrigen;

    let pZ, pB;
    if (S('inop') && R('inop')) {
      // Rango de inop: factor sobre la probabilidad base del clima (1 = 100%)
      const f = tri('inop');
      pZ = Math.max(0, Math.min(0.50, pZbase*f));
      pB = Math.max(0, Math.min(0.50, pBbase*f));
    } else if (S('inop')) {
      pZ = sampleInop(p.clima_zarate, p.cap_inopLluvia, p.cap_inopViento, sigma('inop'));
      pB = sampleInop(p.clima_bb,     p.des_inopLluvia, p.des_inopViento, sigma('inop'));
    } else {
      pZ = pZbase;
      pB = pBbase;
    }

    // E0 — Reposicionamiento
    const tramosR = (p.repo_tramos||TRAMOS_REPO_DEFAULT).map(t=>({...t,velocidad:t.velocidad*vF}));
    const {diasNav:diasNavR} = velPromedioPonderada(tramosR);
    const combRepoT = tramosR.reduce((acc,t)=>{
      const dist = (t.distancia>0)?t.distancia:(t.wpIds?calcDistanciaTramo({...t}):(t.distancia||0));
      const hs = dist/t.velocidad;
      return acc+(hs/24)*interpolarConsumo(p.barco_tablaVelConsumo,t.velocidad,"lastre");
    },0);
    const c0 = kRepo * (combRepoT*vlsfo*kComb + diasNavR*tc + (p.barco_limpiezaBodega||0) + costoWaiver(p)
             + (p.repo_itemsExtra||[]).reduce((s,it)=>s+(it.activo?it.usd:0),0))
             + movContrato;

    // E1 — Carga (F-06: barco zarpa con cap_capacidadBarco, merma es costo adicional)
    const vH1  = p.cap_gruas*p.cap_grampada*p.cap_densidadArena*p.cap_movGrampa*60;
    const tI1  = p.cap_capacidadBarco/vH1/p.cap_horasDia;
    const tR1  = tI1 + tI1*pZ/Math.max(0.01,1-pZ) + espC;
    const mCTn = p.cap_capacidadBarco*mC;  // Tn merma compradas extra en origen
    const c1   = kAre*(pa*p.cap_capacidadBarco + pa*mCTn) + kOpe*p.cap_opexUSDTn*p.cap_capacidadBarco
               + kComb*tR1*p.barco_consumoPuerto*vlsfo + tR1*tc + kAgZ*calcAgenciaZarate(p,tR1);

    // E2 — Navegación ida
    const tramosV = p.nav_tramos.map(t=>({...t,velocidad:t.velocidad*vF}));
    const {diasNav} = velPromedioPonderada(tramosV);
    const combNavT = tramosV.reduce((acc,t)=>{
      const dist = (t.distancia>0)?t.distancia:(t.wpIds?calcDistanciaTramo({...t,velocidad:t.velocidad}):(t.distancia||0));
      const hs = dist/t.velocidad;
      return acc+(hs/24)*interpolarConsumo(p.barco_tablaVelConsumo,t.velocidad,"cargado");
    },0);
    const c2 = kComb*combNavT*vlsfo + diasNav*tc;

    // E3 — Descarga (usa Scheduler completo — F-02)
    // F-06: usar cap_capacidadBarco como tnEntrada (igual que determinístico)
    // la merma de carga afecta el costo pero el barco llega con cap_capacidadBarco
    const mCTn_gross = p.cap_capacidadBarco * mC;  // Tn merma pagadas en origen
    const tnABordo   = p.cap_capacidadBarco;         // Tn que llegan al puerto
    const schMC = calcScheduler(p, tnABordo);
    const tI3  = isFinite(schMC.t_total_dias) && schMC.t_total_dias < 500
      ? schMC.t_total_dias
      : (schMC.t_fase1_hrs / Math.max(1, p.des_horasDia || 14));
    const tR3  = tI3 + tI3*pB/Math.max(0.01,1-pB) + espBB + espZ;
    const mDTn = tnABordo*mD; const tnPD = tnABordo-mDTn;
    const tnDi = Math.min(schMC.Tn_directos, tnPD);
    const tnAc = tnPD - tnDi;
    const mATn = tnAc*mA; const tnEnt = tnPD-mATn;
    // F-05: precEq includes E0+E1+E2 (igual que determinístico)
    const precEq = tnABordo>0 ? (c0-movContrato+c1+c2)/tnABordo : pa;
    const fleteAcopioUSDTn = p.des_costoFleteAcopioUSDTn ?? 37.14;
    // F-04: agregar mATn*precEq (merma acopio) a c3
    const c3 = kOpe*p.des_opexUSDTn*tnABordo + kLog*(p.des_costoCamionesDirUSDTn*tnDi
             + schMC.costoCal + fleteAcopioUSDTn*tnAc)
             + kComb*tR3*p.barco_consumoPuerto*vlsfo + tR3*tc
             + kAgB*calcAgenciaBB(p,tR3) + kAre*(mDTn*precEq + mATn*precEq);

    // Desglose de ítems para proforma MC
    const combTotal = kComb*(combRepoT*kRepo + (tR1*p.barco_consumoPuerto) + combNavT + (tR3*p.barco_consumoPuerto));
    const barcoTotal = (diasNavR*kRepo + tR1 + diasNav + tR3) * tc;
    const agZarate   = kAgZ*calcAgenciaZarate(p, tR1);
    const agBB       = kAgB*calcAgenciaBB(p, tR3);
    const opex       = kOpe*(p.cap_opexUSDTn*p.cap_capacidadBarco + p.des_opexUSDTn*tnABordo);
    const camiones   = kLog*(p.des_costoCamionesDirUSDTn*tnDi + schMC.costoCal + fleteAcopioUSDTn*tnAc);
    const arena      = kAre*pa*p.cap_capacidadBarco;
    const mermas     = kAre*(pa*mCTn_gross + mDTn*precEq + mATn*precEq);
    const repo       = c0;
    const total      = c0+c1+c2+c3;

    results.push({
      total: parseFloat((total/tnEnt).toFixed(3)),
      items: {
        arena:    parseFloat((arena/tnEnt).toFixed(3)),
        mermas:   parseFloat((mermas/tnEnt).toFixed(3)),
        barco:    parseFloat((barcoTotal/tnEnt).toFixed(3)),
        comb:     parseFloat((combTotal*vlsfo/tnEnt).toFixed(3)),
        agZarate: parseFloat((agZarate/tnEnt).toFixed(3)),
        agBB:     parseFloat((agBB/tnEnt).toFixed(3)),
        opex:     parseFloat((opex/tnEnt).toFixed(3)),
        camiones: parseFloat((camiones/tnEnt).toFixed(3)),
        repo:     parseFloat((repo/tnEnt).toFixed(3)),
      },
    });
  }

  results.sort((a,b)=>a.total-b.total);
  const pct  = q => results[Math.floor(q*n)].total;
  const totals = results.map(r=>r.total);
  const mean = totals.reduce((a,b)=>a+b,0)/n;
  const std  = Math.sqrt(totals.reduce((a,b)=>a+(b-mean)**2,0)/n);
  const mn=totals[0], mx=totals[n-1], bins=40, bs=(mx-mn)/bins;
  const hist = Array.from({length:bins},(_,i)=>({x:parseFloat((mn+i*bs+bs/2).toFixed(1)),count:0,pct:0}));
  // Con todas las variables fijas los totales son iguales y bs=0: van todos a la primera barra
  totals.forEach(v=>{const bi=bs>0?Math.min(Math.floor((v-mn)/bs),bins-1):0;hist[bi].count++;});
  hist.forEach(h=>h.pct=parseFloat(((h.count/n)*100).toFixed(1)));

  // Percentiles por ítem — tomados en los índices P10/P50/P90 del total ordenado
  const idxP10=Math.floor(0.10*n), idxP50=Math.floor(0.50*n), idxP90=Math.floor(0.90*n);
  const ITEM_KEYS = ['arena','mermas','barco','comb','agZarate','agBB','opex','camiones','repo'];
  const proforma = {};
  ITEM_KEYS.forEach(k=>{
    proforma[k] = {
      p10: results[idxP10].items[k],
      p50: results[idxP50].items[k],
      p90: results[idxP90].items[k],
    };
  });

  // Descripción de cada variable para el panel de la UI
  const varsDesc = mcVars.map(v => {
    let base = "";
    switch(v.id) {
      case "vlsfo":   base = `$${basePrecio}/T (${VLSFO_ESCENARIOS.find(e=>e.id===p.nav_escenarioVLSFO)?.label})`; break;
      case "tc":      base = `$${hireBase.toLocaleString()}/d (${hireLabel(p)})`; break;
      case "velFact": base = "100% (neutro)"; break;
      case "espBB":   base = `${(p.des_esperaBBMes.reduce((a,b)=>a+b,0)/12).toFixed(1)}d prom. anual`; break;
      case "espZ":    base = `${p.des_esperaZarateDias}d`; break;
      case "espCarga":base = `${p.cap_esperaDias}d`; break;
      case "mCarga":  base = `${(p.cap_pctMerma*100).toFixed(1)}%`; break;
      case "mDesc":   base = `${(p.des_pctMermaDescarga*100).toFixed(1)}%`; break;
      case "mAcopio": base = `${(p.des_pctMermaAcopio*100).toFixed(1)}%`; break;
      case "inop":    base = "pBase calculado del clima"; break;
      default:        base = "—";
    }
    const s = v.id==="vlsfo" ? sigmaVLSFO : (v.sigma??0);
    return { ...v, base, sigmaEfectivo: s };
  });

  return {
    hist, n,
    mean: parseFloat(mean.toFixed(4)),
    std:  parseFloat(std.toFixed(4)),
    p10:pct(0.10), p25:pct(0.25), p50:pct(0.50), p75:pct(0.75), p90:pct(0.90),
    min:mn, max:mx,
    proforma,
    varsDesc,
  };
}
