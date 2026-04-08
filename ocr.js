function toggleText(){

const textarea = document.getElementById("ocrResult");

const isHidden = window.getComputedStyle(textarea).display === "none";

if(isHidden){
textarea.style.display = "block";
}else{
textarea.style.display = "none";
}

}
function openCamera(){

document.getElementById("imageInput").click();

}
async function scanINE(){

const file = document.getElementById("imageInput").files[0];

if(!file){
alert("Selecciona una imagen");
return;
}

// procesar imagen
const processedCanvas = await preprocessImage(file);

// OCR
const worker = await Tesseract.createWorker();

await worker.loadLanguage('spa');
await worker.initialize('spa');

await worker.setParameters({
tessedit_pageseg_mode: "6"
});

const { data: { text } } = await worker.recognize(processedCanvas);

document.getElementById("ocrResult").value = text;

parseINE(text);
document.getElementById("preview").style.display = "none";
await worker.terminate();

}

document.getElementById("imageInput").addEventListener("change", previewImage);

function previewImage(event){

const file = event.target.files[0];
if(!file) return;

const reader = new FileReader();

reader.onload = function(e){

const preview = document.getElementById("preview");
const canvas = document.getElementById("processedPreview");

// mostrar preview
preview.src = e.target.result;
preview.style.display = "block";

// ocultar canvas
canvas.style.display = "none";

}

reader.readAsDataURL(file);

}
function preprocessImage(file){

return new Promise((resolve)=>{

const img = new Image();
const reader = new FileReader();

reader.onload = function(e){
img.src = e.target.result;
};

img.onload = function(){

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = img.width;
canvas.height = img.height;

ctx.drawImage(img,0,0);

let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
let data = imageData.data;

for(let i=0;i<data.length;i+=4){

let gray = (data[i]+data[i+1]+data[i+2])/3;


data[i]=gray;
data[i+1]=gray;
data[i+2]=gray;

}

ctx.putImageData(imageData,0,0);

/* mostrar canvas procesado */

const preview = document.getElementById("preview");
const previewCanvas = document.getElementById("processedPreview");

preview.style.display = "none";
previewCanvas.style.display = "block";

previewCanvas.width = canvas.width;
previewCanvas.height = canvas.height;

const previewCtx = previewCanvas.getContext("2d");
previewCtx.drawImage(canvas,0,0);

resolve(canvas);

};

reader.readAsDataURL(file);

});

}
function resetPreview(){

const preview = document.getElementById("preview");
const canvas = document.getElementById("processedPreview");

preview.style.display = "block";
canvas.style.display = "none";

}
document.getElementById("imageInput").addEventListener("change", function(event){

resetPreview();
previewImage(event);

});

function openCamera(){

resetPreview();

document.getElementById("imageInput").click();

}