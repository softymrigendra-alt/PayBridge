import apiClient from './client';
import { Opportunity, OpportunityDetail, PaginatedResponse, ApiResponse, SyncResult, PaymentIntentResult } from '../types';

export const opportunitiesApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient
      .get<PaginatedResponse<Opportunity>>('/opportunities', { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient
      .get<ApiResponse<OpportunityDetail>>(`/opportunities/${id}`)
      .then((r) => r.data.data!),

  getStatus: (id: string) =>
    apiClient
      .get<ApiResponse<OpportunityDetail>>(`/opportunities/${id}/status`)
      .then((r) => r.data.data!),

  fetchInvoice: (id: string) =>
    apiClient
      .post<ApiResponse<OpportunityDetail>>(`/opportunities/${id}/fetch-invoice`)
      .then((r) => r.data.data!),

  inviteHost: (id: string) =>
    apiClient
      .post<ApiResponse<{ stripeAccountId: string; onboardingUrl: string }>>(`/opportunities/${id}/invite-host`)
      .then((r) => r.data),

  charge: (id: string) =>
    apiClient
      .post<ApiResponse<PaymentIntentResult>>(`/opportunities/${id}/charge`)
      .then((r) => r.data.data!),
};

export const syncApi = {
  salesforce: (since?: string) =>
    apiClient
      .post<ApiResponse<SyncResult>>('/sync/salesforce', { since })
      .then((r) => r.data),
};

export const auditApi = {
  getByOpportunity: (opportunityId: string) =>
    apiClient
      .get<ApiResponse<AuditLog[]>>(`/audit/${opportunityId}`)
      .then((r) => r.data.data!),
};

export const authApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<ApiResponse<{ token: string; user: { id: string; email: string; name: string; role: string } }>>('/auth/login', { email, password })
      .then((r) => r.data.data!),

  me: () =>
    apiClient
      .get<ApiResponse<{ id: string; email: string; name: string; role: string }>>('/auth/me')
      .then((r) => r.data.data!),
};

import type { AuditLog } from '../types';
