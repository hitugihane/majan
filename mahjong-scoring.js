class MahjongScoring {
        constructor() {
            // Mapping of tile codes to their human‑readable names. These are used
            // throughout the scoring logic to provide meaningful descriptions of
            // melds, pairs and sequences. The mapping covers the three suits
            // (man, pin, sou) and the honour tiles.
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

            // List of yaku and the associated han value. Basic one‑han hands
            // such as riichi, tanyao or yakuhai are included as well as higher
            // value yaku like honitsu or chinitsu. Note that riichi and
            // double riichi are present here so they can be referenced
            // programmatically when the appropriate conditions are set.
            // Situational yaku such as ippatsu, haitei and menzen tsumo are
            // also included so they can be applied from analyzeHand.
            this.yakuList = {
                'riichi':        { name: 'リーチ',          han: 1 },
                'doubleRiichi':  { name: 'ダブルリーチ',      han: 2 },
                'ippatsu':       { name: '一発',            han: 1 },
                'menzentsumo':   { name: '門前清自摸和',      han: 1 },
                'haitei':        { name: '海底撈月',         han: 1 },
                'houtei':        { name: '河底撈魚',         han: 1 },
                'rinshan':       { name: '嶺上開花',         han: 1 },
                'chankan':       { name: '槍槓',            han: 1 },
                'tanyao':        { name: 'タンヤオ',        han: 1 },
                'pinfu':         { name: 'ピンフ',          han: 1 },
                'iipeikou':    { name: 'イーペーコー',  han: 1 },
                'yakuhai_haku':{ name: '役牌 白',       han: 1 },
                'yakuhai_hatsu':{ name: '役牌 發',      han: 1 },
                'yakuhai_chun':{ name: '役牌 中',       han: 1 },
                'yakuhai_ton': { name: '役牌 東',       han: 1 },
                'yakuhai_nan': { name: '役牌 南',       han: 1 },
                'yakuhai_sha': { name: '役牌 西',       han: 1 },
                'yakuhai_pei': { name: '役牌 北',       han: 1 },
                'chanta':      { name: 'チャンタ',      han: 2 },
                'ittsu':       { name: 'イッツー',      han: 2 },
                'sanshoku':    { name: '三色同順',       han: 2 },
                'toitoi':      { name: 'トイトイ',      han: 2 },
                'sanankou':    { name: '三暗刻',        han: 2 },
                'sankantsu':   { name: '三槓子',        han: 2 },
                'chiitoitsu':  { name: '七対子',        han: 2 },
                'honroutou':   { name: '混老頭',        han: 2 },
                'shousangen':  { name: '小三元',        han: 2 },
                'honitsu':     { name: '混一色',        han: 3 },
                'junchan':     { name: '純チャン',      han: 3 },
                'ryanpeikou': { name: 'リャンペーコー', han: 3 },
                'chinitsu':    { name: '清一色',        han: 6 },
                'kokushi':     { name: '国士無双',      han: 13 },
                'suuankou':    { name: '四暗刻',        han: 13 },
                'daisangen':   { name: '大三元',        han: 13 },
                'shousuushii': { name: '小四喜',        han: 13 },
                'daisuushii':  { name: '大四喜',        han: 13 },
                'tsuuiisou':   { name: '字一色',        han: 13 },
                'chinroutou':  { name: '清老頭',        han: 13 },
                'ryuuiisou':   { name: '緑一色',        han: 13 },
                'chuuren':     { name: '九蓮宝燈',      han: 13 },
                'suukantsu':   { name: '四槓子',        han: 13 },
                'tenhou':      { name: '天和',          han: 13 },
                'chiihou':     { name: '地和',          han: 13 }
            };
        }

        /**
         * Analyze a given hand and return detailed information about whether
         * it completes a legal hand, which yaku apply, the han and fu totals
         * as well as the point values for both dealer and non–dealer.  The
         * optional `conditions` parameter contains flags such as riichi,
         * doubleRiichi and ippatsu which allow certain yaku to be manually
         * toggled from the UI.
         *
         * @param {string[]} tiles The full set of tiles in the player's hand.
         * @param {Object} conditions Optional game conditions toggled by the UI.
         * @returns {Object} Hand analysis including yaku, han, fu and points.
         */
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
            // Start with intrinsic yaku detected from the hand structure. This
            // excludes any situational yaku such as riichi which are driven by
            // player declaration rather than tile composition.
            let yaku = this.detectYaku(tiles, bestGroup, conditions);

            // Apply riichi/double riichi yaku based on the provided conditions.
            // Double riichi overrides single riichi if both checkboxes are on.
            if (conditions.doubleRiichi) {
                yaku.push(this.yakuList.doubleRiichi);
            } else if (conditions.riichi) {
                yaku.push(this.yakuList.riichi);
            }

            // Ippatsu can only be scored together with riichi or double riichi.
            if (conditions.ippatsu && (conditions.riichi || conditions.doubleRiichi)) {
                yaku.push(this.yakuList.ippatsu);
            }

            // Menzen tsumo: closed hand won by self-draw. Excluded when riichi is
            // present because riichi already requires a closed hand, making menzen
            // tsumo redundant.
            const hasOpenMelds = conditions.melds &&
                conditions.melds.some(m => m.source === 'pon' || m.source === 'chi');
            if (conditions.tsumo && !hasOpenMelds && !conditions.riichi && !conditions.doubleRiichi) {
                yaku.push(this.yakuList.menzentsumo);
            }

            // Situational one-han bonuses.
            if (conditions.haitei && conditions.tsumo) {
                yaku.push(this.yakuList.haitei);
            }
            if (conditions.houtei && !conditions.tsumo) {
                yaku.push(this.yakuList.houtei);
            }
            if (conditions.rinshan) {
                yaku.push(this.yakuList.rinshan);
            }
            if (conditions.chankan) {
                yaku.push(this.yakuList.chankan);
            }

            // Remove the placeholder 'ノー役' entry if any additional yaku
            // (including riichi) have been added. When only 'ノー役' is present
            // it should remain to indicate a hand without yaku.
            if (yaku.length > 1) {
                yaku = yaku.filter(y => y.name !== 'ノー役');
            }

            // Sum up the han after situational yaku have been applied.
            const han = yaku.reduce((sum, y) => sum + y.han, 0);
            // Fu calculation uses the groups and melds from conditions. It is
            // unaware of riichi and therefore remains unchanged.
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

        // Count the occurrences of each tile in the hand. This helper is
        // essential for hand analysis and group detection.
        countTiles(tiles) {
            const counts = {};
            tiles.forEach(tile => {
                counts[tile] = (counts[tile] || 0) + 1;
            });
            return counts;
        }

        // Determine possible winning groupings (pair + melds) from the tile counts.
        // Supports kokushi and chiitoitsu special hands as well as normal hands.
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

        // Check if the hand forms a Kokushi Musou (thirteen orphans). A valid
        // kokushi requires exactly one pair among the terminals/honours and all
        // other terminals/honours appearing exactly once.
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

        // Check if the hand is a seven pairs (chiitoitsu). All tiles must form
        // exactly seven distinct pairs.
        isChiitoitsu(tileCounts) {
            const tiles = Object.keys(tileCounts);
            return tiles.length === 7 && tiles.every(tile => tileCounts[tile] === 2);
        }

        // Attempt to break down the remaining tiles into a pair and three melds.
        // Every possible pair tile is considered and melds are found recursively.
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

        // Recursively find all meld combinations (triplets and sequences) for the
        // remaining tiles after a pair has been removed. This is a depth–first
        // search that attempts to form triplets and then sequences.
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

        // Verify if a tile can start a sequence. Honour tiles cannot form
        // sequences, and numbered tiles above 7 cannot because a valid
        // sequence requires tile n, n+1 and n+2.
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

        // Given a starting tile, return the three tiles that would form a
        // sequence. This helper simply calculates n, n+1 and n+2 of the same suit.
        getSequenceTiles(tile) {
            const suit = tile[1];
            const num = parseInt(tile[0]);
            return [num + suit, (num + 1) + suit, (num + 2) + suit];
        }

        /**
         * Detect intrinsic yaku based solely on the tile arrangement. Situational
         * yaku such as riichi are not handled here; they are applied in
         * analyzeHand after this method returns.
         *
         * @param {string[]} tiles All tiles in the hand.
         * @param {Object} groups The best group decomposition (pair + melds).
         * @param {Object} conditions Game conditions containing wind and meld info.
         * @returns {Object[]} A list of yaku objects applicable to this hand.
         */
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

            const yakuhaiYaku = this.detectYakuhai(groups, conditions);
            yaku.push(...yakuhaiYaku);

            if (yaku.length === 0) {
                // A placeholder yaku used when no scoring yaku are present. This
                // allows the UI to inform the user that the hand lacks yaku.
                yaku.push({ name: 'ノー役', han: 0 });
            }

            return yaku;
        }

        // A simple tanyao check – no terminals or honour tiles present.
        isTanyao(tiles) {
            const terminals = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
            return !tiles.some(tile => terminals.includes(tile));
        }

        // Pinfu: no triplets/koutsu and the pair is not honours. In this simplified
        // implementation the open/closed state and wait shape are ignored.
        isPinfu(groups) {
            if (groups.type !== 'normal') return false;

            const honorTiles = ['1z', '2z', '3z', '4z', '5z', '6z', '7z'];
            if (honorTiles.includes(groups.pair)) return false;

            return groups.melds.every(meld => meld.type === 'sequence');
        }

        // Ittsu: one suit contains 1‑9 sequences. We check each suit for the
        // presence of low (1‑3), middle (4‑6) and high (7‑9) sequences.
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

        // Sanshoku doujun: the same sequence across all three suits.
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

        // Toitoi: all melds are triplets/koutsu.
        isToitoi(groups) {
            if (groups.type !== 'normal') return false;
            return groups.melds.every(meld => meld.type === 'triplet');
        }

        // Honitsu: one suit plus honours. All tiles belong to the same suit or are honours.
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

        // Chinitsu: all tiles are from a single suit with no honours.
        isChinitsu(tiles) {
            const suits = ['m', 'p', 's'];

            for (const suit of suits) {
                if (tiles.every(tile => tile.includes(suit))) {
                    return true;
                }
            }

            return false;
        }

        // Detect yakuhai: triplets of dragons or the round/seat wind. Dragons
        // always score; wind triplets only score when the tile matches the
        // current round wind (場風) or the player's seat wind (自風).
        detectYakuhai(groups, conditions = {}) {
            const yaku = [];

            if (groups.type !== 'normal') return yaku;

            const roundWind = conditions.roundWind || null;
            const seatWind  = conditions.seatWind  || null;

            const triplets = groups.melds.filter(meld => meld.type === 'triplet');

            triplets.forEach(triplet => {
                switch (triplet.tile) {
                    // Dragons always score as yakuhai.
                    case '5z': yaku.push(this.yakuList.yakuhai_haku);  break;
                    case '6z': yaku.push(this.yakuList.yakuhai_hatsu); break;
                    case '7z': yaku.push(this.yakuList.yakuhai_chun);  break;
                    // Winds only score when they match the round or seat wind.
                    case '1z':
                        if (roundWind === '1z' || seatWind === '1z') yaku.push(this.yakuList.yakuhai_ton);
                        break;
                    case '2z':
                        if (roundWind === '2z' || seatWind === '2z') yaku.push(this.yakuList.yakuhai_nan);
                        break;
                    case '3z':
                        if (roundWind === '3z' || seatWind === '3z') yaku.push(this.yakuList.yakuhai_sha);
                        break;
                    case '4z':
                        if (roundWind === '4z' || seatWind === '4z') yaku.push(this.yakuList.yakuhai_pei);
                        break;
                }
            });

            return yaku;
        }

        /**
         * Calculate fu (minipoints) based on melds, pairs and certain special
         * conditions (koutsu, kantsu etc.). Riichi does not affect fu.
         *
         * @param {Object} groups The group decomposition used for scoring.
         * @param {Object} conditions Game conditions containing meld metadata.
         * @returns {number} The fu value rounded up to the next ten.
         */
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
                const triplets = groups.melds.filter(meld => meld.type === 'triplet');
                triplets.forEach(triplet => {
                    const tile = triplet.tile;
                    if (['1m', '9m', '1p', '9p', '1s', '9s'].includes(tile) || tile.includes('z')) {
                        fu += 8;
                    } else {
                        fu += 4;
                    }
                });
            }

            const honorTiles = ['1z', '2z', '3z', '4z', '5z', '6z', '7z'];
            if (honorTiles.includes(groups.pair)) {
                fu += 2;
            }

            // Tsumo win adds 2 fu (except pinfu, which is handled separately by
            // the scoring rules and receives 20 fu flat for a tsumo win).
            const isPinfu = this.isPinfu(groups);
            if (conditions && conditions.tsumo && !isPinfu) {
                fu += 2;
            }

            // Winning on a ron or tsumo always adds a base 10 fu; this accounts
            // for the winning hand itself. Any additional fu are added above.
            fu += 10;

            return Math.ceil(fu / 10) * 10;
        }

        /**
         * Convert han and fu into final point values for the dealer and
         * non‑dealer. This method implements the standard Japanese mahjong
         * scoring table including the mangan / haneman / baiman / sanbaiman
         * thresholds.
         *
         * @param {number} han The total han value of the hand.
         * @param {number} fu The fu value of the hand.
         * @returns {Object} The point values for dealer and non‑dealer.
         */
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

        /**
         * Format a textual description of the winning hand composition. Kokushi
         * Musou and Chiitoitsu are handled specially; otherwise the head and
         * each meld are described.
         *
         * @param {Object} groups The group decomposition used for scoring.
         * @returns {string} A human‑readable description of the hand.
         */
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

        // Return a mapped tile name or fall back to the tile code. This helper
        // allows external code to request the display name without knowing
        // whether a mapping exists.
        getTileName(tile) {
            return this.tileNames[tile] || tile;
        }
    }
