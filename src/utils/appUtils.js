import dayjs from "dayjs";
import { capFirst } from "./strings";

export const normType = (t) => ((t || "swim").toLowerCase() === "run" ? "run" : "swim");
export const pluralize = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

export const formatDistance = (meters, nf) => {
  if (meters >= 1000) {
    const km = Math.round(meters / 100) / 10;
    return `${nf.format(km)} km`;
  }
  return `${nf.format(Math.round(meters))} m`;
};

export const formatKmDecimal = (meters, nfDecimal) => `${nfDecimal.format(meters / 1000)} km`;

export const weekOfMonthLabel = (date) => {
  const d = dayjs(date);
  const weekNum = Math.ceil(d.date() / 7);
  const ordinal = weekNum === 1 ? "1ere" : `${weekNum}eme`;
  const monthName = capFirst(d.format("MMMM"));
  const year = d.format("YYYY");
  const useApostrophe = /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(monthName);
  const preposition = useApostrophe ? "d'" : "de ";
  return `${ordinal} semaine ${preposition}${monthName} ${year}`;
};

export const parseDateValue = (value) => {
  if (value instanceof Date) return dayjs(value);
  if (typeof value === "number") return dayjs(value);
  const raw = String(value ?? "").trim();
  const formats = [
    "YYYY-MM-DD",
    "YYYY/MM/DD",
    "DD/MM/YYYY",
    "DD-MM-YYYY",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-MM-DD HH:mm:ss",
    "DD/MM/YYYY HH:mm",
    "DD/MM/YYYY HH:mm:ss",
    "DD-MM-YYYY HH:mm",
    "DD-MM-YYYY HH:mm:ss",
  ];
  const strictParsed = dayjs(raw, formats, true);
  if (strictParsed.isValid()) return strictParsed;
  const looseParsed = dayjs(raw, formats, false);
  return looseParsed.isValid() ? looseParsed : dayjs(raw);
};

export const normalizeSessionDate = (value) => {
  const parsed = parseDateValue(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
};

export const normalizeSessionDistance = (value) => {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "").trim().replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeSession = (s) => ({
  ...s,
  date: normalizeSessionDate(s.date),
  distance: normalizeSessionDistance(s.distance),
});

export const getInitialRange = () => {
  return "month";
};
