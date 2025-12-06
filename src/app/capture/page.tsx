"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/features/problem-capture/camera-capture";
import { ImageCropper } from "@/components/features/problem-capture/image-cropper";
import { SubjectSelector } from "@/components/features/subject-selection/subject-selector";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useNoteStore } from "@/store/note-store";
import { SchoolLevel } from "@/lib/curriculum";

export default function CapturePage() {
    const router = useRouter();
    const addNote = useNoteStore((state) => state.addNote);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);

    const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");

    const handleCapture = (file: File) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedImg: string) => {
        setCroppedImage(croppedImg);
        setImageSrc(null); // Close cropper
    };

    const handleCancelCrop = () => {
        setSelectedFile(null);
        setImageSrc(null);
    };

    const handleRetake = () => {
        setCroppedImage(null);
        setSelectedFile(null);
        setImageSrc(null);
        setSelectedLevel(null);
        setSelectedGrade("");
        setSelectedSubject("");
    };

    const handleSave = () => {
        if (croppedImage && selectedLevel && selectedGrade && selectedSubject) {
            addNote({
                imageUrl: croppedImage,
                level: selectedLevel,
                grade: selectedGrade,
                subject: selectedSubject,
            });
            router.push("/notes");
        } else {
            alert("과목을 선택해주세요.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">문제 추가</h1>
            </div>

            {!selectedFile && !croppedImage && (
                <CameraCapture onCapture={handleCapture} />
            )}

            {imageSrc && (
                <ImageCropper
                    imageSrc={imageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCancelCrop}
                />
            )}

            {croppedImage && (
                <div className="space-y-6">
                    <div className="border rounded-lg overflow-hidden bg-muted/20">
                        <img
                            src={croppedImage}
                            alt="Cropped problem"
                            className="w-full h-auto"
                        />
                    </div>

                    <div className="bg-card p-4 rounded-lg border">
                        <h3 className="font-semibold mb-4">과목 선택</h3>
                        <SubjectSelector
                            onSelect={(level, grade, subject) => {
                                setSelectedLevel(level as SchoolLevel);
                                setSelectedGrade(grade);
                                setSelectedSubject(subject);
                            }}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={handleRetake}>
                            다시 촬영
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={!selectedLevel || !selectedGrade || !selectedSubject}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            저장하기
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
