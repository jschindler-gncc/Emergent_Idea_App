import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Mail, Lock, Eye, EyeOff, User, Building, 
  Chrome, Github, Briefcase, AlertCircle, CheckCircle,
  Loader2, UserPlus, LogIn, Shield
} from 'lucide-react';
import authService from '../../services/authService';
import tenantService from '../../services/tenantService';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Registration Form State
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: 'user',
    agreeToTerms: false
  });

  // Tenant Registration State
  const [tenantForm, setTenantForm] = useState({
    tenantName: '',
    domain: '',
    industry: '',
    size: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'professional'
  });

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(
        loginForm.email, 
        loginForm.password
      );

      if (result.success) {
        setSuccess('Login successful!');
        setTimeout(() => {
          onLoginSuccess(result.user);
          onClose();
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');

    try {
      const result = await authService.socialLogin(provider, loginForm.tenantId);
      
      if (result.success) {
        setSuccess(`${provider} login successful!`);
        setTimeout(() => {
          onLoginSuccess(result.user);
          onClose();
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`${provider} login failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!registerForm.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.register({
        name: `${registerForm.firstName} ${registerForm.lastName}`,
        email: registerForm.email,
        password: registerForm.password,
        company: registerForm.company,
        role: registerForm.role
      });

      if (result.success) {
        setSuccess('Registration successful! Please check your email for verification.');
        setTimeout(() => {
          setActiveTab('login');
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create tenant
      const tenantResult = await tenantService.createTenant({
        name: tenantForm.tenantName,
        domain: tenantForm.domain,
        industry: tenantForm.industry,
        size: tenantForm.size,
        plan: tenantForm.plan
      });

      if (tenantResult.success) {
        // Register admin user
        const userResult = await authService.register({
          name: 'Tenant Admin',
          email: tenantForm.adminEmail,
          password: tenantForm.adminPassword,
          tenantId: tenantResult.tenant.id,
          role: 'tenant_admin'
        });

        if (userResult.success) {
          setSuccess('Tenant created successfully! Please log in with your admin credentials.');
          setTimeout(() => {
            setActiveTab('login');
            setSuccess('');
          }, 2000);
        } else {
          setError(userResult.error);
        }
      } else {
        setError(tenantResult.error);
      }
    } catch (err) {
      setError('Tenant registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableTenants = tenantService.getAllTenants();

  const tabs = [
    { id: 'login', name: 'Sign In', icon: LogIn },
    { id: 'register', name: 'Sign Up', icon: UserPlus },
    { id: 'tenant', name: 'Create Organization', icon: Building }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">💡 Ideas Platform</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="m-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="m-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Login Tab */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Tenant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization (Optional)
                  </label>
                  <select
                    value={loginForm.tenantId}
                    onChange={(e) => setLoginForm({ ...loginForm, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Organization</option>
                    {availableTenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={loginForm.rememberMe}
                    onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4" />
                  <span>Google</span>
                </button>
                
                <button
                  onClick={() => handleSocialLogin('github')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </button>
              </div>

              {/* Demo Credentials */}
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Demo Credentials:</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Email: admin@example.com<br />
                  Password: admin123
                </p>
              </div>
            </div>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="First name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={registerForm.company}
                  onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Your company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Create password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={registerForm.agreeToTerms}
                  onChange={(e) => setRegisterForm({ ...registerForm, agreeToTerms: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tenant Registration Tab */}
          {activeTab === 'tenant' && (
            <form onSubmit={handleTenantRegistration} className="space-y-4">
              <div className="text-center mb-4">
                <Building className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Create Your Organization</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set up a new workspace for your team
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={tenantForm.tenantName}
                  onChange={(e) => setTenantForm({ ...tenantForm, tenantName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Your organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  required
                  value={tenantForm.domain}
                  onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="your-company"
                />
                <p className="text-xs text-gray-500 mt-1">This will be your workspace URL</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Industry
                  </label>
                  <select
                    value={tenantForm.industry}
                    onChange={(e) => setTenantForm({ ...tenantForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Industry</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Size
                  </label>
                  <select
                    value={tenantForm.size}
                    onChange={(e) => setTenantForm({ ...tenantForm, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Size</option>
                    <option value="startup">1-10 employees</option>
                    <option value="small">11-50 employees</option>
                    <option value="medium">51-200 employees</option>
                    <option value="large">201-1000 employees</option>
                    <option value="enterprise">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={tenantForm.adminEmail}
                  onChange={(e) => setTenantForm({ ...tenantForm, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="admin@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={tenantForm.adminPassword}
                  onChange={(e) => setTenantForm({ ...tenantForm, adminPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Create admin password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan
                </label>
                <select
                  value={tenantForm.plan}
                  onChange={(e) => setTenantForm({ ...tenantForm, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="starter">Starter (Free)</option>
                  <option value="professional">Professional ($29/month)</option>
                  <option value="enterprise">Enterprise ($99/month)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Organization...</span>
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4" />
                    <span>Create Organization</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;