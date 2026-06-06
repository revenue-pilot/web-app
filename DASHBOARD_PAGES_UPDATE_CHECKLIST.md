# Dashboard Pages Update Checklist

## ✅ Completed (Using Dynamic Data)

- [x] `apps/web/src/app/dashboard/page.tsx` - Main dashboard with analytics
- [x] `apps/web/src/app/dashboard/campaigns/page.tsx` - Campaign list & management
- [x] `apps/web/src/app/dashboard/clients/page.tsx` - Client list & creation
- [x] `apps/web/src/app/dashboard/billing/page.tsx` - Subscription & invoices
- [x] `apps/web/src/app/dashboard/team/page.tsx` - Team members & invitations
- [x] `apps/web/src/app/dashboard/ai-chat/page.tsx` - Already had API integration

## 📋 To Do (Migrate from Mock Data)

### High Priority (Most Used)

- [ ] `dashboard/activity/page.tsx` 
  - Hook to use: `useActivityLogs(limit)`
  - Replace: Static activity log array
  - API Endpoint: `/api/activity-logs`

- [ ] `dashboard/notifications/page.tsx`
  - Hook to use: `useNotifications(limit)`
  - Replace: Static notifications array
  - API Endpoint: `/api/notifications`

- [ ] `dashboard/profile/page.tsx`
  - Hook to use: `useUserProfile()`, `useUpdateProfile()`
  - Replace: Static user profile data
  - API Endpoint: `/api/user/profile`

- [ ] `dashboard/settings/page.tsx`
  - Hook to use: `useUserProfile()`, `useUpdateProfile()`
  - Replace: Static settings
  - API Endpoint: `/api/user/profile` (with settings patch)

### Medium Priority

- [ ] `dashboard/creative-vault/page.tsx`
  - Hook to use: `useCreatives()` (already exists)
  - Replace: Static creatives list
  - API Endpoint: `/api/creatives`

- [ ] `dashboard/integrations/page.tsx`
  - Hook to use: `useIntegrations()` (already exists)
  - Replace: Static integrations list
  - API Endpoint: `/api/integrations`

- [ ] `dashboard/reports/page.tsx`
  - Hook to create: `useReports()`, `useGenerateReport()`
  - Replace: Static reports list
  - API Endpoint: `/api/reports` (GET and POST)

- [ ] `dashboard/workspaces/page.tsx`
  - Hook to use: `useWorkspaces()` (already exists)
  - Replace: Static workspaces list
  - API Endpoint: `/api/workspaces`

### Lower Priority (Less Used)

- [ ] `dashboard/automations/page.tsx`
  - Hook to create: `useAutomations()`, `useCreateAutomation()`
  - Replace: Static automations list
  - API Endpoint: `/api/automations`

- [ ] `dashboard/neural-ops/page.tsx`
  - Hook to use: `useGenerateAiCampaign()`
  - Replace: Static AI recommendations
  - API Endpoint: `/api/ai/generate-campaign`

- [ ] `dashboard/marketplace/page.tsx`
  - Hook to create: `useMarketplaceApps()`
  - Replace: Static marketplace apps list
  - API Endpoint: `/api/marketplace/apps`

- [ ] `dashboard/pulse-matrix/page.tsx`
  - Hook to use: `useAnalytics()`
  - Replace: Static metrics
  - API Endpoint: `/api/analytics/pulse`

- [ ] `dashboard/support/page.tsx`
  - Hook to create: `useSupportTickets()`, `useCreateTicket()`
  - Replace: Static support tickets
  - API Endpoint: `/api/support/tickets`

- [ ] `dashboard/health/page.tsx` (Admin)
  - Hook to use: `useHealthMetrics()`
  - Replace: Static health data
  - API Endpoint: `/api/health` (or admin endpoint)

### Admin Pages (Low Priority)

- [ ] `dashboard/admin/ai-control/page.tsx`
  - Requires admin-only hooks
  - Depends on admin API endpoints

- [ ] `dashboard/admin/audit/page.tsx`
  - Hook to create: `useAuditLogs()`
  - API Endpoint: `/api/admin/audit-logs`

- [ ] `dashboard/admin/feature-control/page.tsx`
  - Hook to create: `useFeatureFlags()`
  - API Endpoint: `/api/admin/feature-flags`

- [ ] `dashboard/admin/fortress/page.tsx`
  - Hook to create: `useSecurityMetrics()`
  - API Endpoint: `/api/admin/security`

- [ ] `dashboard/admin/growth-lab/page.tsx`
  - Hook to create: `useExperiments()`
  - API Endpoint: `/api/admin/experiments`

- [ ] `dashboard/admin/health/page.tsx`
  - Hook to create: `useHealthMetrics()`
  - API Endpoint: `/api/admin/health`

- [ ] `dashboard/admin/integrations/page.tsx`
  - Hook to use: `useIntegrations()` + admin version
  - API Endpoint: `/api/admin/integrations`

- [ ] `dashboard/admin/revenue/page.tsx`
  - Hook to create: `useRevenueAnalytics()`
  - API Endpoint: `/api/admin/revenue`

- [ ] `dashboard/admin/security/page.tsx`
  - Hook to create: `useSecurityMetrics()`
  - API Endpoint: `/api/admin/security`

- [ ] `dashboard/admin/subscriptions/page.tsx`
  - Hook to use: `useBilling()` + admin version
  - API Endpoint: `/api/admin/subscriptions`

- [ ] `dashboard/admin/support/page.tsx`
  - Hook to create: `useSupportTickets()` + admin version
  - API Endpoint: `/api/admin/support`

- [ ] `dashboard/admin/users/page.tsx`
  - Hook to create: `useAdminUsers()`
  - API Endpoint: `/api/admin/users`

---

## 🚀 How to Update a Page

### Quick Template

```typescript
// ❌ BEFORE
"use client";
import { useEffect, useState } from "react";

export default function MyPage() {
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 300);
  }, []);

  return <div>{data.map(...)}</div>;
}
```

```typescript
// ✅ AFTER
"use client";
import { useMyData } from "@/hooks/useApi";

export default function MyPage() {
  const { data, loading, error, refetch } = useMyData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const items = Array.isArray(data) ? data : [];
  return <div>{items.map(...)}</div>;
}
```

### Steps

1. **Check if hook exists** - See `hooks/useApi.ts`
2. **If not, create it** - Add to `hooks/useApi.ts` and `lib/apiClient.ts`
3. **Replace useState + useEffect** with hook
4. **Replace mock data** with hook response
5. **Add loading state** - Show spinner while loading
6. **Add error state** - Show error message with retry button
7. **Replace post operations** - Use mutation hooks instead of direct setState
8. **Test locally** - Verify data loads from backend

---

## 📚 Example: Full Page Migration

### Original: `dashboard/automations/page.tsx` (Mock Data)

```typescript
"use client";
import { useState, useEffect } from "react";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState([
    { id: 1, name: "Auto-pause on low ROAS", status: "Active" },
    { id: 2, name: "Daily budget adjustment", status: "Paused" }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  return (
    <div>
      {loading ? "Loading..." : (
        <table>
          {automations.map(a => <tr key={a.id}><td>{a.name}</td></tr>)}
        </table>
      )}
    </div>
  );
}
```

### Updated: Using Dynamic Data

```typescript
"use client";
// First, add hook to hooks/useApi.ts if not exists:
// export function useAutomations() {
//   return useFetch(() => api.getAutomations(), []);
// }

import { useAutomations } from "@/hooks/useApi";

export default function AutomationsPage() {
  const { data: automations, loading, error, refetch } = useAutomations();

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const items = Array.isArray(automations) ? automations : [];

  return (
    <div>
      {loading ? "Loading..." : (
        <table>
          {items.map(a => <tr key={a.id}><td>{a.name}</td></tr>)}
        </table>
      )}
    </div>
  );
}
```

---

## 🔗 API Endpoints Reference

| Feature | Endpoint | Method | Hook |
|---------|----------|--------|------|
| Activity Logs | `/api/activity-logs` | GET | `useActivityLogs()` ✅ exists |
| Notifications | `/api/notifications` | GET | `useNotifications()` ✅ exists |
| Automations | `/api/automations` | GET/POST | Needs creation |
| Reports | `/api/reports` | GET/POST | Needs creation |
| Support Tickets | `/api/support/tickets` | GET/POST | Needs creation |
| Experiments | `/api/admin/experiments` | GET/POST | Needs creation |
| Revenue Analytics | `/api/admin/revenue` | GET | Needs creation |
| Health Metrics | `/api/admin/health` | GET | Needs creation |
| Audit Logs | `/api/admin/audit-logs` | GET | Needs creation |
| Feature Flags | `/api/admin/feature-flags` | GET/PATCH | Needs creation |
| Security Metrics | `/api/admin/security` | GET | Needs creation |
| Admin Users | `/api/admin/users` | GET/PATCH | Needs creation |
| Admin Integrations | `/api/admin/integrations` | GET | Needs creation |
| Admin Subscriptions | `/api/admin/subscriptions` | GET | Needs creation |
| Admin Support | `/api/admin/support` | GET/POST | Needs creation |

---

## 🛠️ Creating New Hooks

If a hook doesn't exist, create it:

### Step 1: Add API Client Function

**`lib/apiClient.ts`:**
```typescript
// Export new API function
export async function getAutomations() {
  return apiRequest("/api/automations");
}

export async function createAutomation(data: any) {
  return apiRequest("/api/automations", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
```

### Step 2: Add Hooks

**`hooks/useApi.ts`:**
```typescript
// Query hook
export function useAutomations() {
  return useFetch(() => api.getAutomations(), []);
}

// Mutation hook
export function useCreateAutomation() {
  return useMutation((data: any) => api.createAutomation(data));
}
```

### Step 3: Use in Component

```typescript
import { useAutomations, useCreateAutomation } from "@/hooks/useApi";

export default function AutomationsPage() {
  const { data, loading, error, refetch } = useAutomations();
  const { mutate: createAutomation } = useCreateAutomation();
  // ...
}
```

---

## 💡 Tips

- **Batch Updates:** Update 2-3 pages per day to avoid overwhelming the codebase
- **Test Locally:** Always test that data loads before committing
- **Incremental:** Start with high-priority pages
- **Copy/Paste:** Use the template above to speed up migrations
- **Error Handling:** Always include error boundaries
- **Loading States:** Show meaningful loading indicators

---

## 📊 Progress Tracking

**Total Pages:** ~35 dashboard pages
**Completed:** 6 pages
**Remaining:** 29 pages
**%Completion:** ~17%

**Suggested Timeline:**
- Week 1: 8-10 pages (high priority)
- Week 2: 8-10 pages (medium priority)
- Week 3: Remaining pages + admin section

---

**Last Updated:** 2026-06-06
