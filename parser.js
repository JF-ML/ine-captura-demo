function cleanText(text){

return text
.replace(/O/g,"0")
.replace(/I/g,"1")
.replace(/[^A-Z0-9\s]/g," ")
.replace(/\s+/g," ");

}

function parseINE(text){

text = cleanText(text);

// CURP
const curpMatch = text.match(/[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9]{2}/);

if(curpMatch){
document.getElementById("curp").value = curpMatch[0];
}

// CLAVE ELECTOR
const claveMatch = text.match(/[A-Z]{6}[0-9]{8}[A-Z0-9]{3}/);

if(claveMatch){
document.getElementById("clave").value = claveMatch[0];
}

// NOMBRE
const lines = text.split("\n");

let palabras = [];

lines.forEach(line=>{

if(line.match(/^[A-Z]{4,}$/)){
palabras.push(line.trim());
}

});

if(palabras.length>=3){

document.getElementById("nombre").value =
palabras[2]+" "+palabras[0]+" "+palabras[1];

}

}