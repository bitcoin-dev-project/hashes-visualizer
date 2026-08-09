import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

const NAV_ITEMS = [
  { path: '/sha256', label: 'SHA-256', color: 'green' },
  { path: '/merkle-tree', label: 'Merkle Tree', color: 'cyan' },
  { path: '/entropy', label: 'Entropy', color: 'yellow' },
];

const COLOR_CLASSES = {
  green:  { active: 'text-green-400 border-green-400', hover: 'hover:text-green-400/70' },
  cyan:   { active: 'text-cyan-400 border-cyan-400', hover: 'hover:text-cyan-400/70' },
  purple: { active: 'text-purple-400 border-purple-400', hover: 'hover:text-purple-400/70' },
  orange: { active: 'text-orange-400 border-orange-400', hover: 'hover:text-orange-400/70' },
  yellow: { active: 'text-yellow-400 border-yellow-400', hover: 'hover:text-yellow-400/70' },
};

export default function Layout({ children }) {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  // lg:h-screen gives desktop a definite height so pages with inner
  // overflow-auto panels scroll inside themselves instead of growing the
  // document. Mobile keeps min-h-screen and is free to grow.
  return (
    <div className="font-mono bg-black text-gray-300 min-h-screen lg:h-screen flex flex-col">
      {/* Global nav bar */}
      <nav className="border-b border-gray-800 px-3 lg:px-4 py-2 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Site name */}
          <Link 
            to="/" 
            className="text-gray-300 text-sm tracking-wide hover:text-white transition-colors whitespace-nowrap"
          >
            hashexplained<span className="text-gray-600">.com</span>
          </Link>

          {/* Center: Nav tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ path, label, color }) => {
              const isActive = location.pathname === path;
              const colors = COLOR_CLASSES[color];
              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-2 py-1 text-xs rounded border transition-all whitespace-nowrap ${
                    isActive
                      ? `${colors.active} bg-gray-900 border-current`
                      : `text-gray-500 border-transparent ${colors.hover}`
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right: Theme toggle + GitHub */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggle}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <a 
              href="https://github.com/bitcoin-dev-project/hashes-visualizer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
              title="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-xs hidden lg:inline">/hashes</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
