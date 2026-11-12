import React, { useState } from 'react';
import { KnockoutMatch, KnockoutStage, Player, Standing, KnockoutGame } from '../types/tournament';
import { formatChessScore, getMatchLiveStatus } from '../utils/tournamentEngine';
import { Trophy, GitBranch, Crown, Medal, CheckCircle2, RotateCcw, ShieldAlert, Swords, Shuffle, ArrowLeftRight, FileText, LayoutGrid, Eye } from 'lucide-react';
import { KnockoutBracketDiagram } from './KnockoutBracketDiagram';

interface KnockoutViewProps {
  knockouts: KnockoutMatch[];
  standingsA: Standing[];
  standingsB: Standing[];
  players: Player[];
  isAdmin: boolean;
  onUpdateKnockoutScore: (
    stage: KnockoutStage,
    score1: number,
    score2: number,
    winnerId?: string
  ) => void;
  onResetKnockoutScore: (stage: KnockoutStage) => void;
  onUpdateSemiGameScore?: (
    stage: KnockoutStage,
    gameNumber: number,
    scoreWhite: number,
    scoreBlack: number
  ) => void;
  onResetSemiGameScore?: (stage: KnockoutStage, gameNumber: number) => void;
  onResetSemiMatch?: (stage: KnockoutStage) => void;
  onSetSeriesColors?: (stage: KnockoutStage, whitePlayerId: string) => void;
  onSwapGameColors?: (stage: KnockoutStage, gameNumber: number) => void;
  onSetGameColors?: (
    stage: KnockoutStage,
    gameNumber: number,
    whitePlayerId: string,
    blackPlayerId: string
  ) => void;
  onOpenMatchNote?: (match: KnockoutMatch) => void;
}

export const KnockoutView: React.FC<KnockoutViewProps> = ({
  knockouts,
  standingsA,
  standingsB,
  players,
  isAdmin,
  onUpdateKnockoutScore,
  onResetKnockoutScore,
  onUpdateSemiGameScore,
  onResetSemiGameScore,
  onResetSemiMatch,
  onSetSeriesColors,
  onSwapGameColors,
  onSetGameColors,
  onOpenMatchNote,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'diagram' | 'cards'>('both');

  const getPlayer = (id?: string) => players.find((p) => p.id === id);

  const semi1 = knockouts.find((k) => k.stage === 'semi1');
  const semi2 = knockouts.find((k) => k.stage === 'semi2');
  const thirdPlace = knockouts.find((k) => k.stage === 'third_place');
  const finalMatch = knockouts.find((k) => k.stage === 'final');

  const handleScrollToStage = (stage: KnockoutStage) => {
    if (viewMode === 'diagram') {
      setViewMode('both');
    }
    setTimeout(() => {
      const el = document.getElementById(`stage-${stage}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Determine final podium ranks
  const getWinner = (m?: KnockoutMatch) => {
    if (!m || m.status !== 'finished') return null;
    if (m.winnerId) return getPlayer(m.winnerId);
    if (m.score1 !== undefined && m.score2 !== undefined) {
      if (m.score1 > m.score2) return getPlayer(m.player1Id);
      if (m.score2 > m.score1) return getPlayer(m.player2Id);
    }
    return null;
  };

  const getLoser = (m?: KnockoutMatch) => {
    if (!m || m.status !== 'finished') return null;
    if (m.winnerId) {
      return getPlayer(m.winnerId === m.player1Id ? m.player2Id : m.player1Id);
    }
    if (m.score1 !== undefined && m.score2 !== undefined) {
      if (m.score1 > m.score2) return getPlayer(m.player2Id);
      if (m.score2 > m.score1) return getPlayer(m.player1Id);
    }
    return null;
  };

  const champion = getWinner(finalMatch);
  const runnerUp = getLoser(finalMatch);
  const thirdPlaceWinner = getWinner(thirdPlace);
  const fourthPlace = getLoser(thirdPlace);

  // Render Knockout Match Series Card with 2 main games, Tie-Breaks, Game 7 Armageddon & Admin Color Selection
  const renderKnockoutSeriesCard = (
    match?: KnockoutMatch,
    stageTitle?: string,
    accentBorder: string = 'border-indigo-500/40',
    winnerBadgeText: string = 'Vào Chung Kết'
  ) => {
    if (!match) return null;
    const stage = match.stage;
    const p1 = getPlayer(match.player1Id);
    const p2 = getPlayer(match.player2Id);
    const isFinished = match.status === 'finished';
    const games = match.games || [];
    const winner = getPlayer(match.winnerId);

    const p1Wins = match.wins1 ?? 0;
    const p2Wins = match.wins2 ?? 0;

    return (
      <div
        id={`stage-${stage}`}
        className={`bg-slate-900/95 border rounded-2xl p-5 shadow-2xl transition-all relative ${
          isFinished ? 'border-emerald-600/50 shadow-emerald-950/20' : accentBorder
        }`}
      >
        {/* Match Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isFinished ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'}`} />
            <div>
              <h4 className="font-display text-sm font-bold text-white">
                {stageTitle || match.title}
              </h4>
              <p className="text-[11px] text-slate-400">
                Thể thức: 2 ván chính (đi & về) · Nghiêng về 1 bên (2-0, 1.5-0.5) kết thúc ngay · Hòa 1-1 đấu Tie-break đến ván 7 Armageddon
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {match.date && match.time && (() => {
              const liveStatus = getMatchLiveStatus(match.date, match.time, isFinished, match.score1, match.score2);
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${liveStatus.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.dotClass}`} />
                  <span>{liveStatus.label}</span>
                </span>
              );
            })()}



            {isAdmin && onOpenMatchNote && (
              <button
                type="button"
                onClick={() => onOpenMatchNote(match)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                title="Thêm hoặc chỉnh sửa ghi chú biên bản cho trận loại trực tiếp này"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{match.notes ? 'Sửa ghi chú' : '+ Ghi chú'}</span>
              </button>
            )}

            {isFinished ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hoàn thành ({winner ? `${winner.name} thắng` : 'Có người thắng'})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                <Swords className="w-3.5 h-3.5 text-indigo-400" />
                <span>Đang thi đấu</span>
              </span>
            )}
          </div>
        </div>

        {/* Match Notes display if available */}
        {match.notes && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2 shadow-inner">
            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-amber-300 mr-1.5">[Ghi chú BTC]:</span>
              <span className="text-amber-100/90 leading-relaxed">{match.notes}</span>
            </div>
            {isAdmin && onOpenMatchNote && (
              <button
                type="button"
                onClick={() => onOpenMatchNote(match)}
                className="text-[10px] text-amber-400 hover:text-amber-200 underline font-semibold shrink-0 cursor-pointer"
                title="Chỉnh sửa ghi chú trận đấu này"
              >
                Sửa
              </button>
            )}
          </div>
        )}

        {/* Players & Overall Series Scoreboard */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Player 1 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              winner?.id === p1?.id
                ? 'bg-emerald-950/30 border-emerald-600/60 ring-1 ring-emerald-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>{match.player1Label}</span>
              {winner?.id === p1?.id && (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                  <Crown className="w-3 h-3 text-amber-400" /> {winnerBadgeText}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-base font-extrabold truncate pr-2 ${p1 ? 'text-white' : 'text-slate-500 italic'}`}>
                {p1 ? p1.name : '(Chờ kết quả)'}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  title="Số ván thắng"
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-sm font-extrabold text-amber-400 tabular-nums"
                >
                  {p1Wins} ván
                </span>
                <span
                  title="Tổng điểm tích lũy"
                  className="text-xs text-slate-400 tabular-nums"
                >
                  ({match.score1 ?? 0}đ)
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              winner?.id === p2?.id
                ? 'bg-emerald-950/30 border-emerald-600/60 ring-1 ring-emerald-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>{match.player2Label}</span>
              {winner?.id === p2?.id && (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                  <Crown className="w-3 h-3 text-amber-400" /> {winnerBadgeText}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-base font-extrabold truncate pr-2 ${p2 ? 'text-white' : 'text-slate-500 italic'}`}>
                {p2 ? p2.name : '(Chờ kết quả)'}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  title="Số ván thắng"
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-sm font-extrabold text-amber-400 tabular-nums"
                >
                  {p2Wins} ván
                </span>
                <span
                  title="Tổng điểm tích lũy"
                  className="text-xs text-slate-400 tabular-nums"
                >
                  ({match.score2 ?? 0}đ)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ADMIN COLOR SELECTION PANEL (Ai Trắng ai Đen do Admin chọn) */}
        {p1 && p2 && (
          <div className="mb-4 p-3.5 bg-slate-950/90 border border-indigo-900/50 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Chỉ định màu quân Trắng / Đen
                </span>
              </div>

              {match.colorsChosen ? (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                  <CheckCircle2 className="w-3 h-3" />
                  Đã chỉ định bởi Admin
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                  Chờ Admin chọn màu quân (hoặc bốc thăm)
                </span>
              )}
            </div>

            {isAdmin ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-300">
                  Chọn kỳ thủ sẽ <strong>cầm Trắng (đi tiên) ở Ván 1</strong>. Các ván tiếp theo sẽ tự động luân phiên đổi màu quân (hoặc Admin có thể tùy chỉnh riêng từng ván bên dưới):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Option 1: P1 White */}
                  <button
                    type="button"
                    onClick={() => onSetSeriesColors && onSetSeriesColors(stage, p1.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block shrink-0" />
                    <span>{p1.name} (Trắng)</span>
                  </button>

                  {/* Option 2: P2 White */}
                  <button
                    type="button"
                    onClick={() => onSetSeriesColors && onSetSeriesColors(stage, p2.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block shrink-0" />
                    <span>{p2.name} (Trắng)</span>
                  </button>

                  {/* Option 3: Random Draw */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!onSetSeriesColors) return;
                      const randomWhiteId = Math.random() < 0.5 ? p1.id : p2.id;
                      onSetSeriesColors(stage, randomWhiteId);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl text-xs font-bold text-indigo-300 transition-all cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bốc thăm ngẫu nhiên</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                {match.colorsChosen ? (
                  <span>
                    Kỳ thủ cầm Trắng (Ván 1) do trọng tài / Admin chỉ định:{' '}
                    <strong className="text-white">
                      {getPlayer(games[0]?.whitePlayerId)?.name || 'Chưa xác định'}
                    </strong>
                  </span>
                ) : (
                  <span className="italic text-slate-500">
                    Trọng tài / Quản trị viên sẽ chỉ định hoặc bốc thăm chọn bên Trắng / Đen trước giờ thi đấu.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Outcome Summary Note */}
        {match.outcomeNote && (
          <div className="mb-4 px-3 py-2 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{match.outcomeNote}</span>
          </div>
        )}

        {/* List of Games in the Series */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>Chi tiết từng ván đấu ({games.length} ván)</span>
            <span>Màu quân & Kết quả</span>
          </div>

          {games.map((g) => {
            const whiteP = getPlayer(g.whitePlayerId);
            const blackP = getPlayer(g.blackPlayerId);
            const isArmageddon = g.isArmageddon || g.gameNumber === 7;
            const isGameFinished = g.status === 'finished';
            const gameWinner = getPlayer(g.winnerId);

            return (
              <div
                key={g.gameNumber}
                className={`p-3.5 rounded-xl border transition-all ${
                  isArmageddon
                    ? 'bg-gradient-to-r from-amber-950/30 via-rose-950/30 to-amber-950/30 border-amber-600/60 shadow-lg'
                    : isGameFinished
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-950/30 border-slate-800/60'
                }`}
              >
                {/* Armageddon Special Notice */}
                {isArmageddon && (
                  <div className="mb-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-[11px] text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Ván 7 Armageddon (Sinh tử):</strong> Cầm Trắng buộc phải thắng. Nếu hòa (½ - ½), kỳ thủ cầm Đen sẽ thắng chung cuộc!
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Game label and matchups */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isArmageddon
                            ? 'bg-amber-500 text-slate-950'
                            : g.gameNumber <= 3
                            ? 'bg-slate-800 text-indigo-300'
                            : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                        }`}
                      >
                        {isArmageddon ? 'Ván 7 Armageddon' : `Ván ${g.gameNumber}${g.gameNumber > 3 ? ' (Tie-break)' : ''}`}
                      </span>

                      {isGameFinished ? (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {gameWinner ? `${gameWinner.name} thắng` : 'Hòa cờ'}
                          {g.armageddonRuleApplied && (
                            <span className="text-amber-400 font-bold">(Đen thắng theo luật Armageddon)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa đấu</span>
                      )}
                    </div>

                    {/* White vs Black Pairings with visual indicators */}
                    <div className="text-xs text-slate-200 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block" />
                        <span className="text-white font-bold">{whiteP?.name || 'Trắng'}</span>
                        <span className="text-[10px] text-slate-400">(Trắng / Tiên)</span>
                      </span>

                      <span className="text-slate-500 font-bold">vs</span>

                      <span className="flex items-center gap-1.5 font-medium bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 inline-block" />
                        <span className="text-white font-bold">{blackP?.name || 'Đen'}</span>
                        <span className="text-[10px] text-slate-400">(Đen / Hậu)</span>
                      </span>

                      {/* Admin Swap Colors button for this specific game */}
                      {isAdmin && !isGameFinished && onSwapGameColors && (
                        <button
                          type="button"
                          onClick={() => onSwapGameColors(stage, g.gameNumber)}
                          title="Hoán đổi Trắng ⇄ Đen cho ván này"
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-800/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer ml-1"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Đổi bên Trắng ⇄ Đen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Result display */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isGameFinished ? (
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-sm font-bold text-white tabular-nums">
                          {formatChessScore(g.scoreWhite, g.scoreBlack)}
                        </div>
                        {isAdmin && onResetSemiGameScore && (
                          <button
                            type="button"
                            onClick={() => onResetSemiGameScore(stage, g.gameNumber)}
                            title="Hủy kết quả ván này"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Ván 7 Armageddon Color Choice Specific Panel */}
                {isArmageddon && isAdmin && !isGameFinished && p1 && p2 && onSetGameColors && (
                  <div className="mt-2.5 pt-2 border-t border-amber-800/50 space-y-1.5">
                    <span className="text-[11px] text-amber-300 font-bold block">
                      Admin chỉ định kỳ thủ ván 7 Armageddon:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSetGameColors(stage, 7, p1.id, p2.id)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border text-left transition-all cursor-pointer ${
                          g.whitePlayerId === p1.id
                            ? 'bg-amber-600 text-white border-amber-400 ring-1 ring-amber-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        ⚪ {p1.name} (Trắng: buộc thắng) vs ⚫ {p2.name} (Đen: hòa thắng)
                      </button>

                      <button
                        type="button"
                        onClick={() => onSetGameColors(stage, 7, p2.id, p1.id)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border text-left transition-all cursor-pointer ${
                          g.whitePlayerId === p2.id
                            ? 'bg-amber-600 text-white border-amber-400 ring-1 ring-amber-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        ⚪ {p2.name} (Trắng: buộc thắng) vs ⚫ {p1.name} (Đen: hòa thắng)
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin controls to input score for this specific game */}
                {isAdmin && p1 && p2 && onUpdateSemiGameScore && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Nhập kết quả Ván {g.gameNumber}:</span>
                    {/* White win */}
                    <button
                      type="button"
                      onClick={() => onUpdateSemiGameScore(stage, g.gameNumber, 1, 0)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        g.scoreWhite === 1 && g.scoreBlack === 0
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-700'
                      }`}
                    >
                      1 - 0 ({whiteP?.name || 'Trắng'})
                    </button>

                    {/* Draw */}
                    <button
                      type="button"
                      onClick={() => onUpdateSemiGameScore(stage, g.gameNumber, 0.5, 0.5)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        g.scoreWhite === 0.5 && g.scoreBlack === 0.5
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700'
                      }`}
                    >
                      {isArmageddon ? '½ - ½ (Hòa: Đen thắng cuộc)' : '½ - ½ (Hòa)'}
                    </button>

                    {/* Black win */}
                    <button
                      type="button"
                      onClick={() => onUpdateSemiGameScore(stage, g.gameNumber, 0, 1)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        g.scoreWhite === 0 && g.scoreBlack === 1
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-700'
                      }`}
                    >
                      0 - 1 ({blackP?.name || 'Đen'})
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset entire series button */}
        {isAdmin && p1 && p2 && onResetSemiMatch && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onResetSemiMatch(stage)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại loạt trận {match.title}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Standard match card for 3rd Place & Grand Final
  const renderStandardMatchCard = (
    match?: KnockoutMatch,
    stageTitle?: string,
    badgeColor: string = 'bg-indigo-600'
  ) => {
    if (!match) return null;

    const p1 = getPlayer(match.player1Id);
    const p2 = getPlayer(match.player2Id);
    const isFinished = match.status === 'finished';

    return (
      <div
        className={`bg-slate-900/95 border rounded-2xl p-5 shadow-xl transition-all relative ${
          isFinished ? 'border-amber-600/50 shadow-amber-950/20' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
            <h4 className="font-display text-sm font-bold text-white">
              {stageTitle || match.title}
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {isFinished ? 'Đã hoàn thành' : 'Đang chờ thi đấu'}
          </span>
        </div>

        {/* Players */}
        <div className="space-y-3 py-1">
          {/* Player 1 */}
          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400 font-medium mb-0.5">
                {match.player1Label}
              </div>
              <div
                className={`text-sm font-bold ${
                  p1 ? 'text-white' : 'text-slate-500 italic'
                }`}
              >
                {p1 ? p1.name : '(Chờ kết quả Bán kết)'}
              </div>
            </div>
            {isFinished && (
              <div className="px-3 py-1 bg-slate-900 rounded-lg text-sm font-bold text-white border border-slate-800 tabular-nums">
                {match.score1 === 0.5 ? '½' : match.score1 ?? '-'}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {isFinished ? 'Tỉ số trận đấu' : 'Đối đầu'}
          </div>

          {/* Player 2 */}
          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400 font-medium mb-0.5">
                {match.player2Label}
              </div>
              <div
                className={`text-sm font-bold ${
                  p2 ? 'text-white' : 'text-slate-500 italic'
                }`}
              >
                {p2 ? p2.name : '(Chờ kết quả Bán kết)'}
              </div>
            </div>
            {isFinished && (
              <div className="px-3 py-1 bg-slate-900 rounded-lg text-sm font-bold text-white border border-slate-800 tabular-nums">
                {match.score2 === 0.5 ? '½' : match.score2 ?? '-'}
              </div>
            )}
          </div>
        </div>

        {/* Admin Result Controls */}
        {isAdmin && p1 && p2 && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 mb-2 font-medium">
              Nhập kết quả {match.title}:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateKnockoutScore(match.stage, 1, 0, p1.id)}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  match.score1 === 1 && match.score2 === 0
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-800'
                }`}
              >
                1 - 0 ({p1.name})
              </button>

              <button
                type="button"
                onClick={() => onUpdateKnockoutScore(match.stage, 0.5, 0.5, p1.id)}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  match.score1 === 0.5 && match.score2 === 0.5
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 text-amber-400 border-slate-800'
                }`}
              >
                ½ - ½ (Hòa)
              </button>

              <button
                type="button"
                onClick={() => onUpdateKnockoutScore(match.stage, 0, 1, p2.id)}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  match.score1 === 0 && match.score2 === 1
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-800'
                }`}
              >
                0 - 1 ({p2.name})
              </button>
            </div>

            {isFinished && (
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => onResetKnockoutScore(match.stage)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hủy kết quả về chờ đấu</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header & Rules Explanation Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            Vòng Bán Kết, Tranh Hạng Ba & Chung Kết
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân nhánh tự động: Top 2 Bảng A và Top 2 Bảng B đối đầu chéo tranh cúp vô địch · Admin toàn quyền chỉ định màu quân Trắng/Đen
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Vòng loại trực tiếp</span>
        </div>
      </div>

      {/* Rules Notice Box */}
      <div className="bg-slate-900/50 border border-indigo-900/40 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
        <div className="font-bold text-indigo-300 flex items-center gap-2">
          <Swords className="w-4 h-4 text-indigo-400" />
          <span>Thể thức thi đấu Bán kết, Tranh hạng ba & Chung kết (Áp dụng đồng nhất):</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[12px] pl-1">
          <li><strong>Chỉ định màu quân Trắng / Đen:</strong> Admin là người trực tiếp chỉ định hoặc bốc thăm chọn kỳ thủ cầm Trắng/Đen cho loạt trận hoặc từng ván riêng biệt, không để hệ thống auto gán.</li>
          <li><strong>2 ván chính thức (Lượt đi & về):</strong> Mỗi trận gồm 2 ván chính. Nếu tỉ số nghiêng về 1 bên (<strong>2 - 0</strong> hoặc <strong>1.5 - 0.5</strong>), loạt trận <strong>kết thúc ngay lập tức</strong>.</li>
          <li><strong>Hòa 1 - 1:</strong> Nếu sau 2 ván chính tỉ số hòa 1 - 1 (mỗi bên thắng 1 ván hoặc 2 ván đều hòa ½ - ½), hai kỳ thủ <strong>mới đấu tiếp từng ván phụ Tie-break</strong> (Ván 3, 4, 5, 6) đến khi có người thắng.</li>
          <li><strong>Ván thứ 7 Armageddon (Sinh tử):</strong> Nếu vẫn hòa sau 6 ván, ván thứ 7 phân định thắng thua: ai <strong>cầm Trắng mà hòa thì THUA</strong>, ai <strong>cầm Đen mà hòa sẽ THẮNG!</strong></li>
        </ul>
      </div>

      {/* View Mode Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span>Chế độ hiển thị Vòng loại trực tiếp:</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === 'both'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Lược đồ D3 & Loạt trận</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('diagram')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === 'diagram'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Chỉ Lược đồ D3</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Chỉ Loạt trận chi tiết</span>
          </button>
        </div>
      </div>

      {/* D3.js Interactive Bracket Diagram */}
      {(viewMode === 'both' || viewMode === 'diagram') && (
        <KnockoutBracketDiagram
          semi1={semi1}
          semi2={semi2}
          finalMatch={finalMatch}
          thirdPlace={thirdPlace}
          players={players}
          onSelectMatch={handleScrollToStage}
        />
      )}

      {/* Detailed Match Series Cards */}
      {(viewMode === 'both' || viewMode === 'cards') && (
        <>
          {/* Semi-Finals Section */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Vòng Bán Kết (2 ván chính thức · Tie-break nếu hòa 1 - 1)</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Semi Final 1 */}
              <div>
                {renderKnockoutSeriesCard(semi1, 'Bán Kết 1: Nhất Bảng A vs Nhì Bảng B', 'border-indigo-500/50', 'Vào Chung Kết')}
              </div>

              {/* Semi Final 2 */}
              <div>
                {renderKnockoutSeriesCard(semi2, 'Bán Kết 2: Nhất Bảng B vs Nhì Bảng A', 'border-indigo-500/50', 'Vào Chung Kết')}
              </div>
            </div>
          </div>

          {/* Final & 3rd Place Row */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Trận Tranh Hạng Ba & Trận Chung Kết (Thể thức 2 ván chính · Tie-break đến Ván 7 Armageddon)</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Third Place Match */}
              <div>
                {renderKnockoutSeriesCard(thirdPlace, 'Trận Tranh Hạng Ba (Thua BK1 vs Thua BK2)', 'border-amber-700/60 shadow-amber-950/20', 'Đoạt Huy Chương Đồng')}
              </div>

              {/* Grand Final */}
              <div>
                {renderKnockoutSeriesCard(finalMatch, 'Trận Chung Kết Tranh Ngôi Vô Địch Toàn Giải', 'border-amber-500/70 shadow-amber-950/40 ring-1 ring-amber-500/40', 'Đoạt Cúp Vô Địch 🏆')}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Final Standings / Podium Award System */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Bảng Xếp Hạng Chung Cuộc Toàn Giải
            </h3>
            <p className="text-xs text-slate-400">
              Vinh danh các kỳ thủ đạt thứ hạng cao nhất sau vòng bảng và vòng loại trực tiếp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vô địch */}
          <div className="bg-amber-950/20 border border-amber-600/40 rounded-2xl p-4 text-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold mx-auto mb-2 shadow-lg shadow-amber-500/20">
              1
            </div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              Quán Quân (Vô Địch)
            </div>
            <div className="text-base font-extrabold text-white truncate px-2">
              {champion ? champion.name : 'Chưa xác định'}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">Cúp Vàng Vô Địch</div>
          </div>

          {/* Á quân */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-bold mx-auto mb-2">
              2
            </div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Á Quân (Hạng Nhì)
            </div>
            <div className="text-base font-extrabold text-white truncate px-2">
              {runnerUp ? runnerUp.name : 'Chưa xác định'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cúp Bạc Á Quân</div>
          </div>

          {/* Hạng ba */}
          <div className="bg-amber-950/10 border border-amber-800/30 rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold mx-auto mb-2">
              3
            </div>
            <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
              Hạng Ba (Quý Quân)
            </div>
            <div className="text-base font-extrabold text-white truncate px-2">
              {thirdPlaceWinner ? thirdPlaceWinner.name : 'Chưa xác định'}
            </div>
            <div className="text-[11px] text-amber-400/70 mt-1">Huy Chương Đồng</div>
          </div>

          {/* Hạng tư */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold mx-auto mb-2">
              4
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hạng Tư
            </div>
            <div className="text-base font-extrabold text-white truncate px-2">
              {fourthPlace ? fourthPlace.name : 'Chưa xác định'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Vào Bán Kết</div>
          </div>
        </div>
      </div>
    </div>
  );
};
