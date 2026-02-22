"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore, useSessionStore } from '@/store/useStore';
import { useAntiCheatGuard } from '@/hooks/useAntiCheatGuard';
import { useFaceProctoring } from '@/hooks/useFaceProctoring';
import { io, Socket } from 'socket.io-client';
import {
    Shield,
    Clock,
    HelpCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Camera,
    LogOut
} from 'lucide-react';

export default function ActiveExamPage() {
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(3600); // 60 mins
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [violations, setViolations] = useState<any[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();
    const params = useParams();
    const user = useAuthStore(s => s.user);
    const token = useAuthStore(s => s.token);

    // 1. Mock Exam Data 
    const exam = {
        id: params.id as string,
        title: 'Advanced Computer Architecture',
        questions: [
            { id: 'q1', type: 'MCQ', content: 'What is the primary benefit of speculative execution in modern processors?', options: ['Lower Power', 'Increased IPC', 'Improved Security', 'Reduced Die Size'] },
            { id: 'q2', type: 'MCQ', content: 'Which cache level is typically closest to the processor core?', options: ['L1', 'L2', 'L3', 'RAM'] },
            { id: 'q3', type: 'MCQ', content: "Amdahl's Law is used to calculate what?", options: ['Network Latency', 'Theoretical Speedup', 'Bitrate', 'Clock Speed'] }
        ]
    };

    // 2. WebSocket Connection
    useEffect(() => {
        if (!token) return;
        const s = io('http://localhost:4000', {
            auth: { token: `Bearer ${token}` }
        });
        setSocket(s);

        s.on('connect', () => {
            s.emit('join_exam', { examId: exam.id, sessionId: 'temp-session-id' });
        });

        return () => { s.disconnect(); };
    }, [token, exam.id]);

    // 3. Violation Handler
    const reportViolation = useCallback((type: string, weight: number, metadata?: any) => {
        setViolations(prev => [...prev, { type, timestamp: new Date() }]);
        if (socket) {
            socket.emit('cheat_event', {
                sessionId: 'temp-session-id',
                examId: exam.id,
                type,
                weight,
                metadata
            });
        }
    }, [socket, exam.id]);

    // 4. Attach Anti-Cheat Hooks
    const { enterFullscreen } = useAntiCheatGuard({
        onViolation: reportViolation,
        examId: exam.id,
        enabled: true
    });

    const { captureSnapshot } = useFaceProctoring({
        onViolation: reportViolation,
        enabled: true,
        videoRef
    });

    // 5. Snapshot Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const img = captureSnapshot();
            if (img && socket) {
                socket.emit('submit_snapshot', {
                    sessionId: 'temp-session-id',
                    examId: exam.id,
                    image: img
                });
            }
        }, 15000); // Every 15s
        return () => clearInterval(interval);
    }, [captureSnapshot, socket, exam.id]);

    // 6. Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 0) {
                    finishExam();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const finishExam = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        router.push('/dashboard');
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const rs = s % 60;
        return `${m}:${rs.toString().padStart(2, '0')}`;
    };

    const currentQ = exam.questions[activeQuestion];

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden select-none">
            {/* Sidebar - Question Navigator & Live Monitoring */}
            <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-slate-900/50 border-r border-slate-800 transition-all duration-300 flex flex-col relative`}>
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-tight">Active Proctor</span>
                    </div>

                    {/* Webcam Mini View */}
                    <div className="relative aspect-video rounded-xl bg-black border border-slate-700 overflow-hidden mb-4">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold tracking-widest text-white/70">SECURED FEED</span>
                        </div>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-4">Question Map</h4>
                    <div className="grid grid-cols-5 gap-3">
                        {exam.questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveQuestion(i)}
                                className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border ${activeQuestion === i
                                        ? 'bg-indigo-600 border-indigo-400 text-white glow-primary'
                                        : answers[exam.questions[i].id]
                                            ? 'bg-slate-800 border-indigo-500/30 text-indigo-400'
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    {violations.length > 0 && (
                        <div className="mt-8">
                            <h4 className="text-xs uppercase font-bold text-red-500 tracking-widest mb-4">Integrity Logs</h4>
                            <div className="space-y-2">
                                {violations.slice(-3).map((v, i) => (
                                    <div key={i} className="text-[10px] text-red-400/70 py-1 border-b border-red-500/10 flex justify-between">
                                        <span className="uppercase font-medium">{v.type}</span>
                                        <span className="opacity-50">{new Date(v.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800">
                    <button
                        onClick={finishExam}
                        className="w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit Session
                    </button>
                </div>
            </aside>

            {/* Main Content Arena */}
            <main className="flex-grow flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
                <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-slate-400 truncate max-w-[300px]">{exam.title}</h2>
                        <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                        <span className="text-xs text-slate-500 font-medium tracking-wider">SECURE_ISO_721</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span className={`font-mono font-bold text-xl ${timeLeft < 300 ? 'text-red-500' : 'text-slate-100'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                        <button
                            onClick={enterFullscreen}
                            className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold transition-all"
                        >
                            Re-enforce Fullscreen
                        </button>
                    </div>
                </header>

                <section className="flex-grow flex items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-2xl w-full">
                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/10 rounded-lg text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-500/20">
                                <HelpCircle className="w-3 h-3" />
                                Question {activeQuestion + 1} of {exam.questions.length}
                            </div>
                            <h1 className="text-2xl font-bold leading-relaxed">
                                {currentQ.content}
                            </h1>
                        </div>

                        <div className="space-y-4">
                            {currentQ.options.map((option, i) => (
                                <div
                                    key={i}
                                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: option }))}
                                    className={`group p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${answers[currentQ.id] === option
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${answers[currentQ.id] === option ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 transition-colors'
                                        }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="font-medium text-lg">{option}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="p-8 border-t border-slate-800 bg-slate-900/20 flex justify-between items-center">
                    <button
                        disabled={activeQuestion === 0}
                        onClick={() => setActiveQuestion(v => v - 1)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-sm font-bold transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <div className="flex gap-4">
                        <div className="flex -space-x-2">
                            {[...Array(exam.questions.length)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full border border-slate-950 ${answers[exam.questions[i].id] ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (activeQuestion === exam.questions.length - 1) finishExam();
                            else setActiveQuestion(v => v + 1);
                        }}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {activeQuestion === exam.questions.length - 1 ? 'Finish Submission' : 'Next Question'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </footer>
            </main>

            {/* Extreme Security Toast/Alert */}
            {violations.length > 5 && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold text-sm tracking-wide">MULTIPLE INTEGRITY VIOLATIONS DETECTED</span>
                    </div>
                </div>
            )}
        </div>
    );
}
