// ── Municipios de Campeche ──
const MUNICIPIOS_CAMPECHE = [
  "CALAKMUL","XPUJIL","CALKINI","CAMPECHE","SAN FRANCISCO DE CAMPECHE",
  "CANDELARIA","CARMEN","CIUDAD DEL CARMEN","CHAMPOTON","DZITBALCHE",
  "ESCARCEGA","HECELCHAKAN","HOPELCHEN","PALIZADA","SEYBAPLAYA","TENABO"
];

function stripAccents(s){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

// Levenshtein distance for proper fuzzy matching
function levenshtein(a, b){
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_,i) => [i, ...Array(n).fill(0)]);
  for(let j = 0; j <= n; j++) dp[0][j] = j;
  for(let i = 1; i <= m; i++)
    for(let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function similarity(a, b){
  a = stripAccents(a.toUpperCase());
  b = stripAccents(b.toUpperCase());
  if(a === b) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function matchMunicipio(raw){
  if(!raw || raw.length < 3) return "";
  const words = stripAccents(raw.toUpperCase()).split(/\s+/).filter(w => w.length >= 4);
  let best = "", bestScore = 0.75; // raised threshold — avoids false matches

  for(const mun of MUNICIPIOS_CAMPECHE){
    const munClean = stripAccents(mun);
    // Full string match
    const s1 = similarity(raw, mun);
    if(s1 > bestScore){ bestScore = s1; best = mun; }
    // Word-by-word — only consider words long enough to be meaningful
    for(const word of words){
      if(word.length < munClean.length * 0.6) continue; // skip too-short words
      const s2 = similarity(word, munClean);
      if(s2 > bestScore){ bestScore = s2; best = mun; }
    }
  }
  // Return in ALL CAPS for sheet consistency
  return best;
}

// ── Normalize common OCR misreads of INE keywords ──
function normalizeKeywords(text){
  return text
    // NOMBRE variants
    .replace(/\b[IJ][A-Z]?OMBRE\b/g,           "NOMBRE")
    .replace(/\bNOM[B8]RE\b/g,                  "NOMBRE")
    // DOMICILIO variants
    .replace(/\b[VJUB]OMICILIO\b/g,             "DOMICILIO")
    .replace(/\bDOMICI[L1][I1]O\b/g,            "DOMICILIO")
    .replace(/\bD0MICILIO\b/g,                  "DOMICILIO")
    // CLAVE DE ELECTOR variants
    .replace(/\bC[O0]N[VU][EF][UW][EF][ ]?ELECTOR\b/g, "CLAVE ELECTOR")
    .replace(/\bCLA[VU][EF][ ]?(DE[ ]?)?ELECTOR\b/g,    "CLAVE ELECTOR")
    .replace(/\bCLAVE[ ]?ELECT[O0]R\b/g,       "CLAVE ELECTOR")
    // CURP
    .replace(/\bCUR[P9]\b/g,                    "CURP")
    // MUNICIPIO
    .replace(/\bMUN[I1]C[I1]P[I1]O\b/g,        "MUNICIPIO")
    // VIGENCIA / SECCION
    .replace(/\bV[I1]GENC[I1]A\b/g,            "VIGENCIA")
    .replace(/\bSECC[I1][O0]N\b/g,             "SECCION");
}

function cleanText(text){
  return text
    .toUpperCase()
    .replace(/[|¡!]/g, "I")
    .replace(/[^A-Z0-9\n\s]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function normalizeStructure(text){
  return text.replace(
    /\b(NOMBRE|DOMICILIO|CLAVE ELECTOR|CLAVE|CURP|FECHA|SECCION|VIGENCIA|LOCALIDAD|MUNICIPIO|EMISION)\b/g,
    "\n$1\n"
  );
}

const NOISE_WORDS = [
  "INSTITUTO","NACIONAL","FEDERAL","ELECTORAL","CREDENCIAL","VOTAR",
  "MEXICO","SEXO","REGISTRO","NACIMIENTO","SECCION","VIGENCIA",
  "EMISION","FOLIO","MUESTRA","INE","IFE","ELECTOR","CLAVE"
];
function isNoiseLine(l){ return NOISE_WORDS.some(w => l.includes(w)); }

function numericVersion(text){
  return text
    .toUpperCase()
    .replace(/[|¡!]/g,"I")
    .replace(/O/g,"0")
    .replace(/[^A-Z0-9\n\s]/g," ");
}

function extractNombre(lines){
  const ni = lines.findIndex(l => l === "NOMBRE");
  const di = lines.findIndex(l => l === "DOMICILIO");

  if(ni !== -1){
    const end = di !== -1 ? di : Math.min(ni+6, lines.length);
    const block = lines.slice(ni+1, end)
      .map(l => l.replace(/[^A-ZÁÉÍÓÚÑ\s]/g,"").trim())
      .filter(l => l.length > 2 && !isNoiseLine(l) && /[A-Z]{2,}/.test(l));
    if(block.length) return block.slice(0,3).join(" ");
  }

  // Fallback: consecutive pure-letter lines before DOMICILIO
  const cutoff = di !== -1 ? di : lines.length;
  const candidates = lines.slice(0, cutoff).filter(l => {
    const t = l.trim();
    return /^[A-ZÁÉÍÓÚÑ\s]{3,35}$/.test(t) && !isNoiseLine(t) && t.split(" ").length <= 5 && t.length > 3;
  });
  return candidates.slice(0,3).join(" ");
}

function extractDireccion(lines){
  const di = lines.findIndex(l => l === "DOMICILIO");
  const endRx = /^(CLAVE|CURP|MUNICIPIO|LOCALIDAD|SECCION|VIGENCIA|EMISION|FECHA)/;

  if(di !== -1){
    const block = [];
    for(let i = di+1; i < lines.length; i++){
      if(endRx.test(lines[i])) break;
      const clean = lines[i].replace(/[^A-Z0-9\s]/g,"").trim();
      if(clean.length > 2 && !isNoiseLine(clean)) block.push(clean);
      if(block.length >= 3) break;
    }
    return block.join(", ");
  }
  return "";
}

function extractMunicipio(lines){
  // Look for a line containing a 5-digit postal code
  // Municipio name is often on the same line or next line
  for(let i = 0; i < lines.length; i++){
    if(/\d{5}/.test(lines[i])){
      // Try same line first (e.g. "FRACC FOVI 24030 CAMPECHE")
      const sameLine = lines[i].replace(/\d+/g," ").replace(/[^A-ZÁÉÍÓÚÑ\s]/g," ").trim();
      const matched = matchMunicipio(sameLine);
      if(matched) return matched;
      // Try next line
      if(lines[i+1]){
        const nextLine = lines[i+1].replace(/[^A-ZÁÉÍÓÚÑ\s]/g," ").trim();
        const matched2 = matchMunicipio(nextLine);
        if(matched2) return matched2;
      }
    }
  }
  // Fallback: scan every line for a municipio match
  for(const line of lines){
    const m = matchMunicipio(line);
    if(m) return m;
  }
  return "";
}

function parseINE(rawText){
  // Step 1: normalize keywords on raw text first
  let text = normalizeKeywords(rawText.toUpperCase());

  // Step 2: numeric version for code fields
  const numText = numericVersion(text);

  // Step 3: clean and structure for name/address
  text = cleanText(text);
  text = normalizeStructure(text);
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  console.log("=== INE PARSE DEBUG ===");
  console.log("LINES:", lines);

  /* ── CURP ──
     Tolerant: last char can be digit OR letter (OCR often misreads final digit) */
  const curpRx = /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9][A-Z0-9]/;
  const curpMatch = numText.match(curpRx) || text.match(curpRx);
  if(curpMatch) document.getElementById("curp").value = curpMatch[0];

  /* ── CLAVE DE ELECTOR ──
     6 letters + 6 digits + 2 digits + 1 letter + 3 digits */
  const claveRx = /[A-Z]{6}\d{6}\d{2}[A-Z]\d{3}/;
  const claveMatch = numText.match(claveRx) || text.match(claveRx);
  if(claveMatch) document.getElementById("clave").value = claveMatch[0];

  /* ── NOMBRE ── */
  const nombre = extractNombre(lines);
  if(nombre) document.getElementById("nombre").value = nombre;

  /* ── DIRECCIÓN ── */
  const direccion = extractDireccion(lines);
  if(direccion) document.getElementById("direccion").value = direccion;

  /* ── MUNICIPIO ── */
  const municipio = extractMunicipio(lines);
  if(municipio) document.getElementById("municipio").value = municipio;

  console.log("NOMBRE:", nombre);
  console.log("DIRECCIÓN:", direccion);
  console.log("MUNICIPIO:", municipio);
  console.log("CURP:", curpMatch?.[0]);
  console.log("CLAVE:", claveMatch?.[0]);
}