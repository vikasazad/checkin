import { db } from "@/config/db/firebase";
// import reservationsData from "@/data/reservations.json";
import { doc, getDoc } from "firebase/firestore";

export interface Guest {
  id: string;
  name: string;
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
