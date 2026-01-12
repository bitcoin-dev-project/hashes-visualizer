import { decimalToBinary, chunkString } from '../lib/encoding'

function BlockView({ data, base, clock, chunksLoop }) {
  data = chunkString(data, 32).map(value => parseInt(value, 2));

  function length(key) {
    if(key > data.length - 3) return 'text-green-500'
  }

  return (
    <div className={`duration-500 ${clock > 1 ? 'opacity-60' : ''}`}>
      <h2 className="font-semibold my-1 text-slate-100">Message block - {data.length*32} bits</h2>
      { data.map((word, key) =>
        <div key={(key).toString()} className={length(key)}>
          { decimalToBinary(word).padStart(32, '0').match(new RegExp('.{1,' + 8 + '}', 'g')).join(' ') }
          <span className={(clock === 1 && key < chunksLoop*16 && key >= (chunksLoop - 1)*16) ? 'ml-1 text-slate-200' : 'ml-1 opacity-0'}>►</span>
        </div>
      )}
    </div>
  );
}

export default BlockView;
