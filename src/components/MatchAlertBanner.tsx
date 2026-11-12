/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Match, KnockoutMatch, Player } from '../types/tournament';
import { getMatchStartDateTime, formatSessionName } from '../utils/tournamentEngine';
import { playNotificationChime, sendBrowserNotification } from '../utils/alertSound';
import { ActiveTab } from './Navbar';
import {
  Bell,
  Clock,
  Swords,
  Radio,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface AlertMatchItem {
  id: string;
  isKnockout: boolean;
  title: string;
  stageLabel: string;
  p1Name: string;
  p2Name: string;
  p1Id?: string;
  p2Id?: string;
  tableNumber?: number;
  date: string;
  time: string;
  session?: string;
  startTime: Date;
  diffMs: number;
  diffMinutes: number;
  diffSeconds: number;
  urgency: 'starting_now' | 'urgent' | 'imminent';
  isLive?: boolean;
  liveUrl?: string;
  replayUrl?: string;
  originalMatch: Match | KnockoutMatch;
}

interface MatchAlertBannerProps {
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  players: Player[];
  onSelectTab: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  alertThresholdMinutes: number;
  filterPlayerId?: string;
  onOpenReminderSettings: () => void;
}

export const MatchAlertBanner: React.FC<MatchAlertBannerProps> = ({
  matches,
  knockoutMatches,
  players,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  alertThresholdMinutes,
  filterPlayerId,
  onOpenReminderSettings,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [dismissedMatchIds, setDismissedMatchIds] = useState<Set<string>>(new Set());
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  // Track match IDs that already played sound / notification to prevent repeating every second
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Live timer tick every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute all upcoming and starting matches
  const alertItems: AlertMatchItem[] = useMemo(() => {
    const items: AlertMatchItem[] = [];
    const now = currentTime.getTime();

    // 1. Group Stage Matches
    for (const m of matches) {
      // Bỏ qua trận đã kết thúc hoặc đã có kết quả tỉ số
      if (m.status === 'finished' || (m.score1 !== undefined && m.score2 !== undefined)) {
        continue;
      }
      if (!m.date || !m.time) continue;

      const startDate = getMatchStartDateTime(m.date, m.time);
      if (!startDate) continue;

      const diffMs = startDate.getTime() - now;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);

      // Lọc nếu người dùng chọn chỉ xem ván của 1 kỳ thủ cụ thể
      if (filterPlayerId && filterPlayerId !== 'all') {
        if (m.player1Id !== filterPlayerId && m.player2Id !== filterPlayerId) {
          continue;
        }
      }

      // Ván đấu hợp lệ để cảnh báo:
      // A. Sắp diễn ra trong vòng alertThresholdMinutes (mặc định 30 phút)
      // B. Đã đến giờ thi đấu trong vòng 90 phút mà chưa kết thúc
      const isImminent = diffMs > 0 && diffMinutes <= alertThresholdMinutes;
      const isStartingNow = diffMs <= 0 && diffMs >= -90 * 60 * 1000;

      if (isImminent || isStartingNow) {
        let urgency: 'starting_now' | 'urgent' | 'imminent' = 'imminent';
        if (isStartingNow) {
          urgency = 'starting_now';
        } else if (diffMinutes <= 5) {
          urgency = 'urgent';
        }

        const p1 = players.find((p) => p.id === m.player1Id)?.name || 'Kỳ thủ 1';
        const p2 = players.find((p) => p.id === m.player2Id)?.name || 'Kỳ thủ 2';

        items.push({
          id: m.id,
          isKnockout: false,
          title: `Bảng ${m.group} · Lượt ${m.round} (${m.leg === 'di' ? 'Đi' : 'Về'}) · Bàn ${m.tableNumber || 1}`,
          stageLabel: `Bảng ${m.group}`,
          p1Name: p1,
          p2Name: p2,
          p1Id: m.player1Id,
          p2Id: m.player2Id,
          tableNumber: m.tableNumber || 1,
          date: m.date,
          time: m.time,
          session: formatSessionName(m.session, m.time),
          startTime: startDate,
          diffMs,
          diffMinutes,
          diffSeconds,
          urgency,
          isLive: m.isLive,
          liveUrl: m.liveUrl,
          replayUrl: m.replayUrl,
          originalMatch: m,
        });
      }
    }

    // 2. Knockout Matches
    for (const k of knockoutMatches) {
      if (k.status === 'finished' || (k.score1 !== undefined && k.score2 !== undefined && k.winnerId)) {
        continue;
      }
      if (!k.date || !k.time) continue;

      const startDate = getMatchStartDateTime(k.date, k.time);
      if (!startDate) continue;

      const diffMs = startDate.getTime() - now;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);

      if (filterPlayerId && filterPlayerId !== 'all') {
        if (k.player1Id !== filterPlayerId && k.player2Id !== filterPlayerId) {
          continue;
        }
      }

      const isImminent = diffMs > 0 && diffMinutes <= alertThresholdMinutes;
      const isStartingNow = diffMs <= 0 && diffMs >= -120 * 60 * 1000;

      if (isImminent || isStartingNow) {
        let urgency: 'starting_now' | 'urgent' | 'imminent' = 'imminent';
        if (isStartingNow) {
          urgency = 'starting_now';
        } else if (diffMinutes <= 5) {
          urgency = 'urgent';
        }

        const p1 = players.find((p) => p.id === k.player1Id)?.name || k.player1Label;
        const p2 = players.find((p) => p.id === k.player2Id)?.name || k.player2Label;

        items.push({
          id: k.id,
          isKnockout: true,
          title: `${k.title} · Vòng loại trực tiếp`,
          stageLabel: k.title,
          p1Name: p1,
          p2Name: p2,
          p1Id: k.player1Id,
          p2Id: k.player2Id,
          date: k.date,
          time: k.time,
          session: formatSessionName(k.session, k.time),
          startTime: startDate,
          diffMs,
          diffMinutes,
          diffSeconds,
          urgency,
          isLive: k.isLive,
          liveUrl: k.liveUrl,
          replayUrl: k.replayUrl,
          originalMatch: k,
        });
      }
    }

    // Sắp xếp các trận: trận đang/sắp bắt đầu sớm nhất xếp lên đầu
    return items.sort((a, b) => a.diffMs - b.diffMs);
  }, [matches, knockoutMatches, players, currentTime, alertThresholdMinutes, filterPlayerId]);

  // Lọc bỏ những ván người dùng đã bấm Tắt cảnh báo tạm thời
  const visibleAlerts = useMemo(() => {
    return alertItems.filter((item) => !dismissedMatchIds.has(item.id));
  }, [alertItems, dismissedMatchIds]);

  // Xử lý gửi chuông âm thanh và desktop notification khi trận đấu bước vào mốc cảnh báo
  useEffect(() => {
    for (const item of visibleAlerts) {
      const eventKey = `${item.id}_${item.urgency}`;
      if (!notifiedEventsRef.current.has(eventKey)) {
        notifiedEventsRef.current.add(eventKey);

        // Phát chuông nếu người dùng bật âm thanh
        if (soundEnabled) {
          if (item.urgency === 'starting_now') {
            playNotificationChime('start');
          } else if (item.urgency === 'urgent') {
            playNotificationChime('urgent');
          } else {
            playNotificationChime('imminent');
          }
        }

        // Gửi HTML5 Desktop Notification
        const timePrefix =
          item.urgency === 'starting_now'
            ? '🔔 ĐẾN GIỜ THI ĐẤU:'
            : item.urgency === 'urgent'
            ? '⚠️ VÁN ĐẤU SẮP BẮT ĐẦU (< 5 PHÚT):'
            : '⏳ THÔNG BÁO VÁN ĐẤU SẮP DIỄN RA:';

        const bodyText = `${item.title}: ${item.p1Name} gặp ${item.p2Name} lúc ${item.time}. Xin ban tổ chức và kỳ thủ chuẩn bị!`;
        sendBrowserNotification(timePrefix, bodyText);
      }
    }
  }, [visibleAlerts, soundEnabled]);

  // Giữ index trong giới hạn
  useEffect(() => {
    if (activeAlertIndex >= visibleAlerts.length) {
      setActiveAlertIndex(Math.max(0, visibleAlerts.length - 1));
    }
  }, [visibleAlerts.length, activeAlertIndex]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  const currentAlert = visibleAlerts[activeAlertIndex] || visibleAlerts[0];

  // Tính chuỗi đếm ngược trực tiếp từng giây
  const formatCountdown = (diffMs: number): string => {
    if (diffMs <= 0) {
      const pastSeconds = Math.abs(Math.floor(diffMs / 1000));
      const m = Math.floor(pastSeconds / 60);
      const s = pastSeconds % 60;
      return m > 0 ? `Đã quá giờ ${m}m ${s}s` : `Đang trong giờ thi đấu`;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours} giờ ${pad(minutes)} phút ${pad(seconds)}s`;
    }
    return `${pad(minutes)} phút ${pad(seconds)} giây`;
  };

  const handleDismiss = (id: string) => {
    setDismissedMatchIds((prev) => new Set(prev).add(id));
  };

  const urgencyStyles = {
    starting_now: {
      bg: 'bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-rose-500/80 text-rose-100',
      badge: 'bg-rose-600 text-white animate-pulse',
      icon: 'text-rose-400',
      label: 'ĐÃ ĐẾN GIỜ THI ĐẤU',
    },
    urgent: {
      bg: 'bg-gradient-to-r from-amber-950/90 via-orange-900/80 to-amber-950/90 border-amber-500/80 text-amber-100',
      badge: 'bg-amber-600 text-white animate-pulse',
      icon: 'text-amber-400',
      label: 'CHUẨN BỊ KHẨN CẤP (< 5 PHÚT)',
    },
    imminent: {
      bg: 'bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-indigo-950/90 border-indigo-500/70 text-indigo-100',
      badge: 'bg-indigo-600 text-white',
      icon: 'text-indigo-400',
      label: 'SẮP DIỄN RA · CHUẨN BỊ THI ĐẤU',
    },
  }[currentAlert.urgency];

  return (
    <aside aria-label="Cảnh báo ván đấu sắp diễn ra" className="relative z-30 w-full border-b border-indigo-900/40 shadow-xl transition-all">
      <div
        className={`w-full px-4 sm:px-6 py-3 border-y backdrop-blur-md ${urgencyStyles.bg}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Cột trái: Huy hiệu cảnh báo & Thông tin trận đấu */}
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/10 shrink-0 mt-0.5 sm:mt-0">
              <Bell className={`w-5 h-5 ${urgencyStyles.icon} animate-bounce`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${urgencyStyles.badge}`}>
                  {urgencyStyles.label}
                </span>

                <span className="text-xs font-semibold text-slate-300">
                  {currentAlert.title}
                </span>

                <span className="hidden sm:inline text-slate-500" aria-hidden="true">·</span>

                <div className="flex items-center gap-1 text-xs text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentAlert.time} ngày {currentAlert.date}</span>
                </div>

                {visibleAlerts.length > 1 && (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.2 rounded-md border border-amber-800/60">
                    Trận {activeAlertIndex + 1}/{visibleAlerts.length}
                  </span>
                )}
              </div>

              {/* Thông tin 2 kỳ thủ */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-white tracking-wide">
                  {currentAlert.p1Name}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 bg-slate-950/80 rounded border border-slate-700 text-slate-300">
                  Trắng / Tiên
                </span>

                <Swords className="w-3.5 h-3.5 text-indigo-400 mx-1 shrink-0" />

                <span className="font-bold text-white tracking-wide">
                  {currentAlert.p2Name}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 bg-slate-950/80 rounded border border-slate-700 text-slate-300">
                  Đen / Hậu
                </span>

                {currentAlert.isLive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                    <Radio className="w-3 h-3" />
                    ĐANG LIVE OBS
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Đồng hồ đếm ngược thời gian thực & Các nút thao tác nhanh */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            {/* Countdown Badge */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-white/15 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                  {currentAlert.diffMs <= 0 ? 'Trạng thái' : 'Đếm ngược thời gian'}
                </div>
                <div className="font-mono text-sm sm:text-base font-extrabold text-amber-300 tabular-nums">
                  {formatCountdown(currentAlert.diffMs)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Xem lịch thi đấu */}
              <button
                type="button"
                onClick={() => onSelectTab(currentAlert.isKnockout ? 'knockout' : 'schedule')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950 cursor-pointer whitespace-nowrap"
              >
                <span>Xem ván đấu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>



              {/* Bật/Tắt âm thanh chuông */}
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Đang bật chuông báo (Nhấn để tắt)' : 'Đang tắt chuông báo (Nhấn để bật)'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-amber-950/60 border-amber-600/70 text-amber-300 hover:bg-amber-900/70'
                    : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Mở popup cấu hình nhắc nhở */}
              <button
                type="button"
                onClick={onOpenReminderSettings}
                title="Cài đặt thông báo & chọn kỳ thủ theo dõi"
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>

              {/* Phân trang nếu có nhiều hơn 1 trận sắp diễn ra */}
              {visibleAlerts.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveAlertIndex((prev) => (prev > 0 ? prev - 1 : visibleAlerts.length - 1))}
                    title="Trận trước"
                    className="p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAlertIndex((prev) => (prev < visibleAlerts.length - 1 ? prev + 1 : 0))}
                    title="Trận kế tiếp"
                    className="p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Nút đóng / Tạm ẩn */}
              <button
                type="button"
                onClick={() => handleDismiss(currentAlert.id)}
                title="Tạm ẩn cảnh báo này"
                className="p-2 rounded-xl bg-slate-950/40 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
