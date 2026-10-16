import dayjs from "dayjs";

const DATE = "YYYY-MM-DD";

// The period the dashboard shows. The server decides it and hands it to the
// date picker, so both always show the same range. Without dates it is the
// next month; an end before the start is moved to the start.
export const dashboardRange = (
  params: { from?: string; to?: string },
  today: string,
) => {
  const from = params.from || today;
  const to = params.to || dayjs(from).add(1, "month").format(DATE);
  return { from, to: to < from ? from : to };
};
