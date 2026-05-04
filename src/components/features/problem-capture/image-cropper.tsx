"use client";

import { useRef, useState, useEffect } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Eraser, Download, Share2 } from "lucide-react";

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const cropperRef = useRef<ReactCropperElement>(null);
    const [rotation, setRotation] = useState(0);
    const [cleanMode, setCleanMode] = useState(false);
    const [sensitivity, setSensitivity] = useState(50);
    const [processedImage, setProcessedImage] = useState<string>(imageSrc);
    const [isProcessing, setIsProcessing] = useState(false);

    // Computer Vision Heuristic for Handwriting Removal
    const applyHandwritingRemoval = (ctx: CanvasRenderingContext2D, width: number, height: number, sensitivityLevel: number) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const gray = new Uint8Array(width * height);

        const binaryData = new Uint8Array(width * height);

        // 1. Convert to Grayscale
        for (let i = 0; i < width * height; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        // 2. Compute Integral Image (Summed Area Table)
        const integral = new Uint32Array(width * height);
        for (let y = 0; y < height; y++) {
            let sum = 0;
            for (let x = 0; x < width; x++) {
                sum += gray[y * width + x];
                if (y === 0) {
                    integral[y * width + x] = sum;
                } else {
                    integral[y * width + x] = sum + integral[(y - 1) * width + x];
                }
            }
        }

        // 3. Adaptive Thresholding to create Binary Image
        const windowSize = Math.max(20, Math.floor(Math.min(width, height) / 20));
        const s2 = Math.floor(windowSize / 2);
        const t = 15; // Threshold constant

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const x1 = Math.max(x - s2, 0);
                const x2 = Math.min(x + s2, width - 1);
                const y1 = Math.max(y - s2, 0);
                const y2 = Math.min(y + s2, height - 1);

                const count = (x2 - x1 + 1) * (y2 - y1 + 1);

                let sum = integral[y2 * width + x2];
                if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
                if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
                if (y1 > 0 && x1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];

                const mean = sum / count;
                
                // binaryData[i] = 1 means foreground (black text/stroke)
                binaryData[y * width + x] = gray[y * width + x] < (mean - t) ? 1 : 0;
            }
        }

        // 4. Connected Component Labeling (CCL)
        const labels = new Int32Array(width * height);
        let currentLabel = 1;
        const components: { label: number; minX: number; maxX: number; minY: number; maxY: number; area: number; perimeter: number; }[] = [];

        const stack = new Int32Array(width * height);
        
        // 8-way neighbors for connectivity, 4-way for boundary detection
        const dx = [1, 1, 0, -1, -1, -1, 0, 1];
        const dy = [0, 1, 1, 1, 0, -1, -1, -1];

        for (let i = 0; i < width * height; i++) {
            if (binaryData[i] === 1 && labels[i] === 0) {
                let minX = i % width, maxX = minX;
                let minY = Math.floor(i / width), maxY = minY;
                let area = 0;
                let perimeter = 0;

                stack[0] = i;
                let stackPtr = 1;
                labels[i] = currentLabel;

                while (stackPtr > 0) {
                    stackPtr--;
                    const currIdx = stack[stackPtr];
                    const cx = currIdx % width;
                    const cy = Math.floor(currIdx / width);
                    area++;

                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    let isBoundary = false;

                    for (let n = 0; n < 8; n++) {
                        const nx = cx + dx[n];
                        const ny = cy + dy[n];
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (binaryData[nIdx] === 0) {
                                if (n % 2 === 0) isBoundary = true; 
                            } else if (labels[nIdx] === 0) {
                                labels[nIdx] = currentLabel;
                                stack[stackPtr++] = nIdx;
                            }
                        } else {
                            if (n % 2 === 0) isBoundary = true;
                        }
                    }
                    if (isBoundary) perimeter++;
                }

                components.push({ label: currentLabel, minX, maxX, minY, maxY, area, perimeter });
                currentLabel++;
            }
        }

        // 5. Filter Handwritings Based on Shape Regularity
        const keepLabel = new Uint8Array(currentLabel);
        keepLabel.fill(1);
        keepLabel[0] = 0;

        // Map sensitivity (0-100) to thresholds
        const maxCrookedness = 4.0 - (sensitivityLevel / 100) * 2.5; // 4.0 (weak) to 1.5 (strong)
        const maxCompactness = 400 - (sensitivityLevel / 100) * 300; // 400 (weak) to 100 (strong)

        for (let j = 0; j < components.length; j++) {
            const comp = components[j];
            const w = comp.maxX - comp.minX + 1;
            const h = comp.maxY - comp.minY + 1;
            const diag = Math.sqrt(w * w + h * h);

            // Noise removal (dust)
            if (comp.area < 3 + (sensitivityLevel / 100) * 15) {
                keepLabel[comp.label] = 0;
                continue;
            }

            // Extremely large components (likely frames, big illustrations)
            if (comp.area > width * height * 0.1) {
                keepLabel[comp.label] = 1;
                continue;
            }

            const crookedness = comp.perimeter / (2 * Math.max(diag, 1));
            const compactness = (comp.perimeter * comp.perimeter) / Math.max(comp.area, 1);

            let isHandwriting = false;

            if (crookedness > maxCrookedness) {
                isHandwriting = true; 
            } else if (compactness > maxCompactness && crookedness > 1.3) {
                isHandwriting = true;
            }

            if (isHandwriting) {
                keepLabel[comp.label] = 0;
            }
        }

        // 6. Draw the result back to image data
        for (let i = 0; i < width * height; i++) {
            const lbl = labels[i];
            const idx = i * 4;
            if (lbl > 0 && keepLabel[lbl] === 1) {
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
            } else {
                data[idx] = 255;
                data[idx + 1] = 255;
                data[idx + 2] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    useEffect(() => {
        if (cleanMode) {
            setIsProcessing(true);
            // Use setTimeout to allow UI to update before heavy processing
            setTimeout(() => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = imageSrc;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    // Limit processing size for performance if needed, but keeping full res for quality
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    applyHandwritingRemoval(ctx, canvas.width, canvas.height, sensitivity);

                    setProcessedImage(canvas.toDataURL());
                    setIsProcessing(false);
                };
            }, 50);
        } else {
            setProcessedImage(imageSrc);
        }
    }, [cleanMode, sensitivity, imageSrc]);

    // Update cropper rotation when slider changes
    useEffect(() => {
        if (cropperRef.current?.cropper) {
            cropperRef.current.cropper.rotateTo(rotation);
        }
    }, [rotation]);

    const handleSave = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            const croppedCanvas = cropper.getCroppedCanvas();
            if (croppedCanvas) {
                onCropComplete(croppedCanvas.toDataURL());
            }
        }
    };

    const handleDownload = async () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;

        const croppedCanvas = cropper.getCroppedCanvas();
        if (!croppedCanvas) return;

        const dataUrl = croppedCanvas.toDataURL("image/png");
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `wrong-note-${Date.now()}.png`, { type: "image/png" });

        // Try Web Share API first
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: '오답노트 이미지',
                    text: '오답노트 이미지를 저장합니다.',
                });
                return;
            } catch (error) {
                console.log("Share failed, falling back to download", error);
            }
        }

        // Fallback to download
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `wrong-note-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRotateLeft = () => {
        setRotation((prev) => prev - 90);
    };

    const handleRotateRight = () => {
        setRotation((prev) => prev + 90);
    };

    const handleZoomIn = () => {
        cropperRef.current?.cropper.zoom(0.1);
    };

    const handleZoomOut = () => {
        cropperRef.current?.cropper.zoom(-0.1);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-3xl bg-black rounded-lg overflow-hidden flex-1 min-h-0">
                {isProcessing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-white">이미지 처리 중...</div>
                    </div>
                )}
                <Cropper
                    src={processedImage}
                    style={{ height: "100%", width: "100%" }}
                    initialAspectRatio={undefined} // Free aspect ratio
                    guides={true}
                    ref={cropperRef}
                    viewMode={1} // Restrict crop box to canvas
                    dragMode="move" // Allow moving the image
                    autoCropArea={0.8}
                    background={false}
                    responsive={true}
                    checkOrientation={false} // Prevent auto-rotation issues
                />
            </div>

            <div className="flex flex-col gap-4 mt-4 w-full max-w-md bg-background/10 p-4 rounded-lg backdrop-blur-sm">
                {/* Fine Rotation Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-white text-sm">
                        <span>미세 회전 ({rotation}°)</span>
                    </div>
                    <Slider
                        value={[rotation]}
                        min={-45}
                        max={45}
                        step={0.5}
                        onValueChange={(val) => setRotation(val[0])}
                        className="py-2"
                    />
                </div>

                {/* Clean Mode Toggle */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Eraser className="w-4 h-4" />
                            <Label htmlFor="clean-mode" className="cursor-pointer">필기 지우기 (형태 분석)</Label>
                        </div>
                        <Switch
                            id="clean-mode"
                            checked={cleanMode}
                            onCheckedChange={setCleanMode}
                        />
                    </div>
                    {cleanMode && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between text-white/70 text-xs">
                                <span>제거 강도: 약함 (도형 보존)</span>
                                <span>강함 (강력 제거)</span>
                            </div>
                            <Slider
                                value={[sensitivity]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(val) => setSensitivity(val[0])}
                                className="py-1"
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    <Button variant="secondary" size="icon" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                    <div className="w-4" /> {/* Spacer */}
                    <Button variant="secondary" size="icon" onClick={handleRotateLeft} title="Rotate Left 90°">
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleRotateRight} title="Rotate Right 90°">
                        <RotateCw className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-white/10 text-white hover:bg-white/20 border-white/20" onClick={onCancel}>
                        <X className="w-4 h-4 mr-2" />
                        취소
                    </Button>
                    <Button variant="outline" className="flex-1 bg-white/10 text-white hover:bg-white/20 border-white/20" onClick={handleDownload}>
                        <Share2 className="w-4 h-4 mr-2" />
                        저장/공유
                    </Button>
                    <Button className="flex-1" onClick={handleSave}>
                        <Check className="w-4 h-4 mr-2" />
                        선택 완료
                    </Button>
                </div>
            </div>
        </div>
    );
}
