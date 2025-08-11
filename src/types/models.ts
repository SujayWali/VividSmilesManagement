export type Role = "admin" | "manager";

export type UserDoc = {
  uid: string;
  email: string;
  role: Role;
  createdAt: number;
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  allergies?: string;
  history?: string;
  createdAt: number;
  updatedAt: number;
};

export type Visit = {
  id: string;
  date: string; // ISO
  treatment?: string;
  medicines?: string[];
  payment?: number;
  paymentStatus?: "Paid" | "Pending" | "Paid via UPI" | "Paid Via Cash" | "Paid via Card" | "Payment Error" | "UnPaid";
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "No Show";
  treatmentType?: string;
  notes?: string;
  duration?: number; // in minutes
  createdAt: number;
  updatedAt: number;
};
