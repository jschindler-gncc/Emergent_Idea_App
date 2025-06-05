import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Search, Plus, Tag, Archive, Edit3, Trash2, X, Hash, Calendar, Filter } from 'lucide-react';

// Utility functions for localStorage
const STORAGE_KEY = 'idea-logger-data';

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

// Generate unique ID
const generateId = () => `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Main App Component
function App() {
  const [ideas, setIdeas] = useState(loadIdeas);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [newIdea, setNewIdea] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  // Save ideas to localStorage whenever ideas change
  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

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
  const addIdea = () => {
    if (!newIdea.title.trim()) return;

    const idea = {
      id: generateId(),
      title: newIdea.title.trim(),
      content: newIdea.content.trim(),
      category: newIdea.category,
      tags: newIdea.tags ? newIdea.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIdeas(prev => [idea, ...prev]);
    setNewIdea({ title: '', content: '', category: 'general', tags: '' });
    setIsAddingIdea(false);
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
  };

  // Toggle archive status
  const toggleArchive = (id) => {
    updateIdea(id, { archived: !ideas.find(idea => idea.id === id)?.archived });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">💡 Ideas</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{filteredIdeas.length} ideas</span>
              {showArchived && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Archived</span>}
            </div>
          </div>
          
          <button
            onClick={() => setIsAddingIdea(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Idea</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
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
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
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
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Archive className="w-4 h-4 mr-2" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>

            {/* Popular Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Add New Idea Modal */}
            {isAddingIdea && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Add New Idea</h2>
                    <button
                      onClick={() => setIsAddingIdea(false)}
                      className="text-gray-400 hover:text-gray-600"
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
                      className="w-full text-lg font-medium border-none outline-none placeholder-gray-400"
                      autoFocus
                    />
                    
                    <textarea
                      placeholder="Describe your idea..."
                      value={newIdea.content}
                      onChange={(e) => setNewIdea(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full h-32 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <div className="flex gap-4">
                      <select
                        value={newIdea.category}
                        onChange={(e) => setNewIdea(prev => ({ ...prev, category: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setIsAddingIdea(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addIdea}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Add Idea
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ideas List */}
            <div className="space-y-4">
              {filteredIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Plus className="w-12 h-12 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
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
                filteredIdeas.map(idea => (
                  <div key={idea.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {editingIdea && editingIdea.id === idea.id ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingIdea.title}
                          onChange={(e) => setEditingIdea(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full text-lg font-medium border-none outline-none"
                          autoFocus
                        />
                        
                        <textarea
                          value={editingIdea.content}
                          onChange={(e) => setEditingIdea(prev => ({ ...prev, content: e.target.value }))}
                          className="w-full h-32 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <div className="flex gap-4">
                          <select
                            value={editingIdea.category}
                            onChange={(e) => setEditingIdea(prev => ({ ...prev, category: e.target.value }))}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 flex-1">{idea.title}</h3>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => startEdit(idea)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleArchive(idea.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{idea.content}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {idea.category}
                            </span>
                            
                            {idea.tags && idea.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {idea.tags.map(tag => (
                                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;