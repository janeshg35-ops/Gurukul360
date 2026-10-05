# Gurukul360™ — Digital School Management Platform (MYTECH) — PRD

## Original Problem Statement
Professional mobile-first demo app for MYTECH PROFESSIONALS PRIVATE LIMITED. Product: **Gurukul360™ — Digital School Management Platform** (tagline: *One Platform. Every School. Every Stakeholder.*). A functional prototype that looks/behaves like a serious commercial school-management mobile app. Phase 1 = **PRINCIPAL** role for a fictional **MYTECH Demo School, Noida, UP, Session 2026–27**. Must use the supplied MYTECH logo exactly (no regenerated branding). The #1 requirement is **connected data** — attendance edits and fee payments propagate to dashboard, reports and student profiles.

## Architecture
- **Stack:** Expo (SDK 57) + React Native + TypeScript + expo-router (file-based routing). **Frontend-only**, no backend.
- **Data layer:** single relational-style in-memory store seeded deterministically (`src/data/seed.ts`), exposed via React Context `DataProvider` (`src/data/store.tsx`) and **persisted on-device** (AsyncStorage/IndexedDB via `@/src/utils/storage`). All KPIs/reports are **derived** from the base entities (`src/data/compute.ts`, `src/data/reports.ts`) — no hard-coded figures.
- **Auth:** local `AuthProvider` (`src/context/auth.tsx`), session persisted in SecureStore. Principal creds only.
- **Design:** deep professional blue (`#1E3A8A`) on charcoal base; tokens in `src/theme.ts` from `design_guidelines.json`. Phosphor icons. Reusable UI in `src/components/ui/*`, charts via react-native-svg (`src/components/charts.tsx`).
- **Navigation:** 4 bottom tabs (Home / Students / Attendance / Fees) + stacked detail & modal screens (student profile, attendance editor, fee detail, payment modal, receipt modal, reports, academics, announcements).

## User Persona
- **Principal (Dr. Rajesh Khanna):** needs broad management visibility — enrolment, daily attendance, fee collection/dues, academic performance, communication, and exportable reports.

## Core Requirements (static)
1. Supplied MYTECH logo used as-is (login prominent + header plate). ✅
2. Working Principal login `principal@mytechpro.co.in / Principal@123` + invalid-cred validation. ✅
3. Principal Dashboard with computed KPIs + visual overviews. ✅
4. Student management (list/search/filter by class & section) + rich linked profile. ✅
5. Attendance module editable with live propagation. ✅
6. Fees module: student-wise, demo payment, receipt, propagation. ✅
7. Reports (Student / Attendance / Fee Collection / Outstanding / Performance) with filters + PDF/CSV export + share. ✅
8. Academics/performance linked to student records. ✅
9. Communication/announcements module. ✅
10. Modular, future-ready architecture (roles/modules addable). ✅

## Implemented (2026-06)
- Login screen (logo, product identity, motto, validation, auto-fill, future-roles note).
- Dashboard: 6 computed KPI cards, attendance donut, fee-collection bar, subject-average bars, quick-access tiles, recent fee activity, announcements, sign-out.
- Students tab: search + class/section chip filters + empty state; student profile with Overview/Attendance/Fees/Academics tabs.
- Attendance tab: date stepper, school summary, section list; editor with Present/Late/Absent, live summary, Save → propagates everywhere.
- Fees tab: collected/outstanding KPIs, All/Dues/Paid segments, search; fee detail with structure + history; demo payment modal; PDF-style receipt (shareable) with DEMO label.
- Reports: hub + generic report screen with filters, summary KPIs, scrollable data table, real PDF (expo-print) & CSV (expo-file-system) export via share sheet.
- Academics: class filter, subject averages, ranked student list.
- Announcements: category filters, notice/event/circular cards.
- Verified by testing agent: both connected-data flows (attendance %, fee collection/outstanding) propagate correctly across dashboard/reports/profile.

## Data Model
School, AcademicSession, SchoolClass, Section, Subject, Teacher, Guardian, FeeHead, Student (+feeHeadIds), AttendanceRecord, FeePayment, AcademicResult, Announcement. 30 students across Classes 6–10 (A/B), 14 teachers, 5 fee heads, ~24 school-days of attendance, seeded partial payments, Term-1 results, 5 announcements.

## Backlog (future phases)
- **P1:** Teacher role, Parent/Guardian role & login; Admissions; add/edit student forms; attendance date-range analytics.
- **P1:** Web-safe PDF/CSV download fallback (currently share sheet is native-only; web shows an info toast).
- **P2:** Front Office, HR, Leave, Timetable, Homework, Examinations, Results & Promotion, Library, Transport, Payroll, Certificates/Cards, advanced analytics, school website integration.

## Notes
- PDF/CSV export + share sheet work on device/Expo Go; the web preview shows an info toast since the native share sheet is unavailable there.
