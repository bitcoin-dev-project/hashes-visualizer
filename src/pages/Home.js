import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const CARDS = [
  {
    path: '/sha256',
    title: 'SHA-256',
    color: 'green',

    description: 'The gold standard of cryptographic hashing. Used in Bitcoin, TLS, and digital signatures.',
    details: '256-bit digest · 64 rounds · Merkle-Damgård',
    icon: (
      <div className="font-mono text-[10px] leading-tight opacity-60 space-y-0.5">
        <div>01101000 01100001</div>
        <div>10011011 10110110</div>
        <div>01111010 11000000</div>
      </div>
    ),
  },
];

const COLOR_MAP = {
  green:  {
    border: 'border-green-500/30 hover:border-green-500/60',
    bg: 'hover:bg-green-950/30',
    title: 'text-green-400',
    badge: 'bg-green-900/50 text-green-400 border-green-500/40',
    detail: 'text-green-500/60',
    glow: 'hover:shadow-green-500/10',
  },
};

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 lg:py-16 overflow-auto">
      <Helmet>
        <title>Hash Explained - Interactive Cryptographic Hash Visualizers</title>
        <meta name="description" content="Interactive step-by-step visualizations of SHA-256, the avalanche effect, and Merkle trees. See every rotation, XOR, and round of cryptographic hash algorithms." />
        <link rel="canonical" href="https://hashexplained.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hashexplained.com/" />
        <meta property="og:title" content="Hash Explained - Interactive Cryptographic Hash Visualizers" />
        <meta property="og:description" content="Interactive step-by-step visualizations of SHA-256, the avalanche effect, and Merkle trees. See every rotation, XOR, and round of cryptographic hash algorithms." />
        <meta property="og:site_name" content="Hash Explained" />
        <meta property="og:image" content="https://hashexplained.com/social.png" />
        <meta property="og:image:alt" content="Hash Explained: Interactive Hash Visualizers" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hash Explained - Interactive Cryptographic Hash Visualizers" />
        <meta name="twitter:description" content="Interactive step-by-step visualizations of SHA-256, the avalanche effect, and Merkle trees." />
        <meta name="twitter:image" content="https://hashexplained.com/social.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Hash Explained",
          "description": "Interactive step-by-step visualizations of cryptographic hash algorithms including SHA-256, avalanche effect, and Merkle trees.",
          "url": "https://hashexplained.com",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "featureList": [
            "SHA-256 algorithm visualization",
            "Avalanche effect demonstration",
            "Merkle tree builder and verifier",
            "Step-by-step hash computation"
          ]
        })}</script>
      </Helmet>

      {/* Hero */}
      <div className="max-w-2xl text-center mb-12 lg:mb-16">
        <h1 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-4">
          Cryptographic hashing,<br />
          <span className="text-green-400">bit by bit.</span>
        </h1>
        <p className="text-gray-500 text-sm lg:text-base leading-relaxed max-w-lg mx-auto">
          Interactive step-by-step visualizations of how hash algorithms really work. 
          See every rotation, every XOR, every round.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 max-w-4xl w-full">
        {CARDS.map(({ path, title, color, description, details, icon }) => {
          const c = COLOR_MAP[color];

          return (
            <Link
              key={path}
              to={path}
              className={`group relative block rounded-lg border p-5 transition-all duration-200 hover:shadow-lg ${c.border} ${c.bg} ${c.glow}`}
            >
              {/* Icon area */}
              <div className="mb-4 h-12 flex items-center">
                {icon}
              </div>

              {/* Title */}
              <h2 className={`text-lg font-bold mb-1 ${c.title}`}>
                {title}
              </h2>

              {/* Details line */}
              <div className={`text-[10px] font-mono mb-3 ${c.detail}`}>
                {details}
              </div>

              {/* Description */}
              <p className="text-gray-500 text-xs leading-relaxed">
                {description}
              </p>

              {/* Bottom arrow hint */}
              <div className={`mt-4 text-xs ${c.title} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Explore →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-600 text-xs space-y-2">
        <p>
          Reference: <a href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400 underline">NIST FIPS 180-4</a>
        </p>
        <p className="text-gray-700">
          Open source · Built for learning
        </p>
      </div>
    </div>
  );
}
