// Central branding + demo constants for the MYTECH Gurukul360 prototype.

// The authoritative MYTECH logo asset supplied by the client.
// Never regenerate / redraw this — always reference the asset.
export const MYTECH_LOGO = require("../../assets/brand/mytech-logo.png");

export const PRODUCT = {
  name: "Gurukul360",
  trademark: "Gurukul360\u2122",
  subtitle: "Digital School Management Platform",
  tagline: "One Platform. Every School. Every Stakeholder.",
  motto: "Lead. Monitor. Manage.",
  company: "MYTECH PROFESSIONALS PRIVATE LIMITED",
} as const;

export const SCHOOL = {
  name: "MYTECH Demo School",
  location: "Noida, Uttar Pradesh",
  session: "2026\u201327",
} as const;

// Phase 1 demo credentials (frontend-only auth).
export const PRINCIPAL_CREDENTIALS = {
  username: "principal@mytechpro.co.in",
  password: "Principal@123",
} as const;

export const PRINCIPAL = {
  name: "Dr. Rajesh Khanna",
  role: "Principal",
  email: PRINCIPAL_CREDENTIALS.username,
} as const;

// Shared demo password for every active teacher. Not stored on the Teacher record.
export const TEACHER_DEMO_PASSWORD = "Teacher@123";

// Shared demo password for every active student. Not stored on the Student record.
export const STUDENT_DEMO_PASSWORD = "Student@123";
