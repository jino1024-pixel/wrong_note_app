import { forwardRef } from "react";
import { WrongNote } from "@/store/note-store";
import { cn } from "@/lib/utils";

interface TestPaperTemplateProps {
    title?: string;
    notes: WrongNote[];
}

export const TestPaperTemplate = forwardRef<HTMLDivElement, TestPaperTemplateProps>(
    ({ title = "오답노트", notes }, ref) => {
        return (
            <div ref={ref} className="bg-white text-black p-8 mx-auto w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:w-full print:h-auto">
                <div className="border-b-2 border-black pb-4 mb-8 text-center">
                    <h1 className="text-3xl font-bold font-serif">{title}</h1>
                    <div className="flex justify-between mt-4 text-sm">
                        <span>날짜: ________________</span>
                        <span>이름: ________________</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {notes.map((note, index) => (
                        <div key={note.id} className="break-inside-avoid mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-lg">{index + 1}.</span>
                                <span className="text-sm text-gray-500">
                                    {note.level === "middle" ? "중" : "고"}{note.grade.replace(/[a-z]/g, "")} - {note.subject}
                                </span>
                            </div>
                            <div className="border border-gray-200 rounded p-2 min-h-[200px] flex items-start justify-center">
                                <img
                                    src={note.imageUrl}
                                    alt={`Problem ${index + 1}`}
                                    className="max-w-full max-h-[300px] object-contain"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

TestPaperTemplate.displayName = "TestPaperTemplate";
