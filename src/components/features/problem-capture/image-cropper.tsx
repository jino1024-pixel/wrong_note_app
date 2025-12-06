"use client";

import { useRef, useState, useEffect } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Eraser } from "lucide-react";

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

    // Apply binarization (thresholding) to remove handwriting/noise
    useEffect(() => {
        if (cleanMode) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Simple thresholding
                // You can adjust the threshold value (128 is standard middle gray)
                const threshold = 160;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Calculate luminance
                    const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                    // Apply threshold: if lighter than threshold, make it white; else black
                    const bin = v >= threshold ? 255 : 0;

                    data[i] = bin;
                    data[i + 1] = bin;
                    data[i + 2] = bin;
                }

                ctx.putImageData(imageData, 0, 0);
                setProcessedImage(canvas.toDataURL());
            };
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
                        <Label htmlFor="clean-mode" className="cursor-pointer">필기 지우기 (Clean Mode)</Label>
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
                    <Button className="flex-1" onClick={handleSave}>
                        <Check className="w-4 h-4 mr-2" />
                        선택 완료
                    </Button>
                </div>
            </div>
        </div>
    );
}
