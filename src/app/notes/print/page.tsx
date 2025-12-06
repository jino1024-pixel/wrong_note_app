"use client";

import { useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { TestPaperTemplate } from "@/components/features/test-paper/test-paper-template";
import { useNoteStore } from "@/store/note-store";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PrintPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const notes = useNoteStore((state) => state.notes);
    const componentRef = useRef<HTMLDivElement>(null);

    // Filter notes based on query params
    const filteredNotes = useMemo(() => {
        const level = searchParams.get("level");
        const grade = searchParams.get("grade");
        const subject = searchParams.get("subject");

        return notes.filter(note => {
            if (level && note.level !== level) return false;
            if (grade && note.grade !== grade) return false;
            if (subject && note.subject !== subject) return false;
            return true;
        });
    }, [notes, searchParams]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: "오답노트",
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">시험지 미리보기</h1>
                    <span className="text-sm text-muted-foreground">
                        (총 {filteredNotes.length}문제)
                    </span>
                </div>
                <Button onClick={() => handlePrint()}>
                    <Printer className="w-4 h-4 mr-2" />
                    인쇄하기 / PDF 저장
                </Button>
            </div>

            <div className="bg-gray-100 p-8 rounded-lg overflow-auto flex justify-center min-h-screen">
                <TestPaperTemplate ref={componentRef} notes={filteredNotes} />
            </div>
        </div>
    );
}
