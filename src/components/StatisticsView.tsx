import React, { useState, useMemo } from 'react';
import { Match, KnockoutMatch, Player, GroupId } from '../types/tournament';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Trophy,
  Swords,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Filter,
  CheckCircle2,
  MinusCircle,
  XCircle,
  Sparkles,
  Shield,
  Target,
  Zap,
  Flame,
  Crown,
  Medal,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StatisticsViewProps {
  players: Player[];
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
}

export interface PlayerStats {
  id: string;
  name: string;
  group: GroupId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  winRate: number; // Tỉ lệ thắng %
  pointEfficiency: number; // Hiệu suất điểm (điểm / số trận * 100)%
  whitePlayed: number;
  whiteWon: number;
  whiteDrawn: number;
  whiteLost: number;
  blackPlayed: number;
  blackWon: number;
  blackDrawn: number;
  blackLost: number;
}

export interface MvpPlayer {
  id: string;
  name: string;
  group: GroupId;
  totalWins: number;
  groupWins: number;
  knockoutClassicalWins: number;
  knockoutBlitzWins: number;
  knockoutArmageddonWins: number;
  totalKnockoutWins: number;
  clutchWins: number;
  totalPlayed: number;
  totalPoints: number;
  winRate: number;
  mvpScore: number;
  rank: number;
  titleBadge: string;
}

const COLORS = {
  win: '#10b981', // emerald-500
  draw: '#f59e0b', // amber-500
  loss: '#f43f5e', // rose-500
  whitePiece: '#e2e8f0', // slate-200
  blackPiece: '#64748b', // slate-500
  accent: '#6366f1', // indigo-500
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  players,
  matches,
  knockoutMatches,
}) => {
  const [filterGroup, setFilterGroup] = useState<'all' | GroupId>('all');
  const [includeKnockout, setIncludeKnockout] = useState<boolean>(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [chartView, setChartView] = useState<'counts' | 'percentages'>('counts');
  const [showMvpFormula, setShowMvpFormula] = useState<boolean>(false);

  // Compute comprehensive stats for each player
  const playerStatsList = useMemo(() => {
    const map = new Map<string, PlayerStats>();

    // Initialize map
    for (const p of players) {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        group: p.group,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        points: 0,
        winRate: 0,
        pointEfficiency: 0,
        whitePlayed: 0,
        whiteWon: 0,
        whiteDrawn: 0,
        whiteLost: 0,
        blackPlayed: 0,
        blackWon: 0,
        blackDrawn: 0,
        blackLost: 0,
      });
    }

    // 1. Process group stage finished matches
    const finishedGroup = matches.filter(
      (m) =>
        m.status === 'finished' &&
        m.score1 !== undefined &&
        m.score2 !== undefined
    );

    for (const m of finishedGroup) {
      const s1 = map.get(m.player1Id); // Player 1 cầm Trắng
      const s2 = map.get(m.player2Id); // Player 2 cầm Đen
      const score1 = m.score1 ?? 0;
      const score2 = m.score2 ?? 0;

      if (s1 && s2) {
        // Player 1 (Trắng)
        s1.played += 1;
        s1.whitePlayed += 1;
        s1.points += score1;

        // Player 2 (Đen)
        s2.played += 1;
        s2.blackPlayed += 1;
        s2.points += score2;

        if (score1 === 1) {
          s1.won += 1;
          s1.whiteWon += 1;
          s2.lost += 1;
          s2.blackLost += 1;
        } else if (score1 === 0.5 && score2 === 0.5) {
          s1.drawn += 1;
          s1.whiteDrawn += 1;
          s2.drawn += 1;
          s2.blackDrawn += 1;
        } else if (score2 === 1) {
          s2.won += 1;
          s2.blackWon += 1;
          s1.lost += 1;
          s1.whiteLost += 1;
        }
      }
    }

    // 2. Process knockout matches if enabled
    if (includeKnockout) {
      for (const ko of knockoutMatches) {
        if (ko.games && ko.games.length > 0) {
          // Process individual games in series
          for (const g of ko.games) {
            if (
              g.status === 'finished' &&
              g.scoreWhite !== undefined &&
              g.scoreBlack !== undefined
            ) {
              const sWhite = map.get(g.whitePlayerId);
              const sBlack = map.get(g.blackPlayerId);
              const scW = g.scoreWhite;
              const scB = g.scoreBlack;

              if (sWhite) {
                sWhite.played += 1;
                sWhite.whitePlayed += 1;
                sWhite.points += scW;
                if (scW > scB) {
                  sWhite.won += 1;
                  sWhite.whiteWon += 1;
                } else if (scW === scB) {
                  sWhite.drawn += 1;
                  sWhite.whiteDrawn += 1;
                } else {
                  sWhite.lost += 1;
                  sWhite.whiteLost += 1;
                }
              }

              if (sBlack) {
                sBlack.played += 1;
                sBlack.blackPlayed += 1;
                sBlack.points += scB;
                if (scB > scW) {
                  sBlack.won += 1;
                  sBlack.blackWon += 1;
                } else if (scB === scW) {
                  sBlack.drawn += 1;
                  sBlack.blackDrawn += 1;
                } else {
                  sBlack.lost += 1;
                  sBlack.blackLost += 1;
                }
              }
            }
          }
        }
      }
    }

    // Compute derived rates
    const list = Array.from(map.values()).map((s) => {
      const winRate = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
      const pointEfficiency =
        s.played > 0 ? Math.round((s.points / s.played) * 100) : 0;
      return {
        ...s,
        winRate,
        pointEfficiency,
      };
    });

    // Sort by points descending, then winRate descending
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.winRate - a.winRate;
    });

    return list;
  }, [players, matches, knockoutMatches, includeKnockout]);

  // Filtered stats for display
  const filteredStats = useMemo(() => {
    return playerStatsList.filter((s) => {
      if (filterGroup !== 'all' && s.group !== filterGroup) return false;
      if (selectedPlayerId !== 'all' && s.id !== selectedPlayerId) return false;
      return true;
    });
  }, [playerStatsList, filterGroup, selectedPlayerId]);

  // Tính toán bảng xếp hạng MVP dựa trên tổng số trận thắng & ván cờ chớp/knockout
  const mvpList = useMemo<MvpPlayer[]>(() => {
    const map = new Map<string, {
      groupWins: number;
      groupDraws: number;
      groupPlayed: number;
      groupPoints: number;
      knockoutClassicalWins: number;
      knockoutBlitzWins: number;
      knockoutArmageddonWins: number;
      knockoutPlayed: number;
      knockoutPoints: number;
    }>();

    for (const p of players) {
      map.set(p.id, {
        groupWins: 0,
        groupDraws: 0,
        groupPlayed: 0,
        groupPoints: 0,
        knockoutClassicalWins: 0,
        knockoutBlitzWins: 0,
        knockoutArmageddonWins: 0,
        knockoutPlayed: 0,
        knockoutPoints: 0,
      });
    }

    // 1. Duyệt ván đấu vòng bảng đã kết thúc
    for (const m of matches) {
      if (m.status === 'finished' && m.score1 !== undefined && m.score2 !== undefined) {
        const s1 = map.get(m.player1Id);
        const s2 = map.get(m.player2Id);
        if (s1 && s2) {
          s1.groupPlayed += 1;
          s1.groupPoints += m.score1;
          s2.groupPlayed += 1;
          s2.groupPoints += m.score2;

          if (m.score1 === 1) {
            s1.groupWins += 1;
          } else if (m.score1 === 0.5) {
            s1.groupDraws += 1;
            s2.groupDraws += 1;
          } else if (m.score2 === 1) {
            s2.groupWins += 1;
          }
        }
      }
    }

    // 2. Duyệt ván đấu Knockout (Bán kết, Tranh hạng 3, Chung kết)
    for (const ko of knockoutMatches) {
      if (ko.games && ko.games.length > 0) {
        for (const g of ko.games) {
          if (g.status === 'finished' && g.scoreWhite !== undefined && g.scoreBlack !== undefined) {
            const sW = map.get(g.whitePlayerId);
            const sB = map.get(g.blackPlayerId);
            if (sW && sB) {
              sW.knockoutPlayed += 1;
              sW.knockoutPoints += g.scoreWhite;
              sB.knockoutPlayed += 1;
              sB.knockoutPoints += g.scoreBlack;

              const isArmageddon = g.gameNumber === 7 || g.isArmageddon;
              const isTieBreak = g.gameNumber >= 3 && !isArmageddon;

              let winnerId = g.winnerId;
              if (!winnerId) {
                if (g.scoreWhite > g.scoreBlack) winnerId = g.whitePlayerId;
                else if (g.scoreBlack > g.scoreWhite) winnerId = g.blackPlayerId;
                else if (g.armageddonRuleApplied) winnerId = g.blackPlayerId;
              }

              if (winnerId === g.whitePlayerId) {
                if (isArmageddon) sW.knockoutArmageddonWins += 1;
                else if (isTieBreak) sW.knockoutBlitzWins += 1;
                else sW.knockoutClassicalWins += 1;
              } else if (winnerId === g.blackPlayerId) {
                if (isArmageddon) sB.knockoutArmageddonWins += 1;
                else if (isTieBreak) sB.knockoutBlitzWins += 1;
                else sB.knockoutClassicalWins += 1;
              }
            }
          }
        }
      } else if (ko.status === 'finished' && ko.score1 !== undefined && ko.score2 !== undefined) {
        const s1 = ko.player1Id ? map.get(ko.player1Id) : null;
        const s2 = ko.player2Id ? map.get(ko.player2Id) : null;
        if (s1 && s2) {
          s1.knockoutPlayed += 1;
          s1.knockoutPoints += ko.score1;
          s2.knockoutPlayed += 1;
          s2.knockoutPoints += ko.score2;

          let winId = ko.winnerId;
          if (!winId) {
            if (ko.score1 > ko.score2) winId = ko.player1Id;
            else if (ko.score2 > ko.score1) winId = ko.player2Id;
          }

          if (winId === ko.player1Id) {
            s1.knockoutClassicalWins += 1;
          } else if (winId === ko.player2Id) {
            s2.knockoutClassicalWins += 1;
          }
        }
      }
    }

    // 3. Tính điểm MVP và xếp hạng
    const unsorted: MvpPlayer[] = players.map((p) => {
      const data = map.get(p.id) || {
        groupWins: 0,
        groupDraws: 0,
        groupPlayed: 0,
        groupPoints: 0,
        knockoutClassicalWins: 0,
        knockoutBlitzWins: 0,
        knockoutArmageddonWins: 0,
        knockoutPlayed: 0,
        knockoutPoints: 0,
      };

      const totalKnockoutWins =
        data.knockoutClassicalWins +
        data.knockoutBlitzWins +
        data.knockoutArmageddonWins;
      const clutchWins = data.knockoutBlitzWins + data.knockoutArmageddonWins;
      const totalWins = data.groupWins + totalKnockoutWins;
      const totalPlayed = data.groupPlayed + data.knockoutPlayed;
      const totalPoints = data.groupPoints + data.knockoutPoints;
      const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

      // Công thức tính điểm MVP:
      // Ván thắng Vòng bảng: 10đ
      // Ván hòa: 5đ
      // Ván thắng Knockout chính: 15đ
      // Ván thắng Tie-break cờ chớp: 20đ
      // Ván thắng Armageddon sinh tử: 30đ
      // Tỉ lệ thắng % bonus: winRate * 0.1
      const mvpScore =
        data.groupWins * 10 +
        data.groupDraws * 5 +
        data.knockoutClassicalWins * 15 +
        data.knockoutBlitzWins * 20 +
        data.knockoutArmageddonWins * 30 +
        Math.round(winRate * 0.1);

      return {
        id: p.id,
        name: p.name,
        group: p.group,
        totalWins,
        groupWins: data.groupWins,
        knockoutClassicalWins: data.knockoutClassicalWins,
        knockoutBlitzWins: data.knockoutBlitzWins,
        knockoutArmageddonWins: data.knockoutArmageddonWins,
        totalKnockoutWins,
        clutchWins,
        totalPlayed,
        totalPoints,
        winRate,
        mvpScore,
        rank: 0,
        titleBadge: '',
      };
    });

    // Sắp xếp: mvpScore giảm dần -> totalWins giảm dần -> clutchWins giảm dần -> totalPoints giảm dần -> winRate giảm dần
    unsorted.sort((a, b) => {
      if (b.mvpScore !== a.mvpScore) return b.mvpScore - a.mvpScore;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      if (b.clutchWins !== a.clutchWins) return b.clutchWins - a.clutchWins;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.winRate - a.winRate;
    });

    // Gán thứ hạng và danh hiệu vinh danh
    return unsorted.map((p, idx) => {
      let titleBadge = '🎖️ Kỳ Thủ Xuất Sắc';
      if (idx === 0 && p.totalWins > 0) {
        titleBadge = '👑 MVP Toàn Giải';
      } else if (p.clutchWins >= 1) {
        titleBadge = '⚡ Vua Cờ Chớp & Knockout';
      } else if (p.winRate >= 60 && p.totalWins >= 2) {
        titleBadge = '🎯 Bách Chiến Bách Thắng';
      } else if (p.groupWins >= 2) {
        titleBadge = '⭐ Chiến Binh Vòng Bảng';
      } else if (p.totalWins >= 1) {
        titleBadge = '🔥 Đấu Sĩ Quyết Thắng';
      }

      return {
        ...p,
        rank: idx + 1,
        titleBadge,
      };
    });
  }, [players, matches, knockoutMatches]);

  // Danh sách MVP theo bộ lọc bảng hiện tại
  const filteredMvpList = useMemo(() => {
    if (filterGroup === 'all') return mvpList;
    return mvpList.filter((p) => p.group === filterGroup);
  }, [mvpList, filterGroup]);

  // Data formatted for Recharts Bar Chart
  const barChartData = useMemo(() => {
    return filteredStats.map((s) => {
      if (chartView === 'percentages') {
        const total = s.played || 1;
        return {
          name: s.name,
          fullName: s.name,
          group: `Bảng ${s.group}`,
          played: s.played,
          won: Math.round((s.won / total) * 100),
          drawn: Math.round((s.drawn / total) * 100),
          lost: Math.round((s.lost / total) * 100),
          rawWon: s.won,
          rawDrawn: s.drawn,
          rawLost: s.lost,
          points: s.points,
        };
      }
      return {
        name: s.name,
        fullName: s.name,
        group: `Bảng ${s.group}`,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        points: s.points,
        winRate: s.winRate,
      };
    });
  }, [filteredStats, chartView]);

  // Overall Tournament Summary Stats
  const tournamentSummary = useMemo(() => {
    let totalGames = 0;
    let totalWhiteWins = 0;
    let totalBlackWins = 0;
    let totalDraws = 0;

    for (const s of playerStatsList) {
      totalWhiteWins += s.whiteWon;
      totalBlackWins += s.blackWon;
      totalDraws += s.whiteDrawn; // Each draw is counted once for White and once for Black
    }
    // Each game has 2 players, so sum of won is total decisive games
    const decisive = totalWhiteWins + totalBlackWins;
    totalGames = decisive + totalDraws;

    const topPlayer = playerStatsList[0] || null;
    const highestWinRatePlayer = [...playerStatsList]
      .filter((p) => p.played >= 2)
      .sort((a, b) => b.winRate - a.winRate)[0] || null;

    return {
      totalGames,
      totalWhiteWins,
      totalBlackWins,
      totalDraws,
      topPlayer,
      highestWinRatePlayer,
    };
  }, [playerStatsList]);

  // Donut Chart Data: Tỉ lệ kết quả toàn giải (Trắng thắng, Đen thắng, Hòa)
  const outcomesPieData = useMemo(() => {
    const { totalWhiteWins, totalBlackWins, totalDraws } = tournamentSummary;
    const total = totalWhiteWins + totalBlackWins + totalDraws;
    if (total === 0) {
      return [
        { name: 'Chưa có trận đấu hoàn thành', value: 1, color: '#334155' },
      ];
    }
    return [
      {
        name: 'Trắng thắng (Đi tiên)',
        value: totalWhiteWins,
        color: '#10b981', // emerald
      },
      {
        name: 'Hòa (½ - ½)',
        value: totalDraws,
        color: '#f59e0b', // amber
      },
      {
        name: 'Đen thắng (Đi hậu)',
        value: totalBlackWins,
        color: '#6366f1', // indigo
      },
    ].filter((item) => item.value > 0);
  }, [tournamentSummary]);

  // Selected player detailed stats if single player chosen
  const selectedPlayer = useMemo(() => {
    if (selectedPlayerId === 'all') return null;
    return playerStatsList.find((p) => p.id === selectedPlayerId) || null;
  }, [playerStatsList, selectedPlayerId]);

  // Single player breakdown pie data
  const selectedPlayerPieData = useMemo(() => {
    if (!selectedPlayer || selectedPlayer.played === 0) return [];
    return [
      { name: 'Thắng', value: selectedPlayer.won, color: COLORS.win },
      { name: 'Hòa', value: selectedPlayer.drawn, color: COLORS.draw },
      { name: 'Thua', value: selectedPlayer.lost, color: COLORS.loss },
    ].filter((d) => d.value > 0);
  }, [selectedPlayer]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phân Tích Thống Kê & Hiệu Suất Kỳ Thủ</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Biểu Đồ Tần Suất Thắng Thua Giải Đấu</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Thống kê trực quan số ván Thắng - Hòa - Thua, tỉ lệ chiến thắng và hiệu suất thi đấu khi cầm quân Trắng / Đen của các kỳ thủ từ dữ liệu giải đấu thực tế.
            </p>
          </div>

          {/* Quick Toggle Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIncludeKnockout(!includeKnockout)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                includeKnockout
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gồm cả Bán kết / Chung kết: {includeKnockout ? 'Bật' : 'Tắt'}</span>
            </button>
          </div>
        </div>

        {/* Highlight Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              Tổng số ván đã đấu
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {tournamentSummary.totalGames}{' '}
              <span className="text-xs font-semibold text-slate-500">ván</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              Điểm cao nhất
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums truncate">
              {tournamentSummary.topPlayer?.points ?? 0}{' '}
              <span className="text-xs font-semibold text-slate-400">
                ({tournamentSummary.topPlayer?.name || '-'})
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              Tỉ lệ thắng cao nhất
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums truncate">
              {tournamentSummary.highestWinRatePlayer?.winRate ?? 0}%{' '}
              <span className="text-xs font-semibold text-slate-400">
                ({tournamentSummary.highestWinRatePlayer?.name || '-'})
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              Tỉ lệ ván Hòa
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">
              {tournamentSummary.totalGames > 0
                ? Math.round((tournamentSummary.totalDraws / tournamentSummary.totalGames) * 100)
                : 0}
              %{' '}
              <span className="text-xs font-semibold text-slate-500">
                ({tournamentSummary.totalDraws} ván)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Group Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Xem theo:</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterGroup('all');
                setSelectedPlayerId('all');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterGroup === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cả 2 Bảng
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterGroup('A');
                setSelectedPlayerId('all');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterGroup === 'A'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bảng A
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterGroup('B');
                setSelectedPlayerId('all');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterGroup === 'B'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bảng B
            </button>
          </div>

          {/* Select Single Player */}
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Tất cả kỳ thủ</option>
            {playerStatsList
              .filter((p) => filterGroup === 'all' || p.group === filterGroup)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Bảng {p.group})
                </option>
              ))}
          </select>
        </div>

        {/* Right: Chart unit switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Đơn vị hiển thị:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartView('counts')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'counts'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Số ván đấu
            </button>
            <button
              type="button"
              onClick={() => setChartView('percentages')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'percentages'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tỉ lệ %
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Vinh Danh MVP Toàn Giải (MVP Leaderboard & Awards) */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
        {/* MVP Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-white">
                  Bảng Vinh Danh MVP Toàn Giải (Most Valuable Player)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Vinh Danh Kỳ Thủ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Xếp hạng dựa trên tổng số ván thắng toàn giải, đặc biệt cộng điểm nhân tố bản lĩnh trong các ván cờ chớp & knockout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMvpFormula(!showMvpFormula)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded-xl transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showMvpFormula ? 'Ẩn công thức tính điểm' : 'Xem công thức tính điểm MVP'}</span>
            {showMvpFormula ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* MVP Formula Explanation (Collapsible) */}
        {showMvpFormula && (
          <div className="bg-slate-950/80 border border-amber-800/40 rounded-2xl p-4 text-xs text-slate-300 space-y-2.5">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Hệ Thống Trọng Số Điểm MVP (Đặc biệt vinh danh Cờ chớp & Knockout):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-rose-800/40 text-center">
                <span className="text-[10px] text-rose-400 font-bold block uppercase">Ván 7 Armageddon</span>
                <span className="text-base font-extrabold text-white">+30đ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sinh tử hòa thua</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-800/40 text-center">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">Tie-Break Cờ Chớp</span>
                <span className="text-base font-extrabold text-white">+20đ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Ván 3 - 6 phụ</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-indigo-800/40 text-center">
                <span className="text-[10px] text-indigo-400 font-bold block uppercase">Knockout Chính</span>
                <span className="text-base font-extrabold text-white">+15đ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Ván 1 - 2 chính</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-emerald-800/40 text-center">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">Ván Thắng Vòng Bảng</span>
                <span className="text-base font-extrabold text-white">+10đ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Mỗi ván thắng</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-300 font-bold block uppercase">Ván Hòa Toàn Giải</span>
                <span className="text-base font-extrabold text-white">+5đ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Mỗi ván hòa cờ</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Điểm MVP = (Thắng Vòng Bảng × 10) + (Hòa × 5) + (Thắng Knockout Chính × 15) + (Thắng Tie-break Cờ Chớp × 20) + (Thắng Armageddon × 30) + (Tỉ lệ Thắng % × 0.1).
            </p>
          </div>
        )}

        {/* Top 3 MVP Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 - MVP Bạc */}
          {filteredMvpList[1] && (
            <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-4 text-center flex flex-col justify-between order-2 md:order-1 relative">
              <div>
                <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-md">
                  2
                </div>
                <div className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider mb-0.5">
                  🥈 MVP Hạng Nhì (Bạc)
                </div>
                <div className="text-base font-extrabold text-white truncate px-1">
                  {filteredMvpList[1].name}
                </div>
                <div className="text-[11px] text-indigo-300 font-medium mt-0.5">
                  Bảng {filteredMvpList[1].group} · {filteredMvpList[1].titleBadge}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Điểm MVP</span>
                  <span className="text-sm font-black text-amber-300 tabular-nums">
                    {filteredMvpList[1].mvpScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tổng Thắng</span>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {filteredMvpList[1].totalWins}v
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Cờ Chớp</span>
                  <span className="text-sm font-bold text-rose-400 tabular-nums">
                    {filteredMvpList[1].clutchWins}v
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 - MVP Vàng (Most Valuable Player) */}
          {filteredMvpList[0] && (
            <div className="bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500 rounded-2xl p-5 text-center flex flex-col justify-between order-1 md:order-2 shadow-2xl shadow-amber-950/40 relative ring-1 ring-amber-400/50">
              <div className="absolute top-2.5 right-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/30">
                  <Crown className="w-7 h-7 text-slate-950" />
                </div>
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-0.5">
                  👑 QUÁN QUÂN MVP (VÀNG)
                </div>
                <div className="text-lg font-black text-white truncate px-1">
                  {filteredMvpList[0].name}
                </div>
                <div className="text-xs text-amber-300 font-semibold mt-1">
                  Bảng {filteredMvpList[0].group} · {filteredMvpList[0].titleBadge}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-800/40 grid grid-cols-3 gap-1 text-center bg-slate-950/50 rounded-xl p-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Điểm MVP</span>
                  <span className="text-base font-black text-amber-300 tabular-nums">
                    {filteredMvpList[0].mvpScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tổng Thắng</span>
                  <span className="text-base font-black text-emerald-400 tabular-nums">
                    {filteredMvpList[0].totalWins} ván
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Cờ Chớp</span>
                  <span className="text-base font-black text-rose-400 tabular-nums">
                    {filteredMvpList[0].clutchWins} ván
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 - MVP Đồng */}
          {filteredMvpList[2] && (
            <div className="bg-slate-900/70 border border-amber-800/40 rounded-2xl p-4 text-center flex flex-col justify-between order-3 relative">
              <div>
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-md">
                  3
                </div>
                <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider mb-0.5">
                  🥉 MVP Hạng Ba (Đồng)
                </div>
                <div className="text-base font-extrabold text-white truncate px-1">
                  {filteredMvpList[2].name}
                </div>
                <div className="text-[11px] text-indigo-300 font-medium mt-0.5">
                  Bảng {filteredMvpList[2].group} · {filteredMvpList[2].titleBadge}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Điểm MVP</span>
                  <span className="text-sm font-black text-amber-300 tabular-nums">
                    {filteredMvpList[2].mvpScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tổng Thắng</span>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {filteredMvpList[2].totalWins}v
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Cờ Chớp</span>
                  <span className="text-sm font-bold text-rose-400 tabular-nums">
                    {filteredMvpList[2].clutchWins}v
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Full MVP Standings Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Bảng Xếp Hạng Chi Tiết Toàn Bộ Kỳ Thủ</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {filteredMvpList.length} kỳ thủ tham dự
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-none rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/80">
                  <th className="py-3 px-3.5 w-14 text-center">Hạng</th>
                  <th className="py-3 px-3">Kỳ thủ</th>
                  <th className="py-3 px-2 text-center">Bảng</th>
                  <th className="py-3 px-3 text-center text-amber-300 font-black" title="Điểm tổng hợp MVP">
                    Điểm MVP
                  </th>
                  <th className="py-3 px-3 text-center text-emerald-400 font-bold" title="Tổng số ván thắng toàn giải">
                    Tổng Thắng
                  </th>
                  <th className="py-3 px-3 text-center text-rose-400 font-bold" title="Thắng Tie-break cờ chớp & Armageddon">
                    ⚡ Cờ Chớp
                  </th>
                  <th className="py-3 px-2.5 text-center text-indigo-400" title="Thắng Knockout chính thức">
                    Knockout
                  </th>
                  <th className="py-3 px-2.5 text-center text-slate-300" title="Thắng Vòng Bảng">
                    Vòng Bảng
                  </th>
                  <th className="py-3 px-2.5 text-center text-slate-300" title="Tổng ván đã đấu">
                    Số ván
                  </th>
                  <th className="py-3 px-3 text-center">Tỉ lệ Thắng</th>
                  <th className="py-3 px-3 text-center">Danh Hiệu Vinh Danh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredMvpList.map((p) => {
                  const isTop1 = p.rank === 1;
                  const isTop2 = p.rank === 2;
                  const isTop3 = p.rank === 3;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isTop1
                          ? 'bg-amber-950/20 font-semibold'
                          : isTop2
                          ? 'bg-slate-800/20'
                          : isTop3
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        {isTop1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center justify-center shadow-sm">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs inline-flex items-center justify-center">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs inline-flex items-center justify-center">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs font-bold">
                            #{p.rank}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          {isTop1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <span className="truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.group === 'A'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              : 'bg-sky-950 text-sky-300 border border-sky-800/50'
                          }`}
                        >
                          Bảng {p.group}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-sm">
                          {p.mvpScore}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums font-black text-emerald-400 text-sm">
                        {p.totalWins}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums font-bold text-rose-400">
                        {p.clutchWins > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800/50 inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-rose-400" />
                            <span>{p.clutchWins}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-center tabular-nums text-indigo-300 font-semibold">
                        {p.totalKnockoutWins > 0 ? p.totalKnockoutWins : '-'}
                      </td>
                      <td className="py-3 px-2.5 text-center tabular-nums text-slate-300 font-semibold">
                        {p.groupWins}
                      </td>
                      <td className="py-3 px-2.5 text-center tabular-nums text-slate-400">
                        {p.totalPlayed}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-10 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${p.winRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-emerald-400 tabular-nums text-[11px]">
                            {p.winRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] font-semibold text-amber-300/90 whitespace-nowrap bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {p.titleBadge}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Recharts Bar Chart (Tần suất Thắng / Hòa / Thua) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display text-base font-bold text-white">
                  {chartView === 'counts'
                    ? 'Biểu Đồ Số Ván Thắng - Hòa - Thua Của Các Kỳ Thủ'
                    : 'Biểu Đồ Tỉ Lệ % Thắng - Hòa - Thua Của Các Kỳ Thủ'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {filteredStats.length} kỳ thủ
              </span>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-80 sm:h-96">
              {barChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Không có dữ liệu cho bộ lọc này.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 20, left: -10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      unit={chartView === 'percentages' ? '%' : ''}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 z-50">
                              <p className="font-bold text-white text-sm border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                                <span>{data.fullName}</span>
                                <span className="text-[11px] font-normal text-indigo-400">
                                  {data.group}
                                </span>
                              </p>
                              <div className="flex items-center justify-between gap-4 text-emerald-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Thắng:
                                </span>
                                <span className="font-bold tabular-nums">
                                  {chartView === 'percentages'
                                    ? `${data.won}% (${data.rawWon} ván)`
                                    : `${data.won} ván`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-amber-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Hòa:
                                </span>
                                <span className="font-bold tabular-nums">
                                  {chartView === 'percentages'
                                    ? `${data.drawn}% (${data.rawDrawn} ván)`
                                    : `${data.drawn} ván`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-rose-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  Thua:
                                </span>
                                <span className="font-bold tabular-nums">
                                  {chartView === 'percentages'
                                    ? `${data.lost}% (${data.rawLost} ván)`
                                    : `${data.lost} ván`}
                                </span>
                              </div>
                              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-slate-300">
                                <span>Tổng điểm tích lũy:</span>
                                <span className="font-bold text-amber-300 tabular-nums">
                                  {data.points} điểm
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          won: 'Thắng (1.0)',
                          drawn: 'Hòa (0.5)',
                          lost: 'Thua (0.0)',
                        };
                        return (
                          <span className="text-xs font-semibold text-slate-300">
                            {labels[value] || value}
                          </span>
                        );
                      }}
                    />
                    <Bar
                      dataKey="won"
                      name="won"
                      fill={COLORS.win}
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="drawn"
                      name="drawn"
                      fill={COLORS.draw}
                      radius={[0, 0, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="lost"
                      name="lost"
                      fill={COLORS.loss}
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Legend Helper */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Xanh ngọc: Ván Thắng (+1đ)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>Vàng cam: Ván Hòa (+½đ)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Đỏ hồng: Ván Thua (0đ)</span>
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Donut / Breakdown Chart */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display text-base font-bold text-white">
                  {selectedPlayer
                    ? `Tỉ Lệ: ${selectedPlayer.name}`
                    : 'Cơ Cấu Kết Quả Toàn Giải'}
                </h3>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="w-full h-56 sm:h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
                            <span className="font-bold text-white">{item.name}</span>
                            <p className="text-slate-300 font-semibold tabular-nums">
                              {item.value} ván
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={selectedPlayer ? selectedPlayerPieData : outcomesPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(selectedPlayer ? selectedPlayerPieData : outcomesPieData).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS.accent}
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Stats breakdown items */}
            <div className="space-y-2 mt-2">
              {selectedPlayer ? (
                <>
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Số ván thắng
                    </span>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {selectedPlayer.won} ván ({selectedPlayer.winRate}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                      Số ván hòa
                    </span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      {selectedPlayer.drawn} ván
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      Số ván thua
                    </span>
                    <span className="font-bold text-rose-400 tabular-nums">
                      {selectedPlayer.lost} ván
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Trắng thắng (Đi tiên)
                    </span>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {tournamentSummary.totalWhiteWins} ván (
                      {tournamentSummary.totalGames > 0
                        ? Math.round(
                            (tournamentSummary.totalWhiteWins /
                              tournamentSummary.totalGames) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Hòa cờ
                    </span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      {tournamentSummary.totalDraws} ván (
                      {tournamentSummary.totalGames > 0
                        ? Math.round(
                            (tournamentSummary.totalDraws /
                              tournamentSummary.totalGames) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Đen thắng (Đi hậu)
                    </span>
                    <span className="font-bold text-indigo-400 tabular-nums">
                      {tournamentSummary.totalBlackWins} ván (
                      {tournamentSummary.totalGames > 0
                        ? Math.round(
                            (tournamentSummary.totalBlackWins /
                              tournamentSummary.totalGames) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
            {selectedPlayer
              ? `Điểm trung bình mỗi ván: ${(
                  selectedPlayer.points / (selectedPlayer.played || 1)
                ).toFixed(2)}đ`
              : 'Tổng số ván quyết định: ' +
                (tournamentSummary.totalWhiteWins +
                  tournamentSummary.totalBlackWins) +
                ' ván'}
          </div>
        </div>
      </div>

      {/* Comprehensive Detailed Statistics Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Bảng Số Liệu Chi Tiết Hiệu Suất Từng Kỳ Thủ
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bao gồm phân tích hiệu quả khi cầm quân Trắng (đi tiên) và quân Đen (đi hậu)
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Sắp xếp theo Điểm số & Tỉ lệ thắng
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="py-3 px-3.5 rounded-l-xl">Kỳ thủ</th>
                <th className="py-3 px-2 text-center">Bảng</th>
                <th className="py-3 px-2 text-center">Số trận</th>
                <th className="py-3 px-2 text-center text-emerald-400">Thắng</th>
                <th className="py-3 px-2 text-center text-amber-400">Hòa</th>
                <th className="py-3 px-2 text-center text-rose-400">Thua</th>
                <th className="py-3 px-2.5 text-center text-amber-300 font-bold">Điểm</th>
                <th className="py-3 px-3 text-center">Tỉ lệ Thắng</th>
                <th className="py-3 px-3 text-center text-slate-300">Cầm Trắng (T/H/B)</th>
                <th className="py-3 px-3 text-center text-slate-300 rounded-r-xl">Cầm Đen (T/H/B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredStats.map((s, idx) => {
                const isTop1 = idx === 0 && s.points > 0;
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isTop1 ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 font-bold text-white flex items-center gap-2">
                      {isTop1 ? (
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <span className="w-4 text-slate-500 font-mono text-[11px]">
                          #{idx + 1}
                        </span>
                      )}
                      <span className="truncate">{s.name}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.group === 'A'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            : 'bg-sky-950 text-sky-300 border border-sky-800/50'
                        }`}
                      >
                        Bảng {s.group}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-300 tabular-nums">
                      {s.played}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-400 tabular-nums">
                      {s.won}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-amber-400 tabular-nums">
                      {s.drawn}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-rose-400 tabular-nums">
                      {s.lost}
                    </td>
                    <td className="py-3 px-2.5 text-center font-extrabold text-amber-300 tabular-nums text-sm">
                      {s.points}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${s.winRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-400 tabular-nums text-[11px]">
                          {s.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-[11px] text-slate-300 tabular-nums">
                      {s.whiteWon}/{s.whiteDrawn}/{s.whiteLost}{' '}
                      <span className="text-slate-500">({s.whitePlayed}v)</span>
                    </td>
                    <td className="py-3 px-3 text-center text-[11px] text-slate-300 tabular-nums">
                      {s.blackWon}/{s.blackDrawn}/{s.blackLost}{' '}
                      <span className="text-slate-500">({s.blackPlayed}v)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
