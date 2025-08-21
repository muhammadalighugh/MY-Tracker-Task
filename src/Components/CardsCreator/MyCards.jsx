// MyCards.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Copy, Download, Trash2, Edit, Eye, X, Share2, BarChart3, Users, MousePointer } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { renderCard } from './renderCard';

function MyCards({ cards, setCards }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const qrCodeRef = useRef(null);

  useEffect(() => {
    if (selectedCard && qrCodeRef.current) {
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

  const editCard = (card) => {
    // Note: To edit, we would set formData in CreateCard, but since separate, perhaps navigate or pass prop. For now, alert.
    alert('Switch to Create tab and select card to edit.');
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
    localStorage.setItem('cards', JSON.stringify(updatedCards));
  };

  const deleteCard = (cardId) => {
    if (window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      localStorage.setItem('cards', JSON.stringify(updatedCards));
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
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyLink = (shortLink) => {
    const link = `${window.location.origin}/dashboard/card/${shortLink}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
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
            onClick={() => {} } // Switch to create tab
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyLink(selectedCard.shortLink)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
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
  );
}

export default MyCards;