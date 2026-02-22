"use client";

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { Camera, ShieldCheck, Monitor, Info, ChevronRight, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

export default function ExamPreparePage() {
    const [loading, setLoading] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [checks, setChecks] = useState({
        camera: false,
        environment: false,
        identity: false,
        lockdown: false
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();
    const params = useParams();

    const startCamera = async () => {
        try {
            const media = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(media);
            if (videoRef.current) videoRef.current.srcObject = media;
            setChecks(prev => ({ ...prev, camera: true }));
        } catch (err) {
            console.error("Camera access denied", err);
        }
    };

    const runAllChecks = () => {
        setLoading(true);
        // Simulate complex environment checks
        setTimeout(() => {
            setChecks({
                camera: true,
                environment: true,
                identity: true,
                lockdown: true
            });
            setLoading(false);
        }, 2000);
    };

    const startExam = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        router.push(`/exams/${params.id}/active`);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20 mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            Secure Portal Entry
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-4">Environment Verification</h1>
                        <p className="text-slate-400 leading-relaxed">
                            We need to verify your testing environment before you begin. This ensures a fair and secure examination for all candidates.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <CheckItem
                            title="Camera Access"
                            desc="Required for real-time monitoring and face-ID verification."
                            checked={checks.camera}
                            onClick={startCamera}
                        />
                        <CheckItem
                            title="System Check"
                            desc="Verifying browser capabilities and active window lockdown."
                            checked={checks.lockdown}
                        />
                        <CheckItem
                            title="Identity Verification"
                            desc="Automatic biometric matching against your profile."
                            checked={checks.identity}
                        />
                    </div>

                    <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-400" />
                            Rules of Engagement
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex gap-3">
                                <span className="text-indigo-500 font-bold">•</span>
                                Do not leave the fullscreen window during the exam.
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-500 font-bold">•</span>
                                Ensure you are in a quiet, well-lit room with no one else present.
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-500 font-bold">•</span>
                                External monitors and screen sharing are strictly prohibited.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Webcam View */}
                    <div className="relative aspect-video rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl group">
                        {!stream ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-800 transition-all" onClick={startCamera}>
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <p className="text-slate-500 font-medium">Click to initialize camera</p>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover grayscale opacity-80"
                            />
                        )}

                        {stream && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 rounded-lg text-[10px] font-bold text-white flex items-center gap-2 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                LIVE FEED SECURED
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {Object.values(checks).every(c => c) ? (
                            <button
                                onClick={startExam}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                Commence Examination
                                <Key className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={runAllChecks}
                                disabled={loading}
                                className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                            >
                                {loading ? "Running Security Protocols..." : "Initiate System Check"}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                        <p className="text-center text-xs text-slate-500">
                            By proceeding, you agree to continuous monitoring and biometric logging.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckItem({ title, desc, checked, onClick }: any) {
    return (
        <div
            className={`p-5 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer ${checked ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                }`}
            onClick={onClick}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${checked ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                <CheckCircle2 className={`w-5 h-5 ${checked ? 'opacity-100' : 'opacity-20'}`} />
            </div>
            <div className="flex-grow">
                <h4 className={`text-sm font-bold ${checked ? 'text-indigo-100' : 'text-slate-300'}`}>{title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
        </div>
    );
}
