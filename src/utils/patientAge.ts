import { Patient } from "@/types/models";

export type AgeUnit = NonNullable<Patient["ageUnit"]>;

export function getAgeUnit(patient?: Pick<Patient, "ageUnit"> | null): AgeUnit {
  return patient?.ageUnit === "months" ? "months" : "years";
}

export function formatPatientAge(
  patient?: Pick<Patient, "age" | "ageUnit"> | null
): string {
  if (patient?.age === undefined || patient.age === null) {
    return "Not specified";
  }

  const unit = getAgeUnit(patient);
  const value = Number(patient.age);

  if (Number.isNaN(value)) {
    return "Not specified";
  }

  const label =
    unit === "months"
      ? value === 1
        ? "month"
        : "months"
      : value === 1
      ? "year"
      : "years";

  return `${value} ${label}`;
}
