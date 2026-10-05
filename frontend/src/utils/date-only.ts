export interface DateParts {
  year: number;
  month: number;
  day: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function isRealDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealDate(year, month, day)) return null;
  return { year, month, day };
}

export function formatIsoDate(value: string): string {
  const parts = parseIsoDate(value.trim().slice(0, 10));
  if (!parts) return "";
  return `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`;
}

export function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isoToLocalDate(value: string): Date | null {
  const parts = parseIsoDate(value.trim().slice(0, 10));
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function compareDateParts(left: DateParts, right: DateParts): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

export function datePartsFromLocal(date: Date): DateParts {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

export function shiftYears(parts: DateParts, years: number): DateParts {
  const shifted = new Date(parts.year + years, parts.month - 1, parts.day);
  return datePartsFromLocal(shifted);
}

export function dobBounds(today = new Date()): { minimumDate: Date; maximumDate: Date } {
  const current = datePartsFromLocal(today);
  const earliest = shiftYears(current, -40);
  return {
    minimumDate: new Date(earliest.year, earliest.month - 1, earliest.day),
    maximumDate: new Date(current.year, current.month - 1, current.day - 1),
  };
}

export function validateDob(value: string, today = new Date()): string | null {
  const parts = parseIsoDate(value);
  if (!parts) return "Enter a valid past date of birth (DD/MM/YYYY).";
  const current = datePartsFromLocal(today);
  if (compareDateParts(parts, current) >= 0) return "Enter a valid past date of birth (DD/MM/YYYY).";
  const earliest = shiftYears(current, -40);
  if (compareDateParts(parts, earliest) < 0) return "Enter a valid past date of birth (DD/MM/YYYY).";
  return null;
}

export function instantToIsoDate(value: string): string {
  const direct = parseIsoDate(value.trim());
  if (direct) return `${direct.year}-${pad(direct.month)}-${pad(direct.day)}`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return localDateToIso(parsed);
}

export function isoDateToLocalNoonInstant(value: string): string | null {
  const parts = parseIsoDate(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0).toISOString();
}
