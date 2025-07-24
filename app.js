class MahjongApp {
    constructor() {
        this.scoring = new MahjongScoring();
        this.handType = 'standard';
        this.currentMeld = [];
        this.completedMelds = [];
        this.pair = [];
        this.completedPairs = [];
        this.currentPair = [];
        this.kokushiTiles = [];
        this.gameConditions = {};
        this.winningTile = null;
        this.winningMethod = 'tsumo';
        
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
        
        this.standardHandSection = document.getElementById('standardHandSection');
        this.chiitoitsuHandSection = document.getElementById('chiitoitsuHandSection');
        this.kokushiHandSection = document.getElementById('kokushiHandSection');
        this.completedPairsCountSpan = document.getElementById('completedPairsCount');
        this.completedPairsListDiv = document.getElementById('completedPairsList');
        this.currentPairDisplay = document.getElementById('currentPairDisplay');
        this.currentPairTiles = document.getElementById('currentPairTiles');
        this.completePairBtnChii = document.getElementById('completePairBtn');
        this.clearPairBtn = document.getElementById('clearPairBtn');
        this.kokushiCountSpan = document.getElementById('kokushiCount');
        this.kokushiTilesDiv = document.getElementById('kokushiTiles');
        this.clearKokushiBtn = document.getElementById('clearKokushi');
        
        this.winningTileOptionsDiv = document.getElementById('winningTileOptions');
        this.selectedWinningTileSpan = document.getElementById('selectedWinningTile');
    }

    bindEvents() {
        document.querySelectorAll('input[name="handType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.onHandTypeChange(e.target.value));
        });
        
        document.querySelectorAll('input[name="winningMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.onWinningMethodChange(e.target.value));
        });
        
        this.meldTypeSelect.addEventListener('change', () => this.onMeldTypeChange());
        this.completeMeldBtn.addEventListener('click', () => this.completeMeld());
        this.clearMeldBtn.addEventListener('click', () => this.clearCurrentMeld());
        this.completePairBtn.addEventListener('click', () => this.completePair());
        this.calculateScoreBtn.addEventListener('click', () => this.calculateScore());
        this.resetHandBtn.addEventListener('click', () => this.resetHand());
        
        if (this.completePairBtnChii) {
            this.completePairBtnChii.addEventListener('click', () => this.completeChiitoitsuPair());
        }
        if (this.clearPairBtn) {
            this.clearPairBtn.addEventListener('click', () => this.clearCurrentPair());
        }
        if (this.clearKokushiBtn) {
            this.clearKokushiBtn.addEventListener('click', () => this.clearKokushi());
        }
        
        document.querySelectorAll('.tile.clickable, .tile-requirement.clickable').forEach(tile => {
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
        if (!this.meldTypeSelect.value) {
            this.meldTypeSelect.value = 'shuntsu';
        }
        
        const meldType = this.meldTypeSelect.value;
        this.kantsuTypeSelect.style.display = meldType === 'kantsu' ? 'inline' : 'none';
        this.clearCurrentMeld();
    }

    onHandTypeChange(handType) {
        this.handType = handType;
        this.resetHand();
        this.showHandWorkflow(handType);
    }

    showHandWorkflow(handType) {
        this.standardHandSection.style.display = handType === 'standard' ? 'block' : 'none';
        this.chiitoitsuHandSection.style.display = handType === 'chiitoitsu' ? 'block' : 'none';
        this.kokushiHandSection.style.display = handType === 'kokushi' ? 'block' : 'none';
    }

    onTileClick(tileCode) {
        if (this.handType === 'standard') {
            if (this.completedMelds.length < 4) {
                this.addTileToCurrentMeld(tileCode);
            } else if (this.pair.length < 2) {
                this.addTileToPair(tileCode);
            }
        } else if (this.handType === 'chiitoitsu') {
            this.addTileToCurrentPair(tileCode);
        } else if (this.handType === 'kokushi') {
            this.addTileToKokushi(tileCode);
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
        const meldSourceElement = document.querySelector('input[name="meldSource"]:checked');
        const meldSource = meldSourceElement ? meldSourceElement.value : 'tsumo';
        
        this.completedMelds.push({
            type: meldType,
            kantsuType: kantsuType,
            source: meldSource,
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
            
            const sourceNames = {
                'tsumo': '手牌',
                'pon': 'ポン',
                'chi': 'チー'
            };
            
            const tilesHtml = meld.tiles.map(tile => {
                const tileName = this.scoring.getTileName(tile);
                return `<div class="tile tile-${tile}">${tileName}</div>`;
            }).join('');
            
            return `
                <div class="completed-meld">
                    <h4>${meldTypeNames[meld.type]} ${index + 1} (${sourceNames[meld.source] || '手牌'})</h4>
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
        this.populateWinningTileOptions();
    }

    hideGameConditions() {
        this.gameConditionsDiv.style.display = 'none';
        this.winningTile = null;
        this.winningMethod = 'tsumo';
        this.updateWinningTileDisplay();
        this.calculateScoreBtn.disabled = true;
    }

    calculateScore() {
        let allTiles = [];
        
        if (this.handType === 'standard') {
            this.completedMelds.forEach(meld => {
                allTiles.push(...meld.tiles);
            });
            allTiles.push(...this.pair);
        } else if (this.handType === 'chiitoitsu') {
            this.completedPairs.forEach(pair => {
                allTiles.push(...pair);
            });
        } else if (this.handType === 'kokushi') {
            allTiles = [...this.kokushiTiles];
        }
        
        const conditions = {
            riichi: document.getElementById('riichi').checked,
            doubleRiichi: document.getElementById('doubleRiichi').checked,
            ippatsu: document.getElementById('ippatsu').checked,
            tsumo: this.winningMethod === 'tsumo',
            haitei: document.getElementById('haitei').checked,
            houtei: document.getElementById('houtei').checked,
            rinshan: document.getElementById('rinshan').checked,
            chankan: document.getElementById('chankan').checked,
            roundWind: document.getElementById('roundWind').value,
            seatWind: document.getElementById('seatWind').value,
            melds: this.completedMelds,
            winningTile: this.winningTile,
            winningMethod: this.winningMethod
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
        this.completedPairs = [];
        this.currentPair = [];
        this.kokushiTiles = [];
        this.winningTile = null;
        this.winningMethod = 'tsumo';
        
        this.clearCurrentMeld();
        this.updateCompletedMeldsDisplay();
        this.hidePairSelection();
        this.hideGameConditions();
        
        if (this.handType === 'chiitoitsu') {
            this.updateCompletedPairsDisplay();
            this.updateCurrentPairDisplay();
        } else if (this.handType === 'kokushi') {
            this.updateKokushiDisplay();
        }
        
        document.querySelectorAll('#gameConditions input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelector('input[name="winningMethod"][value="tsumo"]').checked = true;
    }

    loadSampleHand(tiles) {
        this.resetHand();
        alert('サンプル手牌機能は手動選択モードでは利用できません。手動でメンツを作成してください。');
    }

    addTileToCurrentPair(tileCode) {
        if (this.currentPair.length < 2) {
            this.currentPair.push(tileCode);
            this.updateCurrentPairDisplay();
            this.checkChiitoitsuPairCompletion();
        }
    }

    checkChiitoitsuPairCompletion() {
        if (this.currentPair.length === 2 && this.currentPair[0] === this.currentPair[1]) {
            this.completePairBtnChii.disabled = false;
        } else {
            this.completePairBtnChii.disabled = true;
        }
    }

    completeChiitoitsuPair() {
        if (this.currentPair.length === 2 && this.currentPair[0] === this.currentPair[1]) {
            this.completedPairs.push([...this.currentPair]);
            this.currentPair = [];
            this.updateCompletedPairsDisplay();
            this.updateCurrentPairDisplay();
            
            if (this.completedPairs.length === 7) {
                this.showGameConditions();
            }
        }
    }

    clearCurrentPair() {
        this.currentPair = [];
        this.updateCurrentPairDisplay();
        this.completePairBtnChii.disabled = true;
    }

    updateCurrentPairDisplay() {
        if (!this.currentPairDisplay || !this.currentPairTiles) return;
        
        this.currentPairDisplay.textContent = `対子 (${this.currentPair.length}/2)`;
        
        const tilesHtml = this.currentPair.map(tile => {
            const tileName = this.scoring.getTileName(tile);
            return `<div class="tile tile-${tile}">${tileName}</div>`;
        }).join('');
        
        this.currentPairTiles.innerHTML = tilesHtml;
    }

    updateCompletedPairsDisplay() {
        if (!this.completedPairsCountSpan || !this.completedPairsListDiv) return;
        
        this.completedPairsCountSpan.textContent = this.completedPairs.length;
        
        const pairsHtml = this.completedPairs.map((pair, index) => {
            const tilesHtml = pair.map(tile => {
                const tileName = this.scoring.getTileName(tile);
                return `<div class="tile tile-${tile}">${tileName}</div>`;
            }).join('');
            
            return `
                <div class="completed-pair">
                    ${tilesHtml}
                    <button onclick="app.removeChiitoitsuPair(${index})">削除</button>
                </div>
            `;
        }).join('');
        
        this.completedPairsListDiv.innerHTML = pairsHtml;
    }

    removeChiitoitsuPair(index) {
        this.completedPairs.splice(index, 1);
        this.updateCompletedPairsDisplay();
        this.hideGameConditions();
    }

    addTileToKokushi(tileCode) {
        const requiredTiles = ['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z'];
        if (!requiredTiles.includes(tileCode)) return;
        
        const existingCount = this.kokushiTiles.filter(t => t === tileCode).length;
        if (existingCount < 2) {
            this.kokushiTiles.push(tileCode);
            this.updateKokushiDisplay();
            
            if (this.kokushiTiles.length === 14) {
                this.showGameConditions();
            }
        }
    }

    updateKokushiDisplay() {
        if (!this.kokushiCountSpan || !this.kokushiTilesDiv) return;
        
        this.kokushiCountSpan.textContent = this.kokushiTiles.length;
        
        const tilesHtml = this.kokushiTiles.map(tile => {
            const tileName = this.scoring.getTileName(tile);
            return `<div class="tile tile-${tile}">${tileName}</div>`;
        }).join('');
        
        this.kokushiTilesDiv.innerHTML = tilesHtml;
        
        document.querySelectorAll('.tile-requirement').forEach(req => {
            const tileCode = req.dataset.tile;
            const count = this.kokushiTiles.filter(t => t === tileCode).length;
            req.classList.toggle('selected', count > 0);
            req.classList.toggle('completed', count === 2);
        });
    }

    clearKokushi() {
        this.kokushiTiles = [];
        this.updateKokushiDisplay();
        this.hideGameConditions();
    }

    onWinningMethodChange(method) {
        this.winningMethod = method;
        document.getElementById('tsumo').checked = (method === 'tsumo');
    }

    populateWinningTileOptions() {
        let allTiles = [];
        
        if (this.handType === 'standard') {
            this.completedMelds.forEach(meld => {
                allTiles.push(...meld.tiles);
            });
            allTiles.push(...this.pair);
        } else if (this.handType === 'chiitoitsu') {
            this.completedPairs.forEach(pair => {
                allTiles.push(...pair);
            });
        } else if (this.handType === 'kokushi') {
            allTiles = [...this.kokushiTiles];
        }
        
        const uniqueTiles = [...new Set(allTiles)];
        
        const tilesHtml = uniqueTiles.map(tile => {
            const tileName = this.scoring.getTileName(tile);
            return `<div class="winning-tile-option tile tile-${tile}" data-tile="${tile}">${tileName}</div>`;
        }).join('');
        
        this.winningTileOptionsDiv.innerHTML = tilesHtml;
        
        this.winningTileOptionsDiv.querySelectorAll('.winning-tile-option').forEach(tile => {
            tile.addEventListener('click', (e) => this.selectWinningTile(e.target.dataset.tile));
        });
    }

    selectWinningTile(tileCode) {
        this.winningTile = tileCode;
        this.updateWinningTileDisplay();
        this.calculateScoreBtn.disabled = false;
        
        this.winningTileOptionsDiv.querySelectorAll('.winning-tile-option').forEach(tile => {
            tile.classList.toggle('selected', tile.dataset.tile === tileCode);
        });
    }

    updateWinningTileDisplay() {
        if (this.winningTile) {
            const tileName = this.scoring.getTileName(this.winningTile);
            this.selectedWinningTileSpan.textContent = tileName;
        } else {
            this.selectedWinningTileSpan.textContent = '未選択';
        }
    }

    showConditionModal(conditionType) {
        const modal = document.getElementById('conditionModal');
        const title = document.getElementById('modalTitle');
        const description = document.getElementById('modalDescription');
        const details = document.getElementById('modalDetails');
        
        const conditionInfo = {
            'riichi': {
                title: 'リーチ',
                description: '聴牌時に宣言する1翻役です。',
                details: '手牌を公開せずに、あと1枚で和了できる状態で宣言します。リーチ後は手牌を変更できません。'
            },
            'doubleRiichi': {
                title: 'ダブルリーチ',
                description: '配牌時に既に聴牌している場合の2翻役です。',
                details: '第一ツモ前に聴牌していて、第一打でリーチをかけた場合に成立します。'
            },
            'ippatsu': {
                title: '一発',
                description: 'リーチ宣言後1巡以内に和了する1翻役です。',
                details: 'リーチをかけた後、他家が鳴きを入れずに1巡以内に和了した場合に成立します。'
            },
            'haitei': {
                title: '海底撈月',
                description: '海底牌でツモ和了する1翻役です。',
                details: '王牌を除いた最後の牌でツモ和了した場合に成立します。'
            },
            'houtei': {
                title: '河底撈魚',
                description: '海底牌の捨て牌でロン和了する1翻役です。',
                details: '王牌を除いた最後の牌が捨てられた時にロン和了した場合に成立します。'
            },
            'rinshan': {
                title: '嶺上開花',
                description: '嶺上牌でツモ和了する1翻役です。',
                details: 'カンをした後に引く嶺上牌でツモ和了した場合に成立します。'
            },
            'chankan': {
                title: '槍槓',
                description: '他家の加槓に対してロン和了する1翻役です。',
                details: '他家が明刻に同じ牌を加えて槓子にする際、その牌でロン和了した場合に成立します。'
            }
        };
        
        const info = conditionInfo[conditionType];
        if (info) {
            title.textContent = info.title;
            description.textContent = info.description;
            details.textContent = info.details;
            modal.style.display = 'block';
        }
    }
    
    closeConditionModal() {
        document.getElementById('conditionModal').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MahjongApp();
});
