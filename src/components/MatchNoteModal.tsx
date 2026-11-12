/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, KnockoutMatch, Player } from '../types/tournament';
import { X, FileText, Check, AlertCircle, Tag, Trash2 } from 'lucide-react';

interface MatchNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | KnockoutMatch | null;
  players: Player[];
  onSaveNotes: (matchId: string, notes: string, isKnockout?: boolean) => void;
}

const QUICK_TAGS = [
  'Lỗi kỹ thuật bàn đấu',
  'Biên bản bổ sung',
  'Thay đổi giờ đấu',
  'Kỳ thủ đến trễ 10p',
  'Khiếu nại đồng hồ thi đấu',
  'Đã kiểm tra kết nối OBS',
  'Hai kỳ thủ thống nhất hòa',
  'Trọng tài nhắc nhở tác phong',
];

export const MatchNoteModal: React.FC<MatchNoteModalProps> = ({
  isOpen,
  onClose,
  match,
  players,
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (match) {
      setNotes(match.notes || '');
    } else {
      setNotes('');
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const isKnockout = 'stage' in match;

  const getPlayerName = (id?: string): string => {
    if (!id) return '';
    return players.find((p) => p.id === id)?.name || id;
  };

  const p1 = 'player1Id' in match ? getPlayerName(match.player1Id) : '';
  const p2 = 'player2Id' in match ? getPlayerName(match.player2Id) : '';

  const matchTitle = isKnockout
    ? (match as KnockoutMatch).title
    : `Bảng ${(match as Match).group} · Lượt ${(match as Match).round} · Bàn ${(match as Match).tableNumber || 1}`;

  const handleAddTag = (tag: string) => {
    setNotes((prev) => {
      const clean = prev.trim();
      if (!clean) return tag;
      if (clean.includes(tag)) return clean;
      return `${clean} · ${tag}`;
    });
  };

  const handleClear = () => {
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(match.id, notes.trim(), isKnockout);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                Ghi Chú Riêng Trận Đấu (Ban Tổ Chức)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {matchTitle} {p1 && p2 ? `(${p1} vs ${p2})` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nội dung ghi chú & biên bản kỹ thuật:
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Bàn 2 gặp sự cố kết nối, bắt đầu trễ 5 phút. Kỳ thủ khiếu nại nước đi 34 đã được trọng tài giải quyết theo luật..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Quick Preset Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Gợi ý thẻ ghi chú nhanh (Bấm để chèn):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-950/25 border border-amber-800/40 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              Ghi chú này sẽ được hiển thị công khai trên thẻ ván đấu và tài liệu xuất bản in PDF để kỳ thủ, trọng tài và khán giả cùng nắm bắt.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            {notes ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ghi chú</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-md shadow-amber-950 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu ghi chú</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
