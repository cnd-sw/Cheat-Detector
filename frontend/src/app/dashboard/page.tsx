"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { BookOpen, Clock, Calendar, ShieldCheck, TrendingUp, Award, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchExams = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:4000/exams/available', {
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
        if (!user) {
            router.push('/');
        } else {
            fetchExams();
        }
    }, [user, token]);

    if (!user) return null;

    const pastResults = [
        {
            id: 'res-1',
            examTitle: 'Introduction to Discrete Math',
            score: 92,
            date: '2024-02-15',
            status: 'Passed',
            flags: 0,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 p-8 sm:p-12">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user.firstName}!</h1>
                    <p className="text-slate-400">You have {exams.length} upcoming examinations this week.</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 border border-slate-800 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="pr-4">
                        <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Honor Score</p>
                        <p className="text-lg font-bold text-emerald-400 font-mono">98/100</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Exams */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                        Available Assessments
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {exams.map((exam) => (
                            <div key={exam.id} className="glass-card rounded-3xl p-6 flex flex-col group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${exam.difficulty === 'Expert' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-orange-400/10 text-orange-400 border border-orange-400/20'
                                        }`}>
                                        {exam.difficulty}
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{exam.title}</h3>
                                <p className="text-slate-400 text-sm mb-6 flex-grow line-clamp-2">{exam.description}</p>
                                <div className="flex items-center gap-6 mb-6 text-xs text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {exam.timeLimit} Minutes
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        Due Feb 28
                                    </div>
                                </div>
                                <Link href={`/exams/${exam.id}/prepare`}>
                                    <button className="w-full py-3 bg-slate-800 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                        Enter Secure Portal
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Stats & History */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            Recent Credentials
                        </h2>
                        <div className="space-y-4">
                            {pastResults.map((res) => (
                                <div key={res.id} className="glass-card p-4 rounded-2xl flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${res.score >= 90 ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20'
                                        }`}>
                                        {res.score}%
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-bold truncate">{res.examTitle}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{res.date} • {res.flags} events</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-600 hover:text-white cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-600/30">
                        <ShieldCheck className="w-10 h-10 mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">Verified Identity</h3>
                        <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                            Your biometric data is securely stored. You're set for seamless entry into all proctored exams.
                        </p>
                        <button className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-sm transition-all">
                            Manage Security Keys
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
