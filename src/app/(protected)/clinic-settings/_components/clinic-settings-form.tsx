"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";

import { updateClinic } from "@/actions/update-clinic";
import {
  type UpdateClinicSchema,
  updateClinicSchema,
} from "@/actions/update-clinic/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { actionErrorMessage } from "@/lib/action-errors";
import { authClient } from "@/lib/auth-client";
import { BLOCKED_COPY } from "@/lib/create-gate";
import type { WriteBlock } from "@/lib/free-period";

export function ClinicSettingsForm({
  clinic,
  block,
}: {
  clinic: { name: string; address: string; phoneNumber: string };
  block: WriteBlock | null;
}) {
  const router = useRouter();
  const session = authClient.useSession();
  const form = useForm<UpdateClinicSchema>({
    resolver: zodResolver(updateClinicSchema),
    defaultValues: clinic,
  });
  const updateAction = useAction(updateClinic, {
    onSuccess: () => {
      toast.success("Dados da clínica salvos.");
      session.refetch();
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(
        actionErrorMessage(error, "Não foi possível salvar os dados."),
      ),
  });
  const disabled = Boolean(block);

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        {block && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {block.message}{" "}
            <Link
              href={BLOCKED_COPY[block.kind].href}
              className="font-medium underline"
            >
              {BLOCKED_COPY[block.kind].action}
            </Link>
          </p>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              updateAction.execute(values),
            )}
            className="space-y-4"
          >
            <fieldset disabled={disabled} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, número, bairro, cidade"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="(##) #####-####"
                        mask="_"
                        placeholder="(11) 99999-9999"
                        value={field.value}
                        onValueChange={(value) => field.onChange(value.value)}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
            <Button type="submit" disabled={disabled || updateAction.isPending}>
              Salvar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
