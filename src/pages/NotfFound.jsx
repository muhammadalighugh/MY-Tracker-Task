import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-rose-100 rounded-full">
              <AlertCircle size={48} className="text-rose-600" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Page Not Found</h1>
          
          {/* Description */}
          <p className="text-slate-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered an incorrect URL.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
            
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Home size={18} />
              Home
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Need help?{" "}
            <a 
              href="mailto:info@amigsol.com" 
              className="text-indigo-600 hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;