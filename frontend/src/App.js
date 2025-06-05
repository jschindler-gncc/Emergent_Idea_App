import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import './i18n'; // Import i18n configuration
import { useTranslation } from 'react-i18next';
import { 
  Search, Plus, Tag, Archive, Edit3, Trash2, X, Hash, Calendar, Filter,
  Moon, Sun, Download, BarChart3, Menu, Grid, List, Settings, Zap,
  CheckSquare, Copy, FileText, Lightbulb, Target, Briefcase, Code,
  Heart, Globe, Smartphone, ChevronDown, ChevronUp, TrendingUp, Languages
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Utility functions for localStorage
const STORAGE_KEY = 'idea-logger-data';
const SETTINGS_KEY = 'idea-logger-settings';

const loadIdeas = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading ideas:', error);
    return [];
  }
};

const saveIdeas = (ideas) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch (error) {
    console.error('Error saving ideas:', error);
  }
};

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches };
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

// Idea Templates
const IDEA_TEMPLATES = [
  {
    id: 'business',
    name: 'Business Idea',
    icon: Briefcase,
    template: {
      title: '',
      content: 'Problem:\n\nSolution:\n\nTarget Market:\n\nRevenue Model:\n\nNext Steps:',
      category: 'business',
      tags: ['business', 'startup']
    }
  },
  {
    id: 'project',
    name: 'Project Idea',
    icon: Target,
    template: {
      title: '',
      content: 'Objective:\n\nScope:\n\nRequirements:\n\nTimeline:\n\nResources Needed:',
      category: 'general',
      tags: ['project', 'planning']
    }
  },
  {
    id: 'technical',
    name: 'Technical Solution',
    icon: Code,
    template: {
      title: '',
      content: 'Problem Statement:\n\nProposed Solution:\n\nTechnology Stack:\n\nImplementation Steps:\n\nPotential Challenges:',
      category: 'technical',
      tags: ['technical', 'development']
    }
  },
  {
    id: 'creative',
    name: 'Creative Concept',
    icon: Lightbulb,
    template: {
      title: '',
      content: 'Concept:\n\nInspiration:\n\nTarget Audience:\n\nExecution Ideas:\n\nResources Needed:',
      category: 'creative',
      tags: ['creative', 'design']
    }
  },
  {
    id: 'personal',
    name: 'Personal Goal',
    icon: Heart,
    template: {
      title: '',
      content: 'Goal:\n\nWhy this matters:\n\nAction Steps:\n\nSuccess Metrics:\n\nDeadline:',
      category: 'personal',
      tags: ['personal', 'goals']
    }
  }
];

// Export utilities
const exportToJSON = (ideas) => {
  const dataStr = JSON.stringify(ideas, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `ideas-export-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

const exportToCSV = (ideas) => {
  const headers = ['Title', 'Content', 'Category', 'Tags', 'Archived', 'Created Date', 'Updated Date'];
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
  const [ideas, setIdeas] = useState(loadIdeas);
  const [settings, setSettings] = useState(loadSettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  // Save ideas and settings to localStorage
  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.classList.toggle('dark', settings.darkMode);
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
      content: template.content,
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
    if (window.confirm(`Delete ${selectedIdeas.size} selected ideas?`)) {
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

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

  const themeClasses = settings.darkMode 
    ? 'dark bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClasses}`}>
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
            <h1 className="text-2xl font-bold">💡 Ideas</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{filteredIdeas.length} ideas</span>
              {showArchived && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                  Archived
                </span>
              )}
              {bulkMode && selectedIdeas.size > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {selectedIdeas.size} selected
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
                  Archive Selected
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            )}

            {/* View Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Card View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`p-2 rounded-lg transition-colors ${bulkMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Bulk Select"
            >
              <CheckSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </button>
              
              {showTemplates && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">Quick Start Templates</h3>
                    <div className="space-y-2">
                      {IDEA_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => addFromTemplate(template.template)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                        >
                          <template.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span>{template.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddingIdea(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Idea</span>
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
                placeholder="Search ideas..."
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
                Export
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => exportToJSON(ideas)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => exportToCSV(ideas)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as CSV
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Categories
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
                    {category === 'all' ? 'All Ideas' : category}
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
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>

            {/* Popular Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Tags
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
                  Analytics
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
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.total}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Ideas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.active}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.archived}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Archived</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.recentIdeas}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
                </div>
              </div>
              
              {analytics.topCategory && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Most popular category: <span className="font-semibold">{analytics.topCategory}</span>
                  {analytics.topTag && (
                    <span> • Top tag: <span className="font-semibold">#{analytics.topTag}</span></span>
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
                  <h2 className="text-lg font-semibold">Add New Idea</h2>
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
                    placeholder="Idea title..."
                    value={newIdea.title}
                    onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full text-lg font-medium border-none outline-none placeholder-gray-400 ${
                      settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                    autoFocus
                  />
                  
                  <textarea
                    placeholder="Describe your idea..."
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
                      <option value="general">General</option>
                      <option value="business">Business</option>
                      <option value="personal">Personal</option>
                      <option value="creative">Creative</option>
                      <option value="technical">Technical</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
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
                    Cancel
                  </button>
                  <button
                    onClick={() => addIdea()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add Idea
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
                        {searchTerm ? 'No ideas found' : 'No ideas yet'}
                      </h3>
                      <p className="text-gray-400 mb-4">
                        {searchTerm 
                          ? 'Try adjusting your search or filters'
                          : 'Start capturing your brilliant ideas!'
                        }
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setIsAddingIdea(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Add Your First Idea
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
                                    <option value="general">General</option>
                                    <option value="business">Business</option>
                                    <option value="personal">Personal</option>
                                    <option value="creative">Creative</option>
                                    <option value="technical">Technical</option>
                                  </select>
                                  
                                  <input
                                    type="text"
                                    placeholder="Tags (comma separated)"
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
                                    Cancel
                                  </button>
                                  <button
                                    onClick={saveEdit}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                  >
                                    Save
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
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => toggleArchive(idea.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                      >
                                        <Archive className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteIdea(idea.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                                        {idea.category}
                                      </span>
                                      
                                      {idea.tags && idea.tags.length > 0 && (
                                        <div className="flex items-center space-x-1">
                                          {idea.tags.slice(0, viewMode === 'list' ? 2 : 5).map(tag => (
                                            <span key={tag} className={`text-xs px-2 py-1 rounded flex items-center ${
                                              settings.darkMode 
                                                ? 'bg-blue-900 text-blue-300' 
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
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
    </div>
  );
}

export default App;