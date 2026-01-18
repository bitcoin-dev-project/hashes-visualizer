# SHA-256 Visualizer

> 🚧 **Disclaimer:** This visualizer is educational and should not be treated as a reference implementation for cryptographic correctness. Parts of the codebase are vibe-coded and AI-assisted.

![SHA-256 Visualizer](public/demo.gif)

An animated, step-by-step visualizer for SHA-256.

Try it: [hashexplained.com](https://hashexplained.com)

A tool that lets you watch SHA-256 execute step by step. Every phase is animated:

- Padding
- Message schedule
- 64 compression rounds
- Final hash

Limitations: Currently supports messages up to 55 characters (single block) and SHA-256 only. Multi-block hashing and other algorithms (SHA-1, SHA-512, RIPEMD-160, etc.) can be added if there's interest.

Reference: [NIST FIPS 180-4: Secure Hash Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)

## Run Locally

```bash
npm install
npm start
```

MIT License
