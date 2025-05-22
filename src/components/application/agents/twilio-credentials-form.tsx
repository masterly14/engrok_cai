"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Loader2 } from "lucide-react";
import { verifyTwilioCredentials } from "@/actions/twilio";

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface VerificationStatus {
  isVerifying: boolean;
  isVerified: boolean;
  message: string;
}

interface TwilioCredentialsFormProps {
  /**
   * Current credentials coming from the parent component.
   */
  formData: TwilioCredentials;
  /**
   * Propagate every change in the credentials back to the parent.
   */
  onFormDataChange: (data: TwilioCredentials) => void;
  /**
   * Current verification status living in the parent component.
   */
  verificationStatus: VerificationStatus;
  /**
   * Propagate verification status changes back to the parent.
   */
  onVerificationStatusChange: (status: VerificationStatus) => void;
}

export const TwilioCredentialsForm = ({
  formData,
  onFormDataChange,
  verificationStatus,
  onVerificationStatusChange,
}: TwilioCredentialsFormProps) => {
  const [localCredentials, setLocalCredentials] = useState<TwilioCredentials>(
    formData
  );

  // Sync local state whenever the parent updates formData
  useEffect(() => {
    setLocalCredentials(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...localCredentials, [name]: value } as TwilioCredentials;
    setLocalCredentials(updated);
    // Clear any verification status whenever credentials change
    onVerificationStatusChange({
      isVerifying: false,
      isVerified: false,
      message: "",
    });
    onFormDataChange(updated);
  };

  const handleVerifyCredentials = async () => {
    if (
      !localCredentials.accountSid ||
      !localCredentials.authToken ||
      !localCredentials.phoneNumber
    ) {
      onVerificationStatusChange({
        isVerifying: false,
        isVerified: false,
        message: "Please fill in all Twilio credentials",
      });
      return;
    }

    onVerificationStatusChange({
      isVerifying: true,
      isVerified: false,
      message: "Verifying credentials...",
    });

    const result = await verifyTwilioCredentials(localCredentials);

    onVerificationStatusChange({
      isVerifying: false,
      isVerified: result.success,
      message: result.message,
    });
  };

  const areAllCredentialsEntered =
    localCredentials.accountSid &&
    localCredentials.authToken &&
    localCredentials.phoneNumber;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accountSid">Twilio SID de la cuenta</Label>
        <Input
          id="accountSid"
          name="accountSid"
          value={localCredentials.accountSid}
          onChange={handleChange}
          placeholder="Enter your Twilio Account SID"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="authToken">Token de autenticación de Twilio</Label>
        <Input
          id="authToken"
          name="authToken"
          type="password"
          value={localCredentials.authToken}
          onChange={handleChange}
          placeholder="Enter your Twilio Auth Token"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Número de teléfono de Twilio</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          value={localCredentials.phoneNumber}
          onChange={handleChange}
          placeholder="Enter your Twilio Phone Number"
        />
      </div>

      {/* Verificación de credenciales */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleVerifyCredentials}
          disabled={!areAllCredentialsEntered || verificationStatus.isVerifying}
          variant="outline"
          className="w-full"
        >
          {verificationStatus.isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : verificationStatus.isVerified ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Verified
            </>
          ) : (
            "Verify Credentials"
          )}
        </Button>

        {verificationStatus.message && (
          <Alert
            variant={verificationStatus.isVerified ? "default" : "destructive"}
            className="mt-2"
          >
            <AlertDescription>{verificationStatus.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <p className="text-sm text-muted">
        The Twilio credentials you provide (Account SID, Auth Token, and Phone
        Number) will be used exclusively to set up, monitor, and store voice
        call interactions through the agent. These details are necessary to
        establish a secure connection with Twilio's telephony services and will
        not be shared or used for any purposes beyond call management.
      </p>

      {/*WIP: Crear el tutorial para saber como encontrar esa información.*/}
      <a
        href="#"
        className="text-sm text-muted-foreground"
      >
        If you don't know where to find that information,{' '}
        <span className="underline">touch here to see a tutorial</span>
      </a>
    </div>
  );
}; 