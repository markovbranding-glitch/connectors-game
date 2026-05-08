'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CARDS_DATA, CATEGORIES, CardData } from '@/lib/data';
import DraggableCard from './DraggableCard';
import CategoryPanel from './CategoryPanel';
import CardModal from './CardModal';
import ResultOverlay from './ResultOverlay';

type SlotState = Record<string, (CardData | null)[]>;
type User = { id: string; name: string };

const GHOST_COLORS: Record<string, string> = {
  'c-red': '#ff6597', 'c-pink': '#ff6597',
  'c-rose': '#e5497f', 'c-coral': '#e5497f',
  'c-fuchsia': '#d44fa0', 'c-violet': '#c040a0', 'c-purple': '#b03898',
  'c-indigo': '#3a9fd4', 'c-blue': '#50b0e0', 'c-sky': '#60bce8',
  'c-teal': '#38b0c8', 'c-cyan': '#30a8c8',
  'c-amber': '#c88800', 'c-orange': '#d07800',
  'c-green': '#95b755', 'c-emerald': '#7a9a40', 'c-lime': '#88aa48',
};

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
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchDragActiveRef = useRef(false);

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

  const handleDrop = useCallback((categoryId: string, slotIndex: number) => {
    const card = draggedCardRef.current;
    if (!card) return;
    setSlots(prev => {
      if (prev[categoryId][slotIndex] !== null) return prev;
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
  }, []);

  const handleRemove = (categoryId: string, slotIndex: number) => {
    setSlots(prev => {
      const arr = [...prev[categoryId]];
      arr[slotIndex] = null;
      return { ...prev, [categoryId]: arr };
    });
  };

  // ── Touch drag ────────────────────────────────────────────────────────────
  const handleTouchCardStart = useCallback((card: CardData, e: React.TouchEvent) => {
    const touch = e.touches[0];
    draggedCardRef.current = card;
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    touchDragActiveRef.current = false;
  }, []);

  const createGhost = useCallback((card: CardData, x: number, y: number) => {
    const el = document.createElement('div');
    el.textContent = card.text;
    el.style.cssText = [
      'position:fixed',
      `top:${y - 34}px`,
      `left:${x - 60}px`,
      'width:120px',
      'pointer-events:none',
      'z-index:9999',
      'opacity:0.92',
      'transform:scale(1.08) rotate(-2deg)',
      'border-radius:16px',
      'padding:10px 12px',
      `background:${GHOST_COLORS[card.color] ?? '#ff6597'}`,
      'color:white',
      'font-weight:900',
      'font-size:13px',
      'font-family:Mulish,sans-serif',
      'text-align:center',
      'line-height:1.3',
      'box-shadow:0 8px 24px rgba(0,0,0,0.25)',
      'user-select:none',
    ].join(';');
    document.body.appendChild(el);
    ghostRef.current = el as unknown as HTMLDivElement;
  }, []);

  const removeGhost = useCallback(() => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!draggedCardRef.current) return;
      const touch = e.touches[0];

      if (!touchDragActiveRef.current) {
        const start = touchStartPosRef.current;
        if (!start) return;
        if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) < 8) return;
        touchDragActiveRef.current = true;
        createGhost(draggedCardRef.current, touch.clientX, touch.clientY);
      }

      e.preventDefault();
      if (ghostRef.current) {
        ghostRef.current.style.top = `${touch.clientY - 34}px`;
        ghostRef.current.style.left = `${touch.clientX - 60}px`;
      }
    };

    const onEnd = (e: TouchEvent) => {
      const card = draggedCardRef.current;
      const wasDragging = touchDragActiveRef.current;

      touchStartPosRef.current = null;
      touchDragActiveRef.current = false;
      removeGhost();

      if (!card || !wasDragging) {
        draggedCardRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      let target: Element | null = document.elementFromPoint(touch.clientX, touch.clientY);
      while (target) {
        const catId = target.getAttribute('data-cat-id');
        const slotIdx = target.getAttribute('data-slot-index');
        if (catId && slotIdx !== null) {
          handleDrop(catId, parseInt(slotIdx)); // handleDrop reads & clears draggedCardRef
          return;
        }
        target = target.parentElement;
      }
      draggedCardRef.current = null;
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [createGhost, removeGhost, handleDrop]);

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
        <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-sm shadow-[0_8px_40px_rgba(255,101,151,0.25)] flex flex-col items-center gap-6">
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
        <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-lg shadow-[0_8px_40px_rgba(255,101,151,0.25)] flex flex-col items-center gap-6">
          <Image src="/logo-auth-v3.png" alt="YOLO" width={120} height={120} className="object-contain" priority unoptimized />
          <div className="text-base sm:text-lg font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-center">
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
      <header className="bg-white/90 backdrop-blur-md border-b-2 border-[#f9b5e5] px-3 lg:px-6 py-2 lg:py-3 flex items-center justify-between shadow-[0_2px_16px_rgba(255,101,151,0.15)] sticky top-0 z-50">
        <Image src="/logo-header-v2.png" alt="YOLO" width={120} height={48} className="object-contain w-24 lg:w-40" unoptimized />
        <div className="hidden sm:block text-center">
          <div className="text-[#ff6597] font-black text-sm lg:text-lg leading-none">ФАНТАЗИЯ, МЕЧТА, ЦЕЛЬ</div>
          <div className="text-[#999a9b] font-semibold text-xs mt-0.5">Распредели занятия по категорям</div>
        </div>
        <div className="flex items-center gap-1 lg:gap-2 bg-[#fff0f5] border-2 border-[#f9b5e5] rounded-xl lg:rounded-2xl px-2 lg:px-4 py-1.5 lg:py-2">
          <span className="hidden sm:inline text-xl">👋</span>
          <span className="font-black text-[#ff6597] text-xs lg:text-sm">{activeUser.name}</span>
        </div>
      </header>

      <div className="flex-1 p-3 lg:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-start">
          {/* Cards panel */}
          <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-[0_4px_24px_rgba(255,101,151,0.15)] border-2 border-[#f9b5e5] w-full lg:w-[580px] lg:flex-none">
            <div className="text-[#ff6597] font-black text-base text-center mb-4 uppercase tracking-[0.15em]">Занятия</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-2.5">
              {CARDS_DATA.map(card => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  placed={placedIds.has(card.id)}
                  onDragStart={handleDragStart}
                  onTouchStart={handleTouchCardStart}
                  onClick={setModalCard}
                />
              ))}
            </div>
          </div>

          {/* Categories grid */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full lg:flex-1">
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
        <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-5">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="font-black text-sm text-[#ff6597] drop-shadow">Впиши сюда свои цели, если их не было в списке</label>
            <textarea
              rows={5}
              value={goals}
              onChange={e => setGoals(e.target.value)}
              className="w-full rounded-2xl border-2 border-[#f9b5e5] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm resize-none focus:outline-none focus:border-[#ff6597] transition-colors"
              placeholder="Напиши цели сюда"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="font-black text-sm text-[#ff6597] drop-shadow">Напиши план по достижению одной цели</label>
            <textarea
              rows={5}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              className="w-full rounded-2xl border-2 border-[#f9b5e5] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm resize-none focus:outline-none focus:border-[#ff6597] transition-colors"
              placeholder="Напиши план здесь"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center mt-5 pb-8">
          <button
            onClick={submitAnswers}
            disabled={submitting}
            className="bg-[#ff6597] hover:bg-[#e5497f] text-white rounded-2xl px-12 sm:px-16 py-4 font-black text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,101,151,0.45)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#c73a6a] w-full sm:w-auto"
          >
            {submitting ? 'Отправка...' : 'Отправить ответы'}
          </button>
        </div>
      </div>

      {modalCard && <CardModal card={modalCard} onClose={() => setModalCard(null)} />}
      {result && <ResultOverlay correct={result.correct} total={result.total} onPlayAgain={resetGame} />}
    </div>
  );
}
