const DAY_MS = 24 * 60 * 60 * 1000;
const TARGET = Date.UTC(2027, 0, 11);
const chicagoDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Calendar months and remaining days, using Northwestern's local date. */
export function getWinterRushCountdown(now = new Date()) {
  const parts = chicagoDate.formatToParts(now);
  const part = (type: string) => Number(parts.find((value) => value.type === type)?.value);
  const year = part("year");
  const month = part("month") - 1;
  const day = part("day");
  const today = Date.UTC(year, month, day);
  if (today >= TARGET) return { months: 0, days: 0, started: true };

  const afterMonths = (count: number) => {
    const first = new Date(Date.UTC(year, month + count, 1));
    const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay));
  };
  let months = (2027 - year) * 12 - month;
  if (afterMonths(months) > TARGET) months -= 1;
  const days = Math.round((TARGET - afterMonths(months)) / DAY_MS);
  return { months, days, started: false };
}
