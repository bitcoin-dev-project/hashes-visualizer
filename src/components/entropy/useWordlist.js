import { useEffect, useState } from 'react';

// The 2048-word list is ~13KB. Pull it in only once a mnemonic is actually
// going to be shown, so visitors to the other pages never download it.
export default function useWordlist(enabled) {
  const [wordlist, setWordlist] = useState(null);

  useEffect(() => {
    if (!enabled || wordlist) return undefined;
    let alive = true;
    import('../../lib/bip39-wordlist').then((mod) => {
      if (alive) setWordlist(mod.WORDLIST);
    });
    return () => { alive = false; };
  }, [enabled, wordlist]);

  return wordlist;
}
