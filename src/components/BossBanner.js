import React, { useState } from 'react';

const BANNER_KEY = 'hashexplained-boss-banner';

export default function BossBanner() {
  const [showBanner, setShowBanner] = useState(() => {
    try {
      return window.sessionStorage.getItem(BANNER_KEY) !== 'hidden';
    } catch {
      return true;
    }
  });

  const handleClose = () => {
    setShowBanner(false);
    try {
      window.sessionStorage.setItem(BANNER_KEY, 'hidden');
    } catch {
      // Dismiss for this visit even when browser storage is unavailable.
    }
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="BOSS Challenge"
      className="sticky top-0 z-[60] flex min-h-[4rem] w-full shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-3 py-3 font-mono lg:px-4"
    >
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-4">
        <span className="text-sm font-semibold tracking-wide text-green-300">
          ₿OSS CHALLENGE
        </span>
        <p className="col-span-2 row-start-2 text-sm leading-relaxed text-gray-400">
          Start your career in bitcoin open source.
        </p>
        <a
          href="https://bosschallenge.xyz"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClose}
          aria-label="Apply for the BOSS Challenge"
          className="col-start-2 row-start-1 whitespace-nowrap rounded-sm text-sm text-green-300 underline underline-offset-4 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
        >
          Apply today
        </a>
      </div>
      <button
        type="button"
        aria-label="Dismiss BOSS Challenge banner"
        onClick={handleClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
  );
}
