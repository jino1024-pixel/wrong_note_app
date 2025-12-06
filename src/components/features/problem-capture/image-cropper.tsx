"use client";

import { useRef, useState } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCw, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const cropperRef = useRef<ReactCropperElement>(null);

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
        cropperRef.current?.cropper.rotate(-90);
    };

    const handleRotateRight = () => {
        cropperRef.current?.cropper.rotate(90);
    };

    const handleZoomIn = () => {
        cropperRef.current?.cropper.zoom(0.1);
    };

    const handleZoomOut = () => {
        cropperRef.current?.cropper.zoom(-0.1);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-3xl bg-black rounded-lg overflow-hidden">
                <Cropper
                    src={imageSrc}
                    style={{ height: "60vh", width: "100%" }}
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

            <div className="flex flex-col gap-4 mt-6 w-full max-w-md">
                <div className="flex justify-center gap-4">
                    <Button variant="secondary" size="icon" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                    <div className="w-4" /> {/* Spacer */}
                    <Button variant="secondary" size="icon" onClick={handleRotateLeft} title="Rotate Left">
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleRotateRight} title="Rotate Right">
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

            <p className="text-white/70 text-sm mt-4 text-center">
                박스 모서리를 드래그하여 영역을 선택하고,<br />
                버튼을 사용하여 확대/축소 및 회전할 수 있습니다.
            </p>
        </div>
    );
}
