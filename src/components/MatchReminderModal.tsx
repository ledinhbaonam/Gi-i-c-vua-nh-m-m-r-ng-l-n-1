/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, KnockoutMatch, Player } from '../types/tournament';
import { getMatchStartDateTime, formatSessionName } from '../utils/tournamentEngine';
import {
  playNotificationChime,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../utils/alertSound';
import { ActiveTab } from './Navbar';
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  X,
  Swords,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ChevronRight,
  Radio,
  Sliders,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface MatchReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  players: Player[];
  onSelectTab: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  alertThresholdMinutes: number;
  onChangeThreshold: (minutes: number) => void;
  filterPlayerId: string;
  onChangeFilterPlayer: (playerId: string) => void;
}

export const MatchReminderModal: React.FC<MatchReminderModalProps> = ({
  isOpen,
  onClose,
  matches,
  knockoutMatches,
  players,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  alertThresholdMinutes,
  onChangeThreshold,
  filterPlayerId,
  onChangeFilterPlayer,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Live timer tick every second for real-time countdown
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute all scheduled matches with start time
  const now = currentTime.getTime();
  const upcomingList: {
    id: string;
    title: string;
    p1Name: string;
    p2Name: string;
    p1Id?: string;
    p2Id?: string;
    date: string;
    time: string;
    session?: string;
    tableNumber?: number;
    diffMs: number;
    diffMinutes: number;
    startDate: Date;
    isKnockout: boolean;
    isLive?: boolean;
    matchRef: Match | KnockoutMatch;
  }[] = [];

  // Group stage
  for (const m of matches) {
    if (m.status === 'finished' || (m.score1 !== undefined && m.score2 !== undefined)) continue;
    if (!m.date || !m.time) continue;
    const start = getMatchStartDateTime(m.date, m.time);
    if (!start) continue;

    // Filter by player if selected
    if (filterPlayerId && filterPlayerId !== 'all') {
      if (m.player1Id !== filterPlayerId && m.player2Id !== filterPlayerId) {
        continue;
      }
    }

    const diffMs = start.getTime() - now;
    const p1 = players.find((p) => p.id === m.player1Id)?.name || 'Kỳ thủ 1';
    const p2 = players.find((p) => p.id === m.player2Id)?.name || 'Kỳ thủ 2';

    upcomingList.push({
      id: m.id,
      title: `Bảng ${m.group} · Lượt ${m.round} (${m.leg === 'di' ? 'Đi' : 'Về'}) · Bàn ${m.tableNumber || 1}`,
      p1Name: p1,
      p2Name: p2,
      p1Id: m.player1Id,
      p2Id: m.player2Id,
      date: m.date,
      time: m.time,
      session: formatSessionName(m.session, m.time),
      tableNumber: m.tableNumber || 1,
      diffMs,
      diffMinutes: Math.floor(diffMs / 60000),
      startDate: start,
      isKnockout: false,
      isLive: m.isLive,
      matchRef: m,
    });
  }

  // Knockout
  for (const k of knockoutMatches) {
    if (k.status === 'finished' || (k.score1 !== undefined && k.score2 !== undefined && k.winnerId)) continue;
    if (!k.date || !k.time) continue;
    const start = getMatchStartDateTime(k.date, k.time);
    if (!start) continue;

    if (filterPlayerId && filterPlayerId !== 'all') {
      if (k.player1Id !== filterPlayerId && k.player2Id !== filterPlayerId) {
        continue;
      }
    }

    const diffMs = start.getTime() - now;
    const p1 = players.find((p) => p.id === k.player1Id)?.name || k.player1Label;
    const p2 = players.find((p) => p.id === k.player2Id)?.name || k.player2Label;

    upcomingList.push({
      id: k.id,
      title: `${k.title} (Vòng loại trực tiếp)`,
      p1Name: p1,
      p2Name: p2,
      p1Id: k.player1Id,
      p2Id: k.player2Id,
      date: k.date,
      time: k.time,
      session: formatSessionName(k.session, k.time),
      diffMs,
      diffMinutes: Math.floor(diffMs / 60000),
      startDate: start,
      isKnockout: true,
      isLive: k.isLive,
      matchRef: k,
    });
  }

  // Sort upcoming list
  upcomingList.sort((a, b) => a.diffMs - b.diffMs);

  const formatCountdownVerbose = (diffMs: number): { text: string; badgeClass: string; isPast: boolean } => {
    if (diffMs <= 0) {
      const pastSeconds = Math.abs(Math.floor(diffMs / 1000));
      const m = Math.floor(pastSeconds / 60);
      const s = pastSeconds % 60;
      return {
        text: m > 0 ? `Đang diễn ra (Quá giờ ${m}m ${s}s)` : `Đang diễn ra ngay lúc này`,
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
        isPast: true,
      };
    }

    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (totalSec <= 300) {
      // Dưới 5 phút
      return {
        text: `Khẩn cấp: Còn ${pad(mins)}:${pad(secs)}`,
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse',
        isPast: false,
      };
    }
    if (hours > 0) {
      return {
        text: `Bắt đầu sau ${hours} giờ ${mins} phút`,
        badgeClass: 'bg-slate-900 text-slate-300 border-slate-800',
        isPast: false,
      };
    }
    return {
      text: `Bắt đầu sau ${mins} phút ${pad(secs)}s`,
      badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
      isPast: false,
    };
  };

  const handleRequestBrowserPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      sendBrowserNotification(
        '🔔 Đã kích hoạt thông báo thành công!',
        'Hệ thống giải đấu sẽ tự động gửi cảnh báo khi ván đấu của bạn chuẩn bị bắt đầu.'
      );
      setTestNotificationSent(true);
    }
  };

  const handleTestChime = () => {
    playNotificationChime('imminent');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                Thông Báo & Cảnh Báo Lịch Thi Đấu
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động phát hiện ván đấu sắp diễn ra theo thời gian thực (Real-time countdown)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Cấu hình nhắc nhở & Âm thanh */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Cài đặt thông báo & cảnh báo</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                Đang kích hoạt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chọn mốc thời gian cảnh báo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nhắc trước khi bắt đầu
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  {[10, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onChangeThreshold(mins)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
                        alertThresholdMinutes === mins
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins}p
                    </button>
                  ))}
                </div>
              </div>

              {/* Lọc theo Kỳ thủ cá nhân */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Chế độ nhận thông báo</span>
                  <span className="text-[10px] text-indigo-400">Dành cho kỳ thủ</span>
                </label>
                <select
                  value={filterPlayerId}
                  onChange={(e) => onChangeFilterPlayer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Tất cả trận đấu (Ban tổ chức / Khán giả)</option>
                  <optgroup label="Chọn nhận riêng cho Kỳ thủ:">
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        Kỳ thủ: {p.name} (Bảng {p.group})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Điều khiển Âm thanh & Desktop Notifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Âm thanh chuông */}
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${soundEnabled ? 'bg-amber-950/70 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Chuông nhắc nhở</div>
                    <div className="text-[10px] text-slate-400">Âm thanh thể thao nhẹ nhàng</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTestChime}
                    title="Phát thử âm thanh"
                    className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  >
                    Thử
                  </button>
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                      soundEnabled ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {soundEnabled ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              </div>

              {/* Thông báo đẩy Desktop Notification */}
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-sky-950/70 text-sky-300">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Thông báo màn hình</div>
                    <div className="text-[10px] text-slate-400">
                      {browserPermission === 'granted' ? 'Đã cho phép trên trình duyệt' : 'Hiển thị kể cả khi đổi tab'}
                    </div>
                  </div>
                </div>

                <div>
                  {browserPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã bật
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestBrowserPermission}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Bật ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách các ván đấu tiếp theo & Thời gian đếm ngược trực tiếp */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Các ván đấu tiếp theo ({upcomingList.length} ván)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Cập nhật từng giây theo thời gian thực
              </span>
            </div>

            {upcomingList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-300">
                  {filterPlayerId !== 'all'
                    ? 'Kỳ thủ được chọn hiện không có ván đấu nào đang chờ diễn ra.'
                    : 'Hiện chưa có ván đấu nào sắp diễn ra hoặc tất cả các ván đã kết thúc.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Quản trị viên có thể thêm lịch mới tại tab "Lịch thi đấu".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingList.slice(0, 8).map((item) => {
                  const countdown = formatCountdownVerbose(item.diffMs);
                  const isImminent = item.diffMs > 0 && item.diffMinutes <= alertThresholdMinutes;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        countdown.isPast
                          ? 'bg-rose-950/25 border-rose-800/70'
                          : isImminent
                          ? 'bg-amber-950/25 border-amber-700/80 shadow-md shadow-amber-950/20'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">
                            {item.title}
                          </span>
                          <span className="text-slate-500 text-xs" aria-hidden="true">·</span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.time} ({item.date}) · Buổi {item.session}
                          </span>
                          {item.isLive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                              <Radio className="w-3 h-3" />
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-200">
                            {item.p1Name} (Trắng)
                          </span>
                          <Swords className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-semibold text-slate-200">
                            {item.p2Name} (Đen)
                          </span>
                        </div>
                      </div>

                      {/* Cột đếm ngược & nút xem */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <div
                          className={`px-3 py-1 rounded-xl text-xs font-bold border tabular-nums whitespace-nowrap ${countdown.badgeClass}`}
                        >
                          {countdown.text}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectTab(item.isKnockout ? 'knockout' : 'schedule');
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span>Xem</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lời khuyên chuẩn bị cho Ban tổ chức & Kỳ thủ */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
            <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-200">
                Quy trình chuẩn bị thi đấu chuẩn:
              </span>
              <p>
                - <strong>Ban tổ chức / Trọng tài:</strong> Chuẩn bị bàn cờ, đồng hồ bấm giờ (theo quy định 10p + 5s tích lũy), kiểm tra đường truyền và luồng phát OBS Studio.
              </p>
              <p>
                - <strong>Kỳ thủ:</strong> Có mặt tại bàn đấu trước 5 phút để xác nhận bên cầm Trắng/Đen. Trễ quá 15 phút sẽ bị xử thua ván đấu theo luật FIDE.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Thời gian hệ thống: {currentTime.toLocaleTimeString('vi-VN')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
