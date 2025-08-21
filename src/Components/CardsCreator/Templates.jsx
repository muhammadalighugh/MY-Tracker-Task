import React from 'react';
import { ExternalLink } from 'lucide-react';
import { linkTypes, banners, cardWidths, hexToRgba } from './renderCard';

const templates = [
  { 
    id: 'modern', 
    name: 'Modern Professional', 
    preview: 'Clean lines, centered layout', 
    config: { 
      template: 'modern', 
      banner: 'gradient-blue', 
      colors: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' }, 
      cardWidth: 'sm',
      textColors: { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
      glassEffect: false,
      cardBackgroundMode: 'whole',
      contentBgType: 'color',
      contentBgColor: '#FFFFFF',
      layout: 'centered'
    } 
  },
  { 
    id: 'creative', 
    name: 'Creative Bold', 
    preview: 'Vibrant colors, artistic layout', 
    config: { 
      template: 'creative', 
      banner: 'gradient-orange', 
      colors: { primary: '#EF4444', secondary: '#B91C1C', accent: '#F87171' }, 
      cardWidth: 'md', 
      glassEffect: true,
      textColors: { name: '#111827', title: '#374151', company: '#6B7280', bio: '#4B5563' },
      cardBackgroundMode: 'whole',
      contentBgType: 'color',
      contentBgColor: '#FFFFFF',
      layout: 'left'
    } 
  },
  
];

function renderTemplateCard(cardData) {
  const selectedBanner = banners.find(b => b.id === cardData.banner);
  const bannerClass = selectedBanner?.class || '';
  const cardWidthClass = cardWidths.find(w => w.id === cardData.cardWidth)?.class || 'max-w-sm';
  const glassClass = cardData.glassEffect ? 'backdrop-blur-md bg-white/30' : '';
  const contentBg = cardData.contentBgType === 'transparent' ? 'transparent' : cardData.contentBgColor;
  let contentBgStyle = { backgroundColor: contentBg };
  if (cardData.glassEffect && contentBg !== 'transparent') {
    contentBgStyle.backgroundColor = hexToRgba(contentBg, 0.7);
  }
  const contentClass = cardData.glassEffect ? 'backdrop-blur-md' : '';

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

  const sampleLinks = [
    { id: '1', type: 'website', url: 'https://example.com', label: 'My Website', color: cardData.colors.primary, displayMode: 'both' },
    { id: '2', type: 'email', url: 'mailto:example@email.com', label: 'Email Me', color: cardData.colors.primary, displayMode: 'both' }
  ];

  const isLeftLayout = cardData.layout === 'left';

  return (
    <div className={`mx-auto rounded-2xl overflow-hidden transition-all duration-300 ${cardWidthClass} ${templateClass} ${glassClass}`}>
      <div className={`h-24 ${bannerClass}`}></div>
      <div className={`p-6 ${contentClass}`} style={contentBgStyle}>
        {isLeftLayout ? (
          <div className="flex items-start gap-4 mb-4">
            <img
              src="https://via.placeholder.com/80"
              alt="Sample Profile"
              className="w-20 h-20 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold whitespace-normal break-words" style={{ color: cardData.textColors?.name || '#111827' }}>
                Sample Name
              </h2>
              <p className="text-base whitespace-normal break-words" style={{ color: cardData.textColors?.title || '#374151' }}>
                Sample Title
              </p>
              <p className="text-sm whitespace-normal break-words" style={{ color: cardData.textColors?.company || '#6B7280' }}>
                Sample Company
              </p>
              <p className="text-sm leading-relaxed whitespace-normal break-words mt-2" style={{ color: cardData.textColors?.bio || '#4B5563' }}>
                Sample Bio
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center mb-4">
            <img
              src="https://via.placeholder.com/80"
              alt="Sample Profile"
              className="w-20 h-20 rounded-full border-2 border-white shadow-sm object-cover mx-auto mb-2"
            />
            <h2 className="text-xl font-bold whitespace-normal break-words" style={{ color: cardData.textColors?.name || '#111827' }}>
              Sample Name
            </h2>
            <p className="text-base whitespace-normal break-words" style={{ color: cardData.textColors?.title || '#374151' }}>
              Sample Title
            </p>
            <p className="text-sm whitespace-normal break-words" style={{ color: cardData.textColors?.company || '#6B7280' }}>
              Sample Company
            </p>
            <p className="text-sm leading-relaxed whitespace-normal break-words mt-2" style={{ color: cardData.textColors?.bio || '#4B5563' }}>
              Sample Bio
            </p>
          </div>
        )}
        <div className="space-y-2">
          {sampleLinks.map((link) => {
            const linkType = linkTypes.find(lt => lt.id === link.type);
            const IconComp = linkType?.icon || Globe;
            const linkColor = link.color || cardData.colors?.primary || '#3B82F6';
            const linkStyle = {
              borderColor: hexToRgba(linkColor, 0.2),
              backgroundColor: hexToRgba(linkColor, 0.08),
              color: cardData.textColors?.name || '#111827'
            };

            return (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border hover:shadow-sm transition-all"
                style={linkStyle}
              >
                <div className="flex items-center gap-2">
                  <IconComp size={18} style={{ color: linkColor }} />
                  <span className="text-sm font-medium">{link.label}</span>
                </div>
                <ExternalLink size={14} className="opacity-50" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Templates({ setActiveTab }) {
  const handleTemplateSelect = (templateConfig) => {
    localStorage.setItem('selectedTemplate', JSON.stringify(templateConfig));
    setActiveTab('create');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleTemplateSelect(template.config)}
        >
          <div className="p-4">
            {renderTemplateCard(template.config)}
          </div>
          <div className="p-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-500">{template.preview}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Templates;