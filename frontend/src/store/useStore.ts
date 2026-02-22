import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'PROCTOR' | 'STUDENT';
    organizationId: string;
    organizationName?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => set({ user, token }),
            logout: () => set({ user: null, token: null }),
        }),
        { name: 'auth-storage' }
    )
);

interface ExamSession {
    id: string;
    examId: string;
    exam: any;
    answers: any[];
    startTime: string;
    status: string;
}

interface SessionState {
    currentSession: ExamSession | null;
    setSession: (session: ExamSession | null) => void;
    updateAnswer: (questionId: string, response: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    currentSession: null,
    setSession: (session) => set({ currentSession: session }),
    updateAnswer: (questionId, response) => set((state) => {
        if (!state.currentSession) return state;
        const existing = state.currentSession.answers.find(a => a.questionId === questionId);
        let newAnswers;
        if (existing) {
            newAnswers = state.currentSession.answers.map(a =>
                a.questionId === questionId ? { ...a, response } : a
            );
        } else {
            newAnswers = [...state.currentSession.answers, { questionId, response }];
        }
        return {
            currentSession: { ...state.currentSession, answers: newAnswers }
        };
    }),
}));
