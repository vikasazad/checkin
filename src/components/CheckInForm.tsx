"use client";

import { useState } from "react";
import type { Reservation, Guest } from "@/lib/reservations";
import ImageUploadOptions from "./ImageUploadOptions";
import { uploadBase64ToFirebase } from "@/lib/imageUpload";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CheckInFormProps {
  reservation: Reservation;
  onBack: () => void;
}

interface GuestImage {
  guestId: string;
  frontImageData?: string;
  backImageData?: string;
  frontFirebaseUrl?: string;
  backFirebaseUrl?: string;
}

interface UploadStatus {
  guestId: string;
  uploading: boolean;
  error?: string;
}

export default function CheckInForm({ reservation, onBack }: CheckInFormProps) {
  const router = useRouter();
  const [guestImages, setGuestImages] = useState<GuestImage[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [capturingSide, setCapturingSide] = useState<"front" | "back">("front");
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageCapture = (
    guestId: string,
    imageData: string,
    side: "front" | "back"
  ) => {
    console.log(`${side} image captured for guest ${guestId}`);

    // Add the image to state for preview (stored locally, not uploaded yet)
    setGuestImages((prev) => {
      const existing = prev.find((img) => img.guestId === guestId);
      if (existing) {
        return prev.map((img) =>
          img.guestId === guestId
            ? {
                ...img,
                ...(side === "front"
                  ? { frontImageData: imageData }
                  : { backImageData: imageData }),
              }
            : img
        );
      }
      return [
        ...prev,
        {
          guestId,
          ...(side === "front"
            ? { frontImageData: imageData }
            : { backImageData: imageData }),
        },
      ];
    });
    setSelectedGuest(null);
  };

  const getImageForGuest = (guestId: string, side: "front" | "back") => {
    const guestImage = guestImages.find((img) => img.guestId === guestId);
    return side === "front"
      ? guestImage?.frontImageData
      : guestImage?.backImageData;
  };

  const hasAllImages = (guestId: string) => {
    const guestImage = guestImages.find((img) => img.guestId === guestId);
    return !!(guestImage?.frontImageData && guestImage?.backImageData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all guests have both front and back images
    const allGuestsComplete = reservation.guests.every((guest) =>
      hasAllImages(guest.id)
    );

    if (!allGuestsComplete) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all images to Firebase
      const uploadPromises = guestImages.map(async (guestImage) => {
        const guest = reservation.guests.find(
          (g) => g.id === guestImage.guestId
        );
        const guestName = guest?.name.replace(/\s+/g, "_") || "guest";
        const path = `checkin/${reservation.bookingId}/${guestImage.guestId}`;

        // Set uploading status for this guest
        setUploadStatuses((prev) => [
          ...prev.filter((s) => s.guestId !== guestImage.guestId),
          { guestId: guestImage.guestId, uploading: true },
        ]);

        const results = await Promise.all([
          // Upload front image
          guestImage.frontImageData
            ? uploadBase64ToFirebase(
                guestImage.frontImageData,
                path,
                `${guestName}_id_front.jpg`
              )
            : null,
          // Upload back image
          guestImage.backImageData
            ? uploadBase64ToFirebase(
                guestImage.backImageData,
                path,
                `${guestName}_id_back.jpg`
              )
            : null,
        ]);

        // Update with Firebase URLs
        setGuestImages((prev) =>
          prev.map((img) =>
            img.guestId === guestImage.guestId
              ? {
                  ...img,
                  frontFirebaseUrl: results[0] || img.frontFirebaseUrl,
                  backFirebaseUrl: results[1] || img.backFirebaseUrl,
                }
              : img
          )
        );

        // Clear uploading status for this guest
        setUploadStatuses((prev) =>
          prev.filter((s) => s.guestId !== guestImage.guestId)
        );

        console.log(
          `Images uploaded successfully for guest ${guestImage.guestId}`,
          results
        );

        return results;
      });

      await Promise.all(uploadPromises);

      console.log("Check-in completed! All images uploaded:", guestImages);
      setShowSuccess(true);

      // Redirect to phone number entry page after showing success
      setTimeout(() => {
        onBack();
      }, 3000);
    } catch (error) {
      console.error("Error uploading images:", error);
      setUploadStatuses((prev) => [
        ...prev.map((s) => ({
          ...s,
          uploading: false,
          error: "Upload failed. Please try again.",
        })),
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUploadStatus = (guestId: string) => {
    return uploadStatuses.find((s) => s.guestId === guestId);
  };

  const completedCount = reservation.guests.filter((guest) =>
    hasAllImages(guest.id)
  ).length;
  const totalCount = reservation.guests.length;
  const progress = (completedCount / totalCount) * 100;

  if (showSuccess) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-light text-black mb-4">
              Check-In Complete
            </h2>
            <p className="text-gray-600 mb-6">Welcome to The Hotel!</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-black font-medium">
                {reservation.roomCategory} Room
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {reservation.nights}{" "}
                {reservation.nights === 1 ? "night" : "nights"}
              </p>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Your room keys are ready at the reception desk
            </p>
            <button
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-black mb-2 tracking-wide">
            Guest Information
          </h1>
          <div className="h-px w-32 bg-linear-to-r from-transparent via-black to-transparent mx-auto mb-4"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-500 text-sm">Booking ID</p>
              <p className="text-black font-medium text-xs">
                {reservation.bookingId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Room Category</p>
              <p className="text-black font-medium text-xl">
                {reservation.roomCategory}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-gray-500 text-sm">Guest Name</p>
              <p className="text-black font-medium">{reservation.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Phone</p>
              <p className="text-black font-medium">{reservation.phone}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Check-In</p>
              <p className="text-black font-medium">
                {new Date(reservation.checkIn).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Check-Out</p>
              <p className="text-black font-medium">
                {new Date(reservation.checkOut).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>
                {completedCount} of {totalCount} guests
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {reservation.guests.map((guest, index) => {
            const hasFrontImage = !!getImageForGuest(guest.id, "front");
            const hasBackImage = !!getImageForGuest(guest.id, "back");
            const allImagesComplete = hasAllImages(guest.id);
            const uploadStatus = getUploadStatus(guest.id);

            return (
              <div
                key={guest.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:border-gray-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-black font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-black font-medium">{guest.name}</p>
                      <p className="text-gray-500 text-sm">
                        Guest #{index + 1}
                      </p>
                    </div>
                  </div>
                  {uploadStatus?.uploading && (
                    <div className="flex items-center text-blue-600 text-sm">
                      <svg
                        className="animate-spin w-5 h-5 mr-1"
                        viewBox="0 0 24 24"
                      >
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
                      Uploading...
                    </div>
                  )}
                  {allImagesComplete &&
                    !uploadStatus?.uploading &&
                    !uploadStatus?.error && (
                      <div className="flex items-center text-green-600 text-sm">
                        <svg
                          className="w-5 h-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Ready
                      </div>
                    )}
                  {uploadStatus?.error && (
                    <div className="flex items-center text-red-600 text-sm">
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Error
                    </div>
                  )}
                </div>

                {uploadStatus?.error && (
                  <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-xs">{uploadStatus.error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Front Image Section */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Front of ID
                    </label>
                    {hasFrontImage ? (
                      <div className="space-y-2">
                        <Image
                          src={
                            getImageForGuest(guest.id, "front") ||
                            "/placeholder.jpg"
                          }
                          alt={`Front ID for ${guest.name}`}
                          width={400}
                          height={160}
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
                          style={{ width: "100%", height: "160px" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCapturingSide("front");
                            setSelectedGuest(guest);
                          }}
                          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm"
                        >
                          Replace Front Image
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCapturingSide("front");
                          setSelectedGuest(guest);
                        }}
                        className="w-full py-3 px-4 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <svg
                          className="w-5 h-5"
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
                        <span>Upload Front of ID</span>
                      </button>
                    )}
                  </div>

                  {/* Back Image Section */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Back of ID
                    </label>
                    {hasBackImage ? (
                      <div className="space-y-2">
                        <Image
                          src={
                            getImageForGuest(guest.id, "back") ||
                            "/placeholder.jpg"
                          }
                          alt={`Back ID for ${guest.name}`}
                          width={400}
                          height={160}
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
                          style={{ width: "100%", height: "160px" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCapturingSide("back");
                            setSelectedGuest(guest);
                          }}
                          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm"
                        >
                          Replace Back Image
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCapturingSide("back");
                          setSelectedGuest(guest);
                        }}
                        className="w-full py-3 px-4 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <svg
                          className="w-5 h-5"
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
                        <span>Upload Back of ID</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="submit"
            disabled={completedCount !== totalCount || isSubmitting}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 shadow-sm mt-6"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
                Uploading images...
              </span>
            ) : completedCount === totalCount ? (
              "Complete Check-In"
            ) : (
              `Complete ${totalCount - completedCount} more ${
                totalCount - completedCount === 1 ? "guest" : "guests"
              }`
            )}
          </button>
        </form>
      </div>

      {selectedGuest && (
        <ImageUploadOptions
          guest={selectedGuest}
          side={capturingSide}
          onImageCaptured={(imageData) =>
            handleImageCapture(selectedGuest.id, imageData, capturingSide)
          }
          onClose={() => setSelectedGuest(null)}
        />
      )}
    </main>
  );
}
