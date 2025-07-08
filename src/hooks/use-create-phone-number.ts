import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPhoneNumber, updatePhoneNumber } from "@/actions/vapi/numbers";

interface CreatePhoneNumberParams {
  number: string;
  provider: "telnyx" | "byo-phone-number" | "twilio" | "vonage" | "vapi";
  name?: string;
  extension?: string;
  credentialId?: string;
  assistantId?: string;
  workflowId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  vonageApiKey?: string;
  vonageApiSecret?: string;
  vapiNumberDesiredAreaCode?: string;
  vapiSipUri?: string;
  vapiSipUsername?: string;
  vapiSipPassword?: string;
}

export function useCreatePhoneNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreatePhoneNumberParams) => {
      const response = await createPhoneNumber(params);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch phone numbers list
      queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
    },
  });
}

export function useUpdatePhoneNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreatePhoneNumberParams) => {
      console.log(params);
      const response = await updatePhoneNumber(params);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
    },
  });
}
