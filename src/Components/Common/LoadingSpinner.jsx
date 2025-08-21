// import React from "react";

// const LoadingSpinner = ({ size = "md", text = "Loading...", color = "indigo" }) => {
//   const sizeClasses = {
//     sm: "w-4 h-4",
//     md: "w-6 h-6",
//     lg: "w-8 h-8"
//   };

//   const colorClasses = {
//     indigo: "border-indigo-500 border-t-transparent",
//     blue: "border-blue-500 border-t-transparent",
//     red: "border-red-500 border-t-transparent",
//     green: "border-green-500 border-t-transparent"
//   };

//   return (
//     <div className="flex flex-col items-center justify-center py-8">
//       <div
//         className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full animate-spin`}
//       ></div>
//       <p className="text-slate-500 mt-2 text-sm">{text}</p>
//     </div>
//   );
// };

// export default LoadingSpinner;