import { apiService } from './api';
import type {
  OperationRecord,
  CreateOperationRecordRequest,
  UpdateOperationRecordRequest,
} from './api';

class OperationRecordService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (apiService as any).baseUrl;
  }

  private getAuthHeaders() {
    return (apiService as any).getAuthHeaders();
  }

  private async fetchWithRetry(url: string, options: RequestInit) {
    return (apiService as any).fetchWithRetry(url, options);
  }

  private async handleResponse(response: Response) {
    return (apiService as any).handleResponse(response);
  }

  async getAllOperationRecords(): Promise<OperationRecord[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/operation-records`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getOperationRecord(id: string): Promise<OperationRecord> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/operation-records/${id}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async createOperationRecord(data: CreateOperationRecordRequest): Promise<OperationRecord> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/operation-records`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async updateOperationRecord(
    id: string,
    data: UpdateOperationRecordRequest
  ): Promise<OperationRecord> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/operation-records/${id}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteOperationRecord(id: string): Promise<void> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/operation-records/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete operation record: ${response.statusText}`);
    }
  }
}

export const operationRecordService = new OperationRecordService();
