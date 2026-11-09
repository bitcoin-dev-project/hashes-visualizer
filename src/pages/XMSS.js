import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, Copy, GitBranch, KeyRound, Layers, Pause, Play, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { authenticationPath, createXMSSDemo, flipHash, previewXMSSMessage, shortHash, signXMSSDemo, verificationStages, verifyXMSSDemo } from '../lib/xmss';
import XMSSTree from '../components/xmss/XMSSTree';
import './XMSS.css';

const INITIAL_MESSAGE = 'A little trust goes a long way.';
const PHASES = [{ id: 'keygen', label: 'Build a key' }, { id: 'sign', label: 'Sign a message' }, { id: 'verify', label: 'Verify the proof' }];
const pad = number => String(number).padStart(2, '0');

function TreeMark({ className = '' }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 7v7M7 24v-6h18v6M16 14v10" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="2" width="8" height="8" rx="2" fill="currentColor" /><rect x="3" y="23" width="8" height="7" rx="2" fill="currentColor" /><rect x="12" y="23" width="8" height="7" rx="2" fill="currentColor" /><rect x="21" y="23" width="8" height="7" rx="2" fill="currentColor" /></svg>;
}

function HashValue({ value, className = '' }) {
  return <code className={`xm-hash ${className}`} title={value}>{value}</code>;
}

function VerificationOperation({ trace, signature, committedRoot, step, height }) {
  if (step === height + 3) {
    return <div className={`xm-operation xm-root-comparison ${trace.valid ? 'is-match' : 'is-mismatch'}`}>
      <div><span>RECONSTRUCTED ROOT</span><HashValue value={trace.root} /></div>
      <span className="xm-comparison-symbol">{trace.valid ? '=' : '≠'}</span>
      <div><span>COMMITTED PUBLIC ROOT</span><HashValue value={committedRoot} /></div>
    </div>;
  }
  if (step >= 3) {
    const operation = trace.steps[step - 3];
    return <div className="xm-operation"><div className="xm-operation-label"><span>LEVEL {operation.level + 1} · HASH THE PAIR</span><small>Index bit {operation.level} = {(signature.index >>> operation.level) & 1}. The sibling goes on the {operation.siblingSide}.</small></div>
      <div className="xm-operation-equation"><span>H(</span><code className={operation.siblingSide === 'left' ? 'is-proof' : ''}>{shortHash(operation.left)}</code><span>‖</span><code className={operation.siblingSide === 'right' ? 'is-proof' : ''}>{shortHash(operation.right)}</code><span>)</span><span>→</span><code>{shortHash(operation.parent)}</code></div>
    </div>;
  }
  if (step === 2) return <div className="xm-operation"><div className="xm-operation-label"><span>RECOVER THE PUBLIC LEAF</span><small>Compress all six chain endpoints.</small></div><div className="xm-operation-equation"><span>H(</span><code>tip₀ ‖ … ‖ tip₅</code><span>) →</span><code>{shortHash(trace.leaf)}</code></div></div>;
  return <div className="xm-operation"><div className="xm-operation-label"><span>{step === 0 ? 'BIND THE MESSAGE TO THIS SIGNATURE' : 'REBUILD SIX CHAIN ENDPOINTS'}</span><small>{step === 0 ? 'Hash the randomizer, public root, index, and received message.' : 'Continue each revealed value to the end of its chain.'}</small></div><div className="xm-operation-equation"><span>{step === 0 ? '8-bit digest' : 'Remaining hashes'}</span><code>{step === 0 ? trace.byte.toString(2).padStart(8, '0') : trace.digits.map(digit => 3 - digit).join(' + ')}</code>{step === 1 && <a href="#xm-how-it-works">See chains ↓</a>}</div></div>;
}

function ChainStudy({ tree, index, encoding, verifying, trace, step }) {
  return (
    <section className="xm-chain-study" aria-labelledby="xm-chain-heading">
      <div className="xm-section-eyebrow"><KeyRound size={15} /><span>ZOOM INTO ONE LEAF</span><span className="xm-mini-tag">KEY {pad(index)}</span></div>
      <h2 id="xm-chain-heading">Six chains. One signature.</h2>
      <p>The signer reveals one value on each chain. The verifier hashes forward to recover all six endpoints.</p>
      <div className="xm-chain-head"><span>CHAIN</span><span>SECRET</span><span>H →</span><span>H →</span><span>PUBLIC TIP</span></div>
      <div className="xm-chains" aria-label="Six hash chains, with the revealed signature positions highlighted">
        {encoding.digits.map((digit, chain) => (
          <div className={`xm-chain-row ${chain >= 4 ? 'is-checksum' : ''}`} key={chain}>
            <span className="xm-chain-name">{chain >= 4 ? 'c' : 'm'}<sub>{chain >= 4 ? chain - 4 : chain}</sub></span>
            {[0, 1, 2, 3].map(position => {
              const revealed = position === digit;
              const recovered = verifying && step >= 1 && position > digit;
              const value = verifying ? trace.recoveredChains[chain].find(point => point.position === position)?.value : tree.chains[index][chain][position];
              return <div key={position} className={`xm-chain-position ${revealed ? 'is-revealed' : ''} ${recovered ? 'is-recovered' : ''}`}>
                <span className="xm-chain-link" />
                <span className="xm-chain-value" title={value || 'The verifier does not know this earlier chain value.'}>{value ? shortHash(value, 4) : '····'}</span>
                {revealed && <span className="xm-reveal-pointer" aria-label={`Signature reveals position ${position}`} />}
              </div>;
            })}
          </div>
        ))}
      </div>
      <div className="xm-chain-legend"><span><i className="xm-dot is-amber" />Sent in the signature</span><span><i className="xm-dot is-green" />Verifier hashes forward</span></div>
      <div className="xm-encoding"><div><span>MESSAGE DIGITS · BASE 4</span><strong>{encoding.digits.slice(0, 4).join(' ')}</strong></div><div><span>CHECKSUM DIGITS</span><strong>{encoding.digits.slice(4).join(' ')}</strong></div></div>
      <p className="xm-small-print">The two checksum chains prevent changing a message simply by advancing its revealed chain values. This small model uses an 8-bit message digest so every chain fits on screen.</p>
    </section>
  );
}

export default function XMSSPage() {
  const [height, setHeight] = useState(3);
  const [generation, setGeneration] = useState(1);
  const tree = useMemo(() => createXMSSDemo(height, `xmss-learning-key-${generation}`), [height, generation]);
  const [phase, setPhase] = useState('keygen');
  const [selected, setSelected] = useState(2);
  const [inspection, setInspection] = useState({ level: 0, index: 2 });
  const [message, setMessage] = useState(INITIAL_MESSAGE);
  const [signature, setSignature] = useState(null);
  const [signedMessage, setSignedMessage] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [proofChanged, setProofChanged] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const stages = useMemo(() => verificationStages(height), [height]);
  const verifyingSignature = useMemo(() => signature ? { ...signature, auth: signature.auth.map((value, index) => proofChanged && index === 0 ? flipHash(value) : value) } : null, [signature, proofChanged]);
  const trace = useMemo(() => verifyingSignature ? verifyXMSSDemo({ root: tree.root, height }, verifyMessage, verifyingSignature) : null, [verifyingSignature, verifyMessage, tree.root, height]);
  const activeIndex = phase === 'verify' && signature ? signature.index : selected;
  const encoding = phase === 'verify' && trace ? trace : previewXMSSMessage(tree, selected, message);
  const available = 2 ** height - tree.usedLeaves.size;
  const atEnd = step === stages.length - 1;
  const inspectedHash = tree.levels[inspection.level]?.[inspection.index];
  const selectedAuth = authenticationPath(tree, activeIndex);

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= stages.length - 1) { setPlaying(false); return undefined; }
    const timer = setTimeout(() => setStep(current => current + 1), 1200);
    return () => clearTimeout(timer);
  }, [playing, step, stages.length]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function switchPhase(next) {
    setPlaying(false);
    setPhase(next);
    setError('');
    if (next === 'verify' && signature) setInspection({ level: 0, index: signature.index });
  }

  function inspect(level, index) {
    setInspection({ level, index });
    if (level === 0) { setSelected(index); setError(''); if (phase === 'verify') switchPhase('keygen'); }
  }

  function newTree(nextHeight = height) {
    setHeight(nextHeight);
    setGeneration(current => current + 1);
    setSelected(Math.min(2, 2 ** nextHeight - 1));
    setInspection({ level: 0, index: Math.min(2, 2 ** nextHeight - 1) });
    setSignature(null);
    setSignedMessage('');
    setVerifyMessage('');
    setProofChanged(false);
    setStep(0);
    setPlaying(false);
    setError('');
    setCopied(false);
    setPhase('keygen');
  }

  function sign() {
    try {
      const next = signXMSSDemo(tree, selected, message);
      setSignature(next);
      setSignedMessage(message);
      setVerifyMessage(message);
      setProofChanged(false);
      setStep(0);
      setPlaying(false);
      setPhase('verify');
      setInspection({ level: 0, index: selected });
      setError('');
    } catch (signError) { setError(signError.message); }
  }

  function chooseFresh() {
    const fresh = Array.from({ length: 2 ** height }, (_, index) => index).find(index => !tree.usedLeaves.has(index));
    if (fresh !== undefined) { setSelected(fresh); setInspection({ level: 0, index: fresh }); setPhase('sign'); setError(''); }
  }

  function resetVerification() { setStep(0); setPlaying(false); }
  async function copyRoot() {
    try { await navigator.clipboard.writeText(tree.root); setCopied(true); }
    catch { setError('Copy is unavailable in this browser. The full root is available in the node inspector.'); }
  }

  return (
    <div className="xmss-lab">
      <Helmet>
        <title>XMSS — One root, many signatures · Hash Explained</title>
        <meta name="description" content="Explore XMSS with a working, small-scale signing model. Inspect one-time keys, build an authentication path, verify a signature, and experiment with tampering." />
        <meta name="theme-color" content="#f6f7f2" />
      </Helmet>
      <a className="xm-skip" href="#xm-workbench">Skip to the interactive lesson</a>
      <header className="xm-topbar">
        <Link to="/" className="xm-brand"><TreeMark /><span>hash<span className="xm-brand-light">explained</span><span className="xm-brand-period">.</span></span></Link>
        <div className="xm-topbar-center"><span>THE SIGNATURE LAB</span><i /><span>01 — XMSS</span></div>
        <a href="#xm-notes" className="xm-text-link">About this model <ArrowUpRight size={14} /></a>
      </header>

      <main className="xm-main">
        <section className="xm-hero" aria-labelledby="xm-title">
          <div className="xm-hero-copy"><div className="xm-eyebrow"><span className="xm-index">01</span> EXTENDED MERKLE SIGNATURE SCHEME</div>
            <h1 id="xm-title">One root.<br /><em>Many signatures.</em></h1>
          </div>
          <div className="xm-hero-aside"><span className="xm-live-label"><i />AN INTERACTIVE FIELD GUIDE</span>
            <p>A one-time key signs your message.<br />A path through a tree proves it belongs.<br /><strong>Follow the hashes. Build the intuition.</strong></p>
            <a href="#xm-workbench" className="xm-hero-link">Explore XMSS <ArrowRight size={16} /></a>
          </div>
        </section>

        <section className="xm-workbench" id="xm-workbench" aria-label="XMSS interactive workbench">
          <div className="xm-workbench-nav"><div className="xm-phase-tabs" role="group" aria-label="Lesson chapters">
            {PHASES.map((item, index) => <button key={item.id} type="button" aria-pressed={phase === item.id} disabled={item.id === 'verify' && !signature} onClick={() => switchPhase(item.id)} className={phase === item.id ? 'is-current' : ''}><span>{pad(index + 1)}</span>{item.label}{index < 2 && <ChevronRight size={13} />}</button>)}
          </div><span className="xm-model-tag">SMALL TREE · REAL HASHES</span></div>

          <div className="xm-workbench-body">
            <aside className="xm-controls">
              {phase === 'keygen' && <>
                <div className="xm-section-eyebrow"><GitBranch size={15} /> KEY GENERATION</div>
                <h2>A key for<br /> every message.</h2>
                <p>Each leaf represents a one-time key. Hash their public keys together, all the way up, to get one public root.</p>
                <label className="xm-field-label" id="xm-height-label">TREE HEIGHT <span>h = {height}</span></label>
                <div className="xm-height-picker" role="group" aria-labelledby="xm-height-label">{[2, 3, 4].map(value => <button type="button" key={value} aria-pressed={height === value} onClick={() => height !== value && newTree(value)} className={height === value ? 'is-selected' : ''}><strong>{value}</strong><span>{2 ** value} keys</span></button>)}</div>
                <div className="xm-selection"><span>SELECTED ONE-TIME KEY</span><strong><KeyRound size={20} />{pad(selected)}<small className={tree.usedLeaves.has(selected) ? 'is-used' : ''}>{tree.usedLeaves.has(selected) ? 'used' : 'fresh'}</small></strong><p>Click a leaf in the tree to choose a key.</p></div>
                <button type="button" className="xm-button xm-button-primary" onClick={() => switchPhase('sign')}>Sign a message <ArrowRight size={16} /></button>
              </>}

              {phase === 'sign' && <>
                <div className="xm-section-eyebrow"><KeyRound size={15} /> SIGNING</div>
                <h2>A message.<br /> A fresh leaf.</h2>
                <p>The message selects a position on each hash chain. Those revealed values form its one-time signature.</p>
                <label className="xm-field-label" htmlFor="xm-message">YOUR MESSAGE <span>{message.length}/200</span></label>
                <textarea id="xm-message" value={message} maxLength={200} onChange={event => setMessage(event.target.value)} rows={3} spellCheck={false} />
                <div className="xm-signing-key"><KeyRound size={16} /><span>Signing with key <strong>{pad(selected)}</strong></span><span className={tree.usedLeaves.has(selected) ? 'xm-pill is-used' : 'xm-pill'}>{tree.usedLeaves.has(selected) ? 'Used' : 'Fresh'}</span></div>
                {tree.usedLeaves.has(selected) ? <><div className="xm-inline-note">Key {pad(selected)} has already signed. Each key is used once, even if verification fails later.</div><button className="xm-button xm-button-primary" type="button" disabled={!available} onClick={chooseFresh}>{available ? 'Choose a fresh key' : 'All keys used'}<ArrowRight size={16} /></button></> : <button type="button" className="xm-button xm-button-primary" onClick={sign}>Create signature <ArrowRight size={16} /></button>}
                <div className="xm-mini-equation">message + one-time key <span>→</span> signature</div>
              </>}

              {phase === 'verify' && signature && <>
                <div className="xm-section-eyebrow"><ShieldCheck size={15} /> VERIFICATION</div>
                <h2>Find your way<br /> back to trust.</h2>
                <p>The verifier only needs the message, signature, and public key. No secret values. No full tree.</p>
                <label className="xm-field-label" htmlFor="xm-verify-message">RECEIVED MESSAGE</label>
                <textarea id="xm-verify-message" value={verifyMessage} maxLength={240} onChange={event => { setVerifyMessage(event.target.value); resetVerification(); }} rows={3} spellCheck={false} />
                <div className="xm-tamper-label">TRY BREAKING THE PROOF</div>
                <div className="xm-tamper-buttons"><button type="button" className={verifyMessage !== signedMessage ? 'is-tampered' : ''} aria-pressed={verifyMessage !== signedMessage} onClick={() => { setVerifyMessage(verifyMessage === signedMessage ? `${signedMessage}!` : signedMessage); resetVerification(); }}>{verifyMessage !== signedMessage ? <RotateCcw size={13} /> : <span>↳</span>}{verifyMessage !== signedMessage ? 'Restore message' : 'Change message'}</button><button type="button" className={proofChanged ? 'is-tampered' : ''} aria-pressed={proofChanged} onClick={() => { setProofChanged(current => !current); resetVerification(); }}>{proofChanged ? <RotateCcw size={13} /> : <span>↳</span>}{proofChanged ? 'Restore proof' : 'Alter a sibling'}</button></div>
                <div className={`xm-verdict ${atEnd ? trace.valid ? 'is-valid' : 'is-invalid' : ''}`} role="status">{atEnd ? trace.valid ? <Check size={18} /> : <X size={18} /> : <ShieldCheck size={18} />}<div><strong>{atEnd ? trace.valid ? 'Signature verified' : 'Root mismatch' : 'Ready to verify'}</strong><span>{atEnd ? trace.valid ? 'The reconstructed root matches.' : 'The reconstructed root does not match.' : 'Step through the proof below.'}</span></div></div>
              </>}

              {error && <p className="xm-error" role="alert">{error}</p>}
              <div className="xm-key-budget"><div><span>ONE-TIME KEYS REMAINING</span><strong>{available}<span> / {2 ** height}</span></strong></div><div className="xm-budget-marks" aria-label={`${available} of ${2 ** height} one-time keys available`}>{Array.from({ length: 2 ** height }, (_, index) => <i className={tree.usedLeaves.has(index) ? 'is-spent' : ''} key={index} title={`Key ${pad(index)}: ${tree.usedLeaves.has(index) ? 'used' : 'fresh'}`} />)}</div><button type="button" className="xm-new-tree" onClick={() => newTree()}><RotateCcw size={12} /> New tree &amp; fresh keys</button></div>
            </aside>

            <div className="xm-tree-workspace">
              <div className="xm-canvas-heading"><span><i className="xm-dot is-green" />THE PUBLIC TREE</span><span>HEIGHT {height}<span className="xm-divider">/</span>{2 ** height} LEAVES</span></div>
              <XMSSTree tree={tree} selected={selected} inspection={inspection} onInspect={inspect} phase={phase} trace={trace} step={step} signature={signature} />
              <div className="xm-tree-mobile-hint">↔ Swipe to explore the full tree</div>
              <div className="xm-legend"><span><i className="xm-dot is-green" />Verification path</span><span><i className="xm-dot is-amber" />Supplied proof node</span><span><i className="xm-dot is-gray" />Other keys</span></div>
              <div className="xm-node-inspector"><div className="xm-inspector-label"><span>{inspection.level === height ? 'PUBLIC ROOT' : inspection.level === 0 ? `ONE-TIME KEY ${pad(inspection.index)}` : `LEVEL ${inspection.level} · NODE ${pad(inspection.index)}`}</span><small>{inspection.level === height ? 'Your public trust anchor' : inspection.level === 0 ? 'Hash of the six chain endpoints' : `Commits to ${2 ** inspection.level} one-time keys`}</small></div><HashValue value={inspectedHash} /></div>
              {phase === 'verify' && trace && <VerificationOperation trace={trace} signature={signature} committedRoot={tree.root} step={step} height={height} />}
              {phase === 'verify' && signature ? <div className="xm-playback">
                <div className="xm-playback-controls"><button type="button" className="xm-play" aria-label={playing ? 'Pause verification' : 'Play verification'} onClick={() => { if (atEnd) setStep(0); setPlaying(current => !current); }}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</button><button type="button" aria-label="Previous verification step" disabled={step === 0} onClick={() => { setPlaying(false); setStep(current => current - 1); }}><ArrowLeft size={16} /></button><button type="button" aria-label="Next verification step" disabled={atEnd} onClick={() => { setPlaying(false); setStep(current => current + 1); }}><ArrowRight size={16} /></button></div>
                <div className="xm-stage-description" aria-live="polite"><span>STEP {pad(step + 1)} / {pad(stages.length)}</span><strong>{stages[step].title}</strong><p>{stages[step].description}</p></div>
                <button type="button" className="xm-text-button" onClick={() => { setStep(stages.length - 1); setPlaying(false); }}>Check root <ArrowUpRight size={14} /></button>
                <div className="xm-progress-track">{stages.map((stage, index) => <button key={stage.title} type="button" aria-label={`Verification step ${index + 1}: ${stage.title}`} aria-current={step === index ? 'step' : undefined} className={index <= step ? 'is-complete' : ''} onClick={() => { setPlaying(false); setStep(index); }} />)}</div>
              </div> : <div className="xm-canvas-caption"><span className="xm-caption-index">{phase === 'keygen' ? '01' : '02'}</span><div><strong>{phase === 'keygen' ? 'Many keys, one commitment.' : 'The tree stays. The signing key is consumed.'}</strong><p>{phase === 'keygen' ? `A height-${height} tree authenticates ${2 ** height} one-time keys with a single public root.` : 'Your signature carries the selected chain values and one sibling hash per tree level.'}</p></div><Layers size={22} /></div>}
            </div>
          </div>
          <div className="xm-public-key"><span>PUBLIC ROOT</span><code>{tree.root.slice(0, 16)}<span>…</span>{tree.root.slice(-16)}</code><button type="button" onClick={copyRoot} aria-label="Copy public root">{copied ? <Check size={14} /> : <Copy size={14} />}<span>{copied ? 'Copied' : 'Copy'}</span></button><span className="xm-public-key-note">Stays the same as you sign.</span></div>
        </section>

        <section className="xm-proof-story" aria-labelledby="xm-proof-heading">
          <div className="xm-proof-intro"><div className="xm-section-eyebrow">THE AUTHENTICATION PATH</div><h2 id="xm-proof-heading">A small proof.<br /><em>A shared root.</em></h2><p>For key <strong>{pad(activeIndex)}</strong>, the verifier needs just <strong>{height} sibling hashes</strong> to climb this tree. Every other branch is already captured in those hashes.</p><span className="xm-path-equation">{2 ** height} keys <span>→</span> {height} proof nodes <span>→</span> 1 root</span></div>
          <div className="xm-proof-path">{selectedAuth.map((hash, level) => { const nodeIndex = (activeIndex >>> level) ^ 1; const altered = phase === 'verify' && proofChanged && level === 0; return <div className={`xm-proof-node ${altered ? 'is-altered' : ''}`} key={level}><span className="xm-proof-number">{pad(level + 1)}</span><div><span>LEVEL {level} <i>·</i> {nodeIndex % 2 === 0 ? 'LEFT' : 'RIGHT'} SIBLING</span><code>{shortHash(altered ? flipHash(hash) : hash, 12)}{altered && <X size={12} />}</code></div><span className="xm-proof-bracket">{level === 0 ? '1 key' : `${2 ** level} keys`}</span></div>; })}<div className="xm-proof-end"><ShieldCheck size={14} /><span>Reconstruct the root, one hash at a time.</span></div></div>
        </section>

        <div className="xm-bottom-grid" id="xm-how-it-works">
          <ChainStudy tree={tree} index={activeIndex} encoding={encoding} verifying={phase === 'verify' && Boolean(trace)} trace={trace} step={step} />
          <section className="xm-packet" aria-labelledby="xm-packet-heading"><div className="xm-section-eyebrow"><Layers size={15} />WHAT THE VERIFIER RECEIVES</div><h2 id="xm-packet-heading">Inside the signature.</h2><p>Everything needed to authenticate one message against the public root.</p>
            <div className={`xm-packet-envelope ${signature ? 'is-signed' : ''}`}><div className="xm-packet-header"><span>XMSS / SIGNATURE</span><span>{signature ? `KEY ${pad(signature.index)}` : 'PREVIEW'}</span></div>
              <div className="xm-packet-field"><span>01</span><div><strong>Leaf index</strong><small>Where this key sits in the tree</small></div><code>{signature ? pad(signature.index) : 'i'}</code></div>
              <div className="xm-packet-field"><span>02</span><div><strong>Randomizer</strong><small>Included in the message hash</small></div><code>{signature ? `${shortHash(signature.randomizer, 6)}…` : 'R'}</code></div>
              <div className="xm-packet-field"><span>03</span><div><strong>One-time signature</strong><small>One revealed value per chain</small></div><code>6 values</code></div>
              <div className="xm-packet-field is-proof"><span>04</span><div><strong>Authentication path</strong><small>One sibling per level</small></div><code>{height} hashes</code></div>
              <div className="xm-packet-seal">{signature ? <><Check size={13} />Signed. Key {pad(signature.index)} is now spent.</> : <><KeyRound size={13} />Create a signature to fill this packet.</>}</div>
            </div>
            {signature && <details className="xm-signature-details"><summary>Inspect the actual signature <ChevronDown size={14} /></summary><div><span>Randomizer R</span><HashValue value={signature.randomizer} />{signature.values.map((value, index) => <React.Fragment key={index}><span>Chain {index} · revealed value</span><HashValue value={value} /></React.Fragment>)}{verifyingSignature.auth.map((value, index) => <React.Fragment key={`proof-${index}`}><span>Authentication node {index}</span><HashValue value={value} /></React.Fragment>)}</div></details>}
            <div className="xm-state-note"><span className="xm-state-symbol">1×</span><div><strong>One leaf. One signature.</strong><p>XMSS remembers which keys have signed. Losing that state can cause key reuse and break its security.</p>{signature && <button type="button" className="xm-text-button" disabled={!available} onClick={chooseFresh}>{available ? 'Sign with the next fresh key' : 'All keys used — generate a new tree above'}{available > 0 && <ArrowRight size={13} />}</button>}</div></div>
          </section>
        </div>

        <section className="xm-context" id="xm-notes"><div className="xm-context-number">UP<br />NEXT</div><div><div className="xm-section-eyebrow">THE PATH TO SHRINCS</div><h2>First the tree. Then the flexibility.</h2><p>This lesson explores balanced XMSS. SHRINCS’s stateful <strong>FXMSS</strong> branch lets the signer choose a tree shape and uses WOTS+C one-time signatures. Its stateless fallback uses FORS and an XMSS hypertree.</p><a className="xm-text-link" href="https://github.com/SHRINCS/shrincs-bip/blob/main/SHRINCS.md#overview" target="_blank" rel="noreferrer">Read the SHRINCS specification <ArrowUpRight size={13} /></a></div><TreeMark className="xm-context-mark" /></section>
        <details className="xm-model-notes"><summary><span>About the learning model &amp; sources</span><ChevronDown size={15} /></summary><div><p>This is a working educational model, not a standards-compatible XMSS or SHRINCS implementation. It uses full SHA-256 hashes, a reduced 8-bit message digest, six base-4 Winternitz-style chains including a checksum, and trees of 4–16 leaves. The initial seed is a known demonstration string. New trees use a different demonstration seed; state lasts for this visit.</p><p>Hash inputs use a simple domain-separated encoding. RFC 8391 defines different PRFs, addresses, bitmasks, message hashing, L-trees, parameter sets, and serialization. SHRINCS uses its own specified signature variants. The small parameters and visible secrets here are for understanding the structure.</p><p>References: <a href="https://www.rfc-editor.org/rfc/rfc8391.html#section-4.1" target="_blank" rel="noreferrer">RFC 8391 · XMSS</a><span> / </span><a href="https://github.com/SHRINCS/shrincs-bip/blob/main/SHRINCS.md" target="_blank" rel="noreferrer">SHRINCS specification</a><span> / </span><a href="https://sphincs.art/" target="_blank" rel="noreferrer">sphincs.art · conceptual inspiration</a></p></div></details>
        <footer className="xm-footer"><Link to="/">← All explorations</Link><span>XMSS → FXMSS → SHRINCS</span><span>Hash Explained <i>©</i> Signature Lab</span></footer>
      </main>
    </div>
  );
}
