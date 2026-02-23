"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { io, Socket } from 'socket.io-client';
import {
    Users,
    ShieldAlert,
    Activity,
    Search,
    Filter,
    MoreVertical,
    User,
    Clock,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    Zap,
    Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function ProctorDashboard() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [liveStudents, setLiveStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { token, user } = useAuthStore(s => ({ token: s.token, user: s.user }));

    const fetchActiveSessions = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:4000/sessions/active/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLiveStudents(data.map((s: any) => ({
                    id: s.id,
                    userId: s.userId,
                    name: `${s.user.firstName} ${s.user.lastName}`,
                    status: s.status,
                    risk: s.riskLevel,
                    score: s.suspicionScore,
                    lastActivity: 'Just now',
                    examTitle: s.exam.title
                })));
            }
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchActiveSessions();

        const s = io('http://localhost:4000', { auth: { token: `Bearer ${token}` } });
        setSocket(s);

        s.on('connect', () => {
            console.log('Connected to socket server');
            s.emit('proctor_join', { examId: 'global' });
        });

        s.on('student_joined', (data) => {
            fetchActiveSessions();
        });

        s.on('suspicion_alert', (data) => {
            setAlerts(prev => [data, ...prev].slice(0, 15));
            // Update student risk status in real-time
            setLiveStudents(prev => prev.map(s =>
                s.userId === data.userId ? { ...s, score: data.totalScore, risk: data.severity.toLowerCase() } : s
            ));
        });

        return () => { s.disconnect(); };
    }, [token]);

    const stats = [
        { label: 'Active Examinees', value: '42', icon: Users, color: 'text-indigo-400' },
        { label: 'Integrity Alerts', value: alerts.length.toString(), icon: ShieldAlert, color: 'text-red-400' },
        { label: 'Avg Risk Score', value: '12.4', icon: Activity, color: 'text-emerald-400' },
    ];

    const chartData = [
        { name: '00:00', alerts: 2 },
        { name: '00:05', alerts: 5 },
        { name: '00:10', alerts: 3 },
        { name: '00:15', alerts: 12 },
        { name: '00:20', alerts: 8 },
        { name: '00:25', alerts: 4 },
    ];

    return (
        <div className="min-h-screen bg-[#020617] p-8">
            <header className="flex justify-between items-center mb-10 text-white">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Proctor Control Center</h1>
                    <p className="text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Real-time Monitoring Active • Advanced Arch (Exam ID: ARC-99)
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        Security Audit
                    </button>
                    <button className="px-6 py-3 bg-indigo-600 rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">
                        Broadcast to All
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Live Metric</span>
                        </div>
                        <h3 className="text-4xl font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
                        <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Feed & Alerts */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                            <h2 className="text-lg font-bold text-white">Live Session Watchlist</h2>
                            <div className="flex gap-2">
                                <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"><Search className="w-4 h-4" /></button>
                                <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"><Filter className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                        <th className="px-6 py-4 font-bold">Candidate</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Risk Level</th>
                                        <th className="px-6 py-4 font-bold">Inactivity</th>
                                        <th className="px-6 py-4 font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {liveStudents.map((s) => (
                                        <tr key={s.id} className="group hover:bg-white/2 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{s.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">UID: {s.id.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                                    <span className="text-xs font-bold text-slate-300">{s.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${s.risk === 'high_risk' ? 'bg-red-400/10 text-red-500 border-red-500/20' :
                                                    s.risk === 'review' ? 'bg-orange-400/10 text-orange-500 border-orange-500/20' :
                                                        'bg-emerald-400/10 text-emerald-500 border-emerald-500/20'
                                                    }`}>
                                                    {s.risk.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {s.lastActivity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                                                    <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"><MoreVertical className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Real-time Event Log Sidebar */}
                <div className="space-y-8">
                    <div className="glass-card p-6 rounded-3xl h-[400px] flex flex-col">
                        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-400" />
                            Event Pulse
                        </h3>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {alerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 grayscale opacity-50">
                                    <ShieldAlert className="w-12 h-12 mb-2" />
                                    <p className="text-xs font-medium uppercase tracking-widest">Listening for events...</p>
                                </div>
                            ) : (
                                alerts.map((a, i) => (
                                    <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-start gap-4 animate-in slide-in-from-right duration-300">
                                        <div className={`p-2 rounded-lg ${a.severity === 'CRITICAL' ? 'bg-red-600/20 text-red-500' : 'bg-orange-600/20 text-orange-500'}`}>
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-xs text-white">
                                                <span className="font-bold">{a.userId === 's2' ? 'Sarah Miller' : 'Student'}</span> flagged for <span className="text-indigo-400 font-bold font-mono">{a.type.toUpperCase()}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-1 font-medium">{new Date(a.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-sm font-bold text-white mb-6">Integrity Violation Trend</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="alerts" stroke="#6366f1" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={3} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
