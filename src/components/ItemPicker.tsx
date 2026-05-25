import { useMemo, useState } from 'react';
import type { GameData } from '../types';

interface Props {
  gameData: GameData;
  value: string;
  onChange: (itemClass: string) => void;
}

export function ItemPicker({ gameData, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = gameData.allItems
      .filter((cn) => !gameData.rawItems.has(cn)) // raw resources can't be a "target"
      .map((cn) => gameData.items[cn]);
    if (!q) return items.slice(0, 50);
    return items.filter((it) => it.name.toLowerCase().includes(q)).slice(0, 50);
  }, [gameData, query]);

  const selectedName = gameData.items[value]?.name ?? value;

  return (
    <div className="relative">
      <label className="text-xs uppercase tracking-wide text-slate-400 block mb-1">Target item</label>
      <button
        className="w-full text-left bg-panel2 border border-border rounded px-3 py-2 text-slate-100"
        onClick={() => setOpen((v) => !v)}
      >
        {selectedName}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-panel2 border border-border rounded shadow-lg max-h-80 overflow-auto">
          <input
            autoFocus
            type="text"
            placeholder="Search items…"
            className="w-full px-3 py-2 bg-panel border-b border-border outline-none text-slate-100"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul>
            {matches.map((it) => (
              <li key={it.className}>
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-panel ${
                    it.className === value ? 'bg-panel text-accent' : ''
                  }`}
                  onClick={() => {
                    onChange(it.className);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {it.name}
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-2 text-slate-400 text-sm">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
