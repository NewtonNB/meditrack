import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-blue-600">404</p>
        <p className="text-2xl font-semibold text-gray-800 mt-4">Page not found</p>
        <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
