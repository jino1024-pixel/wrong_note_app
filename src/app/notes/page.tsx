"use client";

import { useNoteStore } from "@/store/note-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Printer, Filter } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRICULUM_DATA, SchoolLevel } from "@/lib/curriculum";

export default function NotesPage() {
    const { notes, removeNote } = useNoteStore();

    // Filter States
    const [selectedLevel, setSelectedLevel] = useState<string>("all");
    const [selectedGrade, setSelectedGrade] = useState<string>("all");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");

    // Derived Data for Dropdowns
    const selectedCurriculum = CURRICULUM_DATA.find(c => c.level === selectedLevel);
    const availableGrades = selectedCurriculum?.grades || [];
    const selectedGradeData = availableGrades.find(g => g.id === selectedGrade);
    const availableSubjects = selectedGradeData?.subjects || [];

    // Filter Logic
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            if (selectedLevel !== "all" && note.level !== selectedLevel) return false;
            if (selectedGrade !== "all" && note.grade !== selectedGrade) return false;
            if (selectedSubject !== "all" && note.subject !== selectedSubject) return false;
            return true;
        });
    }, [notes, selectedLevel, selectedGrade, selectedSubject]);

    // Helper to get display names
    const getSubjectInfo = (level: string, grade: string, subjectId: string) => {
        const levelData = CURRICULUM_DATA.find((d) => d.level === level);
        const gradeData = levelData?.grades.find((g) => g.id === grade);
        const subjectData = gradeData?.subjects.find((s) => s.id === subjectId);
        return {
            levelName: levelData?.name || level,
            gradeName: gradeData?.name || grade,
            subjectName: subjectData?.name || subjectId
        };
    };

    // Construct Query Params for Print Page
    const printQueryParams = new URLSearchParams();
    if (selectedLevel !== "all") printQueryParams.set("level", selectedLevel);
    if (selectedGrade !== "all") printQueryParams.set("grade", selectedGrade);
    if (selectedSubject !== "all") printQueryParams.set("subject", selectedSubject);
    const printUrl = `/notes/print?${printQueryParams.toString()}`;

    return (
        <div className="container mx-auto p-4 pb-24 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">내 오답노트</h1>
                <span className="text-muted-foreground text-sm">
                    총 {filteredNotes.length}개
                </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 mb-6 bg-muted/30 p-4 rounded-lg">
                <Select value={selectedLevel} onValueChange={(val) => {
                    setSelectedLevel(val);
                    setSelectedGrade("all");
                    setSelectedSubject("all");
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="학교급" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 학교</SelectItem>
                        {CURRICULUM_DATA.map(c => (
                            <SelectItem key={c.level} value={c.level}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedGrade} onValueChange={(val) => {
                    setSelectedGrade(val);
                    setSelectedSubject("all");
                }} disabled={selectedLevel === "all"}>
                    <SelectTrigger>
                        <SelectValue placeholder="학년" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 학년</SelectItem>
                        {availableGrades.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={selectedGrade === "all"}>
                    <SelectTrigger>
                        <SelectValue placeholder="과목" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 과목</SelectItem>
                        {availableSubjects.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>저장된 오답노트가 없습니다.</p>
                    <Link href="/capture">
                        <Button variant="link" className="mt-2">
                            + 문제 추가하러 가기
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotes.map((note) => {
                        const info = getSubjectInfo(note.level, note.grade, note.subject);
                        return (
                            <Card key={note.id} className="overflow-hidden">
                                <CardContent className="p-4 flex gap-4">
                                    <div className="relative w-24 h-24 flex-shrink-0 bg-black/5 rounded-md overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={note.imageUrl}
                                            alt="Problem"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-medium truncate">
                                                        {info.subjectName}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {info.levelName} {info.gradeName}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive/90 -mt-1 -mr-2"
                                                    onClick={() => removeNote(note.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                <Link href={printUrl}>
                    <Button size="lg" className="rounded-full shadow-lg h-14 px-6">
                        <Printer className="w-5 h-5 mr-2" />
                        시험지 만들기 ({filteredNotes.length})
                    </Button>
                </Link>
            </div>
        </div>
    );
}
