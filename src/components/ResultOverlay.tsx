'use client';

import Image from 'next/image';

interface Props {
  correct: number;
  total: number;
  onPlayAgain: () => void;
}

export default function ResultOverlay({ correct: _correct, total: _total, onPlayAgain: _onPlayAgain }: Props) {
  return (
    <div className="fixed inset-0 bg-[#bce3ff]/80 backdrop-blur-md flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-3xl p-10 text-center max-w-[380px] w-[90%] shadow-[0_24px_64px_rgba(255,101,151,0.3)] animate-slideUp border-2 border-[#f9b5e5] flex flex-col items-center gap-6">
        <Image src="/logo-auth-v3.png" alt="YOLO" width={160} height={160} className="object-contain" unoptimized />
        <p className="font-black text-[#ff6597] text-2xl">Спасибо за ваш ответ!</p>
      </div>
    </div>
  );
}
