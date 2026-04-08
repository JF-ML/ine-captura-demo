function cleanText(text){

return text
.toUpperCase()
.replace(/[^A-Z0-9\n\s]/g," ")   // mantiene saltos de linea
.replace(/[|]/g,"I")             // errores comunes OCR
.replace(/O/g,"0")
.replace(/\s+/g," ");

}

function parseINE(text){

text = cleanText(text);

// dividir en lineas
const lines = text.split("\n").map(l => l.trim()).filter(l => l.length>0);

/* ---------------- CURP ---------------- */

const curpRegex = /[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}/;
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

let candidatos = [];

lines.forEach(line=>{

if(
line.length > 3 &&
line.length < 25 &&
/^[A-Z\s]+$/.test(line) &&
!line.includes("INSTITUTO") &&
!line.includes("ELECTORAL") &&
!line.includes("DOMICILIO") &&
!line.includes("ADDRESS")
){
candidatos.push(line);
}

});

// si encontramos 3 lineas seguidas que parecen nombre
if(candidatos.length >= 3){

const nombre = candidatos.slice(0,3).join(" ");

document.getElementById("nombre").value = nombre;

}

}