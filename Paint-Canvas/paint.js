// ===== CANVAS PAINT STUDIO - app.js =====

const mainCanvas = document.getElementById('mainCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = mainCanvas.getContext('2d');
const octx = overlayCanvas.getContext('2d');
const wrapper = document.getElementById('canvasWrapper');

// ===== STATE =====
let tool = 'pencil';
let isDrawing = false;
let startX, startY;
let color = '#ff3b5c';
let brushSize = 6;
let opacity = 1;
let blendMode = 'source-over';
let bgColor = '#ffffff';
let undoStack = [];
let redoStack = [];
let lastX, lastY;

const SWATCH_PALETTE = [
  '#ff3b5c','#ff6b35','#ffd700','#00e5ff','#a855f7',
  '#ffffff','#e8e8f0','#6b6b80','#2e2e3e','#0f0f13',
  '#00ff88','#ff00aa','#ff8c00','#0080ff','#ff4500',
  '#8b0000','#006400','#00008b','#4b0082','#808000',
];

// ===== INIT CANVAS =====
function resizeCanvas() {
  const rect = wrapper.getBoundingClientRect();
  const W = Math.floor(rect.width * 0.88);
  const H = Math.floor(rect.height * 0.88);

  const snapshot = mainCanvas.toDataURL();

  mainCanvas.width = W;
  mainCanvas.height = H;
  overlayCanvas.width = W;
  overlayCanvas.height = H;

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  const img = new Image();
  img.onload = () => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0);
  };
  img.src = snapshot;
}

// ===== SAVE/UNDO =====
function saveState() {
  undoStack.push(mainCanvas.toDataURL());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(mainCanvas.toDataURL());
  restoreState(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(mainCanvas.toDataURL());
  restoreState(redoStack.pop());
}

function restoreState(dataURL) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataURL;
}

// ===== DRAWING =====
function getPos(e) {
  const rect = mainCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function setCtxStyle(context) {
  context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : blendMode;
  context.globalAlpha = opacity;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = brushSize;
  context.lineCap = 'round';
  context.lineJoin = 'round';
}

function startDraw(e) {
  e.preventDefault();
  const { x, y } = getPos(e);
  isDrawing = true;
  startX = x; startY = y;
  lastX = x; lastY = y;

  saveState();
  setCtxStyle(ctx);

  if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  }

  if (tool === 'fill') {
    floodFill(Math.round(x), Math.round(y));
  }
}

function draw(e) {
  e.preventDefault();
  if (!isDrawing) return;
  const { x, y } = getPos(e);

  document.getElementById('coordsDisplay').textContent =
    `x: ${Math.round(x)} | y: ${Math.round(y)}`;

  setCtxStyle(ctx);

  if (tool === 'pencil') {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  }

  if (tool === 'brush') {
    ctx.globalAlpha = opacity * 0.4;
    ctx.lineWidth = brushSize * 2;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = opacity * 0.8;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  }

  if (tool === 'spray') {
    const density = brushSize * 3;
    ctx.globalAlpha = opacity * 0.05;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * brushSize * 1.5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (tool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  }

  // Overlay preview for shapes
  if (tool === 'line' || tool === 'rect' || tool === 'circle') {
    octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    setCtxStyle(octx);
    octx.beginPath();

    if (tool === 'line') {
      octx.moveTo(startX, startY);
      octx.lineTo(x, y);
      octx.stroke();
    }
    if (tool === 'rect') {
      octx.strokeRect(startX, startY, x - startX, y - startY);
    }
    if (tool === 'circle') {
      const rx = Math.abs(x - startX) / 2;
      const ry = Math.abs(y - startY) / 2;
      const cx = Math.min(startX, x) + rx;
      const cy = Math.min(startY, y) + ry;
      octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      octx.stroke();
    }
  }
}

function endDraw(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const pos = e.changedTouches
    ? { x: e.changedTouches[0].clientX - mainCanvas.getBoundingClientRect().left,
        y: e.changedTouches[0].clientY - mainCanvas.getBoundingClientRect().top }
    : getPos(e);
  const { x, y } = pos;

  setCtxStyle(ctx);

  if (tool === 'line') {
    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(x, y); ctx.stroke();
  }
  if (tool === 'rect') {
    ctx.strokeRect(startX, startY, x - startX, y - startY);
  }
  if (tool === 'circle') {
    const rx = Math.abs(x - startX) / 2;
    const ry = Math.abs(y - startY) / 2;
    const cx = Math.min(startX, x) + rx;
    const cy = Math.min(startY, y) + ry;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

// ===== FLOOD FILL =====
function floodFill(startX, startY) {
  const imageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
  const data = imageData.data;
  const W = mainCanvas.width;
  const H = mainCanvas.height;

  const idx = (startY * W + startX) * 4;
  const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2], targetA = data[idx+3];

  const fillColor = hexToRgb(color);
  if (!fillColor) return;

  if (targetR === fillColor.r && targetG === fillColor.g && targetB === fillColor.b) return;

  const stack = [[startX, startY]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= W || y < 0 || y >= H) continue;
    const i = (y * W + x) * 4;
    if (Math.abs(data[i] - targetR) > 30 || Math.abs(data[i+1] - targetG) > 30 ||
        Math.abs(data[i+2] - targetB) > 30) continue;
    if (data[i+3] !== targetA) continue;

    data[i] = fillColor.r; data[i+1] = fillColor.g; data[i+2] = fillColor.b;
    data[i+3] = Math.round(opacity * 255);

    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null;
}

// ===== EVENTS =====
mainCanvas.addEventListener('mousedown', startDraw);
mainCanvas.addEventListener('mousemove', draw);
mainCanvas.addEventListener('mouseup', endDraw);
mainCanvas.addEventListener('mouseleave', endDraw);
mainCanvas.addEventListener('touchstart', startDraw, { passive: false });
mainCanvas.addEventListener('touchmove', draw, { passive: false });
mainCanvas.addEventListener('touchend', endDraw);

mainCanvas.addEventListener('mousemove', e => {
  const { x, y } = getPos(e);
  document.getElementById('coordsDisplay').textContent =
    `x: ${Math.round(x)} | y: ${Math.round(y)}`;
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
  if (e.key === 'e') selectTool('eraser');
  if (e.key === 'b') selectTool('brush');
  if (e.key === 'p') selectTool('pencil');
  if (e.key === 'l') selectTool('line');
  if (e.key === 'r') selectTool('rect');
  if (e.key === 'c') selectTool('circle');
  if (e.key === 'f') selectTool('fill');
  if (e.key === 's') selectTool('spray');
});

// ===== UI =====
function selectTool(t) {
  tool = t;
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === t);
  });
}

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => selectTool(btn.dataset.tool));
});

// Brush Size
document.getElementById('brushSize').addEventListener('input', function() {
  brushSize = +this.value;
  document.getElementById('sizeLabel').textContent = brushSize + 'px';
});

document.querySelectorAll('.size-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    brushSize = +btn.dataset.size;
    document.getElementById('brushSize').value = brushSize;
    document.getElementById('sizeLabel').textContent = brushSize + 'px';
  });
});

// Opacity
document.getElementById('opacityRange').addEventListener('input', function() {
  opacity = this.value / 100;
  document.getElementById('opacityLabel').textContent = this.value + '%';
});

// Color
document.getElementById('colorPicker').addEventListener('input', function() {
  color = this.value;
  document.getElementById('colorPreview').style.background = color;
  document.querySelectorAll('.swatch, .custom-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === color);
  });
});

function setColor(c) {
  color = c;
  document.getElementById('colorPicker').value = c;
  document.getElementById('colorPreview').style.background = c;
  document.querySelectorAll('.swatch, .custom-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === c);
  });
}

// Swatches
const swatchEl = document.getElementById('swatches');
SWATCH_PALETTE.forEach(c => {
  const el = document.createElement('div');
  el.className = 'swatch';
  el.style.background = c;
  el.dataset.color = c;
  el.title = c;
  el.addEventListener('click', () => setColor(c));
  swatchEl.appendChild(el);
});

// Custom swatches
document.getElementById('addSwatchBtn').addEventListener('click', () => {
  const el = document.createElement('div');
  el.className = 'custom-swatch';
  el.style.background = color;
  el.dataset.color = color;
  el.title = color;
  el.addEventListener('click', () => setColor(el.dataset.color));
  document.getElementById('customColors').appendChild(el);
});

// Background
document.querySelectorAll('.bg-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    bgColor = this.dataset.bg;
    document.getElementById('bgColorDisplay').textContent = bgColor;

    const snapshot = mainCanvas.toDataURL();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(img, 0, 0);
    };
    img.src = snapshot;
  });
});

// Blend Mode
document.getElementById('blendMode').addEventListener('change', function() {
  blendMode = this.value;
});

// Actions
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

document.getElementById('clearBtn').addEventListener('click', () => {
  saveState();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `paint-studio-${Date.now()}.png`;
  link.href = mainCanvas.toDataURL('image/png');
  link.click();
});

// ===== INIT =====
window.addEventListener('resize', () => { resizeCanvas(); });
resizeCanvas();
saveState();

// Initial bg fill
ctx.fillStyle = bgColor;
ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
