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
            const edges = new cv.Mat();
            const morphed = new cv.Mat();
            
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
            
            cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 5);
            
            cv.Canny(blurred, edges, 50, 150);
            
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
            cv.morphologyEx(thresh, morphed, cv.MORPH_CLOSE, kernel);
            
            cv.bitwise_or(morphed, edges, thresh);

            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const tiles = [];
            const imageArea = src.rows * src.cols;
            const minArea = Math.max(500, imageArea * 0.001); // Dynamic minimum based on image size
            const maxArea = Math.min(50000, imageArea * 0.1); // Dynamic maximum based on image size
            
            console.log(`Processing ${contours.size()} contours, area range: ${minArea}-${maxArea}`);

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > minArea && area < maxArea) {
                    const rect = cv.boundingRect(contour);
                    const aspectRatio = rect.width / rect.height;
                    
                    console.log(`Contour ${i}: area=${area}, aspect=${aspectRatio.toFixed(2)}, size=${rect.width}x${rect.height}`);
                    
                    if (aspectRatio > 0.2 && aspectRatio < 5.0 && rect.width > 10 && rect.height > 10) {
                        console.log(`✓ Accepted tile candidate: area=${area}, aspect=${aspectRatio.toFixed(2)}, size=${rect.width}x${rect.height}`);
                        
                        const tileImage = this.extractTile(src, rect);
                        const tileType = this.classifyTile(tileImage);
                        
                        tiles.push({
                            type: tileType,
                            confidence: 0.7,
                            bounds: rect
                        });
                        
                        tileImage.delete();
                    } else {
                        console.log(`✗ Rejected: aspect=${aspectRatio.toFixed(2)} not in [0.2,5.0] or size ${rect.width}x${rect.height} too small`);
                    }
                } else {
                    console.log(`Contour ${i}: area=${area} outside range [${minArea}, ${maxArea}]`);
                }
                contour.delete();
            }

            src.delete();
            gray.delete();
            blurred.delete();
            thresh.delete();
            edges.delete();
            morphed.delete();
            kernel.delete();
            contours.delete();
            hierarchy.delete();

            console.log(`Recognized ${tiles.length} tiles`);
            return tiles;
        } catch (error) {
            console.error('Error in tile recognition:', error);
            return [];
        }
    }

    extractTile(src, rect) {
        try {
            const x = Math.max(0, rect.x);
            const y = Math.max(0, rect.y);
            const width = Math.min(rect.width, src.cols - x);
            const height = Math.min(rect.height, src.rows - y);
            
            const adjustedRect = new cv.Rect(x, y, width, height);
            const roi = src.roi(adjustedRect);
            const resized = new cv.Mat();
            const gray = new cv.Mat();
            
            if (roi.channels() > 1) {
                cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);
            } else {
                roi.copyTo(gray);
            }
            
            cv.resize(gray, resized, new cv.Size(60, 80));
            
            roi.delete();
            gray.delete();
            return resized;
        } catch (error) {
            console.error('Error extracting tile:', error);
            const blank = new cv.Mat(80, 60, cv.CV_8UC1, new cv.Scalar(255));
            return blank;
        }
    }

    classifyTile(tileImage) {
        try {
            const templates = this.getTileTemplates();
            let bestMatch = '1m';
            let bestScore = 0;
            const scores = {};

            for (const [tileType, template] of Object.entries(templates)) {
                const score = this.compareImages(tileImage, template);
                scores[tileType] = score;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = tileType;
                }
            }

            console.log(`Best match: ${bestMatch} (score: ${bestScore.toFixed(3)})`);
            
            if (bestScore < 0.3) {
                const patternMatch = this.classifyByPattern(tileImage);
                if (patternMatch) {
                    console.log(`Pattern-based match: ${patternMatch}`);
                    return patternMatch;
                }
            }

            return bestMatch;
        } catch (error) {
            console.error('Error classifying tile:', error);
            return '1m'; // Default fallback
        }
    }

    compareImages(img1, img2) {
        try {
            if (img1.rows !== img2.rows || img1.cols !== img2.cols) {
                const resized = new cv.Mat();
                cv.resize(img2, resized, new cv.Size(img1.cols, img1.rows));
                const result = this.compareImages(img1, resized);
                resized.delete();
                return result;
            }

            const result = new cv.Mat();
            cv.matchTemplate(img1, img2, result, cv.TM_CCOEFF_NORMED);
            const minMax = cv.minMaxLoc(result);
            result.delete();
            
            const diff = new cv.Mat();
            cv.absdiff(img1, img2, diff);
            const mean = cv.mean(diff);
            const similarity = 1.0 - (mean[0] / 255.0);
            diff.delete();
            
            return Math.max(minMax.maxVal, similarity);
        } catch (error) {
            console.error('Error comparing images:', error);
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

    classifyByPattern(tileImage) {
        try {
            const mean = cv.mean(tileImage);
            const brightness = mean[0];
            
            const edges = new cv.Mat();
            cv.Canny(tileImage, edges, 50, 150);
            const edgeMean = cv.mean(edges);
            const edgeDensity = edgeMean[0] / 255.0;
            edges.delete();
            
            if (brightness > 200) {
                return '5z'; // White dragon (bright)
            } else if (brightness < 100 && edgeDensity > 0.3) {
                return '7z'; // Red dragon (dark with edges)
            } else if (edgeDensity > 0.4) {
                return Math.random() > 0.5 ? '1m' : '1s';
            } else if (edgeDensity > 0.2) {
                return '1p';
            }
            
            return null; // No pattern match
        } catch (error) {
            console.error('Error in pattern classification:', error);
            return null;
        }
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
