import "dayjs/locale/pt-br";

import dayjs from "dayjs";

import { doctorsTable } from "@/db/schema";
import { utcTimeToClinic } from "@/helpers/time";

dayjs.locale("pt-br");

export const getAvailability = (doctor: typeof doctorsTable.$inferSelect) => {
  const from = utcTimeToClinic(doctor.availableFromTime).day(
    doctor.availableFromWeekDay,
  );
  const to = utcTimeToClinic(doctor.availableToTime).day(
    doctor.availableToWeekDay,
  );
  return { from, to };
};
