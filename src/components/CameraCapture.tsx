"use client";

import { useState, useRef, useEffect } from "react";
import type { Guest } from "@/lib/reservations";

interface CameraCaptureProps {
  guest: Guest;
  side: "front" | "back";
  onImageCaptured: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraCapture({
  guest,
  side,
  onImageCaptured,
  onClose,
}: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile devices
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);
      setPermissionDenied(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setPermissionDenied(true);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Get video dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Get the display dimensions of the video element
        const displayWidth = video.clientWidth;
        const displayHeight = video.clientHeight;

        // Calculate the frame dimensions (85% of viewport width, max 448px, aspect ratio 1.6:1)
        const viewportWidth = window.innerWidth;
        const frameWidth = Math.min(viewportWidth * 0.85, 448); // 85% of viewport, max 448px (28rem)
        const frameHeight = frameWidth / 1.6; // aspect ratio 1.6:1

        // Calculate the frame position (centered on screen)
        const frameLeft = (displayWidth - frameWidth) / 2;
        const frameTop = (displayHeight - frameHeight) / 2;

        // Calculate scale factors between display size and actual video size
        const scaleX = videoWidth / displayWidth;
        const scaleY = videoHeight / displayHeight;

        // Map frame coordinates from screen space to video space
        const cropX = frameLeft * scaleX;
        const cropY = frameTop * scaleY;
        const cropWidth = frameWidth * scaleX;
        const cropHeight = frameHeight * scaleY;

        // Set canvas dimensions to match the cropped area
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw only the cropped section of the video to canvas
        context.drawImage(
          video,
          cropX,
          cropY,
          cropWidth,
          cropHeight, // Source rectangle (from video)
          0,
          0,
          cropWidth,
          cropHeight // Destination rectangle (on canvas)
        );

        // Convert canvas to base64 image
        const imageData = canvas.toDataURL("image/jpeg", 0.9);

        // Stop camera and send image
        stopCamera();
        onImageCaptured(imageData);
      }
    }
  };

  const handleBack = () => {
    stopCamera();
    onClose();
  };

  if (permissionDenied) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-black mb-4">
            Camera Permission Required
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Camera permission is not allowed. Please enable camera access in
            your browser settings to use this feature.
          </p>
          <button
            onClick={handleBack}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hidden canvas for capturing image */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* ID Card Frame Overlay */}
      {!isLoading && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay with cutout */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Center frame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-md aspect-[1.6/1]">
              {/* Frame border */}
              <div className="absolute inset-0 border-4 border-white rounded-2xl shadow-2xl">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gray-300 -translate-x-2 -translate-y-2 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gray-300 translate-x-2 -translate-y-2 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gray-300 -translate-x-2 translate-y-2 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gray-300 translate-x-2 translate-y-2 rounded-br-lg"></div>
              </div>

              {/* ID card icon in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/80 to-transparent p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-white hover:text-gray-300 transition-colors flex items-center space-x-2"
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
                <span>Cancel</span>
              </button>
              <div className="text-right">
                <p className="text-white font-medium">{guest.name}</p>
                <p className="text-gray-300 text-sm">ID Verification</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-32 left-0 right-0 px-6">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-6 text-center max-w-md mx-auto border border-white/20">
              <h3 className="text-white text-xl font-medium mb-2">
                Scan {side === "front" ? "Front" : "Back"} of ID
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Position the {side === "front" ? "front" : "back"} of your
                driver&apos;s license or state ID in the frame. Use a well-lit
                area and a simple dark background.
              </p>
            </div>
          </div>

          {/* Capture Button */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              onClick={captureImage}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform border-4 border-gray-300"
            >
              <div className="w-16 h-16 bg-gray-800 rounded-full"></div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
