function StepRail({ clock, masterClock, lastClock, chunksCount }) {
  function resolveStage() {
    if(clock <= 1) return 'message';
    if(clock <= 49) return 'schedule';
    if(masterClock < lastClock) return 'compression';
    return 'digest';
  }

  const activeStage = resolveStage();
  const stages = [
    { key: 'message', title: 'Message → padded block', note: 'UTF-8, +1 bit, pad with zeros + length' },
    { key: 'schedule', title: 'Message schedule', note: 'Grow w[16..63] from earlier words' },
    { key: 'compression', title: 'Compression rounds', note: '64 rounds of temp1/temp2 updates' },
    { key: 'digest', title: 'Digest', note: 'Add back into h0..h7' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {stages.map(stage => {
        const isActive = stage.key === activeStage;
        return (
          <div key={stage.key} className={`rounded-xl border px-3 py-2 text-[11px] ${isActive ? 'border-indigo-300 bg-gray-800 text-slate-50' : 'border-gray-800 bg-gray-900 text-slate-400'}`}>
            <div className="font-semibold">{stage.title}</div>
            <div className="text-[10px] leading-4 text-slate-500">{stage.note}</div>
            {stage.key === 'message' && <div className="mt-1 text-[10px] text-slate-500">Blocks: {chunksCount}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default StepRail;

