import React, { useState } from 'react';
import { Sparkles, X, Calendar, Check } from 'lucide-react';
import { GroupId, Player, Match } from '../types/tournament';
import { generateStandardRoundRobin } from '../utils/tournamentEngine';

interface QuickPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddBatchMatches: (newMatches: Match[]) => void;
}

export const QuickPairModal: React.FC<QuickPairModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddBatchMatches,
}) => {
  const [targetGroup, setTargetGroup] = useState<'both' | GroupId>('both');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    let generated: Match[] = [];

    if (targetGroup === 'both' || targetGroup === 'A') {
      const matchesA = generateStandardRoundRobin('A', players, startDate);
      generated = [...generated, ...matchesA];
    }

    if (targetGroup === 'both' || targetGroup === 'B') {
      const matchesB = generateStandardRoundRobin('B', players, startDate);
      generated = [...generated, ...matchesB];
    }

    onAddBatchMatches(generated);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Gợi Ý Tạo Lịch Thi Đấu 6 Lượt Tự Động
            </h3>
            <p className="text-xs text-slate-400">
              Ghép cặp vòng tròn 2 lượt (Đi & Về) chuẩn cho 4 kỳ thủ trong bảng
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Chọn bảng đấu cần tạo lịch
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetGroup('both')}
                className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  targetGroup === 'both'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cả 2 Bảng
              </button>
              <button
                type="button"
                onClick={() => setTargetGroup('A')}
                className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  targetGroup === 'A'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bảng A (4 người)
              </button>
              <button
                type="button"
                onClick={() => setTargetGroup('B')}
                className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  targetGroup === 'B'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bảng B (4 người)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ngày bắt đầu thi đấu
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ phân bổ hợp lý các ván đấu theo buổi Sáng (08:00, 09:30) và Chiều (14:00, 15:30) qua các lượt đấu.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã thêm lịch thành công!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo lịch ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
