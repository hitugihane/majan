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

        this.yakuList = {
            'riichi': { name: 'リーチ', han: 1 },
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

    analyzeHand(tiles) {
        if (tiles.length !== 14) {
            return {
                isComplete: false,
                message: `${tiles.length}枚の牌があります。14枚必要です。`,
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
        const yaku = this.detectYaku(tiles, bestGroup);
        const han = yaku.reduce((sum, y) => sum + y.han, 0);
        const fu = this.calculateFu(bestGroup);
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

    detectYaku(tiles, groups) {
        const yaku = [];
        
        if (groups.type === 'kokushi') {
            yaku.push(this.yakuList.kokushi);
            return yaku;
        }
        
        if (groups.type === 'chiitoitsu') {
            yaku.push(this.yakuList.chiitoitsu);
            return yaku;
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

    calculateFu(groups) {
        if (groups.type === 'chiitoitsu') return 25;
        if (groups.type === 'kokushi') return 30;
        
        let fu = 20;
        
        const triplets = groups.melds.filter(meld => meld.type === 'triplet');
        triplets.forEach(triplet => {
            const tile = triplet.tile;
            if (['1m', '9m', '1p', '9p', '1s', '9s'].includes(tile) || tile.includes('z')) {
                fu += 8;
            } else {
                fu += 4;
            }
        });
        
        const honorTiles = ['1z', '2z', '3z', '4z', '5z', '6z', '7z'];
        if (honorTiles.includes(groups.pair)) {
            fu += 2;
        }
        
        fu += 10;
        
        return Math.ceil(fu / 10) * 10;
    }

    calculatePoints(han, fu) {
        if (han === 0) {
            return { dealer: 0, nonDealer: 0 };
        }
        
        let basePoints;
        
        if (han >= 13) {
            basePoints = 8000;
        } else if (han >= 11) {
            basePoints = 6000;
        } else if (han >= 8) {
            basePoints = 4000;
        } else if (han >= 6) {
            basePoints = 3000;
        } else if (han === 5) {
            basePoints = 2000;
        } else {
            basePoints = fu * Math.pow(2, han + 2);
            if (basePoints > 2000) basePoints = 2000;
        }
        
        const dealerPoints = Math.ceil(basePoints * 6 / 100) * 100;
        const nonDealerPoints = Math.ceil(basePoints * 4 / 100) * 100;
        
        return {
            dealer: dealerPoints,
            nonDealer: nonDealerPoints
        };
    }

    formatHandDescription(groups) {
        if (groups.type === 'kokushi') {
            return '国士無双';
        }
        
        if (groups.type === 'chiitoitsu') {
            return '七対子';
        }
        
        let description = `雀頭: ${this.tileNames[groups.pair]}`;
        
        groups.melds.forEach((meld, index) => {
            if (meld.type === 'triplet') {
                description += ` | 刻子${index + 1}: ${this.tileNames[meld.tile]}`;
            } else {
                description += ` | 順子${index + 1}: ${meld.tiles.map(t => this.tileNames[t]).join('')}`;
            }
        });
        
        return description;
    }

    getTileName(tile) {
        return this.tileNames[tile] || tile;
    }
}
