// src/lib/certificates.ts

import crypto from "crypto";

export type CertificateStatus = "valid" | "revoked" | "expired" | "pending";

export interface CertificateRecord {
  token: string;          // secure verification token, e.g. c_tq9WcF6ZsKLD7y2pX8hR
  certificateId: string;  // human-readable ID, e.g. DOP-LN01-2501-001
  learnerName: string;
  courseName: string;
  completedOn: string;    // ISO date string, e.g. "2025-11-30"
  issuedBy: string;       // e.g. "Learnamyte"
  status: CertificateStatus;
  createdAt: string;      // ISO date string
}

/**
 * TEMP: In-memory “database” so you can test the flow.
 * Replace this with a real DB query later.
 */
const MOCK_CERTIFICATES: CertificateRecord[] = [
  {
    token: "c_tq9WcF6ZsKLD7y2pX8hR",
    certificateId: "DOP-LN01-2501-001",
    learnerName: "Abinesh JV",
    courseName: "Data Optimization with Python",
    completedOn: "2025-11-30",
    issuedBy: "Learnamyte",
    status: "valid",
    createdAt: "2025-11-30T10:00:00.000Z",
  },
];

/**
 * Look up a certificate by verification token.
 */
export async function getCertificateByToken(
  token: string,
): Promise<CertificateRecord | null> {
  // Basic sanity check
  if (!token.startsWith("c_") || token.length < 12) {
    return null;
  }

  const record = MOCK_CERTIFICATES.find((c) => c.token === token);
  return record ?? null;
}

/**
 * Generate a secure verification token for new certificates.
 */
export function generateVerificationToken(): string {
  const bytes = crypto.randomBytes(16).toString("base64url"); // URL-safe
  return `c_${bytes.slice(0, 20)}`;
}
