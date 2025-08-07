// ========================================
// DRAWING APP - JAVASCRIPT
// ========================================

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
    // Hapus semua state setelah historyIndex (jika ada)
    if (historyIndex < drawingHistory.length - 1) {
        drawingHistory = drawingHistory.slice(0, historyIndex + 1);
    }
    
    // Simpan state canvas saat ini
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawingHistory.push(imageData);
    historyIndex++;
    
    // Batasi jumlah history untuk menghindari memory leak
    if (drawingHistory.length > 50) {
        drawingHistory.shift();
        historyIndex--;
    }
    
    // Update status tombol
    updateUndoRedoButtons();
    
    console.log('💾 State canvas disimpan. History:', drawingHistory.length, 'Index:', historyIndex);
}

// Fungsi untuk mengembalikan ke state sebelumnya (undo)
function undo() {
    if (historyIndex <= 0) return; // Tidak ada yang bisa di-undo
    
    historyIndex--;
    restoreCanvasState();
    console.log('↩️ Undo ke index:', historyIndex);
}

// Fungsi untuk mengulang state yang di-undo (redo)
function redo() {
    if (historyIndex >= drawingHistory.length - 1) return; // Tidak ada yang bisa di-redo
    
    historyIndex++;
    restoreCanvasState();
    console.log('↪️ Redo ke index:', historyIndex);
}

// Fungsi untuk mengembalikan canvas ke state yang disimpan
function restoreCanvasState() {
    ctx.putImageData(drawingHistory[historyIndex], 0, 0);
    updateUndoRedoButtons();
}

// Fungsi untuk mengupdate status tombol undo/redo
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= drawingHistory.length - 1;
    
    // Tambahkan styling untuk tombol yang disabled
    undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
    redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
    undoBtn.style.cursor = undoBtn.disabled ? 'not-allowed' : 'pointer';
    redoBtn.style.cursor = redoBtn.disabled ? 'not-allowed' : 'pointer';
}


function toggleEraser() {
    isEraserMode = !isEraserMode;

    if (isEraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
        eraserBtn.classList.add('btn-danger');
        showNotification('Mode penghapus aktif', 'info');
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        eraserBtn.classList.remove('btn-danger');
        showNotification('Mode penghapus dimatikan', 'info');
    }
}


// Fungsi inisialisasi aplikasi
function initApp() {
    console.log('🚀 Inisialisasi Drawing App...');
    
    // Mendapatkan referensi elemen canvas dan context
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    // Mendapatkan referensi elemen-elemen kontrol
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

    // Setup canvas
    setupCanvas();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup drawing context
    setupDrawingContext();
    
    console.log('✅ Drawing App siap digunakan!');
}

// Setup canvas dengan ukuran yang responsif
function setupCanvas() {
    // Mengatur ukuran canvas agar responsif
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, container.clientWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 300);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Mengisi canvas dengan warna putih
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    saveCanvasState();
    
    console.log(`📐 Canvas diatur dengan ukuran: ${canvas.width}x${canvas.height}`);
}

// Setup event listeners untuk semua interaksi
function setupEventListeners() {
    // Event listeners untuk canvas
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Event listeners untuk toolbar
    colorPicker.addEventListener('change', updateBrushColor);
    brushSizeSlider.addEventListener('input', updateBrushSize);
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveAsPNG);
    
    // Event listeners untuk kursor custom
    canvas.addEventListener('mousemove', updateBrushCursor);
    canvas.addEventListener('mouseenter', showBrushCursor);
    canvas.addEventListener('mouseleave', hideBrushCursor);
    
    console.log('🎯 Event listeners berhasil diatur');
}

// Setup context menggambar dengan pengaturan default
function setupDrawingContext() {
    ctx.lineCap = 'round';        // Ujung garis berbentuk bulat
    ctx.lineJoin = 'round';       // Sambungan garis berbentuk bulat
    ctx.strokeStyle = brushColor; // Warna garis
    ctx.lineWidth = brushSize;    // Lebar garis
    ctx.globalCompositeOperation = 'source-over'; // Mode blending normal
}

// ========================================
// FUNGSI MENGGAMBAR
// ========================================

// Mulai menggambar saat mouse ditekan
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getMousePos(canvas, e);
    console.log('🎨 Mulai menggambar di posisi:', lastX, lastY);
}

// Fungsi menggambar saat mouse bergerak
function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    
    const [currentX, currentY] = getMousePos(canvas, e);
    
    // Menggambar garis dari posisi terakhir ke posisi saat ini
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    // Update posisi terakhir
    [lastX, lastY] = [currentX, currentY];
}

// Berhenti menggambar saat mouse dilepas
function stopDrawing() {
    if (isDrawing) {
        saveCanvasState();
    }
    isDrawing = false;
    console.log('⏹️ Berhenti menggambar');
}

// Mendapatkan posisi mouse relatif terhadap canvas
function getMousePos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
    ];
}

// ========================================
// FUNGSI KONTROL KUAS
// ========================================

// Update warna kuas
function updateBrushColor(e) {
    brushColor = e.target.value;
    ctx.strokeStyle = brushColor;
    console.log('🎨 Warna kuas diubah ke:', brushColor);
}

// Update ukuran kuas
function updateBrushSize(e) {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
    ctx.lineWidth = brushSize;
    
    // Update ukuran kursor custom
    updateBrushCursorSize();
    
    console.log('📏 Ukuran kuas diubah ke:', brushSize, 'px');
}

// ========================================
// FUNGSI KURSOR CUSTOM
// ========================================

// Menampilkan kursor custom
function showBrushCursor() {
    brushCursor.style.display = 'block';
}

// Menyembunyikan kursor custom
function hideBrushCursor() {
    brushCursor.style.display = 'none';
}

// Update posisi kursor custom
function updateBrushCursor(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    brushCursor.style.left = (x - brushSize/2) + 'px';
    brushCursor.style.top = (y - brushSize/2) + 'px';
    brushCursor.style.width = brushSize + 'px';
    brushCursor.style.height = brushSize + 'px';
    brushCursor.style.borderColor = brushColor;
}

// Update ukuran kursor custom
function updateBrushCursorSize() {
    brushCursor.style.width = brushSize + 'px';
    brushCursor.style.height = brushSize + 'px';
}

// ========================================
// FUNGSI UTILITAS
// ========================================

// Membersihkan canvas
function clearCanvas() {
    if (confirm('Apakah Anda yakin ingin menghapus semua gambar?')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveCanvasState(); // Simpan state setelah clear
        console.log('🗑️ Canvas berhasil dibersihkan');
    }
}

// Menyimpan gambar sebagai PNG
function saveAsPNG() {
    try {
        // Membuat link untuk download
        const link = document.createElement('a');
        link.download = `drawing-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        
        // Mengkonversi canvas ke data URL
        link.href = canvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('💾 Gambar berhasil disimpan sebagai PNG');
        
        // Menampilkan notifikasi sukses
        showNotification('Gambar berhasil disimpan!', 'success');
        
    } catch (error) {
        console.error('❌ Error saat menyimpan gambar:', error);
        showNotification('Gagal menyimpan gambar. Silakan coba lagi.', 'error');
    }
}

// Menampilkan notifikasi
function showNotification(message, type = 'info') {
    // Membuat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styling notifikasi
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background: linear-gradient(135deg, #51cf66, #40c057);' : 
          type === 'error' ? 'background: linear-gradient(135deg, #ff6b6b, #ee5a52);' : 
          'background: linear-gradient(135deg, #667eea, #764ba2);'}
    `;
    
    // Menambahkan CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Menambahkan ke body
    document.body.appendChild(notification);
    
    // Menghapus notifikasi setelah 3 detik
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========================================
// FUNGSI RESPONSIVE
// ========================================

// Handle resize window untuk canvas yang responsif
function handleResize() {
    setupCanvas();
    console.log('📱 Canvas di-resize untuk responsif');
}

// ========================================
// INISIALISASI APLIKASI
// ========================================

// Menunggu DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM selesai dimuat');
    initApp();
    
    // Menambahkan event listener untuk resize window
    window.addEventListener('resize', handleResize);
});

// Menambahkan event listener untuk keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S untuk save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAsPNG();
    }
    
    // Delete atau Backspace untuk clear canvas
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        clearCanvas();
    }
    
    // Escape untuk berhenti menggambar
    if (e.key === 'Escape') {
        isDrawing = false;
    }
    // Ctrl/Cmd + Z untuk undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    
    // Ctrl/Cmd + Y untuk redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});

console.log('🎨 Drawing App JavaScript loaded successfully!'); 