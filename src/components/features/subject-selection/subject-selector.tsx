"use client";

import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CURRICULUM_DATA, SchoolLevel, Grade, Subject } from "@/lib/curriculum";
import { Label } from "@/components/ui/label";

interface SubjectSelectorProps {
    onSelect: (level: SchoolLevel, grade: string, subject: string) => void;
}

export function SubjectSelector({ onSelect }: SubjectSelectorProps) {
    const [level, setLevel] = useState<SchoolLevel | "">("");
    const [grade, setGrade] = useState<string>("");
    const [subject, setSubject] = useState<string>("");

    const selectedLevelData = CURRICULUM_DATA.find((d) => d.level === level);
    const selectedGradeData = selectedLevelData?.grades.find((g) => g.id === grade);

    useEffect(() => {
        if (level && grade && subject) {
            onSelect(level, grade, subject);
        }
    }, [level, grade, subject, onSelect]);

    const handleLevelChange = (value: SchoolLevel) => {
        setLevel(value);
        setGrade("");
        setSubject("");
    };

    const handleGradeChange = (value: string) => {
        setGrade(value);
        setSubject("");
    };

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
                <Label>학교급</Label>
                <Select value={level} onValueChange={handleLevelChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="학교 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {CURRICULUM_DATA.map((item) => (
                            <SelectItem key={item.level} value={item.level}>
                                {item.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>학년</Label>
                <Select value={grade} onValueChange={handleGradeChange} disabled={!level}>
                    <SelectTrigger>
                        <SelectValue placeholder="학년 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedLevelData?.grades.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                                {g.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>과목</Label>
                <Select value={subject} onValueChange={setSubject} disabled={!grade}>
                    <SelectTrigger>
                        <SelectValue placeholder="과목 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedGradeData?.subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
