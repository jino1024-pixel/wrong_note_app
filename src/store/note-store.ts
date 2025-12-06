import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { SchoolLevel } from "@/lib/curriculum";

export interface WrongNote {
    id: string;
    imageUrl: string;
    level: SchoolLevel;
    grade: string;
    subject: string;
    createdAt: number;
}

interface NoteStore {
    notes: WrongNote[];
    addNote: (note: Omit<WrongNote, "id" | "createdAt">) => void;
    removeNote: (id: string) => void;
    clearNotes: () => void;
}

export const useNoteStore = create<NoteStore>()(
    persist(
        (set) => ({
            notes: [],
            addNote: (note) =>
                set((state) => ({
                    notes: [
                        {
                            ...note,
                            id: uuidv4(),
                            createdAt: Date.now(),
                        },
                        ...state.notes,
                    ],
                })),
            removeNote: (id) =>
                set((state) => ({
                    notes: state.notes.filter((n) => n.id !== id),
                })),
            clearNotes: () => set({ notes: [] }),
        }),
        {
            name: "wrong-note-storage",
        }
    )
);
