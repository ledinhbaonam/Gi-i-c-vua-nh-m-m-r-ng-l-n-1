import React, { useState } from 'react';
import { Settings, X, KeyRound, Check, RefreshCw, Download } from 'lucide-react';
import { TournamentState } from '../types/tournament';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  currentPin: string;
  onSaveSettings: (newTitle: string, newPin: string) => void;
  onResetTournament: () => void;
  tournamentState: TournamentState;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  currentPin,
  onSaveSettings,
  onResetTournament,
  tournamentState,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [newPin, setNewPin] = useState(currentPin);
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) return;
    onSaveSettings(title, newPin.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tournamentState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `giai-co-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Cài Đặt Quản Trị Giải Đấu
            </h3>
            <p className="text-xs text-slate-400">
              Cấu hình tên giải, đổi mã PIN bảo vệ và sao lưu dữ liệu
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tên giải đấu
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mật khẩu quản trị mới
            </label>
            <div className="relative">
              <input
                type="password"
                required
                maxLength={30}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ghi nhớ mật khẩu này để đăng nhập vào trang quản trị sau này.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file dự phòng (.json)</span>
            </button>

            <button
              type="submit"
              disabled={isSaved}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>

        {/* Danger zone / Reset tournament */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            Vùng nhạy cảm
          </div>
          {showConfirmReset ? (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2">
              <p className="text-xs text-rose-300">
                Bạn có chắc chắn muốn đặt lại giải đấu? Toàn bộ lịch thi đấu và kết quả sẽ bị xóa về trạng thái ban đầu.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetTournament();
                    setShowConfirmReset(false);
                    onClose();
                  }}
                  className="py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Xác nhận xóa & làm mới
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="py-1 px-3 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu gốc của giải đấu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
