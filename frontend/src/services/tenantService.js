// Multi-Tenant Management Service
class TenantService {
  constructor() {
    this.STORAGE_KEYS = {
      TENANTS: 'platform_tenants',
      TENANT_SETTINGS: 'tenant_settings',
      TENANT_USERS: 'tenant_users',
      TENANT_PARTNERSHIPS: 'tenant_partnerships',
      USAGE_ANALYTICS: 'usage_analytics'
    };
  }

  // Tenant CRUD Operations
  async createTenant(tenantData) {
    try {
      const tenants = this.getAllTenants();
      const newTenant = {
        id: `tenant_${Date.now()}`,
        ...tenantData,
        createdAt: new Date().toISOString(),
        settings: this.getDefaultTenantSettings(),
        usage: this.getDefaultUsageMetrics(),
        status: 'active'
      };

      tenants.push(newTenant);
      this.saveTenants(tenants);
      
      return { success: true, tenant: newTenant };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateTenant(tenantId, updates) {
    try {
      const tenants = this.getAllTenants();
      const tenantIndex = tenants.findIndex(t => t.id === tenantId);
      
      if (tenantIndex === -1) {
        throw new Error('Tenant not found');
      }

      tenants[tenantIndex] = {
        ...tenants[tenantIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveTenants(tenants);
      return { success: true, tenant: tenants[tenantIndex] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTenant(tenantId) {
    const tenants = this.getAllTenants();
    return tenants.find(t => t.id === tenantId) || null;
  }

  getAllTenants() {
    try {
      const tenants = localStorage.getItem(this.STORAGE_KEYS.TENANTS);
      return tenants ? JSON.parse(tenants) : this.getDefaultTenants();
    } catch {
      return this.getDefaultTenants();
    }
  }

  saveTenants(tenants) {
    localStorage.setItem(this.STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
  }

  // Tenant Settings Management
  getTenantSettings(tenantId) {
    const tenant = this.getTenant(tenantId);
    return tenant?.settings || this.getDefaultTenantSettings();
  }

  async updateTenantSettings(tenantId, settings) {
    return this.updateTenant(tenantId, { settings });
  }

  getDefaultTenantSettings() {
    return {
      branding: {
        name: '',
        logo: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        accentColor: '#10b981',
        customTheme: 'default'
      },
      features: {
        allowCrossTenantSharing: true,
        enablePublicMarketplace: true,
        allowTeamChallenges: true,
        enableRealTimeCollaboration: true,
        allowComments: true,
        enableVersionHistory: true
      },
      limits: {
        maxUsers: 50,
        maxIdeas: 1000,
        maxTeams: 10,
        storageLimit: '1GB',
        apiCallsPerMonth: 10000
      },
      security: {
        requireMFA: false,
        allowSSOOnly: false,
        dataRetentionDays: 365,
        enableAuditLog: true,
        allowExternalSharing: true
      },
      notifications: {
        emailNotifications: true,
        inAppNotifications: true,
        weeklyReports: true,
        usageAlerts: true
      }
    };
  }

  // User Management within Tenant
  async inviteUser(tenantId, userEmail, role, permissions = []) {
    try {
      const invitation = {
        id: `invite_${Date.now()}`,
        tenantId,
        email: userEmail,
        role,
        permissions,
        status: 'pending',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Store invitation (in real app, send email)
      const invitations = this.getPendingInvitations();
      invitations.push(invitation);
      localStorage.setItem('pending_invitations', JSON.stringify(invitations));

      return { success: true, invitation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getPendingInvitations() {
    try {
      const invitations = localStorage.getItem('pending_invitations');
      return invitations ? JSON.parse(invitations) : [];
    } catch {
      return [];
    }
  }

  async acceptInvitation(invitationId, userId) {
    try {
      const invitations = this.getPendingInvitations();
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      if (!invitation || invitation.status !== 'pending') {
        throw new Error('Invalid invitation');
      }

      // Add user to tenant
      const tenantUsers = this.getTenantUsers(invitation.tenantId);
      tenantUsers.push({
        userId,
        role: invitation.role,
        permissions: invitation.permissions,
        joinedAt: new Date().toISOString()
      });

      this.saveTenantUsers(invitation.tenantId, tenantUsers);

      // Mark invitation as accepted
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date().toISOString();
      localStorage.setItem('pending_invitations', JSON.stringify(invitations));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTenantUsers(tenantId) {
    try {
      const key = `${this.STORAGE_KEYS.TENANT_USERS}_${tenantId}`;
      const users = localStorage.getItem(key);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  saveTenantUsers(tenantId, users) {
    const key = `${this.STORAGE_KEYS.TENANT_USERS}_${tenantId}`;
    localStorage.setItem(key, JSON.stringify(users));
  }

  // Cross-Tenant Partnership Management
  async createPartnership(fromTenantId, toTenantId, partnershipType, terms) {
    try {
      const partnership = {
        id: `partnership_${Date.now()}`,
        fromTenantId,
        toTenantId,
        type: partnershipType, // 'public', 'private', 'marketplace', 'consortium'
        terms,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const partnerships = this.getAllPartnerships();
      partnerships.push(partnership);
      this.savePartnerships(partnerships);

      return { success: true, partnership };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getAllPartnerships() {
    try {
      const partnerships = localStorage.getItem(this.STORAGE_KEYS.TENANT_PARTNERSHIPS);
      return partnerships ? JSON.parse(partnerships) : [];
    } catch {
      return [];
    }
  }

  savePartnerships(partnerships) {
    localStorage.setItem(this.STORAGE_KEYS.TENANT_PARTNERSHIPS, JSON.stringify(partnerships));
  }

  getTenantPartnerships(tenantId) {
    const partnerships = this.getAllPartnerships();
    return partnerships.filter(p => 
      p.fromTenantId === tenantId || p.toTenantId === tenantId
    );
  }

  // Usage Analytics
  updateUsageMetrics(tenantId, metric, value) {
    const analytics = this.getUsageAnalytics();
    
    if (!analytics[tenantId]) {
      analytics[tenantId] = this.getDefaultUsageMetrics();
    }

    analytics[tenantId][metric] = value;
    analytics[tenantId].lastUpdated = new Date().toISOString();
    
    localStorage.setItem(this.STORAGE_KEYS.USAGE_ANALYTICS, JSON.stringify(analytics));
  }

  getUsageAnalytics(tenantId = null) {
    try {
      const analytics = localStorage.getItem(this.STORAGE_KEYS.USAGE_ANALYTICS);
      const parsed = analytics ? JSON.parse(analytics) : {};
      
      if (tenantId) {
        return parsed[tenantId] || this.getDefaultUsageMetrics();
      }
      
      return parsed;
    } catch {
      return tenantId ? this.getDefaultUsageMetrics() : {};
    }
  }

  getDefaultUsageMetrics() {
    return {
      totalIdeas: 0,
      activeUsers: 0,
      totalUsers: 0,
      storageUsed: 0,
      apiCallsThisMonth: 0,
      collaborationEvents: 0,
      crossTenantShares: 0,
      lastActive: new Date().toISOString(),
      monthlyGrowth: 0
    };
  }

  // Default Demo Tenants
  getDefaultTenants() {
    return [
      {
        id: 'tenant_1',
        name: 'Tech Innovations Corp',
        domain: 'tech-innovations',
        industry: 'Technology',
        size: 'Enterprise',
        plan: 'Premium',
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
        settings: this.getDefaultTenantSettings(),
        usage: { ...this.getDefaultUsageMetrics(), totalUsers: 25, totalIdeas: 150 }
      },
      {
        id: 'tenant_2',
        name: 'Creative Studios LLC',
        domain: 'creative-studios',
        industry: 'Design & Creative',
        size: 'Medium',
        plan: 'Professional',
        status: 'active',
        createdAt: '2024-02-01T00:00:00Z',
        settings: this.getDefaultTenantSettings(),
        usage: { ...this.getDefaultUsageMetrics(), totalUsers: 12, totalIdeas: 89 }
      },
      {
        id: 'tenant_3',
        name: 'Global Consulting Group',
        domain: 'global-consulting',
        industry: 'Consulting',
        size: 'Enterprise',
        plan: 'Enterprise',
        status: 'active',
        createdAt: '2024-01-20T00:00:00Z',
        settings: this.getDefaultTenantSettings(),
        usage: { ...this.getDefaultUsageMetrics(), totalUsers: 45, totalIdeas: 275 }
      }
    ];
  }

  // Role and Permission Management
  getRolePermissions(role) {
    const permissions = {
      super_admin: [
        'platform_admin', 'tenant_admin', 'user_admin', 'system_config',
        'view_all_tenants', 'manage_partnerships', 'platform_analytics'
      ],
      tenant_admin: [
        'tenant_admin', 'user_admin', 'team_admin', 'settings_admin',
        'invite_users', 'manage_partnerships', 'view_analytics', 'manage_billing'
      ],
      manager: [
        'team_admin', 'create_ideas', 'edit_ideas', 'delete_own_ideas',
        'manage_team', 'view_team_analytics', 'create_challenges'
      ],
      user: [
        'create_ideas', 'edit_own_ideas', 'delete_own_ideas', 'comment',
        'participate_challenges', 'share_ideas'
      ],
      viewer: [
        'view_ideas', 'comment', 'export_own_data'
      ]
    };

    return permissions[role] || permissions.viewer;
  }

  hasPermission(userRole, permission) {
    const rolePermissions = this.getRolePermissions(userRole);
    return rolePermissions.includes(permission);
  }
}

export default new TenantService();