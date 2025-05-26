import axios from "axios";

export class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  }

  async generatePaymentLink(orderData: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/payments/generated-payment-link`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      console.log("Data de la respuesta", data);
      return `https://checkout.wompi.co/l/${data.data.id}`;

    } catch (error) {
      console.error("Error generating payment link:", error);
      throw error;
    }
  }
}
