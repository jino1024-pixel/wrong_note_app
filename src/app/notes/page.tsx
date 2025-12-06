"use client";

import { useNoteStore } from "@/store/note-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Trash2, Printer, Plus } from "lucide-react";
import Link from "next/link";
import { CURRICULUM_DATA } from "@/lib/curriculum";

export default function NotesPage() {
    const { notes, removeNote } = useNoteStore();

    const getSubjectName = (level: string, grade: string, subjectId: string) => {
        const levelData = CURRICULUM_DATA.find((d) => d.level === level);
        const gradeData = levelData?.grades.find((g) => g.id === grade);
        const subjectData = gradeData?.subjects.find((s) => s.id === subjectId);
        return `${levelData?.name} ${gradeData?.name} ${subjectData?.name}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">내 오답노트</h1>
                <Link href="/capture">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        문제 추가
                    </Button>
                </Link>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground mb-4">저장된 오답노트가 없습니다.</p>
                    <Link href="/capture">
                        <Button variant="outline">첫 문제 촬영하기</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                            <div className="aspect-[4/3] relative bg-muted">
                                <img
                                    src={note.imageUrl}
                                    alt="Problem"
                                    className="object-contain w-full h-full"
                                />
                            </div>
                            <CardHeader className="p-4 pb-2">
                                <h3 className="font-semibold text-lg">
                                    {getSubjectName(note.level, note.grade, note.subject)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </p>
                            </CardHeader>
                            <CardFooter className="p-4 pt-2 flex justify-between">
                                <Button variant="destructive" size="sm" onClick={() => removeNote(note.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                </Button>
                                {/* Print button will be implemented later */}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {notes.length > 0 && (
                <div className="fixed bottom-8 right-8">
                    <Link href="/notes/print">
                        <Button size="lg" className="rounded-full shadow-lg h-14 px-6">
                            <Printer className="w-5 h-5 mr-2" />
                            시험지 만들기
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
