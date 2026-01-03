"use client";

import { useState } from "react";
import { findReservation } from "./actions";
import CheckInForm from "@/components/CheckInForm";
import type { Reservation } from "@/lib/reservations";

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await findReservation(phoneNumber);

      if (result) {
        setReservation(result);
      } else {
        setError(
          "Reservation not found. Please check your phone number and try again."
        );
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit and non-plus characters
    let cleaned = value.replace(/[^\d+]/g, "");

    // If starts with +, keep it, otherwise just use digits
    if (cleaned.startsWith("+")) {
      return cleaned;
    } else {
      // Remove any remaining + signs that aren't at the start
      cleaned = cleaned.replace(/\+/g, "");
      return cleaned;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (reservation) {
    return (
      <CheckInForm
        reservation={reservation}
        onBack={() => {
          setReservation(null);
          setPhoneNumber("");
          setError("");
          setLoading(false);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light text-black mb-4 tracking-tight">
            The Hotel
          </h1>
          <div className="h-px w-24 bg-black mx-auto mb-4"></div>
          <p className="text-gray-500 text-base">Welcome</p>
        </div>

        {/* Check-in Card */}
        <div className="bg-white rounded-xl shadow-sm p-10 border border-gray-200">
          <div className="mb-8">
            <h2 className="text-3xl font-light text-black mb-3 text-center">
              Check-In
            </h2>
            <p className="text-center text-gray-500 text-sm">
              Enter the phone number used for your reservation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="1234567890"
                className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-base"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
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
                  Searching...
                </span>
              ) : (
                "Find Reservation"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
