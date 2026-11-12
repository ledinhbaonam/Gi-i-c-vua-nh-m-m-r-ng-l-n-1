import React, { useState } from 'react';
import { Shield, Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyPin: (pin: string) => boolean;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onVerifyPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onVerifyPin(pin)) {
      setError(false);
      setPin('');
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3 text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            Xác Thực Quyền Quản Trị
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng nhập mã PIN quản trị viên để mở quyền nhập lịch và kết quả thi đấu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="password"
                maxLength={20}
                autoFocus
                placeholder="Nhập mật khẩu quản trị..."
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className={`w-full text-center text-xl tracking-widest bg-slate-950 border rounded-2xl py-3 px-4 text-white focus:outline-none transition-colors ${
                  error
                    ? 'border-rose-500 text-rose-300'
                    : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Mật khẩu không chính xác. Vui lòng thử lại!</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950 cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
