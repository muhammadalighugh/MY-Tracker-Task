// // CardMain.jsx
// import React, { useState, useEffect } from 'react';
// import { Eye, Grid, BarChart3, Plus } from 'lucide-react';
// import CreateCard from './CreateCard';
// import MyCards from './MyCards';
// import Templates from './Templates';
// import Analytics from './Analytics';

// function CardMain() {
//   const [activeTab, setActiveTab] = useState('create');
//   const [cards, setCards] = useState([]);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

//   useEffect(() => {
//     const loadCards = () => {
//       const storedCards = JSON.parse(localStorage.getItem('cards')) || [];
//       setCards(storedCards);
//     };

//     loadCards();
    
//     const handleStorageChange = () => {
//       loadCards();
//     };

//     window.addEventListener('storage', handleStorageChange);
    
//     const interval = setInterval(loadCards, 1000);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       clearInterval(interval);
//     };
//   }, []);

//   useEffect(() => {
//     const checkSidebarState = () => {
//       const collapsed = localStorage.getItem('collapsed') === 'true';
//       setSidebarCollapsed(collapsed);
//     };

//     checkSidebarState();
    
//     const handleStorageChange = () => {
//       checkSidebarState();
//     };

//     window.addEventListener('storage', handleStorageChange);
    
//     const interval = setInterval(checkSidebarState, 100);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       clearInterval(interval);
//     };
//   }, []);

//   const getResponsiveMargins = () => {
//     if (typeof window === 'undefined') return 'ml-0';
    
//     const isLargeScreen = window.innerWidth >= 1024;
//     if (!isLargeScreen) return 'ml-0';
    
//     return sidebarCollapsed ? 'ml-20' : 'ml-64';
//   };

//   return (
//     <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${getResponsiveMargins()}`}>
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-2 bg-indigo-50 rounded-full">
//                 <Eye className="text-indigo-600" size={20} />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Digital Business Cards</h1>
//                 <p className="text-sm text-gray-500 mt-1">Craft and manage professional connections</p>
//               </div>
//             </div>
            
//             {/* Tab Navigation */}
//             <nav className="flex items-center gap-2 bg-transparent border-b border-gray-200">
//               {[
//                 { id: 'create', label: 'Create', icon: Plus },
//                 { id: 'cards', label: 'My Cards', icon: Eye },
//                 { id: 'templates', label: 'Templates', icon: Grid },
//                 { id: 'analytics', label: 'Analytics', icon: BarChart3 }
//               ].map((tab) => {
//                 const IconComp = tab.icon;
//                 return (
//                   <button
//                     key={tab.id}
//                     onClick={() => setActiveTab(tab.id)}
//                     className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
//                       activeTab === tab.id
//                         ? 'text-indigo-600 border-b-2 border-indigo-600'
//                         : 'text-gray-600 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-200'
//                     }`}
//                   >
//                     <IconComp size={16} />
//                     <span>{tab.label}</span>
//                   </button>
//                 );
//               })}
//             </nav>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
//         {activeTab === 'create' && <CreateCard cards={cards} setCards={setCards} />}
//         {activeTab === 'cards' && <MyCards cards={cards} setCards={setCards} />}
//         {activeTab === 'templates' && <Templates setActiveTab={setActiveTab} />}
//         {activeTab === 'analytics' && <Analytics cards={cards} />}
//       </div>
//     </div>
//   );
// }

// export default CardMain;

import React from "react";
import { useSidebar } from "../../context/SidebarContext";
import { Clock, Mail } from "lucide-react";

export default function CardMain() {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        collapsed ? "ml-20" : "ml-64"
      } p-6`}
    >
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <Clock size={64} className="text-indigo-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          This Service Coming Soon
        </h1>
        <p className="text-slate-500 max-w-md mb-4">
          We’re working hard to bring you amazing new features and services. Stay tuned!
        </p>

        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Mail size={18} className="text-indigo-500" />
          <span>
            For feedback, write to{" "}
            <a
              href="mailto:info@amigsol.com"
              className="text-indigo-600 font-medium hover:underline"
            >
              info@amigsol.com
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

