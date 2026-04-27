async function saveData(){

const data = {
  nombre: document.getElementById("nombre").value,
  direccion: document.getElementById("direccion").value,
  curp: document.getElementById("curp").value,
  clave: document.getElementById("clave").value,
  telefono: document.getElementById("telefono").value,
  email: document.getElementById("email").value
};
console.log(data);
fetch("https://script.google.com/macros/s/AKfycbwXlCZSCxy2v3FsBK21dCdnWTcUzd5eOadXM_1cckwDi8xje0vGAueZFl8rXbYARZQs/exec", {
method: "POST",
body: JSON.stringify(data)
})
.then(res => res.text())
.then(res => {

alert("Datos guardados");

// limpiar formulario
clearForm();

})
.catch(err => {
alert("Error al guardar");
});

}

function clearForm(){

document.getElementById("nombre").value = "";
document.getElementById("direccion").value = "";
document.getElementById("curp").value = "";
document.getElementById("clave").value = "";
document.getElementById("telefono").value = "";
document.getElementById("email").value = "";

// limpiar OCR
document.getElementById("ocrResult").value = "";

// reset visual
document.getElementById("preview").style.display = "block";
document.getElementById("processedPreview").style.display = "none";

}