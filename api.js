async function saveData(){


const nombre = document.getElementById("nombre").value.trim();

if(nombre === ""){
alert("Debes ingresar el nombre");
return;
}

const data = {
  nombre: document.getElementById("nombre").value,
  direccion: document.getElementById("direccion").value,
  municipio: document.getElementById("municipio").value,
  clave: document.getElementById("clave").value,
  curp: document.getElementById("curp").value,
  telefono: document.getElementById("telefono").value,
  email: document.getElementById("email").value
};
console.log(data);
fetch("https://script.google.com/macros/s/AKfycbx2I2NH02rv1FhSI-Js-9QFw0BophodVyBWG-KUcgrptQlJw81g3DxEfNL6fH4av6CL/exec", {
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
document.getElementById("municipio").value = "";
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
