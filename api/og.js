const PAGES = {
  '/entropy': {
    title: 'Entropy Visualizer - Randomness to Secret Data | Hash Explained',
    description: 'Choose dice, coins, TRNG, or PRNG and watch randomness become bits and seed words.',
    image: 'https://hashexplained.com/thumbnail_entropy.png',
  },
  '/merkle-tree': {
    title: 'Merkle Tree Explorer - Interactive Visualization | Hash Explained',
    description: 'Build, tamper, and verify Merkle trees interactively. See how Bitcoin, Git, and IPFS use them.',
    image: 'https://hashexplained.com/thumbnail_merkle_tree.png',
  },
  '/sha256': {
    title: 'SHA-256 Visualizer - Step by Step | Hash Explained',
    description: 'Interactive step-by-step visualization of the SHA-256 algorithm. See every rotation, XOR, and round.',
    image: 'https://hashexplained.com/thumbnail_sha256.png',
  },
  '/': {
    title: 'Hash Explained - Interactive Cryptography Visualizers',
    description: 'Visual tools for SHA-256, Merkle trees, entropy, seed words, and signatures.',
    image: 'https://hashexplained.com/thumbnail_home.png',
  },
};

export default function handler(req, res) {
  const path = req.query.path || '/';
  const page = PAGES[path] || PAGES['/'];
  const canonical = `https://hashexplained.com${path === '/' ? '' : path}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${page.title}</title>
<meta name="description" content="${page.description}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${page.title}" />
<meta property="og:description" content="${page.description}" />
<meta property="og:site_name" content="Hash Explained" />
<meta property="og:image" content="${page.image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${page.title}" />
<meta name="twitter:description" content="${page.description}" />
<meta name="twitter:image" content="${page.image}" />
</head>
<body></body>
</html>`);
}
