export type SchoolLevel = "middle" | "high";

export interface Subject {
    id: string;
    name: string;
}

export interface Grade {
    id: string;
    name: string;
    subjects: Subject[];
}

export interface Curriculum {
    level: SchoolLevel;
    name: string;
    grades: Grade[];
}

export const CURRICULUM_DATA: Curriculum[] = [
    {
        level: "middle",
        name: "중학교",
        grades: [
            {
                id: "m1",
                name: "1학년",
                subjects: [
                    { id: "kor", name: "국어" },
                    { id: "eng", name: "영어" },
                    { id: "math", name: "수학" },
                    { id: "soc", name: "사회" },
                    { id: "sci", name: "과학" },
                    { id: "hist", name: "역사" },
                ],
            },
            {
                id: "m2",
                name: "2학년",
                subjects: [
                    { id: "kor", name: "국어" },
                    { id: "eng", name: "영어" },
                    { id: "math", name: "수학" },
                    { id: "soc", name: "사회" },
                    { id: "sci", name: "과학" },
                    { id: "hist", name: "역사" },
                ],
            },
            {
                id: "m3",
                name: "3학년",
                subjects: [
                    { id: "kor", name: "국어" },
                    { id: "eng", name: "영어" },
                    { id: "math", name: "수학" },
                    { id: "soc", name: "사회" },
                    { id: "sci", name: "과학" },
                    { id: "hist", name: "역사" },
                ],
            },
        ],
    },
    {
        level: "high",
        name: "고등학교",
        grades: [
            {
                id: "h1",
                name: "1학년",
                subjects: [
                    { id: "kor", name: "국어" },
                    { id: "eng", name: "영어" },
                    { id: "math", name: "수학" },
                    { id: "soc", name: "통합사회" },
                    { id: "sci", name: "통합과학" },
                    { id: "hist", name: "한국사" },
                ],
            },
            {
                id: "h2",
                name: "2학년",
                subjects: [
                    { id: "lit", name: "문학" },
                    { id: "read", name: "독서" },
                    { id: "eng1", name: "영어 I" },
                    { id: "eng2", name: "영어 II" },
                    { id: "math1", name: "수학 I" },
                    { id: "math2", name: "수학 II" },
                    { id: "prob", name: "확률과 통계" },
                    { id: "geom", name: "기하" },
                    // Add more electives as needed
                ],
            },
            {
                id: "h3",
                name: "3학년",
                subjects: [
                    { id: "speech", name: "화법과 작문" },
                    { id: "lang", name: "언어와 매체" },
                    { id: "calc", name: "미적분" },
                    // Add more electives as needed
                ],
            },
        ],
    },
];
