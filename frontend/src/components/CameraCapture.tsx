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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="mac-window bg-white/90 max-w-2xl w-full p-6 relative overflow-hidden shadow-2xl">
        {/* Mac Window Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
          <div className="mac-dots">
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <h2 className="text-sm font-bold text-black tracking-tight">{title}</h2>
          <button onClick={onCancel} className="text-neutral-400 hover:text-black transition p-1 rounded-lg hover:bg-black/5">
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        {!imageSrc && (
          <div className="flex border-b border-black/[0.06] mb-5">
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-2.5 text-center font-bold text-xs transition-all border-b-2 flex items-center justify-center gap-2 ${
                mode === 'camera'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              <Camera size={16} />
              Use Camera
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-2.5 text-center font-bold text-xs transition-all border-b-2 flex items-center justify-center gap-2 ${
                mode === 'upload'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              <Upload size={16} />
              Upload Photo
            </button>
          </div>
        )}

        <div className="relative bg-neutral-100 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-black/10 shadow-inner">
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
                    ? "border-black bg-black/[0.04] text-black"
                    : "border-black/20 bg-white/60 text-neutral-500 hover:border-black hover:bg-white hover:text-black"
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
                  <div className="w-12 h-12 rounded-2xl bg-black/[0.04] flex items-center justify-center border border-black/10 text-black shadow-sm">
                    <Upload size={22} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-black text-sm">Drag & drop photo here</p>
                    <p className="text-xs text-neutral-400 mt-0.5">or click to browse from device</p>
                  </div>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.06] text-neutral-600">
                    JPG, JPEG, PNG
                  </span>
                </label>
              </div>
            )
          ) : (
            <img src={imageSrc} alt="Preview" className="w-full h-full object-contain bg-black" />
          )}
        </div>

        <div className="mt-5 flex justify-center gap-3">
          {!imageSrc ? (
            mode === 'camera' && (
              <button
                onClick={capture}
                className="flex items-center gap-2 px-6 py-2.5 btn-high-black font-bold rounded-xl text-xs transition"
              >
                <Camera size={16} />
                Take Photo
              </button>
            )
          ) : (
            <>
              <button
                onClick={retake}
                className="flex items-center gap-2 px-5 py-2.5 bg-black/[0.04] hover:bg-black/[0.08] text-black font-semibold rounded-xl border border-black/10 text-xs transition"
              >
                <RefreshCw size={15} />
                {mode === 'camera' ? 'Retake' : 'Clear & Re-upload'}
              </button>
              <button
                onClick={confirm}
                className="flex items-center gap-2 px-6 py-2.5 btn-high-black font-bold rounded-xl text-xs transition"
              >
                <Check size={15} />
                Confirm Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
