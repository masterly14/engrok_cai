"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const formSchema = z.object({
  countryCode: z.string({
    required_error: "Por favor selecciona un código de país",
  }),
  phoneNumber: z.string().min(5, {
    message: "El número telefónico debe tener al menos 5 dígitos",
  }),
});

const countryCodes = [
  { value: "+1", label: "Estados Unidos", flag: "🇺🇸" },
  { value: "+34", label: "España", flag: "🇪🇸" },
  { value: "+52", label: "México", flag: "🇲🇽" },
  { value: "+54", label: "Argentina", flag: "🇦🇷" },
  { value: "+55", label: "Brasil", flag: "🇧🇷" },
  { value: "+56", label: "Chile", flag: "🇨🇱" },
  { value: "+57", label: "Colombia", flag: "🇨🇴" },
  { value: "+58", label: "Venezuela", flag: "🇻🇪" },
  { value: "+51", label: "Perú", flag: "🇵🇪" },
  { value: "+502", label: "Guatemala", flag: "🇬🇹" },
  { value: "+503", label: "El Salvador", flag: "🇸🇻" },
  { value: "+504", label: "Honduras", flag: "🇭🇳" },
  { value: "+505", label: "Nicaragua", flag: "🇳🇮" },
  { value: "+506", label: "Costa Rica", flag: "🇨🇷" },
  { value: "+507", label: "Panamá", flag: "🇵🇦" },
  { value: "+591", label: "Bolivia", flag: "🇧🇴" },
  { value: "+593", label: "Ecuador", flag: "🇪🇨" },
  { value: "+595", label: "Paraguay", flag: "🇵🇾" },
  { value: "+598", label: "Uruguay", flag: "🇺🇾" },
  { value: "+33", label: "Francia", flag: "🇫🇷" },
  { value: "+44", label: "Reino Unido", flag: "🇬🇧" },
  { value: "+49", label: "Alemania", flag: "🇩🇪" },
  { value: "+39", label: "Italia", flag: "🇮🇹" },
  { value: "+351", label: "Portugal", flag: "🇵🇹" },
];

export function CallPhoneDialog({
  prompt,
  first_message,
}: {
  prompt: string;
  first_message: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryCode: "+34",
      phoneNumber: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Aquí iría la llamada a la API
      console.log("Llamando a:", values.countryCode + values.phoneNumber);
      let number = values.countryCode + values.phoneNumber;
      const response = await fetch(`${process.env.NEXT_PUBLIC_NGROK_URL}/outbound-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: number,
          prompt: prompt,
          first_message: first_message
        }),
      });
      

      const data = await response.json();

      if (response.ok && data.success) {
        toast("En un momento recibirás una llamada")
      }
      setOpen(false);
    } catch (error) {
      console.error("Error al realizar la llamada:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Phone className="mr-2 h-4 w-4" />
          Testea tu agente
        </Button>
      </DialogTrigger>
      <DialogOverlay className="bg-black/50 backdrop-blur-xs" />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make call</DialogTitle>
          <DialogDescription>
                Ingresa el número de teléfono al que quieres llamar. Asegúrate de que tu número de Twilio tenga permisos para llamar a ese país
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormLabel>Código</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar">
                            {field.value && (
                              <>
                                {
                                  countryCodes.find(
                                    (code) => code.value === field.value
                                  )?.flag
                                }{" "}
                                {field.value}
                              </>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {countryCodes.map((code) => (
                          <SelectItem key={code.value} value={code.value}>
                            <span className="flex items-center">
                              <span className="mr-2">{code.flag}</span>
                              <span>{code.label}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {code.value}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número al que llamar"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Llamando ...
                  </>
                ) : (
                  "Llamar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
