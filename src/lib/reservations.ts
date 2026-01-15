import { db } from "@/config/db/firebase";
// import reservationsData from "@/data/reservations.json";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export interface Guest {
  id: string;
  name: string;
  frontIdUrl?: string;
  backIdUrl?: string;
}

export interface Reservation {
  name: string;
  phone: string;
  email: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: string;
  roomCategory: string;
  paymentMode: string;
  bookingId: string;
  guests: Guest[];
  nights: number;
  createdAt: string;
}

// export async function findReservationByPhone(
//   phoneNumber: string
// ): Promise<Reservation | null> {
//   // Get today's date in YYYY-MM-DD format
//   const today = new Date().toISOString().split("T")[0];

//   // Find reservation matching phone number and today's check-in date
//   const reservation = reservationsData.find(
//     (res) => res.phone === phoneNumber && res.checkIn.split("T")[0] === today
//   );

//   return reservation || null;
// }

export async function findReservationByPhone(number: any) {
  try {
    const docRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return false;
    }
    const data = docSnap.data()?.reservation?.find((res: any) => {
      // Check if phone matches and check-in date is today
      const checkInDate = res.checkIn?.split("T")[0];
      return (
        res.phone === number &&
        checkInDate === new Date().toISOString().split("T")[0]
      );
    });
    if (data) {
      return data;
    }
  } catch (error) {
    console.error("Error adding reservation:", error);
    return false;
  }
}

/**
 * Update reservation with guest ID image URLs
 * @param bookingId - The booking ID of the reservation
 * @param guestImageUrls - Array of guest IDs with their image URLs
 * @returns Promise with success status
 */
export async function updateReservationWithImages(
  bookingId: string,
  guestImageUrls: { guestId: string; frontIdUrl: string; backIdUrl: string }[]
): Promise<boolean> {
  try {
    const docRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error("Document does not exist");
      return false;
    }

    const data = docSnap.data();
    const reservations = data.reservation || [];

    // Find the reservation index
    const reservationIndex = reservations.findIndex(
      (res: any) => res.bookingId === bookingId
    );

    if (reservationIndex === -1) {
      console.error("Reservation not found");
      return false;
    }

    // Update the guests with image URLs
    const updatedReservation = { ...reservations[reservationIndex] };
    updatedReservation.guests = updatedReservation.guests.map(
      (guest: Guest) => {
        const imageUrls = guestImageUrls.find(
          (img) => img.guestId === guest.id
        );
        if (imageUrls) {
          return {
            ...guest,
            frontIdUrl: imageUrls.frontIdUrl,
            backIdUrl: imageUrls.backIdUrl,
          };
        }
        return guest;
      }
    );

    // Update the reservations array
    const updatedReservations = [...reservations];
    updatedReservations[reservationIndex] = updatedReservation;

    // Update Firestore document
    await updateDoc(docRef, {
      reservation: updatedReservations,
    });

    console.log("Reservation updated successfully with image URLs");
    return true;
  } catch (error) {
    console.error("Error updating reservation:", error);
    return false;
  }
}
