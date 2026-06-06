# GrowthPilot Dashboard - Dynamic Data Integration Guide

## 📋 Overview

The dashboard has been converted from static mock data to **dynamic data from the NestJS backend API**. This guide explains the new architecture and how to use it.

## 🏗️ Architecture

### New Files Created

#### 1. **`lib/apiClient.ts`** - Centralized API Client
- **Purpose:** Single source of truth for all API requests
- **Features:**
  - Automatic session/auth handling
  - Consistent error handling
  - Request/response formatting
  - Type-safe API calls

#### 2. **`hooks/useApi.ts`** - React Hooks for Data Fetching
- **Purpose:** React hooks for all data fetching operations
- **Features:**
  - `useFetch()` - Generic hook for GET requests
  - `useMutation()` - Generic hook for POST/PATCH/DELETE requests
  - Pre-built hooks for specific resources
  - Built-in caching and error handling

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│     Next.js React Components                │
│  (Dashboard Pages, Components)              │
└────────────────┬────────────────────────────┘
                 │ Uses
                 ▼
┌─────────────────────────────────────────────┐
│     Custom React Hooks                      │
│  (useCampaigns, useBilling, useClients)     │
│  └──> hooks/useApi.ts                       │
└────────────────┬────────────────────────────┘
                 │ Calls
                 ▼
┌─────────────────────────────────────────────┐
│     API Client Functions                    │
│  (getCampaigns, createClient, etc.)         │
│  └──> lib/apiClient.ts                      │
└────────────────┬────────────────────────────┘
                 │ Makes HTTP Requests
                 ▼
┌─────────────────────────────────────────────┐
│     NestJS Backend API                      │
│  (http://localhost:3001)                    │
└─────────────────────────────────────────────┘
```

---

## 🔌 Using the API Infrastructure

### Pattern 1: Fetching Data (Read Operations)

**Old Way (Static Data):**
```typescript
const [data, setData] = useState<any>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  setData(mockData);
  setLoading(false);
}, []);
```

**New Way (Dynamic Data):**
```typescript
import { useCampaigns } from "@/hooks/useApi";

export default function CampaignsPage() {
  const { data, loading, error, refetch } = useCampaigns();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
}
```

### Pattern 2: Mutating Data (Create/Update/Delete)

**Old Way (Local State):**
```typescript
const handleAddClient = () => {
  setClients([...clients, newClient]);
};
```

**New Way (API Call):**
```typescript
import { useCreateClient } from "@/hooks/useApi";

export default function ClientsPage() {
  const { data: clients, refetch } = useClients();
  const { mutate: createClient, loading, error } = useCreateClient();

  const handleAddClient = async (clientData) => {
    try {
      await createClient(clientData);
      refetch(); // Refresh the list
    } catch (err) {
      console.error("Error:", err);
    }
  };
}
```

---

## 📚 Available Hooks

### Query Hooks (Reading Data)

```typescript
// Campaigns
const { data, loading, error, refetch } = useCampaigns(filters?);
const { data, loading, error, refetch } = useCampaign(id);

// Clients
const { data, loading, error, refetch } = useClients();
const { data, loading, error, refetch } = useClient(id);

// Billing
const { data, loading, error, refetch } = useBilling();
const { data, loading, error, refetch } = useInvoices();

// Team
const { data, loading, error, refetch } = useTeamMembers();

// User Profile
const { data, loading, error, refetch } = useUserProfile();
const { data, loading, error, refetch } = useActivityLogs(limit?);
const { data, loading, error, refetch } = useNotifications(limit?);

// Analytics
const { data, loading, error, refetch } = useAnalytics();

// Creatives
const { data, loading, error, refetch } = useCreatives();

// Workspaces
const { data, loading, error, refetch } = useWorkspaces();

// Integrations
const { data, loading, error, refetch } = useIntegrations();
```

### Mutation Hooks (Writing Data)

```typescript
// Campaigns
const { mutate, loading, error } = useCreateCampaign();
const { mutate, loading, error } = useUpdateCampaign(id);

// Clients
const { mutate, loading, error } = useCreateClient();
const { mutate, loading, error } = useUpdateClient(id);

// Team
const { mutate, loading, error } = useInviteTeamMember();

// Profile
const { mutate, loading, error } = useUpdateProfile();

// AI
const { mutate, loading, error } = useSendAiMessage();
const { mutate, loading, error } = useGenerateAiCampaign();

// Billing
const { mutate, loading, error } = useCreateCheckoutSession();

// Reports
const { mutate, loading, error } = useGenerateReport();
```

---

## 🎯 Pages Updated

The following dashboard pages have been converted to use dynamic data:

| Page | Old Approach | New Approach |
|------|-------------|--------------|
| `dashboard/` | Static mock metrics | `useAnalytics()` + `useCampaigns()` |
| `dashboard/campaigns` | Mock campaign list | `useCampaigns()` + `useUpdateCampaign()` |
| `dashboard/clients` | Mock client list | `useClients()` + `useCreateClient()` |
| `dashboard/billing` | Mock subscription data | `useBilling()` + `useInvoices()` + `useCreateCheckoutSession()` |
| `dashboard/team` | Mock team members | `useTeamMembers()` + `useInviteTeamMember()` |
| `dashboard/ai-chat` | Already had API calls | Enhanced with `useSendAiMessage()` |

---

## 📖 How to Update Other Dashboard Pages

### Example: Converting `dashboard/notifications` Page

**Before (Static):**
```typescript
"use client";
import { useState, useEffect } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch mock data
    setNotifications(MOCK_NOTIFICATIONS);
    setLoading(false);
  }, []);

  return (
    <div>
      {loading ? <div>Loading...</div> : 
        notifications.map(n => <div key={n.id}>{n.title}</div>)
      }
    </div>
  );
}
```

**After (Dynamic):**
```typescript
"use client";
import { useNotifications } from "@/hooks/useApi";

export default function NotificationsPage() {
  const { data: notifications, loading, error, refetch } = useNotifications();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const notificationsList = Array.isArray(notifications) ? notifications : [];

  return (
    <div>
      {notificationsList.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
}
```

### Key Changes:
1. Remove `useState` and `useEffect` 
2. Import the appropriate hook: `useNotifications()`
3. Destructure: `{ data, loading, error, refetch }`
4. Use `data` instead of state variable
5. Add error handling

---

## 🔄 Common Patterns

### Pattern: Load Data + Show Error Handling

```typescript
import { useClients } from "@/hooks/useApi";

export default function MyPage() {
  const { data: clients, loading, error, refetch } = useClients();

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded">
        <h3 className="font-bold text-red-900">Error Loading Data</h3>
        <p className="text-red-700">{error}</p>
        <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="py-12 text-center">Loading...</div>;
  }

  const items = Array.isArray(data) ? data : [];
  
  return (
    <div>
      {items.length === 0 ? (
        <div>No items found</div>
      ) : (
        items.map(item => <div key={item.id}>{item.name}</div>)
      )}
    </div>
  );
}
```

### Pattern: Create + Refetch

```typescript
import { useCreateCampaign, useCampaigns } from "@/hooks/useApi";

export default function CreateCampaignPage() {
  const { data: campaigns, refetch } = useCampaigns();
  const { mutate: createCampaign, loading: createLoading, error: createError } = useCreateCampaign();

  const handleCreate = async (formData) => {
    try {
      await createCampaign(formData);
      await refetch(); // Refresh the list
      alert("Campaign created!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleCreate({ name: "New Campaign" });
    }}>
      <button type="submit" disabled={createLoading}>
        {createLoading ? "Creating..." : "Create"}
      </button>
      {createError && <div className="text-red-600">{createError}</div>}
    </form>
  );
}
```

### Pattern: Dependent Queries (Load Campaign Details)

```typescript
import { useCampaign } from "@/hooks/useApi";

export default function CampaignDetailsPage({ id }: { id: string }) {
  const { data: campaign, loading, error } = useCampaign(id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div>
      <h1>{campaign.name}</h1>
      <p>Spend: ₹{campaign.spend}</p>
    </div>
  );
}
```

---

## 🛠️ Adding a New API Endpoint

### Step 1: Add to `lib/apiClient.ts`

```typescript
// New function for fetching user reports
export async function getUserReports() {
  return apiRequest("/api/reports");
}

export async function createReport(data: any) {
  return apiRequest("/api/reports", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
```

### Step 2: Add to `hooks/useApi.ts`

```typescript
// Query hook
export function useReports() {
  return useFetch(() => api.getUserReports(), []);
}

// Mutation hook
export function useCreateReport() {
  return useMutation((data: any) => api.createReport(data));
}
```

### Step 3: Use in Component

```typescript
import { useReports, useCreateReport } from "@/hooks/useApi";

export default function ReportsPage() {
  const { data: reports, loading, error, refetch } = useReports();
  const { mutate: createReport } = useCreateReport();

  // Use as normal
}
```

---

## 🧪 Testing

### Local Testing (Development)

1. **Start Backend:**
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Check Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Perform actions in the dashboard
   - See API calls to `/api/campaigns`, `/api/clients`, etc.

### Debugging API Calls

```typescript
// Add logging in hooks/useApi.ts
const refetch = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    console.log("Fetching:", fetchFn.name);
    const result = await fetchFn();
    console.log("Got result:", result);
    setData(result);
  } catch (err) {
    console.error("Error:", err);
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setLoading(false);
  }
}, [fetchFn]);
```

---

## 🚀 Performance Optimization Tips

### 1. Avoid Unnecessary Re-fetches

```typescript
// ❌ Bad: Refetch on every render
const { data } = useCampaigns();

useEffect(() => {
  refetch(); // Bad!
}, []);

// ✅ Good: Let the hook handle it
const { data } = useCampaigns();
```

### 2. Use Dependencies Correctly

```typescript
// ✅ Good: Only refetch when filters change
const { data } = useCampaigns(filters); // Hook handles dependency

// ❌ Bad: Refetch on every change
useEffect(() => {
  refetch();
}, [filters]); // Avoid this
```

### 3. Combine Multiple Queries When Possible

```typescript
// Instead of: 3 separate API calls
const campaigns = useCampaigns();
const clients = useClients();
const billing = useBilling();

// Consider: Single aggregated endpoint if backend supports it
const { data: dashboard } = useDashboard();
```

---

## 🔐 Error Handling Best Practices

### Example: Comprehensive Error Handling

```typescript
export default function CampaignsPage() {
  const { data, loading, error, refetch } = useCampaigns();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(retryCount + 1);
      refetch();
    }
  };

  if (error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-yellow-800">
              Failed to load campaigns: {error}
            </p>
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm"
            >
              {retryCount >= 3 ? "Max retries reached" : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ... rest of component
}
```

---

## 📊 Remaining Pages to Update

These pages still use partial mock data and can be updated:

- [ ] `dashboard/activity` - Use `useActivityLogs()`
- [ ] `dashboard/automations` - Create `useAutomations()` hook
- [ ] `dashboard/creative-vault` - Use `useCreatives()`
- [ ] `dashboard/integrations` - Use `useIntegrations()`
- [ ] `dashboard/marketplace` - Create `useMarketplaceApps()` hook
- [ ] `dashboard/neural-ops` - Integrate with AI endpoints
- [ ] `dashboard/notifications` - Use `useNotifications()`
- [ ] `dashboard/profile` - Use `useUserProfile()`
- [ ] `dashboard/reports` - Create `useReports()` hook
- [ ] `dashboard/security` - Create `useSecuritySettings()` hook
- [ ] `dashboard/settings` - Use `useUserProfile()` + settings endpoints
- [ ] `dashboard/support` - Create `useSupportTickets()` hook
- [ ] `dashboard/workspaces` - Use `useWorkspaces()`

---

## 🎓 Quick Reference

| Need | Use | Example |
|------|-----|---------|
| Load campaigns | `useCampaigns()` | `const { data } = useCampaigns()` |
| Load single campaign | `useCampaign(id)` | `const { data } = useCampaign("camp_1")` |
| Create campaign | `useCreateCampaign()` | `const { mutate } = useCreateCampaign()` |
| Update campaign | `useUpdateCampaign(id)` | `const { mutate } = useUpdateCampaign(id)` |
| Load clients | `useClients()` | `const { data } = useClients()` |
| Create client | `useCreateClient()` | `const { mutate } = useCreateClient()` |
| Load billing | `useBilling()` | `const { data } = useBilling()` |
| Load team | `useTeamMembers()` | `const { data } = useTeamMembers()` |
| Handle errors | All hooks return `error` | `if (error) { ... }` |
| Retry fetch | Call `refetch()` | `const { refetch } = useData()` |

---

## 🆘 Troubleshooting

### Issue: "API error: 401 Unauthorized"
**Solution:** Check that your session is valid. Ensure NextAuth is configured correctly.

### Issue: "Cannot read property 'map' of undefined"
**Solution:** Always check if data is an array:
```typescript
const items = Array.isArray(data) ? data : [];
items.map(item => ...)
```

### Issue: "Duplicate API calls on mount"
**Solution:** This is React 18 Strict Mode in development. It's normal. Disable if needed:
```typescript
// app/layout.tsx or _app.tsx
<StrictMode>
  <Component />
</StrictMode>
```

### Issue: "Hook data not updating after mutation"
**Solution:** Call `refetch()` after mutation to refresh:
```typescript
const { mutate, loading } = useCreateCampaign();
const { refetch } = useCampaigns();

const handleCreate = async (data) => {
  await mutate(data);
  await refetch(); // Refresh the list
};
```

---

## 📞 Support & Resources

- **API Documentation:** See `/apps/api/src` for NestJS endpoints
- **Hook Implementation:** See `/apps/web/src/hooks/useApi.ts`
- **API Client:** See `/apps/web/src/lib/apiClient.ts`
- **Backend Health Check:** `http://localhost:3001/api/health`

---

**Last Updated:** 2026-06-06
**Status:** ✅ Dashboard pages converted to dynamic data
