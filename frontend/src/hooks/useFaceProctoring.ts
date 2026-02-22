import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceDetectionOptions {
    onViolation: (type: string, weight: number, metadata?: any) => void;
    enabled: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const useFaceProctoring = ({ onViolation, enabled, videoRef }: FaceDetectionOptions) => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const detectionInterval = useRef<NodeJS.Timeout | null>(null);
    const consecutiveMissingFrames = useRef(0);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error('Failed to load face detection models:', error);
            }
        };

        if (enabled) loadModels();
    }, [enabled]);

    const startDetection = useCallback(() => {
        if (!modelsLoaded || !videoRef.current || detectionInterval.current) return;

        detectionInterval.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                );

                if (detections.length === 0) {
                    consecutiveMissingFrames.current += 1;
                    if (consecutiveMissingFrames.current >= 10) { // ~5 seconds based on 500ms interval
                        onViolation('face_missing', 20);
                        consecutiveMissingFrames.current = 0;
                    }
                } else if (detections.length > 1) {
                    onViolation('multiple_faces', 30, { faceCount: detections.length });
                } else {
                    consecutiveMissingFrames.current = 0;
                }
            }
        }, 500);
    }, [modelsLoaded, onViolation, videoRef]);

    useEffect(() => {
        if (enabled && modelsLoaded) {
            startDetection();
        }
        return () => {
            if (detectionInterval.current) clearInterval(detectionInterval.current);
        };
    }, [enabled, modelsLoaded, startDetection]);

    const captureSnapshot = useCallback(() => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.6);
        }
        return null;
    }, [videoRef]);

    return { modelsLoaded, captureSnapshot };
};
