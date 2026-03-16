import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { SYSTEMS } from '../../lib/systems';

function SystemCard({ system, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all duration-200 border',
        active
          ? cn(system.accentBg, system.accentBorder, 'shadow-sm')
          : 'border-transparent hover:bg-gray-800/60 hover:border-gray-700/40',
      )}
    >
      <span
        className={cn(
          'text-base leading-none w-7 h-7 flex items-center justify-center rounded font-bold shrink-0',
          active ? cn(system.accentBg, system.accentText) : 'bg-gray-800 text-gray-500',
        )}
      >
        {system.symbol}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-bold', active ? system.accentText : 'text-gray-300')}>
          {system.name}
        </div>
        <div className="text-[10px] text-gray-500 truncate">{system.tagline}</div>
      </div>
      {active && (
        <svg className={cn('w-3.5 h-3.5 shrink-0', system.accentText)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </button>
  );
}

function ModeButton({ active, onClick, icon, label, variant }) {
  let activeClasses = 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400';
  if (variant === 'danger') activeClasses = 'bg-red-950/30 border-red-500/40 text-red-400';
  if (variant === 'success') activeClasses = 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all border',
        active
          ? activeClasses
          : 'bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StepText({ system, step, maxLevel }) {
  const s = system.steps;
  const text =
    step === 0
      ? s[0]?.body ?? `Hash each ${system.leafLabel.toLowerCase()}.`
      : step === maxLevel
        ? s[3]?.body ?? `The ${system.rootLabel} represents all data below it.`
        : step === 1
          ? s[1]?.body ?? 'Pair and hash adjacent nodes.'
          : s[2]?.body ?? 'Continue combining pairs until only the root remains.';

  return (
    <p className="text-xs text-gray-400 leading-snug">{text}</p>
  );
}

export default function MerkleSidebar({
  systemId,
  setSystemId,
  currentSystem,
  mode,
  setMode,
  activeStep,
  setActiveStep,
  maxLevel,
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="w-96 border-l border-gray-800 bg-gray-900/50 h-full flex flex-col shrink-0 relative z-20 hidden lg:flex">
      {/* Mode controls */}
      <div className="px-2.5 py-2.5 border-b border-gray-800 space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 px-1">
          Mode
        </p>
        <div className="flex gap-1.5">
          <ModeButton
            active={mode === 'explore'}
            onClick={() => setMode('explore')}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            }
            label="Explore"
          />
          <ModeButton
            active={mode === 'tamper'}
            onClick={() => setMode('tamper')}
            variant="danger"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
            label="Tamper"
          />
          <ModeButton
            active={mode === 'proof'}
            onClick={() => setMode('proof')}
            variant="success"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Proof"
          />
        </div>
      </div>

      {/* Scrollable info area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">

        {/* Step navigator (explore mode) */}
        {mode === 'explore' && (
          <div className="px-2.5 py-2.5 border-b border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-bold font-mono', currentSystem.accentText)}>
                Step {activeStep} / {maxLevel}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors text-gray-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveStep(Math.min(maxLevel, activeStep + 1))}
                  disabled={activeStep === maxLevel}
                  className={cn(
                    'p-1 rounded transition-colors disabled:opacity-40 text-gray-300',
                    currentSystem.accentBg,
                    'hover:opacity-80',
                  )}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
            <StepText system={currentSystem} step={activeStep} maxLevel={maxLevel} />
          </div>
        )}

        {/* Tamper mode context */}
        {mode === 'tamper' && (
          <div className="p-2.5">
            <div className="rounded-lg border border-red-500/20 bg-red-950/10 p-3 space-y-1.5 text-xs text-gray-300 leading-snug">
              <p className="font-bold text-red-400 flex items-center gap-1.5 text-[11px]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Tamper Detection
              </p>
              <p>Click <strong className="text-white">Tamper</strong> on any {currentSystem.leafLabel.toLowerCase()} or edit a leaf. Changes cascade up to the {currentSystem.rootLabel}.</p>
            </div>
          </div>
        )}

        {/* Proof mode context */}
        {mode === 'proof' && (
          <div className="p-2.5">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3 space-y-1.5 text-xs text-gray-300 leading-snug">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Merkle Proof
              </p>
              <p>Click any <strong className="text-white">{currentSystem.leafLabel}</strong> leaf node. The highlighted path is the proof.</p>
              <ul className="space-y-0.5 pl-2.5 list-disc text-[11px] font-mono">
                <li className="text-emerald-400">Proof path (green)</li>
                <li className="text-yellow-400">Sibling hashes (amber)</li>
              </ul>
            </div>
          </div>
        )}

        {/* System Info Panel */}
        <div className="p-2.5">
          <button
            onClick={() => setInfoOpen((o) => !o)}
            className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 hover:text-gray-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              About {currentSystem.name}
            </span>
            <svg className={cn('w-3.5 h-3.5 transition-transform', infoOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {infoOpen && (
            <div className="space-y-2.5 text-xs text-gray-400 leading-snug">
              <p>{currentSystem.whatIsIt}</p>

              <div className={cn('rounded-lg border p-2.5 space-y-1.5', currentSystem.accentBorder, currentSystem.accentBg)}>
                <p className={cn('text-[10px] font-bold uppercase tracking-wider', currentSystem.accentText)}>
                  How {currentSystem.name} uses Merkle trees
                </p>
                <p className="whitespace-pre-line text-gray-300 text-[11px]">{currentSystem.howMerkle}</p>
              </div>

              <div className="rounded-lg border border-gray-700/40 bg-gray-800/30 p-2.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  The {currentSystem.rootLabel}
                </p>
                <p className="text-gray-400 text-[11px]">{currentSystem.rootContext}</p>
              </div>

              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">Fun fact</p>
                <p className="text-gray-400 text-[11px]">{currentSystem.realNote}</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
