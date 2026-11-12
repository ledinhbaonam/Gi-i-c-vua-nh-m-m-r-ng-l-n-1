/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TournamentState,
  Match,
  KnockoutMatch,
  KnockoutStage,
  NotificationLog,
  StreamPlatform,
} from './types/tournament';
import {
  INITIAL_TOURNAMENT_STATE,
  calculateStandings,
  syncKnockoutBrackets,
  formatChessScore,
  formatSessionName,
  sortMatchesChronologically,
  createDefaultSemiGames,
  evaluateSemiFinalMatch,
  swapSemiGameColors,
  setSeriesInitialColors,
  setSpecificGameColors,
  getMatchStartDateTime,
} from './utils/tournamentEngine';
import { tournamentService } from './services/api';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScheduleView } from './components/ScheduleView';
import { StandingsView } from './components/StandingsView';
import { KnockoutView } from './components/KnockoutView';
import { ResultsHistoryView } from './components/ResultsHistoryView';
import { RulesView } from './components/RulesView';
import { OnlineRegulationsView } from './components/OnlineRegulationsView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { QuickPairModal } from './components/QuickPairModal';
import { ObsOverlayView } from './components/ObsOverlayView';
import { StatisticsView } from './components/StatisticsView';
import { MatchAlertBanner } from './components/MatchAlertBanner';
import { MatchReminderModal } from './components/MatchReminderModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { MatchNoteModal } from './components/MatchNoteModal';
import { Lock, Radio, Cloud } from 'lucide-react';

export default function App() {
  const [tournamentState, setTournamentState] = useState<TournamentState>(INITIAL_TOURNAMENT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as ActiveTab | null;
      if (
        tabParam &&
        [
          'rules',
          'regulations',
          'schedule',
          'standings',
          'knockout',
          'results',
          'statistics',
        ].includes(tabParam)
      ) {
        return tabParam;
      }
    }
    return 'rules';
  });

  // Roles & Permissions
  // Check URL params for ?mode=viewer
  const [isViewerOnly, setIsViewerOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'viewer';
    }
    return false;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'viewer') return false;
      return sessionStorage.getItem('admin_authenticated') === 'true';
    }
    return false;
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQuickPairModalOpen, setIsQuickPairModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [noteModalMatch, setNoteModalMatch] = useState<Match | KnockoutMatch | null>(null);

  // Match Notification & Reminder Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chess_sound_alerts') !== 'false';
    }
    return true;
  });
  const [alertThresholdMinutes, setAlertThresholdMinutes] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chess_alert_threshold');
      if (saved) return parseInt(saved, 10) || 30;
    }
    return 30;
  });
  const [reminderFilterPlayerId, setReminderFilterPlayerId] = useState<string>('all');

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chess_sound_alerts', String(next));
      }
      return next;
    });
  };

  const handleChangeThreshold = (mins: number) => {
    setAlertThresholdMinutes(mins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chess_alert_threshold', String(mins));
    }
  };

  // Check if current view is OBS Studio Browser Source Overlay
  const isObsOverlay = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('overlay') === 'obs';
  const obsMatchId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('matchId') : null;

  // Tính số lượng ván đấu đang sắp diễn ra / đang chờ đấu
  const upcomingMatchesCount = useMemo(() => {
    const now = Date.now();
    let count = 0;
    for (const m of tournamentState.matches) {
      if (m.status === 'finished' || (m.score1 !== undefined && m.score2 !== undefined)) continue;
      if (!m.date || !m.time) continue;
      const start = getMatchStartDateTime(m.date, m.time);
      if (!start) continue;
      const diffMs = start.getTime() - now;
      const diffMinutes = Math.floor(diffMs / 60000);
      if ((diffMs > 0 && diffMinutes <= alertThresholdMinutes) || (diffMs <= 0 && diffMs >= -90 * 60 * 1000)) {
        count++;
      }
    }
    for (const k of tournamentState.knockoutMatches) {
      if (k.status === 'finished' || (k.score1 !== undefined && k.score2 !== undefined && k.winnerId)) continue;
      if (!k.date || !k.time) continue;
      const start = getMatchStartDateTime(k.date, k.time);
      if (!start) continue;
      const diffMs = start.getTime() - now;
      const diffMinutes = Math.floor(diffMs / 60000);
      if ((diffMs > 0 && diffMinutes <= alertThresholdMinutes) || (diffMs <= 0 && diffMs >= -120 * 60 * 1000)) {
        count++;
      }
    }
    return count;
  }, [tournamentState.matches, tournamentState.knockoutMatches, alertThresholdMinutes]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await tournamentService.getState();
        if (isMounted && data && data.players) {
          setTournamentState(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu ban đầu:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time synchronization via Cloud Firestore (Lưu trữ đám mây vĩnh viễn & push tức thì)
  useEffect(() => {
    const unsubscribe = tournamentService.subscribeToCloud((latest) => {
      if (latest && latest.players) {
        setTournamentState(latest);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save changes to API & local storage
  const persistState = useCallback(async (newState: TournamentState) => {
    setTournamentState(newState);
    await tournamentService.saveState(newState);
  }, []);

  // Standings computation
  const standingsA = useMemo(() => {
    return calculateStandings(tournamentState.players, tournamentState.matches, 'A');
  }, [tournamentState.players, tournamentState.matches]);

  const standingsB = useMemo(() => {
    return calculateStandings(tournamentState.players, tournamentState.matches, 'B');
  }, [tournamentState.players, tournamentState.matches]);

  // Synchronize knockout brackets when standings update
  useEffect(() => {
    const updatedKnockouts = syncKnockoutBrackets(
      tournamentState.knockoutMatches,
      standingsA,
      standingsB,
      tournamentState.players
    );

    // Only update if there is a real change in participants
    const hasChanged = JSON.stringify(updatedKnockouts) !== JSON.stringify(tournamentState.knockoutMatches);
    if (hasChanged) {
      setTournamentState((prev) => ({
        ...prev,
        knockoutMatches: updatedKnockouts,
      }));
    }
  }, [standingsA, standingsB, tournamentState.players]);

  // Admin authentication
  const handleVerifyPin = (pin: string): boolean => {
    if (pin.trim() === tournamentState.adminPin) {
      setIsAdmin(true);
      setIsViewerOnly(false);
      sessionStorage.setItem('admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  // Switch to Viewer Mode
  // As requested: "cho 1 nút để chuyển sang web viewer (ko đc sửa và viewer ko có nút qua trang có thể chỉnh sửa)"
  const handleSwitchToViewer = () => {
    setIsViewerOnly(true);
    setIsAdmin(false);
    sessionStorage.removeItem('admin_authenticated');
    // Update URL query parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'viewer');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Add a match to schedule - Auto sort chronologically
  const handleAddMatch = (newMatchData: Omit<Match, 'id' | 'status'>) => {
    const newId = `m_${newMatchData.group.toLowerCase()}_r${newMatchData.round}_${Date.now()}`;
    const newMatch: Match = {
      ...newMatchData,
      id: newId,
      status: 'scheduled',
      updatedAt: new Date().toISOString(),
    };

    const p1 = tournamentState.players.find((p) => p.id === newMatch.player1Id)?.name || 'Kỳ thủ 1';
    const p2 = tournamentState.players.find((p) => p.id === newMatch.player2Id)?.name || 'Kỳ thủ 2';

    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'schedule',
      roundText: `Lượt ${newMatch.round}`,
      title: `Thêm lịch thi đấu Bảng ${newMatch.group}`,
      detail: `${p1} gặp ${p2} vào lúc ${newMatch.time} ngày ${newMatch.date} (Buổi ${formatSessionName(newMatch.session, newMatch.time)}). Đã tự động chèn vào đúng trình tự thời gian.`,
    };

    // Luôn sắp xếp theo thời gian tăng dần: Ngày -> Giờ -> Bảng -> Lượt -> Bàn
    const sortedMatches = sortMatchesChronologically([...tournamentState.matches, newMatch]);

    const updatedState: TournamentState = {
      ...tournamentState,
      matches: sortedMatches,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // Add batch matches (Quick Pair) - Auto sort chronologically
  const handleAddBatchMatches = (newMatches: Match[]) => {
    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'schedule',
      roundText: 'Hệ thống',
      title: 'Tạo lịch thi đấu vòng tròn 6 lượt tự động',
      detail: `Đã xếp lịch thành công ${newMatches.length} ván đấu theo thứ tự thời gian chuẩn.`,
    };

    const sortedMatches = sortMatchesChronologically([...tournamentState.matches, ...newMatches]);

    const updatedState: TournamentState = {
      ...tournamentState,
      matches: sortedMatches,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // Update match score (1-0, 1/2-1/2, 0-1)
  const handleUpdateMatchScore = (matchId: string, score1: number, score2: number) => {
    const targetMatch = tournamentState.matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const p1Name = tournamentState.players.find((p) => p.id === targetMatch.player1Id)?.name || 'Kỳ thủ 1';
    const p2Name = tournamentState.players.find((p) => p.id === targetMatch.player2Id)?.name || 'Kỳ thủ 2';
    const scoreText = formatChessScore(score1, score2);

    let outcomeText = '';
    if (score1 === 1) outcomeText = `${p1Name} thắng (+1 điểm)`;
    else if (score2 === 1) outcomeText = `${p2Name} thắng (+1 điểm)`;
    else outcomeText = 'Hai kỳ thủ hòa cờ (+½ điểm mỗi người)';

    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'result',
      roundText: `Lượt ${targetMatch.round}`,
      title: `Kết quả ván đấu Bảng ${targetMatch.group}: ${p1Name} ${scoreText} ${p2Name}`,
      detail: `${outcomeText}. Bảng xếp hạng Bảng ${targetMatch.group} đã được tự động cập nhật.`,
    };

    const updatedMatches = tournamentState.matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          score1,
          score2,
          status: 'finished' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    const updatedState: TournamentState = {
      ...tournamentState,
      matches: updatedMatches,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // Reset match score to scheduled
  const handleResetMatchScore = (matchId: string) => {
    const updatedMatches = tournamentState.matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          score1: undefined,
          score2: undefined,
          status: 'scheduled' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    const updatedState: TournamentState = {
      ...tournamentState,
      matches: updatedMatches,
    };

    persistState(updatedState);
  };

  // Delete match
  const handleDeleteMatch = (matchId: string) => {
    const updatedMatches = tournamentState.matches.filter((m) => m.id !== matchId);
    const updatedState: TournamentState = {
      ...tournamentState,
      matches: updatedMatches,
    };
    persistState(updatedState);
  };

  // Knockout Game score update (Best-of-2, sudden-death tie-breaks to Game 7 Armageddon for all stages)
  const handleUpdateSemiGameScore = (
    stage: KnockoutStage,
    gameNumber: number,
    scoreWhite: number,
    scoreBlack: number
  ) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        let games = k.games ? [...k.games] : [];
        if (games.length === 0 && k.player1Id && k.player2Id) {
          games = createDefaultSemiGames(k.player1Id, k.player2Id);
        }

        const gameIndex = games.findIndex((g) => g.gameNumber === gameNumber);
        if (gameIndex !== -1) {
          const targetGame = { ...games[gameIndex] };
          targetGame.scoreWhite = scoreWhite;
          targetGame.scoreBlack = scoreBlack;
          targetGame.status = 'finished';

          // Winner logic per game
          if (scoreWhite > scoreBlack) {
            targetGame.winnerId = targetGame.whitePlayerId;
            targetGame.armageddonRuleApplied = false;
          } else if (scoreBlack > scoreWhite) {
            targetGame.winnerId = targetGame.blackPlayerId;
            targetGame.armageddonRuleApplied = false;
          } else {
            // Draw (0.5 - 0.5)
            if (targetGame.gameNumber === 7 || targetGame.isArmageddon) {
              // Luật ván 7 Armageddon: Cầm Trắng hòa sẽ Thua, Cầm Đen hòa sẽ Thắng!
              targetGame.winnerId = targetGame.blackPlayerId;
              targetGame.armageddonRuleApplied = true;
            } else {
              targetGame.winnerId = undefined;
              targetGame.armageddonRuleApplied = false;
            }
          }
          games[gameIndex] = targetGame;
        }

        return evaluateSemiFinalMatch({
          ...k,
          games,
          updatedAt: new Date().toISOString(),
        });
      }
      return k;
    });

    // Tự động phân nhánh tiếp theo cho Chung kết và Tranh hạng ba
    const resyncedKnockouts = syncKnockoutBrackets(
      updatedKnockouts,
      standingsA,
      standingsB,
      tournamentState.players
    );

    const targetK = resyncedKnockouts.find((k) => k.stage === stage);
    const targetGame = targetK?.games?.find((g) => g.gameNumber === gameNumber);
    const whitePlayer = tournamentState.players.find((p) => p.id === targetGame?.whitePlayerId);
    const blackPlayer = tournamentState.players.find((p) => p.id === targetGame?.blackPlayerId);

    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'knockout',
      roundText: `${targetK?.title || 'Knockout'} · Ván ${gameNumber}`,
      title: `Kết quả ${targetK?.title || 'Knockout'} (Ván ${gameNumber}): ${whitePlayer?.name || 'Trắng'} ${formatChessScore(scoreWhite, scoreBlack)} ${blackPlayer?.name || 'Đen'}`,
      detail: targetGame?.armageddonRuleApplied
        ? `Ván 7 hòa: ${blackPlayer?.name} (cầm Đen) thắng theo Luật Armageddon! ${targetK?.outcomeNote || ''}`
        : `${targetK?.outcomeNote || 'Đã cập nhật kết quả trận đấu.'}`,
    };

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: resyncedKnockouts,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // Reset a specific knockout game
  const handleResetSemiGameScore = (stage: KnockoutStage, gameNumber: number) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage && k.games) {
        const games = k.games.map((g) => {
          if (g.gameNumber === gameNumber) {
            return {
              ...g,
              scoreWhite: undefined,
              scoreBlack: undefined,
              status: 'scheduled' as const,
              winnerId: undefined,
              armageddonRuleApplied: undefined,
            };
          }
          return g;
        });

        // Chỉ giữ lại các ván hợp lệ nếu ván trước bị hủy
        const validGames = games.filter((g) => {
          if (g.gameNumber <= 2) return true;
          return g.gameNumber <= gameNumber;
        });

        return evaluateSemiFinalMatch({
          ...k,
          games: validGames,
          updatedAt: new Date().toISOString(),
        });
      }
      return k;
    });

    const resyncedKnockouts = syncKnockoutBrackets(
      updatedKnockouts,
      standingsA,
      standingsB,
      tournamentState.players
    );

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: resyncedKnockouts,
    };

    persistState(updatedState);
  };

  // Reset entire knockout series
  const handleResetSemiMatch = (stage: KnockoutStage) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        const p1 = k.player1Id || '';
        const p2 = k.player2Id || '';
        return {
          ...k,
          games: createDefaultSemiGames(p1, p2),
          score1: 0,
          score2: 0,
          wins1: 0,
          wins2: 0,
          winnerId: undefined,
          status: 'scheduled' as const,
          outcomeNote: undefined,
          colorsChosen: false,
          updatedAt: new Date().toISOString(),
        };
      }
      return k;
    });

    const resyncedKnockouts = syncKnockoutBrackets(
      updatedKnockouts,
      standingsA,
      standingsB,
      tournamentState.players
    );

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: resyncedKnockouts,
    };

    persistState(updatedState);
  };

  // Admin chỉ định kỳ thủ cầm Trắng cho loạt trận
  const handleSetSeriesColors = (stage: KnockoutStage, whitePlayerId: string) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        return setSeriesInitialColors(k, whitePlayerId);
      }
      return k;
    });

    const targetK = updatedKnockouts.find((k) => k.stage === stage);
    const whitePlayer = tournamentState.players.find((p) => p.id === whitePlayerId);

    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'knockout',
      roundText: `${targetK?.title || 'Knockout'} · Chỉ định màu quân`,
      title: `Admin chỉ định màu quân: ${whitePlayer?.name || 'Kỳ thủ'} cầm Trắng`,
      detail: `Đã xác nhận ${whitePlayer?.name} cầm Trắng ở Ván 1 của ${targetK?.title}. Các ván tiếp theo sẽ luân phiên đổi màu hoặc do Admin chủ động điều chỉnh.`,
    };

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: updatedKnockouts,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // Admin đổi bên Trắng ⇄ Đen cho một ván cụ thể
  const handleSwapGameColors = (stage: KnockoutStage, gameNumber: number) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        return swapSemiGameColors(k, gameNumber);
      }
      return k;
    });

    const targetK = updatedKnockouts.find((k) => k.stage === stage);
    const g = targetK?.games?.find((gm) => gm.gameNumber === gameNumber);
    const whitePlayer = tournamentState.players.find((p) => p.id === g?.whitePlayerId);
    const blackPlayer = tournamentState.players.find((p) => p.id === g?.blackPlayerId);

    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'knockout',
      roundText: `${targetK?.title || 'Knockout'} · Ván ${gameNumber}`,
      title: `Admin đổi màu quân Ván ${gameNumber}: ${whitePlayer?.name} (Trắng) vs ${blackPlayer?.name} (Đen)`,
      detail: `Cập nhật màu quân ván đấu theo quyết định của Quản trị viên.`,
    };

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: updatedKnockouts,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // Admin chỉ định trực tiếp ai Trắng ai Đen cho một ván cụ thể
  const handleSetGameColors = (
    stage: KnockoutStage,
    gameNumber: number,
    whitePlayerId: string,
    blackPlayerId: string
  ) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        return setSpecificGameColors(k, gameNumber, whitePlayerId, blackPlayerId);
      }
      return k;
    });

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: updatedKnockouts,
    };

    persistState(updatedState);
  };

  // Knockout stage score update (for Final & Third Place)
  const handleUpdateKnockoutScore = (
    stage: KnockoutStage,
    score1: number,
    score2: number,
    winnerId?: string
  ) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        let actualWinner = winnerId;
        if (!actualWinner) {
          if (score1 > score2) actualWinner = k.player1Id;
          else if (score2 > score1) actualWinner = k.player2Id;
        }
        return {
          ...k,
          score1,
          score2,
          winnerId: actualWinner,
          status: 'finished' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return k;
    });

    const targetK = updatedKnockouts.find((k) => k.stage === stage);
    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'knockout',
      roundText: 'Knockout',
      title: `Kết quả ${targetK?.title || stage}`,
      detail: `Tỉ số chung cuộc: ${formatChessScore(score1, score2)}. Cập nhật bảng xếp hạng chung cuộc toàn giải.`,
    };

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: updatedKnockouts,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  const handleResetKnockoutScore = (stage: KnockoutStage) => {
    const updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
      if (k.stage === stage) {
        return {
          ...k,
          score1: undefined,
          score2: undefined,
          winnerId: undefined,
          status: 'scheduled' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return k;
    });

    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: updatedKnockouts,
    };

    persistState(updatedState);
  };

  // Settings update
  const handleSaveSettings = (newTitle: string, newPin: string) => {
    const updatedState: TournamentState = {
      ...tournamentState,
      title: newTitle,
      adminPin: newPin,
    };
    persistState(updatedState);
  };

  const handleResetTournament = async () => {
    const resetted = await tournamentService.resetToDefault();
    setTournamentState(resetted);
  };



  // Admin lưu ghi chú riêng cho trận đấu (Match hoặc KnockoutMatch)
  const handleSaveMatchNotes = (
    matchId: string,
    notes: string,
    isKnockout?: boolean
  ) => {
    let updatedMatches = tournamentState.matches;
    let updatedKnockouts = tournamentState.knockoutMatches;

    if (isKnockout) {
      updatedKnockouts = tournamentState.knockoutMatches.map((k) => {
        if (k.id === matchId || k.stage === matchId) {
          return {
            ...k,
            notes: notes.trim() ? notes.trim() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return k;
      });
    } else {
      updatedMatches = tournamentState.matches.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            notes: notes.trim() ? notes.trim() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });
    }

    const notif: NotificationLog = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      roundText: '📝 Ghi chú BTC',
      title: notes.trim() ? 'Đã cập nhật biên bản / ghi chú trận đấu' : 'Đã xóa ghi chú trận đấu',
      detail: notes.trim()
        ? `Nội dung ghi chú: "${notes.length > 60 ? notes.slice(0, 57) + '...' : notes}"`
        : 'Ban tổ chức đã xóa ghi chú của trận đấu.',
    };

    const updatedState: TournamentState = {
      ...tournamentState,
      matches: updatedMatches,
      knockoutMatches: updatedKnockouts,
      notifications: [notif, ...tournamentState.notifications],
    };

    persistState(updatedState);
  };

  // If in OBS Studio Browser Source Overlay mode, render transparent broadcast HUD
  if (isObsOverlay) {
    const targetMatch =
      tournamentState.matches.find((m) => m.id === obsMatchId) ||
      tournamentState.knockoutMatches.find((k) => k.id === obsMatchId || k.stage === obsMatchId) ||
      tournamentState.matches[0] ||
      null;
    return (
      <ObsOverlayView
        match={targetMatch}
        players={tournamentState.players}
        tournamentTitle={tournamentState.title}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Live sync status banner */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/50">
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Firestore: Lưu vĩnh viễn</span>
          </div>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <Radio className="w-3 h-3" />
            <span>Cập nhật kết quả tức thì</span>
          </div>
          <span aria-hidden="true" className="hidden md:inline">·</span>
          <span className="hidden md:inline">Thắng 1, Hòa ½, Thua 0</span>
        </div>
        <div className="text-slate-500 tabular-nums">
          Đồng bộ Cloud: {new Date(tournamentState.lastUpdated).toLocaleTimeString('vi-VN')}
        </div>
      </div>

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        isViewerOnly={isViewerOnly}
        onSwitchToViewer={handleSwitchToViewer}
        onOpenAdminAuth={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        tournamentTitle={tournamentState.title}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
        upcomingCount={upcomingMatchesCount}
        onOpenExportPdf={() => setIsExportPdfOpen(true)}
      />

      {/* Real-time Match Alert Banner (Tự động cảnh báo & đếm ngược thời gian thực) */}
      <MatchAlertBanner
        matches={tournamentState.matches}
        knockoutMatches={tournamentState.knockoutMatches}
        players={tournamentState.players}
        onSelectTab={setActiveTab}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        alertThresholdMinutes={alertThresholdMinutes}
        filterPlayerId={reminderFilterPlayerId}
        onOpenReminderSettings={() => setIsReminderModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Đang đồng bộ dữ liệu giải đấu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'rules' && <RulesView />}

            {activeTab === 'regulations' && <OnlineRegulationsView />}

            {activeTab === 'schedule' && (
              <ScheduleView
                matches={tournamentState.matches}
                players={tournamentState.players}
                isAdmin={isAdmin && !isViewerOnly}
                onAddMatch={handleAddMatch}
                onUpdateMatchScore={handleUpdateMatchScore}
                onResetMatchScore={handleResetMatchScore}
                onDeleteMatch={handleDeleteMatch}
                onOpenQuickPairModal={() => setIsQuickPairModalOpen(true)}
                onOpenMatchNote={(m) => setNoteModalMatch(m)}
                onOpenExportPdf={() => setIsExportPdfOpen(true)}
              />
            )}

            {activeTab === 'standings' && (
              <StandingsView
                standingsA={standingsA}
                standingsB={standingsB}
                players={tournamentState.players}
                matches={tournamentState.matches}
                onOpenExportPdf={() => setIsExportPdfOpen(true)}
              />
            )}

            {activeTab === 'knockout' && (
              <KnockoutView
                knockouts={tournamentState.knockoutMatches}
                standingsA={standingsA}
                standingsB={standingsB}
                players={tournamentState.players}
                isAdmin={isAdmin && !isViewerOnly}
                onUpdateKnockoutScore={handleUpdateKnockoutScore}
                onResetKnockoutScore={handleResetKnockoutScore}
                onUpdateSemiGameScore={handleUpdateSemiGameScore}
                onResetSemiGameScore={handleResetSemiGameScore}
                onResetSemiMatch={handleResetSemiMatch}
                onSetSeriesColors={handleSetSeriesColors}
                onSwapGameColors={handleSwapGameColors}
                onSetGameColors={handleSetGameColors}
                onOpenMatchNote={(k) => setNoteModalMatch(k)}
              />
            )}

            {activeTab === 'results' && (
              <ResultsHistoryView
                matches={tournamentState.matches}
                knockoutMatches={tournamentState.knockoutMatches}
                players={tournamentState.players}
                notifications={tournamentState.notifications}
              />
            )}

            {activeTab === 'statistics' && (
              <StatisticsView
                players={tournamentState.players}
                matches={tournamentState.matches}
                knockoutMatches={tournamentState.knockoutMatches}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© 2026 {tournamentState.title}</span>
            <span aria-hidden="true">·</span>
            <span>Chuẩn tính điểm FIDE cờ vua / cờ tướng</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Note: Viewer mode explicitly has NO admin button in navigation, but for safety in case administrator is testing viewer mode, this discreet lock icon allows unlocking with PIN */}
            {isViewerOnly ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                title="Mở khóa quyền quản trị (Yêu cầu mã PIN)"
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Quản trị viên</span>
              </button>
            ) : null}
            <span>Hệ thống quản lý lịch thi đấu & kết quả giải đấu</span>
          </div>
        </div>
      </footer>

      {/* Admin PIN Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onVerifyPin={handleVerifyPin}
      />

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentTitle={tournamentState.title}
        currentPin={tournamentState.adminPin}
        onSaveSettings={handleSaveSettings}
        onResetTournament={handleResetTournament}
        tournamentState={tournamentState}
      />

      {/* Quick Pair Modal */}
      <QuickPairModal
        isOpen={isQuickPairModalOpen}
        onClose={() => setIsQuickPairModalOpen(false)}
        players={tournamentState.players}
        onAddBatchMatches={handleAddBatchMatches}
      />



      {/* Match Reminder & Countdown Modal */}
      <MatchReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        matches={tournamentState.matches}
        knockoutMatches={tournamentState.knockoutMatches}
        players={tournamentState.players}
        onSelectTab={setActiveTab}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        alertThresholdMinutes={alertThresholdMinutes}
        onChangeThreshold={handleChangeThreshold}
        filterPlayerId={reminderFilterPlayerId}
        onChangeFilterPlayer={setReminderFilterPlayerId}
      />

      {/* Export Tournament Schedule & Standings to PDF Modal */}
      <ExportPdfModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        tournamentTitle={tournamentState.title}
        matches={tournamentState.matches}
        knockoutMatches={tournamentState.knockoutMatches}
        players={tournamentState.players}
        standingsA={standingsA}
        standingsB={standingsB}
      />

      {/* Match Organizer Private Notes Modal */}
      <MatchNoteModal
        isOpen={!!noteModalMatch}
        onClose={() => setNoteModalMatch(null)}
        match={noteModalMatch}
        players={tournamentState.players}
        onSaveNotes={handleSaveMatchNotes}
      />
    </div>
  );
}
