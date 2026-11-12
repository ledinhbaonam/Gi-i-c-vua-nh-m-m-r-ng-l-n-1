import React from 'react';
import { Match, KnockoutMatch, Player } from '../types/tournament';
import { formatChessScore } from '../utils/tournamentEngine';
import { Trophy, Radio } from 'lucide-react';

interface ObsOverlayViewProps {
  match: Match | KnockoutMatch | null;
  players: Player[];
  tournamentTitle: string;
}

export const ObsOverlayView: React.FC<ObsOverlayViewProps> = ({
  match,
  players,
  tournamentTitle,
}) => {
  if (!match) {
    return (
      <div className="min-h-screen bg-transparent p-6 text-white font-sans flex items-center justify-center">
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-md">
          <p className="text-sm font-bold text-amber-400">OBS Overlay Sẵn Sàng</p>
          <p className="text-xs text-slate-400 mt-1">Đang chờ tín hiệu trận đấu...</p>
        </div>
      </div>
    );
  }

  const getPlayerName = (id?: string) => {
    if (!id) return 'Chưa xác định';
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : id;
  };

  const isKnockout = 'stage' in match;
  const p1Name = isKnockout
    ? match.player1Id
      ? getPlayerName(match.player1Id)
      : (match as KnockoutMatch).player1Label
    : getPlayerName((match as Match).player1Id);

  const p2Name = isKnockout
    ? match.player2Id
      ? getPlayerName(match.player2Id)
      : (match as KnockoutMatch).player2Label
    : getPlayerName((match as Match).player2Id);

  const matchTitle = isKnockout
    ? (match as KnockoutMatch).title
    : `Bảng ${(match as Match).group} · Lượt ${(match as Match).round} (${(match as Match).leg === 'di' ? 'Đi' : 'Về'})`;

  const isLive = !!match.isLive;
  const isFinished = match.status === 'finished';

  return (
    <div className="min-h-screen bg-transparent p-6 font-sans flex flex-col justify-end pointer-events-none select-none">
      {/* Broadcast Scoreboard Lower Third / Top Bar for OBS */}
      <div className="max-w-2xl bg-slate-950/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white animate-fade-in">
        {/* Top Header metadata */}
        <div className="flex items-center justify-between text-xs pb-2.5 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white">
              <Trophy className="w-3 h-3" />
            </div>
            <span className="font-extrabold uppercase tracking-wider text-slate-300 text-[11px]">
              {tournamentTitle}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold text-[11px]">{matchTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                OBS LIVE
              </span>
            ) : isFinished ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                KẾT THÚC
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                TRỰC TIẾP
              </span>
            )}
          </div>
        </div>

        {/* Players & Scoreboard Row */}
        <div className="grid grid-cols-12 items-center gap-2">
          {/* Player 1 (White) */}
          <div className="col-span-5 flex items-center justify-end gap-2 text-right min-w-0">
            <div className="min-w-0">
              <div className="text-base font-extrabold text-white truncate drop-shadow-sm">
                {p1Name}
              </div>
              <div className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-white border border-slate-500 inline-block" />
                <span>Trắng (Tiên)</span>
              </div>
            </div>
          </div>

          {/* Score Badge */}
          <div className="col-span-2 flex items-center justify-center">
            <div className="px-3 py-1.5 bg-slate-900 border border-indigo-500/50 rounded-xl text-center shadow-inner">
              <div className="text-sm font-black text-amber-400 tabular-nums">
                {formatChessScore(match.score1, match.score2)}
              </div>
            </div>
          </div>

          {/* Player 2 (Black) */}
          <div className="col-span-5 flex items-center justify-start gap-2 text-left min-w-0">
            <div className="min-w-0">
              <div className="text-base font-extrabold text-white truncate drop-shadow-sm">
                {p2Name}
              </div>
              <div className="text-[10px] font-bold text-slate-400 flex items-center justify-start gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-600 inline-block" />
                <span>Đen (Hậu)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
