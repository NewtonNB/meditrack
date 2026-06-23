import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-5">
        <i className="bi bi-shield-x text-4xl text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 max-w-sm mb-6">
        Your account <span className="font-medium text-gray-700">({user?.role?.replace('_', ' ')})</span> doesn't
        have permission to view this page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <i className="bi bi-arrow-left mr-1" /> Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <i className="bi bi-speedometer2 mr-1" /> Dashboard
        </button>
      </div>
    </div>
  );
}
