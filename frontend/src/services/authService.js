// Multi-Tenant Authentication Service
class AuthService {
  constructor() {
    this.STORAGE_KEYS = {
      AUTH_TOKEN: 'auth_token',
      CURRENT_USER: 'current_user',
      CURRENT_TENANT: 'current_tenant',
      USER_TENANTS: 'user_tenants',
      TENANT_PERMISSIONS: 'tenant_permissions'
    };
  }

  // User Authentication
  async login(email, password, tenantId = null) {
    try {
      // Simulate API call - replace with actual backend
      const user = await this.authenticateUser(email, password);
      if (user) {
        this.setAuthData(user, tenantId);
        return { success: true, user };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async socialLogin(provider, tenantId = null) {
    try {
      // Implement social login (Google, Microsoft, GitHub)
      const authResult = await this.handleSocialAuth(provider);
      if (authResult.success) {
        this.setAuthData(authResult.user, tenantId);
        return authResult;
      }
      return authResult;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async ssoLogin(ssoToken, tenantId) {
    try {
      // Handle SSO authentication
      const ssoResult = await this.validateSSOToken(ssoToken, tenantId);
      if (ssoResult.success) {
        this.setAuthData(ssoResult.user, tenantId);
        return ssoResult;
      }
      return ssoResult;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      // Register new user
      const result = await this.createUser(userData);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logout() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    window.location.reload();
  }

  // Authentication helpers
  setAuthData(user, tenantId) {
    localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, user.token);
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    
    // Store user tenants
    if (user.tenants) {
      localStorage.setItem(this.STORAGE_KEYS.USER_TENANTS, JSON.stringify(user.tenants));
    }
    
    if (tenantId) {
      this.switchTenant(tenantId);
    } else if (user.tenants && user.tenants.length > 0) {
      this.switchTenant(user.tenants[0].id);
    }
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getCurrentTenant() {
    try {
      const tenantStr = localStorage.getItem(this.STORAGE_KEYS.CURRENT_TENANT);
      return tenantStr ? JSON.parse(tenantStr) : null;
    } catch {
      return null;
    }
  }

  getUserTenants() {
    try {
      const tenantsStr = localStorage.getItem(this.STORAGE_KEYS.USER_TENANTS);
      return tenantsStr ? JSON.parse(tenantsStr) : [];
    } catch {
      return [];
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
  }

  // Tenant Management
  switchTenant(tenantId) {
    const userTenants = this.getUserTenants();
    const tenant = userTenants.find(t => t.id === tenantId);
    
    if (tenant) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_TENANT, JSON.stringify(tenant));
      localStorage.setItem(this.STORAGE_KEYS.TENANT_PERMISSIONS, JSON.stringify(tenant.permissions));
      return true;
    }
    return false;
  }

  // Permission Checking
  hasPermission(permission) {
    try {
      const permissions = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TENANT_PERMISSIONS) || '[]');
      return permissions.includes(permission);
    } catch {
      return false;
    }
  }

  getUserRole() {
    const tenant = this.getCurrentTenant();
    return tenant?.role || 'viewer';
  }

  canAccessTenant(tenantId) {
    const userTenants = this.getUserTenants();
    return userTenants.some(t => t.id === tenantId);
  }

  // Simulated API calls (replace with actual backend)
  async authenticateUser(email, password) {
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@example.com' && password === 'admin123') {
      return {
        id: '1',
        email: 'admin@example.com',
        name: 'Platform Admin',
        role: 'super_admin',
        token: 'mock_token_123',
        tenants: [
          {
            id: 'tenant_1',
            name: 'Tech Corp',
            role: 'tenant_admin',
            permissions: ['create', 'edit', 'delete', 'manage_users', 'manage_tenant']
          },
          {
            id: 'tenant_2', 
            name: 'Creative Agency',
            role: 'manager',
            permissions: ['create', 'edit', 'manage_team']
          }
        ]
      };
    }
    
    throw new Error('Invalid credentials');
  }

  async handleSocialAuth(provider) {
    // Simulate social authentication
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      user: {
        id: '2',
        email: `user@${provider}.com`,
        name: `${provider} User`,
        provider: provider,
        token: `${provider}_token_456`,
        tenants: [
          {
            id: 'tenant_3',
            name: 'Startup Inc',
            role: 'user',
            permissions: ['create', 'edit']
          }
        ]
      }
    };
  }

  async validateSSOToken(ssoToken, tenantId) {
    // Simulate SSO validation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      user: {
        id: '3',
        email: 'sso.user@company.com',
        name: 'SSO User',
        ssoProvider: 'corporate',
        token: ssoToken,
        tenants: [
          {
            id: tenantId,
            name: 'Enterprise Corp',
            role: 'manager',
            permissions: ['create', 'edit', 'manage_team']
          }
        ]
      }
    };
  }

  async createUser(userData) {
    // Simulate user creation
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      user: {
        id: Date.now().toString(),
        ...userData,
        token: `new_user_token_${Date.now()}`,
        tenants: []
      }
    };
  }
}

export default new AuthService();