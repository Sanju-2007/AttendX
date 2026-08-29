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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-dark border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Mode Selector Tabs (only show when no photo is previewed) */}
        {!imageSrc && (
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                mode === 'camera'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Camera size={18} />
              Use Camera
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                mode === 'upload'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Upload size={18} />
              Upload Photo
            </button>
          </div>
        )}

        <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
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
                className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all p-6 ${
                  isDragging
                    ? "border-purple-500 bg-purple-500/10 text-purple-300"
                    : "border-white/20 bg-white/5 text-gray-400 hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
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
                  className="cursor-pointer flex flex-col items-center justify-center gap-4 w-full h-full"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-lg transition-all">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Drag & drop class photo here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    Supports: JPG, JPEG, PNG
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
                className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-violet-600 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              >
                <Camera size={20} />
                Take Photo
              </button>
            )
          ) : (
            <>
              <button
                onClick={retake}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition"
              >
                <RefreshCw size={20} />
                {mode === 'camera' ? 'Retake' : 'Clear & Upload New'}
              </button>
              <button
                onClick={confirm}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              >
                <Check size={20} />
                Confirm Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
