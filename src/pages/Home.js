import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

function ShaVisual() {
  const bits = [
    '10110010', '01101001', '11001100', '00110110',
    '01011101', '10010111', '00101110', '11100001',
  ];

  return (
    <div className="relative h-full overflow-hidden rounded-md border border-green-500/15 bg-black/30 p-3">
      <div className="grid grid-cols-4 gap-1.5">
        {bits.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-0.5">
            {row.slice(0, 4).split('').map((bit, i) => (
              <span
                key={`${rowIdx}-${i}`}
                className={`h-4 rounded-sm border text-center font-mono text-[8px] leading-4 ${
                  bit === '1'
                    ? 'border-green-500/35 bg-green-500/15 text-green-300'
                    : 'border-gray-800 bg-gray-900/70 text-gray-600'
                }`}
              >
                {bit}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-green-500/25" />
        <span className="rounded border border-green-500/30 bg-green-950/25 px-2 py-1 font-mono text-[10px] text-green-300">
          64 rounds
        </span>
        <span className="h-px flex-1 bg-green-500/25" />
      </div>
    </div>
  );
}

function MerkleVisual() {
  return (
    <div className="relative h-full overflow-hidden rounded-md border border-cyan-500/15 bg-black/30 p-3">
      <svg viewBox="0 0 260 120" className="h-full w-full" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/35">
          <path d="M130 28L78 62M130 28l52 34M78 62L48 96M78 62l30 34M182 62l-30 34M182 62l30 34" />
        </g>
        {[
          [130, 24, 'root', 'fill-cyan-300'],
          [78, 62, 'h01', 'fill-cyan-400/80'],
          [182, 62, 'h23', 'fill-cyan-400/80'],
          [48, 96, 'tx0', 'fill-gray-500'],
          [108, 96, 'tx1', 'fill-gray-500'],
          [152, 96, 'tx2', 'fill-gray-500'],
          [212, 96, 'tx3', 'fill-gray-500'],
        ].map(([x, y, label, tone]) => (
          <g key={label}>
            <rect x={x - 18} y={y - 10} width="36" height="20" rx="4" className="fill-gray-950 stroke-cyan-500/35" />
            <text x={x} y={y + 3} textAnchor="middle" className={tone} fontFamily="monospace" fontSize="9">
              {label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MiniDie({ x, y, value }) {
  const pips = {
    1: [[0, 0]],
    2: [[-5, -5], [5, 5]],
    3: [[-5, -5], [0, 0], [5, 5]],
    4: [[-5, -5], [5, -5], [-5, 5], [5, 5]],
    5: [[-5, -5], [5, -5], [0, 0], [-5, 5], [5, 5]],
    6: [[-5, -6], [5, -6], [-5, 0], [5, 0], [-5, 6], [5, 6]],
  }[value];

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-15" y="-15" width="30" height="30" rx="4" className="fill-gray-100 stroke-gray-500/70" />
      {pips.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="2.1" className="fill-gray-900" />
      ))}
    </g>
  );
}

function EntropyVisual() {
  return (
    <div className="relative h-full overflow-hidden rounded-md border border-yellow-500/15 bg-black/30 p-3">
      <svg viewBox="0 0 260 120" className="h-full w-full" aria-hidden="true">
        <line x1="12" y1="38" x2="248" y2="38" stroke="currentColor" strokeDasharray="2 4" className="text-yellow-500/35" />
        <polyline
          points="12,42 24,20 36,55 48,30 60,34 72,64 86,54 98,26 112,50 124,28 138,68 152,62 166,36 180,46 194,24 208,60 222,34 238,39 248,70"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="text-cyan-300/85"
        />
        <MiniDie x="58" y="86" value={5} />
        <MiniDie x="98" y="86" value={2} />
        <g transform="translate(174 86)">
          <circle r="16" className="fill-yellow-400/80 stroke-yellow-200/70" />
          <circle r="9" className="fill-yellow-900/30" />
          <text y="4" textAnchor="middle" className="fill-yellow-950" fontFamily="monospace" fontSize="8" fontWeight="700">
            H
          </text>
        </g>
        <text x="214" y="91" className="fill-yellow-300" fontFamily="monospace" fontSize="10">
          256b
        </text>
      </svg>
    </div>
  );
}

function EcdsaVisual() {
  return (
    <div className="relative h-full overflow-hidden rounded-md border border-emerald-500/15 bg-black/30 p-3">
      <svg viewBox="0 0 260 120" className="h-full w-full" aria-hidden="true">
        <path
          d="M22 86 C54 18 76 18 104 86 S154 154 202 34"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-emerald-300/75"
        />
        <g className="text-gray-700" stroke="currentColor" strokeWidth="1">
          <line x1="18" y1="90" x2="238" y2="90" />
          <line x1="42" y1="16" x2="42" y2="106" />
        </g>
        <circle cx="88" cy="42" r="4" className="fill-yellow-300" />
        <circle cx="176" cy="58" r="4" className="fill-cyan-300" />
        <path d="M92 42H170" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 4" className="text-gray-500" />
        <text x="76" y="30" className="fill-yellow-300" fontFamily="monospace" fontSize="10">kG</text>
        <text x="184" y="54" className="fill-cyan-300" fontFamily="monospace" fontSize="10">sig</text>
      </svg>
    </div>
  );
}

const CARDS = [
  {
    path: '/sha256',
    title: 'SHA-256',
    color: 'green',
    tag: 'hashing',
    visual: <ShaVisual />,
  },
  {
    path: '/merkle-tree',
    title: 'Merkle Tree',
    color: 'cyan',
    tag: 'proofs',
    visual: <MerkleVisual />,
  },
  {
    path: '/entropy',
    title: 'Entropy',
    color: 'yellow',
    tag: 'randomness',
    visual: <EntropyVisual />,
  },
  {
    path: null,
    title: 'ECDSA',
    color: 'emerald',
    disabled: true,
    tag: 'signatures',
    visual: <EcdsaVisual />,
  },
];

const COLOR_MAP = {
  green: {
    border: 'border-green-500/25 hover:border-green-500/55',
    bg: 'hover:bg-green-950/20',
    title: 'text-green-300',
    detail: 'text-green-500/65',
    glow: 'hover:shadow-green-500/10',
  },
  cyan: {
    border: 'border-cyan-500/25 hover:border-cyan-500/55',
    bg: 'hover:bg-cyan-950/20',
    title: 'text-cyan-300',
    detail: 'text-cyan-500/65',
    glow: 'hover:shadow-cyan-500/10',
  },
  yellow: {
    border: 'border-yellow-500/25 hover:border-yellow-500/55',
    bg: 'hover:bg-yellow-950/20',
    title: 'text-yellow-300',
    detail: 'text-yellow-500/70',
    glow: 'hover:shadow-yellow-500/10',
  },
  emerald: {
    border: 'border-emerald-500/25',
    bg: '',
    title: 'text-emerald-300',
    detail: 'text-emerald-500/65',
    glow: '',
  },
};

function ConceptCard({ card }) {
  const { path, title, color, tag, visual, disabled } = card;
  const c = COLOR_MAP[color];
  const body = (
    <>
      <div className="h-36 sm:h-40">{visual}</div>
      <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`text-base font-bold tracking-wide ${c.title}`}>{title}</h2>
          <div className={`mt-1 font-mono text-[9px] uppercase tracking-widest ${c.detail}`}>
            {tag}
          </div>
        </div>
        <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-widest ${
          disabled ? 'border-gray-800 text-gray-600' : 'border-gray-700 text-gray-500 group-hover:border-current group-hover:text-current'
        }`}>
          {disabled ? 'soon' : '→'}
        </span>
      </div>
    </>
  );

  const className = `group block rounded-lg border bg-gray-900/45 p-4 shadow-xl shadow-black/25 transition-all duration-200 ${c.border} ${c.bg} ${c.glow}`;

  if (disabled) {
    return <div className={`${className} cursor-default opacity-60`}>{body}</div>;
  }

  return (
    <Link to={path} className={className}>
      {body}
    </Link>
  );
}

export default function Home() {
  return (
    <div className="flex-1 overflow-auto px-4 py-8 lg:px-6 lg:py-12">
      <Helmet>
        <title>Hash Explained - Interactive Cryptography Visualizers</title>
        <meta name="description" content="Interactive visual explanations of cryptography concepts: SHA-256, Merkle trees, entropy sources, BIP-39 mnemonics, and digital signatures." />
        <link rel="canonical" href="https://hashexplained.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hashexplained.com/" />
        <meta property="og:title" content="Hash Explained - Interactive Cryptography Visualizers" />
        <meta property="og:description" content="Learn cryptography by watching the moving parts: hashes, Merkle proofs, entropy, seed words, and signatures." />
        <meta property="og:site_name" content="Hash Explained" />
        <meta property="og:image" content="https://hashexplained.com/thumbnail_home.png" />
        <meta property="og:image:alt" content="Hash Explained: Interactive Cryptography Visualizers" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hash Explained - Interactive Cryptography Visualizers" />
        <meta name="twitter:description" content="Visual, step-by-step explanations of hashes, Merkle proofs, entropy, seed words, and signatures." />
        <meta name="twitter:image" content="https://hashexplained.com/thumbnail_home.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Hash Explained',
          description: 'Interactive visual explanations of cryptography concepts including SHA-256, Merkle trees, entropy sources, BIP-39 mnemonics, and digital signatures.',
          url: 'https://hashexplained.com',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          featureList: [
            'SHA-256 algorithm visualization',
            'Merkle tree builder and verifier',
            'Entropy and BIP-39 mnemonic visualization',
            'Digital signature visual explanations',
          ],
        })}</script>
      </Helmet>

      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center">
        <header className="mb-7 max-w-3xl">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-gray-600">
            Interactive cryptography
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white lg:text-4xl">
            Cryptography,<br className="hidden sm:block" /> made visible.
          </h1>
        </header>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS.map((card) => (
            <ConceptCard key={card.title} card={card} />
          ))}
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4 text-[10px] text-gray-700">
          <span>Built for learning.</span>
          <span>Simulated examples only.</span>
        </footer>
      </div>
    </div>
  );
}
