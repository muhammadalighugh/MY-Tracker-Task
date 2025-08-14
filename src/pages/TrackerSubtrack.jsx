// import React from "react";
// import { useParams } from "react-router-dom";
// import { useSidebar } from "../context/SidebarContext";

// export default function TrackerSubtrack() {
//   const { trackerId } = useParams(); // Get tracker ID from URL
//   const { collapsed } = useSidebar();

//   return (
//     <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
//       <main className="p-6 md:p-8">
//         <h1 className="text-3xl font-bold text-slate-900 mb-8">Tracker: {trackerId}</h1>
//         <div className="bg-white p-6 rounded-xl border border-slate-200">
//           <p className="text-slate-600">This is the subtrack page for tracker ID: {trackerId}</p>
//           <p className="text-slate-600">Replace this with actual subtrack content.</p>
//         </div>
//       </main>
//     </div>
//   );
// }