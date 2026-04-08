async function saveData(){

const data = {
nombre: document.getElementById("nombre").value,
curp: document.getElementById("curp").value,
clave: document.getElementById("clave").value,
telefono: document.getElementById("telefono").value,
email: document.getElementById("email").value
};

await fetch("https://script.google.com/macros/s/AKfycbx78yeS1H54vsp9bNB7fZ5QCrV-ZylvQgH094kHOsotaiC5qCtVFzsEwG7PJ1m7PGjA/exec",{
method:"POST",
body: JSON.stringify(data)
});

alert("Registro guardado");

}