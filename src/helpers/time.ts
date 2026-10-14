import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const CLINIC_TIMEZONE = "America/Sao_Paulo";

const TIME_FORMAT = "HH:mm:ss";

// Doctor availability is persisted in UTC; the UI always works in clinic time.
export const clinicTimeToUtc = (time: string) =>
  dayjs.tz(time, TIME_FORMAT, CLINIC_TIMEZONE).utc().format(TIME_FORMAT);

export const utcTimeToClinic = (time: string) =>
  dayjs.utc(time, TIME_FORMAT).tz(CLINIC_TIMEZONE);

export const inClinicTimezone = (date: Date) => dayjs(date).tz(CLINIC_TIMEZONE);

export const clinicDateTimeToDate = (date: string, time: string) =>
  dayjs
    .tz(`${date} ${time}`, `YYYY-MM-DD ${TIME_FORMAT}`, CLINIC_TIMEZONE)
    .toDate();

// [start, end) of the clinic-time month that contains the given clinic date.
export const clinicMonthRange = (date: string) => {
  const start = dayjs.tz(date, "YYYY-MM-DD", CLINIC_TIMEZONE).startOf("month");
  return { start: start.toDate(), end: start.add(1, "month").toDate() };
};

export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 5; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
      slots.push(timeString);
    }
  }
  return slots;
};
