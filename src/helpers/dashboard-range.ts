import dayjs from "dayjs";

const DATE = "YYYY-MM-DD";

// A real calendar day written as YYYY-MM-DD. dayjs rolls 2026-02-31 over to
// March, so the round trip rejects it.
const isCalendarDay = (value: string | undefined): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  dayjs(value).format(DATE) === value;

// The period the dashboard shows. The server decides it and hands it to the
// date picker, so both always show the same range. Missing or malformed dates
// (a hand-edited link) fall back to the next month; an end before the start
// is moved to the start.
export const dashboardRange = (
  params: { from?: string; to?: string },
  today: string,
) => {
  const from = isCalendarDay(params.from) ? params.from : today;
  const to = isCalendarDay(params.to)
    ? params.to
    : dayjs(from).add(1, "month").format(DATE);
  return { from, to: to < from ? from : to };
};
