'use client';

import { useState } from 'react';
import { CardData } from '@/lib/data';
import { COLOR_MAP } from '@/lib/colors';

interface Props {
  filledCard: CardData | null;
  wide?: boolean;
  onDrop: () => void;
  onRemove: () => void;
  onCardClick: (card: CardData) => void;
}

export default function CategorySlot({ filledCard, wide, onDrop, onRemove, onCardClick }: Props) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!filledCard) setIsOver(true); };
  const handleDragLeave = () => setIsOver(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsOver(false); if (!filledCard) onDrop(); };

  const bg = filledCard ? COLOR_MAP[filledCard.color] ?? 'bg-gray-400' : '';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        min-h-[46px] rounded-xl transition-all duration-150
        ${wide ? 'col-span-2' : ''}
        ${filledCard
          ? 'border-0 p-0 overflow-hidden'
          : `border-2 border-dashed ${isOver
              ? 'border-[#ff6597] bg-[#fff0f5] scale-[1.03]'
              : 'border-[#f9b5e5] bg-[#fff8fb]'}
             flex items-center justify-center text-[0.7rem] font-bold text-[#f9b5e5] px-1.5 py-1`
        }
      `}
    >
      {filledCard && (
        <div
          className={`${bg} w-full min-h-[46px] rounded-xl px-2 py-1.5 text-white text-[0.72rem] font-black text-center flex items-center justify-center leading-snug cursor-pointer relative group shadow-[0_2px_0_rgba(0,0,0,0.18)]`}
          onClick={() => onCardClick(filledCard)}
        >
          {filledCard.text}
          <span
            className="absolute top-0.5 right-1 text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity font-black text-white/80 cursor-pointer leading-none"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            ✕
          </span>
        </div>
      )}
    </div>
  );
}
