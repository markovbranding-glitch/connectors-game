'use client';

import { CardData } from '@/lib/data';
import { COLOR_MAP } from '@/lib/colors';

interface Props {
  card: CardData;
  placed: boolean;
  onDragStart: (card: CardData) => void;
  onClick: (card: CardData) => void;
}

export default function DraggableCard({ card, placed, onDragStart, onClick }: Props) {
  const bg = COLOR_MAP[card.color] ?? 'bg-gray-400';

  return (
    <div
      draggable={!placed}
      onDragStart={() => onDragStart(card)}
      onClick={() => onClick(card)}
      className={`
        ${bg}
        ${placed
          ? 'opacity-30 pointer-events-none grayscale-[20%]'
          : 'cursor-grab hover:-translate-y-1 hover:scale-[1.03] active:cursor-grabbing active:scale-[0.97]'}
        rounded-2xl text-white text-[0.95rem] font-black text-center
        min-h-[68px] flex items-center justify-center leading-tight
        px-3 py-3 shadow-[0_4px_0_rgba(0,0,0,0.2),0_6px_16px_rgba(0,0,0,0.15)]
        transition-all duration-150 select-none
      `}
    >
      {card.text}
    </div>
  );
}
