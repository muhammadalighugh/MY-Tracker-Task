import React from 'react';
import { Globe, Mail, Phone, Linkedin, Github, Twitter, Instagram, Facebook, Youtube, MessageCircle, Link, ExternalLink } from 'lucide-react';

export const linkTypes = [
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

export const banners = [
  { id: 'gradient-blue', name: 'Ocean Blue', class: 'bg-gradient-to-r from-blue-500 to-blue-700' },
  { id: 'gradient-purple', name: 'Purple Dream', class: 'bg-gradient-to-r from-purple-500 to-purple-700' },
  { id: 'gradient-green', name: 'Forest Green', class: 'bg-gradient-to-r from-green-500 to-green-700' },
  { id: 'gradient-orange', name: 'Sunset Orange', class: 'bg-gradient-to-r from-orange-500 to-orange-700' },
  { id: 'solid-dark', name: 'Professional Dark', class: 'bg-gray-800' },
  { id: 'solid-white', name: 'Clean White', class: 'bg-white ' }
];

export const cardWidths = [
  { id: 'sm', name: 'Small', class: 'max-w-sm' },
  { id: 'md', name: 'Medium', class: 'max-w-md' },
  { id: 'lg', name: 'Large', class: 'max-w-lg' }
];

export function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
  if (hex.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function renderCard(cardData, isPreview = false, isViewOnly = false, onLinkClick = null) {
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
      contentStyle.backgroundSize= 'cover',
      backgroundPosition= 'center';
    }
  }

  const buttonLinks = cardData.links?.filter(link => link.displayMode !== 'icon-only') || [];
  const iconLinks = cardData.links?.filter(link => link.displayMode === 'icon-only') || [];

  let templateClass = '';
  if (cardData.template === 'minimal') {
    templateClass = 'shadow-sm border border-gray-100';
  } else if (cardData.template === 'creative') {
    templateClass = 'shadow-xl rounded-3xl';
  } else if (cardData.template === 'corporate') {
    templateClass = 'shadow-md border-t-4 border-blue-900';
  } else {
    templateClass = 'shadow-xl';
  }

  const isLeftLayout = cardData.layout === 'left';

  return (
    <div className={`mx-auto rounded-2xl overflow-hidden transition-all duration-300 ${cardWidthClass} ${templateClass} ${glassClass}`} style={outerStyle}>
      <div className={`h-32 relative ${bannerClass}`} style={bannerStyle}>
        {isLeftLayout ? null : (
          cardData.profileImage ? (
            <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 ${profileZIndex}`}>
              <img 
                src={cardData.profileImage} 
                alt={cardData.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>
          ) : (
            <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 ${profileZIndex}`}>
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200/50 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {cardData.name ? cardData.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            </div>
          )
        )}
      </div>

      <div className={`pt-${isLeftLayout ? '4' : '16'} pb-6 px-6 ${contentClass}`} style={contentStyle}>
        {isLeftLayout ? (
          <div className="flex items-start gap-4 mb-6">
            {cardData.profileImage ? (
              <img 
                src={cardData.profileImage} 
                alt={cardData.name}
                className="w-20 h-20 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-white shadow-sm bg-gray-200/50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-gray-600">
                  {cardData.name ? cardData.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.name || '#111827'}}>{cardData.name || 'Your Name'}</h2>
              <p className="text-lg mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.title || '#374151'}}>{cardData.title || 'Your Title'}</p>
              {cardData.company && <p className="text-sm mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.company || '#6B7280'}}>{cardData.company}</p>}
              {cardData.bio && <p className="text-sm leading-relaxed whitespace-normal break-words" style={{color: cardData.textColors?.bio || '#4B5563'}}>{cardData.bio}</p>}
            </div>
          </div>
        ) : (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.name || '#111827'}}>{cardData.name || 'Your Name'}</h2>
            <p className="text-lg mb-1 whitespace-normal break-words" style={{color: cardData.textColors?.title || '#374151'}}>{cardData.title || 'Your Title'}</p>
            {cardData.company && <p className="text-sm mb-3 whitespace-normal break-words" style={{color: cardData.textColors?.company || '#6B7280'}}>{cardData.company}</p>}
            {cardData.bio && <p className="text-sm leading-relaxed whitespace-normal break-words" style={{color: cardData.textColors?.bio || '#4B5563'}}>{cardData.bio}</p>}
          </div>
        )}

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