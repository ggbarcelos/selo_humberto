const SIZE = 1080;
const DEFAULT_PHOTO_RADIUS = 405;

const frames = [
  // Each PNG is a complete frame. The photo uses a clean circle intersected
  // with that frame's central transparent component; no contour is generated.
  // Keep the source PNG untouched. These small regions contain only the
  // HUMBERTO wordmark and are used to lock its anti-aliased pixels later.
  {
    id: 'modelo-1',
    name: 'Arco clássico',
    src: 'modelos/modelo1.png?v=22',
    photoRadius: 446,
    photoCenter: { x: 542, y: 540 },
    logoRegion: { x: 250, y: 774, width: 270, height: 64 },
    logoInk: 'white',
  },
  {
    id: 'modelo-2',
    name: 'Faixas de força',
    src: 'modelos/modelo2.png?v=22',
    photoRadius: 464,
    photoCenter: { x: 540, y: 595 },
    logoRegion: { x: 315, y: 838, width: 185, height: 46 },
    logoInk: 'navy',
    headlineRegion: { x: 360, y: 35, width: 340, height: 125 },
    headlineColor: 'red',
  },
  {
    id: 'modelo-3',
    name: 'Sol popular',
    src: 'modelos/modelo3.png?v=22',
    photoRadius: 446,
    photoCenter: { x: 538, y: 602 },
    logoRegion: { x: 500, y: 758, width: 255, height: 63 },
    logoInk: 'navy',
    headlineRegion: { x: 560, y: 55, width: 340, height: 240 },
    headlineColor: 'yellow',
  },
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
const shareButtonLabel = document.querySelector('#shareBtn .share-button-label');
const shareButtonIcon = document.querySelector('#shareBtn .share-button-icon');
const status = document.querySelector('#status');
const installCard = document.querySelector('#installCard');
const installBtn = document.querySelector('#installBtn');
const installDescription = document.querySelector('#installDescription');
const installInstructions = document.querySelector('#installInstructions');
const overlays = new Map();
const photoLayer = document.createElement('canvas');
photoLayer.width = SIZE;
photoLayer.height = SIZE;
const photoLayerContext = photoLayer.getContext('2d');

const MASK_ALPHA_THRESHOLD = 32;

const LOGO_COLORS = {
  navy: [6, 34, 61],
  white: [255, 255, 255],
};

const HEADLINE_COLORS = {
  red: [198, 40, 40],
  yellow: [249, 178, 51],
};

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
  const image = await loadImage(frame.src);
  overlays.set(frame.id, image);
  const opening = buildOpeningMask(
    image,
    frame.photoCenter || { x: SIZE / 2, y: SIZE / 2 },
    frame.logoRegion,
  );
  frame.openingMask = opening.mask;
  frame.counterMask = opening.counterMask;
  frame.photoMask = buildPhotoMask(
    opening.mask,
    frame.photoRadius,
    frame.photoCenter || { x: SIZE / 2, y: SIZE / 2 },
    opening.counterMask,
  );
  frame.logoLock = buildLogoLock(image, frame.logoRegion, frame.logoInk);
  frame.coloredOverlay = buildHeadlineArtwork(image, frame.headlineRegion, frame.headlineColor);
}

function drawNativeArtwork(context, image) {
  const width = Math.min(SIZE, image.naturalWidth);
  const height = Math.min(SIZE, image.naturalHeight);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, width, height, 0, 0, width, height);
}

function isLogoInkPixel(red, green, blue, ink) {
  if (ink === 'white') {
    // White anti-aliasing can carry a little of the red frame into its RGB
    // channels. Keep those edge pixels, but reject unrelated dark artwork.
    return red > 180 && green > 180 && blue > 180
      && Math.max(red, green, blue) - Math.min(red, green, blue) < 90;
  }

  // Navy anti-aliasing becomes a lighter blue-gray at the edge. The blue
  // bias separates it from the red brush strokes that share this region.
  return red < 185 && green < 195 && blue < 210
    && blue >= red + 8
    && green >= red - 8;
}

function buildLogoLock(image, region, ink) {
  const lock = document.createElement('canvas');
  lock.width = SIZE;
  lock.height = SIZE;
  if (!region || !LOGO_COLORS[ink]) return lock;

  const source = document.createElement('canvas');
  source.width = SIZE;
  source.height = SIZE;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  drawNativeArtwork(sourceContext, image);
  const sourceData = sourceContext.getImageData(0, 0, SIZE, SIZE).data;
  const lockData = new Uint8ClampedArray(SIZE * SIZE * 4);
  const [inkRed, inkGreen, inkBlue] = LOGO_COLORS[ink];
  const startX = Math.max(0, Math.floor(region.x));
  const startY = Math.max(0, Math.floor(region.y));
  const endX = Math.min(SIZE, Math.ceil(region.x + region.width));
  const endY = Math.min(SIZE, Math.ceil(region.y + region.height));

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * SIZE + x) * 4;
      const alpha = sourceData[offset + 3];
      if (alpha === 0) continue;
      if (!isLogoInkPixel(sourceData[offset], sourceData[offset + 1], sourceData[offset + 2], ink)) continue;

      // Keep the official logo color, but make the anti-aliased edge opaque so
      // the user's photo can never show through the wordmark.
      lockData[offset] = inkRed;
      lockData[offset + 1] = inkGreen;
      lockData[offset + 2] = inkBlue;
      lockData[offset + 3] = 255;
    }
  }

  lock.getContext('2d').putImageData(new ImageData(lockData, SIZE, SIZE), 0, 0);
  return lock;
}

function isHeadlineInkPixel(red, green, blue, alpha) {
  if (alpha === 0) return false;
  // The headline is the only near-white artwork inside its narrow region.
  // The red/yellow background and textured brush colours have a much larger
  // channel spread, so they remain untouched.
  return Math.min(red, green, blue) > 120
    && Math.max(red, green, blue) - Math.min(red, green, blue) < 100;
}

function buildHeadlineArtwork(image, region, color) {
  const artwork = document.createElement('canvas');
  artwork.width = SIZE;
  artwork.height = SIZE;
  const artworkContext = artwork.getContext('2d', { willReadFrequently: true });
  drawNativeArtwork(artworkContext, image);
  const headlineColor = HEADLINE_COLORS[color];
  if (!region || !headlineColor) return artwork;

  const artworkData = artworkContext.getImageData(0, 0, SIZE, SIZE);
  const [red, green, blue] = headlineColor;
  const startX = Math.max(0, Math.floor(region.x));
  const startY = Math.max(0, Math.floor(region.y));
  const endX = Math.min(SIZE, Math.ceil(region.x + region.width));
  const endY = Math.min(SIZE, Math.ceil(region.y + region.height));

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * SIZE + x) * 4;
      if (!isHeadlineInkPixel(
        artworkData.data[offset],
        artworkData.data[offset + 1],
        artworkData.data[offset + 2],
        artworkData.data[offset + 3],
      )) continue;
      artworkData.data[offset] = red;
      artworkData.data[offset + 1] = green;
      artworkData.data[offset + 2] = blue;
    }
  }

  artworkContext.putImageData(artworkData, 0, 0);
  return artwork;
}

function buildOpeningMask(image, center, counterRegion) {
  const source = document.createElement('canvas');
  source.width = SIZE;
  source.height = SIZE;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  // Keep the source artwork at native resolution. Modelo 3 is 1081 px wide;
  // use an integer crop instead of a half-pixel draw, which would soften the
  // alpha of the wordmark and make white letters look translucent.
  drawNativeArtwork(sourceContext, image);
  const sourceData = sourceContext.getImageData(0, 0, SIZE, SIZE).data;
  const pixelCount = SIZE * SIZE;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const maskData = new Uint8ClampedArray(pixelCount * 4);
  const startX = Math.max(0, Math.min(SIZE - 1, Math.round(center.x)));
  const startY = Math.max(0, Math.min(SIZE - 1, Math.round(center.y)));
  let head = 0;
  let tail = 0;
  const start = startY * SIZE + startX;
  let maxDistanceSquared = 0;
  if (sourceData[start * 4 + 3] < MASK_ALPHA_THRESHOLD) {
    queue[tail] = start;
    tail += 1;
    visited[start] = 1;
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const alphaOffset = index * 4;
    const x = index % SIZE;
    const distanceX = x - startX;
    const distanceY = Math.floor(index / SIZE) - startY;
    maxDistanceSquared = Math.max(maxDistanceSquared, distanceX * distanceX + distanceY * distanceY);
    maskData[alphaOffset] = 255;
    maskData[alphaOffset + 1] = 255;
    maskData[alphaOffset + 2] = 255;
    // Keep the PNG's antialiasing at the edge of the transparent opening.
    maskData[alphaOffset + 3] = 255 - sourceData[alphaOffset + 3];
    const neighbours = x > 0 ? [index - 1] : [];
    if (x < SIZE - 1) neighbours.push(index + 1);
    if (index >= SIZE) neighbours.push(index - SIZE);
    if (index < pixelCount - SIZE) neighbours.push(index + SIZE);
    neighbours.forEach((neighbour) => {
      if (!visited[neighbour] && sourceData[neighbour * 4 + 3] < MASK_ALPHA_THRESHOLD) {
        visited[neighbour] = 1;
        queue[tail] = neighbour;
        tail += 1;
      }
    });
  }

  const mask = document.createElement('canvas');
  mask.width = SIZE;
  mask.height = SIZE;
  mask.getContext('2d').putImageData(new ImageData(maskData, SIZE, SIZE), 0, 0);
  return {
    mask,
    counterMask: buildEnclosedMask(sourceData, counterRegion),
    radius: Math.sqrt(maxDistanceSquared),
  };
}

function buildEnclosedMask(sourceData, region) {
  const mask = document.createElement('canvas');
  mask.width = SIZE;
  mask.height = SIZE;
  if (!region) return mask;

  const startX = Math.max(0, Math.floor(region.x));
  const startY = Math.max(0, Math.floor(region.y));
  const endX = Math.min(SIZE, Math.ceil(region.x + region.width));
  const endY = Math.min(SIZE, Math.ceil(region.y + region.height));
  const regionWidth = Math.max(0, endX - startX);
  const regionHeight = Math.max(0, endY - startY);
  if (!regionWidth || !regionHeight) return mask;

  const visited = new Uint8Array(regionWidth * regionHeight);
  const queue = new Int32Array(regionWidth * regionHeight);
  const maskData = new Uint8ClampedArray(SIZE * SIZE * 4);
  const isTransparent = (x, y) => sourceData[(y * SIZE + x) * 4 + 3] < MASK_ALPHA_THRESHOLD;
  const localIndex = (x, y) => (y - startY) * regionWidth + (x - startX);

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const seed = localIndex(x, y);
      if (visited[seed] || !isTransparent(x, y)) continue;

      let head = 0;
      let tail = 0;
      let touchesRegionEdge = false;
      const component = [];
      queue[tail] = seed;
      tail += 1;
      visited[seed] = 1;

      while (head < tail) {
        const current = queue[head];
        head += 1;
        const currentX = startX + (current % regionWidth);
        const currentY = startY + Math.floor(current / regionWidth);
        component.push(current);
        if (currentX === startX || currentX === endX - 1 || currentY === startY || currentY === endY - 1) {
          touchesRegionEdge = true;
        }

        const neighbours = [];
        if (currentX > startX) neighbours.push(current - 1);
        if (currentX < endX - 1) neighbours.push(current + 1);
        if (currentY > startY) neighbours.push(current - regionWidth);
        if (currentY < endY - 1) neighbours.push(current + regionWidth);
        neighbours.forEach((neighbour) => {
          if (visited[neighbour]) return;
          const neighbourX = startX + (neighbour % regionWidth);
          const neighbourY = startY + Math.floor(neighbour / regionWidth);
          if (!isTransparent(neighbourX, neighbourY)) return;
          visited[neighbour] = 1;
          queue[tail] = neighbour;
          tail += 1;
        });
      }

      // Components touching the region boundary are the large background,
      // spaces between letters, or artwork outside HUMBERTO. Only enclosed
      // counters belong to the photo aperture.
      if (touchesRegionEdge || component.length < 2) continue;
      component.forEach((current) => {
        const x = startX + (current % regionWidth);
        const y = startY + Math.floor(current / regionWidth);
        const offset = (y * SIZE + x) * 4;
        maskData[offset] = 255;
        maskData[offset + 1] = 255;
        maskData[offset + 2] = 255;
        maskData[offset + 3] = 255 - sourceData[offset + 3];
      });
    }
  }

  mask.getContext('2d').putImageData(new ImageData(maskData, SIZE, SIZE), 0, 0);
  return mask;
}

function buildPhotoMask(openingMask, radius, center, counterMask) {
  const mask = document.createElement('canvas');
  mask.width = SIZE;
  mask.height = SIZE;
  const maskContext = mask.getContext('2d');

  // The user photo belongs to a clean circular aperture. Intersecting it with
  // the PNG's central transparent component keeps the photo behind the
  // irregular brush edge and the lower campaign artwork.
  const circle = document.createElement('canvas');
  circle.width = SIZE;
  circle.height = SIZE;
  const circleContext = circle.getContext('2d');
  circleContext.beginPath();
  circleContext.arc(center.x, center.y, radius, 0, Math.PI * 2);
  circleContext.fillStyle = '#fff';
  circleContext.fill();

  maskContext.drawImage(circle, 0, 0);
  maskContext.globalCompositeOperation = 'destination-in';
  maskContext.drawImage(openingMask, 0, 0);

  if (counterMask) {
    const counterCircle = document.createElement('canvas');
    counterCircle.width = SIZE;
    counterCircle.height = SIZE;
    const counterContext = counterCircle.getContext('2d');
    counterContext.drawImage(counterMask, 0, 0);
    counterContext.globalCompositeOperation = 'destination-in';
    counterContext.drawImage(circle, 0, 0);
    maskContext.globalCompositeOperation = 'source-over';
    maskContext.drawImage(counterCircle, 0, 0);
  }
  return mask;
}

function drawPhoto(targetContext, image, frame, transform = state, radius = DEFAULT_PHOTO_RADIUS, centerX = SIZE / 2, centerY = SIZE / 2) {
  photoLayerContext.clearRect(0, 0, SIZE, SIZE);

  const drawImageCover = (coverRadius) => {
    const imageScale = Math.max((coverRadius * 2) / image.naturalWidth, (coverRadius * 2) / image.naturalHeight) * transform.zoom;
    const width = image.naturalWidth * imageScale;
    const height = image.naturalHeight * imageScale;
    const left = centerX - width / 2 + transform.x;
    const top = centerY - height / 2 + transform.y;
    photoLayerContext.drawImage(image, left, top, width, height);
  };

  drawImageCover(radius);
  applyOpeningMask(photoLayerContext, frame, radius, centerX, centerY);
  targetContext.drawImage(photoLayer, 0, 0);
}

function drawPlaceholder(targetContext, frame, radius = DEFAULT_PHOTO_RADIUS, centerX = SIZE / 2, centerY = SIZE / 2) {
  photoLayerContext.clearRect(0, 0, SIZE, SIZE);
  photoLayerContext.fillStyle = '#f8f9fa';
  photoLayerContext.fillRect(0, 0, SIZE, SIZE);
  photoLayerContext.fillStyle = '#06213C';
  photoLayerContext.textAlign = 'center';
  photoLayerContext.font = '900 34px Arial';
  photoLayerContext.fillText('CARREGUE SUA FOTO', centerX, centerY - 8);
  photoLayerContext.font = '600 22px Arial';
  photoLayerContext.fillStyle = '#6c7784';
  photoLayerContext.fillText('ela aparece aqui, atrás da moldura', centerX, centerY + 34);
  applyOpeningMask(photoLayerContext, frame, radius, centerX, centerY);
  targetContext.drawImage(photoLayer, 0, 0);
}

function applyOpeningMask(targetContext, frame, radius, centerX, centerY) {
  targetContext.save();
  targetContext.globalCompositeOperation = 'destination-in';
  if (frame.photoMask) {
    targetContext.drawImage(frame.photoMask, 0, 0);
  } else if (frame.openingMask) {
    targetContext.drawImage(frame.openingMask, 0, 0);
  } else {
    // Keep a safe fallback while assets are still loading or if a browser
    // cannot inspect image pixels.
    targetContext.beginPath();
    targetContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    targetContext.fillStyle = '#fff';
    targetContext.fill();
  }
  targetContext.restore();
}

function drawScene(targetCanvas, frameIndex = state.frameIndex, image = state.image, transform = state) {
  const targetContext = targetCanvas.getContext('2d', { alpha: false });
  const frame = frames[frameIndex];
  const center = frame.photoCenter || { x: SIZE / 2, y: SIZE / 2 };
  targetContext.clearRect(0, 0, SIZE, SIZE);
  targetContext.fillStyle = '#ffffff';
  targetContext.fillRect(0, 0, SIZE, SIZE);
  if (image) drawPhoto(targetContext, image, frame, transform, frame.photoRadius, center.x, center.y);
  else drawPlaceholder(targetContext, frame, frame.photoRadius, center.x, center.y);

  const overlay = frame.coloredOverlay || overlays.get(frame.id);
  if (overlay) {
    // Preserve the PNG's native pixels (and the requested headline colors)
    // instead of scaling a 1081 px-wide source down to the 1080 px export canvas.
    // This draw is deliberately last: no photo mask or background can make
    // the Humberto wordmark translucent or lose the model's original colours.
    const overlayWidth = Math.min(SIZE, overlay.naturalWidth || overlay.width || SIZE);
    const overlayHeight = Math.min(SIZE, overlay.naturalHeight || overlay.height || SIZE);
    targetContext.save();
    targetContext.globalAlpha = 1;
    targetContext.globalCompositeOperation = 'source-over';
    targetContext.imageSmoothingEnabled = false;
    targetContext.drawImage(
      overlay,
      0,
      0,
      overlayWidth,
      overlayHeight,
      0,
      0,
      overlayWidth,
      overlayHeight,
    );
    targetContext.restore();

    // The PNG remains the source of truth. This tiny lock layer only redraws
    // HUMBERTO's original ink pixels with opaque alpha; it prevents photo
    // colours from leaking through transparent anti-aliased edges.
    if (frame.logoLock) {
      targetContext.save();
      targetContext.globalAlpha = 1;
      targetContext.globalCompositeOperation = 'source-over';
      targetContext.imageSmoothingEnabled = false;
      targetContext.drawImage(frame.logoLock, 0, 0);
      targetContext.restore();
    }
  }
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
    button.dataset.frameId = frame.id;
    button.setAttribute('aria-pressed', String(index === state.frameIndex));
    button.setAttribute('aria-label', `${frame.name} — escolher moldura`);
    button.innerHTML = `<img src="${frame.src}" alt="" width="1080" height="1080" />`;
    button.addEventListener('click', () => {
      state.frameIndex = index;
      setStatus(`${frame.name} selecionado. Agora ajuste sua foto.`);
      render();
    });
    picker.append(button);
  });
}

function refreshFramePickerArtwork() {
  frames.forEach((frame) => {
    const artwork = frame.coloredOverlay;
    if (!artwork) return;
    const image = picker.querySelector(`[data-frame-id="${frame.id}"] img`);
    if (!image) return;
    try {
      // Keep the chooser faithful to the final composition, including the
      // model-specific headline color, while leaving source PNGs untouched.
      image.src = artwork.toDataURL('image/png');
    } catch {
      // The original PNG remains a safe fallback if a browser blocks canvas export.
    }
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

function isMobileLayout() {
  return window.matchMedia?.('(max-width: 640px)').matches === true || isMobileDevice;
}

function updateShareButtonLabel() {
  const mobile = isMobileLayout();
  if (shareButtonLabel) shareButtonLabel.textContent = mobile ? 'Salvar na galeria' : 'Compartilhar';
  if (shareButtonIcon) shareButtonIcon.textContent = mobile ? '↓' : '↗';
  if (shareBtn) shareBtn.setAttribute('aria-label', mobile ? 'Salvar imagem na galeria' : 'Compartilhar imagem');
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
          navigator.share({ title: 'Sele de Perfil', text: 'Meu apoio ao Humberto Matos', files: [file] }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('share-timeout')), 12000)),
        ]);
        setStatus(isMobileLayout()
          ? 'Imagem salva ou compartilhada pelo menu do sistema.'
          : 'Selo compartilhado. Obrigado por espalhar essa ideia.');
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
      setStatus(isMobileLayout()
        ? 'O menu de salvar não está disponível neste navegador. O PNG foi baixado; abra Downloads para guardar nas Fotos.'
        : 'Compartilhamento direto não está disponível aqui. O PNG foi baixado para você enviar.');
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
    refreshFramePickerArtwork();
    state.image = await loadImage('img/image22.png');
    render();
  } catch (error) {
    setStatus('Alguns assets não carregaram. Reabra a página para tentar novamente.', true);
    render();
  }
}

setupInstallExperience();
registerServiceWorker();
updateShareButtonLabel();
window.addEventListener('resize', updateShareButtonLabel);
init();
