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
