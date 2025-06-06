import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import './i18n'; // Import i18n configuration
import { useTranslation } from 'react-i18next';
import { 
  Search, Plus, Tag, Archive, Edit3, Trash2, X, Hash, Calendar, Filter,
  Moon, Sun, Download, BarChart3, Menu, Grid, List, Settings, Zap,
  CheckSquare, Copy, FileText, Lightbulb, Target, Briefcase, Code,
  Heart, Globe, Smartphone, ChevronDown, ChevronUp, TrendingUp, Languages,
  LogOut, Users, Building, UserPlus, Shield, Crown
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/auth/LoginModal';
import authService from './services/authService';
import tenantService from './services/tenantService';
import collaborationService from './services/collaborationService';

// Utility functions for multi-tenant localStorage
const STORAGE_KEY = 'idea-logger-data';
const SETTINGS_KEY = 'idea-logger-settings';

const getTenantStorageKey = (key, tenantId) => {
  return tenantId ? `${key}_${tenantId}` : key;
};

const loadIdeas = (tenantId = null) => {
  try {
    const storageKey = getTenantStorageKey(STORAGE_KEY, tenantId);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading ideas:', error);
    return [];
  }
};

const saveIdeas = (ideas, tenantId = null) => {
  try {
    const storageKey = getTenantStorageKey(STORAGE_KEY, tenantId);
    localStorage.setItem(storageKey, JSON.stringify(ideas));
    
    // Update tenant usage metrics
    if (tenantId) {
      tenantService.updateUsageMetrics(tenantId, 'totalIdeas', ideas.length);
    }
  } catch (error) {
    console.error('Error saving ideas:', error);
  }
};

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { 
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      theme: 'default',
      layoutDensity: 'comfortable',
      defaultView: 'card',
      sidebarCollapsed: false,
      showSidebarIcons: true,
      autoSave: true,
      confirmDelete: true,
      showTooltips: true,
      ideasPerPage: 20,
      customColors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#10b981',
        background: '#f9fafb'
      }
    };
  } catch (error) {
    return { darkMode: false };
  }
};

const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Generate unique ID
const generateId = () => `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Export utilities
const exportToJSON = (ideas, t) => {
  const dataStr = JSON.stringify(ideas, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `ideas-export-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

const exportToCSV = (ideas, t) => {
  const headers = [t('ideas.title_placeholder'), t('ideas.content_placeholder'), t('sidebar.categories'), t('sidebar.tags'), t('header.archived'), t('dates.created'), t('dates.updated')];
  const csvContent = [
    headers.join(','),
    ...ideas.map(idea => [
      `"${idea.title.replace(/"/g, '""')}"`,
      `"${idea.content.replace(/"/g, '""')}"`,
      idea.category,
      `"${(idea.tags || []).join(', ')}"`,
      idea.archived ? 'Yes' : 'No',
      new Date(idea.createdAt).toLocaleDateString(),
      new Date(idea.updatedAt).toLocaleDateString()
    ].join(','))
  ].join('\n');
  
  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
  const exportFileDefaultName = `ideas-export-${new Date().toISOString().split('T')[0]}.csv`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Main App Component
function App() {
  const { t, i18n } = useTranslation();
  
  // Authentication State - Initialize as not authenticated to show login modal
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  
  // Clear any existing auth tokens for demo purposes
  React.useEffect(() => {
    // Clear auth tokens to ensure clean state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_tenant');
    localStorage.removeItem('user_tenants');
    localStorage.removeItem('tenant_permissions');
  }, []);
  
  // Load tenant-specific ideas
  const [ideas, setIdeas] = useState(() => loadIdeas(currentTenant?.id));
  const [settings, setSettings] = useState(loadSettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTenantSwitcher, setShowTenantSwitcher] = useState(false);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [viewMode, setViewMode] = useState(settings.defaultView || 'card');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  // Idea Templates - Now using translations
  const IDEA_TEMPLATES = [
    {
      id: 'business',
      name: 'templates.business_idea',
      icon: Briefcase,
      template: {
        title: '',
        content: 'template_content.business',
        category: 'business',
        tags: ['business', 'startup']
      }
    },
    {
      id: 'project',
      name: 'templates.project_idea',
      icon: Target,
      template: {
        title: '',
        content: 'template_content.project',
        category: 'general',
        tags: ['project', 'planning']
      }
    },
    {
      id: 'technical',
      name: 'templates.technical_solution',
      icon: Code,
      template: {
        title: '',
        content: 'template_content.technical',
        category: 'technical',
        tags: ['technical', 'development']
      }
    },
    {
      id: 'creative',
      name: 'templates.creative_concept',
      icon: Lightbulb,
      template: {
        title: '',
        content: 'template_content.creative',
        category: 'creative',
        tags: ['creative', 'design']
      }
    },
    {
      id: 'personal',
      name: 'templates.personal_goal',
      icon: Heart,
      template: {
        title: '',
        content: 'template_content.personal',
        category: 'personal',
        tags: ['personal', 'goals']
      }
    }
  ];

  // Authentication Effects
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      const tenant = authService.getCurrentTenant();
      
      setIsAuthenticated(authenticated);
      setCurrentUser(user);
      setCurrentTenant(tenant);
      
      if (!authenticated) {
        setShowLogin(true);
      } else {
        // Load tenant-specific ideas when authentication state changes
        const tenantIdeas = loadIdeas(tenant?.id);
        setIdeas(tenantIdeas);
      }
    };

    checkAuth();
    
    // Listen for auth changes (logout, tenant switch, etc.)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Save ideas to tenant-specific storage
  useEffect(() => {
    if (currentTenant) {
      saveIdeas(ideas, currentTenant.id);
    }
  }, [ideas, currentTenant]);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.classList.toggle('dark', settings.darkMode);
    
    // Apply custom theme colors
    if (settings.customColors) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', settings.customColors.primary);
      root.style.setProperty('--color-secondary', settings.customColors.secondary);
      root.style.setProperty('--color-accent', settings.customColors.accent);
      root.style.setProperty('--color-background', settings.customColors.background);
    }
    
    // Apply layout density
    const body = document.body;
    body.classList.remove('layout-comfortable', 'layout-compact', 'layout-cozy');
    body.classList.add(`layout-${settings.layoutDensity || 'comfortable'}`);
  }, [settings]);

  // Get all categories and tags
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(ideas.map(idea => idea.category))];
    return cats.filter(Boolean);
  }, [ideas]);

  const allTags = useMemo(() => {
    const tags = new Set();
    ideas.forEach(idea => {
      if (idea.tags) {
        idea.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [ideas]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = ideas.length;
    const archived = ideas.filter(idea => idea.archived).length;
    const active = total - archived;
    
    const categoryCounts = ideas.reduce((acc, idea) => {
      acc[idea.category] = (acc[idea.category] || 0) + 1;
      return acc;
    }, {});

    const tagCounts = ideas.reduce((acc, idea) => {
      if (idea.tags) {
        idea.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {});

    const recentIdeas = ideas.filter(idea => {
      const ideaDate = new Date(idea.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return ideaDate > weekAgo;
    }).length;

    return {
      total,
      active,
      archived,
      categoryCounts,
      tagCounts,
      recentIdeas,
      topCategory: Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b, 'general'),
      topTag: Object.keys(tagCounts).reduce((a, b) => 
        tagCounts[a] > tagCounts[b] ? a : b, null)
    };
  }, [ideas]);

  // Filter ideas based on search, category, and archive status
  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      const matchesSearch = !searchTerm || 
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || idea.category === selectedCategory;
      const matchesArchiveStatus = showArchived ? idea.archived : !idea.archived;
      
      return matchesSearch && matchesCategory && matchesArchiveStatus;
    });
  }, [ideas, searchTerm, selectedCategory, showArchived]);

  // Add new idea
  const addIdea = (template = null) => {
    const ideaData = template || newIdea;
    if (!ideaData.title.trim()) return;

    const idea = {
      id: generateId(),
      title: ideaData.title.trim(),
      content: ideaData.content.trim(),
      category: ideaData.category,
      tags: ideaData.tags ? ideaData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIdeas(prev => [idea, ...prev]);
    setNewIdea({ title: '', content: '', category: 'general', tags: '' });
    setIsAddingIdea(false);
    setShowTemplates(false);
  };

  // Add idea from template
  const addFromTemplate = (template) => {
    setNewIdea({
      title: template.title,
      content: t(template.content), // Translate template content
      category: template.category,
      tags: template.tags.join(', ')
    });
    setShowTemplates(false);
    setIsAddingIdea(true);
  };

  // Update idea
  const updateIdea = (id, updates) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === id 
        ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
        : idea
    ));
  };

  // Delete idea
  const deleteIdea = (id) => {
    setIdeas(prev => prev.filter(idea => idea.id !== id));
    setSelectedIdeas(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // Toggle archive status
  const toggleArchive = (id) => {
    updateIdea(id, { archived: !ideas.find(idea => idea.id === id)?.archived });
  };

  // Bulk operations
  const bulkArchive = () => {
    selectedIdeas.forEach(id => toggleArchive(id));
    setSelectedIdeas(new Set());
  };

  const bulkDelete = () => {
    if (window.confirm(t('modals.confirm_delete', { count: selectedIdeas.size }))) {
      selectedIdeas.forEach(id => deleteIdea(id));
      setSelectedIdeas(new Set());
    }
  };

  // Drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Create a copy of filtered ideas to reorder
    const reorderedIdeas = Array.from(filteredIdeas);
    const [movedIdea] = reorderedIdeas.splice(sourceIndex, 1);
    reorderedIdeas.splice(destIndex, 0, movedIdea);

    // Update the main ideas array to reflect the new order
    // We need to maintain non-filtered ideas in their original positions
    const newIdeas = [...ideas];
    
    // Remove all filtered ideas from their current positions
    filteredIdeas.forEach(idea => {
      const index = newIdeas.findIndex(i => i.id === idea.id);
      if (index !== -1) {
        newIdeas.splice(index, 1);
      }
    });

    // Find the position to insert the reordered filtered ideas
    // Insert them at the beginning if no specific position is needed
    reorderedIdeas.forEach((idea, index) => {
      newIdeas.splice(index, 0, idea);
    });

    setIdeas(newIdeas);
  };

  // Start editing
  const startEdit = (idea) => {
    setEditingIdea({
      ...idea,
      tags: idea.tags ? idea.tags.join(', ') : ''
    });
  };

  // Save edit
  const saveEdit = () => {
    if (!editingIdea.title.trim()) return;

    const tags = editingIdea.tags ? editingIdea.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    updateIdea(editingIdea.id, {
      title: editingIdea.title.trim(),
      content: editingIdea.content.trim(),
      category: editingIdea.category,
      tags
    });
    
    setEditingIdea(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingIdea(null);
  };

  // Authentication handlers
  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowLogin(false);
    
    // Handle tenant selection after login
    const userTenants = user.tenants || [];
    
    if (userTenants.length === 0) {
      // No tenants - user can still use the app with limited functionality
      setCurrentTenant(null);
      setIdeas([]);
    } else if (userTenants.length === 1) {
      // Auto-select single tenant
      const tenant = userTenants[0];
      authService.switchTenant(tenant.id);
      setCurrentTenant(tenant);
      const tenantIdeas = loadIdeas(tenant.id);
      setIdeas(tenantIdeas);
    } else {
      // Multiple tenants - show selection modal
      setShowTenantSelection(true);
    }
  };

  const handleTenantSelection = (tenantId) => {
    if (authService.switchTenant(tenantId)) {
      const newTenant = authService.getCurrentTenant();
      setCurrentTenant(newTenant);
      
      // Load ideas for selected tenant
      const tenantIdeas = loadIdeas(tenantId);
      setIdeas(tenantIdeas);
      
      setShowTenantSelection(false);
      
      // Reset UI state
      setSelectedCategory('all');
      setSearchTerm('');
      setShowArchived(false);
      setSelectedIdeas(new Set());
      setBulkMode(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentTenant(null);
    setIdeas([]);
    setShowLogin(true);
  };

  const handleTenantSwitch = (tenantId) => {
    if (authService.switchTenant(tenantId)) {
      const newTenant = authService.getCurrentTenant();
      setCurrentTenant(newTenant);
      
      // Load ideas for new tenant
      const tenantIdeas = loadIdeas(tenantId);
      setIdeas(tenantIdeas);
      
      setShowTenantSwitcher(false);
      
      // Reset UI state
      setSelectedCategory('all');
      setSearchTerm('');
      setShowArchived(false);
      setSelectedIdeas(new Set());
      setBulkMode(false);
    }
  };

  // Permission checking
  const hasPermission = (permission) => {
    if (!currentUser || !currentTenant) return false;
    return authService.hasPermission(permission);
  };

  const canManageUsers = () => hasPermission('user_admin') || hasPermission('tenant_admin');
  const canManageTenant = () => hasPermission('tenant_admin');
  const isAdmin = () => currentUser?.role === 'super_admin' || hasPermission('tenant_admin');

  // Change language
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setShowLanguageMenu(false);
    // Force settings modal to re-render if it's open
    if (showSettings) {
      setShowSettings(false);
      setTimeout(() => setShowSettings(true), 50);
    }
  };

  // Available languages
  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇺🇸' },
    { code: 'es', name: t('languages.es'), flag: '🇪🇸' },
    { code: 'fr', name: t('languages.fr'), flag: '🇫🇷' },
    { code: 'de', name: t('languages.de'), flag: '🇩🇪' },
    { code: 'pt', name: t('languages.pt'), flag: '🇧🇷' },
    { code: 'it', name: t('languages.it'), flag: '🇮🇹' },
    { code: 'zh', name: t('languages.zh'), flag: '🇨🇳' },
    { code: 'ja', name: t('languages.ja'), flag: '🇯🇵' },
  ];

  // Toggle idea selection
  const toggleIdeaSelection = (ideaId) => {
    const newSelected = new Set(selectedIdeas);
    if (newSelected.has(ideaId)) {
      newSelected.delete(ideaId);
    } else {
      newSelected.add(ideaId);
    }
    setSelectedIdeas(newSelected);
  };

  // Update settings function
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const themeClasses = settings.darkMode 
    ? 'dark bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClasses}`}>
      {isAuthenticated ? (
        <>
          {/* Header */}
          <header className={`border-b px-6 py-4 ${settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">💡 {t('app.title')}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('header.ideas_count', { count: filteredIdeas.length })}
              </span>
              {showArchived && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                  {t('header.archived')}
                </span>
              )}
              {bulkMode && selectedIdeas.size > 0 && (
                <span className="text-xs px-2 py-1 rounded text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                  {t('header.selected', { count: selectedIdeas.size })}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Bulk Actions */}
            {bulkMode && selectedIdeas.size > 0 && (
              <div className="flex items-center space-x-2 mr-4">
                <button
                  onClick={bulkArchive}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {t('actions.archive_selected')}
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                >
                  {t('actions.delete_selected')}
                </button>
              </div>
            )}

            {/* View Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title={t('tooltips.card_view')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title={t('tooltips.list_view')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`p-2 rounded-lg transition-colors ${bulkMode ? 'text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              style={bulkMode ? { backgroundColor: 'var(--color-primary)' } : {}}
              title={t('tooltips.bulk_select')}
            >
              <CheckSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('tooltips.analytics')}
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t('sidebar.language')}
              >
                <Languages className="w-5 h-5" />
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                  <div className="p-2">
                    <h3 className="font-semibold mb-2 px-2">{t('sidebar.language')}</h3>
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                          i18n.language === lang.code ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => updateSettings({ ...settings, darkMode: !settings.darkMode })}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('tooltips.dark_mode')}
            >
              {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('tooltips.settings')}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={currentUser?.name || 'User menu'}
              >
                <Users className="w-5 h-5" />
                {currentUser && (
                  <span className="hidden sm:inline text-sm">{currentUser.name}</span>
                )}
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                  <div className="p-2">
                    {currentUser && (
                      <div className="px-3 py-2 border-b dark:border-gray-700">
                        <p className="font-semibold">{currentUser.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                        {currentTenant && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{currentTenant.name}</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                style={{ 
                  backgroundColor: 'var(--color-accent)',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'color-mix(in srgb, var(--color-accent) 90%, black)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-accent)'}
                title={t('tooltips.templates')}
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">{t('header.templates')}</span>
              </button>
              
              {showTemplates && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">{t('templates.quick_start')}</h3>
                    <div className="space-y-2">
                      {IDEA_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => addFromTemplate(template.template)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                        >
                          <template.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span>{t(template.name)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddingIdea(true)}
              className="text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                ':hover': { backgroundColor: 'var(--color-secondary)' }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.new_idea')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 transition-all duration-200 overflow-hidden`}>
          <div className={`w-64 p-6 space-y-6 border-r h-screen overflow-y-auto ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('sidebar.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>

            {/* Export Options */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                {t('sidebar.export')}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => exportToJSON(ideas, t)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('sidebar.export_json')}
                </button>
                <button
                  onClick={() => exportToCSV(ideas, t)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('sidebar.export_csv')}
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                {t('sidebar.categories')}
              </h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category === 'all' ? t('sidebar.all_ideas') : t(`categories.${category}`, category)}
                  </button>
                ))}
              </div>
            </div>

            {/* Archive Toggle */}
            <div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                  showArchived
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Archive className="w-4 h-4 mr-2" />
                {showArchived ? t('sidebar.hide_archived') : t('sidebar.show_archived')}
              </button>
            </div>

            {/* Popular Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  {t('sidebar.tags')}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 15).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Analytics Panel */}
          {showAnalytics && (
            <div className={`mb-6 p-6 rounded-lg border ${settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {t('analytics.title')}
                </h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{analytics.total}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.total_ideas')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{analytics.active}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.active')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.archived}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.archived')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>{analytics.recentIdeas}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.this_week')}</div>
                </div>
              </div>
              
              {analytics.topCategory && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.most_popular_category')} <span className="font-semibold">{t(`categories.${analytics.topCategory}`, analytics.topCategory)}</span>
                  {analytics.topTag && (
                    <span> • {t('analytics.top_tag')} <span className="font-semibold">#{analytics.topTag}</span></span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add New Idea Modal */}
          {isAddingIdea && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-lg p-6 w-full max-w-2xl ${settings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{t('modals.add_new_idea')}</h2>
                  <button
                    onClick={() => setIsAddingIdea(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={t('ideas.title_placeholder')}
                    value={newIdea.title}
                    onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full text-lg font-medium border-none outline-none placeholder-gray-400 ${
                      settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                    autoFocus
                  />
                  
                  <textarea
                    placeholder={t('ideas.content_placeholder')}
                    value={newIdea.content}
                    onChange={(e) => setNewIdea(prev => ({ ...prev, content: e.target.value }))}
                    className={`w-full h-32 border rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      settings.darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  
                  <div className="flex gap-4">
                    <select
                      value={newIdea.category}
                      onChange={(e) => setNewIdea(prev => ({ ...prev, category: e.target.value }))}
                      className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        settings.darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      <option value="general">{t('categories.general')}</option>
                      <option value="business">{t('categories.business')}</option>
                      <option value="personal">{t('categories.personal')}</option>
                      <option value="creative">{t('categories.creative')}</option>
                      <option value="technical">{t('categories.technical')}</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder={t('ideas.tags_placeholder')}
                      value={newIdea.tags}
                      onChange={(e) => setNewIdea(prev => ({ ...prev, tags: e.target.value }))}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        settings.darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsAddingIdea(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    onClick={() => addIdea()}
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
                  >
                    {t('actions.add_idea')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ideas List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="ideas">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={viewMode === 'list' ? 'space-y-2' : 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}
                >
                  {filteredIdeas.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Plus className="w-12 h-12 mx-auto mb-4" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {searchTerm ? t('ideas.no_search_results') : t('ideas.no_ideas_title')}
                      </h3>
                      <p className="text-gray-400 mb-4">
                        {searchTerm 
                          ? t('ideas.search_help')
                          : t('ideas.no_ideas_subtitle')
                        }
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setIsAddingIdea(true)}
                          className="text-white px-4 py-2 rounded-lg transition-colors"
                          style={{ 
                            backgroundColor: 'var(--color-primary)',
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
                        >
                          {t('ideas.add_first_idea')}
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredIdeas.map((idea, index) => (
                      <Draggable key={idea.id} draggableId={idea.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${
                              settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            } rounded-lg border p-6 hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg rotate-2 z-50' : ''
                            } ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              userSelect: 'none',
                            }}
                          >
                            {editingIdea && editingIdea.id === idea.id ? (
                              /* Edit Mode */
                              <div className="space-y-4 flex-1">
                                <input
                                  type="text"
                                  value={editingIdea.title}
                                  onChange={(e) => setEditingIdea(prev => ({ ...prev, title: e.target.value }))}
                                  className={`w-full text-lg font-medium border-none outline-none ${
                                    settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                                  }`}
                                  autoFocus
                                />
                                
                                <textarea
                                  value={editingIdea.content}
                                  onChange={(e) => setEditingIdea(prev => ({ ...prev, content: e.target.value }))}
                                  className={`w-full h-32 border rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    settings.darkMode 
                                      ? 'bg-gray-700 border-gray-600 text-white' 
                                      : 'bg-white border-gray-200 text-gray-900'
                                  }`}
                                />
                                
                                <div className="flex gap-4">
                                  <select
                                    value={editingIdea.category}
                                    onChange={(e) => setEditingIdea(prev => ({ ...prev, category: e.target.value }))}
                                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                      settings.darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                                  >
                                    <option value="general">{t('categories.general')}</option>
                                    <option value="business">{t('categories.business')}</option>
                                    <option value="personal">{t('categories.personal')}</option>
                                    <option value="creative">{t('categories.creative')}</option>
                                    <option value="technical">{t('categories.technical')}</option>
                                  </select>
                                  
                                  <input
                                    type="text"
                                    placeholder={t('ideas.tags_placeholder')}
                                    value={editingIdea.tags}
                                    onChange={(e) => setEditingIdea(prev => ({ ...prev, tags: e.target.value }))}
                                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                      settings.darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                                  />
                                </div>
                                
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                  >
                                    {t('actions.cancel')}
                                  </button>
                                  <button
                                    onClick={saveEdit}
                                    className="px-4 py-2 text-white rounded-lg transition-colors"
                                    style={{ 
                                      backgroundColor: 'var(--color-primary)',
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
                                  >
                                    {t('actions.save')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <>
                                {bulkMode && (
                                  <div className="flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={selectedIdeas.has(idea.id)}
                                      onChange={() => toggleIdeaSelection(idea.id)}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-semibold flex-1">{idea.title}</h3>
                                    <div className="flex items-center space-x-2 ml-4">
                                      <button
                                        onClick={() => startEdit(idea)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title={t('actions.edit')}
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => toggleArchive(idea.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title={idea.archived ? t('actions.unarchive') : t('actions.archive')}
                                      >
                                        <Archive className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteIdea(idea.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title={t('actions.delete')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {idea.content && (
                                    <p className={`mb-4 whitespace-pre-wrap ${viewMode === 'list' ? 'text-sm' : ''} ${
                                      settings.darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      {viewMode === 'list' && idea.content.length > 100 
                                        ? `${idea.content.substring(0, 100)}...` 
                                        : idea.content
                                      }
                                    </p>
                                  )}
                                  
                                  <div className={`flex items-center ${viewMode === 'list' ? 'space-x-4' : 'justify-between'}`}>
                                    <div className="flex items-center space-x-4">
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        settings.darkMode 
                                          ? 'bg-gray-700 text-gray-300' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {t(`categories.${idea.category}`, idea.category)}
                                      </span>
                                      
                                      {idea.tags && idea.tags.length > 0 && (
                                        <div className="flex items-center space-x-1">
                                          {idea.tags.slice(0, viewMode === 'list' ? 2 : 5).map(tag => (
                                            <span key={tag} className={`text-xs px-2 py-1 rounded flex items-center text-white`}
                                              style={{ backgroundColor: 'var(--color-accent)' }}>
                                              <Hash className="w-3 h-3 mr-1" />
                                              {tag}
                                            </span>
                                          ))}
                                          {idea.tags.length > (viewMode === 'list' ? 2 : 5) && (
                                            <span className="text-xs text-gray-400">+{idea.tags.length - (viewMode === 'list' ? 2 : 5)} more</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {viewMode !== 'list' && (
                                      <div className="flex items-center text-xs text-gray-400">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(idea.createdAt).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">💡 {t('app.title')}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{t('app.subtitle')}</p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal
        key={i18n.language} // Force re-render when language changes
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        updateSettings={updateSettings}
        analytics={analytics}
        darkMode={settings.darkMode}
      />
    </div>
  );
}

export default App;