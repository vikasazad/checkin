"use server";

import { findReservationByPhone } from "@/lib/reservations";
import type { Reservation } from "@/lib/reservations";

export async function findReservation(phoneNumber: string): Promise<Reservation | null> {
  return await findReservationByPhone(phoneNumber);
}

