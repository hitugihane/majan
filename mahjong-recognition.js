class MahjongRecognition {
    constructor() {
        this.isOpenCVReady = false;
        this.initOpenCV();
    }

    initOpenCV() {
        if (typeof cv !== 'undefined') {
            cv.onRuntimeInitialized = () => {
                this.isOpenCVReady = true;
                console.log('OpenCV.js is ready');
            };
        } else {
            setTimeout(() => this.initOpenCV(), 100);
        }
    }

    async recognizeTiles(imageData, canvas) {
        if (!this.isOpenCVReady) {
            throw new Error('OpenCV is not ready');
        }

        try {
            const src = cv.matFromImageData(imageData);
            const gray = new cv.Mat();
            const blurred = new cv.Mat();
            const thresh = new cv.Mat();
            
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const tiles = [];
            const minArea = 800;
            const maxArea = 10000;

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > minArea && area < maxArea) {
                    const approx = new cv.Mat();
                    const epsilon = 0.02 * cv.arcLength(contour, true);
                    cv.approxPolyDP(contour, approx, epsilon, true);
                    
                    if (approx.rows === 4) {
                        const rect = cv.boundingRect(contour);
                        const aspectRatio = rect.width / rect.height;
                        
                        if (aspectRatio > 0.6 && aspectRatio < 1.4) {
                            const tileImage = this.extractTile(src, contour);
                            const tileType = this.classifyTile(tileImage);
                            
                            tiles.push({
                                type: tileType,
                                confidence: 0.8,
                                bounds: rect
                            });
                            
                            tileImage.delete();
                        }
                    }
                    approx.delete();
                }
                contour.delete();
            }

            src.delete();
            gray.delete();
            blurred.delete();
            thresh.delete();
            contours.delete();
            hierarchy.delete();

            return tiles;
        } catch (error) {
            console.error('Error in tile recognition:', error);
            return [];
        }
    }

    extractTile(src, contour) {
        const rect = cv.boundingRect(contour);
        const roi = src.roi(rect);
        const resized = new cv.Mat();
        cv.resize(roi, resized, new cv.Size(60, 80));
        roi.delete();
        return resized;
    }

    classifyTile(tileImage) {
        const templates = this.getTileTemplates();
        let bestMatch = '1m';
        let bestScore = 0;

        for (const [tileType, template] of Object.entries(templates)) {
            const score = this.compareImages(tileImage, template);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = tileType;
            }
        }

        return bestMatch;
    }

    compareImages(img1, img2) {
        try {
            const diff = new cv.Mat();
            cv.absdiff(img1, img2, diff);
            const mean = cv.mean(diff);
            diff.delete();
            return 1.0 - (mean[0] / 255.0);
        } catch (error) {
            return 0;
        }
    }

    getTileTemplates() {
        return {
            '1m': this.createSimpleTemplate('一'),
            '2m': this.createSimpleTemplate('二'),
            '3m': this.createSimpleTemplate('三'),
            '4m': this.createSimpleTemplate('四'),
            '5m': this.createSimpleTemplate('五'),
            '6m': this.createSimpleTemplate('六'),
            '7m': this.createSimpleTemplate('七'),
            '8m': this.createSimpleTemplate('八'),
            '9m': this.createSimpleTemplate('九'),
            '1p': this.createSimpleTemplate('①'),
            '2p': this.createSimpleTemplate('②'),
            '3p': this.createSimpleTemplate('③'),
            '4p': this.createSimpleTemplate('④'),
            '5p': this.createSimpleTemplate('⑤'),
            '6p': this.createSimpleTemplate('⑥'),
            '7p': this.createSimpleTemplate('⑦'),
            '8p': this.createSimpleTemplate('⑧'),
            '9p': this.createSimpleTemplate('⑨'),
            '1s': this.createSimpleTemplate('🀐'),
            '2s': this.createSimpleTemplate('🀑'),
            '3s': this.createSimpleTemplate('🀒'),
            '4s': this.createSimpleTemplate('🀓'),
            '5s': this.createSimpleTemplate('🀔'),
            '6s': this.createSimpleTemplate('🀕'),
            '7s': this.createSimpleTemplate('🀖'),
            '8s': this.createSimpleTemplate('🀗'),
            '9s': this.createSimpleTemplate('🀘'),
            '1z': this.createSimpleTemplate('東'),
            '2z': this.createSimpleTemplate('南'),
            '3z': this.createSimpleTemplate('西'),
            '4z': this.createSimpleTemplate('北'),
            '5z': this.createSimpleTemplate('白'),
            '6z': this.createSimpleTemplate('發'),
            '7z': this.createSimpleTemplate('中')
        };
    }

    createSimpleTemplate(character) {
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 60, 80);
        ctx.fillStyle = 'black';
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(character, 30, 40);
        
        const imageData = ctx.getImageData(0, 0, 60, 80);
        const mat = cv.matFromImageData(imageData);
        const gray = new cv.Mat();
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
        mat.delete();
        return gray;
    }

    simulateRecognition() {
        const sampleTiles = [
            '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
            '1p', '1p', '1p', '2p', '2p'
        ];
        
        return sampleTiles.map(type => ({
            type: type,
            confidence: 0.9,
            bounds: { x: 0, y: 0, width: 60, height: 80 }
        }));
    }
}
