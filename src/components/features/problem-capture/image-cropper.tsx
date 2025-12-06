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
    const [processedImage, setProcessedImage] = useState<string>(imageSrc);
    const [isProcessing, setIsProcessing] = useState(false);

    // Adaptive Thresholding Implementation
    const applyAdaptiveThreshold = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const gray = new Uint8Array(width * height);

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

        // 3. Adaptive Thresholding
        // Window size should be large enough to cover text strokes but small enough for local shadows
        // 1/8 of min dimension or fixed size like 40-50 pixels often works well for documents
        const windowSize = Math.max(20, Math.floor(Math.min(width, height) / 20));
        const s2 = Math.floor(windowSize / 2);
        const t = 15; // Threshold constant (how much darker than mean to be considered black)

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const x1 = Math.max(x - s2, 0);
                const x2 = Math.min(x + s2, width - 1);
                const y1 = Math.max(y - s2, 0);
                const y2 = Math.min(y + s2, height - 1);

                const count = (x2 - x1 + 1) * (y2 - y1 + 1);

                // Calculate sum of the window using integral image
                // Sum = I(D) - I(B) - I(C) + I(A)
                let sum = integral[y2 * width + x2];
                if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
                if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
                if (y1 > 0 && x1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];

                const mean = sum / count;

                // If pixel is significantly darker than local mean, it's text (black)
                // Otherwise it's background (white)
                const val = gray[y * width + x] < (mean - t) ? 0 : 255;

                const idx = (y * width + x) * 4;
                data[idx] = val;
                data[idx + 1] = val;
                data[idx + 2] = val;
                // Alpha remains unchanged (usually 255)
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

                    applyAdaptiveThreshold(ctx, canvas.width, canvas.height);

                    setProcessedImage(canvas.toDataURL());
                    setIsProcessing(false);
                };
            }, 50);
        } else {
            setProcessedImage(imageSrc);
        }
    }, [cleanMode, imageSrc]);

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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Eraser className="w-4 h-4" />
                        <Label htmlFor="clean-mode" className="cursor-pointer">필기 지우기 (그림자 제거)</Label>
                    </div>
                    <Switch
                        id="clean-mode"
                        checked={cleanMode}
                        onCheckedChange={setCleanMode}
                    />
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
