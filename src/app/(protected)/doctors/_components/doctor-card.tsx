"use client";

import { Calendar, Clock } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { doctorsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import { getAvailability } from "../_constants/_helpers/availability";
import UpsertDoctorForm from "./upsert-doctor-form";

interface DoctorCardProps {
  doctor: typeof doctorsTable.$inferSelect;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const doctorInitials = doctor.name
    .split(" ")
    .map((name) => name[0])
    .join("");
  const availability = getAvailability(doctor);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="size-10">
            <AvatarFallback>{doctorInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{doctor.name}</h3>
            <p className="text-muted-foreground text-sm">{doctor.specialty}</p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline">
          <Calendar className="mr-1" />
          {availability.from.format("dddd")} -{" "}
          {availability.to.format("dddd")}
        </Badge>
        <Badge variant="outline">
          <Clock className="mr-1" />
          {availability.from.format("HH:mm")} -{" "}
          {availability.to.format("HH:mm")}
        </Badge>
        <Badge variant="outline">
          {formatCurrencyInCents(doctor.appointmentPriceInCents)}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">Ver detalhes</Button>
          </DialogTrigger>
          <DialogContent>
            <UpsertDoctorForm />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
