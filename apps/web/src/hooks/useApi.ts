// Custom React hooks for data fetching with caching and error handling
import { useState, useEffect, useCallback } from "react";
import * as api from "../lib/apiClient";

// Generic hook for data fetching
function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}

// Campaigns Hook
export function useCampaigns(filters?: Record<string, any>) {
  return useFetch(
    () => api.getCampaigns(filters),
    [JSON.stringify(filters)]
  );
}

export function useCampaign(id: string) {
  return useFetch(
    () => api.getCampaign(id),
    [id]
  );
}

// Clients Hook
export function useClients() {
  return useFetch(() => api.getClients(), []);
}

export function useClient(id: string) {
  return useFetch(
    () => api.getClient(id),
    [id]
  );
}

// Billing Hook
export function useBilling() {
  return useFetch(() => api.getBillingSubscriptions(), []);
}

export function useInvoices() {
  return useFetch(() => api.getInvoices(), []);
}

// Team Hook
export function useTeamMembers() {
  return useFetch(() => api.getTeamMembers(), []);
}

// User Profile Hook
export function useUserProfile() {
  return useFetch(() => api.getUserProfile(), []);
}

// Activity Logs Hook
export function useActivityLogs(limit?: number) {
  return useFetch(
    () => api.getActivityLogs(limit),
    [limit]
  );
}

// Notifications Hook
export function useNotifications(limit?: number) {
  return useFetch(
    () => api.getNotifications(limit),
    [limit]
  );
}

// Analytics Hook
export function useAnalytics() {
  return useFetch(() => api.getAnalyticsPulse(), []);
}

// Creatives Hook
export function useCreatives() {
  return useFetch(() => api.getCreatives(), []);
}

// Workspaces Hook
export function useWorkspaces() {
  return useFetch(() => api.getWorkspaces(), []);
}

// Integrations Hook
export function useIntegrations() {
  return useFetch(() => api.getIntegrations(), []);
}

// Mutations with loading state
export function useMutation<T, R>(mutationFn: (data: T) => Promise<R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (data: T) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(data);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, loading, error };
}

// Create Campaign Hook
export function useCreateCampaign() {
  return useMutation((data: any) => api.createCampaign(data));
}

// Update Campaign Hook
export function useUpdateCampaign(id: string) {
  return useMutation((data: any) => api.updateCampaign(id, data));
}

// Create Client Hook
export function useCreateClient() {
  return useMutation((data: any) => api.createClient(data));
}

// Update Client Hook
export function useUpdateClient(id: string) {
  return useMutation((data: any) => api.updateClient(id, data));
}

// Invite Team Member Hook
export function useInviteTeamMember() {
  return useMutation((data: any) => api.inviteTeamMember(data));
}

// Update Profile Hook
export function useUpdateProfile() {
  return useMutation((data: any) => api.updateUserProfile(data));
}

// Send AI Message Hook
export function useSendAiMessage() {
  return useMutation((message: string) => api.sendAiMessage(message));
}

// Generate AI Campaign Hook
export function useGenerateAiCampaign() {
  return useMutation((data: any) => api.generateAiCampaign(data));
}

// Create Checkout Session Hook
export function useCreateCheckoutSession() {
  return useMutation((data: any) => api.createCheckoutSession(data));
}

// Generate Report Hook
export function useGenerateReport() {
  return useMutation((data: any) => api.generateReport(data));
}

// Reports Hook
export function useReports() {
  return useFetch(() => api.getReports(), []);
}

// Marketplace Apps Hook
export function useMarketplaceApps() {
  return useFetch(() => api.getMarketplaceApps(), []);
}

export function useInstallMarketplaceApp() {
  return useMutation((appId: string) => api.installMarketplaceApp(appId));
}

export function useUninstallMarketplaceApp() {
  return useMutation((appId: string) => api.uninstallMarketplaceApp(appId));
}

// Automations Hook
export function useAutomations() {
  return useFetch(() => api.getAutomations(), []);
}

export function useCreateAutomation() {
  return useMutation((data: any) => api.createAutomation(data));
}

export function useUpdateAutomation(id: string) {
  return useMutation((data: any) => api.updateAutomation(id, data));
}

export function useDeleteAutomation() {
  return useMutation((id: string) => api.deleteAutomation(id));
}

// Security Settings Hook
export function useSecuritySettings() {
  return useFetch(() => api.getSecuritySettings(), []);
}

export function useUpdateSecuritySettings() {
  return useMutation((data: any) => api.updateSecuritySettings(data));
}

export function useEnableTwoFactor() {
  return useMutation(() => api.enableTwoFactor());
}

export function useDisableTwoFactor() {
  return useMutation(() => api.disableTwoFactor());
}

export function useActiveSessions() {
  return useFetch(() => api.getActiveSessions(), []);
}

export function useRevokeSession() {
  return useMutation((sessionId: string) => api.revokeSession(sessionId));
}

// Support Tickets Hook
export function useSupportTickets() {
  return useFetch(() => api.getSupportTickets(), []);
}

export function useSupportTicket(id: string) {
  return useFetch(
    () => api.getSupportTicket(id),
    [id]
  );
}

export function useCreateSupportTicket() {
  return useMutation((data: any) => api.createSupportTicket(data));
}

export function useUpdateSupportTicket(id: string) {
  return useMutation((data: any) => api.updateSupportTicket(id, data));
}

export function useSupportFaqs() {
  return useFetch(() => api.getSupportFaqs(), []);
}
