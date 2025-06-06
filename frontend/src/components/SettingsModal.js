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

  // Handle overlay click to close modal
  const handleOverlayClick = (e) => {
    // Only close if clicking on the overlay, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle close button click
  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  // Proper modal implementation with dark mode and accessibility
  return (
    <div 
      className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex"
      onClick={handleOverlayClick}
    >
      <div className={`relative p-8 w-full max-w-4xl m-auto flex flex-col rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('settings.title')}</h2>
          <button 
            onClick={handleCloseClick}
            className={`p-2 rounded-full transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            title={t('actions.close')}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 pr-4">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            {activeTab === 'appearance' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Theme Selection</h3>
                <div className="grid grid-cols-2 gap-4">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => updateTheme(theme.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.theme === theme.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span className="font-medium">{theme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'layout' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Layout Density</h3>
                <div className="space-y-3">
                  {layoutOptions.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => updateSettings({ ...settings, layoutDensity: layout.id })}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        settings.layoutDensity === layout.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{layout.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{layout.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.autoSave || true}
                      onChange={(e) => updateSettings({ ...settings, autoSave: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>Auto Save</span>
                  </label>
                </div>
              </div>
            )}
            
            {activeTab === 'achievements' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
                <div className="grid gap-4">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${
                        achievement.unlocked ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-gray-500">{achievement.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;