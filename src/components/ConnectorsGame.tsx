'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { CARDS_DATA, CATEGORIES, CardData } from '@/lib/data';
import DraggableCard from './DraggableCard';
import CategoryPanel from './CategoryPanel';
import CardModal from './CardModal';
import ResultOverlay from './ResultOverlay';

type SlotState = Record<string, (CardData | null)[]>;
type User = { id: string; name: string };

function buildEmptySlots(): SlotState {
  const state: SlotState = {};
  for (const cat of CATEGORIES) {
    state[cat.id] = Array(cat.slots).fill(null);
  }
  return state;
}

export default function ConnectorsGame() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [idError, setIdError] = useState('');

  const [slots, setSlots] = useState<SlotState>(buildEmptySlots);
  const [modalCard, setModalCard] = useState<CardData | null>(null);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [goals, setGoals] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const draggedCardRef = useRef<CardData | null>(null);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === idInput.trim());
    if (!user) {
      setIdError('ID не найден. Пожалуйста повтори попытку.');
      return;
    }
    setActiveUser(user);
    setShowInstructions(true);
    setIdError('');
  };

  const placedIds = new Set(
    Object.values(slots).flat().filter(Boolean).map(c => (c as CardData).id)
  );

  const handleDragStart = (card: CardData) => { draggedCardRef.current = card; };

  const handleDrop = (categoryId: string, slotIndex: number) => {
    const card = draggedCardRef.current;
    if (!card) return;
    if (slots[categoryId][slotIndex] !== null) return;
    setSlots(prev => {
      const next = { ...prev };
      for (const catId of Object.keys(next)) {
        next[catId] = next[catId].map(c => (c?.id === card.id ? null : c));
      }
      const arr = [...next[categoryId]];
      arr[slotIndex] = card;
      next[categoryId] = arr;
      return next;
    });
    draggedCardRef.current = null;
  };

  const handleRemove = (categoryId: string, slotIndex: number) => {
    setSlots(prev => {
      const arr = [...prev[categoryId]];
      arr[slotIndex] = null;
      return { ...prev, [categoryId]: arr };
    });
  };

  const submitAnswers = async () => {
    let correct = 0, total = 0;
    for (const [catId, catSlots] of Object.entries(slots)) {
      for (const card of catSlots) {
        if (card) { total++; if (card.category === catId) correct++; }
      }
    }
    setSubmitting(true);
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, explanation, slots, userId: activeUser?.id ?? '', userName: activeUser?.name ?? '' }),
      });
    } catch { /* non-blocking */ } finally { setSubmitting(false); }
    setResult({ correct, total });
  };

  const resetGame = () => {
    setSlots(buildEmptySlots());
    setResult(null);
    setGoals('');
    setExplanation('');
  };

  // ── ID Gate ──────────────────────────────────────────────────────────────
  if (!activeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 w-full max-w-sm shadow-[0_8px_40px_rgba(255,101,151,0.25)] flex flex-col items-center gap-6">
          <Image src="/logo-auth-v3.png" alt="YOLO" width={160} height={160} className="object-contain" priority unoptimized />
          <div className="text-center">
            <h1 className="text-2xl font-black text-[#ff6597]">Введи свой ID</h1>
          </div>
          <form onSubmit={handleIdSubmit} className="w-full flex flex-col gap-3">
            <input
              type="text"
              value={idInput}
              onChange={e => { setIdInput(e.target.value); setIdError(''); }}
              placeholder="Твой ID"
              autoFocus
              className="w-full rounded-2xl border-2 border-[#bce3ff] bg-[#f0f9ff] px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#ff6597] transition-colors"
            />
            {idError && <p className="text-sm text-[#ff6597] font-bold">{idError}</p>}
            <button
              type="submit"
              disabled={!idInput.trim() || users.length === 0}
              className="w-full bg-[#ff6597] hover:bg-[#e5497f] text-white rounded-2xl py-3 font-black text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,101,151,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {users.length === 0 ? 'Загрузка…' : 'Старт'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Instructions Modal ───────────────────────────────────────────────────
  if (activeUser && showInstructions) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 w-full max-w-lg shadow-[0_8px_40px_rgba(255,101,151,0.25)] flex flex-col items-center gap-6">
          <Image src="/logo-auth-v3.png" alt="YOLO" width={120} height={120} className="object-contain" priority unoptimized />
          <div className="text-lg font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-center">
            {`Распредели карточки с потенциальными целями по блокам «фантазия», «мечта», «цель». Если потенциальная цель тебе не подходит, относи её в блок «не моё», а если ты её уже достиг, то в «цель достигнута!». А если твоей цели нет в списке, вписывай её сам!\n\nПомни, что у тебя должно получится не меньше двух целей, которых ты бы хотел достигнуть!\n\nПосле распределения выбирай одну цель и пиши план по её достижению!`}
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="bg-[#ff6597] hover:bg-[#e5497f] text-white rounded-2xl px-12 py-3 font-black text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,101,151,0.4)]"
          >
            Понятно!
          </button>
        </div>
      </div>
    );
  }

  // ── Game ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur-md border-b-2 border-[#f9b5e5] px-6 py-3 flex items-center justify-between shadow-[0_2px_16px_rgba(255,101,151,0.15)] sticky top-0 z-50">
        <Image src="/logo-header-v2.png" alt="YOLO" width={160} height={64} className="object-contain" unoptimized />
        <div className="text-center">
          <div className="text-[#ff6597] font-black text-lg leading-none">ФАНТАЗИЯ, МЕЧТА, ЦЕЛЬ</div>
          <div className="text-[#999a9b] font-semibold text-xs mt-0.5">Распредели занятия по категорям</div>
        </div>
        <div className="flex items-center gap-2 bg-[#fff0f5] border-2 border-[#f9b5e5] rounded-2xl px-4 py-2">
          <span className="text-xl">👋</span>
          <span className="font-black text-[#ff6597] text-sm">{activeUser.name}</span>
        </div>
      </header>

      <div className="flex-1 p-5">
      <div className="flex gap-5 items-start flex-wrap">
        {/* Left: cards panel */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(255,101,151,0.15)] border-2 border-[#f9b5e5] w-[580px] flex-none">
          <div className="text-[#ff6597] font-black text-base text-center mb-4 uppercase tracking-[0.15em]">Занятия</div>
          <div className="grid grid-cols-3 gap-2.5">
            {CARDS_DATA.map(card => (
              <DraggableCard
                key={card.id}
                card={card}
                placed={placedIds.has(card.id)}
                onDragStart={handleDragStart}
                onClick={setModalCard}
              />
            ))}
          </div>
        </div>

        {/* Right: categories grid */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-w-[480px]">
          {CATEGORIES.map(cat => (
            <CategoryPanel
              key={cat.id}
              category={cat}
              slots={slots[cat.id]}
              onDrop={(i) => handleDrop(cat.id, i)}
              onRemove={(i) => handleRemove(cat.id, i)}
              onCardClick={setModalCard}
            />
          ))}
        </div>
      </div>

      {/* Text fields */}
      <div className="flex gap-4 mt-5">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="font-black text-sm text-[#ff6597] drop-shadow">Впиши сюда свои цели, если их не было в списке</label>
          <textarea
            rows={6}
            value={goals}
            onChange={e => setGoals(e.target.value)}
            className="w-full rounded-2xl border-2 border-[#f9b5e5] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm resize-none focus:outline-none focus:border-[#ff6597] transition-colors"
            placeholder="Напиши цели сюда"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="font-black text-sm text-[#ff6597] drop-shadow">Напиши план по достижению одной цели</label>
          <textarea
            rows={6}
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            className="w-full rounded-2xl border-2 border-[#f9b5e5] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm resize-none focus:outline-none focus:border-[#ff6597] transition-colors"
            placeholder="Напиши план здесь"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-center mt-6 pb-8">
        <button
          onClick={submitAnswers}
          disabled={submitting}
          className="bg-[#ff6597] hover:bg-[#e5497f] text-white rounded-2xl px-16 py-4 font-black text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,101,151,0.45)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#c73a6a]"
        >
          {submitting ? 'Отправка...' : 'Отправить ответы'}
        </button>
      </div>

      </div>{/* end flex-1 p-5 */}

      {modalCard && <CardModal card={modalCard} onClose={() => setModalCard(null)} />}
      {result && <ResultOverlay correct={result.correct} total={result.total} onPlayAgain={resetGame} />}
    </div>
  );
}
