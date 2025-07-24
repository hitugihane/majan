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
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MahjongApp();
});
