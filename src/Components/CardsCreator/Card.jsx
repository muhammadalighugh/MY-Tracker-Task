import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Eye, Grid2x2 , Share2, Download, Copy, BarChart3, Users, MousePointer, Edit, Trash2, ExternalLink, Phone, Mail, Globe, Github, Linkedin, MessageCircle, Instagram, Twitter, Facebook, Youtube, Link, ArrowUp, ArrowDown, Calendar, TrendingUp, Activity } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';

const linkTypes = [
  { id: 'website', name: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
  { id: 'email', name: 'Email', icon: Mail, placeholder: 'your@email.com' },
  { id: 'phone', name: 'Phone', icon: Phone, placeholder: '+1234567890' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
  { id: 'github', name: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/username' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/channel/id' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, placeholder: '+1234567890' },
  { id: 'custom', name: 'Custom Link', icon: Link, placeholder: 'https://yourlink.com' }
];

const templates = [
  { id: 'modern', name: 'Modern Professional', preview: 'Clean lines, centered layout' },
  { id: 'creative', name: 'Creative Bold', preview: 'Vibrant colors, artistic layout' },
  { id: 'minimal', name: 'Minimal Clean', preview: 'Simple, elegant design' },
  { id: 'corporate', name: 'Corporate Classic', preview: 'Traditional business style' }
];

const banners = [
  { id: 'gradient-blue', name: 'Ocean Blue', class: 'bg-gradient-to-r from-blue-500 to-blue-700' },
  { id: 'gradient-purple', name: 'Purple Dream', class: 'bg-gradient-to-r from-purple-500 to-purple-700' },
  { id: 'gradient-green', name: 'Forest Green', class: 'bg-gradient-to-r from-green-500 to-green-700' },
  { id: 'gradient-orange', name: 'Sunset Orange', class: 'bg-gradient-to-r from-orange-500 to-orange-700' },
  { id: 'solid-dark', name: 'Professional Dark', class: 'bg-gray-800' },
  { id: 'solid-white', name: 'Clean White', class: 'bg-white border' }
];

const backgroundColors = [
  { id: 'white', name: 'White', value: '#FFFFFF' },
  { id: 'gray', name: 'Light Gray', value: '#F3F4F6' },
  { id: 'blue', name: 'Light Blue', value: '#EBF5FF' },
  { id: 'purple', name: 'Light Purple', value: '#F3E8FF' }
];

const cardWidths = [
  { id: 'sm', name: 'Small', class: 'max-w-sm' },
  { id: 'md', name: 'Medium', class: 'max-w-md' },
  { id: 'lg', name: 'Large', class: 'max-w-lg' }
];

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  if (hex.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Analytics utility functions
function updateCardAnalytics(cardId, type, linkId = null) {
  const cards = JSON.parse(localStorage.getItem('cards')) || [];
  const cardIndex = cards.findIndex(c => c.id === cardId);
  
  if (cardIndex !== -1) {
    const card = cards[cardIndex];
    
    // Initialize analytics if not exists
    if (!card.analytics) {
      card.analytics = {
        totalVisits: 0,
        totalClicks: 0,
        topLink: '',
        dailyStats: [],
        linkStats: []
      };
    }
    
    // Update based on type
    if (type === 'visit') {
      card.analytics.totalVisits++;
      card.visits = card.analytics.totalVisits;
      
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const todayStats = card.analytics.dailyStats.find(d => d.date === today);
      if (todayStats) {
        todayStats.visits++;
      } else {
        card.analytics.dailyStats.push({ date: today, visits: 1, clicks: 0 });
      }
    } else if (type === 'click' && linkId) {
      card.analytics.totalClicks++;
      
      // Update link stats
      const linkStats = card.analytics.linkStats.find(l => l.linkId === linkId);
      if (linkStats) {
        linkStats.clicks++;
      } else {
        const link = card.links?.find(l => l.id === linkId);
        if (link) {
          card.analytics.linkStats.push({ 
            linkId, 
            label: link.label, 
            clicks: 1 
          });
        }
      }
      
      // Update link clicks in card links
      if (card.links) {
        const linkIndex = card.links.findIndex(l => l.id === linkId);
        if (linkIndex !== -1) {
          card.links[linkIndex].clicks = (card.links[linkIndex].clicks || 0) + 1;
        }
      }
      
      // Update top link
      const sortedLinks = card.analytics.linkStats.sort((a, b) => b.clicks - a.clicks);
      card.analytics.topLink = sortedLinks[0]?.label || 'No clicks';
      
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const todayStats = card.analytics.dailyStats.find(d => d.date === today);
      if (todayStats) {
        todayStats.clicks++;
      } else {
        card.analytics.dailyStats.push({ date: today, visits: 0, clicks: 1 });
      }
    }
    
    // Keep only last 30 days of stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    card.analytics.dailyStats = card.analytics.dailyStats.filter(
      stat => new Date(stat.date) >= thirtyDaysAgo
    );
    
    cards[cardIndex] = card;
    localStorage.setItem('cards', JSON.stringify(cards));
    
    return card;
  }
  return null;
}

function CardView() {
  const { shortLink } = useParams();
  const [card, setCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let foundCard;
    if (shortLink === 'preview') {
      foundCard = JSON.parse(localStorage.getItem('previewCard'));
    } else {
      foundCard = JSON.parse(localStorage.getItem('cards'))?.find(c => c.shortLink === shortLink);
      
      // Track visit for non-preview cards
      if (foundCard) {
        const updatedCard = updateCardAnalytics(foundCard.id, 'visit');
        if (updatedCard) {
          foundCard = updatedCard;
        }
      }
    }
    
    if (foundCard) {
      setCard(foundCard);
    } else {
      navigate('/dashboard/card');
    }
  }, [shortLink, navigate]);

  const handleLinkClick = (linkId) => {
    if (card && shortLink !== 'preview') {
      updateCardAnalytics(card.id, 'click', linkId);
    }
  };

  if (!card) return null;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: card.background?.color || '#F9FAFB',
        backgroundImage: card.background?.image ? `url(${card.background.image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {renderCard(card, true, true, handleLinkClick)}
    </div>
  );
}

function renderCard(cardData, isPreview = false, isViewOnly = false, onLinkClick = null) {
  const selectedBanner = banners.find(b => b.id === cardData.banner);
  const bannerClass = (cardData.cardBackgroundMode === 'whole' && cardData.cardBackgroundImage) 
    ? '' 
    : selectedBanner?.class || '';
  const bannerStyle = cardData.bannerImage ? {
    backgroundImage: `url(${cardData.bannerImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};
  
  const cardWidthClass = cardWidths.find(w => w.id === cardData.cardWidth)?.class || 'max-w-sm';
  const glassClass = cardData.glassEffect ? 'backdrop-blur-md bg-white/30' : '';
  const profileZIndex = cardData.glassEffect ? 'z-10' : '';

  const contentBg = cardData.contentBgType === 'transparent' ? 'transparent' : cardData.contentBgColor;
  let contentBgStyle = { backgroundColor: contentBg };
  if (cardData.glassEffect && contentBg !== 'transparent') {
    contentBgStyle.backgroundColor = hexToRgba(contentBg, 0.7);
  }
  const contentClass = cardData.glassEffect ? 'backdrop-blur-md' : '';

  let outerStyle = {};
  let contentStyle = { ...contentBgStyle };
  if (cardData.cardBackgroundImage) {
    if (cardData.cardBackgroundMode === 'whole') {
      outerStyle = {
        backgroundImage: `url(${cardData.cardBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
      contentStyle.backgroundColor = 'transparent';
    } else if (cardData.cardBackgroundMode === 'content') {
      contentStyle.backgroundImage = `url(${cardData.cardBackgroundImage})`;
      contentStyle.backgroundSize = 'cover';
      contentStyle.backgroundPosition = 'center';
    }
  }

  const buttonLinks = cardData.links?.filter(link => link.displayMode !== 'icon-only') || [];
  const iconLinks = cardData.links?.filter(link => link.displayMode === 'icon-only') || [];

  return (
    <div className={`mx-auto rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${cardWidthClass} ${cardData.template === 'minimal' ? 'shadow-sm border' : 'shadow-xl'} ${glassClass}`} style={outerStyle}>
      <div className={`h-32 relative ${bannerClass}`} style={bannerStyle}>
        {cardData.profileImage && (
          <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 ${profileZIndex}`}>
            <img 
              src={cardData.profileImage} 
              alt={cardData.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          </div>
        )}
        {!cardData.profileImage && (
          <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 ${profileZIndex}`}>
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200/50 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {cardData.name ? cardData.name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={`pt-16 pb-6 px-6 ${contentClass}`} style={contentStyle}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.name || '#111827'}}>{cardData.name || 'Your Name'}</h2>
          <p className="text-lg mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.title || '#374151'}}>{cardData.title || 'Your Title'}</p>
          {cardData.company && <p className="text-sm mb-3 whitespace-normal break-words" style={{color: cardData.textColors?.company || '#6B7280'}}>{cardData.company}</p>}
          {cardData.bio && <p className="text-sm leading-relaxed whitespace-normal break-words" style={{color: cardData.textColors?.bio || '#4B5563'}}>{cardData.bio}</p>}
        </div>

        {buttonLinks.length > 0 && (
          <div className="space-y-3">
            {buttonLinks.map((link) => {
              const linkType = linkTypes.find(lt => lt.id === link.type);
              const IconComp = linkType?.icon || Globe;
              const linkColor = link.color || cardData.colors?.primary || '#3B82F6';
              const hoverBg = link.hoverColor ? hexToRgba(link.hoverColor, 0.08) : hexToRgba(linkColor, 0.08);
              const hoverBorder = link.hoverColor ? hexToRgba(link.hoverColor, 0.2) : hexToRgba(linkColor, 0.2);
              const linkStyle = { 
                borderColor: hexToRgba(linkColor, 0.2),
                backgroundColor: hexToRgba(linkColor, 0.08),
                color: cardData.textColors?.name || '#111827'
              };
              let linkClass = `w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border hover:shadow-md transition-all duration-200 whitespace-normal break-words`;

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                  style={linkStyle}
                  onClick={() => onLinkClick && onLinkClick(link.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverBg;
                    e.currentTarget.style.borderColor = hoverBorder;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRgba(linkColor, 0.08);
                    e.currentTarget.style.borderColor = hexToRgba(linkColor, 0.2);
                  }}
                >
                  {link.displayMode !== 'text-only' && <IconComp size={20} style={{ color: linkColor }} />}
                  {link.displayMode !== 'icon-only' && <span className="font-medium">{link.label || linkType?.name || 'Link'}</span>}
                  <ExternalLink size={16} className="opacity-50" />
                </a>
              );
            })}
          </div>
        )}

        {iconLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {iconLinks.map((link) => {
              const linkType = linkTypes.find(lt => lt.id === link.type);
              const IconComp = linkType?.icon || Globe;
              const linkColor = link.color || cardData.colors?.primary || '#3B82F6';
              const hoverBg = link.hoverColor ? hexToRgba(link.hoverColor, 0.08) : hexToRgba(linkColor, 0.08);
              
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: linkColor,
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => onLinkClick && onLinkClick(link.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={link.label || linkType?.name || 'Link'}
                >
                  <IconComp size={24} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CardMain() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const bannerImageRef = useRef(null);
  const cardBackgroundImageRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const qrCodeRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    profileImage: null,
    banner: 'gradient-blue',
    bannerImage: null,
    cardBackgroundImage: null,
    template: 'modern',
    colors: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
    textColors: { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
    links: [],
    background: { color: '#F3F4F6', image: null },
    cardWidth: 'sm',
    glassEffect: false,
    cardBackgroundMode: 'whole',
    contentBgType: 'color',
    contentBgColor: '#FFFFFF'
  });

  // Check sidebar state
  useEffect(() => {
    const checkSidebarState = () => {
      const collapsed = localStorage.getItem('collapsed') === 'true';
      setSidebarCollapsed(collapsed);
    };

    checkSidebarState();
    
    // Listen for sidebar changes
    const handleStorageChange = () => {
      checkSidebarState();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes
    const interval = setInterval(checkSidebarState, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadCards = () => {
      const storedCards = JSON.parse(localStorage.getItem('cards')) || [];
      setCards(storedCards);
    };

    loadCards();
    
    // Listen for storage changes to update real-time
    const handleStorageChange = () => {
      loadCards();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Refresh data periodically for real-time updates
    const interval = setInterval(loadCards, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (selectedCard && qrCodeRef.current) {
      // Clear previous QR code
      qrCodeRef.current.innerHTML = '';
      
      const qrCode = new QRCodeStyling({
        width: 128,
        height: 128,
        data: `${window.location.origin}/dashboard/card/${selectedCard.shortLink}`,
        dotsOptions: {
          color: "#1f2937",
          type: "rounded"
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
        }
      });
      qrCode.append(qrCodeRef.current);
    }
  }, [selectedCard, previewMode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (type, color) => {
    setFormData(prev => ({
      ...prev,
      colors: { ...prev.colors, [type]: color }
    }));
  };

  const handleTextColorChange = (type, color) => {
    setFormData(prev => ({
      ...prev,
      textColors: { ...prev.textColors, [type]: color }
    }));
  };

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
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
      };
      reader.readAsDataURL(file);
    }
  };

  const addLink = () => {
    const newLink = {
      id: Date.now().toString(),
      type: 'website',
      label: '',
      url: '',
      clicks: 0,
      color: '',
      hoverColor: '',
      displayMode: 'both'
    };
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }));
  };

  const updateLink = (linkId, field, value) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === linkId ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeLink = (linkId) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
  };

  const moveLink = (linkId, direction) => {
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
  };

  const saveCard = () => {
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
          linkStats: []
        }
      };
      updatedCards = [...cards, newCard];
    }

    setCards(updatedCards);
    try {
      localStorage.setItem('cards', JSON.stringify(updatedCards));
    } catch (e) {
      alert('Failed to save to localStorage: ' + e.message + '. Card saved in memory only.');
    }

    resetForm();
    setActiveTab('cards');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      company: '',
      bio: '',
      profileImage: null,
      banner: 'gradient-blue',
      bannerImage: null,
      cardBackgroundImage: null,
      template: 'modern',
      colors: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
      textColors: { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
      links: [],
      background: { color: '#F3F4F6', image: null },
      cardWidth: 'sm',
      glassEffect: false,
      cardBackgroundMode: 'whole',
      contentBgType: 'color',
      contentBgColor: '#FFFFFF'
    });
    setIsEditing(false);
  };

  const editCard = (card) => {
    setFormData({
      ...card,
      textColors: card.textColors || { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' }
    });
    setIsEditing(true);
    setActiveTab('create');
  };

  const duplicateCard = (card) => {
    const duplicatedCard = {
      ...card,
      id: Date.now().toString(),
      name: `${card.name} (Copy)`,
      shortLink: Math.random().toString(36).substr(2, 8).toLowerCase(),
      visits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      analytics: {
        totalVisits: 0,
        totalClicks: 0,
        topLink: card.links[0]?.label || 'No links',
        dailyStats: [],
        linkStats: []
      }
    };
    const updatedCards = [...cards, duplicatedCard];
    setCards(updatedCards);
    try {
      localStorage.setItem('cards', JSON.stringify(updatedCards));
    } catch (e) {
      alert('Failed to save to localStorage: ' + e.message);
    }
  };

  const deleteCard = (cardId) => {
    if (window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      try {
        localStorage.setItem('cards', JSON.stringify(updatedCards));
      } catch (e) {
        alert('Failed to save to localStorage: ' + e.message);
      }
    }
  };

  const generateVCF = (card) => {
    const emailLink = card.links.find(l => l.type === 'email');
    const phoneLink = card.links.find(l => l.type === 'phone');
    const websiteLink = card.links.find(l => l.type === 'website');
    
    const email = emailLink ? emailLink.url : '';
    const phone = phoneLink ? phoneLink.url : '';
    const website = websiteLink ? websiteLink.url : '';
    
    const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${card.name || 'Contact'}
ORG:${card.company || ''}
TITLE:${card.title || ''}
EMAIL:${email}
TEL:${phone}
URL:${website}
NOTE:${card.bio || ''}
END:VCARD`;

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(card.name || 'contact').replace(/\s+/g, '_')}_contact.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyLink = (shortLink) => {
    const link = `${window.location.origin}/dashboard/card/${shortLink}`;
    navigator.clipboard.writeText(link).then(() => {
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link');
    });
  };

  const openPreview = () => {
    const tempCard = {
      ...formData,
      id: 'temp',
      shortLink: 'preview',
      visits: 0,
      createdAt: new Date().toISOString(),
      analytics: { totalVisits: 0, totalClicks: 0, topLink: 'No links', dailyStats: [], linkStats: [] }
    };
    localStorage.setItem('previewCard', JSON.stringify(tempCard));
    window.open('/dashboard/card/preview', '_blank');
  };

  const renderAnalytics = (card) => {
    const analytics = card.analytics || { 
      totalVisits: 0, 
      totalClicks: 0, 
      topLink: 'No links', 
      dailyStats: [], 
      linkStats: [] 
    };
    
    // Calculate CTR
    const ctr = analytics.totalVisits > 0 ? (analytics.totalClicks / analytics.totalVisits * 100).toFixed(1) : 0;
    
    // Get recent activity (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const recentStats = last7Days.map(date => {
      const dayStats = analytics.dailyStats.find(d => d.date === date);
      return {
        date,
        visits: dayStats?.visits || 0,
        clicks: dayStats?.clicks || 0
      };
    });
    
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Analytics for {card.name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity size={14} />
            <span>Real-time data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Visits</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalVisits}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <MousePointer className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total Clicks</p>
                <p className="text-2xl font-bold text-green-900">{analytics.totalClicks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Click Rate</p>
                <p className="text-2xl font-bold text-purple-900">{ctr}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <BarChart3 className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Top Link</p>
                <p className="text-sm font-bold text-orange-900 truncate">{analytics.topLink}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Chart */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={16} />
            Last 7 Days Activity
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-end justify-between h-32 gap-1">
              {recentStats.map((stat, index) => {
                const maxValue = Math.max(...recentStats.map(s => Math.max(s.visits, s.clicks))) || 1;
                const visitHeight = (stat.visits / maxValue) * 100;
                const clickHeight = (stat.clicks / maxValue) * 100;
                
                return (
                  <div key={stat.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-0.5 items-center">
                      {stat.visits > 0 && (
                        <div 
                          className="w-3 bg-blue-500 rounded-t" 
                          style={{ height: `${visitHeight}%`, minHeight: stat.visits > 0 ? '4px' : '0' }}
                          title={`${stat.visits} visits`}
                        />
                      )}
                      {stat.clicks > 0 && (
                        <div 
                          className="w-3 bg-green-500 rounded-t" 
                          style={{ height: `${clickHeight}%`, minHeight: stat.clicks > 0 ? '4px' : '0' }}
                          title={`${stat.clicks} clicks`}
                        />
                      )}
                      {stat.visits === 0 && stat.clicks === 0 && (
                        <div className="w-3 h-1 bg-gray-300 rounded" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 transform rotate-45 origin-left whitespace-nowrap">
                      {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Visits</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Clicks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Link Performance */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <MousePointer size={16} />
            Link Performance
          </h4>
          {card.links && card.links.length > 0 ? (
            <div className="space-y-2">
              {card.links.map((link) => {
                const linkType = linkTypes.find(lt => lt.id === link.type);
                const IconComp = linkType?.icon || Globe;
                const clicks = link.clicks || 0;
                const maxClicks = Math.max(...card.links.map(l => l.clicks || 0)) || 1;
                const percentage = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
                
                return (
                  <div key={link.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <IconComp size={16} className="text-gray-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{link.label || linkType?.name || 'Link'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{clicks}</span>
                        <span className="text-xs text-gray-500">clicks</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              <MousePointer size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No links added yet</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate responsive margins based on screen size and sidebar state
  const getResponsiveMargins = () => {
    if (typeof window === 'undefined') return 'ml-0';
    
    const isLargeScreen = window.innerWidth >= 1024;
    if (!isLargeScreen) return 'ml-0';
    
    return sidebarCollapsed ? 'ml-20' : 'ml-64';
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${getResponsiveMargins()}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className="p-2 bg-indigo-50 rounded-full">
          <Eye className="text-indigo-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Digital Business Cards</h1>
          <p className="text-sm text-gray-500 mt-1">Craft and manage professional connections</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <nav className="flex items-center gap-2 bg-transparent border-b border-gray-200">
        {[
          { id: 'create', label: 'Create', icon: Plus },
          { id: 'cards', label: 'My Cards', icon: Eye },
          { id: 'Templates', label: 'Templates', icon: Grid2x2 },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-200'
              }`}
            >
              <IconComp size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit className="text-blue-600" size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Your professional title"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Your company or organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio/Tagline</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Brief description about yourself or your work"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                    <div className="flex items-center gap-4">
                      {formData.profileImage && (
                        <img src={formData.profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleImageUpload(e, 'profileImage')}
                        accept="image/*"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Design & Styling */}
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="text-purple-600" size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Design & Styling</h2>
                </div>
                <div className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Choose Template</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleInputChange('template', template.id)}
                          className={`p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-md ${
                            formData.template === template.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-sm text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{template.preview}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Card Width</label>
                    <div className="grid grid-cols-3 gap-3">
                      {cardWidths.map((width) => (
                        <button
                          key={width.id}
                          onClick={() => handleInputChange('cardWidth', width.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 ${
                            formData.cardWidth === width.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-sm font-medium">{width.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner Background */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Banner Style</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {banners.map((banner) => (
                        <button
                          key={banner.id}
                          onClick={() => setFormData(prev => ({ ...prev, banner: banner.id, bannerImage: null }))}
                          className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
                            formData.banner === banner.id
                              ? 'border-blue-500 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-8 rounded-lg mb-2 ${banner.class}`}></div>
                          <p className="text-xs text-gray-600">{banner.name}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Banner Image</label>
                      <input
                        type="file"
                        ref={bannerImageRef}
                        onChange={(e) => handleImageUpload(e, 'bannerImage')}
                        accept="image/*"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Advanced Styling */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Colors */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Brand Colors</label>
                      <div className="space-y-3">
                        {Object.entries(formData.colors).map(([colorType, colorValue]) => (
                          <div key={colorType} className="flex items-center gap-3">
                            <label className="w-16 text-sm capitalize font-medium text-gray-600">{colorType}</label>
                            <input
                              type="color"
                              value={colorValue}
                              onChange={(e) => handleColorChange(colorType, e.target.value)}
                              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 font-mono">{colorValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Text Colors */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Text Colors</label>
                      <div className="space-y-3">
                        {Object.entries(formData.textColors).map(([colorType, colorValue]) => (
                          <div key={colorType} className="flex items-center gap-3">
                            <label className="w-16 text-sm capitalize font-medium text-gray-600">{colorType}</label>
                            <input
                              type="color"
                              value={colorValue}
                              onChange={(e) => handleTextColorChange(colorType, e.target.value)}
                              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 font-mono">{colorValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Glass Effect Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.glassEffect}
                      onChange={(e) => handleInputChange('glassEffect', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Glass Effect</label>
                      <p className="text-xs text-gray-500">Adds a modern glassmorphism effect to your card</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links Section */}
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-0">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Link className="text-green-600" size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Social Links</h2>
                  </div>
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
                      <div key={link.id} className="p-4 border border-gray-200 rounded-xl space-y-4 hover:border-gray-300 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <IconComp size={20} className="text-gray-600" />
                            <select
                              value={link.type}
                              onChange={(e) => updateLink(link.id, 'type', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {linkTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => moveLink(link.id, 'up')}
                              disabled={index === 0}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Move up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveLink(link.id, 'down')}
                              disabled={index === formData.links.length - 1}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Move down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => removeLink(link.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove link"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                            placeholder="Display label (e.g., My Instagram)"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                            placeholder={linkTypes.find(t => t.id === link.type)?.placeholder || "Enter URL"}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Color</label>
                            <input
                              type="color"
                              value={link.color || formData.colors.primary}
                              onChange={(e) => updateLink(link.id, 'color', e.target.value)}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Hover</label>
                            <input
                              type="color"
                              value={link.hoverColor || ''}
                              onChange={(e) => updateLink(link.id, 'hoverColor', e.target.value)}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                          </div>
                          <select
                            value={link.displayMode}
                            onChange={(e) => updateLink(link.id, 'displayMode', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="both">Icon & Text</option>
                            <option value="icon-only">Icon Only</option>
                            <option value="text-only">Text Only</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {formData.links.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                      <Link size={32} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-2">No links added yet</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={saveCard}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                disabled={!formData.name.trim()}
              >
                {isEditing ? 'Update Card' : 'Save Card'}
              </button>
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Live Preview</h2>
                <div className="flex justify-center">
                  {renderCard(formData, true)}
                </div>
                <button
                  onClick={openPreview}
                  className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Preview in New Tab
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'cards' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">My Cards</h2>
              <p className="text-gray-600">{cards.length} cards created</p>
            </div>
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Plus size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
                <p className="text-gray-600 mb-4">Create your first digital card to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Card
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div key={card.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4">
                      {renderCard(card)}
                    </div>
                    <div className="border-t border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{card.visits}</span> visits
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(card.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            setPreviewMode(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Eye size={16} />
                          Preview
                        </button>
                        <button
                          onClick={() => editCard(card)}
                          className="flex items-center justify-center p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => copyLink(card.shortLink)}
                          className="flex items-center justify-center p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Copy Link"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => generateVCF(card)}
                          className="flex items-center justify-center p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Download VCF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => duplicateCard(card)}
                          className="flex items-center justify-center p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Share Link:</span>
                          <code className="text-blue-600 font-mono">localhost:5173/dashboard/card/{card.shortLink}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'analytics' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
              <p className="text-gray-600">Track performance across all your cards</p>
            </div>
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
                <p className="text-gray-600">Create and share cards to see analytics</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Cards</p>
                        <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="text-green-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Visits</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {cards.reduce((sum, card) => sum + (card.analytics?.totalVisits || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MousePointer className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Clicks</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {cards.reduce((sum, card) => sum + (card.analytics?.totalClicks || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <BarChart3 className="text-orange-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. CTR</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {cards.length > 0 ? Math.round((cards.reduce((sum, card) => sum + (card.analytics?.totalClicks || 0), 0) / cards.reduce((sum, card) => sum + (card.analytics?.totalVisits || 0), 0)) * 100) || 0 : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {cards.map((card) => renderAnalytics(card))}
                </div>
              </div>
            )}
          </div>
        )}
        {previewMode && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="font-semibold text-gray-900">Card Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(selectedCard.shortLink)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy Link"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => generateVCF(selectedCard)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download Contact"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setPreviewMode(false);
                      setSelectedCard(null);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {renderCard(selectedCard, true)}
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 size={16} className="text-gray-600" />
                      <span className="font-medium text-gray-900">Share This Card</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`http://localhost:5173/dashboard/card/${selectedCard.shortLink}`}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <button
                          onClick={() => copyLink(selectedCard.shortLink)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-lg border">
                          <div ref={qrCodeRef} className="w-32 h-32 rounded" />
                          <p className="text-xs text-gray-600 text-center mt-2">QR Code</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => generateVCF(selectedCard)}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download size={18} />
                      Save Contact
                    </button>
                    <button
                      onClick={() => duplicateCard(selectedCard)}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Copy size={18} />
                      Duplicate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { CardMain, CardView };