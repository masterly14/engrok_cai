import axios from "axios";

export class CRMService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CRM_API_KEY || "";
    this.baseUrl = process.env.CRM_BASE_URL || "";
  }

  async createLead(userData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/crm`, userData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating lead in CRM:", error);
      throw error;
    }
  }

  async updateLead(updateData: any): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/crm`, updateData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating lead in CRM:", error);
      throw error;
    }
  }
  async getLeadByPhone(phoneNumber: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/crm`, 
        {
          params: { phone: phoneNumber },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching lead from CRM:', error);
      throw error;
    }
  }
}
