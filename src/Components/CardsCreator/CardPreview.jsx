import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, X, Share2, Globe, Mail, Phone, Linkedin, Github, Twitter, Instagram, Facebook, Youtube, MessageCircle, Link, ExternalLink } from 'lucide-react';

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

const banners = [
  { id: 'gradient-blue', name: 'Ocean Blue', class: 'bg-gradient-to-r from-blue-500 to-blue-700' },
  { id: 'gradient-purple', name: 'Purple Dream', class: 'bg-gradient-to-r from-purple-500 to-purple-700' },
  { id: 'gradient-green', name: 'Forest Green', class: 'bg-gradient-to-r from-green-500 to-green-700' },
  { id: 'gradient-orange', name: 'Sunset Orange', class: 'bg-gradient-to-r from-orange-500 to-orange-700' },
  { id: 'solid-dark', name: 'Professional Dark', class: 'bg-gray-800' },
  { id: 'solid-white', name: 'Clean White', class: 'bg-white border' }
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
      contentStyle.backgroundSize= 'cover';
      contentStyle.backgroundPosition= 'center';
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

function CardPreview() {
  const navigate = useNavigate();
  const [card, setCard] = React.useState(null);

  React.useEffect(() => {
    // Get the preview card data from localStorage
    const previewCard = JSON.parse(localStorage.getItem('previewCard'));
    if (previewCard) {
      // Ensure card has all necessary fields
      setCard({
        ...previewCard,
        name: previewCard.name || '',
        title: previewCard.title || '',
        company: previewCard.company || '',
        bio: previewCard.bio || '',
        links: previewCard.links || [],
        colors: previewCard.colors || { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
        textColors: previewCard.textColors || { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
        background: previewCard.background || { color: '#F3F4F6', image: null },
        banner: previewCard.banner || 'gradient-blue',
        cardWidth: previewCard.cardWidth || 'sm',
        glassEffect: previewCard.glassEffect || false,
        cardBackgroundMode: previewCard.cardBackgroundMode || 'whole',
        contentBgType: previewCard.contentBgType || 'color',
        contentBgColor: previewCard.contentBgColor || '#FFFFFF'
      });
    } else {
      navigate('/dashboard/card');
    }
  }, [navigate]);

  const copyLink = (shortLink) => {
    const link = `${window.location.origin}/dashboard/card/${shortLink}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!'); // Replace with toast notification in production
    }).catch(() => {
      alert('Failed to copy link');
    });
  };

  const generateVCF = (card) => {
    const emailLink = card.links?.find(l => l.type === 'email') || { url: '' };
    const phoneLink = card.links?.find(l => l.type === 'phone') || { url: '' };
    const websiteLink = card.links?.find(l => l.type === 'website') || { url: '' };

    const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${card.name || 'Contact'}
ORG:${card.company || ''}
TITLE:${card.title || ''}
EMAIL:${emailLink.url}
TEL:${phoneLink.url}
URL:${websiteLink.url}
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

  if (!card) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4`} style={{
      backgroundColor: card.background?.color || '#F3F4F6',
      backgroundImage: card.background?.image ? `url(${card.background.image})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="bg-white/90 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Card Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyLink(card.shortLink)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Copy Link"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={() => generateVCF(card)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Download Contact"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => navigate('/dashboard/card')}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-6">
          {renderCard(card, true)}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50/90 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Share2 size={16} className="text-indigo-600" />
                <span className="font-medium text-gray-900">Share This Card</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/dashboard/card/${card.shortLink}`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => copyLink(card.shortLink)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => generateVCF(card)}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download size={18} />
                Save Contact
              </button>
              <button
                onClick={() => navigate('/dashboard/card')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <X size={18} />
                Back to Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardPreview;