"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Step1Details from "./step1-details";
// Import the new steps
import Step2Components from "./step2-components";
import Step3Preview from "./step3-preview";
import {
  type TemplateFormData,
  initialFormData,
  type TemplateComponent,
} from "./types";
import { createMessageTemplate } from "@/actions/whatsapp/templates"; // Import server action
import type { ChatAgentWithWorkflows } from "@/types/agent";

const TOTAL_STEPS = 3;

interface WizardProps {
  agent: ChatAgentWithWorkflows | null;
  language: string; // From sidebar, sets initial form language
}

export default function TemplateBuilderWizard({
  agent,
  language,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TemplateFormData>({
    ...initialFormData,
    language: language, // Initialize with language from sidebar
  });
  const [nameValidationMessage, setNameValidationMessage] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFormChange = (field: keyof TemplateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name") {
      // Basic name validation example (can be expanded)
      if (value && !/^[a-z0-9_]{1,512}$/.test(value)) {
        setNameValidationMessage(
          "Nombre inválido. Usar solo minúsculas, números y '_'.",
        );
      } else {
        setNameValidationMessage(undefined);
      }
    }
    // If language changes in form, it might affect sidebar too or vice versa
    // This example assumes sidebar language sets initial form language
    if (field === "language") {
      // Potentially notify parent or handle consistency if sidebar also changes this
    }
  };

  // Update formData language if sidebar language changes
  // This can be done via useEffect or by passing the language prop directly to Step1Details
  // For simplicity, let's assume Step1Details uses formData.language which is initialized by props.language.
  // If sidebar changes language, this Wizard component would need to be re-rendered or receive updated props to reflect it.

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      if (currentStep === 1 && nameValidationMessage) {
        // Prevent proceeding if name is invalid
        return;
      }
      if (currentStep === 2) {
        const bodyComponent = formData.components.find(
          (c) => c.type === "BODY",
        ) as TemplateComponent | undefined;

        // BODY debe existir siempre
        if (!bodyComponent) {
          setSubmissionStatus({
            success: false,
            message: "Debes incluir un componente BODY.",
          });
          return;
        }

        if (formData.category === "AUTHENTICATION") {
          // 1. BODY NO debe tener text ni example
          if (bodyComponent.text && bodyComponent.text.trim().length > 0) {
            setSubmissionStatus({
              success: false,
              message:
                "Para plantillas de autenticación no debes definir texto en el BODY. El mensaje lo genera WhatsApp automáticamente.",
            });
            return;
          }

          // 2. Debe existir un botón OTP en BUTTONS
          const buttonsComp = formData.components.find(
            (c) => c.type === "BUTTONS",
          ) as TemplateComponent | undefined;
          const hasOtpButton = buttonsComp?.buttons?.some(
            (b: any) => b.type === "OTP",
          );
          if (!hasOtpButton) {
            setSubmissionStatus({
              success: false,
              message:
                "Las plantillas de autenticación necesitan un botón OTP (COPY_CODE, ONE_TAP o ZERO_TAP).",
            });
            return;
          }
        } else {
          // Para plantillas Utility / Marketing, BODY debe tener texto
          if (!bodyComponent.text || !bodyComponent.text.trim()) {
            setSubmissionStatus({
              success: false,
              message: "El cuerpo de la plantilla no puede estar vacío.",
            });
            return;
          }
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!agent?.whatsappBusinessAccountId || !agent.whatsappAccessToken) {
      setSubmissionStatus({
        success: false,
        message: "Error: Agente o credenciales de WhatsApp no seleccionadas.",
      });
      return;
    }
    // Basic validation before submission
    if (
      !formData.name ||
      !formData.category ||
      !formData.language ||
      formData.components.length === 0
    ) {
      setSubmissionStatus({
        success: false,
        message: "Por favor, completa todos los campos requeridos.",
      });
      return;
    }
    if (nameValidationMessage) {
      setSubmissionStatus({
        success: false,
        message: "El nombre de la plantilla tiene errores.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    const accessToken = agent.whatsappAccessToken;
    console.log(agent);
    const result = await createMessageTemplate({
      businessAccountId: agent.whatsappBusinessAccountId,
      accessToken,
      name: formData.name,
      category: formData.category,
      language: formData.language,
      components: formData.components,
      agentId: agent.id,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSubmissionStatus({
        success: true,
        message: `Plantilla "${formData.name}" enviada para aprobación. ID: ${result.data?.id}`,
      });
      // Optionally reset form or navigate away
    } else {
      setSubmissionStatus({
        success: false,
        message: `Error al enviar: ${result.error} ${result.errorData?.error_user_title ? "(" + result.errorData.error_user_title + ")" : ""}`,
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Details
            formData={formData}
            onFormChange={handleFormChange}
            nameValidationMessage={nameValidationMessage}
          />
        );
      case 2:
        return (
          <Step2Components
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case 3:
        return <Step3Preview formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crear Nueva Plantilla de Mensaje</CardTitle>
        <CardDescription>
          Paso {currentStep} de {TOTAL_STEPS}
        </CardDescription>
        <Progress value={(currentStep / TOTAL_STEPS) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="min-h-[450px]">
        {renderStepContent()}
        {submissionStatus && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${submissionStatus.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {submissionStatus.message}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isSubmitting}
        >
          Anterior
        </Button>
        {currentStep < TOTAL_STEPS ? (
          <Button
            onClick={nextStep}
            disabled={
              isSubmitting ||
              (currentStep === 1 &&
                (nameValidationMessage !== undefined || !formData.name))
            }
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              nameValidationMessage !== undefined ||
              !formData.name
            }
          >
            {isSubmitting ? "Enviando..." : "Enviar a Aprobación"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
