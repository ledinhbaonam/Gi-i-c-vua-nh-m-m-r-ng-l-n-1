import React, { useState } from 'react';
import { Match, Player, NotificationLog, KnockoutMatch } from '../types/tournament';
import { formatChessScore, formatSessionName } from '../utils/tournamentEngine';
import { Bell, CheckCircle2, Calendar, Clock, Filter, Sparkles, Trophy } from 'lucide-react';

interface ResultsHistoryViewProps {
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  players: Player[];
  notifications: NotificationLog[];
}

export const ResultsHistoryView: React.FC<ResultsHistoryViewProps> = ({
  matches,
  knockoutMatches,
  players,
  notifications,
}) => {
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const getPlayerName = (id?: string) => players.find((p) => p.id === id)?.name || 'Kỳ thủ';

  // Get finished matches
  const finishedGroupMatches = matches
    .filter((m) => m.status === 'finished')
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const finishedKnockouts = knockoutMatches
    .filter((k) => k.status === 'finished')
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  // Filter finished matches by round
  const filteredFinished = finishedGroupMatches.filter((m) => {
    if (selectedRoundFilter === 'all') return true;
    return m.round.toString() === selectedRoundFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Hệ Thống Thông Báo Kết Quả Chi Tiết Từng Vòng Đấu
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi chi tiết các ván đấu vừa hoàn thành, thông báo tỉ số và người thắng theo thời gian thực
          </p>
        </div>

        {/* Round Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRoundFilter}
            onChange={(e) => setSelectedRoundFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Tất cả các lượt đấu</option>
            <option value="1">Lượt 1</option>
            <option value="2">Lượt 2</option>
            <option value="3">Lượt 3</option>
            <option value="4">Lượt 4</option>
            <option value="5">Lượt 5</option>
            <option value="6">Lượt 6</option>
          </select>
        </div>
      </div>

      {/* Finished Knockout Matches (if any) */}
      {finishedKnockouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            Kết Quả Vòng Knockout (Bán Kết & Chung Kết)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finishedKnockouts.map((k) => {
              const p1Name = getPlayerName(k.player1Id);
              const p2Name = getPlayerName(k.player2Id);
              return (
                <div
                  key={k.id}
                  className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs text-amber-300/80 mb-2 font-medium">
                    <span>{k.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {k.updatedAt ? new Date(k.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-bold text-white">{p1Name}</span>
                    <span className="px-3 py-1 bg-slate-950 border border-amber-700/60 rounded-lg text-xs font-bold text-amber-400 tabular-nums">
                      {k.wins1 !== undefined && k.wins2 !== undefined ? `${k.wins1} - ${k.wins2} (${formatChessScore(k.score1, k.score2)})` : formatChessScore(k.score1, k.score2)}
                    </span>
                    <span className="text-sm font-bold text-white">{p2Name}</span>
                  </div>
                  {k.outcomeNote && (
                    <div className="mt-2 text-[11px] text-amber-300/80 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/30">
                      {k.outcomeNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notification Stream / Finished Matches Cards */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Chi Tiết Kết Quả Các Ván Đấu Vòng Bảng ({filteredFinished.length} ván đã hoàn thành)
        </div>

        {filteredFinished.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="font-display text-sm font-semibold text-slate-300">
              Chưa có kết quả ván đấu nào ở lượt này
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Khi các ván đấu kết thúc và trọng tài/quản trị viên cập nhật điểm số, thông báo chi tiết sẽ tự động hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFinished.map((match) => {
              const p1 = getPlayerName(match.player1Id);
              const p2 = getPlayerName(match.player2Id);
              const scoreText = formatChessScore(match.score1, match.score2);

              let outcomeText = '';
              if (match.score1 === 1) outcomeText = `${p1} giành chiến thắng (+1 điểm)`;
              else if (match.score2 === 1) outcomeText = `${p2} giành chiến thắng (+1 điểm)`;
              else if (match.score1 === 0.5) outcomeText = 'Hai kỳ thủ hòa cờ (mỗi người +½ điểm)';

              return (
                <div
                  key={match.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg transition-all"
                >
                  {/* Tag bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800/70">
                    <span
                      className={`font-bold ${
                        match.group === 'A' ? 'text-amber-400' : 'text-sky-400'
                      }`}
                    >
                      Bảng {match.group} · Lượt {match.round} ({match.leg === 'di' ? 'Đi' : 'Về'})
                    </span>
                    <span>Buổi {formatSessionName(match.session, match.time)}</span>
                  </div>

                  {/* Duel and Score */}
                  <div className="py-2 flex items-center justify-between gap-2">
                    <div className="flex-1 text-right">
                      <div
                        className={`text-xs font-bold truncate ${
                          match.score1 === 1 ? 'text-emerald-400 font-extrabold' : 'text-slate-300'
                        }`}
                        title={p1}
                      >
                        {p1}
                      </div>
                      <div className="text-[10px] text-slate-400">Trắng</div>
                    </div>

                    <div className="px-2.5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-bold text-white tabular-nums tracking-wide shadow-inner shrink-0">
                      {scoreText}
                    </div>

                    <div className="flex-1 text-left">
                      <div
                        className={`text-xs font-bold truncate ${
                          match.score2 === 1 ? 'text-emerald-400 font-extrabold' : 'text-slate-300'
                        }`}
                        title={p2}
                      >
                        {p2}
                      </div>
                      <div className="text-[10px] text-slate-400">Đen</div>
                    </div>
                  </div>

                  {/* Outcome Highlight */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-emerald-300 font-medium truncate mr-1">
                      {outcomeText}
                    </span>
                    <span className="text-slate-400 shrink-0 tabular-nums">
                      {match.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>



      {/* Broadcast Feed / System Log */}
      {notifications.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              Nhật ký thông báo từ Ban Tổ Chức
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {notifications.length} thông báo
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-3 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 text-[10px]">
                      {notif.roundText}
                    </span>
                    <span>{notif.title}</span>
                  </div>
                  <div className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                    {notif.detail}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 tabular-nums pt-0.5">
                  {new Date(notif.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
