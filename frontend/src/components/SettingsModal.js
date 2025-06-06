import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Palette, Layout, Settings as SettingsIcon, Trophy, 
  Eye, Grid, List, Sidebar, Monitor, Moon, Sun,
  Zap, Star, Target, Award, CheckCircle
} from 'lucide-react';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settings, 
  updateSettings,
  analytics,
  darkMode 
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('appearance');

  // Force re-render when language changes
  useEffect(() => {
    // This effect will trigger a re-render when the language changes
  }, [i18n.language]);

  // Add keyboard support for closing modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Theme Options
  const themes = [
    { 
      id: 'default', 
      name: t('themes.default'), 
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#10b981',
        background: darkMode ? '#111827' : '#f9fafb'
      }
    },
    { 
      id: 'ocean', 
      name: t('themes.ocean'), 
      colors: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        accent: '#06b6d4',
        background: darkMode ? '#0f172a' : '#f0f9ff'
      }
    },
    { 
      id: 'forest', 
      name: t('themes.forest'), 
      colors: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#10b981',
        background: darkMode ? '#064e3b' : '#f0fdf4'
      }
    },
    { 
      id: 'sunset', 
      name: t('themes.sunset'), 
      colors: {
        primary: '#ea580c',
        secondary: '#dc2626',
        accent: '#f59e0b',
        background: darkMode ? '#431407' : '#fff7ed'
      }
    },
    { 
      id: 'purple', 
      name: t('themes.purple'), 
      colors: {
        primary: '#7c3aed',
        secondary: '#6d28d9',
        accent: '#a855f7',
        background: darkMode ? '#3c1b4b' : '#faf5ff'
      }
    },
    { 
      id: 'monochrome', 
      name: t('themes.monochrome'), 
      colors: {
        primary: '#374151',
        secondary: '#4b5563',
        accent: '#6b7280',
        background: darkMode ? '#111827' : '#f9fafb'
      }
    }
  ];

  // Layout Options
  const layoutOptions = [
    { id: 'comfortable', name: t('layout_density.comfortable'), description: t('layout_density.comfortable_desc') },
    { id: 'compact', name: t('layout_density.compact'), description: t('layout_density.compact_desc') },
    { id: 'cozy', name: t('layout_density.cozy'), description: t('layout_density.cozy_desc') }
  ];

  // Achievement System
  const achievements = [
    {
      id: 'first_idea',
      name: t('achievements_list.first_step'),
      description: t('achievements_list.first_step_desc'),
      icon: Target,
      unlocked: analytics.total >= 1,
      progress: Math.min(analytics.total, 1),
      max: 1
    },
    {
      id: 'idea_collector',
      name: t('achievements_list.idea_collector'),
      description: t('achievements_list.idea_collector_desc'),
      icon: Star,
      unlocked: analytics.total >= 10,
      progress: Math.min(analytics.total, 10),
      max: 10
    },
    {
      id: 'idea_master',
      name: t('achievements_list.idea_master'),
      description: t('achievements_list.idea_master_desc'),
      icon: Award,
      unlocked: analytics.total >= 50,
      progress: Math.min(analytics.total, 50),
      max: 50
    },
    {
      id: 'organizer',
      name: t('achievements_list.organizer'),
      description: t('achievements_list.organizer_desc'),
      icon: CheckCircle,
      unlocked: Object.keys(analytics.categoryCounts || {}).length >= 5,
      progress: Object.keys(analytics.categoryCounts || {}).length,
      max: 5
    },
    {
      id: 'weekly_streak',
      name: t('achievements_list.weekly_streak'),
      description: t('achievements_list.weekly_streak_desc'),
      icon: Zap,
      unlocked: analytics.recentIdeas >= 7,
      progress: Math.min(analytics.recentIdeas, 7),
      max: 7
    }
  ];

  const tabs = [
    { id: 'appearance', name: t('settings.tabs.appearance'), icon: Palette },
    { id: 'layout', name: t('settings.tabs.layout'), icon: Layout },
    { id: 'preferences', name: t('settings.tabs.preferences'), icon: SettingsIcon },
    { id: 'achievements', name: t('settings.tabs.achievements'), icon: Trophy }
  ];

  const updateTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      updateSettings({
        ...settings,
        theme: themeId,
        customColors: theme.colors
      });
      
      // Apply CSS custom properties
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.colors.primary);
      root.style.setProperty('--color-secondary', theme.colors.secondary);
      root.style.setProperty('--color-accent', theme.colors.accent);
      root.style.setProperty('--color-background', theme.colors.background);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Close modal when clicking on overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div 
        className={`rounded-lg w-full max-w-4xl h-[80vh] flex ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => {
          // Prevent modal from closing when clicking inside the modal content
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Sidebar */}
        <div className={`w-64 p-6 border-r ${
          darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{t('settings.title')}</h2>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              type="button"
              aria-label="Close settings"
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
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-blue-100 text-blue-700'
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
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.appearance.theme_selection')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => updateTheme(theme.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.theme === theme.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : darkMode 
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span className="font-medium">{theme.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        {Object.values(theme.colors).slice(0, 3).map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.appearance.dark_mode')}</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => updateSettings({ ...settings, darkMode: false })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      !settings.darkMode
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{t('settings.appearance.light')}</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ ...settings, darkMode: true })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      settings.darkMode
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{t('settings.appearance.dark')}</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ 
                      ...settings, 
                      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches 
                    })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      settings.darkMode === window.matchMedia('(prefers-color-scheme: dark)').matches
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>{t('settings.appearance.system')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.layout.layout_density')}</h3>
                <div className="space-y-3">
                  {layoutOptions.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => updateSettings({ ...settings, layoutDensity: layout.id })}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        settings.layoutDensity === layout.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : darkMode 
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{layout.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {layout.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.layout.default_view')}</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateSettings({ ...settings, defaultView: 'card' })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      settings.defaultView === 'card'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>{t('actions.card_view')}</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ ...settings, defaultView: 'list' })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      settings.defaultView === 'list'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>{t('actions.list_view')}</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.layout.sidebar_settings')}</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.sidebarCollapsed || false}
                      onChange={(e) => updateSettings({ 
                        ...settings, 
                        sidebarCollapsed: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>{t('settings.layout.collapse_sidebar')}</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showSidebarIcons || true}
                      onChange={(e) => updateSettings({ 
                        ...settings, 
                        showSidebarIcons: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>{t('settings.layout.show_sidebar_icons')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.preferences.quick_actions')}</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.autoSave || true}
                      onChange={(e) => updateSettings({ 
                        ...settings, 
                        autoSave: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>{t('settings.preferences.auto_save')}</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.confirmDelete || true}
                      onChange={(e) => updateSettings({ 
                        ...settings, 
                        confirmDelete: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>{t('settings.preferences.confirm_delete')}</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showTooltips || true}
                      onChange={(e) => updateSettings({ 
                        ...settings, 
                        showTooltips: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>{t('settings.preferences.show_tooltips')}</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.preferences.ideas_per_page')}</h3>
                <select
                  value={settings.ideasPerPage || 20}
                  onChange={(e) => updateSettings({ 
                    ...settings, 
                    ideasPerPage: parseInt(e.target.value) 
                  })}
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value={10}>10 {t('header.ideas_count', { count: '' }).split(' ')[1]}</option>
                  <option value={20}>20 {t('header.ideas_count', { count: '' }).split(' ')[1]}</option>
                  <option value={50}>50 {t('header.ideas_count', { count: '' }).split(' ')[1]}</option>
                  <option value={100}>100 {t('header.ideas_count', { count: '' }).split(' ')[1]}</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('sidebar.language')}</h3>
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="pt">🇧🇷 Português</option>
                  <option value="it">🇮🇹 Italiano</option>
                  <option value="zh">🇨🇳 中文</option>
                  <option value="ja">🇯🇵 日本語</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.achievements.your_progress')}</h3>
                <div className="grid gap-4">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${
                        achievement.unlocked
                          ? darkMode
                            ? 'border-green-600 bg-green-900/20'
                            : 'border-green-500 bg-green-50'
                          : darkMode
                            ? 'border-gray-600 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <achievement.icon 
                          className={`w-6 h-6 ${
                            achievement.unlocked
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {achievement.description}
                          </div>
                        </div>
                        {achievement.unlocked && (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="mt-2">
                        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2`}>
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              achievement.unlocked
                                ? 'bg-green-600'
                                : 'bg-blue-600'
                            }`}
                            style={{ 
                              width: `${(achievement.progress / achievement.max) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {achievement.progress}/{achievement.max}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-blue-900/20 border border-blue-600' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">
                    {t('settings.achievements.achievement_stats')}
                  </span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  {t('settings.achievements.unlocked', { 
                    count: achievements.filter(a => a.unlocked).length,
                    total: achievements.length 
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;