import { useEffect, useRef, useCallback } from 'react';

interface GuardOptions {
    onViolation: (type: string, weight: number, metadata?: any) => void;
    examId: string;
    enabled: boolean;
}

export const useAntiCheatGuard = ({ onViolation, examId, enabled }: GuardOptions) => {
    const lastFocusTime = useRef<number>(Date.now());
    const isFullscreen = useRef<boolean>(false);

    // 1. Tab / Focus Tracking
    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            onViolation('tab_switch', 10, { timestamp: new Date() });
        }
    }, [onViolation]);

    const handleBlur = useCallback(() => {
        onViolation('window_blur', 5, { timestamp: new Date() });
    }, [onViolation]);

    // 2. Fullscreen Enforcement
    const handleFullscreenChange = useCallback(() => {
        if (!document.fullscreenElement) {
            onViolation('fullscreen_exit', 15, { timestamp: new Date() });
        }
    }, [onViolation]);

    // 3. Right Click & Selection Blocking
    const preventContext = useCallback((e: MouseEvent) => {
        e.preventDefault();
        onViolation('right_click_attempt', 2);
    }, [onViolation]);

    const preventCopyPaste = useCallback((e: ClipboardEvent) => {
        e.preventDefault();
        onViolation('copy_paste_attempt', 15, { type: e.type });
    }, [onViolation]);

    // 4. Keyboard Shortcuts Detection
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isControl = e.ctrlKey || e.metaKey;

        // Check for Inspect Element, Print, Save, Search, etc.
        if ((isControl && (e.key === 'i' || e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c' || e.key === 'v')) ||
            e.key === 'F12' || e.key === 'PrintScreen') {
            e.preventDefault();
            onViolation('forbidden_shortcut', 12, { key: e.key });
        }
    }, [onViolation]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('contextmenu', preventContext);
        document.addEventListener('copy', preventCopyPaste);
        document.addEventListener('paste', preventCopyPaste);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('contextmenu', preventContext);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, handleVisibilityChange, handleBlur, handleFullscreenChange, preventContext, preventCopyPaste, handleKeyDown]);

    const enterFullscreen = () => {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    };

    return { enterFullscreen };
};
