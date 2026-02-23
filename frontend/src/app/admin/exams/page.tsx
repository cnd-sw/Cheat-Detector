"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import {
    Plus,
    FileText,
    Clock,
    Settings,
    Trash2,
    Edit,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Trophy,
    Layout
} from 'lucide-react';

export default function ExamManager() {
    const [exams, setExams] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newExam, setNewExam] = useState({
        title: '',
        description: '',
        timeLimit: 60,
        randomize: true,
        shuffleOptions: true,
    });

    const token = useAuthStore(s => s.token);

    const fetchExams = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:4000/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (err) {
            console.error('Failed to fetch exams', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [token]);

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:4000/exams', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newExam)
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                fetchExams();
                setNewExam({ title: '', description: '', timeLimit: 60, randomize: true, shuffleOptions: true });
            }
        } catch (err) {
            console.error('Failed to create exam', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] p-8">
            <header className="flex justify-between items-center mb-10 text-white">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Exam Orchestrator
                    </h1>
                    <p className="text-slate-400">Design and manage secure assessment protocols.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create New Exam
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="glass-card h-64 animate-pulse rounded-3xl" />
                    ))
                ) : exams.map((exam) => (
                    <div key={exam.id} className="glass-card p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-indigo-400">
                                <Layout className="w-6 h-6" />
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${exam.status === 'PUBLISHED' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-slate-400/10 text-slate-400 border border-slate-400/20'
                                }`}>
                                {exam.status}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{exam.title}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2">{exam.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                <Clock className="w-4 h-4 text-slate-500" />
                                {exam.timeLimit} Min
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                <FileText className="w-4 h-4 text-slate-500" />
                                {exam._count?.questions || 0} Questions
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-white/5">
                            <button className="flex-grow py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                                <Edit className="w-3.5 h-3.5" />
                                Edit Paper
                            </button>
                            <button className="p-2.5 bg-slate-900 hover:bg-red-900/20 border border-slate-800 hover:border-red-500/30 rounded-xl text-slate-500 hover:text-red-400 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Exam Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-lg rounded-[2.5rem] p-8 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold text-white mb-2">Initialize New Session</h2>
                        <p className="text-slate-400 text-sm mb-8">Set the core metadata for your assessment.</p>

                        <form onSubmit={handleCreateExam} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Exam Title</label>
                                <input
                                    required
                                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-5 py-4 text-white outline-none transition-all placeholder:text-slate-700"
                                    placeholder="e.g. Advanced AI Safety & Ethics"
                                    value={newExam.title}
                                    onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Brief Description</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-5 py-4 text-white outline-none transition-all h-24 resize-none placeholder:text-slate-700"
                                    placeholder="Explain the scope and objectives..."
                                    value={newExam.description}
                                    onChange={e => setNewExam({ ...newExam, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Time Limit (Min)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-5 py-4 text-white outline-none transition-all"
                                        value={newExam.timeLimit}
                                        onChange={e => setNewExam({ ...newExam, timeLimit: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex flex-col justify-end gap-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                                            checked={newExam.randomize}
                                            onChange={e => setNewExam({ ...newExam, randomize: e.target.checked })}
                                        />
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Randomize Order</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-grow py-4 bg-slate-900 border border-slate-800 rounded-2xl font-bold text-slate-400 hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-indigo-600 rounded-2xl font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                                >
                                    Initialize
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
