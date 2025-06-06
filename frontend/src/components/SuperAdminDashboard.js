import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building, Users, BarChart3, Plus, Edit3, Trash2, X, 
  TrendingUp, Activity, Database, Settings, Eye,
  Calendar, Globe, Crown, Shield, AlertTriangle,
  CheckCircle, Clock, DollarSign, Zap, Target
} from 'lucide-react';
import tenantService from '../services/tenantService';

const SuperAdminDashboard = ({ isOpen, onClose, currentUser, darkMode }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  // Force re-render when language changes
  useEffect(() => {
    // This will ensure the component re-renders when language changes
  }, [i18n.language]);

  // New Tenant Form State
  const [newTenant, setNewTenant] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    plan: 'professional',
    adminEmail: '',
    adminPassword: '',
    settings: {
      maxUsers: 50,
      maxIdeas: 1000,
      storageLimit: '1GB',
      features: {
        allowCrossTenantSharing: true,
        enablePublicMarketplace: true,
        allowTeamChallenges: true,
        enableRealTimeCollaboration: true
      }
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadTenants();
    }
  }, [isOpen]);

  const loadTenants = () => {
    setLoading(true);
    try {
      const allTenants = tenantService.getAllTenants();
      setTenants(allTenants);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Platform Statistics
  const platformStats = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const totalUsers = tenants.reduce((sum, t) => sum + (t.usage?.totalUsers || 0), 0);
    const totalIdeas = tenants.reduce((sum, t) => sum + (t.usage?.totalIdeas || 0), 0);
    const totalRevenue = tenants.reduce((sum, t) => {
      const planPrices = { starter: 0, professional: 29, enterprise: 99 };
      return sum + (planPrices[t.plan] || 0);
    }, 0);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalIdeas,
      totalRevenue,
      avgIdeasPerTenant: totalTenants > 0 ? Math.round(totalIdeas / totalTenants) : 0,
      avgUsersPerTenant: totalTenants > 0 ? Math.round(totalUsers / totalTenants) : 0
    };
  }, [tenants]);

  // Tenant Usage Analytics
  const getTenantAnalytics = (tenant) => {
    const usage = tenant.usage || {};
    const analytics = tenantService.getUsageAnalytics(tenant.id);
    
    return {
      users: usage.totalUsers || 0,
      ideas: usage.totalIdeas || 0,
      activeUsers: usage.activeUsers || 0,
      storageUsed: usage.storageUsed || 0,
      apiCalls: usage.apiCallsThisMonth || 0,
      collaborationEvents: usage.collaborationEvents || 0,
      crossTenantShares: usage.crossTenantShares || 0,
      monthlyGrowth: usage.monthlyGrowth || 0,
      lastActive: usage.lastActive,
      revenue: tenant.plan === 'starter' ? 0 : tenant.plan === 'professional' ? 29 : 99
    };
  };

  const handleCreateTenant = async () => {
    setLoading(true);
    try {
      const result = await tenantService.createTenant(newTenant);
      if (result.success) {
        setTenants(prev => [...prev, result.tenant]);
        setShowCreateTenant(false);
        setNewTenant({
          name: '',
          domain: '',
          industry: '',
          size: '',
          plan: 'professional',
          adminEmail: '',
          adminPassword: '',
          settings: {
            maxUsers: 50,
            maxIdeas: 1000,
            storageLimit: '1GB',
            features: {
              allowCrossTenantSharing: true,
              enablePublicMarketplace: true,
              allowTeamChallenges: true,
              enableRealTimeCollaboration: true
            }
          }
        });
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm(t('superadmin.confirm_delete_tenant'))) {
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', name: t('superadmin.platform_overview'), icon: BarChart3 },
    { id: 'tenants', name: t('superadmin.tenant_management'), icon: Building },
    { id: 'analytics', name: t('superadmin.usage_analytics'), icon: TrendingUp },
    { id: 'settings', name: t('superadmin.platform_settings'), icon: Settings }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[55]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`rounded-lg w-full h-[90vh] flex ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`} 
        style={{ maxWidth: '1400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sidebar */}
        <div className={`w-64 p-6 border-r ${
          darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold">{t('superadmin.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? darkMode 
                      ? 'bg-yellow-900 text-yellow-300' 
                      : 'bg-yellow-100 text-yellow-700'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>

          {/* Platform Stats Summary */}
          <div className={`mt-8 p-4 rounded-lg ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="font-semibold mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2 text-yellow-500" />
              {t('superadmin.quick_stats')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('superadmin.tenants_label')}</span>
                <span className="font-medium">{platformStats.totalTenants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('superadmin.users_label')}</span>
                <span className="font-medium">{platformStats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('superadmin.ideas_label')}</span>
                <span className="font-medium">{platformStats.totalIdeas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('superadmin.revenue_label')}</span>
                <span className="font-medium text-green-600">${platformStats.totalRevenue}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 overflow-y-auto">
            
            {/* Platform Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{t('superadmin.overview.title')}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('superadmin.overview.subtitle')}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`p-6 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.overview.total_tenants')}</p>
                        <p className="text-2xl font-bold text-blue-600">{platformStats.totalTenants}</p>
                      </div>
                      <Building className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600">{t('superadmin.overview.active_tenants', { count: platformStats.activeTenants })}</span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.overview.total_users')}</p>
                        <p className="text-2xl font-bold text-green-600">{platformStats.totalUsers}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('superadmin.overview.avg_per_tenant', { count: platformStats.avgUsersPerTenant })}
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.overview.total_ideas')}</p>
                        <p className="text-2xl font-bold text-purple-600">{platformStats.totalIdeas}</p>
                      </div>
                      <Zap className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('superadmin.overview.avg_per_tenant', { count: platformStats.avgIdeasPerTenant })}
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.overview.monthly_revenue')}</p>
                        <p className="text-2xl font-bold text-yellow-600">${platformStats.totalRevenue}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('superadmin.overview.paying_tenants', { count: platformStats.activeTenants })}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className={`p-6 rounded-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    {t('superadmin.overview.recent_activity')}
                  </h3>
                  <div className="space-y-3">
                    {tenants.slice(0, 5).map(tenant => {
                      const analytics = getTenantAnalytics(tenant);
                      return (
                        <div key={tenant.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <Building className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('superadmin.tenants.users_count', { count: analytics.users })}, {t('superadmin.tenants.ideas_count', { count: analytics.ideas })}
                                {analytics.monthlyGrowth > 0 && (
                                  <span className="ml-2 text-green-600 text-xs">
                                    {t('superadmin.overview.growth_percent', { percent: analytics.monthlyGrowth })}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              tenant.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {t(`superadmin.tenants.${tenant.status}`)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                              {tenant.plan} plan
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Growth Trends */}
                <div className={`p-6 rounded-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {t('superadmin.overview.growth_trends')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.overview.fastest_growing')}</p>
                      {tenants.length > 0 && (() => {
                        const fastestGrowing = tenants.reduce((prev, current) => 
                          (current.usage?.monthlyGrowth || 0) > (prev.usage?.monthlyGrowth || 0) ? current : prev
                        );
                        return (
                          <div className="flex items-center space-x-2 mt-1">
                            <Building className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium">{fastestGrowing.name}</p>
                              <p className="text-sm text-green-600">{t('superadmin.overview.growth_percent', { percent: fastestGrowing.usage?.monthlyGrowth || 0 })}</p>
                            </div>
                          </div>
                        );
                      })()}
                      {tenants.length === 0 && (
                        <p className="text-sm text-gray-400 mt-1">No data available</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.overview.most_active')}</p>
                      {tenants.length > 0 && (() => {
                        const mostActive = tenants.reduce((prev, current) => 
                          (current.usage?.apiCallsThisMonth || 0) > (prev.usage?.apiCallsThisMonth || 0) ? current : prev
                        );
                        return (
                          <div className="flex items-center space-x-2 mt-1">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium">{mostActive.name}</p>
                              <p className="text-sm text-blue-600">{t('superadmin.overview.api_calls', { count: (mostActive.usage?.apiCallsThisMonth || 0).toLocaleString() })}</p>
                            </div>
                          </div>
                        );
                      })()}
                      {tenants.length === 0 && (
                        <p className="text-sm text-gray-400 mt-1">No data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tenant Management */}
            {activeTab === 'tenants' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{t('superadmin.tenants.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('superadmin.tenants.subtitle')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateTenant(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('superadmin.tenants.create_tenant')}</span>
                  </button>
                </div>

                {/* Tenants Table */}
                <div className={`rounded-lg border overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('superadmin.tenants.tenant_name')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('superadmin.tenants.plan')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('superadmin.tenants.users_ideas')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('superadmin.tenants.status')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('superadmin.tenants.created')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('superadmin.tenants.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tenants.map(tenant => {
                          const analytics = getTenantAnalytics(tenant);
                          return (
                            <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Building className="w-5 h-5 text-gray-400 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium">{tenant.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.domain}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tenant.plan === 'enterprise' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                    : tenant.plan === 'professional'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {tenant.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div>{t('superadmin.tenants.users_count', { count: analytics.users })}</div>
                                <div className="text-gray-500 dark:text-gray-400">{t('superadmin.tenants.ideas_count', { count: analytics.ideas })}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  tenant.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {t(`superadmin.tenants.${tenant.status}`)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(tenant.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTenant(tenant);
                                      setShowTenantDetails(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTenant(tenant.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Analytics */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{t('superadmin.analytics.title')}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('superadmin.analytics.subtitle')}
                  </p>
                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tenants.map(tenant => {
                    const analytics = getTenantAnalytics(tenant);
                    return (
                      <div key={tenant.id} className={`p-6 rounded-lg border ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Building className="w-6 h-6 text-blue-600" />
                            <div>
                              <h3 className="font-semibold">{tenant.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{tenant.plan} plan</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tenant.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {tenant.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{analytics.users}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.analytics.total_users')}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{analytics.ideas}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.analytics.total_ideas')}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{analytics.activeUsers}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.analytics.active_users')}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">${analytics.revenue}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('superadmin.analytics.monthly_revenue')}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">{t('superadmin.analytics.api_calls')}</span>
                            <span className="font-medium">{analytics.apiCalls.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500 dark:text-gray-400">{t('superadmin.analytics.collaboration_events')}</span>
                            <span className="font-medium">{analytics.collaborationEvents}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500 dark:text-gray-400">{t('superadmin.analytics.cross_tenant_shares')}</span>
                            <span className="font-medium">{analytics.crossTenantShares}</span>
                          </div>
                          {analytics.lastActive && (
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-gray-500 dark:text-gray-400">{t('superadmin.analytics.last_active')}</span>
                              <span className="font-medium">{new Date(analytics.lastActive).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Platform Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{t('superadmin.settings.title')}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('superadmin.settings.subtitle')}
                  </p>
                </div>

                <div className={`p-6 rounded-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-semibold mb-4">{t('superadmin.settings.coming_soon')}</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('superadmin.settings.coming_soon_desc')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateTenant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateTenant(false);
            }
          }}
        >
          <div 
            className={`rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t('superadmin.create_tenant.title')}</h2>
              <button
                onClick={() => setShowCreateTenant(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.organization_name')}</label>
                  <input
                    type="text"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    placeholder={t('superadmin.create_tenant.organization_name_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.domain')}</label>
                  <input
                    type="text"
                    value={newTenant.domain}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, domain: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    placeholder={t('superadmin.create_tenant.domain_placeholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.industry')}</label>
                  <select
                    value={newTenant.industry}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, industry: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="">{t('superadmin.create_tenant.select_industry')}</option>
                    <option value="technology">{t('superadmin.create_tenant.industries.technology')}</option>
                    <option value="finance">{t('superadmin.create_tenant.industries.finance')}</option>
                    <option value="healthcare">{t('superadmin.create_tenant.industries.healthcare')}</option>
                    <option value="education">{t('superadmin.create_tenant.industries.education')}</option>
                    <option value="retail">{t('superadmin.create_tenant.industries.retail')}</option>
                    <option value="manufacturing">{t('superadmin.create_tenant.industries.manufacturing')}</option>
                    <option value="other">{t('superadmin.create_tenant.industries.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.company_size')}</label>
                  <select
                    value={newTenant.size}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, size: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="">{t('superadmin.create_tenant.select_size')}</option>
                    <option value="startup">{t('superadmin.create_tenant.sizes.startup')}</option>
                    <option value="small">{t('superadmin.create_tenant.sizes.small')}</option>
                    <option value="medium">{t('superadmin.create_tenant.sizes.medium')}</option>
                    <option value="large">{t('superadmin.create_tenant.sizes.large')}</option>
                    <option value="enterprise">{t('superadmin.create_tenant.sizes.enterprise')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.plan')}</label>
                <select
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, plan: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <option value="starter">{t('superadmin.create_tenant.plans.starter')}</option>
                  <option value="professional">{t('superadmin.create_tenant.plans.professional')}</option>
                  <option value="enterprise">{t('superadmin.create_tenant.plans.enterprise')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.admin_email')}</label>
                  <input
                    type="email"
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, adminEmail: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    placeholder={t('superadmin.create_tenant.admin_email_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.admin_password')}</label>
                  <input
                    type="password"
                    value={newTenant.adminPassword}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, adminPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    placeholder={t('superadmin.create_tenant.admin_password_placeholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.max_users')}</label>
                  <input
                    type="number"
                    value={newTenant.settings.maxUsers}
                    onChange={(e) => setNewTenant(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, maxUsers: parseInt(e.target.value) }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.max_ideas')}</label>
                  <input
                    type="number"
                    value={newTenant.settings.maxIdeas}
                    onChange={(e) => setNewTenant(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, maxIdeas: parseInt(e.target.value) }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('superadmin.create_tenant.storage_limit')}</label>
                  <select
                    value={newTenant.settings.storageLimit}
                    onChange={(e) => setNewTenant(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, storageLimit: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="1GB">1GB</option>
                    <option value="5GB">5GB</option>
                    <option value="10GB">10GB</option>
                    <option value="50GB">50GB</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTenant(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t('superadmin.create_tenant.cancel')}
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={loading || !newTenant.name || !newTenant.domain}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? t('superadmin.create_tenant.creating') : t('superadmin.create_tenant.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;