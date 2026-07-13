import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) onCapture(blob);
        }, 'image/jpeg');
      }
    }
  };

  return (
    <div className="space-y-4">
      <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-stone-900" />
      <canvas ref={canvasRef} className="hidden" />
      <button 
        onClick={capture}
        className="w-full flex items-center justify-center bg-rose-500 text-white rounded-xl px-4 py-3 font-semibold hover:bg-rose-600 transition-colors"
      >
        <Camera className="w-5 h-5 mr-2" /> Capture Photo
      </button>
    </div>
  );
}
