import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <Helmet>
        <title>Page Not Found | Hash Explained</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-6xl font-bold text-gray-700 mb-4">404</div>
      <h1 className="text-xl text-gray-400 mb-2">Page Not Found</h1>
      <p className="text-gray-600 text-sm mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="px-4 py-2 rounded border border-green-500/40 text-green-400 hover:bg-green-900/30 transition-colors text-sm"
      >
        Back to Home
      </Link>
    </div>
  );
}
