// Centralized API client for all backend requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Helper to get auth headers - retrieves access_token from localStorage
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const accessToken = typeof window !== 'undefined' 
    ? localStorage.getItem("access_token")
    : null;

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

// Generic API request handler
export async function apiRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();

  const finalOptions: RequestOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(data: any) {
  return apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
}
export async function signup(data: any) {
  return apiRequest("/api/auth/signup", { method: "POST", body: JSON.stringify(data) });
}
export async function verifyEmail(token: string) {
  return apiRequest("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
}
export async function forgotPassword(email: string) {
  return apiRequest("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}
export async function resetPassword(data: any) {
  return apiRequest("/api/auth/reset-password", { method: "POST", body: JSON.stringify(data) });
}

// Analytics & Dashboard
export async function getAnalyticsPulse() {
  return apiRequest("/api/analytics/pulse");
}

export async function getAnalyticsPulseMatrix() {
  return apiRequest("/api/analytics/pulse-matrix");
}

export const updateSecuritySettings = async (data: any) => ({
  success: true,
});

export const enableTwoFactor = async () => ({
  success: true,
});

export const disableTwoFactor = async () => ({
  success: true,
});

export const getActiveSessions = async () => [];

export const revokeSession = async (id: string) => ({
  success: true,
});

export const getSupportTickets = async () => [];

export const getSupportTicket = async (id: string) => ({
  id,
});

export const createSupportTicket = async (data: any) => ({
  success: true,
});

export const updateSupportTicket = async (
  id: string,
  data: any
) => ({
  success: true,
});

export const getSupportFaqs = async () => [];

export async function getCampaignMetrics() {
  return apiRequest("/api/analytics/campaigns");
}

// Campaigns
export async function getCampaigns(filters?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  return apiRequest(`/api/campaigns?${params.toString()}`);
}

export async function getCampaign(id: string) {
  return apiRequest(`/api/campaigns/${id}`);
}

export async function createCampaign(data: any) {
  return apiRequest("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateCampaign(id: string, data: any) {
  return apiRequest(`/api/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function pauseCampaign(id: string) {
  return apiRequest(`/api/campaigns/${id}/pause`, {
    method: "POST"
  });
}

export async function resumeCampaign(id: string) {
  return apiRequest(`/api/campaigns/${id}/resume`, {
    method: "POST"
  });
}

// Clients
export async function getClients() {
  return apiRequest("/api/clients");
}

export async function getClient(id: string) {
  return apiRequest(`/api/clients/${id}`);
}

export async function createClient(data: any) {
  return apiRequest("/api/clients", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateClient(id: string, data: any) {
  return apiRequest(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

// Billing & Subscriptions
export async function getBillingSubscriptions() {
  return apiRequest("/api/billing/subscriptions");
}

export async function createCheckoutSession(data: any) {
  return apiRequest("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getInvoices() {
  return apiRequest("/api/billing/invoices");
}

// Team Management
export async function getTeamMembers() {
  return apiRequest("/api/team");
}

export async function inviteTeamMember(data: any) {
  return apiRequest("/api/team/invite", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateTeamMemberRole(id: string, role: string) {
  return apiRequest(`/api/team/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export async function removeTeamMember(id: string) {
  return apiRequest(`/api/team/${id}`, {
    method: "DELETE"
  });
}

// User Profile
export async function getUserProfile() {
  return apiRequest("/api/user/profile");
}

export async function updateUserProfile(data: any) {
  return apiRequest("/api/user/profile", {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function getActivityLogs(limit?: number) {
  return apiRequest(`/api/activity-logs?limit=${limit || 50}`);
}

export async function getNotifications(limit?: number) {
  return apiRequest(`/api/notifications?limit=${limit || 20}`);
}

// AI Features
export async function sendAiMessage(message: string) {
  return apiRequest("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export async function generateAiCampaign(data: any) {
  return apiRequest("/api/ai/generate-campaign", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Creatives
export async function getCreatives() {
  return apiRequest("/api/creatives");
}

export async function createCreative(data: FormData) {
  return apiRequest("/api/creatives", {
    method: "POST",
    body: data,
    headers: {} // Remove Content-Type to let browser set it with boundary
  });
}

export async function generateCreativeRatios(data: any) {
  return apiRequest("/api/creatives/generate-ratios", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Reports
export async function generateReport(data: any) {
  return apiRequest("/api/v1/reports", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function downloadReport(id: string) {
  return apiRequest(`/api/v1/reports/download/${id}`);
}

// Workspaces
export async function getWorkspaces() {
  return apiRequest("/api/workspaces");
}

export async function createWorkspace(data: any) {
  return apiRequest("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Integrations
export async function getIntegrations() {
  return apiRequest("/api/integrations");
}

export async function connectIntegration(platform: string, credentials: any) {
  return apiRequest("/api/integrations/connect", {
    method: "POST",
    body: JSON.stringify({ platform, credentials })
  });
}

// Reports - Get list
export async function getReports() {
  return apiRequest("/api/v1/reports");
}

// Marketplace Apps
export async function getMarketplaceApps() {
  return apiRequest("/api/marketplace/apps");
}

export async function installMarketplaceApp(appId: string) {
  return apiRequest(`/api/marketplace/apps/${appId}/install`, {
    method: "POST"
  });
}

export async function uninstallMarketplaceApp(appId: string) {
  return apiRequest(`/api/marketplace/apps/${appId}/uninstall`, {
    method: "POST"
  });
}

// Automations
export async function getAutomations() {
  return apiRequest("/api/automations");
}

export async function createAutomation(data: any) {
  return apiRequest("/api/automations", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateAutomation(id: string, data: any) {
  return apiRequest(`/api/automations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteAutomation(id: string) {
  return apiRequest(`/api/automations/${id}`, {
    method: "DELETE"
  });
}

// Security Settings
export async function getSecuritySettings() {
  return apiRequest("/api/user/security");
}

const apiClient = {
  get: (endpoint: string, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data?: any, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: (endpoint: string, data?: any, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch: (endpoint: string, data?: any, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: (endpoint: string, options?: RequestOptions) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
