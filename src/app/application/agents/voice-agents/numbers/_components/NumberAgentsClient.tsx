"use client";

import { usePhoneNumber } from "@/context/number-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Plus, RotateCcw, Loader2, Phone } from "lucide-react";
import {
  useCreatePhoneNumber,
  useUpdatePhoneNumber,
} from "@/hooks/use-create-phone-number";
import { useAllAgents } from "@/hooks/use-all-agents";
import { useState } from "react";
import InboundSettingsCard from "./InboundSettingsCard";
import NumberConfigurationCard from "./NumberConfigurationCard";
import CreateCall from "./create-call";

const NumberAgentsClient = () => {
  const {
    selectedPhoneNumber,
    formData,
    setFormData,
    hasChanges,
    resetForm,
    isCreatingNew,
    setIsCreatingNew,
  } = usePhoneNumber();

  const createPhoneNumberMutation = useCreatePhoneNumber();
  const updatePhoneNumberMutation = useUpdatePhoneNumber();
  const { agentsData, agentsLoading, agentsError } = useAllAgents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const handleStartBlank = () => {
    if (!selectedPhoneNumber) {
      setIsCreatingNew(true);
    }
    toast.info("Creando nuevo número");
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    const missingFields = [];

    if (!formData.number.trim()) {
      missingFields.push("Número");
    }

    if (!formData.provider.trim()) {
      missingFields.push("Proveedor");
    }

    if (missingFields.length > 0) {
      const fieldsText = missingFields.join(", ");
      toast.error(`Por favor completa los siguientes campos: ${fieldsText}`);
      return;
    }

    if (isCreatingNew) {
      try {
        await createPhoneNumberMutation.mutateAsync({
          number: formData.number,
          provider: formData.provider,
          assistantId: formData.assistantId,
          extension: formData.extension,
          credentialId: formData.credentialId,
          twilioAccountSid: formData.twilioAccountSid,
          twilioAuthToken: formData.twilioAuthToken,
          vonageApiKey: formData.vonageApiKey,
          vonageApiSecret: formData.vonageApiSecret,
          vapiNumberDesiredAreaCode: formData.vapiNumberDesiredAreaCode,
          vapiSipUri: formData.vapiSipUri,
        });

        resetForm();
        setIsCreatingNew(false);
        toast.success("Número creado correctamente");
      } catch (error: any) {
        setError(error?.message || "Error desconocido");

        console.error("Error creating phone number:", error);

        // Manejo robusto del error
        const errorMessage =
          error?.body?.message || // Si viene del SDK Vapi
          error?.message || // Si es un Error común
          "Error desconocido";

        toast.error(errorMessage);
      }
    } else {
      // TODO: Implement update functionality
      console.log("Información a mandar", formData);
      try {
        setLoading(true);
        await updatePhoneNumberMutation.mutateAsync({
          number: formData.number,
          name: selectedPhoneNumber?.name!,
          provider: formData.provider,
          extension: formData.extension,
          credentialId: formData.credentialId,
          twilioAccountSid: formData.twilioAccountSid,
          twilioAuthToken: formData.twilioAuthToken,
          assistantId: formData.assistantId,
          workflowId: formData.workflowId,
        });
        resetForm();
        setIsCreatingNew(false);
        toast.success("Número actualizado correctamente");
      } catch (error: any) {
        setError(error?.message || "Error desconocido");
        console.error("Error updating phone number:", error);
        toast.error(error?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
      console.log("Updating existing phone number:", selectedPhoneNumber);
    }
  };

  return (
    <div className="flex-1 bg-slate-50/30 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Mostrar mensaje si no hay número seleccionado y no se está creando uno nuevo */}
        {!selectedPhoneNumber && !isCreatingNew ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="w-full max-w-lg border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <Phone className="h-10 w-10 text-slate-600" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      No hay número seleccionado
                    </h2>
                    <p className="text-slate-600 max-w-sm leading-relaxed">
                      Selecciona un número de la lista lateral para editarlo o
                      crea uno nuevo para comenzar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {selectedPhoneNumber && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-slate-900">
                    Acciones del número
                  </h2>
                  <div className="flex gap-3">
                    <CreateCall
                      phoneNumberId={selectedPhoneNumber.id}
                      phoneNumberVapiId={selectedPhoneNumber.vapiId!}
                      assistans={agentsData}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl border-0 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {isCreatingNew
                      ? "Crear nuevo número"
                      : `Editando: ${selectedPhoneNumber?.name}`}
                  </h1>
                  <p className="text-slate-600">
                    {isCreatingNew
                      ? "Configura tu nuevo número de teléfono"
                      : "Modifica la configuración de tu número"}
                  </p>
                </div>

                <div className="flex gap-3">
                  {hasChanges && !isCreatingNew && (
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Descartar cambios
                    </Button>
                  )}

                  {hasChanges && !isCreatingNew ? (
                    <Button
                      onClick={handleSave}
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                      disabled={updatePhoneNumberMutation.isPending}
                    >
                      {updatePhoneNumberMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                  ) : isCreatingNew ? (
                    <Button
                      onClick={handleSave}
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                      disabled={createPhoneNumberMutation.isPending}
                    >
                      {createPhoneNumberMutation.isPending ||
                      updatePhoneNumberMutation.isPending ||
                      loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Un momento...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear número
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Form */}
            {selectedPhoneNumber && (
              <div className="space-y-8">
                <InboundSettingsCard
                  isCreatingNew={isCreatingNew}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  agentsData={Array.isArray(agentsData) ? agentsData : []}
                  selectedAgent={selectedAgent}
                  setSelectedAgent={setSelectedAgent}
                  selectedWorkflow={selectedWorkflow}
                  setSelectedWorkflow={setSelectedWorkflow}
                />
              </div>
            )}

            <NumberConfigurationCard
              isCreatingNew={isCreatingNew}
              formData={formData}
              handleInputChange={handleInputChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberAgentsClient;
