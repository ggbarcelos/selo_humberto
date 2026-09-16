const SIZE = 1080;
const DEFAULT_PHOTO_RADIUS = 405;

const frames = [
  { id: 'modelo-1', name: 'Arco clássico', src: 'modelos/modelo1.png', overlaySrc: 'modelos/modelo1-overlay.png', photoRadius: 398 },
  { id: 'modelo-2', name: 'Faixas de força', src: 'modelos/modelo2.png', overlaySrc: 'modelos/modelo2-overlay.png', photoRadius: 394 },
  { id: 'modelo-3', name: 'Sol popular', src: 'modelos/modelo3.png', overlaySrc: 'modelos/modelo3-overlay.png', photoRadius: 380 },
];

const state = {
  frameIndex: 0,
  image: null,
  fileName: 'humberto-exemplo.png',
  zoom: 1,
  x: 0,
  y: 0,
  dragging: false,
  lastPoint: null,
  busy: false,
};

const canvas = document.querySelector('#previewCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const picker = document.querySelector('#framePicker');
const fileInput = document.querySelector('#fileInput');
const uploadBtn = document.querySelector('#uploadBtn');
const dropZone = document.querySelector('#dropZone');
const zoomSlider = document.querySelector('#zoomSlider');
const zoomReadout = document.querySelector('#zoomReadout');
const zoomOutBtn = document.querySelector('#zoomOutBtn');
const zoomInBtn = document.querySelector('#zoomInBtn');
const resetBtn = document.querySelector('#resetBtn');
const downloadBtn = document.querySelector('#downloadBtn');
const shareBtn = document.querySelector('#shareBtn');
const status = document.querySelector('#status');
const installCard = document.querySelector('#installCard');
const installBtn = document.querySelector('#installBtn');
const installDescription = document.querySelector('#installDescription');
const installInstructions = document.querySelector('#installInstructions');
const overlays = new Map();

let deferredInstallPrompt = null;
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobileDevice = isIos || /android|mobile|tablet/i.test(navigator.userAgent);
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches === true
  || navigator.standalone === true;

function setInstallButtonLabel(label) {
  if (!installBtn) return;
  installBtn.innerHTML = `${label} <span aria-hidden="true">＋</span>`;
}

function revealInstallCard(mode = 'manual') {
  if (!installCard || !installBtn || isStandalone) return;
  installCard.hidden = false;
  installBtn.hidden = false;
  if (mode === 'prompt') {
    setInstallButtonLabel('Instalar no celular');
    if (installDescription) installDescription.textContent = 'Abra mais rápido e crie seu selo como um aplicativo.';
    return;
  }
  setInstallButtonLabel('Como instalar');
  if (installDescription) {
    installDescription.textContent = isIos
      ? 'No navegador do iPhone/iPad: use o botão Compartilhar e escolha “Adicionar à Tela de Início”.'
      : 'Use o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.';
  }
}

function showInstallInstructions() {
  if (!installInstructions) return;
  installInstructions.textContent = isIos
    ? 'No navegador do iPhone/iPad: toque em Compartilhar, escolha “Adicionar à Tela de Início” e confirme em Adicionar.'
    : 'Abra o menu ⋮ do navegador e toque em “Instalar aplicativo” ou “Adicionar à tela inicial”.';
  installInstructions.hidden = false;
}

function setupInstallExperience() {
  if (isStandalone) return;
  if (isIos || isMobileDevice) revealInstallCard('manual');

  installBtn?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showInstallInstructions();
      return;
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        setInstallButtonLabel('Instalando…');
        if (installDescription) installDescription.textContent = 'Confirme a instalação na janela do navegador.';
      } else {
        setInstallButtonLabel('Instalar no celular');
        if (installDescription) installDescription.textContent = 'Quando quiser, toque novamente para instalar o gerador.';
      }
    } catch (error) {
      console.info('A instalação foi cancelada ou não está disponível.', error);
      revealInstallCard('manual');
      showInstallInstructions();
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    revealInstallCard('prompt');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installCard) installCard.hidden = true;
    setStatus('Gerador instalado. Você já pode abrir pelo celular como um app.');
  });
}

function registerServiceWorker() {
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const canRegister = 'serviceWorker' in navigator
    && (window.location.protocol === 'https:' || isLocalhost);
  if (!canRegister) return;
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .catch((error) => console.info('Service worker indisponível neste ambiente.', error));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    image.src = src;
  });
}

async function prepareOverlay(frame) {
  const image = await loadImage(frame.overlaySrc);
  overlays.set(frame.id, image);
}

function drawPhoto(targetContext, image, transform = state, radius = DEFAULT_PHOTO_RADIUS) {
  targetContext.save();
  targetContext.beginPath();
  targetContext.arc(SIZE / 2, SIZE / 2, radius, 0, Math.PI * 2);
  targetContext.clip();

  const imageScale = Math.max((radius * 2) / image.naturalWidth, (radius * 2) / image.naturalHeight) * transform.zoom;
  const width = image.naturalWidth * imageScale;
  const height = image.naturalHeight * imageScale;
  const left = SIZE / 2 - width / 2 + transform.x;
  const top = SIZE / 2 - height / 2 + transform.y;
  targetContext.drawImage(image, left, top, width, height);
  targetContext.restore();
}

function drawPlaceholder(targetContext, radius = DEFAULT_PHOTO_RADIUS) {
  targetContext.save();
  targetContext.beginPath();
  targetContext.arc(SIZE / 2, SIZE / 2, radius, 0, Math.PI * 2);
  targetContext.fillStyle = '#f8f9fa';
  targetContext.fill();
  targetContext.fillStyle = '#06213C';
  targetContext.textAlign = 'center';
  targetContext.font = '900 34px Arial';
  targetContext.fillText('CARREGUE SUA FOTO', SIZE / 2, SIZE / 2 - 8);
  targetContext.font = '600 22px Arial';
  targetContext.fillStyle = '#6c7784';
  targetContext.fillText('ela aparece aqui, atrás da moldura', SIZE / 2, SIZE / 2 + 34);
  targetContext.restore();
}

function drawScene(targetCanvas, frameIndex = state.frameIndex, image = state.image, transform = state) {
  const targetContext = targetCanvas.getContext('2d', { alpha: false });
  const frame = frames[frameIndex];
  targetContext.clearRect(0, 0, SIZE, SIZE);
  targetContext.fillStyle = '#ffffff';
  targetContext.fillRect(0, 0, SIZE, SIZE);
  if (image) drawPhoto(targetContext, image, transform, frame.photoRadius);
  else drawPlaceholder(targetContext, frame.photoRadius);

  const overlay = overlays.get(frame.id);
  if (overlay) targetContext.drawImage(overlay, 0, 0, SIZE, SIZE);
}

function render() {
  drawScene(canvas);
  zoomSlider.value = String(Math.round(state.zoom * 100));
  zoomReadout.value = `${Math.round(state.zoom * 100)}%`;
  zoomReadout.textContent = `${Math.round(state.zoom * 100)}%`;
  const hasPhoto = Boolean(state.image);
  resetBtn.disabled = !hasPhoto;
  downloadBtn.disabled = !hasPhoto || state.busy;
  shareBtn.disabled = !hasPhoto || state.busy;
  canvas.classList.toggle('is-dragging', state.dragging);

  document.querySelectorAll('.frame-option').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === state.frameIndex));
  });
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function resetTransform() {
  state.zoom = 1;
  state.x = 0;
  state.y = 0;
  render();
}

function updateZoom(nextValue) {
  state.zoom = Math.max(1, Math.min(2.4, nextValue));
  render();
}

function canvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (SIZE / bounds.width),
    y: (event.clientY - bounds.top) * (SIZE / bounds.height),
  };
}

function handleFiles(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const looksLikeImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || '');
  if (!looksLikeImage) {
    setStatus('Esse arquivo não é uma imagem. Escolha JPG, PNG ou WEBP.', true);
    return;
  }

  setStatus('Carregando sua foto…');
  const objectUrl = URL.createObjectURL(file);
  loadImage(objectUrl).then((image) => {
    state.image = image;
    state.fileName = file.name || 'minha-foto.png';
    resetTransform();
    setStatus('Foto carregada. Arraste na prévia ou use o zoom para ajustar.');
    URL.revokeObjectURL(objectUrl);
  }).catch(() => {
    URL.revokeObjectURL(objectUrl);
    setStatus('Não foi possível ler essa imagem. Tente outro arquivo.', true);
  });
}

function buildFramePicker() {
  frames.forEach((frame, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'frame-option';
    button.setAttribute('aria-pressed', String(index === state.frameIndex));
    button.setAttribute('aria-label', `${frame.name} — escolher moldura`);
    button.innerHTML = `<img src="${frame.src}" alt="" width="1080" height="1080" /><span>${frame.name}</span>`;
    button.addEventListener('click', () => {
      state.frameIndex = index;
      setStatus(`${frame.name} selecionado. Agora ajuste sua foto.`);
      render();
    });
    picker.append(button);
  });
}

function downloadBlob(blob, filename = 'selo-eu-voto-65065.png') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadDataUrl(dataUrl, filename = 'selo-eu-voto-65065.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
}

function dataUrlToBlob(dataUrl) {
  const separator = dataUrl.indexOf(',');
  if (separator === -1) return null;

  const header = dataUrl.slice(0, separator);
  const encoded = dataUrl.slice(separator + 1);
  const mime = header.match(/^data:([^;]+)/i)?.[1] || 'image/png';

  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const blob = new Blob([bytes], { type: mime });
    return blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

function canvasToDataUrl() {
  try {
    if (!canvas || canvas.width < 1 || canvas.height < 1) return null;
    if (canvas.width !== SIZE) canvas.width = SIZE;
    if (canvas.height !== SIZE) canvas.height = SIZE;
    drawScene(canvas);
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.startsWith('data:image/png') ? dataUrl : null;
  } catch (error) {
    console.error('Falha ao gerar o PNG no canvas.', error);
    return null;
  }
}

function canvasToBlob() {
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId;

    const finish = (blob) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(blob && blob.size > 0 ? blob : null);
    };

    const fallback = () => finish(dataUrlToBlob(canvasToDataUrl() || ''));

    if (typeof canvas?.toBlob !== 'function') {
      fallback();
      return;
    }

    timeoutId = setTimeout(fallback, 4000);
    try {
      drawScene(canvas);
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) finish(blob);
        else fallback();
      }, 'image/png');
    } catch (error) {
      console.error('Falha ao converter o canvas para PNG.', error);
      fallback();
    }
  });
}

function exportFilename() {
  const frameName = frames[state.frameIndex].id;
  return `selo-eu-voto-65065-${frameName}.png`;
}

async function exportPng() {
  if (state.busy) return;
  state.busy = true;
  render();
  setStatus('Preparando seu PNG…');
  try {
    const blob = await canvasToBlob();
    if (!blob) {
      const dataUrl = canvasToDataUrl();
      if (!dataUrl) {
        setStatus('Não foi possível preparar o PNG. Tente novamente.', true);
        return;
      }
      try {
        downloadDataUrl(dataUrl, exportFilename());
        setStatus('Selo baixado. Espalhe essa ideia.');
      } catch {
        setStatus('O navegador bloqueou o download. Tente clicar novamente.', true);
      }
      return;
    }
    try {
      downloadBlob(blob, exportFilename());
      setStatus('Selo baixado. Espalhe essa ideia.');
    } catch {
      setStatus('O navegador bloqueou o download. Tente clicar novamente.', true);
    }
  } finally {
    state.busy = false;
    render();
  }
}

async function shareImage() {
  if (state.busy) return;
  state.busy = true;
  render();
  setStatus('Preparando o compartilhamento…');
  try {
    const blob = await canvasToBlob();
    if (!blob) {
      const dataUrl = canvasToDataUrl();
      if (dataUrl) {
        try {
          downloadDataUrl(dataUrl, exportFilename());
          setStatus('Compartilhamento direto não está disponível aqui. O PNG foi baixado para você enviar.');
        } catch {
          setStatus('Não foi possível compartilhar ou baixar a imagem. Tente novamente.', true);
        }
      } else {
        setStatus('Não foi possível preparar a imagem para compartilhar. Tente novamente.', true);
      }
      return;
    }

    const filename = exportFilename();
    const file = new File([blob], filename, { type: 'image/png' });
    let supportsFileShare = false;
    try {
      supportsFileShare = typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [file] });
    } catch {
      supportsFileShare = false;
    }

    if (supportsFileShare) {
      try {
        await Promise.race([
          navigator.share({ title: 'Eu voto 65065', text: 'Meu apoio ao Humberto Matos', files: [file] }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('share-timeout')), 12000)),
        ]);
        setStatus('Selo compartilhado. Obrigado por espalhar essa ideia.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          setStatus('Compartilhamento cancelado. Você pode tentar novamente quando quiser.');
          return;
        }
      }
    }

    try {
      downloadBlob(blob, filename);
      setStatus('Compartilhamento direto não está disponível aqui. O PNG foi baixado para você enviar.');
    } catch {
      setStatus('Não foi possível compartilhar ou baixar a imagem. Tente novamente.', true);
    }
  } finally {
    state.busy = false;
    render();
  }
}

canvas.addEventListener('pointerdown', (event) => {
  if (!state.image) return;
  state.dragging = true;
  state.lastPoint = canvasPoint(event);
  canvas.setPointerCapture(event.pointerId);
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (!state.dragging) return;
  const point = canvasPoint(event);
  state.x += point.x - state.lastPoint.x;
  state.y += point.y - state.lastPoint.y;
  state.lastPoint = point;
  render();
});

function stopDragging(event) {
  if (!state.dragging) return;
  state.dragging = false;
  state.lastPoint = null;
  if (event?.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  render();
}

canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('pointerleave', (event) => {
  if (event.buttons === 0) stopDragging(event);
});

canvas.addEventListener('keydown', (event) => {
  if (!state.image) return;
  const step = event.shiftKey ? 24 : 12;
  const moves = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  state.x += move[0];
  state.y += move[1];
  render();
});

uploadBtn.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.add('is-over');
}));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-over');
}));
dropZone.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));
canvas.addEventListener('click', () => {
  if (!state.image) fileInput.click();
});

zoomSlider.addEventListener('input', (event) => updateZoom(Number(event.target.value) / 100));
zoomOutBtn.addEventListener('click', () => updateZoom(state.zoom - 0.1));
zoomInBtn.addEventListener('click', () => updateZoom(state.zoom + 0.1));
resetBtn.addEventListener('click', () => {
  resetTransform();
  setStatus('Posição e zoom redefinidos.');
});
downloadBtn.addEventListener('click', exportPng);
shareBtn.addEventListener('click', shareImage);

async function init() {
  buildFramePicker();
  try {
    await Promise.all(frames.map(prepareOverlay));
    state.image = await loadImage('img/image22.png');
    render();
  } catch (error) {
    setStatus('Alguns assets não carregaram. Reabra a página para tentar novamente.', true);
    render();
  }
}

setupInstallExperience();
registerServiceWorker();
init();
