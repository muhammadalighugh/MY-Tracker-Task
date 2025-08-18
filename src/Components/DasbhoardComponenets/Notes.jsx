import React, { useState, useEffect, useRef } from 'react';
import { useSidebar } from "../../context/SidebarContext";
import {
  Search,
  Plus,
  Grid,
  List,
  MoreVertical,
  Edit3,
  Trash2,
  Star,
  StarOff,
  Tag,
  Calendar,
  Clock,
  FileText,
  X,
  Save,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  ListIcon,
  Link,
  Code,
  Quote,
  Palette,
  Image,
  Table,
  Minus,
  Type,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Notes = () => {
  // State Management
  const { collapsed } = useSidebar();
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [formattingOptions, setFormattingOptions] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    orderedList: false,
    link: false,
    quote: false,
    code: false
  });
  const [textAlign, setTextAlign] = useState('left');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const contentEditableRef = useRef(null);

  // Categories and Tags
  const categories = ['Work', 'Personal', 'Study', 'Ideas', 'Archive'];
  const allTags = [...new Set(notes.flatMap(note => note.tags))];

  // Filtered and Sorted Notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || note.priority === selectedPriority;
    
    const matchesTab = (() => {
      switch(activeTab) {
        case 'starred': return note.isStarred;
        case 'archived': return note.isArchived;
        case 'bookmarked': return note.isBookmarked;
        default: return !note.isArchived;
      }
    })();

    return matchesSearch && matchesCategory && matchesPriority && matchesTab;
  }).sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    }
    
    if (typeof aValue === 'string') {
      return sortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  // Helper Functions
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // CRUD Operations
  const createNote = () => {
    const newNote = {
      id: Date.now(),
      ...noteForm,
      tags: noteForm.tags.filter(tag => tag.trim()),
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
      isArchived: false,
      isBookmarked: false,
      wordCount: noteForm.content.split(' ').length,
      readingTime: Math.max(1, Math.ceil(noteForm.content.split(' ').length / 200)),
      textColor,
      bgColor,
      textAlign
    };
    
    setNotes([newNote, ...notes]);
    setNoteForm({ title: '', content: '', category: 'Personal', tags: [], priority: 'medium' });
    setTextColor('#000000');
    setBgColor('#ffffff');
    setTextAlign('left');
    setShowCreateModal(false);
  };

  const updateNote = (id, updates) => {
    setNotes(notes.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    setSelectedNote(null);
  };

  const toggleStar = (id) => {
    updateNote(id, { isStarred: !notes.find(n => n.id === id).isStarred });
  };

  const toggleArchive = (id) => {
    updateNote(id, { isArchived: !notes.find(n => n.id === id).isArchived });
  };

  // Bulk Operations
  const handleBulkDelete = () => {
    setNotes(notes.filter(note => !selectedNotes.includes(note.id)));
    setSelectedNotes([]);
    setShowBulkActions(false);
  };

  const handleBulkArchive = () => {
    setNotes(notes.map(note => 
      selectedNotes.includes(note.id) 
        ? { ...note, isArchived: true, updatedAt: new Date() }
        : note
    ));
    setSelectedNotes([]);
    setShowBulkActions(false);
  };

  // Text Formatting Functions
  const applyFormat = (format) => {
    document.execCommand(format, false, null);
    updateFormattingState();
  };

  const insertText = (text) => {
    document.execCommand('insertText', false, text);
  };

  const updateFormattingState = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parentElement = range.commonAncestorContainer.parentElement;

    setFormattingOptions({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      list: parentElement.tagName === 'UL',
      orderedList: parentElement.tagName === 'OL',
      link: parentElement.tagName === 'A',
      quote: parentElement.tagName === 'BLOCKQUOTE',
      code: parentElement.tagName === 'CODE'
    });
  };

  // Create/Edit Note State
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: 'Personal',
    tags: [],
    priority: 'medium'
  });

  // Effect to load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Effect to save notes to localStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
      {/* Main Content */}
      <div className="p-1">
       

        {/* Tabs and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-gray-200">
            <div className="flex space-x-4 mb-4 md:mb-0">
              {[
                { id: 'all', label: 'All Notes', count: notes.filter(n => !n.isArchived).length },
                { id: 'starred', label: 'Starred', count: notes.filter(n => n.isStarred && !n.isArchived).length },
                { id: 'archived', label: 'Archived', count: notes.filter(n => n.isArchived).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 pb-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-fit">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden md:inline">New Note</span>
            </button>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotes.length > 0 && (
            <div className="bg-blue-50 p-3 flex items-center justify-between">
              <span className="text-sm">
                {selectedNotes.length} note{selectedNotes.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkArchive}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                >
                  Archive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedNotes([])}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No notes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating a new note'}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Create your first note
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'space-y-3'
          }>
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group ${
                  selectedNotes.includes(note.id) ? 'ring-2 ring-blue-500' : ''
                } ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}
                onClick={() => setSelectedNote(note)}
                style={{ backgroundColor: note.bgColor || '#ffffff' }}
              >
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  {/* Note Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <input
                          type="checkbox"
                          checked={selectedNotes.includes(note.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedNotes([...selectedNotes, note.id]);
                            } else {
                              setSelectedNotes(selectedNotes.filter(id => id !== note.id));
                            }
                          }}
                          className="rounded"
                        />
                        <h3 className={`font-medium text-sm text-gray-900 truncate`} style={{ color: note.textColor || '#000000' }}>
                          {note.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(note.priority)}`}>
                          {note.priority}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          {note.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(note.id);
                        }}
                        className={`p-1 rounded ${note.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                      >
                        {note.isStarred ? <Star size={16} fill="currentColor" /> : <Star size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Note Content Preview */}
                  {viewMode === 'grid' && (
                    <p 
                      className={`text-sm line-clamp-3 mb-3`}
                      style={{ 
                        color: note.textColor || '#000000',
                        textAlign: note.textAlign || 'left'
                      }}
                      dangerouslySetInnerHTML={{ __html: note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '') }}
                    />
                  )}

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.slice(0, viewMode === 'list' ? 2 : 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > (viewMode === 'list' ? 2 : 3) && (
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                          +{note.tags.length - (viewMode === 'list' ? 2 : 3)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Note Footer */}
                  <div className={`flex items-center justify-between text-xs text-gray-500`}>
                    <span>{getTimeAgo(note.updatedAt)}</span>
                    <div className="flex items-center space-x-3">
                      <span>{note.wordCount} words</span>
                      <span>{note.readingTime} min read</span>
                    </div>
                  </div>
                </div>

                {viewMode === 'list' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNote(note);
                        setTextColor(note.textColor || '#000000');
                        setBgColor(note.bgColor || '#ffffff');
                        setTextAlign(note.textAlign || 'left');
                      }}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchive(note.id);
                      }}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      {note.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="p-2 rounded hover:bg-red-100 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Note Modal */}
      {(showCreateModal || editingNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingNote(null);
                  setNoteForm({ title: '', content: '', category: 'Personal', tags: [], priority: 'medium' });
                  setTextColor('#000000');
                  setBgColor('#ffffff');
                  setTextAlign('left');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingNote ? editingNote.title : noteForm.title}
                    onChange={(e) => {
                      if (editingNote) {
                        setEditingNote({ ...editingNote, title: e.target.value });
                      } else {
                        setNoteForm({ ...noteForm, title: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter note title..."
                  />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Category
                    </label>
                    <select
                      value={editingNote ? editingNote.category : noteForm.category}
                      onChange={(e) => {
                        if (editingNote) {
                          setEditingNote({ ...editingNote, category: e.target.value });
                        } else {
                          setNoteForm({ ...noteForm, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Priority
                    </label>
                    <select
                      value={editingNote ? editingNote.priority : noteForm.priority}
                      onChange={(e) => {
                        if (editingNote) {
                          setEditingNote({ ...editingNote, priority: e.target.value });
                        } else {
                          setNoteForm({ ...noteForm, priority: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingNote ? editingNote.tags.join(', ') : noteForm.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                      if (editingNote) {
                        setEditingNote({ ...editingNote, tags });
                      } else {
                        setNoteForm({ ...noteForm, tags });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="project, important, meeting..."
                  />
                </div>

                {/* Formatting Toolbar */}
                <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => applyFormat('bold')}
                      className={`p-2 rounded ${formattingOptions.bold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => applyFormat('italic')}
                      className={`p-2 rounded ${formattingOptions.italic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => applyFormat('underline')}
                      className={`p-2 rounded ${formattingOptions.underline ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Underline"
                    >
                      <Underline size={16} />
                    </button>
                    
                    <div className="h-6 border-l border-gray-300 mx-1"></div>
                    
                    <button
                      onClick={() => applyFormat('insertUnorderedList')}
                      className={`p-2 rounded ${formattingOptions.list ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Bullet List"
                    >
                      <ListIcon size={16} />
                    </button>
                    <button
                      onClick={() => applyFormat('insertOrderedList')}
                      className={`p-2 rounded ${formattingOptions.orderedList ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Numbered List"
                    >
                      <ListOrdered size={16} />
                    </button>
                    
                    <div className="h-6 border-l border-gray-300 mx-1"></div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                        className="p-2 rounded hover:bg-gray-100 flex items-center gap-1"
                        title="Text Color"
                      >
                        <Type size={16} />
                        <div 
                          className="w-4 h-4 rounded border border-gray-300" 
                          style={{ backgroundColor: textColor }}
                        />
                        <ChevronDown size={14} />
                      </button>
                      {showTextColorPicker && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                          <input 
                            type="color" 
                            value={textColor}
                            onChange={(e) => {
                              setTextColor(e.target.value);
                              document.execCommand('foreColor', false, e.target.value);
                            }}
                            className="w-full"
                          />
                          <div className="grid grid-cols-5 gap-2 mt-2">
                            {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
                              '#ffff00', '#00ffff', '#ff00ff', '#c0c0c0', '#808080'].map(color => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  setTextColor(color);
                                  document.execCommand('foreColor', false, color);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 rounded hover:bg-gray-100 flex items-center gap-1"
                        title="Background Color"
                      >
                        <Palette size={16} />
                        <div 
                          className="w-4 h-4 rounded border border-gray-300" 
                          style={{ backgroundColor: bgColor }}
                        />
                        <ChevronDown size={14} />
                      </button>
                      {showColorPicker && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                          <input 
                            type="color" 
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-full"
                          />
                          <div className="grid grid-cols-5 gap-2 mt-2">
                            {['#ffffff', '#fffacd', '#e6e6fa', '#f5f5dc', '#ffe4e1', 
                              '#f0ffff', '#f5fffa', '#fff0f5', '#f8f8ff', '#fafad2'].map(color => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: color }}
                                onClick={() => setBgColor(color)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="h-6 border-l border-gray-300 mx-1"></div>
                    
                    <button
                      onClick={() => setTextAlign('left')}
                      className={`p-2 rounded ${textAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Align Left"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => setTextAlign('center')}
                      className={`p-2 rounded ${textAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Align Center"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => setTextAlign('right')}
                      className={`p-2 rounded ${textAlign === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Align Right"
                    >
                      <AlignRight size={16} />
                    </button>
                    
                    <div className="h-6 border-l border-gray-300 mx-1"></div>
                    
                    <button
                      onClick={() => insertText('# Heading 1\n\n')}
                      className="p-2 rounded hover:bg-gray-100"
                      title="Heading"
                    >
                      <Type size={16} className="font-bold" />
                    </button>
                    <button
                      onClick={() => insertText('> ')}
                      className={`p-2 rounded ${formattingOptions.quote ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Quote"
                    >
                      <Quote size={16} />
                    </button>
                    <button
                      onClick={() => insertText('`code`')}
                      className={`p-2 rounded ${formattingOptions.code ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Code"
                    >
                      <Code size={16} />
                    </button>
                    <button
                      onClick={() => insertText('---\n')}
                      className="p-2 rounded hover:bg-gray-100"
                      title="Divider"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Content
                  </label>
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    onInput={(e) => {
                      if (editingNote) {
                        setEditingNote({ ...editingNote, content: e.target.innerHTML });
                      } else {
                        setNoteForm({ ...noteForm, content: e.target.innerHTML });
                      }
                      updateFormattingState();
                    }}
                    onBlur={updateFormattingState}
                    onClick={updateFormattingState}
                    onKeyUp={updateFormattingState}
                    style={{
                      minHeight: '300px',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      backgroundColor: bgColor,
                      color: textColor,
                      textAlign: textAlign
                    }}
                    className="w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    dangerouslySetInnerHTML={{
                      __html: editingNote ? editingNote.content : noteForm.content
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {editingNote ? 
                  `${editingNote.content.split(' ').length} words • ${Math.max(1, Math.ceil(editingNote.content.split(' ').length / 200))} min read` :
                  `${noteForm.content.split(' ').length} words • ${Math.max(1, Math.ceil(noteForm.content.split(' ').length / 200))} min read`
                }
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                    setNoteForm({ title: '', content: '', category: 'Personal', tags: [], priority: 'medium' });
                    setTextColor('#000000');
                    setBgColor('#ffffff');
                    setTextAlign('left');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingNote) {
                      updateNote(editingNote.id, {
                        title: editingNote.title,
                        content: editingNote.content,
                        category: editingNote.category,
                        tags: editingNote.tags,
                        priority: editingNote.priority,
                        textColor,
                        bgColor,
                        textAlign,
                        wordCount: editingNote.content.split(' ').length,
                        readingTime: Math.max(1, Math.ceil(editingNote.content.split(' ').length / 200))
                      });
                      setEditingNote(null);
                    } else {
                      createNote();
                    }
                  }}
                  disabled={editingNote ? !editingNote.title.trim() : !noteForm.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
                >
                  {editingNote ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && !editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedNote.title}
                </h2>
                <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(selectedNote.priority)}`}>
                  {selectedNote.priority}
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  {selectedNote.category}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleStar(selectedNote.id)}
                  className={`p-2 rounded-lg ${selectedNote.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                >
                  {selectedNote.isStarred ? <Star size={20} fill="currentColor" /> : <Star size={20} />}
                </button>
                <button
                  onClick={() => {
                    setEditingNote(selectedNote);
                    setTextColor(selectedNote.textColor || '#000000');
                    setBgColor(selectedNote.bgColor || '#ffffff');
                    setTextAlign(selectedNote.textAlign || 'left');
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Copy size={20} />
                </button>
                <button
                  onClick={() => toggleArchive(selectedNote.id)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  {selectedNote.isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => {
                    deleteNote(selectedNote.id);
                    setSelectedNote(null);
                  }}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Created {formatDate(selectedNote.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>Updated {getTimeAgo(selectedNote.updatedAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText size={16} />
                  <span>{selectedNote.wordCount} words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye size={16} />
                  <span>{selectedNote.readingTime} min read</span>
                </div>
              </div>

              {/* Tags */}
              {selectedNote.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div 
                className="prose max-w-none"
                style={{
                  color: selectedNote.textColor || '#000000',
                  backgroundColor: selectedNote.bgColor || '#ffffff',
                  textAlign: selectedNote.textAlign || 'left',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}
                dangerouslySetInnerHTML={{ __html: selectedNote.content }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;