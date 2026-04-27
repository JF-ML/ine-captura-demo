function cleanText(text){

return text
.toUpperCase()
.replace(/[^A-Z0-9\n\s]/g," ")   // mantiene saltos de linea
.replace(/[|]/g,"I")
.replace(/O/g,"0")
.replace(/[ \t]+/g," ")          // SOLO espacios (no \n)
.replace(/\n+/g,"\n");           // limpia saltos múltiples

}


// 🔍 reconstruye estructura si viene todo en una línea
function normalizeStructure(text){

return text.replace(
/(NOMBRE|JOMBRE|NAME|DOMICILIO|ADDRESS|CURP)/g,
"\n$1\n"
);

}


// 🔍 extraer nombre por bloques + fallback
function extractNombre(lines){

const nombreKeys = ["NOMBRE","JOMBRE","NOM8RE","NAME"];
const domicilioKeys = ["DOMICILIO","ADDRESS","DOMICIL10"];

let start = -1;
let end = -1;

// buscar inicio
for(let i=0;i<lines.length;i++){
for(let key of nombreKeys){
if(lines[i].includes(key)){
start = i;
break;
}
}
if(start !== -1) break;
}

// buscar fin
if(start !== -1){
for(let i=start+1;i<lines.length;i++){
for(let key of domicilioKeys){
if(lines[i].includes(key)){
end = i;
break;
}
}
if(end !== -1) break;
}
}

// fallback si no encuentra domicilio
if(start !== -1 && end === -1){
end = start + 5;
}

// si encontró bloque
if(start !== -1){

let nombreLines = lines.slice(start+1, end);

nombreLines = nombreLines
.map(l => l.replace(/[^A-Z\s]/g,"").trim())
.filter(l => l.length > 2 && l.length < 25);

if(nombreLines.length){
return nombreLines.slice(0,3);
}

}


// 🔥 DETECCIÓN DENTRO DE LÍNEAS (muy importante)
for(let line of lines){

const posibles = line.match(/[A-Z]{3,}/g); // ahora mínimo 3 letras

if(posibles && posibles.length){

// filtrar basura tipo AAA
const filtrados = posibles.filter(p => !/(.)\1\1/.test(p));

if(filtrados.length){
return filtrados.slice(0,3);
}

}

}


// 🔥 FALLBACK (líneas en mayúsculas filtradas)

let candidatos = lines.filter(line => {

const clean = line.replace(/\s/g,"");

// mínimo 3 letras seguidas
const tienePalabraReal = /[A-Z]{3,}/.test(clean);

// evitar ruido tipo "X S S"
const pocasSeparaciones = (line.split(" ").length <= 3);

// evitar AAA, BBB
const noRepetidas = !/(.)\1\1/.test(clean);

// evitar palabras del INE
const noRuido = !line.includes("INSTITUTO") &&
!line.includes("ELECTORAL") &&
!line.includes("DOMICILIO") &&
!line.includes("ADDRESS") &&
!line.includes("CURP");

return (
line.length > 3 &&
line.length < 25 &&
/^[A-Z\s]+$/.test(line) &&
tienePalabraReal &&
pocasSeparaciones &&
noRepetidas &&
noRuido
);

});

if(candidatos.length >= 3){
return candidatos.slice(0,3);
}

return [];

}
function extractDireccion(lines){

const inicioKeys = ["DOMICILIO","ADDRESS","DOMICIL10"];
const finKeys = ["CLAVE","CURP","FECHA","SECCION","VIGENCIA"];

let start = -1;
let end = -1;

// buscar inicio
for(let i=0;i<lines.length;i++){
for(let key of inicioKeys){
if(lines[i].includes(key)){
start = i;
break;
}
}
if(start !== -1) break;
}

// buscar fin
if(start !== -1){
for(let i=start+1;i<lines.length;i++){
for(let key of finKeys){
if(lines[i].includes(key)){
end = i;
break;
}
}
if(end !== -1) break;
}
}

// fallback
if(start !== -1 && end === -1){
end = start + 4;
}

if(start !== -1){

let direccionLines = lines.slice(start+1,end);

direccionLines = direccionLines
.map(l => l.replace(/[^A-Z0-9\s]/g,"").trim())
.filter(l => l.length > 2);

return direccionLines.join(" ");
}

return "";
}

function parseINE(text){

// limpiar
text = cleanText(text);

// reconstruir estructura si viene plano
text = normalizeStructure(text);

// dividir en líneas
const lines = text
.split("\n")
.map(l => l.trim())
.filter(l => l.length > 0);


/* ---------------- CURP ---------------- */

// más tolerante
const curpRegex = /[A-Z]{4}[0-9]{6}[A-Z][A-Z]{5}[0-9]{2}/;
const curpMatch = text.match(curpRegex);

if(curpMatch){
document.getElementById("curp").value = curpMatch[0];
}


/* ---------------- CLAVE ELECTOR ---------------- */

const claveRegex = /[A-Z]{6}[0-9]{6}[A-Z0-9]{6}/;
const claveMatch = text.match(claveRegex);

if(claveMatch){
document.getElementById("clave").value = claveMatch[0];
}


/* ---------------- NOMBRE ---------------- */

const nombreParts = extractNombre(lines);

if(nombreParts.length){
document.getElementById("nombre").value = nombreParts.join(" ");
}

/* ---------------- DIRECCION ---------------- */

const direccion = extractDireccion(lines);

if(direccion){
document.getElementById("direccion").value = direccion;
}

/* ---------------- DEBUG (opcional) ---------------- */

console.log("TEXT:", text);
console.log("LINES:", lines);
console.log("NOMBRE DETECTADO:", nombreParts);




}