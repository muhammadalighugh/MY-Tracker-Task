import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, ArrowUp, ArrowDown, Trash2, Edit, Eye, ExternalLink, Globe, Settings, Palette, Layout, Type, Image as ImageIcon, Layers, Move, Copy, Download, Upload } from 'lucide-react';

// Enhanced link types with more social platforms and services
const linkTypes = [
  { id: 'website', name: 'Website', icon: Globe, placeholder: 'https://your-website.com' },
  { id: 'linkedin', name: 'LinkedIn', icon: ExternalLink, placeholder: 'https://linkedin.com/in/username' },
  { id: 'twitter', name: 'Twitter/X', icon: ExternalLink, placeholder: 'https://twitter.com/username' },
  { id: 'instagram', name: 'Instagram', icon: ExternalLink, placeholder: 'https://instagram.com/username' },
  { id: 'facebook', name: 'Facebook', icon: ExternalLink, placeholder: 'https://facebook.com/username' },
  { id: 'github', name: 'GitHub', icon: ExternalLink, placeholder: 'https://github.com/username' },
  { id: 'youtube', name: 'YouTube', icon: ExternalLink, placeholder: 'https://youtube.com/@username' },
  { id: 'tiktok', name: 'TikTok', icon: ExternalLink, placeholder: 'https://tiktok.com/@username' },
  { id: 'email', name: 'Email', icon: ExternalLink, placeholder: 'mailto:your@email.com' },
  { id: 'phone', name: 'Phone', icon: ExternalLink, placeholder: 'tel:+1234567890' },
  { id: 'whatsapp', name: 'WhatsApp', icon: ExternalLink, placeholder: 'https://wa.me/1234567890' },
  { id: 'telegram', name: 'Telegram', icon: ExternalLink, placeholder: 'https://t.me/username' },
  { id: 'discord', name: 'Discord', icon: ExternalLink, placeholder: 'https://discord.gg/invite' },
  { id: 'twitch', name: 'Twitch', icon: ExternalLink, placeholder: 'https://twitch.tv/username' },
  { id: 'custom', name: 'Custom Link', icon: ExternalLink, placeholder: 'https://your-custom-link.com' }
];

// Enhanced banner options
const banners = [
  { id: 'none', name: 'None', class: 'bg-transparent' },
  { id: 'gradient-blue', name: 'Blue Gradient', class: 'bg-gradient-to-r from-blue-500 to-purple-600' },
  { id: 'gradient-sunset', name: 'Sunset', class: 'bg-gradient-to-r from-orange-400 to-pink-500' },
  { id: 'gradient-ocean', name: 'Ocean', class: 'bg-gradient-to-r from-cyan-400 to-blue-500' },
  { id: 'gradient-forest', name: 'Forest', class: 'bg-gradient-to-r from-green-400 to-teal-500' },
  { id: 'gradient-purple', name: 'Purple', class: 'bg-gradient-to-r from-purple-500 to-indigo-600' },
  { id: 'gradient-warm', name: 'Warm', class: 'bg-gradient-to-r from-amber-400 to-orange-500' },
  { id: 'solid-black', name: 'Black', class: 'bg-black' },
  { id: 'solid-white', name: 'White', class: 'bg-white border border-gray-200' },
  { id: 'solid-gray', name: 'Gray', class: 'bg-gray-500' }
];

// Card templates with complete configurations
const cardTemplates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design',
    config: {
      template: 'modern',
      cardWidthPx: 384,
      cardHeightPx: 0,
      cardBorderRadius: 16,
      showBanner: true,
      banner: 'gradient-blue',
      bannerHeight: 128,
      bannerOpacity: 1,
      bannerBorderRadius: 0,
      profileOnBanner: true,
      profilePosition: 'center',
      profileShape: 'circle',
      contentBgType: 'color',
      contentBgColor: '#FFFFFF',
      contentOpacity: 1,
      layout: 'centered',
      textColors: { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
      background: { color: '#F3F4F6', image: null, opacity: 1 }
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean design',
    config: {
      template: 'minimal',
      cardWidthPx: 320,
      cardHeightPx: 0,
      cardBorderRadius: 8,
      showBanner: false,
      profileOnBanner: false,
      profilePosition: 'center',
      profileShape: 'circle',
      contentBgType: 'color',
      contentBgColor: '#FFFFFF',
      contentOpacity: 1,
      layout: 'centered',
      textColors: { name: '#000000', title: '#666666', company: '#888888', bio: '#666666' },
      background: { color: '#FFFFFF', image: null, opacity: 1 }
    }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and artistic design',
    config: {
      template: 'creative',
      cardWidthPx: 400,
      cardHeightPx: 0,
      cardBorderRadius: 24,
      showBanner: true,
      banner: 'gradient-sunset',
      bannerHeight: 160,
      bannerOpacity: 0.9,
      bannerBorderRadius: 0,
      profileOnBanner: true,
      profilePosition: 'left',
      profileShape: 'square',
      contentBgType: 'transparent',
      contentOpacity: 0.95,
      layout: 'creative',
      textColors: { name: '#1F2937', title: '#F59E0B', company: '#8B5CF6', bio: '#374151' },
      background: { color: '#F9FAFB', image: null, opacity: 1 }
    }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional business style',
    config: {
      template: 'corporate',
      cardWidthPx: 360,
      cardHeightPx: 0,
      cardBorderRadius: 12,
      showBanner: true,
      banner: 'solid-black',
      bannerHeight: 100,
      bannerOpacity: 1,
      bannerBorderRadius: 0,
      profileOnBanner: true,
      profilePosition: 'center',
      profileShape: 'circle',
      contentBgType: 'color',
      contentBgColor: '#FFFFFF',
      contentOpacity: 1,
      layout: 'corporate',
      textColors: { name: '#1F2937', title: '#374151', company: '#6B7280', bio: '#4B5563' },
      background: { color: '#F8FAFC', image: null, opacity: 1 }
    }
  }
];

// Utility function for hex to rgba conversion
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Enhanced card rendering function
const renderCard = (cardData, isPreview = false) => {
  const {
    name = '',
    title = '',
    company = '',
    bio = '',
    profileImage,
    showBanner = true,
    banner = 'gradient-blue',
    bannerImage,
    bannerHeight = 128,
    bannerOpacity = 1,
    bannerBorderRadius = 0,
    cardBackgroundImage,
    cardBackgroundMode = 'whole',
    cardBackgroundOpacity = 1,
    textColors = {},
    links = [],
    cardWidthPx = 384,
    cardHeightPx = 0,
    cardBorderRadius = 16,
    profileOnBanner = true,
    profilePosition = 'center',
    profileShape = 'circle',
    contentBgType = 'color',
    contentBgColor = '#FFFFFF',
    contentOpacity = 1,
    layout = 'centered'
  } = cardData;

  const bannerConfig = banners.find(b => b.id === banner);
  const profileSize = showBanner && profileOnBanner ? 'w-24 h-24' : 'w-20 h-20';
  const profileClasses = `${profileSize} object-cover border-4 border-white shadow-lg ${
    profileShape === 'circle' ? 'rounded-full' : 
    profileShape === 'square' ? 'rounded-lg' : 'rounded-xl'
  }`;

  const cardStyle = {
    width: `${cardWidthPx}px`,
    height: cardHeightPx > 0 ? `${cardHeightPx}px` : 'auto',
    borderRadius: `${cardBorderRadius}px`,
    background: cardBackgroundMode === 'whole' && cardBackgroundImage 
      ? `url(${cardBackgroundImage})` 
      : cardBackgroundMode === 'whole' && contentBgType === 'color'
      ? contentBgColor
      : 'transparent',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: cardBackgroundMode === 'whole' ? cardBackgroundOpacity : 1
  };

  const contentStyle = {
    background: cardBackgroundMode === 'content' && cardBackgroundImage 
      ? `url(${cardBackgroundImage})` 
      : cardBackgroundMode === 'content' || (cardBackgroundMode === 'none' && contentBgType === 'color')
      ? hexToRgba(contentBgColor, contentOpacity)
      : 'transparent',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: showBanner ? `0 0 ${cardBorderRadius}px ${cardBorderRadius}px` : `${cardBorderRadius}px`
  };

  const bannerStyle = {
    height: `${bannerHeight}px`,
    background: bannerImage 
      ? `url(${bannerImage})` 
      : bannerConfig 
      ? undefined 
      : 'linear-gradient(to right, #3B82F6, #8B5CF6)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: bannerOpacity,
    borderRadius: `${cardBorderRadius}px ${cardBorderRadius}px ${bannerBorderRadius}px ${bannerBorderRadius}px`
  };

  const getProfilePosition = () => {
    if (!showBanner || !profileOnBanner) return 'justify-center';
    switch (profilePosition) {
      case 'left': return 'justify-start pl-6';
      case 'right': return 'justify-end pr-6';
      default: return 'justify-center';
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'creative': return 'text-left';
      case 'corporate': return 'text-center';
      default: return 'text-center';
    }
  };

  return (
    <div className="card-container shadow-xl" style={cardStyle}>
      {showBanner && (
        <div 
          className={`relative ${bannerConfig?.class || ''} flex items-end ${getProfilePosition()}`}
          style={bannerStyle}
        >
          {profileImage && profileOnBanner && (
            <div className="relative -mb-12 z-10">
              <img src={profileImage} alt={name} className={profileClasses} />
            </div>
          )}
        </div>
      )}
      
      <div className="p-6" style={contentStyle}>
        {profileImage && (!showBanner || !profileOnBanner) && (
          <div className="flex justify-center mb-4">
            <img src={profileImage} alt={name} className={profileClasses} />
          </div>
        )}
        
        <div className={`${showBanner && profileOnBanner ? 'mt-14' : 'mt-0'} ${getLayoutClasses()}`}>
          {name && (
            <h1 className="text-2xl font-bold mb-2" style={{ color: textColors.name || '#111827' }}>
              {name}
            </h1>
          )}
          {title && (
            <p className="text-lg font-medium mb-1" style={{ color: textColors.title || '#374151' }}>
              {title}
            </p>
          )}
          {company && (
            <p className="text-base mb-4" style={{ color: textColors.company || '#6B7280' }}>
              {company}
            </p>
          )}
          {bio && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: textColors.bio || '#4B5563' }}>
              {bio.split('\\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < bio.split('\\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          )}
          
          {links.length > 0 && (
            <div className="space-y-3">
              {links.map((link) => {
                const linkType = linkTypes.find(lt => lt.id === link.type);
                const IconComp = linkType?.icon || Globe;
                
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    style={{
                      backgroundColor: link.color || '#3B82F6',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (link.hoverColor) {
                        e.target.style.backgroundColor = link.hoverColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = link.color || '#3B82F6';
                    }}
                  >
                    <IconComp size={20} />
                    <span className="font-medium">{link.label || linkType?.name || 'Link'}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function CreateCard({ cards = [], setCards }) {
  const defaultFormData = {
    name: '',
    title: '',
    company: '',
    bio: '',
    profileImage: null,
    showBanner: true,
    banner: 'gradient-blue',
    bannerImage: null,
    bannerHeight: 128,
    bannerOpacity: 1,
    bannerBorderRadius: 0,
    cardBackgroundImage: null,
    cardBackgroundMode: 'whole',
    cardBackgroundOpacity: 1,
    template: 'modern',
    textColors: { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
    links: [],
    background: { color: '#F3F4F6', image: null, opacity: 1 },
    cardWidthPx: 384,
    cardHeightPx: 0,
    cardBorderRadius: 16,
    profileOnBanner: true,
    profilePosition: 'center',
    profileShape: 'circle',
    contentBgType: 'color',
    contentBgColor: '#FFFFFF',
    contentOpacity: 1,
    layout: 'centered',
    customCSS: '',
    animations: {
      enabled: false,
      hoverEffect: 'scale',
      transitionDuration: 200
    },
    accessibility: {
      altText: '',
      ariaLabel: '',
      highContrast: false
    }
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const bannerImageRef = useRef(null);
  const cardBackgroundImageRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const importConfigRef = useRef(null);

  // Load template from memory on mount
  useEffect(() => {
    const selectedTemplate = sessionStorage.getItem('selectedTemplate');
    if (selectedTemplate) {
      try {
        const templateConfig = JSON.parse(selectedTemplate);
        setFormData(prev => ({
          ...prev,
          ...templateConfig,
          name: '',
          title: '',
          company: '',
          bio: '',
          profileImage: null,
          bannerImage: null,
          cardBackgroundImage: null,
          background: { ...prev.background, image: null },
          links: []
        }));
        sessionStorage.removeItem('selectedTemplate');
      } catch (e) {
        console.error('Failed to parse selectedTemplate:', e);
      }
    }
  }, []);

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.cardWidthPx < 200 || formData.cardWidthPx > 800) {
      newErrors.cardWidth = 'Width must be between 200-800px';
    }
    
    if (formData.cardHeightPx < 0 || formData.cardHeightPx > 1200) {
      newErrors.cardHeight = 'Height must be between 0-1200px';
    }

    formData.links.forEach((link, index) => {
      if (link.label && !link.url) {
        newErrors[`link_${index}_url`] = 'URL is required when label is provided';
      }
      if (link.url && !link.label) {
        newErrors[`link_${index}_label`] = 'Label is required when URL is provided';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Generic input change handler
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setIsDirty(true);
      return newData;
    });
  }, []);

  // Nested object update handlers
  const handleBackgroundChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      background: { ...prev.background, [field]: value }
    }));
    setIsDirty(true);
  }, []);

  const handleTextColorChange = useCallback((type, color) => {
    setFormData(prev => ({
      ...prev,
      textColors: { ...prev.textColors, [type]: color }
    }));
    setIsDirty(true);
  }, []);

  const handleAnimationChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      animations: { ...prev.animations, [field]: value }
    }));
    setIsDirty(true);
  }, []);

  const handleAccessibilityChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, [field]: value }
    }));
    setIsDirty(true);
  }, []);

  // Enhanced image upload handler
  const handleImageUpload = useCallback((event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let additional = {};
      if (type === 'bannerImage') {
        additional.banner = '';
      }
      
      if (type === 'background.image') {
        setFormData(prev => ({
          ...prev,
          background: { ...prev.background, image: e.target.result },
          ...additional
        }));
      } else {
        setFormData(prev => ({ ...prev, [type]: e.target.result, ...additional }));
      }
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Link management functions
  const addLink = useCallback(() => {
    const newLink = {
      id: Date.now().toString(),
      type: 'website',
      label: '',
      url: '',
      clicks: 0,
      color: '#3B82F6',
      hoverColor: '#2563EB',
      displayMode: 'both',
      isActive: true,
      order: formData.links.length
    };
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }));
    setIsDirty(true);
  }, [formData.links.length]);

  const updateLink = useCallback((linkId, field, value) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === linkId ? { ...link, [field]: value } : link
      )
    }));
    setIsDirty(true);
  }, []);

  const removeLink = useCallback((linkId) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
    setIsDirty(true);
  }, []);

  const moveLink = useCallback((linkId, direction) => {
    setFormData(prev => {
      const links = [...prev.links];
      const index = links.findIndex(l => l.id === linkId);
      if (index === -1) return prev;
      
      if (direction === 'up' && index > 0) {
        [links[index - 1], links[index]] = [links[index], links[index - 1]];
      } else if (direction === 'down' && index < links.length - 1) {
        [links[index], links[index + 1]] = [links[index + 1], links[index]];
      }
      return { ...prev, links };
    });
    setIsDirty(true);
  }, []);

  const duplicateLink = useCallback((linkId) => {
    setFormData(prev => {
      const linkToDuplicate = prev.links.find(l => l.id === linkId);
      if (!linkToDuplicate) return prev;
      
      const newLink = {
        ...linkToDuplicate,
        id: Date.now().toString(),
        label: `${linkToDuplicate.label} (Copy)`,
        clicks: 0
      };
      
      return {
        ...prev,
        links: [...prev.links, newLink]
      };
    });
    setIsDirty(true);
  }, []);

  // Template application
  const applyTemplate = useCallback((template) => {
    setFormData(prev => ({
      ...prev,
      ...template.config,
      // Preserve user content
      name: prev.name,
      title: prev.title,
      company: prev.company,
      bio: prev.bio,
      profileImage: prev.profileImage,
      links: prev.links,
      // Reset images to prevent conflicts
      bannerImage: null,
      cardBackgroundImage: null,
      background: { ...template.config.background, image: null }
    }));
    setShowTemplateModal(false);
    setIsDirty(true);
  }, []);

  // Save functionality
  const saveCard = useCallback(() => {
    if (!validateForm()) {
      alert('Please fix the validation errors before saving');
      return;
    }

    let updatedCards;
    const now = new Date().toISOString();
    
    if (isEditing) {
      updatedCards = cards.map(card =>
        card.id === formData.id ? { 
          ...formData,
          updatedAt: now
        } : card
      );
    } else {
      const newCard = {
        ...formData,
        id: Date.now().toString(),
        shortLink: Math.random().toString(36).substr(2, 8).toLowerCase(),
        visits: 0,
        createdAt: now,
        updatedAt: now,
        analytics: {
          totalVisits: 0,
          totalClicks: 0,
          topLink: formData.links[0]?.label || 'No links',
          dailyStats: [],
          linkStats: formData.links.map(link => ({
            id: link.id,
            label: link.label,
            clicks: 0
          }))
        }
      };
      updatedCards = [...cards, newCard];
    }

    if (setCards) {
      setCards(updatedCards);
    }
    
    alert(isEditing ? 'Card updated successfully!' : 'Card created successfully!');
    resetForm();
  }, [formData, isEditing, cards, setCards, validateForm]);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setIsEditing(false);
    setIsDirty(false);
    setErrors({});
  }, []);

  const openPreview = useCallback(() => {
    const tempCard = {
      ...formData,
      id: 'temp',
      shortLink: 'preview',
      visits: 0,
      createdAt: new Date().toISOString(),
      analytics: { totalVisits: 0, totalClicks: 0, topLink: 'No links', dailyStats: [], linkStats: [] }
    };
    
    // In a real app, you might navigate to a preview page
    console.log('Preview card:', tempCard);
    alert('Preview functionality would open in a new window');
  }, [formData]);

  // Export/Import functionality
  const exportCardConfig = useCallback(() => {
    const configToExport = {
      ...formData,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-config-${formData.name || 'untitled'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [formData]);

  const importCardConfig = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        setFormData(prev => ({
          ...defaultFormData,
          ...importedConfig,
          id: undefined // Remove ID to create new card
        }));
        setIsDirty(true);
        alert('Configuration imported successfully!');
      } catch (error) {
        alert('Failed to import configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

  // Tab navigation
  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Edit },
    { id: 'design', name: 'Design', icon: Palette },
    { id: 'layout', name: 'Layout', icon: Layout },
    { id: 'links', name: 'Links', icon: ExternalLink },
    { id: 'advanced', name: 'Advanced', icon: Settings }
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name * {errors.name && <span className="text-red-500 text-xs">({errors.name})</span>}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your professional title"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company/Organization</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your company or organization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio/Description
                  <span className="text-xs text-gray-500 ml-2">(Use \n for line breaks)</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Brief description about yourself or your work\nUse \n for new lines"
                />
                <div className="text-xs text-gray-400 mt-1">{formData.bio.length}/500 characters</div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <div className="flex items-center gap-4">
                {formData.profileImage && (
                  <div className="relative">
                    <img src={formData.profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    <button
                      onClick={() => handleInputChange('profileImage', null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleImageUpload(e, 'profileImage')}
                  accept="image/*"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                />
              </div>
            </div>
          </div>
        );
        
      case 'design':
        return (
          <div className="space-y-6">
            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Text Colors</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(formData.textColors).map(([colorType, colorValue]) => (
                  <div key={colorType} className="flex items-center gap-3">
                    <label className="w-20 text-sm capitalize font-medium text-gray-600">{colorType}</label>
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleTextColorChange(colorType, e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e) => handleTextColorChange(colorType, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      placeholder="#000000"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Banner Configuration */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.showBanner}
                  onChange={(e) => handleInputChange('showBanner', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Show Banner</label>
              </div>
              
              {formData.showBanner && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Banner Style</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {banners.map((banner) => (
                        <button
                          key={banner.id}
                          onClick={() => setFormData(prev => ({ ...prev, banner: banner.id, bannerImage: null }))}
                          className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
                            formData.banner === banner.id
                              ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-6 rounded-lg mb-2 ${banner.class}`} style={{ opacity: formData.bannerOpacity }}></div>
                          <p className="text-xs text-gray-600 font-medium">{banner.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Banner Image</label>
                    <div className="flex items-center gap-4">
                      {formData.bannerImage && (
                        <div className="relative">
                          <img src={formData.bannerImage} alt="Banner" className="w-20 h-12 rounded object-cover shadow-sm" />
                          <button
                            onClick={() => handleInputChange('bannerImage', null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={bannerImageRef}
                        onChange={(e) => handleImageUpload(e, 'bannerImage')}
                        accept="image/*"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={formData.bannerHeight}
                        onChange={(e) => handleInputChange('bannerHeight', Math.max(0, parseInt(e.target.value) || 128))}
                        min="0"
                        max="400"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="128"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.bannerOpacity}
                        onChange={(e) => handleInputChange('bannerOpacity', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 text-center mt-1">{Math.round(formData.bannerOpacity * 100)}%</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius (px)</label>
                      <input
                        type="number"
                        value={formData.bannerBorderRadius}
                        onChange={(e) => handleInputChange('bannerBorderRadius', Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Page Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Page Background</label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-600">Color:</label>
                  <input
                    type="color"
                    value={formData.background.color}
                    onChange={(e) => handleBackgroundChange('color', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.background.color}
                    onChange={(e) => handleBackgroundChange('color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    placeholder="#F3F4F6"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                  <div className="flex items-center gap-4">
                    {formData.background.image && (
                      <div className="relative">
                        <img src={formData.background.image} alt="Background" className="w-20 h-12 rounded object-cover shadow-sm" />
                        <button
                          onClick={() => handleBackgroundChange('image', null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={backgroundImageRef}
                      onChange={(e) => handleImageUpload(e, 'background.image')}
                      accept="image/*"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.background.opacity}
                    onChange={(e) => handleBackgroundChange('opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">{Math.round(formData.background.opacity * 100)}%</div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'layout':
        return (
          <div className="space-y-6">
            {/* Card Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Card Dimensions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Width (px) {errors.cardWidth && <span className="text-red-500">({errors.cardWidth})</span>}
                  </label>
                  <input
                    type="number"
                    value={formData.cardWidthPx}
                    onChange={(e) => handleInputChange('cardWidthPx', Math.max(200, Math.min(800, parseInt(e.target.value) || 384)))}
                    min="200"
                    max="800"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cardWidth ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="384"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Height (px, 0 for auto) {errors.cardHeight && <span className="text-red-500">({errors.cardHeight})</span>}
                  </label>
                  <input
                    type="number"
                    value={formData.cardHeightPx}
                    onChange={(e) => handleInputChange('cardHeightPx', Math.max(0, Math.min(1200, parseInt(e.target.value) || 0)))}
                    min="0"
                    max="1200"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cardHeight ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Card Border Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Border Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                value={formData.cardBorderRadius}
                onChange={(e) => handleInputChange('cardBorderRadius', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center mt-1">{formData.cardBorderRadius}px</div>
            </div>

            {/* Profile Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture Settings</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.profileOnBanner}
                    onChange={(e) => handleInputChange('profileOnBanner', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Place Profile on Banner</label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                    <select
                      value={formData.profilePosition}
                      onChange={(e) => handleInputChange('profilePosition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Shape</label>
                    <select
                      value={formData.profileShape}
                      onChange={(e) => handleInputChange('profileShape', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="rectangle">Rectangle</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Content Background</label>
              <div className="space-y-4">
                <select
                  value={formData.contentBgType}
                  onChange={(e) => handleInputChange('contentBgType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="color">Solid Color</option>
                  <option value="transparent">Transparent</option>
                  <option value="gradient">Gradient</option>
                </select>
                
                {formData.contentBgType === 'color' && (
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.contentBgColor}
                      onChange={(e) => handleInputChange('contentBgColor', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.contentBgColor}
                      onChange={(e) => handleInputChange('contentBgColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      placeholder="#FFFFFF"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Content Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.contentOpacity}
                    onChange={(e) => handleInputChange('contentOpacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">{Math.round(formData.contentOpacity * 100)}%</div>
                </div>
              </div>
            </div>

            {/* Card Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Card Background Image</label>
              <div className="space-y-4">
                <select
                  value={formData.cardBackgroundMode}
                  onChange={(e) => handleInputChange('cardBackgroundMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">No Background Image</option>
                  <option value="whole">Whole Card</option>
                  <option value="content">Content Area Only</option>
                </select>
                
                {formData.cardBackgroundMode !== 'none' && (
                  <>
                    <div className="flex items-center gap-4">
                      {formData.cardBackgroundImage && (
                        <div className="relative">
                          <img src={formData.cardBackgroundImage} alt="Card Background" className="w-20 h-12 rounded object-cover shadow-sm" />
                          <button
                            onClick={() => handleInputChange('cardBackgroundImage', null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={cardBackgroundImageRef}
                        onChange={(e) => handleImageUpload(e, 'cardBackgroundImage')}
                        accept="image/*"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Background Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.cardBackgroundOpacity}
                        onChange={(e) => handleInputChange('cardBackgroundOpacity', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 text-center mt-1">{Math.round(formData.cardBackgroundOpacity * 100)}%</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Layout Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Layout Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'centered', name: 'Centered', description: 'All content centered' },
                  { id: 'creative', name: 'Creative', description: 'Left-aligned, artistic' },
                  { id: 'corporate', name: 'Corporate', description: 'Professional, clean' }
                ].map((layoutOption) => (
                  <button
                    key={layoutOption.id}
                    onClick={() => handleInputChange('layout', layoutOption.id)}
                    className={`p-4 text-left border rounded-lg transition-all duration-200 hover:shadow-md ${
                      formData.layout === layoutOption.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{layoutOption.name}</h4>
                    <p className="text-xs text-gray-600">{layoutOption.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'links':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Social Links & Contacts</h3>
              <button
                onClick={addLink}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus size={18} />
                Add Link
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.links.map((link, index) => {
                const linkType = linkTypes.find(lt => lt.id === link.type);
                const IconComp = linkType?.icon || Globe;
                
                return (
                  <div key={link.id} className="p-5 border border-gray-200 rounded-xl space-y-4 hover:border-gray-300 transition-all bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <IconComp size={20} className="text-gray-600 flex-shrink-0" />
                        <select
                          value={link.type}
                          onChange={(e) => updateLink(link.id, 'type', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          {linkTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveLink(link.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => moveLink(link.id, 'down')}
                          disabled={index === formData.links.length - 1}
                          className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => duplicateLink(link.id)}
                          className="p-2 text-blue-600 hover:bg-white rounded-lg transition-colors"
                          title="Duplicate link"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => removeLink(link.id)}
                          className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors"
                          title="Remove link"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Display Label {errors[`link_${index}_label`] && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                          placeholder="e.g., My Instagram"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                            errors[`link_${index}_label`] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          URL {errors[`link_${index}_url`] && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                          placeholder={linkType?.placeholder || "Enter URL"}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                            errors[`link_${index}_url`] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Button Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={link.color || '#3B82F6'}
                            onChange={(e) => updateLink(link.id, 'color', e.target.value)}
                            className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={link.color || '#3B82F6'}
                            onChange={(e) => updateLink(link.id, 'color', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hover Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={link.hoverColor || '#2563EB'}
                            onChange={(e) => updateLink(link.id, 'hoverColor', e.target.value)}
                            className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={link.hoverColor || '#2563EB'}
                            onChange={(e) => updateLink(link.id, 'hoverColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                            placeholder="#2563EB"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Display Mode</label>
                      <select
                        value={link.displayMode}
                        onChange={(e) => updateLink(link.id, 'displayMode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="both">Icon & Label</option>
                        <option value="icon">Icon Only</option>
                        <option value="label">Label Only</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={link.isActive}
                        onChange={(e) => updateLink(link.id, 'isActive', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="text-xs font-medium text-gray-600">Active</label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            {/* Animations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Animations</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.animations.enabled}
                    onChange={(e) => handleAnimationChange('enabled', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Animations</label>
                </div>
                
                {formData.animations.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hover Effect</label>
                      <select
                        value={formData.animations.hoverEffect}
                        onChange={(e) => handleAnimationChange('hoverEffect', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="scale">Scale</option>
                        <option value="lift">Lift</option>
                        <option value="fade">Fade</option>
                        <option value="glow">Glow</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Transition Duration (ms)</label>
                      <input
                        type="number"
                        value={formData.animations.transitionDuration}
                        onChange={(e) => handleAnimationChange('transitionDuration', Math.max(0, parseInt(e.target.value) || 200))}
                        min="0"
                        max="1000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Accessibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Accessibility</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Profile Image Alt Text</label>
                  <input
                    type="text"
                    value={formData.accessibility.altText}
                    onChange={(e) => handleAccessibilityChange('altText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Profile image description"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Card ARIA Label</label>
                  <input
                    type="text"
                    value={formData.accessibility.ariaLabel}
                    onChange={(e) => handleAccessibilityChange('ariaLabel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digital business card"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.accessibility.highContrast}
                    onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">High Contrast Mode</label>
                </div>
              </div>
            </div>

            {/* Custom CSS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Custom CSS</label>
              <textarea
                value={formData.customCSS}
                onChange={(e) => handleInputChange('customCSS', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="/* Custom CSS */\n.card-container {\n  /* Add your styles here */\n}"
              />
            </div>

            {/* Export/Import Config */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Export/Import Configuration</label>
              <div className="flex gap-4">
                <button
                  onClick={exportCardConfig}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Download size={18} />
                  Export Config
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={importConfigRef}
                    onChange={importCardConfig}
                    accept="application/json"
                    className="hidden"
                    id="import-config"
                  />
                  <label
                    htmlFor="import-config"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Upload size={18} />
                    Import Config
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                {isEditing ? 'Edit Card' : 'Create New Card'}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  <Layers size={18} />
                  Templates
                </button>
                <button
                  onClick={openPreview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  <Eye size={18} />
                  Preview
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors`}
                    >
                      <Icon size={18} />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              <TabContent />
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={resetForm}
                disabled={!isDirty}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={saveCard}
                disabled={!isDirty}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Update Card' : 'Create Card'}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 h-fit">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
            <div className="flex justify-center">
              {renderCard(formData, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Choose a Template</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cardTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="mb-2">
                    {renderCard({ ...template.config, name: 'Sample Name', title: 'Sample Title' }, true)}
                  </div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateCard;