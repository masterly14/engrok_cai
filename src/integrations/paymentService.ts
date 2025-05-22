import axios from "axios";

export class PaymentService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PAYMENT_API_KEY || "";
    this.baseUrl = process.env.PAYMENT_BASE_URL || "";
  }

  async generatePaymentLink(orderData: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/payment-links`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.paymentUrl;
    } catch (error) {
      console.error("Error generating payment link:", error);
      throw error;
    }
  }
  async checkPaymentStatus(paymentId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/payment-links`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      return response.data.status;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
}
