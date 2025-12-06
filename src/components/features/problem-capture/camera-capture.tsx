"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onCapture(file);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 border-2 border-dashed rounded-xl items-center justify-center min-h-[300px] bg-muted/30">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <div className="text-center space-y-2">
                <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">문제 추가하기</h3>
                <p className="text-sm text-muted-foreground">
                    카메라로 촬영하거나 갤러리에서 선택하세요
                </p>
            </div>

            <div className="flex gap-3 w-full">
                <Button
                    className="flex-1 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="w-4 h-4" />
                    촬영 / 앨범 선택
                </Button>
            </div>
        </div>
    );
}
