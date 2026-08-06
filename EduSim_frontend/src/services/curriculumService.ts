import { CLASSES } from "@/data/curriculum";

export interface DBClass {
  id: number;
  name: string;
  description: string;
}

export interface DBSubject {
  id: string;
  class_id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
}

export interface DBChapter {
  id: string;
  subject_id: string;
  name: string;
  description: string;
}

export interface DBTopic {
  id: string;
  chapter_id: string;
  name: string;
  description: string;
  has_simulation: boolean;
  simulation_route: string | null;
}

export const CurriculumService = {
  getClasses: async (): Promise<DBClass[]> => {
    return CLASSES.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description
    }));
  },

  getSubjects: async (classId: number): Promise<DBSubject[]> => {
    const cls = CLASSES.find(c => c.id === classId);
    if (!cls) return [];
    return cls.subjects.map(s => ({
      id: s.id,
      class_id: cls.id,
      code: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon
    }));
  },

  getChapters: async (subjectId: string, classId?: number): Promise<DBChapter[]> => {
    let subject: any = null;
    const normSubjectId = (subjectId || "").toLowerCase();
    for (const c of CLASSES) {
      // If classId is provided, only search within that class
      if (classId !== undefined && c.id !== classId) continue;
      const s = c.subjects.find(sub => (sub.id || "").toLowerCase() === normSubjectId);
      if (s) {
        subject = s;
        break;
      }
    }
    if (!subject || typeof subject.chapters === 'number' || !Array.isArray(subject.chapters)) {
      return [];
    }
    
    return subject.chapters.map((ch: any) => ({
      id: ch.name,
      subject_id: subjectId,
      name: ch.name,
      description: ""
    }));
  },

  getTopics: async (chapterId: string, classId?: number): Promise<DBTopic[]> => {
    let chapter: any = null;
    let decodedChapterId = chapterId || "";
    try {
      decodedChapterId = decodeURIComponent(chapterId);
    } catch (e) {
      // ignore decode error
    }
    const normChapterId = decodedChapterId.toLowerCase();

    for (const c of CLASSES) {
      if (classId !== undefined && c.id !== classId) continue;
      for (const s of c.subjects) {
        if (s && typeof s.chapters !== 'number' && Array.isArray(s.chapters)) {
          const ch = s.chapters.find((chap: any) => (chap.name || "").toLowerCase() === normChapterId);
          if (ch) {
            chapter = ch;
            break;
          }
        }
      }
      if (chapter) break;
    }
    if (!chapter || !Array.isArray(chapter.topics)) return [];
    
    return chapter.topics.map((t: any) => ({
      id: t.name,
      chapter_id: chapterId,
      name: t.name,
      description: "",
      has_simulation: t.hasSimulation || false,
      simulation_route: t.simulationRoute || null
    }));
  }
};
