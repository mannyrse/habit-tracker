// pixel-editor.js — custom stamp editor/creator

const GRID_SIZE = 32;
const CELL_SIZE = 8;

const COLORS = ['#2c2820', '#c0392b', '#2980b9'];

let pixelGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
let activeColor = COLORS[0];
let activeTool = 'pencil';
let isDrawing = false;

function initPixelEditor() {
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');

    // build color swatches
    const swatchContainer = document.getElementById('colorSwatches');
    COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch' + (color === activeColor ? ' active' : '');
        swatch.style.background = color;
        swatch.style.border = color === '#ffffff' ? '2px solid var(--grid)' : '2px solid transparent';
        swatch.addEventListener('click', () => {
            activeColor = color;
            activeTool = 'pencil';
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            document.getElementById('toolPencil').classList.add('active');
            document.getElementById('toolEraser').classList.remove('active');
        });
        swatchContainer.appendChild(swatch);
    });

    // tool buttons
    document.getElementById('toolPencil').addEventListener('click', () => {
        activeTool = 'pencil';
        document.getElementById('toolPencil').classList.add('active');
        document.getElementById('toolEraser').classList.remove('active');
    });

    document.getElementById('toolEraser').addEventListener('click', () => {
        activeTool = 'eraser';
        document.getElementById('toolEraser').classList.add('active');
        document.getElementById('toolPencil').classList.remove('active');
    });

    // drawing helpers
    function getCellFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
        const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
        return { x, y };
    }

    function paintCell(x, y) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
        pixelGrid[y][x] = activeTool === 'eraser' ? null : activeColor;
        renderPixelCanvas(ctx);
    }

    // mouse events
    canvas.addEventListener('mousedown', e => {
        isDrawing = true;
        const { x, y } = getCellFromEvent(e);
        paintCell(x, y);
    });

    canvas.addEventListener('mousemove', e => {
        if (!isDrawing) return;
        const { x, y } = getCellFromEvent(e);
        paintCell(x, y);
    });

    window.addEventListener('mouseup', () => { isDrawing = false; });

    // touch events
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        isDrawing = true;
        const { x, y } = getCellFromEvent(e.touches[0]);
        paintCell(x, y);
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!isDrawing) return;
        const { x, y } = getCellFromEvent(e.touches[0]);
        paintCell(x, y);
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDrawing = false; });

    // clear button
    document.getElementById('pixelEditorClear').addEventListener('click', () => {
        pixelGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        renderPixelCanvas(ctx);
    });

    // save button
    document.getElementById('pixelEditorSave').addEventListener('click', async () => {
        const dataUrl = exportPixelStamp();
        await saveCustomStamp(dataUrl);
        updateActiveStampPreview(dataUrl);
        closePixelEditor();
    });

    // open pixel editor button (in settings)
    document.getElementById('openPixelEditor').addEventListener('click', () => {
        const ctx2 = document.getElementById('pixelCanvas').getContext('2d');
        loadExistingStampIntoEditor(ctx2);
        openPixelEditor();
    });

    // close button
    document.getElementById('pixelEditorClose').addEventListener('click', closePixelEditor);

    // click outside to close
    document.getElementById('pixelEditorOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('pixelEditorOverlay')) closePixelEditor();
    });

    // reset to default button
    document.getElementById('resetToDefault').addEventListener('click', async () => {
        await clearCustomStamp();
        updateActiveStampPreview(null);
    });

    // initial canvas render
    renderPixelCanvas(ctx);
}

function renderPixelCanvas(ctx) {
    ctx.clearRect(0, 0, 256, 256);

    // background
    ctx.fillStyle = '#faf9f5';
    ctx.fillRect(0, 0, 256, 256);

    // grid lines
    ctx.strokeStyle = '#e8e4dc';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(256, i * CELL_SIZE);
        ctx.stroke();
    }

    // pixels
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (pixelGrid[row][col]) {
                ctx.fillStyle = pixelGrid[row][col];
                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function exportPixelStamp() {
    const offscreen = document.createElement('canvas');
    offscreen.width = GRID_SIZE * 4;   // 128px
    offscreen.height = GRID_SIZE * 4;  // 128px
    const ctx = offscreen.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (pixelGrid[row][col]) {
                ctx.fillStyle = pixelGrid[row][col];
                ctx.fillRect(col * 4, row * 4, 4, 4);
            }
        }
    }

    return offscreen.toDataURL('image/png');
}

function loadExistingStampIntoEditor(ctx) {
    const existing = getActiveStampUrl();
    if (!existing || existing === 'default') {
        pixelGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        renderPixelCanvas(ctx);
        return;
    }

    const img = new Image();
    img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = GRID_SIZE;
        offscreen.height = GRID_SIZE;
        const offCtx = offscreen.getContext('2d');
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const pixel = offCtx.getImageData(col, row, 1, 1).data;
                if (pixel[3] > 10) {
                    pixelGrid[row][col] = `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${(pixel[3] / 255).toFixed(2)})`;
                } else {
                    pixelGrid[row][col] = null;
                }
            }
        }
        renderPixelCanvas(ctx);
    };
    img.src = existing;
}

function openPixelEditor() {
    document.getElementById('pixelEditorOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePixelEditor() {
    document.getElementById('pixelEditorOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// firebase persistence

async function saveCustomStamp(dataUrl) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
        await db.collection('users').doc(userId).set(
            { customStamp: dataUrl },
            { merge: true }
        );
        window._activeStampUrl = dataUrl;
    } catch (e) {
        console.error('Error saving custom stamp:', e);
    }
}

async function clearCustomStamp() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
        await db.collection('users').doc(userId).set(
            { customStamp: null },
            { merge: true }
        );
        window._activeStampUrl = 'default';
    } catch (e) {
        console.error('Error clearing custom stamp:', e);
    }
}

async function loadCustomStamp() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
        const doc = await db.collection('users').doc(userId).get();
        const data = doc.data();
        window._activeStampUrl = data?.customStamp || 'default';
        updateActiveStampPreview(
            window._activeStampUrl === 'default' ? null : window._activeStampUrl
        );
    } catch (e) {
        console.error('Error loading custom stamp:', e);
        window._activeStampUrl = 'default';
    }
}

function getActiveStampUrl() {
    return window._activeStampUrl || 'default';
}

function updateActiveStampPreview(dataUrl) {
    const box = document.getElementById('activeStampPreview');
    if (!box) return;
    box.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl || 'images/ok.png';
    img.style.imageRendering = 'pixelated';
    box.appendChild(img);
}

// call once firebase auth is confirmed ready

function initStampSystem() {
    initPixelEditor();
    return loadCustomStamp(); // return the promise
}