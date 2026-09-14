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

function Explanation({ stage, block, selectedWord, quarter, operation, onOperation, counter }) {
  return (
    <>
      {stage === 0 && (
        <>
          <h3>Three inputs, different jobs</h3>
          <dl className="cc-input-explainer">
            <div>
              <dt className="cc-tone-key">Key · 256 bits · secret</dt>
              <dd>
                Shared by sender and receiver. It determines the keystream. The example is public; a
                real key must be unpredictable and secret.
              </dd>
            </div>
            <div>
              <dt className="cc-tone-nonce">Nonce · 96 bits · public</dt>
              <dd>
                A “number used once”: choose a unique value for each message under the same key. The
                receiver needs it too.
              </dd>
            </div>
            <div>
              <dt className="cc-tone-counter">Counter · 32 bits · public</dt>
              <dd>
                Which 64-byte block to generate. This block uses {counter}. The next uses{' '}
                {counter === 0xffffffff
                  ? 'a new nonce because this counter is exhausted'
                  : counter + 1}
                .
              </dd>
            </div>
          </dl>
          <div className="cc-callout">
            <strong>The message is not in this matrix.</strong>
            <p>
              ChaCha20 first creates bytes from the key, nonce, and counter. The message joins
              later, through XOR.
            </p>
          </div>
          <h3>What is a word?</h3>
          <p>
            A word here is a 32-bit number: four bytes, displayed as eight hex digits. Sixteen words
            × four bytes = 64 bytes.
          </p>
          <p>
            <strong>Selected: word {selectedWord}.</strong> {wordSource(selectedWord).detail}
          </p>
          <details className="cc-more">
            <summary>Why do the bytes look reversed?</summary>
            <p>
              Little-endian means the first byte is the least significant one. Key bytes{' '}
              <code>00 01 02 03</code> become the number <code>03020100</code>. Turning that number
              back into bytes restores <code>00 01 02 03</code>.
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
              ? 'Pick four words down a column. Apply the same recipe to each of the four columns.'
              : 'Pick one word from each row along a wrapping diagonal. This mixes words that were in different columns.'}
          </p>
          <QuarterRound quarter={quarter} operation={operation} onOperation={onOperation} />
          <div className="cc-callout">
            <strong>Why “20”?</strong>
            <p>
              10 column rounds + 10 diagonal rounds = 20 rounds. Each round contains 4 quarter
              rounds: 80 quarter rounds in total. The rotation amounts 16, 12, 8, and 7 repeat each
              time.
            </p>
          </div>
        </>
      )}
      {stage === 2 && (
        <>
          <h3>One addition per position</h3>
          <p>
            After all 20 rounds, add each mixed word to its matching original word. Every sum wraps
            modulo 2³².
          </p>
          <div className="cc-addition">
            <span>word[{selectedWord}] · mixed</span>
            <code>{wordHex(block.mixed[selectedWord])}</code>
            <span>+ original</span>
            <code>{wordHex(block.initial[selectedWord])}</code>
            <span>= output word</span>
            <strong>{wordHex(block.final[selectedWord])}</strong>
          </div>
          <p>
            Click another matrix cell to inspect its addition. This is called{' '}
            <strong>feed-forward</strong>. It is part of the block function, after the rounds.
          </p>
          <div className="cc-callout">
            <strong>Keep the original.</strong>
            <p>
              The rounds update a working copy; the starting state is still available for this
              addition.
            </p>
          </div>
        </>
      )}
      {stage === 3 && (
        <>
          <h3>Words → bytes, in order</h3>
          <p>
            Read output words 0 through 15. Write each word as four little-endian bytes. Together
            they form the keystream: 64 bytes that look random but are reproducible.
          </p>
          <div className="cc-addition">
            <span>Output word[{selectedWord}]</span>
            <code>{wordHex(block.final[selectedWord])}</code>
            <span>Least significant byte first</span>
            <strong>
              {Array.from(serializeWords([block.final[selectedWord]]), byteHex).join(' ')}
            </strong>
          </div>
          <p>
            The same key + nonce + counter always gives the same stream. Sender and receiver can
            generate it independently.
          </p>
          <div className="cc-callout">
            <strong>Need more than 64 bytes?</strong>
            <p>
              Increment the counter, rebuild the starting state, and run all 20 rounds again. Join
              the blocks. The last block only uses as many bytes as the message needs; no message
              padding is required.
            </p>
          </div>
        </>
      )}
      {stage === 4 && (
        <>
          <h3>XOR encrypts and decrypts</h3>
          <p>
            Take one message byte and one keystream byte. XOR their bits. Repeat for every byte.
          </p>
          <div className="cc-formula">
            <span>ENCRYPT</span>
            <code>plaintext ⊕ stream = ciphertext</code>
            <span>DECRYPT</span>
            <code>ciphertext ⊕ stream = plaintext</code>
          </div>
          <p>
            XORing the same value twice cancels it: <code>(P ⊕ K) ⊕ K = P</code>. Decryption
            regenerates the stream; it does not reverse the 20 rounds.
          </p>
          <div className="cc-callout">
            <strong>The ciphertext has the same byte length.</strong>
            <p>
              ChaCha20 changes the message bytes. It does not compress them or produce a fixed-size
              hash.
            </p>
          </div>
          <h3>One rule to remember</h3>
          <p>
            Never reuse a nonce for a different message under the same key. Repeating the stream
            reveals the XOR of the two plaintexts: <code>C₁ ⊕ C₂ = P₁ ⊕ P₂</code>.
          </p>
          <p>
            ChaCha20 alone does not detect changes. Open the Poly1305 chapter below to see
            authentication in action.
          </p>
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
          <p className="cc-muted">
            Select a byte of the {decrypt ? 'ciphertext' : 'UTF-8 message'} to inspect its XOR.
          </p>
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
        <div className="cc-callout">
          An empty message produces empty ciphertext. There are no message bytes to XOR.
        </div>
      )}
      <div className="cc-output">
        <span>
          {decrypt ? 'Recovered plaintext · all blocks' : 'Ciphertext · all blocks · hex'}
        </span>
        <output data-testid="chacha-output">
          {decrypt ? new TextDecoder().decode(output) : bytesToHex(output) || '(empty)'}
        </output>
        <small>
          {output.length} bytes ·{' '}
          {decrypt
            ? 'The original UTF-8 message, recovered with the same stream.'
            : 'Only the required keystream bytes were used.'}
        </small>
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
      hint: '12 bytes · 24 hex digits · public',
      value: nonceText,
      setter: setNonceText,
      tone: 'nonce',
    },
    {
      id: 'counter',
      label: 'Starting counter',
      hint: '32-bit integer · one increment per block',
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
            <div className="cc-eyebrow">Interactive cryptography / stream cipher</div>
            <h1>
              ChaCha20<span>From a secret key to a secret message.</span>
            </h1>
            <p>Build a stream of bytes. Mix it with your message. Follow every step.</p>
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
        <div className="cc-intro">
          <span className="cc-badge">THE BIG IDEA</span>
          <p>
            <Link to="/sha256">SHA-256</Link> makes a fingerprint.{' '}
            <strong>ChaCha20 encrypts, so someone with the key can recover the message.</strong>{' '}
            “ChaCha” is the family; “20” is the number of mixing rounds. This page uses the IETF
            variant.
          </p>
        </div>

        <div className={`cc-workbench ${showExplanation ? '' : 'cc-without-explanation'}`}>
          <aside className="cc-inputs" aria-label="Cipher inputs">
            <div className="cc-panel-heading">
              <span className="cc-section-label">01 / Your inputs</span>
              <span className="cc-local">Local only</span>
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
                  `${input.plaintext.length} / 256 bytes · ${Math.ceil(input.plaintext.length / 64)} keystream block${Math.ceil(input.plaintext.length / 64) === 1 ? '' : 's'} needed`}
              </small>
            </label>
            <div className="cc-input-divider">
              <span>Used to build the state ↓</span>
            </div>
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
            <div className="cc-input-note">
              <strong>Try this as you learn</strong>
              <p>
                Change the message: the state stays the same. Change one key or nonce digit: the
                keystream changes.
              </p>
            </div>
            <p className="cc-footnote">
              Public example key. All calculations stay in your browser. Built for learning, not for
              protecting real secrets.
            </p>
          </aside>

          <section className="cc-visualizer" aria-label="ChaCha20 walkthrough">
            <div className="cc-panel-heading">
              <span className="cc-section-label">02 / Follow the transformation</span>
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
                        initial={block.initial}
                        isInitial={stage === 0}
                      />
                      <div className="cc-state-caption">
                        {stage === 0
                          ? 'Click any word to inspect it. Colors show where the starting words come from.'
                          : stage === 1
                            ? `Highlighted words are a, b, c, d for this quarter round. Matrix shows ${operation === 0 ? 'the values before it starts' : `values after operation ${operation} of 12`}. Colors keep their original input labels as values mix.`
                            : 'Each cell now contains (mixed word + original word) mod 2³².'}
                      </div>
                    </>
                  )}
                  {stage === 0 && (
                    <div className="cc-pipeline">
                      <span>key + nonce + counter</span>
                      <ArrowRight size={16} />
                      <strong>ChaCha20 block</strong>
                      <ArrowRight size={16} />
                      <span>64 keystream bytes</span>
                    </div>
                  )}
                  {stage === 1 && (
                    <div className="cc-mix-summary">
                      <strong>{step} / 80</strong>
                      <span>quarter rounds reached</span>
                      <span className="cc-muted">ADD + XOR + ROTATE</span>
                    </div>
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
                      <p className="cc-muted">
                        One complete keystream block. Dimmed bytes are unused for this message
                        block.
                      </p>
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
                        <small>Click a byte to inspect the word it came from.</small>
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
                    <span>
                      {step === LAST_STEP
                        ? 'Same stream. Same XOR. Original message.'
                        : stage === 1
                          ? 'One step = one quarter round. Inspect its 12 operations in the explanation.'
                          : 'Move at your own pace. Every displayed value is computed from your inputs.'}
                    </span>
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
                  <BookOpen size={14} /> Why this step?
                </span>
              </div>
              <div className="cc-explanation-body">
                {input.valid && block ? (
                  <Explanation
                    stage={stage}
                    block={block}
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
          <span>ChaCha20 · 256-bit key · 96-bit nonce · 20 rounds</span>
          <span>
            Algorithm & test vectors:{' '}
            <a href="https://www.rfc-editor.org/rfc/rfc8439.html" target="_blank" rel="noreferrer">
              RFC 8439 ↗
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}
