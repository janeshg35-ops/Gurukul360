import dayjs from "dayjs";

import { SCHOOL } from "@/src/constants/branding";
import {
  AcademicResult,
  Announcement,
  Assignment,
  AttendanceRecord,
  Database,
  FeeHead,
  Guardian,
  SchoolClass,
  Section,
  Student,
  Subject,
  Teacher,
  TimetableEntry,
} from "./types";
import { eligibilityForTeacher, SCHEDULE_SLOTS } from "./timetable-config";
import { generateTimetable } from "./timetable-generate";

export const DB_VERSION = 1;

const CLASSES: SchoolClass[] = [
  { id: "c6", name: "Class 6", order: 6 },
  { id: "c7", name: "Class 7", order: 7 },
  { id: "c8", name: "Class 8", order: 8 },
  { id: "c9", name: "Class 9", order: 9 },
  { id: "c10", name: "Class 10", order: 10 },
];

const SECTION_NAMES = ["A", "B"];

const SUBJECTS: Subject[] = [
  { id: "sub-eng", name: "English" },
  { id: "sub-math", name: "Mathematics" },
  { id: "sub-sci", name: "Science" },
  { id: "sub-ss", name: "Social Science" },
  { id: "sub-cs", name: "Computer Science" },
  { id: "sub-pe", name: "Physical Education" },
];

const FEE_HEADS: FeeHead[] = [
  { id: "fh-academic", name: "Academic Fee", amount: 42000 },
  { id: "fh-transport", name: "Transport Fee", amount: 18000 },
  { id: "fh-annual", name: "Annual Charges", amount: 12000 },
  { id: "fh-exam", name: "Examination Fee", amount: 4500 },
  { id: "fh-activity", name: "Activity Fee", amount: 6000 },
];

// 30 realistic Indian student names
const STUDENT_NAMES = [
  "Aarav Sharma",
  "Ananya Verma",
  "Kabir Singh",
  "Diya Patel",
  "Vihaan Gupta",
  "Ishita Rao",
  "Arjun Mehta",
  "Saanvi Nair",
  "Reyansh Joshi",
  "Myra Kapoor",
  "Advik Reddy",
  "Aadhya Iyer",
  "Vivaan Malhotra",
  "Kiara Chauhan",
  "Ayaan Khan",
  "Navya Agarwal",
  "Shaurya Bhat",
  "Anvi Desai",
  "Rudra Pandey",
  "Pari Saxena",
  "Dhruv Chaudhary",
  "Avni Mishra",
  "Krish Bansal",
  "Riya Sinha",
  "Atharv Jain",
  "Siya Kulkarni",
  "Veer Yadav",
  "Tara Menon",
  "Ishaan Bose",
  "Mahira Shetty",
];

const OCCUPATIONS = [
  "Business Owner",
  "Software Engineer",
  "Doctor",
  "Bank Manager",
  "Chartered Accountant",
  "Government Officer",
  "Architect",
  "Professor",
];

const TEACHER_SEEDS: Omit<Teacher, "eligibleClassIds">[] = [
  { id: "t1", name: "Mrs. Sunita Mehra", subjectIds: ["sub-eng"], classTeacherOf: "s-10-a", phone: "+91 98100 11001", email: "sunita.mehra@mytechpro.co.in" },
  { id: "t2", name: "Mr. Anil Kumar", subjectIds: ["sub-math"], classTeacherOf: "s-10-b", phone: "+91 98100 11002", email: "anil.kumar@mytechpro.co.in" },
  { id: "t3", name: "Ms. Pooja Nanda", subjectIds: ["sub-sci"], classTeacherOf: "s-9-a", phone: "+91 98100 11003", email: "pooja.nanda@mytechpro.co.in" },
  { id: "t4", name: "Mr. Ramesh Iyer", subjectIds: ["sub-ss"], classTeacherOf: "s-9-b", phone: "+91 98100 11004", email: "ramesh.iyer@mytechpro.co.in" },
  { id: "t5", name: "Mrs. Kavita Rao", subjectIds: ["sub-cs"], classTeacherOf: "s-8-a", phone: "+91 98100 11005", email: "kavita.rao@mytechpro.co.in" },
  { id: "t6", name: "Mr. Deepak Sethi", subjectIds: ["sub-math", "sub-sci"], classTeacherOf: "s-8-b", phone: "+91 98100 11006", email: "deepak.sethi@mytechpro.co.in" },
  { id: "t7", name: "Ms. Neha Grover", subjectIds: ["sub-eng", "sub-ss"], classTeacherOf: "s-7-a", phone: "+91 98100 11007", email: "neha.grover@mytechpro.co.in" },
  { id: "t8", name: "Mr. Vikram Saini", subjectIds: ["sub-sci", "sub-cs"], classTeacherOf: "s-7-b", phone: "+91 98100 11008", email: "vikram.saini@mytechpro.co.in" },
  { id: "t9", name: "Mrs. Shalini Jain", subjectIds: ["sub-math"], classTeacherOf: "s-6-a", phone: "+91 98100 11009", email: "shalini.jain@mytechpro.co.in" },
  { id: "t10", name: "Mr. Harish Dua", subjectIds: ["sub-ss"], classTeacherOf: "s-6-b", phone: "+91 98100 11010", email: "harish.dua@mytechpro.co.in" },
  { id: "t11", name: "Ms. Ritu Agnihotri", subjectIds: ["sub-eng"], phone: "+91 98100 11011", email: "ritu.a@mytechpro.co.in" },
  { id: "t12", name: "Mr. Sanjay Kapoor", subjectIds: ["sub-cs"], phone: "+91 98100 11012", email: "sanjay.k@mytechpro.co.in" },
  { id: "t13", name: "Mrs. Meera Nambiar", subjectIds: ["sub-sci"], phone: "+91 98100 11013", email: "meera.n@mytechpro.co.in" },
  { id: "t14", name: "Mr. Alok Verma", subjectIds: ["sub-math"], phone: "+91 98100 11014", email: "alok.v@mytechpro.co.in" },
  { id: "t15", name: "Mr. Rohan Malhotra", subjectIds: ["sub-pe"], phone: "+91 98100 11015", email: "rohan.malhotra@mytechpro.co.in" },
  { id: "t16", name: "Mrs. Anjali Kulkarni", subjectIds: ["sub-pe"], phone: "+91 98100 11016", email: "anjali.kulkarni@mytechpro.co.in" },
];

const TEACHERS: Teacher[] = TEACHER_SEEDS.map((teacher) => ({
  ...teacher,
  eligibleClassIds: eligibilityForTeacher(teacher.id),
}));

export const PE_SUBJECT: Subject = { id: "sub-pe", name: "Physical Education" };

export function supplementalTeachers(): Teacher[] {
  return TEACHERS.filter((teacher) => teacher.subjectIds.includes("sub-pe"));
}

function buildSections(): Section[] {
  const out: Section[] = [];
  for (const c of CLASSES) {
    for (const s of SECTION_NAMES) {
      const cls = c.id.replace("c", "");
      out.push({
        id: `s-${cls}-${s.toLowerCase()}`,
        classId: c.id,
        name: s,
      });
    }
  }
  return out;
}

// Deterministic weekday list ending today (most recent first reversed to chronological)
function recentSchoolDays(count: number): string[] {
  const days: string[] = [];
  let cursor = dayjs();
  while (days.length < count) {
    const dow = cursor.day();
    if (dow !== 0 && dow !== 6) days.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.subtract(1, "day");
  }
  return days.reverse();
}

export function todayKey(): string {
  return dayjs().format("YYYY-MM-DD");
}

function isoDay(offset: number): string {
  return dayjs().add(offset, "day").format("YYYY-MM-DD");
}

/** Demo homework. Dates stay relative to the day the seed is built. */
export function seedAssignments(): Assignment[] {
  return [
    {
      id: "asg-1",
      title: "Fractions worksheet",
      instructions: "Complete Exercise 3.2. Show each step and simplify every answer.",
      classId: "c6",
      sectionId: "s-6-a",
      subjectId: "sub-math",
      teacherId: "t9",
      assignedDate: isoDay(-2),
      dueDate: isoDay(5),
    },
    {
      id: "asg-2",
      title: "Reading comprehension",
      instructions: "Read the passage The Banyan Tree and answer the questions in complete sentences.",
      classId: "c6",
      sectionId: "s-6-a",
      subjectId: "sub-eng",
      teacherId: "t11",
      assignedDate: isoDay(-1),
      dueDate: isoDay(1),
    },
    {
      id: "asg-3",
      title: "Plant life cycle",
      instructions: "Draw and label the stages of a flowering plant. Write five lines under the diagram.",
      classId: "c6",
      sectionId: "s-6-a",
      subjectId: "sub-sci",
      teacherId: "t13",
      assignedDate: isoDay(-7),
      dueDate: isoDay(-1),
    },
    {
      id: "asg-4",
      title: "Formal letter",
      instructions: "Write a formal letter to the Principal requesting new books for the class library.",
      classId: "c10",
      sectionId: "s-10-a",
      subjectId: "sub-eng",
      teacherId: "t1",
      assignedDate: isoDay(0),
      dueDate: isoDay(3),
    },
    {
      id: "asg-5",
      title: "Quadratic equations",
      instructions: "Solve the ten questions in Exercise 4.1. Box the final roots.",
      classId: "c10",
      sectionId: "s-10-a",
      subjectId: "sub-math",
      teacherId: "t14",
      assignedDate: isoDay(0),
      dueDate: isoDay(6),
    },
    {
      id: "asg-6",
      title: "Statistics practice",
      instructions: "Find the mean and median for the data set on page 214. Show the working.",
      classId: "c10",
      sectionId: "s-10-b",
      subjectId: "sub-math",
      teacherId: "t2",
      assignedDate: isoDay(-1),
      dueDate: isoDay(0),
    },
    {
      id: "asg-7",
      title: "Chemical equations",
      instructions: "Balance the equations on page 42. Name the type of each reaction.",
      classId: "c8",
      sectionId: "s-8-b",
      subjectId: "sub-sci",
      teacherId: "t6",
      assignedDate: isoDay(-8),
      dueDate: isoDay(-2),
    },
    {
      id: "asg-8",
      title: "Cell structure diagram",
      instructions: "Label the animal cell diagram and describe three organelles in your own words.",
      classId: "c9",
      sectionId: "s-9-a",
      subjectId: "sub-sci",
      teacherId: "t3",
      assignedDate: isoDay(0),
      dueDate: isoDay(7),
    },
  ];
}

export function buildDatabase(): Database {
  const sections = buildSections();
  const guardians: Guardian[] = [];
  const students: Student[] = [];
  const results: AcademicResult[] = [];

  // Distribute 30 students across 10 sections (3 each)
  STUDENT_NAMES.forEach((name, i) => {
    const sectionIndex = i % sections.length;
    const section = sections[sectionIndex];
    const rollNo = Math.floor(i / sections.length) + 1;
    const classOrder = CLASSES.find((c) => c.id === section.classId)!.order;
    const cls = section.classId.replace("c", "");

    const lastName = name.split(" ")[1] ?? "Sharma";
    const relation = i % 2 === 0 ? "Father" : "Mother";
    const guardianName =
      (relation === "Father" ? "Mr. " : "Mrs. ") +
      ["Rohit", "Anita", "Suresh", "Kiran", "Manish", "Rekha", "Vinod", "Seema"][i % 8] +
      " " +
      lastName;
    const guardianId = `g-${i + 1}`;
    guardians.push({
      id: guardianId,
      name: guardianName,
      relation,
      phone: `+91 98${String(700000000 + i * 137).slice(0, 8)}`,
      email: `${lastName.toLowerCase()}.family${i + 1}@gmail.com`,
      occupation: OCCUPATIONS[i % OCCUPATIONS.length],
    });

    // Age ~ 11 + (classOrder-6); build DOB
    const ageYears = 11 + (classOrder - 6);
    const dob = dayjs()
      .subtract(ageYears, "year")
      .subtract((i * 11) % 300, "day")
      .format("YYYY-MM-DD");

    // Fee heads: academic+annual+exam+activity for all; transport for ~60%
    const feeHeadIds = ["fh-academic", "fh-annual", "fh-exam", "fh-activity"];
    if (i % 5 !== 0 && i % 7 !== 0) feeHeadIds.splice(1, 0, "fh-transport");

    const studentId = `stu-${i + 1}`;
    students.push({
      id: studentId,
      admissionNo: `MDS/${classOrder}/${String(1000 + i)}`,
      name,
      classId: section.classId,
      sectionId: section.id,
      rollNo,
      dob,
      gender: i % 2 === 0 ? "Male" : "Female",
      guardianId,
      phone: `+91 99${String(100000000 + i * 211).slice(0, 8)}`,
      email: `${name.split(" ")[0].toLowerCase()}.${cls}@student.mytechpro.co.in`,
      address: `House ${12 + i}, Sector ${15 + (i % 60)}, Noida, UP`,
      status: "active",
      avatarIndex: i % 8,
      feeHeadIds,
    });

    // Academic results — deterministic marks per subject
    SUBJECTS.filter((sub) => sub.id !== "sub-pe").forEach((sub, sIdx) => {
      const base = 58 + ((i * 7 + sIdx * 13) % 40); // 58..97
      results.push({
        studentId,
        subjectId: sub.id,
        term: "Term 1",
        marks: Math.min(99, base),
        maxMarks: 100,
      });
    });
  });

  // Attendance — last 24 school days for every student
  const days = recentSchoolDays(24);
  const attendance: AttendanceRecord[] = [];
  students.forEach((stu, i) => {
    days.forEach((date, d) => {
      // Deterministic: a few absents/lates spread per student
      const seed = (i * 31 + d * 17) % 100;
      let status: AttendanceRecord["status"] = "present";
      if (seed < 8) status = "absent";
      else if (seed < 16) status = "late";
      attendance.push({ date, studentId: stu.id, status });
    });
  });

  // Payments — partial collection so outstanding exists. ~65% pay first installment.
  const payments: Database["payments"] = [];
  students.forEach((stu, i) => {
    if (i % 3 !== 2) {
      const amount = i % 2 === 0 ? 40000 : 25000;
      payments.push({
        id: `pay-seed-${i + 1}`,
        receiptNo: `RCPT-26-${String(1001 + i)}`,
        studentId: stu.id,
        amount,
        date: dayjs()
          .subtract((i % 20) + 2, "day")
          .toISOString(),
        method: (["Online", "UPI", "Cash", "Cheque", "Card"] as const)[i % 5],
        reference: `TXN${String(50000 + i * 7)}`,
        note: "First installment",
        demo: true,
      });
    }
  });

  const announcements: Announcement[] = [
    {
      id: "a1",
      title: "Parent-Teacher Meeting \u2014 Term 1",
      body: "The Term 1 Parent-Teacher Meeting for Classes 6\u201310 will be held on Saturday from 9:00 AM to 1:00 PM in the respective classrooms. Guardians are requested to collect progress reports from the class teachers.",
      category: "Notice",
      date: dayjs().subtract(1, "day").toISOString(),
      audience: "All Guardians",
      author: "Principal's Office",
    },
    {
      id: "a2",
      title: "Annual Sports Day 2026",
      body: "MYTECH Demo School will celebrate its Annual Sports Day next month at the main ground. Track and field events, march-past and cultural performances are planned. Participation lists will be shared by class teachers.",
      category: "Event",
      date: dayjs().subtract(2, "day").toISOString(),
      audience: "Students & Staff",
      author: "Sports Department",
    },
    {
      id: "a3",
      title: "Fee Payment Reminder \u2014 Second Installment",
      body: "Guardians are reminded that the second installment of the academic fee is due by the end of this month. Payments can be made through the school office or online portal. Kindly clear outstanding dues at the earliest.",
      category: "Circular",
      date: dayjs().subtract(3, "day").toISOString(),
      audience: "Guardians with Dues",
      author: "Accounts Department",
    },
    {
      id: "a4",
      title: "Revised Winter Timings",
      body: "With effect from Monday, the school will function from 8:30 AM to 2:30 PM due to winter season. Transport timings will be adjusted accordingly and communicated by the transport in-charge.",
      category: "Announcement",
      date: dayjs().subtract(5, "day").toISOString(),
      audience: "All Stakeholders",
      author: "Administration",
    },
    {
      id: "a5",
      title: "Science Exhibition \u2014 Inter-House",
      body: "An inter-house Science Exhibition will be organised for Classes 8\u201310. Students are encouraged to prepare working models. Best three models will represent the school at the district level.",
      category: "Event",
      date: dayjs().subtract(6, "day").toISOString(),
      audience: "Classes 8\u201310",
      author: "Science Department",
    },
  ];

  return {
    version: DB_VERSION,
    school: {
      id: "school-1",
      name: SCHOOL.name,
      location: SCHOOL.location,
      session: SCHOOL.session,
    },
    classes: CLASSES,
    sections,
    subjects: SUBJECTS,
    teachers: TEACHERS,
    guardians,
    feeHeads: FEE_HEADS,
    students,
    attendance,
    payments,
    results,
    announcements,
    assignments: seedAssignments(),
    timetable: seedTimetable(),
    scheduleSlots: SCHEDULE_SLOTS.map((slot) => ({ ...slot })),
  };
}

/** Demo timetable for Class 6-A and Class 10-A, produced by the constraint generator. */
export function seedTimetable(): TimetableEntry[] {
  const sections = buildSections();
  const result = generateTimetable({
    classes: CLASSES,
    sections,
    subjects: SUBJECTS,
    teachers: TEACHERS,
    sectionIds: ["s-6-a", "s-10-a"],
  });
  return result.success ? result.entries : [];
}
