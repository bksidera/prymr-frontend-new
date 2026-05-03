import apiClient from './apiClient'
import type { ApiResponse } from '../types/api.types'
import type {
  CreateTipIntentRequest,
  CreateTipIntentResponse,
  Transaction,
} from '../types/payment.types'

export const paymentsService = {
  // Step 1 of the reaction-payment flow: pre-authorize payment.
  // Money is NOT charged yet — just authorized (capture_method: manual).
  // Returns paymentIntentId to pass into addReaction.
  async createTipIntent(request: CreateTipIntentRequest): Promise<CreateTipIntentResponse> {
    const res = await apiClient.post<ApiResponse<CreateTipIntentResponse>>(
      '/payments/createIntentTip',
      request,
    )
    return res.data.data
  },

  // Step 2: capture already happens inside addReaction on the backend.
  // This endpoint is for standalone tip captures (not reaction-linked).
  async captureTip(paymentIntentId: string): Promise<void> {
    await apiClient.post('/payments/capture-payments', { paymentIntentId })
  },

  async createStripeCustomer(): Promise<{ customerId: string }> {
    const res = await apiClient.post<ApiResponse<{ customerId: string }>>(
      '/payments/create-customer',
    )
    return res.data.data
  },

  async createAccountLink(): Promise<{ url: string }> {
    const res = await apiClient.post<ApiResponse<{ url: string }>>('/payments/createAccountLink')
    return res.data.data
  },

  async checkCreatorSetup(): Promise<{ isSetup: boolean; isVerified: boolean }> {
    const res = await apiClient.get<ApiResponse<{ isSetup: boolean; isVerified: boolean }>>(
      '/payments/checkAccountIsSetupOrNot',
    )
    return res.data.data
  },

  async getTransactions(month?: string): Promise<Transaction[]> {
    const params = month ? `?month=${month}` : ''
    const res = await apiClient.get<ApiResponse<Transaction[]>>(
      `/payments/fetchTransactions${params}`,
    )
    return res.data.data
  },

  async getSavedCards(customerId: string): Promise<unknown[]> {
    const res = await apiClient.get<ApiResponse<unknown[]>>(`/payments/list-cards/${customerId}`)
    return res.data.data
  },
}
