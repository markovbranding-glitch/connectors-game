'use client';

import { useEffect } from 'react';
import { CardData } from '@/lib/data';
import { COLOR_MAP } from '@/lib/colors';

interface Props {
  card: CardData | null;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!card) return null;

  const bg = COLOR_MAP[card.color] ?? 'bg-gray-500';

  return (
    <div
      className="fixed inset-0 bg-[#bce3ff]/70 backdrop-blur-sm flex items-center justify-center z-[999] animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl p-8 max-w-[420px] w-[90%] shadow-[0_20px_60px_rgba(255,101,151,0.25)] relative animate-slideUp border-2 border-[#f9b5e5]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#fff0f5] border-none text-[#ff6597] flex items-center justify-center cursor-pointer hover:bg-[#ff6597] hover:text-white transition-all font-black text-base"
        >
          ✕
        </button>
        <div className={`inline-block px-4 py-1.5 rounded-full text-white font-black text-lg mb-4 shadow-[0_3px_0_rgba(0,0,0,0.12)] ${bg}`}>
          {card.text}
        </div>
        <p className="text-[0.95rem] font-semibold text-[#999a9b] leading-[1.7] mb-4">{card.desc}</p>
        <div
          className="bg-[#fff8fb] border-l-4 border-[#ff6597] rounded-r-2xl px-4 py-3 text-[0.88rem] font-semibold text-slate-700 italic leading-relaxed [&_strong]:text-[#ff6597] [&_strong]:not-italic"
          dangerouslySetInnerHTML={{ __html: card.example }}
        />
      </div>
    </div>
  );
}
