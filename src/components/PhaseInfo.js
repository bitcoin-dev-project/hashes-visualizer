import { paddingExplained, ordinal } from '../lib/encoding';

function Explainer({ clock, input, inputBase, chunksCount, lastClock, masterClock }) {
  const messageBlock = paddingExplained(input, inputBase);

  function resolveStage() {
    if(clock === 0) return 'pad';
    if(clock === 1) return 'chunk';
    if(clock >= 2 && clock <= 49) return 'schedule';
    if(clock === 50) return 'init';
    if(masterClock < lastClock) return 'compress';
    return 'digest';
  }

  const stageKey = resolveStage();
  const stage = {
    pad: {
      title: 'Start with your message',
      summary: 'Turn the message into a 512-bit block so SHA-256 can chew on it.',
      bullets: [
        inputBase === 'text' ? 'Encode text as UTF-8 bits, then append a single 1 bit.' : 'Append a single 1 bit to the input bits.',
        `Pad with ${messageBlock.K} zeros so length hits 448 mod 512.`,
        `Append the original length (${messageBlock.L} bits → ${messageBlock.LBinary}) as 64-bit big-endian.`,
      ],
      tip: 'Left side: this is the padded message that everything else uses.',
    },
    chunk: {
      title: 'Split into chunks and seed w[0..15]',
      summary: `We break the padded stream into 512-bit chunks (${chunksCount} total).`,
      bullets: [
        'Copy the current chunk into w0..w15 (16 words of 32 bits).',
        `You are on chunk ${ordinal(Math.ceil(masterClock / 113))}.`,
        'Everything on the right comes from these first 16 words.',
      ],
      tip: 'Follow the arrow ► in the left list to see which words are being copied.',
    },
    schedule: {
      title: 'Grow the message schedule',
      summary: 'Build w16..w63 so each round has fresh data.',
      bullets: [
        `Compute w[t] = w[t-16] + σ0(w[t-15]) + w[t-7] + σ1(w[t-2]).`,
        'σ0 uses rightrot 7, rightrot 18, rightshift 3.',
        'σ1 uses rightrot 17, rightrot 19, rightshift 10.',
      ],
      tip: 'Middle column lights up the words being combined for the current w[t].',
    },
    init: {
      title: 'Load initial hash + working vars',
      summary: 'First round: bring in the square-root primes and prep a..h.',
      bullets: [
        'h0..h7 are the first 32 bits of the fractional square roots of primes 2..19.',
        'a..h start as those h0..h7 values.',
        'K constants are cube-root primes (2..311).',
      ],
      tip: 'Right column shows the working variables sitting over the K constants.',
    },
    compress: {
      title: '64 compression rounds',
      summary: 'Mix everything: rotate, choose, majority, and add.',
      bullets: [
        'Temp1 = h + Σ1(e) + Ch(e,f,g) + k[t] + w[t].',
        'Temp2 = Σ0(a) + Maj(a,b,c).',
        'Shift the registers down, set a = Temp1 + Temp2, e = d + Temp1.',
      ],
      tip: 'Watch Temp1 / Temp2 blocks on the right; they animate per step.',
    },
    digest: {
      title: 'Add back into h0..h7',
      summary: 'Finish this chunk and emit the digest.',
      bullets: [
        'h0..h7 get added to a..h once per chunk.',
        'The final 256-bit hash is h0‖h1‖h2‖h3‖h4‖h5‖h6‖h7.',
        'You can copy the hex from the bottom-right.',
      ],
      tip: 'Replay or step back to see how each round changed the state.',
    },
  }[stageKey];

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">Step explainer</div>
        <div className="text-[11px] text-slate-500">One-screen flow: left → right</div>
      </div>
      <div className="mt-2">
        <div className="font-semibold text-slate-100">{stage.title}</div>
        <div className="text-[12px] text-slate-400 leading-5">{stage.summary}</div>
      </div>
      <ul className="mt-2 space-y-1 text-[12px] leading-5 text-slate-300">
        {stage.bullets.map((item, index) => <li key={`${stageKey}-${index}`}>• {item}</li>)}
      </ul>
      <div className="mt-3 text-[11px] text-slate-500">{stage.tip}</div>
    </div>
  );
}

export default Explainer;
