class MahjongApp {
    constructor() {
        this.scoring = new MahjongScoring();
        this.currentMeld = [];
        this.completedMelds = [];
        this.pair = [];
        this.gameConditions = {};
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.meldTypeSelect = document.getElementById('meldType');
        this.kantsuTypeSelect = document.getElementById('kantsuType');
        this.currentMeldDisplay = document.getElementById('currentMeldDisplay');
        this.currentMeldTiles = document.getElementById('currentMeldTiles');
        this.completeMeldBtn = document.getElementById('completeMeld');
        this.clearMeldBtn = document.getElementById('clearMeld');
        this.completedMeldsDiv = document.getElementById('completedMelds');
        this.pairSection = document.getElementById('pairSection');
        this.pairTiles = document.getElementById('pairTiles');
        this.completePairBtn = document.getElementById('completePair');
        this.gameConditionsDiv = document.getElementById('gameConditions');
        this.calculateScoreBtn = document.getElementById('calculateScore');
        this.resetHandBtn = document.getElementById('resetHand');
        this.handAnalysisDiv = document.getElementById('handAnalysis');
        this.hanCountSpan = document.getElementById('hanCount');
        this.fuCountSpan = document.getElementById('fuCount');
        this.dealerPointsSpan = document.getElementById('dealerPoints');
        this.nonDealerPointsSpan = document.getElementById('nonDealerPoints');
    }

    bindEvents() {
        this.meldTypeSelect.addEventListener('change', () => this.onMeldTypeChange());
        this.completeMeldBtn.addEventListener('click', () => this.completeMeld());
        this.clearMeldBtn.addEventListener('click', () => this.clearCurrentMeld());
        this.completePairBtn.addEventListener('click', () => this.completePair());
        this.calculateScoreBtn.addEventListener('click', () => this.calculateScore());
        this.resetHandBtn.addEventListener('click', () => this.resetHand());
        
        document.querySelectorAll('.tile.clickable').forEach(tile => {
            tile.addEventListener('click', (e) => this.onTileClick(e.target.dataset.tile));
        });
        
        document.querySelectorAll('.sample-hand').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tiles = e.target.dataset.tiles.split(',');
                this.loadSampleHand(tiles);
            });
        });
    }

    onMeldTypeChange() {
        const meldType = this.meldTypeSelect.value;
        this.kantsuTypeSelect.style.display = meldType === 'kantsu' ? 'inline' : 'none';
        this.clearCurrentMeld();
    }

    onTileClick(tileCode) {
        if (this.completedMelds.length < 4) {
            this.addTileToCurrentMeld(tileCode);
        } else if (this.pair.length < 2) {
            this.addTileToPair(tileCode);
        }
    }

    addTileToCurrentMeld(tileCode) {
        const meldType = this.meldTypeSelect.value;
        const maxTiles = meldType === 'kantsu' ? 4 : 3;
        
        if (this.currentMeld.length < maxTiles) {
            this.currentMeld.push(tileCode);
            this.updateCurrentMeldDisplay();
            this.checkMeldCompletion();
        }
    }

    addTileToPair(tileCode) {
        if (this.pair.length < 2) {
            this.pair.push(tileCode);
            this.updatePairDisplay();
            this.completePairBtn.disabled = this.pair.length !== 2 || this.pair[0] !== this.pair[1];
        }
    }

    updateCurrentMeldDisplay() {
        const meldType = this.meldTypeSelect.value || 'shuntsu';
        const meldTypeNames = {
            'shuntsu': '順子',
            'koutsu': '刻子', 
            'kantsu': '槓子'
        };
        
        this.currentMeldDisplay.textContent = `${meldTypeNames[meldType] || '順子'} (${this.currentMeld.length}/${meldType === 'kantsu' ? 4 : 3})`;
        
        const tilesHtml = this.currentMeld.map(tile => {
            const tileName = this.scoring.getTileName(tile);
            return `<div class="tile tile-${tile}">${tileName}</div>`;
        }).join('');
        
        this.currentMeldTiles.innerHTML = tilesHtml;
    }

    checkMeldCompletion() {
        const meldType = this.meldTypeSelect.value;
        const requiredTiles = meldType === 'kantsu' ? 4 : 3;
        
        if (this.currentMeld.length === requiredTiles) {
            const isValid = this.validateMeld(this.currentMeld, meldType);
            this.completeMeldBtn.disabled = !isValid;
        } else {
            this.completeMeldBtn.disabled = true;
        }
    }

    validateMeld(tiles, meldType) {
        if (meldType === 'koutsu' || meldType === 'kantsu') {
            return tiles.every(tile => tile === tiles[0]);
        } else if (meldType === 'shuntsu') {
            const sortedTiles = [...tiles].sort();
            if (sortedTiles[0][1] !== sortedTiles[1][1] || sortedTiles[1][1] !== sortedTiles[2][1]) {
                return false;
            }
            const nums = sortedTiles.map(tile => parseInt(tile[0])).sort((a, b) => a - b);
            return nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1;
        }
        return false;
    }

    completeMeld() {
        const meldType = this.meldTypeSelect.value;
        const kantsuType = meldType === 'kantsu' ? this.kantsuTypeSelect.value : null;
        
        this.completedMelds.push({
            type: meldType,
            kantsuType: kantsuType,
            tiles: [...this.currentMeld]
        });
        
        this.clearCurrentMeld();
        this.updateCompletedMeldsDisplay();
        
        if (this.completedMelds.length === 4) {
            this.showPairSelection();
        }
    }

    clearCurrentMeld() {
        this.currentMeld = [];
        this.updateCurrentMeldDisplay();
        this.completeMeldBtn.disabled = true;
    }

    updateCompletedMeldsDisplay() {
        if (this.completedMelds.length === 0) {
            this.completedMeldsDiv.innerHTML = '<p>まだメンツがありません (4つのメンツが必要)</p>';
            return;
        }
        
        const meldsHtml = this.completedMelds.map((meld, index) => {
            const meldTypeNames = {
                'shuntsu': '順子',
                'koutsu': '刻子',
                'kantsu': meld.kantsuType === 'ankan' ? '暗槓' : '明槓'
            };
            
            const tilesHtml = meld.tiles.map(tile => {
                const tileName = this.scoring.getTileName(tile);
                return `<div class="tile tile-${tile}">${tileName}</div>`;
            }).join('');
            
            return `
                <div class="completed-meld">
                    <h4>${meldTypeNames[meld.type]} ${index + 1}</h4>
                    <div class="meld-tiles">${tilesHtml}</div>
                    <button onclick="app.removeMeld(${index})">削除</button>
                </div>
            `;
        }).join('');
        
        this.completedMeldsDiv.innerHTML = meldsHtml;
    }

    removeMeld(index) {
        this.completedMelds.splice(index, 1);
        this.updateCompletedMeldsDisplay();
        this.hidePairSelection();
        this.hideGameConditions();
    }

    showPairSelection() {
        this.pairSection.style.display = 'block';
        this.updatePairDisplay();
    }

    hidePairSelection() {
        this.pairSection.style.display = 'none';
        this.pair = [];
    }

    updatePairDisplay() {
        const tilesHtml = this.pair.map(tile => {
            const tileName = this.scoring.getTileName(tile);
            return `<div class="tile tile-${tile}">${tileName}</div>`;
        }).join('');
        
        this.pairTiles.innerHTML = tilesHtml || '<p>2枚の同じ牌を選択してください</p>';
    }

    completePair() {
        if (this.pair.length === 2 && this.pair[0] === this.pair[1]) {
            this.showGameConditions();
        }
    }

    showGameConditions() {
        this.gameConditionsDiv.style.display = 'block';
    }

    hideGameConditions() {
        this.gameConditionsDiv.style.display = 'none';
    }

    calculateScore() {
        const allTiles = [];
        
        this.completedMelds.forEach(meld => {
            allTiles.push(...meld.tiles);
        });
        
        allTiles.push(...this.pair);
        
        const conditions = {
            riichi: document.getElementById('riichi').checked,
            doubleRiichi: document.getElementById('doubleRiichi').checked,
            ippatsu: document.getElementById('ippatsu').checked,
            tsumo: document.getElementById('tsumo').checked,
            haitei: document.getElementById('haitei').checked,
            houtei: document.getElementById('houtei').checked,
            rinshan: document.getElementById('rinshan').checked,
            chankan: document.getElementById('chankan').checked,
            roundWind: document.getElementById('roundWind').value,
            seatWind: document.getElementById('seatWind').value,
            melds: this.completedMelds
        };
        
        const analysis = this.scoring.analyzeHand(allTiles, conditions);
        this.updateScoring(analysis);
    }

    updateScoring(analysis) {
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

    resetHand() {
        this.currentMeld = [];
        this.completedMelds = [];
        this.pair = [];
        this.clearCurrentMeld();
        this.updateCompletedMeldsDisplay();
        this.hidePairSelection();
        this.hideGameConditions();
        
        document.querySelectorAll('#gameConditions input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    loadSampleHand(tiles) {
        this.resetHand();
        alert('サンプル手牌機能は手動選択モードでは利用できません。手動でメンツを作成してください。');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MahjongApp();
});
