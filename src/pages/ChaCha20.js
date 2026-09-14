import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import StateMatrix, { wordSource } from '../components/chacha/StateMatrix';
import QuarterRound from '../components/chacha/QuarterRound';
import AuthenticationDemo from '../components/chacha/AuthenticationDemo';
import {
  byteHex,
  bytesToHex,
  chacha20,
  chacha20Block,
  DEMO_KEY,
  DEMO_NONCE,
  hexToBytes,
  RFC_MESSAGE,
  serializeWords,
  wordHex,
} from '../lib/chacha20';
import './ChaCha20.css';

const STAGES = [
  { start: 0, label: 'Build state', title: 'Start with sixteen words.' },
  { start: 1, label: 'Mix 20 rounds', title: 'Small operations. Thorough mixing.' },
  { start: 81, label: 'Add original', title: 'Add the starting state back.' },
  { start: 82, label: 'Make bytes', title: 'Your 64-byte keystream block.' },
  { start: 83, label: 'XOR message', title: 'Now the message enters.' },
];
const DEFAULT_MESSAGE = 'Meet me at the moon.';
const LAST_STEP = 83;
const binaryByte = (value) => value.toString(2).padStart(8, '0');

function ByteGrid({ bytes, selected, onSelect, used = bytes.length }) {
  return (
    <div className="cc-byte-grid">
      {Array.from(bytes, (byte, i) => (
        <button
          type="button"
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Byte ${i}: ${byteHex(byte)}${i >= used ? ', unused' : ''}`}
          aria-pressed={selected === i}
          className={`${selected === i ? 'is-active' : ''} ${i >= used ? 'cc-byte-unused' : ''}`}
        >
          <small>{String(i).padStart(2, '0')}</small>
          {byteHex(byte)}
        </button>
      ))}
    </div>
  );
}

function Explanation({ stage, selectedWord, quarter, operation, onOperation, counter }) {
  return (
    <>
      {stage === 0 && (
        <>
          <h3>Build the starting state</h3>
          <p>The key, nonce, and counter fill the matrix. The message joins later, through XOR.</p>
          <dl className="cc-input-explainer">
            <div>
              <dt className="cc-tone-key">Key</dt>
              <dd>A secret shared by sender and receiver.</dd>
            </div>
            <div>
              <dt className="cc-tone-nonce">Nonce</dt>
              <dd>Use a new value for each message with the same key.</dd>
            </div>
            <div>
              <dt className="cc-tone-counter">Counter</dt>
              <dd>This block’s number: {counter}.</dd>
            </div>
          </dl>
          <details className="cc-more">
            <summary>Learn more</summary>
            <h3>What is a word?</h3>
            <p>
              One word is 32 bits: four bytes, shown as eight hex digits. The 16 words make a
              64-byte state.
            </p>
            <p>
              <strong>Word {selectedWord}:</strong> {wordSource(selectedWord).detail}
            </p>
            <h3>Why do the bytes look reversed?</h3>
            <p>
              Little-endian puts the least significant byte first. Bytes <code>00 01 02 03</code>{' '}
              become the word <code>03020100</code>; writing it back restores the same bytes.
            </p>
            <h3>ChaCha, ChaCha20, or SHA-256?</h3>
            <p>
              ChaCha is the family; ChaCha20 uses 20 mixing rounds. This page uses the IETF variant.
              Unlike a <Link to="/sha256">SHA-256 fingerprint</Link>, encryption can be undone with
              the key.
            </p>
            <h3>Try changing an input</h3>
            <p>
              The same key, nonce, and counter always produce the same stream. Changing just the
              message leaves that stream unchanged. A real key must be unpredictable and secret.
            </p>
          </details>
        </>
      )}
      {stage === 1 && (
        <>
          <h3>
            {quarter.kind} round {quarter.round} of 20
          </h3>
          <p>
            {quarter.kind === 'Column'
              ? 'Mix the four highlighted words down a column.'
              : 'Mix the four highlighted words along a wrapping diagonal.'}
          </p>
          <QuarterRound quarter={quarter} operation={operation} onOperation={onOperation} />
          <details className="cc-more">
            <summary>Why 20 rounds?</summary>
            <p>
              10 column rounds + 10 diagonal rounds = 20 rounds. Each contains four quarter rounds,
              so there are 80 in total.
            </p>
            <p>
              Every quarter round uses the same addition, XOR, and rotation recipe. Switching
              between columns and diagonals mixes words across the state. Colors continue to
              identify each word’s original input.
            </p>
          </details>
        </>
      )}
      {stage === 2 && (
        <>
          <h3>Add matching words</h3>
          <p>
            Add each mixed word to its original value, keeping the lowest 32 bits. Select a cell to
            inspect its sum.
          </p>
          <details className="cc-more">
            <summary>Learn more</summary>
            <p>
              This step is called <strong>feed-forward</strong>. The rounds change a working copy;
              the original state is saved for these 16 additions.
            </p>
            <p>
              Each sum wraps modulo 2³²: discard any carry above bit 31. This happens once, after
              all 20 rounds.
            </p>
          </details>
        </>
      )}
      {stage === 3 && (
        <>
          <h3>Words become a stream</h3>
          <p>Write each word as four little-endian bytes. The 16 words give 64 keystream bytes.</p>
          <details className="cc-more">
            <summary>Learn more</summary>
            <p>
              Read words 0 through 15 in order, writing each one’s least significant byte first.
            </p>
            <p>
              Sender and receiver generate the same stream using the same key, nonce, and counter.
            </p>
            <h3>Messages longer than 64 bytes</h3>
            <p>
              Increase the counter and run the block function again. Join the blocks, using only the
              bytes the message needs. No message padding is required.
            </p>
          </details>
        </>
      )}
      {stage === 4 && (
        <>
          <h3>The same XOR works both ways</h3>
          <p>
            XOR each message byte with a stream byte. XOR with that stream again to recover the
            message.
          </p>
          <div className="cc-formula">
            <span>ENCRYPT</span>
            <code>plaintext ⊕ stream = ciphertext</code>
            <span>DECRYPT</span>
            <code>ciphertext ⊕ stream = plaintext</code>
          </div>
          <details className="cc-more">
            <summary>Learn more</summary>
            <p>
              <code>(P ⊕ K) ⊕ K = P</code>: XORing the same value twice cancels it. Decryption
              regenerates the stream; it does not reverse the rounds.
            </p>
            <p>The ciphertext has exactly the same byte length as the message.</p>
            <h3>Never repeat the stream</h3>
            <p>
              Never reuse a nonce for a different message under the same key. Repeating the stream
              reveals <code>C₁ ⊕ C₂ = P₁ ⊕ P₂</code>.
            </p>
            <p>
              Encryption alone does not detect changes. The optional Poly1305 demo below shows how
              authentication adds this check.
            </p>
          </details>
        </>
      )}
    </>
  );
}

function XorMessage({
  plaintext,
  ciphertext,
  stream,
  offset,
  selectedByte,
  onSelect,
  decrypt,
  onDecrypt,
}) {
  const length = Math.min(64, plaintext.length - offset);
  const index = offset + Math.min(selectedByte, Math.max(0, length - 1));
  const source = decrypt ? ciphertext : plaintext;
  const output = decrypt ? plaintext : ciphertext;
  return (
    <div className="cc-xor">
      <div className="cc-segmented" aria-label="XOR direction">
        <button
          type="button"
          className={!decrypt ? 'is-active' : ''}
          aria-pressed={!decrypt}
          onClick={() => onDecrypt(false)}
        >
          Encrypt
        </button>
        <button
          type="button"
          className={decrypt ? 'is-active' : ''}
          aria-pressed={decrypt}
          onClick={() => onDecrypt(true)}
        >
          Decrypt
        </button>
      </div>
      {length > 0 ? (
        <>
          <p className="cc-muted">Select a byte to inspect its XOR.</p>
          <ByteGrid
            bytes={source.slice(offset, offset + length)}
            selected={index - offset}
            onSelect={onSelect}
          />
          <div className="cc-xor-calculation" aria-live="polite">
            <div>
              <span>
                {decrypt ? 'Ciphertext' : 'Plaintext'} [{index}]
              </span>
              <code>{binaryByte(source[index])}</code>
              <strong>{byteHex(source[index])}</strong>
            </div>
            <div>
              <span>⊕ Keystream [{index}]</span>
              <code>{binaryByte(stream[index])}</code>
              <strong>{byteHex(stream[index])}</strong>
            </div>
            <div className="cc-xor-result">
              <span>
                = {decrypt ? 'Plaintext' : 'Ciphertext'} [{index}]
              </span>
              <code>{binaryByte(output[index])}</code>
              <strong>{byteHex(output[index])}</strong>
            </div>
          </div>
        </>
      ) : (
        <div className="cc-callout">Empty message → empty ciphertext.</div>
      )}
      <div className="cc-output">
        <span>
          {decrypt ? 'Recovered plaintext · all blocks' : 'Ciphertext · all blocks · hex'}
        </span>
        <output data-testid="chacha-output">
          {decrypt ? new TextDecoder().decode(output) : bytesToHex(output) || '(empty)'}
        </output>
        <small>{output.length} bytes</small>
      </div>
    </div>
  );
}

export default function ChaCha20Page() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [keyText, setKeyText] = useState(DEMO_KEY);
  const [nonceText, setNonceText] = useState(DEMO_NONCE);
  const [counterText, setCounterText] = useState('1');
  const [step, setStep] = useState(0);
  const [operation, setOperation] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [blockIndex, setBlockIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState(4);
  const [selectedByte, setSelectedByte] = useState(0);
  const [decrypt, setDecrypt] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  const input = useMemo(() => {
    const errors = {};
    const plaintext = new TextEncoder().encode(message);
    if (plaintext.length > 256)
      errors.message = 'Keep this learning example to 256 UTF-8 bytes (up to four blocks).';
    let secretKey, nonce;
    try {
      secretKey = hexToBytes(keyText, 32, 'Key');
    } catch (error) {
      errors.key = error.message;
    }
    try {
      nonce = hexToBytes(nonceText, 12, 'Nonce');
    } catch (error) {
      errors.nonce = error.message;
    }
    const counter = Number(counterText);
    if (!/^\d+$/.test(counterText) || !Number.isInteger(counter) || counter > 0xffffffff)
      errors.counter = 'Enter a whole number from 0 to 4294967295.';
    if (!errors.counter && counter + Math.max(0, Math.ceil(plaintext.length / 64) - 1) > 0xffffffff)
      errors.counter = 'This message would overflow the counter. Choose a lower starting counter.';
    return {
      plaintext,
      secretKey,
      nonce,
      counter,
      errors,
      valid: Object.keys(errors).length === 0,
    };
  }, [message, keyText, nonceText, counterText]);

  const computation = useMemo(
    () =>
      input.valid ? chacha20(input.plaintext, input.secretKey, input.nonce, input.counter) : null,
    [input]
  );
  const emptyBlock = useMemo(
    () =>
      input.valid && input.plaintext.length === 0
        ? chacha20Block(input.secretKey, input.nonce, input.counter)
        : null,
    [input]
  );
  const block = computation?.blocks[blockIndex] || emptyBlock;
  const stage = step === 0 ? 0 : step <= 80 ? 1 : step - 79;
  const quarter = stage === 1 && block ? block.rounds[step - 1] : null;
  const words = block
    ? stage === 0
      ? block.initial
      : stage === 1
        ? quarter.before.map((word, i) => {
            const slot = quarter.indices.indexOf(i);
            return slot < 0 ? word : quarter.steps[operation][slot];
          })
        : block.final
    : [];

  useEffect(() => {
    if (!playing || !input.valid || step >= LAST_STEP) return undefined;
    const timer = setTimeout(() => {
      setStep((previous) => Math.min(LAST_STEP, previous + 1));
      setOperation(12);
      if (step + 1 === 82) setSelectedByte(selectedWord * 4);
      if (step + 1 === LAST_STEP) setPlaying(false);
    }, speed);
    return () => clearTimeout(timer);
  }, [playing, input.valid, step, speed, selectedWord]);

  function goTo(nextStep) {
    setPlaying(false);
    setStep(Math.max(0, Math.min(LAST_STEP, nextStep)));
    setOperation(12);
    if (nextStep === 82) setSelectedByte(selectedWord * 4);
  }

  function resetProgress() {
    goTo(0);
    setBlockIndex(0);
    setSelectedByte(0);
    setDecrypt(false);
  }

  function edit(setter, value) {
    setter(value);
    resetProgress();
  }

  function loadExample(rfc) {
    setMessage(rfc ? RFC_MESSAGE : DEFAULT_MESSAGE);
    setKeyText(DEMO_KEY);
    setNonceText(DEMO_NONCE);
    setCounterText('1');
    resetProgress();
  }

  const fields = [
    {
      id: 'key',
      label: 'Secret key',
      hint: '32 bytes · 64 hex digits',
      value: keyText,
      setter: setKeyText,
      tone: 'key',
    },
    {
      id: 'nonce',
      label: 'Nonce',
      hint: '12 bytes · 24 hex digits',
      value: nonceText,
      setter: setNonceText,
      tone: 'nonce',
    },
    {
      id: 'counter',
      label: 'Starting counter',
      hint: '32-bit integer',
      value: counterText,
      setter: setCounterText,
      tone: 'counter',
    },
  ];

  return (
    <main className="cc-page">
      <Helmet>
        <title>ChaCha20 Visualizer - Encryption Step by Step | Hash Explained</title>
        <meta
          name="description"
          content="Understand ChaCha20 through an interactive state matrix, quarter rounds, and byte-by-byte XOR. Explore how Poly1305 adds authentication with a tampering demo."
        />
        <link rel="canonical" href="https://hashexplained.com/chacha20" />
        <meta property="og:title" content="ChaCha20 Visualizer - Encryption Step by Step" />
        <meta
          property="og:description"
          content="Follow the key, nonce, rounds, keystream, and XOR. See why Poly1305 detects tampering."
        />
        <meta property="og:url" content="https://hashexplained.com/chacha20" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="cc-container">
        <header className="cc-header">
          <div>
            <div className="cc-eyebrow">Stream cipher</div>
            <h1>
              ChaCha20<span>Encryption.</span>
            </h1>
          </div>
          <a
            href="https://www.rfc-editor.org/rfc/rfc8439.html"
            target="_blank"
            rel="noreferrer"
            className="cc-source"
          >
            RFC 8439 ↗
          </a>
        </header>
        <div className={`cc-workbench ${showExplanation ? '' : 'cc-without-explanation'}`}>
          <aside className="cc-inputs" aria-label="Cipher inputs">
            <div className="cc-panel-heading">
              <span className="cc-section-label">Inputs</span>
            </div>
            <div className="cc-examples">
              <button type="button" onClick={() => loadExample(false)}>
                Simple example
              </button>
              <button type="button" onClick={() => loadExample(true)}>
                RFC example ↗
              </button>
            </div>
            <label className="cc-field" htmlFor="cc-message">
              <span>
                Message <small>UTF-8 text</small>
              </span>
              <textarea
                id="cc-message"
                value={message}
                onChange={(e) => edit(setMessage, e.target.value)}
                rows={3}
                aria-invalid={!!input.errors.message}
                aria-describedby="cc-message-hint"
                spellCheck="false"
                maxLength={512}
              />
              <small id="cc-message-hint">
                {input.errors.message ||
                  `${input.plaintext.length} / 256 bytes · ${Math.ceil(input.plaintext.length / 64)} block${Math.ceil(input.plaintext.length / 64) === 1 ? '' : 's'}`}
              </small>
            </label>
            {fields.map((field) => (
              <label
                className={`cc-field cc-tone-${field.tone}`}
                key={field.id}
                htmlFor={`cc-${field.id}`}
              >
                <span id={`cc-${field.id}-label`}>{field.label}</span>
                {field.id === 'key' ? (
                  <textarea
                    id={`cc-${field.id}`}
                    aria-labelledby={`cc-${field.id}-label`}
                    rows={3}
                    spellCheck="false"
                    autoComplete="off"
                    value={field.value}
                    onChange={(e) => edit(field.setter, e.target.value)}
                    aria-invalid={!!input.errors[field.id]}
                    aria-describedby={`cc-${field.id}-hint`}
                  />
                ) : (
                  <input
                    id={`cc-${field.id}`}
                    aria-labelledby={`cc-${field.id}-label`}
                    value={field.value}
                    inputMode={field.id === 'counter' ? 'numeric' : 'text'}
                    spellCheck="false"
                    autoComplete="off"
                    onChange={(e) => edit(field.setter, e.target.value)}
                    aria-invalid={!!input.errors[field.id]}
                    aria-describedby={`cc-${field.id}-hint`}
                  />
                )}
                <small id={`cc-${field.id}-hint`}>{input.errors[field.id] || field.hint}</small>
              </label>
            ))}
          </aside>

          <section className="cc-visualizer" aria-label="ChaCha20 walkthrough">
            <div className="cc-panel-heading">
              <span className="cc-section-label">Walkthrough</span>
              <button
                type="button"
                className="cc-explain-toggle"
                aria-pressed={showExplanation}
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <BookOpen size={14} /> {showExplanation ? 'Hide' : 'Show'} explanation
              </button>
            </div>
            <nav className="cc-stages" aria-label="Encryption stages">
              {STAGES.map((item, i) => (
                <button
                  type="button"
                  key={item.label}
                  disabled={!input.valid}
                  onClick={() => goTo(item.start)}
                  className={stage === i ? 'is-active' : stage > i ? 'is-complete' : ''}
                  aria-current={stage === i ? 'step' : undefined}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="cc-playback">
              <div className="cc-transport">
                <button
                  type="button"
                  onClick={resetProgress}
                  disabled={!input.valid || (step === 0 && blockIndex === 0)}
                  aria-label="Reset walkthrough"
                  title="Reset walkthrough"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  disabled={!input.valid || step === 0}
                  aria-label="Previous step"
                  title="Previous step"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  className="cc-play"
                  onClick={() => setPlaying(!playing)}
                  disabled={!input.valid || step === LAST_STEP}
                  aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                  <span>{playing ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  disabled={!input.valid || step === LAST_STEP}
                  aria-label="Next step"
                  title="Next step"
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(LAST_STEP)}
                  disabled={!input.valid || step === LAST_STEP}
                  aria-label="Skip to ciphertext"
                  title="Skip to ciphertext"
                >
                  <SkipForward size={15} />
                </button>
              </div>
              <label className="cc-speed">
                Speed
                <select
                  aria-label="Playback speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <option value={1800}>0.5×</option>
                  <option value={900}>1×</option>
                  <option value={300}>3×</option>
                </select>
              </label>
              <span className="cc-step-count">
                {step} / {LAST_STEP}
              </span>
            </div>
            {!input.valid ? (
              <div className="cc-validation" role="alert">
                <h2>Let’s fix the inputs first.</h2>
                {Object.entries(input.errors).map(([field, error]) => (
                  <p key={field}>{error}</p>
                ))}
              </div>
            ) : (
              block && (
                <>
                  <div className="cc-stage-heading">
                    <div>
                      <span className="cc-eyebrow">
                        {stage === 1
                          ? `${quarter.kind} round ${quarter.round} / 20 · Quarter round ${((step - 1) % 4) + 1} / 4`
                          : `Stage ${stage + 1} / 5`}
                      </span>
                      <h2>{STAGES[stage].title}</h2>
                    </div>
                    <label className="cc-block-picker">
                      Block
                      <select
                        aria-label="Keystream block"
                        value={blockIndex}
                        onChange={(e) => {
                          setBlockIndex(Number(e.target.value));
                          goTo(0);
                          setSelectedByte(0);
                        }}
                      >
                        {Array.from({ length: Math.max(1, computation.blocks.length) }, (_, i) => (
                          <option key={i} value={i}>
                            {i + 1} · counter {input.counter + i}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {stage === 1 && (
                    <div className="cc-rounds">
                      <div className="cc-round-track" aria-label="Choose a mixing round">
                        {Array.from({ length: 20 }, (_, i) => (
                          <button
                            type="button"
                            key={i}
                            className={
                              quarter.round === i + 1
                                ? 'is-active'
                                : quarter.round > i + 1
                                  ? 'is-complete'
                                  : ''
                            }
                            aria-label={`Round ${i + 1}, ${i % 2 === 0 ? 'column' : 'diagonal'}`}
                            aria-pressed={quarter.round === i + 1}
                            onClick={() => goTo(i * 4 + 1)}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <div className="cc-quarter-picker">
                        <span>{quarter.kind} groups</span>
                        {block.rounds
                          .slice(Math.floor((step - 1) / 4) * 4, Math.floor((step - 1) / 4) * 4 + 4)
                          .map((q, i) => (
                            <button
                              type="button"
                              key={i}
                              className={(step - 1) % 4 === i ? 'is-active' : ''}
                              aria-label={`Quarter round ${i + 1}, words ${q.indices.join(', ')}`}
                              aria-pressed={(step - 1) % 4 === i}
                              onClick={() => goTo(Math.floor((step - 1) / 4) * 4 + i + 1)}
                            >
                              {q.indices.join('·')}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  {stage < 3 && (
                    <>
                      <StateMatrix
                        words={words}
                        active={quarter ? quarter.indices : []}
                        selected={selectedWord}
                        onSelect={setSelectedWord}
                      />
                      <div className="cc-state-caption">
                        {stage === 1
                          ? `${operation === 0 ? 'Before mixing' : `After operation ${operation} / 12`} · quarter round ${step} / 80`
                          : '16 × 32-bit words · select a cell to inspect'}
                      </div>
                    </>
                  )}
                  {stage === 2 && (
                    <div className="cc-feed-forward">
                      <code>{wordHex(block.mixed[selectedWord])}</code>
                      <span>+</span>
                      <code>{wordHex(block.initial[selectedWord])}</code>
                      <span>=</span>
                      <strong>{wordHex(block.final[selectedWord])}</strong>
                      <small>word {selectedWord} · mod 2³²</small>
                    </div>
                  )}
                  {stage === 3 && (
                    <>
                      <p className="cc-muted">64 bytes · dimmed bytes are unused</p>
                      <ByteGrid
                        bytes={block.bytes}
                        selected={selectedByte}
                        onSelect={(i) => {
                          setSelectedByte(i);
                          setSelectedWord(Math.floor(i / 4));
                        }}
                        used={Math.min(64, input.plaintext.length - blockIndex * 64)}
                      />
                      <div className="cc-output">
                        <span>Serialization · word {selectedWord}</span>
                        <output>
                          {wordHex(block.final[selectedWord])} →{' '}
                          {Array.from(serializeWords([block.final[selectedWord]]), byteHex).join(
                            ' '
                          )}
                        </output>
                      </div>
                    </>
                  )}
                  {stage === 4 && (
                    <XorMessage
                      plaintext={input.plaintext}
                      ciphertext={computation.output}
                      stream={computation.keystream}
                      offset={blockIndex * 64}
                      selectedByte={selectedByte}
                      onSelect={setSelectedByte}
                      decrypt={decrypt}
                      onDecrypt={setDecrypt}
                    />
                  )}
                  <div className="cc-next">
                    {step < LAST_STEP && (
                      <button
                        type="button"
                        className="cc-button cc-button-primary"
                        onClick={() => goTo(step + 1)}
                      >
                        {step === 0 ? 'Start mixing' : 'Next step'}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </>
              )
            )}
          </section>

          {showExplanation && (
            <aside className="cc-explanation" aria-label="Step explanation">
              <div className="cc-panel-heading">
                <span className="cc-section-label">
                  <BookOpen size={14} /> This step
                </span>
              </div>
              <div className="cc-explanation-body">
                {input.valid && block ? (
                  <Explanation
                    key={stage}
                    stage={stage}
                    selectedWord={selectedWord}
                    quarter={quarter}
                    operation={operation}
                    onOperation={(value) => {
                      setPlaying(false);
                      setOperation(value);
                    }}
                    counter={input.counter + blockIndex}
                  />
                ) : (
                  <p>Complete the key, nonce, and counter to explore the calculation.</p>
                )}
              </div>
            </aside>
          )}
        </div>
        {input.valid && <AuthenticationDemo secretKey={input.secretKey} nonce={input.nonce} />}
        <footer className="cc-footer">
          <span>Educational demo · public example key · runs locally</span>
        </footer>
      </div>
    </main>
  );
}
