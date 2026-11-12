import React, { useState } from 'react';
import { Match, Player, Standing } from '../types/tournament';
import { formatScoreBadge } from '../utils/tournamentEngine';
import { Trophy, Award, CheckCircle2, HelpCircle, FileText } from 'lucide-react';

interface StandingsViewProps {
  standingsA: Standing[];
  standingsB: Standing[];
  players: Player[];
  matches: Match[];
  onOpenExportPdf?: () => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  standingsA,
  standingsB,
  players,
  matches,
  onOpenExportPdf,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<'both' | 'A' | 'B'>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCrossTable, setShowCrossTable] = useState(true);

  // Filter standings based on search query
  const filteredStandingsA = standingsA.filter((s) =>
    s.playerName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );
  const filteredStandingsB = standingsB.filter((s) =>
    s.playerName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Thống kê nhanh cho từng bảng
  const leaderA = standingsA[0];
  const leaderB = standingsB[0];
  const matchesA = matches.filter((m) => m.group === 'A');
  const finishedA = matchesA.filter((m) => m.status === 'finished').length;
  const matchesB = matches.filter((m) => m.group === 'B');
  const finishedB = matchesB.filter((m) => m.status === 'finished').length;

  // Render cross table for a group
  const renderCrossTable = (group: 'A' | 'B', groupStandings: Standing[]) => {
    const groupPlayers = groupStandings.map((s) => ({
      id: s.playerId,
      name: s.playerName,
    }));

    return (
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            Bảng đối đầu chéo Bảng {group}
          </span>
          <span className="text-[11px] text-slate-500">
            Kết quả từng ván (Lượt đi / về)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400">
                <th className="py-2 px-3 text-left font-medium border border-slate-800">
                  Kỳ thủ
                </th>
                {groupPlayers.map((p, idx) => (
                  <th
                    key={p.id}
                    className="py-2 px-2.5 font-medium border border-slate-800 w-12 text-slate-300"
                    title={p.name}
                  >
                    {idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupPlayers.map((pRow, rIdx) => (
                <tr key={pRow.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-left font-medium text-slate-200 border border-slate-800 whitespace-nowrap">
                    <span className="text-slate-500 mr-2 tabular-nums">{rIdx + 1}.</span>
                    {pRow.name}
                  </td>
                  {groupPlayers.map((pCol, cIdx) => {
                    if (pRow.id === pCol.id) {
                      return (
                        <td
                          key={pCol.id}
                          className="py-2 px-2 bg-slate-950 text-slate-700 border border-slate-800 font-mono"
                        >
                          ✕
                        </td>
                      );
                    }

                    // Find matches between pRow and pCol
                    const vsMatches = matches.filter(
                      (m) =>
                        m.group === group &&
                        m.status === 'finished' &&
                        ((m.player1Id === pRow.id && m.player2Id === pCol.id) ||
                          (m.player1Id === pCol.id && m.player2Id === pRow.id))
                    );

                    if (vsMatches.length === 0) {
                      return (
                        <td
                          key={pCol.id}
                          className="py-2 px-2 text-slate-600 border border-slate-800"
                        >
                          -
                        </td>
                      );
                    }

                    const scoresStr = vsMatches
                      .map((m) => {
                        const score = m.player1Id === pRow.id ? m.score1 : m.score2;
                        return formatScoreBadge(score);
                      })
                      .join(', ');

                    return (
                      <td
                        key={pCol.id}
                        className="py-2 px-2 text-slate-200 border border-slate-800 font-semibold tabular-nums"
                      >
                        {scoresStr}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTable = (groupName: 'A' | 'B', standings: Standing[], colorClass: string) => {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
            <h3 className="font-display text-lg font-bold text-white">
              Bảng {groupName}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Top 2 vào Bán kết
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="py-3 px-3 w-12 text-center">Hạng</th>
                <th className="py-3 px-4">Kỳ thủ</th>
                <th className="py-3 px-2 text-center" title="Số trận đã đấu">St</th>
                <th className="py-3 px-2 text-center text-emerald-400" title="Thắng (+1 điểm)">T</th>
                <th className="py-3 px-2 text-center text-amber-400" title="Hòa (+0.5 điểm)">H</th>
                <th className="py-3 px-2 text-center text-rose-400" title="Thua (0 điểm)">B</th>
                <th className="py-3 px-3 text-center text-indigo-400 font-bold text-sm" title="Tổng điểm">
                  Điểm
                </th>
                <th className="py-3 px-3 text-center" title="Hệ số Sonneborn-Berger">
                  HS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {standings.map((s, idx) => {
                const isTop2 = s.rank <= 2;
                return (
                  <tr
                    key={s.playerId}
                    className={`transition-colors ${
                      isTop2 ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center">
                        {s.rank === 1 ? (
                          <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                            1
                          </div>
                        ) : s.rank === 2 ? (
                          <div className="w-6 h-6 rounded-md bg-slate-300/20 text-slate-300 border border-slate-300/30 flex items-center justify-center font-bold">
                            2
                          </div>
                        ) : (
                          <span className="text-slate-500 tabular-nums">{s.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isTop2 ? 'text-white' : 'text-slate-300'}`}>
                          {s.playerName}
                        </span>
                        {isTop2 && (
                          <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40 whitespace-nowrap">
                            Vé Bán kết
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center tabular-nums text-slate-300">{s.played}</td>
                    <td className="py-3 px-2 text-center tabular-nums text-emerald-400 font-semibold">{s.won}</td>
                    <td className="py-3 px-2 text-center tabular-nums text-amber-400 font-semibold">{s.drawn}</td>
                    <td className="py-3 px-2 text-center tabular-nums text-rose-400">{s.lost}</td>
                    <td className="py-3 px-3 text-center tabular-nums text-indigo-300 font-bold text-sm bg-indigo-950/40">
                      {s.points % 1 === 0 ? s.points : `${Math.floor(s.points)}½`}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-slate-400">
                      {s.sonnebornBerger.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showCrossTable && renderCrossTable(groupName, standings)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Bảng Xếp Hạng Vòng Bảng
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lọc bảng xếp hạng theo nhóm bảng để dễ dàng theo dõi chi tiết (Chuẩn tính điểm FIDE 1 - ½ - 0)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc chọn Nhóm Bảng */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setSelectedGroup('both')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedGroup === 'both'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả (Bảng A & B)
            </button>
            <button
              onClick={() => setSelectedGroup('A')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedGroup === 'A'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Chỉ Bảng A</span>
            </button>
            <button
              onClick={() => setSelectedGroup('B')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedGroup === 'B'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Chỉ Bảng B</span>
            </button>
          </div>

          {/* Ô tìm kiếm kỳ thủ nhanh */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên kỳ thủ..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 w-36 sm:w-44 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bật / Tắt Bảng đối đầu chéo */}
          <button
            type="button"
            onClick={() => setShowCrossTable(!showCrossTable)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              showCrossTable
                ? 'bg-slate-900 border-indigo-700/60 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showCrossTable ? '✓ Bảng đối đầu' : '+ Bảng đối đầu'}
          </button>

          {/* Nút Xuất PDF Bảng Xếp Hạng */}
          {onOpenExportPdf && (
            <button
              type="button"
              onClick={onOpenExportPdf}
              title="Xuất bảng xếp hạng & kết quả ra file PDF để in hoặc chia sẻ ngoại tuyến"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-950 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xuất PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Focused Banner when single group is selected */}
      {selectedGroup === 'A' && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300 text-sm">Chế độ xem tập trung: BẢNG A</span>
            <span className="text-amber-500" aria-hidden="true">·</span>
            <span>4 kỳ thủ</span>
            <span className="text-amber-500" aria-hidden="true">·</span>
            <span>Đã hoàn thành {finishedA}/{matchesA.length || 12} ván</span>
          </div>

          {leaderA && (
            <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-700/60 px-3 py-1 rounded-xl">
              <span>👑 Đang dẫn đầu:</span>
              <strong className="text-amber-300">{leaderA.playerName}</strong>
              <span className="text-amber-400">({leaderA.points} điểm)</span>
            </div>
          )}
        </div>
      )}

      {selectedGroup === 'B' && (
        <div className="bg-sky-950/30 border border-sky-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-bold text-sky-300 text-sm">Chế độ xem tập trung: BẢNG B</span>
            <span className="text-sky-500" aria-hidden="true">·</span>
            <span>4 kỳ thủ</span>
            <span className="text-sky-500" aria-hidden="true">·</span>
            <span>Đã hoàn thành {finishedB}/{matchesB.length || 12} ván</span>
          </div>

          {leaderB && (
            <div className="flex items-center gap-1.5 bg-sky-950/70 border border-sky-700/60 px-3 py-1 rounded-xl">
              <span>👑 Đang dẫn đầu:</span>
              <strong className="text-sky-300">{leaderB.playerName}</strong>
              <span className="text-sky-400">({leaderB.points} điểm)</span>
            </div>
          )}
        </div>
      )}

      {/* Standings Grid / Full-width Layout */}
      <div
        className={
          selectedGroup === 'both'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
            : 'w-full max-w-5xl mx-auto space-y-6'
        }
      >
        {(selectedGroup === 'both' || selectedGroup === 'A') &&
          renderTable('A', filteredStandingsA, 'bg-amber-500')}
        {(selectedGroup === 'both' || selectedGroup === 'B') &&
          renderTable('B', filteredStandingsB, 'bg-sky-500')}
      </div>

      {/* Rules & Notes card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Quy định xếp hạng & Nhánh đấu:</span>
          <span className="ml-1">
            Mỗi ván thắng được tính 1 điểm, hòa được 0.5 (½) điểm, thua 0 điểm. Khi bằng điểm, thứ hạng lần lượt xét:
            Đối đầu trực tiếp $\rightarrow$ Số ván thắng $\rightarrow$ Hệ số phụ Sonneborn-Berger.
            Sau 6 lượt đấu vòng tròn (đi & về), 2 kỳ thủ đứng đầu mỗi bảng sẽ giành quyền vào vòng Bán kết:
            Bán kết 1 (Nhất A vs Nhì B) và Bán kết 2 (Nhất B vs Nhì A).
          </span>
        </div>
      </div>
    </div>
  );
};
