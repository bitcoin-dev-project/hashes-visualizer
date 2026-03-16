export const SYSTEMS = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: '\u20bf',
    accentText: 'text-orange-400',
    accentBg: 'bg-orange-950/30',
    accentBorder: 'border-orange-500/30',
    tagline: 'Every transaction is verified by a Merkle root',
    leafLabel: 'TX',
    internalLabel: 'Hash Pair',
    rootLabel: 'Merkle Root',
    defaultLeaves: [
      'Alice \u2192 Bob: 1.5 BTC',
      'Charlie \u2192 Dave: 0.3 BTC',
      'Eve \u2192 Frank: 2.1 BTC',
      'Grace \u2192 Heidi: 0.9 BTC',
    ],
    whatIsIt:
      'Bitcoin is a decentralized digital currency. No bank or government controls it \u2014 instead, thousands of computers around the world agree on every transaction using math and cryptography.',
    howMerkle:
      'Every Bitcoin block contains hundreds of transactions. Verifying all of them is expensive. So Bitcoin hashes each transaction, then combines pairs of hashes all the way up to a single Merkle Root. This root is stored in the block header \u2014 a 32-byte fingerprint that represents every transaction in the block.\n\nA "light client" (like your phone wallet) can verify a single transaction using only ~12 hashes instead of downloading all 3,000 transactions. This is a Merkle Proof.',
    rootContext: 'The Merkle Root is stored in the Block Header alongside the nonce and timestamp. It is included in the Proof of Work hash that miners compete to find.',
    realNote: 'SPV (Simple Payment Verification) clients only need log\u2082(n) hashes to prove a transaction exists in a block \u2014 not all n transactions.',
    hashNote: 'SHA-256d (double SHA-256)',
    steps: [
      { title: 'Start with transactions', body: 'Each leaf node is a Bitcoin transaction \u2014 e.g. "Alice \u2192 Bob: 1.5 BTC". Each transaction is hashed using SHA-256 twice (SHA-256d).' },
      { title: 'Pair and combine', body: 'Adjacent transaction hashes are concatenated and hashed together to form the next level. If there\'s an odd number, the last hash is duplicated.' },
      { title: 'Build up to the root', body: 'This continues until there is only one hash left: the Merkle Root. The entire set of transactions is "summarised" in 32 bytes.' },
      { title: 'Root goes in the block header', body: 'The Merkle Root is stored in the block header. Miners hash the header repeatedly trying to find a valid block. Changing any transaction changes the root and invalidates the block.' },
    ],
  },
  {
    id: 'git',
    name: 'Git',
    symbol: '\u2387',
    accentText: 'text-red-400',
    accentBg: 'bg-red-950/30',
    accentBorder: 'border-red-500/30',
    tagline: 'Every commit is a Merkle snapshot of your codebase',
    leafLabel: 'Blob',
    internalLabel: 'Tree',
    rootLabel: 'Commit',
    defaultLeaves: [
      'main.py: print("Hello!")',
      'README.md: # My Project',
      'config.txt: port=8080',
      'tests.py: assert 1==1',
    ],
    whatIsIt:
      'Git is a version control system \u2014 a tool that saves snapshots of your code over time. Think of it as a "Save Game" button for software. Every time you commit, Git remembers exactly what every file looked like.',
    howMerkle:
      'When you make a commit, Git hashes every file\'s content into a "blob" object (the leaf nodes). It then hashes the directory listing (filenames + blob hashes) into a "tree" object (parent nodes). Finally it wraps the tree hash with your commit message and timestamp into a "commit" object \u2014 the Merkle root.\n\nBecause every commit also stores its parent\'s hash, you get an unbreakable chain. You cannot secretly alter an old file without changing every subsequent commit hash.',
    rootContext: 'The Commit Hash is what you see in "git log". It\'s the Merkle root of an entire snapshot of your codebase at that moment.',
    realNote: 'Git repositories are content-addressed: two identical files always produce the same blob hash, so Git never stores the same content twice.',
    hashNote: 'SHA-1 (older) or SHA-256',
    steps: [
      { title: 'Hash each file (blob)', body: 'Git reads each file\'s raw content and hashes it with SHA-1. This hash is the "blob" object \u2014 a leaf node in the Merkle tree. Even a single character change produces a completely different hash.' },
      { title: 'Build the tree object', body: 'Git records a "tree" object that lists every filename alongside its blob hash. The tree itself is also hashed \u2014 this is a parent node combining all the child blob hashes.' },
      { title: 'Create the commit', body: 'Git wraps the tree hash with your name, email, timestamp, and commit message, then hashes all of that. This commit hash is the Merkle root of the entire snapshot.' },
      { title: 'Chain commits together', body: 'Each commit also records its parent\'s commit hash. This creates a Merkle chain \u2014 alter any past file, and every subsequent commit hash changes too. History is tamper-proof.' },
    ],
  },
  {
    id: 'ipfs',
    name: 'IPFS',
    symbol: '\u25ce',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-950/20',
    accentBorder: 'border-cyan-500/30',
    tagline: 'Files are addressed by their content hash (CID)',
    leafLabel: 'Chunk',
    internalLabel: 'Link',
    rootLabel: 'CID',
    defaultLeaves: [
      'Chunk A: bytes 0\u2013256KB',
      'Chunk B: bytes 256\u2013512KB',
      'Chunk C: bytes 512\u2013768KB',
      'Chunk D: bytes 768\u20131024KB',
    ],
    whatIsIt:
      'IPFS (InterPlanetary File System) is a peer-to-peer network for storing and sharing files without a central server. Instead of "go to example.com and fetch file.pdf", you say "give me the file whose hash is Qm\u2026" \u2014 any peer that has it can serve it.',
    howMerkle:
      'When you add a file to IPFS, it\'s split into fixed-size chunks (~256KB). Each chunk is hashed. The hashes are combined into a Merkle DAG (Directed Acyclic Graph) all the way up to a single root hash called the CID (Content Identifier).\n\nThe CID is the address you share. Anyone can download chunks from any peer anywhere in the world and verify they\'re correct by checking the hashes. No trust required \u2014 the hash is the proof.',
    rootContext: 'The CID (Content Identifier) is the Merkle root \u2014 it\'s a self-verifying address. Two people with the same CID are guaranteed to have the exact same file.',
    realNote: 'IPFS uses a Merkle DAG rather than a strict binary tree, allowing directories to reference files that already exist in the graph \u2014 deduplication for free.',
    hashNote: 'SHA-256 (multihash)',
    steps: [
      { title: 'Split the file into chunks', body: 'Large files are split into fixed-size chunks (typically 256KB). This allows different peers to serve different parts of the same file in parallel.' },
      { title: 'Hash each chunk', body: 'Each chunk is hashed using SHA-256 (multihash). These chunk hashes are the leaf nodes of the Merkle DAG.' },
      { title: 'Combine into a DAG', body: 'Pairs of chunk hashes are combined and hashed, building up the tree. Each internal node is a "link" that references its children by their hash.' },
      { title: 'Root = your CID', body: 'The root hash of the Merkle DAG is your CID. Share it, and anyone can retrieve the file from any peer, verifying each chunk matches. Corruption is impossible to hide.' },
    ],
  },
];

export function getSystem(id) {
  return SYSTEMS.find((s) => s.id === id);
}
