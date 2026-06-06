# Remaining Dashboard Pages - Quick Update Guide

This document outlines the 16 remaining dashboard pages that need to be converted from mock data to dynamic API data.

## Pages Updated So Far ✅ (13 pages)
1. ✅ dashboard/page.tsx
2. ✅ dashboard/campaigns/page.tsx
3. ✅ dashboard/clients/page.tsx
4. ✅ dashboard/billing/page.tsx
5. ✅ dashboard/team/page.tsx
6. ✅ dashboard/activity/page.tsx
7. ✅ dashboard/notifications/page.tsx
8. ✅ dashboard/integrations/page.tsx
9. ✅ dashboard/reports/page.tsx
10. ✅ dashboard/marketplace/page.tsx
11. ✅ dashboard/workspaces/page.tsx
12. ✅ dashboard/neural-ops/page.tsx
13. ✅ dashboard/pulse-matrix/page.tsx
14. ✅ dashboard/security/page.tsx
15. ✅ dashboard/support/page.tsx

## Remaining Pages to Update (16 pages)

### Priority 1: Core Pages (5 pages)

#### 1. `/dashboard/profile/page.tsx`
**Hook to use:** `useUserProfile()`, `useUpdateProfile()`, `useActiveSessions()`, `useEnableTwoFactor()`, `useDisableTwoFactor()`
**Current state:** Fetches from `/api/user/profile`, uses multiple state variables
**Action:** Replace `useState` with hooks, remove `useEffect` fetch, update profile/password/2FA handlers
**Key fields:** firstName, lastName, phone, email, twoFactorEnabled

```typescript
// Replace imports:
import { useUserProfile, useUpdateProfile, useActiveSessions, useEnableTwoFactor, useDisableTwoFactor } from "@/hooks/useApi";

// Replace state:
const { data: profile, loading: profileLoading, error: profileError, refetch } = useUserProfile();
const { mutate: updateProfile } = useUpdateProfile();
const { data: sessions } = useActiveSessions();
const { mutate: enableTwoFa } = useEnableTwoFactor();

// Replace useEffect and fetchProfile call
```

#### 2. `/dashboard/settings/page.tsx`
**Hook to use:** `useUserProfile()`, `useUpdateProfile()`
**Current state:** Mock settings object, uses `useState`
**Action:** Replace with `useUserProfile()` for fetching, `useUpdateProfile()` for mutations
**Key fields:** language, timezone, theme, emailPreferences

```typescript
import { useUserProfile, useUpdateProfile } from "@/hooks/useApi";

const { data: settings, loading, error, refetch } = useUserProfile();
const { mutate: updateSettings } = useUpdateProfile();

// Remove mock PREFERENCE_DETAILS
// Use settings data instead
```

#### 3. `/dashboard/creative-vault/page.tsx`
**Hook to use:** `useCreatives()`, `useCreateCreative()`, `useGenerateCreativeRatios()`
**Current state:** Complex state management for creatives and uploads
**Action:** Replace manual state with hooks, keep upload/generation logic
**Key fields:** creatives array, uploads

```typescript
import { useCreatives, useCreateCreative, useGenerateCreativeRatios } from "@/hooks/useApi";

const { data: creativesData, loading, error, refetch } = useCreatives();
const { mutate: uploadCreative } = useCreateCreative();
const { mutate: generateRatios } = useGenerateCreativeRatios();

const creatives = Array.isArray(creativesData) ? creativesData : [];
```

#### 4. `/dashboard/ai-chat/page.tsx`
**Hook to use:** Already using `useSendAiMessage()` hook
**Current state:** Already integrated (Just check if needs import fix)
**Action:** Verify imports are correct, ensure hook usage is optimal

#### 5. `/dashboard/campaign-wizard/page.tsx`
**Hook to use:** `useCreateCampaign()`, `useCampaigns()`
**Current state:** Multi-step form with local state
**Action:** Keep form logic, integrate `useCreateCampaign()` mutation for submission
**Key fields:** campaignName, budget, platforms, startDate, endDate

```typescript
import { useCreateCampaign } from "@/hooks/useApi";

const { mutate: createCampaign, loading: creating, error: createError } = useCreateCampaign();

const handleCreate = async (formData) => {
  await createCampaign(formData);
  // Redirect or show success
};
```

---

### Priority 2: Secondary Pages (6 pages)

#### 6. `/dashboard/campaigns/[id]/page.tsx`
**Hook to use:** `useCampaign(id)`, `useUpdateCampaign(id)`
**Current state:** Single campaign detail view with mock data
**Action:** Replace with `useCampaign(id)` hook, use `useUpdateCampaign` for edits

#### 7. `/dashboard/automations/page.tsx`
**Hook to use:** `useAutomations()`, `useCreateAutomation()`, `useUpdateAutomation()`
**Current state:** Mock automations array with toggle handlers
**Action:** Replace state with hooks

#### 8. `/dashboard/growth-lab/page.tsx`
**Hook to use:** Create `useExperiments()` hook if not exists (or use existing AI hooks)
**Current state:** Experiments/tests list
**Action:** Add to apiClient and hooks if missing

#### 9. `/dashboard/health/page.tsx`
**Hook to use:** `useAnalytics()` or create `useHealthMetrics()`
**Current state:** Health/metrics dashboard
**Action:** Use analytics data or create new hook

#### 10. `/dashboard/admin/users/page.tsx`
**Hook to use:** Create `useAdminUsers()` if not exists
**Current state:** Admin users management
**Action:** Add API function and hook

#### 11. `/dashboard/admin/audit/page.tsx`
**Hook to use:** Create `useAuditLogs()` if not exists
**Current state:** Audit trail display
**Action:** Add API function and hook

---

### Priority 3: Lower Priority Pages (5 pages)

#### 12-16. Other admin/secondary pages
- `/dashboard/admin/feature-control/page.tsx` - `useFeatureFlags()`
- `/dashboard/admin/security/page.tsx` - `useSecurityMetrics()`
- `/dashboard/admin/revenue/page.tsx` - `useRevenueAnalytics()`
- `/dashboard/admin/subscriptions/page.tsx` - Use existing billing hooks
- `/dashboard/admin/integrations/page.tsx` - Use `useIntegrations()` with admin filter

---

## Universal Update Template

For each page, follow this pattern:

### Step 1: Update Imports
```typescript
// Add hook imports
import { useYourHook } from "@/hooks/useApi";
```

### Step 2: Replace State
```typescript
// OLD:
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

// NEW:
const { data, loading, error, refetch } = useYourHook();
```

### Step 3: Remove useEffect
```typescript
// Remove entire useEffect block that was fetching data
```

### Step 4: Add Error Handling
```typescript
if (error) {
  return (
    <div className="bg-red-50 p-4 rounded">
      <p className="text-red-600">{error}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

### Step 5: Ensure Data is Array
```typescript
const items = Array.isArray(data) ? data : [];
```

---

## Quick Copy-Paste Code Snippets

### For Each Page Type

**Data Fetching Pages:**
```typescript
import { useYourData } from "@/hooks/useApi";

export default function YourPage() {
  const { data, loading, error, refetch } = useYourData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <ErrorComponent error={error} retry={() => refetch()} />;
  
  const items = Array.isArray(data) ? data : [];
  return (
    <div>
      {items.map(item => <ItemComponent key={item.id} item={item} />)}
    </div>
  );
}
```

**Data Creation Pages:**
```typescript
import { useYourData, useCreateYourData } from "@/hooks/useApi";

export default function CreatePage() {
  const { data, refetch } = useYourData();
  const { mutate: create, loading, error } = useCreateYourData();
  
  const handleSubmit = async (formData) => {
    await create(formData);
    refetch();
  };
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Missing API Functions/Hooks Checklist

These need to be added to `lib/apiClient.ts` and `hooks/useApi.ts` if they don't exist:

- [ ] `useExperiments()` / `getExperiments()`
- [ ] `useHealthMetrics()` / `getHealthMetrics()`
- [ ] `useAdminUsers()` / `getAdminUsers()`
- [ ] `useAuditLogs()` / `getAuditLogs()`
- [ ] `useFeatureFlags()` / `getFeatureFlags()`
- [ ] `useSecurityMetrics()` / `getSecurityMetrics()`
- [ ] `useRevenueAnalytics()` / `getRevenueAnalytics()`

---

## Testing Each Page

After updating each page:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Check Network tab:**
   - DevTools → Network tab
   - Navigate to the page
   - See requests to `/api/...` endpoints

3. **Verify error handling:**
   - Try refreshing with network throttled
   - Ensure error messages show
   - Verify "Retry" button works

4. **Verify loading states:**
   - Page should show "Loading..." initially
   - Data should appear after load
   - No flickering

---

## Expedited Approach (If Urgent)

If you need to finish all remaining pages quickly:

1. **Focus on Priority 1 pages first** (5 pages with complex logic)
2. **For Priority 2 & 3 pages**, use the template and batch update
3. **Use Find/Replace heavily:**
   - Search for `const [data, setData] = useState`
   - Replace patterns systematically

---

## Completion Checklist

Total pages to update: 29
- [ ] 1. activity ✅
- [ ] 2. ai-chat 
- [ ] 3. automations
- [ ] 4. billing ✅
- [ ] 5. campaigns ✅
- [ ] 6. campaigns/[id]
- [ ] 7. campaign-wizard
- [ ] 8. clients ✅
- [ ] 9. creative-vault
- [ ] 10. growth-lab
- [ ] 11. health
- [ ] 12. integrations ✅
- [ ] 13. marketplace ✅
- [ ] 14. neural-ops ✅
- [ ] 15. notifications ✅
- [ ] 16. profile
- [ ] 17. pulse-matrix ✅
- [ ] 18. reports ✅
- [ ] 19. security ✅
- [ ] 20. settings
- [ ] 21. support ✅
- [ ] 22. team ✅
- [ ] 23. workspaces ✅
- [ ] 24. dashboard (main) ✅
- [ ] 25-29. Admin pages

**Progress: 15/29 completed (52%)**

---

**Next Steps:**
1. Update priority 1 pages (profile, settings, creative-vault)
2. Update remaining priority 2 pages
3. Create missing API/hooks as needed
4. Test all pages locally
5. Deploy to production

