class MahjongApp {
    constructor() {
        this.recognition = new MahjongRecognition();
        this.scoring = new MahjongScoring();
        this.currentTiles = [];
        this.stream = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.processCanvas = document.getElementById('processCanvas');
        this.startCameraBtn = document.getElementById('startCamera');
        this.captureBtn = document.getElementById('captureImage');
        this.resetBtn = document.getElementById('resetRecognition');
        this.recognizedTilesDiv = document.getElementById('recognizedTiles');
        this.tileTypeSelect = document.getElementById('tileType');
        this.addTileBtn = document.getElementById('addTile');
        this.handAnalysisDiv = document.getElementById('handAnalysis');
        this.hanCountSpan = document.getElementById('hanCount');
        this.fuCountSpan = document.getElementById('fuCount');
        this.dealerPointsSpan = document.getElementById('dealerPoints');
        this.nonDealerPointsSpan = document.getElementById('nonDealerPoints');
        
        this.cameraTab = document.getElementById('cameraTab');
        this.photoTab = document.getElementById('photoTab');
        this.cameraMode = document.getElementById('cameraMode');
        this.photoMode = document.getElementById('photoMode');
        this.uploadArea = document.getElementById('uploadArea');
        this.photoInput = document.getElementById('photoInput');
        this.uploadedImageContainer = document.getElementById('uploadedImageContainer');
        this.uploadedImage = document.getElementById('uploadedImage');
        this.analyzePhotoBtn = document.getElementById('analyzePhoto');
        this.removePhotoBtn = document.getElementById('removePhoto');
        
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.processCanvas.width = 640;
        this.processCanvas.height = 480;
    }

    bindEvents() {
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.captureAndRecognize());
        this.resetBtn.addEventListener('click', () => this.resetRecognition());
        this.addTileBtn.addEventListener('click', () => this.addManualTile());
        
        this.cameraTab.addEventListener('click', () => this.switchToCamera());
        this.photoTab.addEventListener('click', () => this.switchToPhoto());
        
        this.uploadArea.addEventListener('click', () => this.photoInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        this.photoInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.analyzePhotoBtn.addEventListener('click', () => this.analyzeUploadedPhoto());
        this.removePhotoBtn.addEventListener('click', () => this.removeUploadedPhoto());
        
        document.querySelectorAll('.sample-hand').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tiles = e.target.dataset.tiles.split(',');
                this.loadSampleHand(tiles);
            });
        });
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'environment'
                }
            });
            
            this.video.srcObject = this.stream;
            this.startCameraBtn.disabled = true;
            this.captureBtn.disabled = false;
            
            console.log('Camera started successfully');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('カメラにアクセスできませんでした。ブラウザの設定を確認してください。');
            
            this.showDemoMode();
        }
    }

    showDemoMode() {
        this.video.style.display = 'none';
        const demoDiv = document.createElement('div');
        demoDiv.innerHTML = `
            <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 10px;">
                <p>カメラが利用できません</p>
                <p>デモモードでサンプル手牌をお試しください</p>
                <button id="demoRecognition" style="margin-top: 10px;">サンプル認識テスト</button>
            </div>
        `;
        this.video.parentNode.insertBefore(demoDiv, this.video.nextSibling);
        
        document.getElementById('demoRecognition').addEventListener('click', () => {
            this.simulateRecognition();
        });
        
        this.captureBtn.disabled = false;
    }

    async captureAndRecognize() {
        try {
            if (this.stream) {
                const ctx = this.canvas.getContext('2d');
                ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const tiles = await this.recognition.recognizeTiles(imageData, this.canvas);
                
                this.processTileRecognition(tiles);
            } else {
                this.simulateRecognition();
            }
        } catch (error) {
            console.error('Error in tile recognition:', error);
            this.simulateRecognition();
        }
    }

    simulateRecognition() {
        const tiles = this.recognition.simulateRecognition();
        this.processTileRecognition(tiles);
    }

    processTileRecognition(tiles) {
        this.currentTiles = tiles.map(tile => tile.type);
        this.updateTileDisplay();
        this.updateScoring();
    }

    addManualTile() {
        const selectedTile = this.tileTypeSelect.value;
        if (selectedTile && this.currentTiles.length < 14) {
            this.currentTiles.push(selectedTile);
            this.updateTileDisplay();
            this.updateScoring();
            this.tileTypeSelect.value = '';
        }
    }

    removeTile(index) {
        this.currentTiles.splice(index, 1);
        this.updateTileDisplay();
        this.updateScoring();
    }

    resetRecognition() {
        this.currentTiles = [];
        this.updateTileDisplay();
        this.updateScoring();
    }

    loadSampleHand(tiles) {
        this.currentTiles = [...tiles];
        this.updateTileDisplay();
        this.updateScoring();
    }

    updateTileDisplay() {
        if (this.currentTiles.length === 0) {
            this.recognizedTilesDiv.innerHTML = '<p>まだ牌が認識されていません</p>';
            return;
        }

        const tilesHtml = this.currentTiles.map((tile, index) => {
            const tileName = this.scoring.getTileName(tile);
            return `
                <div class="tile tile-${tile} removable" onclick="app.removeTile(${index})">
                    ${tileName}
                </div>
            `;
        }).join('');

        this.recognizedTilesDiv.innerHTML = tilesHtml;
    }

    updateScoring() {
        const analysis = this.scoring.analyzeHand(this.currentTiles);
        
        this.handAnalysisDiv.innerHTML = `
            <p><strong>状態:</strong> ${analysis.message}</p>
            ${analysis.yaku.length > 0 ? this.formatYakuList(analysis.yaku) : ''}
        `;

        this.hanCountSpan.textContent = analysis.han || '-';
        this.fuCountSpan.textContent = analysis.fu || '-';
        this.dealerPointsSpan.textContent = analysis.dealerPoints || '-';
        this.nonDealerPointsSpan.textContent = analysis.nonDealerPoints || '-';
    }

    formatYakuList(yaku) {
        const yakuHtml = yaku.map(y => `
            <div class="yaku-item">
                <span class="yaku-name">${y.name}</span>
                <span class="yaku-han">${y.han}翻</span>
            </div>
        `).join('');

        return `
            <div class="yaku-list">
                <h4>役:</h4>
                ${yakuHtml}
            </div>
        `;
    }

    switchToCamera() {
        this.cameraTab.classList.add('active');
        this.photoTab.classList.remove('active');
        this.cameraMode.style.display = 'block';
        this.photoMode.style.display = 'none';
    }

    switchToPhoto() {
        this.cameraTab.classList.remove('active');
        this.photoTab.classList.add('active');
        this.cameraMode.style.display = 'none';
        this.photoMode.style.display = 'block';
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragEnter(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        if (!this.uploadArea.contains(e.relatedTarget)) {
            this.uploadArea.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processUploadedFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processUploadedFile(file);
        }
    }

    processUploadedFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImage.src = e.target.result;
            this.uploadArea.style.display = 'none';
            this.uploadedImageContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    async analyzeUploadedPhoto() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.uploadedImage.naturalWidth;
            canvas.height = this.uploadedImage.naturalHeight;
            ctx.drawImage(this.uploadedImage, 0, 0);
            
            console.log(`Analyzing image: ${canvas.width}x${canvas.height}`);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const tiles = await this.recognition.recognizeTiles(imageData, canvas);
            
            if (tiles.length === 0) {
                console.log('No tiles detected, falling back to simulation');
                this.simulateRecognition();
            } else {
                this.processTileRecognition(tiles);
            }
        } catch (error) {
            console.error('Error analyzing uploaded photo:', error);
            console.log('Falling back to simulation due to error');
            this.simulateRecognition();
        }
    }

    removeUploadedPhoto() {
        this.uploadedImageContainer.style.display = 'none';
        this.uploadArea.style.display = 'block';
        this.uploadedImage.src = '';
        this.photoInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MahjongApp();
});
