import { create } from "zustand"

export type BuilderExercise = {
  itemId: string
  exerciseId: string
  name: string
  thumbnailUrl: string | null
  sets: number
  reps: number | null
  durationSeconds: number | null
  notes: string
}

export type BuilderContent = {
  contentId: string
  name: string
  type: string
  fileUrl: string | null
  externalUrl: string | null
}

type ProgramBuilderState = {
  isOpen: boolean
  programName: string
  exercises: BuilderExercise[]
  contentItems: BuilderContent[]
  open: () => void
  close: () => void
  setOpen: (v: boolean) => void
  setProgramName: (name: string) => void
  addExercise: (ex: Omit<BuilderExercise, "itemId">) => void
  removeExercise: (itemId: string) => void
  updateExercise: (itemId: string, patch: Partial<Omit<BuilderExercise, "itemId" | "exerciseId">>) => void
  addContent: (c: BuilderContent) => void
  removeContent: (contentId: string) => void
  hasExercise: (exerciseId: string) => boolean
  hasContent: (contentId: string) => boolean
  clearAll: () => void
}

export const useProgramBuilder = create<ProgramBuilderState>((set, get) => ({
  isOpen: false,
  programName: "Program",
  exercises: [],
  contentItems: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setOpen: (v) => set({ isOpen: v }),
  setProgramName: (name) => set({ programName: name }),
  addExercise: (ex) =>
    set((s) => ({
      exercises: [...s.exercises, { ...ex, itemId: `${ex.exerciseId}-${Date.now()}` }],
    })),
  removeExercise: (itemId) =>
    set((s) => ({ exercises: s.exercises.filter((e) => e.itemId !== itemId) })),
  updateExercise: (itemId, patch) =>
    set((s) => ({
      exercises: s.exercises.map((e) => (e.itemId === itemId ? { ...e, ...patch } : e)),
    })),
  addContent: (c) =>
    set((s) => ({
      contentItems: s.contentItems.some((x) => x.contentId === c.contentId)
        ? s.contentItems
        : [...s.contentItems, c],
    })),
  removeContent: (contentId) =>
    set((s) => ({ contentItems: s.contentItems.filter((c) => c.contentId !== contentId) })),
  hasExercise: (exerciseId) => get().exercises.some((e) => e.exerciseId === exerciseId),
  hasContent: (contentId) => get().contentItems.some((c) => c.contentId === contentId),
  clearAll: () => set({ exercises: [], contentItems: [], programName: "Program" }),
}))
