"use client";
import React, { useRef, useState, useCallback } from "react";
import { Camera, X, Check, RefreshCw, Upload } from "lucide-react";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function CameraCapture({ onCapture, onCancel, title = "Capture Image" }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isDragging, setIsDragging] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      if (image) {
        setImageSrc(image);
      }
    }
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
  };

  const confirm = () => {
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="water-pane bg-[#070B16]/95 max-w-2xl w-full p-6 relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs (only show when no photo is previewed) */}
        {!imageSrc && (
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                mode === 'camera'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Camera size={18} />
              Use Camera
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                mode === 'upload'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Upload size={18} />
              Upload Photo
            </button>
          </div>
        )}

        <div className="relative bg-[#03060E] rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/10 shadow-inner">
          {!imageSrc ? (
            mode === 'camera' ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
                onUserMediaError={(err) => console.error("Webcam error:", err)}
              />
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all p-6 ${
                  isDragging
                    ? "border-sky-400 bg-sky-950/20 text-sky-300"
                    : "border-white/15 bg-white/5 text-slate-400 hover:border-sky-400/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full h-full"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-950/50 flex items-center justify-center border border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                    <Upload size={26} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white text-base">Drag & drop photo here</p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse from device</p>
                  </div>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                    JPG, JPEG, PNG
                  </span>
                </label>
              </div>
            )
          ) : (
            <img src={imageSrc} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          {!imageSrc ? (
            mode === 'camera' && (
              <button
                onClick={capture}
                className="flex items-center gap-2 px-6 py-3 btn-water font-bold rounded-xl transition"
              >
                <Camera size={18} />
                Take Photo
              </button>
            )
          ) : (
            <>
              <button
                onClick={retake}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/10 transition"
              >
                <RefreshCw size={18} />
                {mode === 'camera' ? 'Retake' : 'Clear & Re-upload'}
              </button>
              <button
                onClick={confirm}
                className="flex items-center gap-2 px-6 py-3 btn-water font-bold rounded-xl transition"
              >
                <Check size={18} />
                Confirm Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
