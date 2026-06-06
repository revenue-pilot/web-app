export type PlanTier = "starter" | "Revenue" | "pro" | "enterprise";

let globalIdCounter = 0;
export function generateUniqueId(prefix: string): string {
  globalIdCounter++;
  return `${prefix}_${Date.now()}_${globalIdCounter}`;
}

export interface SimulatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  websiteUrl?: string;
  country?: string;
  timezone?: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string;
  passwordHash?: string;
}

export interface SimulatedUserPreference {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  theme: string;
  density: string;
  sidebarMode: string;
  emailProductUpdates: boolean;
  emailBillingAlerts: boolean;
  emailSecurityAlerts: boolean;
  emailMarketing: boolean;
  emailWeeklyReports: boolean;
  inAppActivity: boolean;
  inAppAiUpdates: boolean;
  inAppBillingEvents: boolean;
  inAppSupportUpdates: boolean;
  aiModel: string;
  aiResponseLength: string;
  aiCreativityLevel: number;
  aiDefaultLanguage: string;
}

export interface SimulatedLoginHistory {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  loginTime: string;
}

export interface SimulatedOrganization {
  id: string;
  name: string;
  plan: PlanTier;
  createdAt: Date;
}

export interface SimulatedWorkspace {
  id: string;
  name: string;
  role: string;
  activeCampaigns: number;
  spend: number;
  clientCount: number;
  maxClients: number;
  organizationId: string;
}

export interface SimulatedClient {
  id: string;
  name: string;
  industry: string;
  email: string;
  status: string;
  health: number;
  spend: number;
  conversions: number;
  roas: string;
  organizationId: string;
}

export interface SimulatedCreative {
  id: string;
  name: string;
  type: string;
  size: string;
  tag: string;
  version: string;
  lastModified: string;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  focalPoint: { x: number; y: number } | null;
  detectedFaces: number | null;
  qualityScore: number;
  versions: Array<{ ratio: string; name: string; width: number; height: number; status: string; generatedByAI: boolean }>;
  organizationId: string;
}

export interface SimulatedCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  spend: string;
  roas: string;
  conversions: number;
  impressions: number;
  clicks: number;
  adGroups: any[];
  organizationId: string;
}

class MockDatabaseSimulator {
  public users: SimulatedUser[] = [];
  public organizations: SimulatedOrganization[] = [];
  public workspaces: SimulatedWorkspace[] = [];
  public clients: SimulatedClient[] = [];
  public creatives: SimulatedCreative[] = [];
  public campaigns: SimulatedCampaign[] = [];
  public activityLogs: any[] = [];
  public notifications: any[] = [];
  public invoices: any[] = [];
  public preferences: SimulatedUserPreference[] = [];
  public loginHistories: SimulatedLoginHistory[] = [];
  public apiTokens: any[] = [];

  constructor() {
    // We start completely empty to support "Eradicate Mock Data" and "Empty State System"
  }

  // Auth & User Lifecycle
  public getOrCreateUser(email: string, role: string = "CLIENT"): { user: SimulatedUser; org: SimulatedOrganization } {
    let user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    let org: SimulatedOrganization;

    if (!user) {
      const orgId = generateUniqueId('org');
      const userId = generateUniqueId('user');
      
      let plan: PlanTier = "starter";
      const lowerEmail = email.toLowerCase();
      const localPart = lowerEmail.split('@')[0]; // Only check local part — domain may contain plan keywords (e.g. @Revenuepilot.com)
      if (lowerEmail === "admin@Revenuepilot.com" || localPart.includes("enterprise")) plan = "enterprise";
      else if (localPart.includes("Revenue")) plan = "Revenue";
      else if (localPart.includes("pro")) plan = "pro";

      org = {
        id: orgId,
        name: `${email.split('@')[0]}'s Workspace`,
        plan,
        createdAt: new Date()
      };

      user = {
        id: userId,
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role: email.toLowerCase() === "admin@Revenuepilot.com" ? "ADMIN" : role,
        organizationId: orgId,
        firstName: email.split('@')[0],
        lastName: "",
        phone: "+91 98765 43210",
        jobTitle: email.toLowerCase() === "admin@Revenuepilot.com" ? "System Admin" : "SaaS Operator",
        websiteUrl: "https://Revenuepilot.com",
        country: "India",
        timezone: "Asia/Kolkata",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
        twoFactorEnabled: false,
        twoFactorSecret: "",
        twoFactorRecoveryCodes: "",
        passwordHash: "password_123"
      };

      this.organizations.push(org);
      this.users.push(user);

      // Create a default preference record for the user
      this.preferences.push({
        id: generateUniqueId('pref'),
        userId,
        language: "en",
        timezone: "Asia/Kolkata",
        dateFormat: "YYYY-MM-DD",
        currency: "INR",
        theme: "light",
        density: "comfortable",
        sidebarMode: "expanded",
        emailProductUpdates: true,
        emailBillingAlerts: true,
        emailSecurityAlerts: true,
        emailMarketing: false,
        emailWeeklyReports: true,
        inAppActivity: true,
        inAppAiUpdates: true,
        inAppBillingEvents: true,
        inAppSupportUpdates: true,
        aiModel: "gpt-4o",
        aiResponseLength: "medium",
        aiCreativityLevel: 0.7,
        aiDefaultLanguage: "en"
      });

      // Create a default login history record
      this.loginHistories.push({
        id: generateUniqueId('login'),
        userId,
        device: "MacBook Pro",
        browser: "Chrome",
        ipAddress: "192.168.1.1",
        location: "Mumbai, India",
        loginTime: new Date().toISOString()
      });

      // Create a default workspace record for the user
      this.workspaces.push({
        id: generateUniqueId('space'),
        name: `${email.split('@')[0]} main`,
        role: user.role === "ADMIN" ? "Platform Admin" : "Agency Owner",
        activeCampaigns: 0,
        spend: 0,
        clientCount: 0,
        maxClients: 5,
        organizationId: orgId
      });

      // Log activity
      this.activityLogs.unshift({
        id: generateUniqueId('log'),
        user: user.name,
        action: "Registered Account",
        details: "Dynamic new tenant registration completed.",
        timestamp: "Just now",
        organizationId: orgId
      });
    } else {
      org = this.organizations.find(o => o.id === user.organizationId)!;
    }

    return { user, org };
  }

  // Workspaces CRUD
  public getWorkspaces(orgId: string): SimulatedWorkspace[] {
    return this.workspaces.filter(w => w.organizationId === orgId);
  }

  public createWorkspace(orgId: string, name: string, role: string): SimulatedWorkspace {
    const newWs: SimulatedWorkspace = {
      id: generateUniqueId('space'),
      name,
      role,
      activeCampaigns: 0,
      spend: 0,
      clientCount: 0,
      maxClients: 5,
      organizationId: orgId
    };
    this.workspaces.push(newWs);
    return newWs;
  }

  // Clients CRUD
  public getClients(orgId: string): SimulatedClient[] {
    return this.clients.filter(c => c.organizationId === orgId);
  }

  public createClient(orgId: string, name: string, industry: string, email: string): SimulatedClient {
    const newClient: SimulatedClient = {
      id: generateUniqueId('client'),
      name,
      industry,
      email,
      status: "Onboarding",
      health: 100,
      spend: 0,
      conversions: 0,
      roas: "0x",
      organizationId: orgId
    };
    this.clients.push(newClient);
    return newClient;
  }

  // Creatives CRUD
  public getCreatives(orgId: string): SimulatedCreative[] {
    return this.creatives.filter(c => c.organizationId === orgId);
  }

  public createCreative(orgId: string, name: string, type: string, size: string, tag: string = "Brand Assets"): SimulatedCreative {
    const isImage = type.toLowerCase().includes('image') || name.match(/\.(png|jpg|jpeg|webp)$/i);
    const isVideo = type.toLowerCase().includes('video') || name.match(/\.(mp4|mov)$/i);
    const isLogo = name.toLowerCase().includes('logo') || name.match(/\.(svg)$/i);

    let resolvedType = "Document";
    if (isImage) resolvedType = "Image";
    else if (isVideo) resolvedType = "Video";
    else if (isLogo) resolvedType = "Logo";

    const newAsset: SimulatedCreative = {
      id: generateUniqueId('c'),
      name,
      type: resolvedType,
      size,
      tag,
      version: "v1.0",
      lastModified: new Date().toISOString().split('T')[0],
      width: resolvedType === "Image" ? 1200 : resolvedType === "Video" ? 1920 : null,
      height: resolvedType === "Image" ? 1200 : resolvedType === "Video" ? 1080 : null,
      aspectRatio: resolvedType === "Image" ? "1:1" : resolvedType === "Video" ? "16:9" : null,
      focalPoint: resolvedType === "Image" || resolvedType === "Video" ? { x: 50, y: 50 } : null,
      detectedFaces: resolvedType === "Image" ? 1 : 0,
      qualityScore: 92,
      versions: resolvedType === "Image" ? [
        { ratio: "1:1", name: "Meta Feed (1:1)", width: 1080, height: 1080, status: "READY", generatedByAI: true },
        { ratio: "9:16", name: "Meta Story (9:16)", width: 1080, height: 1920, status: "READY", generatedByAI: true }
      ] : [],
      organizationId: orgId
    };

    this.creatives.unshift(newAsset);
    return newAsset;
  }

  // Campaigns CRUD
  public getCampaigns(orgId: string): SimulatedCampaign[] {
    return this.campaigns.filter(c => c.organizationId === orgId);
  }

  public deployCampaign(orgId: string, name: string, budget: string): SimulatedCampaign {
    const newCamp: SimulatedCampaign = {
      id: generateUniqueId('camp'),
      name,
      platform: "Google Ads",
      status: "Active",
      spend: "₹0.00",
      roas: "0.0x",
      conversions: 0,
      impressions: 0,
      clicks: 0,
      adGroups: [
        { id: generateUniqueId('ag'), name: "Default AI AdGroup", adsCount: 1, keywordsCount: 10, cpa: "₹0.00" }
      ],
      organizationId: orgId
    };
    this.campaigns.unshift(newCamp);

    // Update workspace active campaign count
    const ws = this.workspaces.find(w => w.organizationId === orgId);
    if (ws) ws.activeCampaigns += 1;

    return newCamp;
  }

  // Billing & Subscriptions
  public upgradePlan(orgId: string, plan: PlanTier, amount: number): any {
    const org = this.organizations.find(o => o.id === orgId);
    if (org) {
      org.plan = plan;
      
      const invId = `INV-2026-${Math.floor(Math.random() * 1000)}`;
      const newInvoice = {
        id: invId,
        amount,
        status: "Paid",
        date: new Date().toISOString().split('T')[0],
        method: "Razorpay"
      };
      
      this.invoices.unshift(newInvoice);

      // Log notification
      this.notifications.unshift({
        id: generateUniqueId('n'),
        title: "Billing Upgrade Success",
        message: `Plan upgraded successfully to ${plan} tier. Invoice ${invId} processed.`,
        type: "Success",
        isRead: false,
        time: "Just now"
      });

      return { success: true, plan, invoice: newInvoice };
    }
    return { success: false, message: "Organization not found" };
  }

  public generateRatio(body: { assetId: string; ratio: string }): any {
    const asset = this.creatives.find(c => c.id === body.assetId);
    if (!asset) return { success: false };

    let version = asset.versions.find(v => v.ratio === body.ratio);
    if (!version) {
      let w = 1080;
      let h = 1080;
      if (body.ratio === "9:16") { w = 1080; h = 1920; }
      else if (body.ratio === "16:9") { w = 1920; h = 1080; }
      else if (body.ratio === "1.91:1") { w = 1200; h = 628; }
      else if (body.ratio === "4:1") { w = 1200; h = 300; }
      else if (body.ratio === "4:5") { w = 1080; h = 1350; }

      version = {
        ratio: body.ratio,
        name: `AI Crop (${body.ratio})`,
        width: w,
        height: h,
        status: "READY",
        generatedByAI: true
      };
      asset.versions.push(version);
    }
    return { success: true, asset };
  }

  // Profile, Preferences & Settings Management
  public getUserProfile(email: string): any {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const org = this.organizations.find(o => o.id === user.organizationId);
    const pref = this.preferences.find(p => p.userId === user.id) || {
      language: "en",
      timezone: "Asia/Kolkata",
      dateFormat: "YYYY-MM-DD",
      currency: "INR",
      theme: "light",
      density: "comfortable",
      sidebarMode: "expanded",
      emailProductUpdates: true,
      emailBillingAlerts: true,
      emailSecurityAlerts: true,
      emailMarketing: false,
      emailWeeklyReports: true,
      inAppActivity: true,
      inAppAiUpdates: true,
      inAppBillingEvents: true,
      inAppSupportUpdates: true,
      aiModel: "gpt-4o",
      aiResponseLength: "medium",
      aiCreativityLevel: 0.7,
      aiDefaultLanguage: "en"
    };
    const history = this.loginHistories.filter(lh => lh.userId === user.id);
    return {
      ...user,
      plan: org?.plan || "starter",
      preferences: pref,
      loginHistory: history
    };
  }

  public updateUserProfile(email: string, data: any): SimulatedUser | null {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.jobTitle !== undefined) user.jobTitle = data.jobTitle;
    if (data.websiteUrl !== undefined) user.websiteUrl = data.websiteUrl;
    if (data.country !== undefined) user.country = data.country;
    if (data.timezone !== undefined) user.timezone = data.timezone;
    if (data.name !== undefined) user.name = data.name;
    return user;
  }

  public updateAvatar(email: string, avatarUrl: string): boolean {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.avatarUrl = avatarUrl;
    return true;
  }

  public changePassword(email: string, newHash: string): boolean {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.passwordHash = newHash;
    return true;
  }

  public enable2Fa(email: string, secret: string, recoveryCodes: string): boolean {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    user.twoFactorRecoveryCodes = recoveryCodes;
    return true;
  }

  public disable2Fa(email: string): boolean {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.twoFactorEnabled = false;
    user.twoFactorSecret = "";
    user.twoFactorRecoveryCodes = "";
    return true;
  }

  public updatePreferences(userId: string, data: any): SimulatedUserPreference | null {
    let pref = this.preferences.find(p => p.userId === userId);
    if (!pref) {
      pref = {
        id: generateUniqueId('pref'),
        userId,
        language: "en",
        timezone: "Asia/Kolkata",
        dateFormat: "YYYY-MM-DD",
        currency: "INR",
        theme: "light",
        density: "comfortable",
        sidebarMode: "expanded",
        emailProductUpdates: true,
        emailBillingAlerts: true,
        emailSecurityAlerts: true,
        emailMarketing: false,
        emailWeeklyReports: true,
        inAppActivity: true,
        inAppAiUpdates: true,
        inAppBillingEvents: true,
        inAppSupportUpdates: true,
        aiModel: "gpt-4o",
        aiResponseLength: "medium",
        aiCreativityLevel: 0.7,
        aiDefaultLanguage: "en"
      };
      this.preferences.push(pref);
    }
    Object.assign(pref, data);
    return pref;
  }

  public terminateOtherSessions(userId: string): boolean {
    const history = this.loginHistories.filter(lh => lh.userId === userId);
    if (history.length <= 1) return true;
    history.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
    const latest = history[0];
    this.loginHistories = this.loginHistories.filter(lh => lh.userId !== userId || lh.id === latest.id);
    return true;
  }

  public getApiKeys(orgId: string): any[] {
    return this.apiTokens.filter(t => t.organizationId === orgId);
  }

  public createApiKey(orgId: string, name: string, token: string): any {
    const newKey = {
      id: generateUniqueId('token'),
      organizationId: orgId,
      name,
      token,
      createdAt: new Date().toISOString()
    };
    this.apiTokens.push(newKey);
    return newKey;
  }

  public revokeApiKey(tokenId: string): boolean {
    const originalLength = this.apiTokens.length;
    this.apiTokens = this.apiTokens.filter(t => t.id !== tokenId);
    return this.apiTokens.length < originalLength;
  }

  public deleteUser(email: string): boolean {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    const orgId = user.organizationId;
    this.users = this.users.filter(u => u.id !== user.id);
    this.organizations = this.organizations.filter(o => o.id !== orgId);
    this.workspaces = this.workspaces.filter(w => w.organizationId !== orgId);
    this.clients = this.clients.filter(c => c.organizationId !== orgId);
    this.creatives = this.creatives.filter(c => c.organizationId !== orgId);
    this.campaigns = this.campaigns.filter(c => c.organizationId !== orgId);
    this.preferences = this.preferences.filter(p => p.userId !== user.id);
    this.loginHistories = this.loginHistories.filter(lh => lh.userId !== user.id);
    this.apiTokens = this.apiTokens.filter(t => t.organizationId !== orgId);
    return true;
  }
}

export const mockDb = new MockDatabaseSimulator();
