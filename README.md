# Hash Explained

Interactive visual tools for understanding cryptography.

[Try it live](https://hashexplained.com)

![SHA-256 Visualizer](public/demo.gif)

> Educational only. This project is for learning and visual intuition, not for generating real wallet seed phrases or serving as a reference implementation.

## What's Included

- **Entropy Visualizer**: compare dice, coin flips, TRNG-style noise, and PRNG output, then see how entropy becomes BIP-39 seed words.
- **SHA-256 Visualizer**: watch padding, message schedule, compression rounds, and the final digest step by step.
- **Merkle Tree Explorer**: build a tree, tamper with leaves, and follow the proof path up to the root.

## New: Entropy Visualizer

The Entropy tool shows where randomness actually comes from and what happens to it between source and mnemonic. It is meant to make the difference between physical entropy, PRNG output, hashing, checksums, and BIP-39 word selection easier to see.

[Open Entropy Visualizer](https://hashexplained.com/entropy)

## Tools

| Tool | What It Shows |
| --- | --- |
| [Entropy](https://hashexplained.com/entropy) | Dice, coins, TRNG, and PRNG sources becoming BIP-39 seed words |
| [SHA-256](https://hashexplained.com/sha256) | Padding, message schedule, compression rounds, and the final digest |
| [Merkle Tree](https://hashexplained.com/merkle-tree) | Leaves hashing upward into a root, with a highlighted proof path |


## Run Locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Notes

- Simulated inputs are for education only.
- The entropy page is not a wallet generator.
- Some visualizations intentionally simplify implementation details so the core operation is easier to inspect.

MIT License
