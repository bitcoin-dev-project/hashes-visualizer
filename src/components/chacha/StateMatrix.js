import React from 'react';
import { byteHex, serializeWords, wordHex } from '../../lib/chacha20';

export function wordSource(index) {
  if (index < 4)
    return {
      name: 'constant',
      tone: 'neutral',
      detail: 'Fixed, public words from the ASCII text “expand 32-byte k”.',
    };
  if (index < 12)
    return {
      name: `key ${index - 4}`,
      tone: 'key',
      detail: 'Four bytes of the secret key, read as one little-endian word.',
    };
  if (index === 12)
    return {
      name: 'counter',
      tone: 'counter',
      detail: 'The block number. Increase it for each new 64-byte block within this message.',
    };
  return {
    name: `nonce ${index - 13}`,
    tone: 'nonce',
    detail:
      'Four bytes of the public nonce. Use a different nonce for each new message under the same key.',
  };
}

export default function StateMatrix({
  words,
  active = [],
  selected,
  onSelect,
  initial,
  isInitial,
}) {
  return (
    <>
      <div className="cc-matrix" aria-label="ChaCha20 state: sixteen 32-bit words">
        {words.map((word, i) => {
          const source = wordSource(i);
          const slot = active.indexOf(i);
          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelect(i)}
              className={`cc-word cc-tone-${source.tone} ${active.length && slot < 0 ? 'cc-word-muted' : ''} ${slot >= 0 ? 'cc-word-active' : ''} ${selected === i ? 'cc-word-selected' : ''}`}
              aria-label={`Word ${i}, ${source.name}, ${wordHex(word)}${slot >= 0 ? `, ${'abcd'[slot]}` : ''}`}
              aria-pressed={selected === i}
            >
              <span className="cc-word-label">
                <span>{String(i).padStart(2, '0')}</span>
                <span>{slot >= 0 ? `${'abcd'[slot]} · ${source.name}` : source.name}</span>
              </span>
              <strong>{wordHex(word)}</strong>
              <span className="cc-word-caption">
                {isInitial ? '32 bits' : word === initial[i] ? 'unchanged' : 'mixed value'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="cc-legend">
        <span className="cc-tone-neutral">● Constants</span>
        <span className="cc-tone-key">● Secret key</span>
        <span className="cc-tone-counter">● Counter</span>
        <span className="cc-tone-nonce">● Nonce</span>
      </div>
      <div className="cc-word-inspector">
        <span className={`cc-tone-${wordSource(selected).tone}`}>word[{selected}]</span>
        <strong>{wordHex(words[selected])}</strong>
        <span>→ bytes</span>
        <code>{Array.from(serializeWords([words[selected]]), byteHex).join(' ')}</code>
        <span className="cc-muted">little-endian</span>
      </div>
    </>
  );
}
