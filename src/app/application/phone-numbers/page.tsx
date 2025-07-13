import React from 'react';
import { PhoneIcon } from 'lucide-react';
import { PhoneNumberClient } from './_components/phone-number-client';

const PhoneNumbersPage = () => {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <PhoneIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Comprar Números de Teléfono
          </h1>
          <p className="text-muted-foreground">
            Busca y adquiere números de teléfono de Twilio para tus agentes de voz.
          </p>
        </div>
      </div>
      <PhoneNumberClient />
    </div>
  );
};

export default PhoneNumbersPage;
