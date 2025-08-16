// Variabel global untuk aplikasi
let canvas, ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushSize = 5;
let brushColor = '#000000';
let isEraserMode = false;
let eraserBtn;
let drawingHistory = [];
let historyIndex = -1;

// Elemen DOM yang akan digunakan
let colorPicker, brushSizeSlider, brushSizeValue;
let clearBtn, saveBtn, brushCursor;

function saveCanvasState() {
    if (historyIndex < drawingHistory.length - 1) {
        drawingHistory = drawingHistory.slice(0, historyIndex + 1);
    }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawingHistory.push(imageData);
    historyIndex++;
    
    if (drawingHistory.length > 50) {
        drawingHistory.shift();
        historyIndex--;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreCanvasState();
}

function redo() {
    if (historyIndex >= drawingHistory.length - 1) return;
    historyIndex++;
    restoreCanvasState();
}

function restoreCanvasState() {
    ctx.putImageData(drawingHistory[historyIndex], 0, 0);
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= drawingHistory.length - 1;
    
    undoBtn.classList.toggle('opacity-50', undoBtn.disabled);
    redoBtn.classList.toggle('opacity-50', redoBtn.disabled);
    undoBtn.classList.toggle('cursor-not-allowed', undoBtn.disabled);
    redoBtn.classList.toggle('cursor-not-allowed', redoBtn.disabled);
}

function toggleEraser() {
    isEraserMode = !isEraserMode;

    if (isEraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
        eraserBtn.classList.add('bg-red-500', 'text-white');
        eraserBtn.classList.remove('bg-gray-200', 'text-gray-800');
        showNotification('Mode penghapus aktif', 'info');
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        eraserBtn.classList.remove('bg-red-500', 'text-white');
        eraserBtn.classList.add('bg-gray-200', 'text-gray-800');
        showNotification('Mode penghapus dimatikan', 'info');
    }
}

function initApp() {
    console.log('🚀 Inisialisasi Drawing App...');
    
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    colorPicker = document.getElementById('colorPicker');
    brushSizeSlider = document.getElementById('brushSize');
    brushSizeValue = document.getElementById('brushSizeValue');
    clearBtn = document.getElementById('clearBtn');
    saveBtn = document.getElementById('saveBtn');
    brushCursor = document.getElementById('brushCursor');
    eraserBtn = document.getElementById('eraserBtn');
    eraserBtn.addEventListener('click', toggleEraser);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);

    setupCanvas();
    setupEventListeners();
    setupDrawingContext();
}

function setupCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, container.clientWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 300);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Create a colorful background instead of plain white
    createCanvasBackground();
    
    saveCanvasState();
}

function createCanvasBackground() {
    // Paper texture
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some paper texture noise
    for (let i = 0; i < canvas.width * canvas.height / 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function setupEventListeners() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    colorPicker.addEventListener('change', updateBrushColor);
    brushSizeSlider.addEventListener('input', updateBrushSize);
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveAsPNG);
    
    canvas.addEventListener('mousemove', updateBrushCursor);
    canvas.addEventListener('mouseenter', showBrushCursor);
    canvas.addEventListener('mouseleave', hideBrushCursor);
}

function setupDrawingContext() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getMousePos(canvas, e);
}

function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    
    const [currentX, currentY] = getMousePos(canvas, e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    if (isDrawing) {
        saveCanvasState();
    }
    isDrawing = false;
}

function getMousePos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
    ];
}

function updateBrushColor(e) {
    brushColor = e.target.value;
    ctx.strokeStyle = brushColor;
    brushCursor.style.borderColor = brushColor;
}

function updateBrushSize(e) {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
    ctx.lineWidth = brushSize;
    updateBrushCursorSize();
}

function showBrushCursor() {
    brushCursor.style.display = 'block';
}

function hideBrushCursor() {
    brushCursor.style.display = 'none';
}

function updateBrushCursor(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    brushCursor.style.left = x + 'px';
    brushCursor.style.top = y + 'px';
    brushCursor.style.width = brushSize + 'px';
    brushCursor.style.height = brushSize + 'px';
    brushCursor.style.borderColor = brushColor;
}

function updateBrushCursorSize() {
    brushCursor.style.width = brushSize + 'px';
    brushCursor.style.height = brushSize + 'px';
}

function clearCanvas() {
    if (confirm('Apakah Anda yakin ingin menghapus semua gambar?')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveCanvasState();
    }
}

function saveAsPNG() {
    try {
        const link = document.createElement('a');
        link.download = `drawing-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Gambar berhasil disimpan!', 'success');
    } catch (error) {
        console.error('❌ Error saat menyimpan gambar:', error);
        showNotification('Gagal menyimpan gambar. Silakan coba lagi.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-5 right-5 px-4 py-3 rounded-md text-white font-semibold z-50 animate-slide-in ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('animate-slide-in');
        notification.classList.add('animate-slide-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    initApp();
    window.addEventListener('resize', setupCanvas);
});

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAsPNG();
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        clearCanvas();
    }
    
    if (e.key === 'Escape') {
        isDrawing = false;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});