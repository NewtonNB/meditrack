import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function ThemeToggle({ currentTheme = 'light', onThemeChange }) {
  const [theme, setTheme] = useState(currentTheme);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor },
  ];

  const applyTheme = newTheme => {
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark');

    if (newTheme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(newTheme);
    }

    // Store in localStorage
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = newTheme => {
    setTheme(newTheme);
    applyTheme(newTheme);

    // Call parent callback if provided
    if (onThemeChange) {
      onThemeChange(newTheme);
    }

    // Send to server if user is authenticated
    if (window.route && route().current() !== 'login' && route().current() !== 'register') {
      fetch(route('profile.theme.set'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(console.error);
    }
  };

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || currentTheme;
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes when auto is selected
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const currentThemeConfig = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentThemeConfig.icon;

  return (
    <div className="relative">
      {/* Simple toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.value === theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          handleThemeChange(themes[nextIndex].value);
        }}
        className="p-2"
        title={`Current theme: ${currentThemeConfig.label}. Click to cycle.`}
      >
        <CurrentIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Dropdown version for more control
export function ThemeDropdown({ currentTheme = 'light', onThemeChange }) {
  const [theme, setTheme] = useState(currentTheme);
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor },
  ];

  const applyTheme = newTheme => {
    document.documentElement.classList.remove('light', 'dark');

    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(newTheme);
    }

    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = newTheme => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setIsOpen(false);

    if (onThemeChange) {
      onThemeChange(newTheme);
    }

    if (window.route && route().current() !== 'login' && route().current() !== 'register') {
      fetch(route('profile.theme.set'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(console.error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || currentTheme;
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const currentThemeConfig = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentThemeConfig.icon;

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="p-2">
        <CurrentIcon className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {themes.map(themeOption => {
                const Icon = themeOption.icon;
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => handleThemeChange(themeOption.value)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === themeOption.value
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{themeOption.label}</span>
                    {theme === themeOption.value && (
                      <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
