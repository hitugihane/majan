class MahjongScoring {
    constructor() {
        this.tileNames = {
            '1m': '一萬', '2m': '二萬', '3m': '三萬', '4m': '四萬', '5m': '五萬',
            '6m': '六萬', '7m': '七萬', '8m': '八萬', '9m': '九萬',
            '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒',
            '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
            '1s': '一索', '2s': '二索', '3s': '三索', '4s': '四索', '5s': '五索',
            '6s': '六索', '7s': '七索', '8s': '八索', '9s': '九索',
            '1z': '東', '2z': '南', '3z': '西', '4z': '北',
            '5z': '白', '6z': '發', '7z': '中'
        };

        // 役一覧。リーチも含む。
        this.yakuList = {
            'riichi': { name: 'リーチ', han: 1 },
            'doubleRiichi': { name: 'ダブルリーチ', han: 2 },
            'ippatsu': { name: '一発', han: 1 },
            'tsumo': { name: 'ツモ', han: 1 },
            'haitei': { name: '海底撈月', han: 1 },
            'houtei': { name: '河底撈魚', han: 1 },
            'rinshan': { name: '嶺上開花', han: 1 },
            'chankan': { name: '槍槓', han: 1 },
            'tanyao': { name: 'タンヤオ', han: 1 },
            'pinfu': { name: 'ピンフ', han: 1 },
            'iipeikou': { name: 'イーペーコー', han: 1 },
            'yakuhai_haku': { name: '役牌 白', han: 1 },
            'yakuhai_hatsu': { name: '役牌 發', han: 1 },
            'yakuhai_chun': { name: '役牌 中', han: 1 },
            'yakuhai_ton': { name: '役牌 東', han: 1 },
            'yakuhai_nan': { name: '役牌 南', han: 1 },
            'yakuhai_sha': { name: '役牌 西', han: 1 },
            'yakuhai_pei': { name: '役牌 北', han: 1 },
            'chanta': { name: 'チャンタ', han: 2 },
            'ittsu': { name: 'イッツー', han: 2 },
            'sanshoku': { name: '三色同順', han: 2 },
            'toitoi': { name: 'トイトイ', han: 2 },
            'sanankou': { name: '三暗刻', han: 2 },
            'sankantsu': { name: '三槓子', han: 2 },
            'chiitoitsu': { name: '七対子', han: 2 },
            'honroutou': { name: '混老頭', han: 2 },
            'shousangen': { name: '小三元', han: 2 },
            'honitsu': { name: '混一色', han: 3 },
            'junchan': { name: '純チャン', han: 3 },
            'ryanpeikou': { name: 'リャンペーコー', han: 3 },
            'chinitsu': { name: '清一色', han: 6 },
            'kokushi': { name: '国士無双', han: 13 },
            'suuankou': { name: '四暗刻', han: 13 },
            'daisangen': { name: '大三元', han: 13 },
            'shousuushii': { name: '小四喜', han: 13 },
            'daisuushii': { name: '大四喜', han: 13 },
            'tsuuiisou': { name: '字一色', han: 13 },
            'chinroutou': { name: '清老頭', han: 13 },
            'ryuuiisou': { name: '緑一色', han: 13 },
            'chuuren': { name: '九蓮宝燈', han: 13 },
            'suukantsu': { name: '四槓子', han: 13 },
            'tenhou': { name: '天和', han: 13 },
            'chiihou': { name: '地和', han: 13 }
        };
    }

    // 手牌解析メイン関数。conditionsにリーチなどの条件を含めて渡す
    analyzeHand(tiles, conditions = {}) {
        if (tiles.length < 14 || tiles.length > 17) {
            return {
                isComplete: false,
                message: `${tiles.length}枚の牌があります。14-17枚必要です。`,
                yaku: [],
                han: 0,
                fu: 0,
                dealerPoints: 0,
                nonDealerPoints: 0
            };
        }

        const tileCounts = this.countTiles(tiles);
        const groups = this.findWinningGroups(tileCounts);
        
        if (groups.length === 0) {
            return {
                isComplete: false,
                message: '和了形になっていません。',
                yaku: [],
                han: 0,
                fu: 0,
                dealerPoints: 0,
                nonDealerPoints: 0
            };
        }

        const bestGroup = groups[0];

        const yaku = this.detectYaku(tiles, bestGroup, conditions);
        const han = yaku.reduce((sum, y) => sum + y.han, 0);
        const fu = this.calculateFu(bestGroup, conditions);
        const points = this.calculatePoints(han, fu);

        return {
            isComplete: true,
            message: this.formatHandDescription(bestGroup),
            yaku: yaku,
            han: han,
            fu: fu,
            dealerPoints: points.dealer,
            nonDealerPoints: points.nonDealer,
            groups: bestGroup
        };
    }

    countTiles(tiles) {
        const counts = {};
        tiles.forEach(tile => {
            counts[tile] = (counts[tile] || 0) + 1;
        });
        return counts;
    }

    findWinningGroups(tileCounts) {
        const groups = [];
        
        if (this.isKokushi(tileCounts)) {
            groups.push({ type: 'kokushi', tiles: Object.keys(tileCounts) });
            return groups;
        }

        if (this.isChiitoitsu(tileCounts)) {
            groups.push({ type: 'chiitoitsu', pairs: Object.keys(tileCounts) });
            return groups;
        }

        const normalGroups = this.findNormalGroups(tileCounts);
        return normalGroups;
    }

    isKokushi(tileCounts) {
        const terminals = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
        const tiles = Object.keys(tileCounts);
        
        if (tiles.length !== 13) return false;
        
        let pairFound = false;
        for (const tile of tiles) {
            if (!terminals.includes(tile)) return false;
            if (tileCounts[tile] === 2) {
                if (pairFound) return false;
                pairFound = true;
            } else if (tileCounts[tile] !== 1) {
                return false;
            }
        }
        
        return pairFound && tiles.length === 13;
    }

    isChiitoitsu(tileCounts) {
        const tiles = Object.keys(tileCounts);
        return tiles.length === 7 && tiles.every(tile => tileCounts[tile] === 2);
    }

    findNormalGroups(tileCounts) {
        const groups = [];
        const tiles = Object.keys(tileCounts);
        
        for (const pairTile of tiles) {
            if (tileCounts[pairTile] >= 2) {
                const remaining = { ...tileCounts };
                remaining[pairTile] -= 2;
                if (remaining[pairTile] === 0) delete remaining[pairTile];
                
                const melds = this.findMelds(remaining);
                if (melds.length > 0) {
                    groups.push({
                        type: 'normal',
                        pair: pairTile,
                        melds: melds[0]
                    });
                }
            }
        }
        
        return groups;
    }

    findMelds(tileCounts) {
        if (Object.keys(tileCounts).length === 0) {
            return [[]];
        }

        const results = [];
        const tiles = Object.keys(tileCounts);
        
        for (const tile of tiles) {
            if (tileCounts[tile] >= 3) {
                const remaining = { ...tileCounts };
                remaining[tile] -= 3;
                if (remaining[tile] === 0) delete remaining[tile];
                
                const subMelds = this.findMelds(remaining);
                subMelds.forEach(melds => {
                    results.push([{ type: 'triplet', tile: tile }, ...melds]);
                });
            }

            if (this.canFormSequence(tile, tileCounts)) {
                const remaining = { ...tileCounts };
                const [tile1, tile2, tile3] = this.getSequenceTiles(tile);
                remaining[tile1]--;
                remaining[tile2]--;
                remaining[tile3]--;
                if (remaining[tile1] === 0) delete remaining[tile1];
                if (remaining[tile2] === 0) delete remaining[tile2];
                if (remaining[tile3] === 0) delete remaining[tile3];
                
                const subMelds = this.findMelds(remaining);
                subMelds.forEach(melds => {
                    results.push([{ type: 'sequence', tiles: [tile1, tile2, tile3] }, ...melds]);
                });
            }
        }
        
        return results;
    }

    canFormSequence(tile, tileCounts) {
        if (tile.includes('z')) return false;
        
        const suit = tile[1];
        const num = parseInt(tile[0]);
        
        if (num > 7) return false;
        
        const tile1 = num + suit;
        const tile2 = (num + 1) + suit;
        const tile3 = (num + 2) + suit;
        
        return tileCounts[tile1] >= 1 && tileCounts[tile2] >= 1 && tileCounts[tile3] >= 1;
    }

    getSequenceTiles(tile) {
        const suit = tile[1];
        const num = parseInt(tile[0]);
        return [num + suit, (num + 1) + suit, (num + 2) + suit];
    }

    detectYaku(tiles, groups, conditions = {}) {
        const yaku = [];

        if (groups.type === 'kokushi') {
            yaku.push(this.yakuList.kokushi);
            return yaku;
        }

        if (groups.type === 'chiitoitsu') {
            yaku.push(this.yakuList.chiitoitsu);
            return yaku;
        }

        // ここでリーチ判定を追加
        if (conditions.isRiichi) {
            yaku.push(this.yakuList.riichi);
        }

        if (this.isTanyao(tiles)) {
            yaku.push(this.yakuList.tanyao);
        }

        if (this.isPinfu(groups)) {
            yaku.push(this.yakuList.pinfu);
        }

        if (this.isIttsu(groups)) {
            yaku.push(this.yakuList.ittsu);
        }

        if (this.isSanshoku(groups)) {
            yaku.push(this.yakuList.sanshoku);
        }

        if (this.isToitoi(groups)) {
            yaku.push(this.yakuList.toitoi);
        }

        if (this.isHonitsu(tiles)) {
            yaku.push(this.yakuList.honitsu);
        }

        if (this.isChinitsu(tiles)) {
            yaku.push(this.yakuList.chinitsu);
        }

        const yakuhaiYaku = this.detectYakuhai(groups);
        yaku.push(...yakuhaiYaku);

        if (conditions.riichi) {
            yaku.push(this.yakuList.riichi);
        }
        
        if (conditions.doubleRiichi) {
            yaku.push(this.yakuList.doubleRiichi);
        }
        
        if (conditions.ippatsu && conditions.riichi) {
            yaku.push(this.yakuList.ippatsu);
        }
        
        if (conditions.tsumo) {
            yaku.push(this.yakuList.tsumo);
        }
        
        if (conditions.haitei) {
            yaku.push(this.yakuList.haitei);
        }
        
        if (conditions.houtei) {
            yaku.push(this.yakuList.houtei);
        }
        
        if (conditions.rinshan) {
            yaku.push(this.yakuList.rinshan);
        }
        
        if (conditions.chankan) {
            yaku.push(this.yakuList.chankan);
        }

        if (yaku.length === 0) {
            yaku.push({ name: 'ノー役', han: 0 });
        }

        return yaku;
    }

    isTanyao(tiles) {
        const terminals = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
        return !tiles.some(tile => terminals.includes(tile));
    }

    isPinfu(groups) {
        if (groups.type !== 'normal') return false;
        
        const honorTiles = ['1z', '2z', '3z', '4z', '5z', '6z', '7z'];
        if (honorTiles.includes(groups.pair)) return false;
        
        return groups.melds.every(meld => meld.type === 'sequence');
    }

    isIttsu(groups) {
        if (groups.type !== 'normal') return false;
        
        const sequences = groups.melds.filter(meld => meld.type === 'sequence');
        const suits = ['m', 'p', 's'];
        
        for (const suit of suits) {
            const suitSequences = sequences.filter(seq => 
                seq.tiles.every(tile => tile.includes(suit))
            );
            
            const hasLow = suitSequences.some(seq => seq.tiles.includes('1' + suit));
            const hasMid = suitSequences.some(seq => seq.tiles.includes('4' + suit));
            const hasHigh = suitSequences.some(seq => seq.tiles.includes('7' + suit));
            
            if (hasLow && hasMid && hasHigh) return true;
        }
        
        return false;
    }

    isSanshoku(groups) {
        if (groups.type !== 'normal') return false;
        
        const sequences = groups.melds.filter(meld => meld.type === 'sequence');
        
        for (let i = 1; i <= 7; i++) {
            const hasM = sequences.some(seq => seq.tiles.includes(i + 'm'));
            const hasP = sequences.some(seq => seq.tiles.includes(i + 'p'));
            const hasS = sequences.some(seq => seq.tiles.includes(i + 's'));
            
            if (hasM && hasP && hasS) return true;
        }
        
        return false;
    }

    isToitoi(groups) {
        if (groups.type !== 'normal') return false;
        return groups.melds.every(meld => meld.type === 'triplet');
    }

    isHonitsu(tiles) {
        const suits = ['m', 'p', 's'];
        const honors = tiles.filter(tile => tile.includes('z'));
        
        for (const suit of suits) {
            const suitTiles = tiles.filter(tile => tile.includes(suit));
            if (suitTiles.length > 0 && suitTiles.length + honors.length === tiles.length) {
                return true;
            }
        }
        
        return false;
    }

    isChinitsu(tiles) {
        const suits = ['m', 'p', 's'];
        
        for (const suit of suits) {
            if (tiles.every(tile => tile.includes(suit))) {
                return true;
            }
        }
        
        return false;
    }

    detectYakuhai(groups) {
        const yaku = [];
        
        if (groups.type !== 'normal') return yaku;
        
        const triplets = groups.melds.filter(meld => meld.type === 'triplet');
        
        triplets.forEach(triplet => {
            switch (triplet.tile) {
                case '5z': yaku.push(this.yakuList.yakuhai_haku); break;
                case '6z': yaku.push(this.yakuList.yakuhai_hatsu); break;
                case '7z': yaku.push(this.yakuList.yakuhai_chun); break;
                case '1z': yaku.push(this.yakuList.yakuhai_ton); break;
                case '2z': yaku.push(this.yakuList.yakuhai_nan); break;
                case '3z': yaku.push(this.yakuList.yakuhai_sha); break;
                case '4z': yaku.push(this.yakuList.yakuhai_pei); break;
            }
        });
        
        return yaku;
    }

    calculateFu(groups, conditions) {
        if (groups.type === 'chiitoitsu') return 25;
        if (groups.type === 'kokushi') return 30;
        
        let fu = 20;
        
        if (conditions && conditions.melds) {
            conditions.melds.forEach(meld => {
                if (meld.type === 'koutsu') {
                    const tile = meld.tiles[0];
                    let points = (['1m', '9m', '1p', '9p', '1s', '9s'].includes(tile) || tile.includes('z')) ? 4 : 2;
                    
                    if (meld.source === 'tsumo') {
                        fu += points * 2;
                    } else {
                        fu += points;
                    }
                } else if (meld.type === 'kantsu') {
                    const tile = meld.tiles[0];
                    let points = (['1m', '9m', '1p', '9p', '1s', '9s'].includes(tile) || tile.includes('z')) ? 16 : 8;
                    
                    if (meld.kantsuType === 'ankan') {
                        fu += points * 2;
                    } else {
                        fu += points;
                    }
                }
            });
        } else {
            // conditions.meldsがない場合の簡易計算
            if (groups.type === 'normal') {
                groups.melds.forEach(meld => {
                    if (meld.type === 'triplet') {
                        const tile = meld.tile;
                        let points = (['1m', '9m', '1p', '9p', '1s', '9s'].includes(tile) || tile.includes('z')) ? 4 : 2;
                        fu += points;
                    }
                });
            }
        }

        // 切り上げ
        fu = Math.ceil(fu / 10) * 10;
        return fu;
    }

    calculatePoints(han, fu) {
        if (han === 0) return { dealer: 0, nonDealer: 0 };

        let basePoints = fu * Math.pow(2, 2 + han);

        if (han >= 13) { // 役満
            basePoints = 8000;
        } else if (han >= 11) { // 三倍満
            basePoints = 6000;
        } else if (han >= 8) { // 満貫
            basePoints = 4000;
        } else if (han >= 6) { // 倍満
            basePoints = 3000;
        } else if (han >= 5 || (han >= 4 && fu >= 40) || (han >= 3 && fu >= 70)) { // 満貫条件
            basePoints = 2000;
        }

        return {
            dealer: basePoints * 6,
            nonDealer: basePoints * 4
        };
    }

    formatHandDescription(groups) {
        if (groups.type === 'kokushi') return '国士無双';
        if (groups.type === 'chiitoitsu') return '七対子';

        const pairName = this.tileNames[groups.pair] || groups.pair;
        const meldNames = groups.melds.map(meld => {
            if (meld.type === 'triplet') {
                return `刻子(${this.tileNames[meld.tile] || meld.tile})`;
            } else if (meld.type === 'sequence') {
                return `順子(${meld.tiles.map(t => this.tileNames[t] || t).join(',')})`;
            }
            return '';
        }).join('、');

        return `面子構成: 対子(${pairName})、${meldNames}`;
    }
}
