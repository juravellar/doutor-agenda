"use client";

import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { createParser, useQueryStates } from "nuqs";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

const DATE = "yyyy-MM-dd";

const parseDay = (value: string) => parse(value, DATE, new Date());

// Dates in the URL are calendar days. nuqs' parseAsIsoDate reads them as UTC
// midnight, which in Brazil is the evening before, so the picker showed the
// previous day.
const parseAsDay = createParser({
  parse: (value) => {
    const date = parseDay(value);
    return isValid(date) ? date : null;
  },
  serialize: (date) => format(date, DATE),
  eq: (a, b) => a.getTime() === b.getTime(),
});

// from and to come from the server, which decides the period the page shows.
export function DatePicker({ from, to }: { from: string; to: string }) {
  const isMobile = useIsMobile();
  const [range, setRange] = useQueryStates(
    {
      from: parseAsDay.withDefault(parseDay(from)),
      to: parseAsDay.withDefault(parseDay(to)),
    },
    { shallow: false },
  );

  // Both ends are written together: a start alone would be paired on the
  // server with an end that may come before it.
  const handleDateSelect = (selected: DateRange | undefined) => {
    if (selected?.from) {
      setRange({ from: selected.from, to: selected.to ?? selected.from });
    }
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className="justify-start text-left font-normal"
          >
            <CalendarIcon className="text-primary h-4 w-4" />
            {format(range.from, "LLL dd, y", { locale: ptBR })} -{" "}
            {format(range.to, "LLL dd, y", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={range.from}
            selected={range}
            onSelect={handleDateSelect}
            numberOfMonths={isMobile ? 1 : 2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
