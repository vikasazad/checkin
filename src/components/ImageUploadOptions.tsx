"use client";

import { useState, useRef } from "react";
import type { Guest } from "@/lib/reservations";
import CameraCapture from "./CameraCapture";

interface ImageUploadOptionsProps {
  guest: Guest;
  side: "front" | "back";
  onImageCaptured: (imageData: string) => void;
  onClose: () => void;
}

export default function ImageUploadOptions({
  guest,
  side,
  onImageCaptured,
  onClose,
}: ImageUploadOptionsProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraOption = () => {
    setShowCamera(true);
  };

  const handleGalleryOption = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsProcessing(true);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result as string;
          onImageCaptured(imageData);
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error processing image:", error);
        setIsProcessing(false);
      }
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        guest={guest}
        side={side}
        onImageCaptured={onImageCaptured}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 animate-scale-in">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-light text-black">
                Upload {side === "front" ? "Front" : "Back"} of ID
              </h3>
              <p className="text-sm text-gray-600 mt-1">{guest.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={handleCameraOption}
            disabled={isProcessing}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Using Camera</span>
          </button>

          <button
            onClick={handleGalleryOption}
            disabled={isProcessing}
            className="w-full bg-gray-100 hover:bg-gray-200 text-black font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <div className="flex items-center justify-center space-x-3 ">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Using Gallery</span>
              </div>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="p-6 pt-0">
          <p className="text-xs text-gray-500 text-center">
            Please upload a clear photo of the{" "}
            {side === "front" ? "front" : "back"} of the guest&apos;s
            driver&apos;s license or state ID
          </p>
        </div>
      </div>
    </div>
  );
}
