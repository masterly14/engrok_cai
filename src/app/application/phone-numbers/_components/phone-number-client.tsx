"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvailablePhoneNumbers, purchasePhoneNumber } from '@/actions/twilio';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from "sonner"

type AvailableNumber = {
  phoneNumber: string;
  friendlyName: string;
  locality: string | null;
  region: string | null;
};

export const PhoneNumberClient = () => {
  const [country, setCountry] = useState<'US' | 'CO'>('US');
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const handleFetchNumbers = () => {
    startTransition(async () => {
      try {
        const result = await getAvailablePhoneNumbers(country);
        setNumbers(result);
        if (result.length === 0) {
          toast("No se encontraron números");
        }
      } catch (error: any) {
        toast("Error al buscar números");   
      }
    });
  };

  const handlePurchase = (phoneNumber: string) => {
    setIsPurchasing(phoneNumber);
    startTransition(async () => {
      const result = await purchasePhoneNumber(phoneNumber);
      if (result.success) {
        toast("Número comprado");
        // Refrescar la lista para que el número ya no aparezca como disponible
        handleFetchNumbers();
      } else {
        toast(  "Error en la compra");
      }
      setIsPurchasing(null);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscador de Números</CardTitle>
        <CardDescription>
          Selecciona un país y busca números de teléfono disponibles.
        </CardDescription>
        <div className="flex gap-2 pt-4">
          <Button
            variant={country === 'US' ? 'default' : 'outline'}
            onClick={() => setCountry('US')}
          >
            🇺🇸 Estados Unidos
          </Button>
          <Button
            variant={country === 'CO' ? 'default' : 'outline'}
            onClick={() => setCountry('CO')}
          >
            🇨🇴 Colombia
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFetchNumbers} disabled={isLoading}>
          {isLoading && !isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Buscar Números Disponibles
        </Button>

        {numbers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {numbers.map((number) => (
              <Card key={number.phoneNumber} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{number.friendlyName}</CardTitle>
                  <CardDescription>
                    {number.locality}, {number.region}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(number.phoneNumber)}
                    disabled={isLoading}
                  >
                    {isPurchasing === number.phoneNumber ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Comprar por $1/mes
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 