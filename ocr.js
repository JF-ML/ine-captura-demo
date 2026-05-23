function toggleText(){
  const textarea = document.getElementById("ocrResult");
  const isHidden = window.getComputedStyle(textarea).display === "none";
  textarea.style.display = isHidden ? "block" : "none";
}

function openCamera(){
  resetPreview();
  document.getElementById("imageInput").click();
}

async function scanINE(){
  const file = document.getElementById("imageInput").files[0];
  if(!file){ alert("Selecciona una imagen"); return; }

  showStatus("⏳ Procesando imagen...");

  // Limpiar campos antes de cada escaneo
  ["nombre","direccion","municipio","clave","curp","telefono","email"]
    .forEach(id => document.getElementById(id).value = "");
  document.getElementById("ocrResult").value = "";

  const processedCanvas = await preprocessImage(file);

  showStatus("🔍 Leyendo texto...");
  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('spa');
  await worker.initialize('spa');
  await worker.setParameters({
    tessedit_pageseg_mode: "6",       // single uniform block — better for cropped text area
    preserve_interword_spaces: "1",
  });

  const { data: { text } } = await worker.recognize(processedCanvas);
  document.getElementById("ocrResult").value = text;
  parseINE(text);
  document.getElementById("preview").style.display = "none";
  await worker.terminate();

  // Ocultar controles de recorte tras escanear
  if(typeof hideCropControls === "function") hideCropControls();

  showStatus("✅ Listo");
  setTimeout(() => showStatus(""), 2000);
}

function showStatus(msg){
  let el = document.getElementById("ocrStatus");
  if(!el){
    el = document.createElement("p");
    el.id = "ocrStatus";
    el.style.cssText = "text-align:center;font-size:0.9rem;color:#555;margin:8px 0;";
    document.querySelector(".container").prepend(el);
  }
  el.textContent = msg;
}

document.getElementById("imageInput").addEventListener("change", function(event){
  resetPreview();
  previewImage(event);
});

function previewImage(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const preview = document.getElementById("preview");
    const canvas  = document.getElementById("processedPreview");
    preview.src = e.target.result;
    preview.style.display = "block";
    canvas.style.display  = "none";
  };
  reader.readAsDataURL(file);
}

function preprocessImage(file){
  return new Promise((resolve) => {
    const img    = new Image();
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };

    img.onload = function(){
      // Step 1: cap max dimension
      const MAX = 1600;
      let w = img.width, h = img.height;
      if(w > MAX || h > MAX){
        const ratio = Math.min(MAX/w, MAX/h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      // Step 2: draw full image at capped size
      const full = document.createElement("canvas");
      full.width = w; full.height = h;
      const fCtx = full.getContext("2d");
      fCtx.imageSmoothingEnabled = true;
      fCtx.imageSmoothingQuality = "high";
      fCtx.drawImage(img, 0, 0, w, h);

      // Step 3: crop to text region only
      // INE layout: photo occupies roughly left 30% of card
      // Name field starts ~30% from left, ~20% from top
      // We crop to right 70% of the card to exclude the photo
      const cropX = Math.floor(w * 0.28);
      const cropW = w - cropX;
      const cropH = h;

      const cropped = document.createElement("canvas");
      cropped.width  = cropW * 2;   // 2x upscale
      cropped.height = cropH * 2;
      const cCtx = cropped.getContext("2d");
      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = "high";
      cCtx.drawImage(full, cropX, 0, cropW, cropH, 0, 0, cropW*2, cropH*2);

      // Step 4: grayscale + contrast via filter (GPU, fast)
      const filtered = document.createElement("canvas");
      filtered.width  = cropped.width;
      filtered.height = cropped.height;
      const filtCtx = filtered.getContext("2d");
      filtCtx.filter = "grayscale(1) contrast(1.8) brightness(1.1)";
      filtCtx.drawImage(cropped, 0, 0);

      // Step 5: fast global threshold (single pass)
      const final = document.createElement("canvas");
      final.width  = filtered.width;
      final.height = filtered.height;
      const aCtx = final.getContext("2d");
      aCtx.drawImage(filtered, 0, 0);

      const imgData = aCtx.getImageData(0, 0, final.width, final.height);
      const px = imgData.data;

      // compute mean brightness
      let sum = 0;
      for(let i = 0; i < px.length; i += 4) sum += px[i];
      const mean = sum / (px.length / 4);
      const threshold = mean * 0.85;

      for(let i = 0; i < px.length; i += 4){
        const val = px[i] < threshold ? 0 : 255;
        px[i] = px[i+1] = px[i+2] = val;
      }
      aCtx.putImageData(imgData, 0, 0);

      // Show processed preview
      const preview       = document.getElementById("preview");
      const previewCanvas = document.getElementById("processedPreview");
      preview.style.display       = "none";
      previewCanvas.style.display = "block";
      previewCanvas.width  = cropW;
      previewCanvas.height = cropH;
      previewCanvas.getContext("2d").drawImage(final, 0, 0, cropW, cropH);

      resolve(final);
    };

    reader.readAsDataURL(file);
  });
}

function resetPreview(){
  document.getElementById("preview").style.display = "block";
  document.getElementById("processedPreview").style.display = "none";
}