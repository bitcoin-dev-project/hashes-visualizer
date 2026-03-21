const BOTS = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Googlebot|bingbot|yandex|embedly|showyoubot|outbrain|pinterest|vkShare|W3C_Validator|redditbot/i;

const PAGES = {
  '/merkle-tree': {
    title: 'Merkle Tree Explorer - Interactive Visualization | Hash Explained',
    description: 'Build, tamper, and verify Merkle trees interactively. See how Bitcoin, Git, and IPFS use them.',
    image: 'https://hashexplained.com/thubmnail_merkle.png',
  },
  '/sha256': {
    title: 'SHA-256 Visualizer - Step by Step | Hash Explained',
    description: 'Interactive step-by-step visualization of the SHA-256 algorithm. See every rotation, XOR, and round.',
    image: 'https://hashexplained.com/social.png',
  },
  '/': {
    title: 'Hash Explained - Interactive Cryptographic Hash Visualizers',
    description: 'Interactive step-by-step visualizations of SHA-256, the avalanche effect, and Merkle trees. See every rotation, XOR, and round of cryptographic hash algorithms.',
    image: 'https://hashexplained.com/social.png',
  },
};

export default function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  if (!BOTS.test(userAgent)) {
    return; // Not a bot, pass through to SPA
  }

  const url = new URL(request.url);
  const page = PAGES[url.pathname] || PAGES['/'];
  const canonical = `https://hashexplained.com${url.pathname === '/' ? '' : url.pathname}`;

  const html = `<!DOCTYPE html>
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
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/', '/sha256', '/merkle-tree'],
};
