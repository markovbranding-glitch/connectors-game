'use client';

import { CardData, CategoryData } from '@/lib/data';
import CategorySlot from './CategorySlot';

interface Props {
  category: CategoryData;
  slots: (CardData | null)[];
  onDrop: (slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
  onCardClick: (card: CardData) => void;
}

export default function CategoryPanel({ category, slots, onDrop, onRemove, onCardClick }: Props) {
  return (
    <div className="bg-white rounded-3xl p-3 lg:p-4 shadow-[0_4px_24px_rgba(255,101,151,0.12)] border-2 border-[#f9b5e5]">
      <div className="text-xs lg:text-sm font-black text-center mb-2 lg:mb-3 text-[#ff6597] uppercase tracking-wide leading-snug">
        {category.title}
      </div>
      <div className="grid grid-cols-2 gap-1 lg:gap-1.5">
        {slots.map((card, i) => (
          <CategorySlot
            key={i}
            catId={category.id}
            slotIndex={i}
            filledCard={card}
            wide={i === slots.length - 1 && slots.length % 2 !== 0}
            onDrop={() => onDrop(i)}
            onRemove={() => onRemove(i)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
