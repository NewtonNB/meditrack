import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const backgroundImages = [
  '/images/african-american-woman-scientist-holding-test-tube-laboratory.jpg',
  '/images/medical-doctor-girl-working-with-microscope-young-female-scientist-doing-vaccine-research.jpg',
];

export default function GuestLayout({ children }) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex(prevIndex => (prevIndex + 1) % backgroundImages.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-100 overflow-hidden">
      {/* Background images with overlay */}
      <div className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transition: 'opacity 1s ease-in-out',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-8 mx-auto">
        <div className="mb-8 text-center">
          <Link href="/">
            <ApplicationLogo className="h-20 w-20 mx-auto fill-current text-white" />
          </Link>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
