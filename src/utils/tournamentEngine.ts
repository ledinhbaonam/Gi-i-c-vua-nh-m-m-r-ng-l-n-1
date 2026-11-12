import { GroupId, KnockoutMatch, KnockoutGame, Match, Player, Standing, TournamentState, LegType, SessionType } from '../types/tournament';

export const DEFAULT_PLAYERS: Player[] = [
  // Bảng A
  { id: 'p_a1', name: 'Duy Khang', group: 'A' },
  { id: 'p_a2', name: 'Hoàng Long', group: 'A' },
  { id: 'p_a3', name: 'Thái Hưng', group: 'A' },
  { id: 'p_a4', name: 'Thiên Bảo', group: 'A' },
  // Bảng B
  { id: 'p_b1', name: 'Bình Nam', group: 'B' },
  { id: 'p_b2', name: 'Bảo Nam', group: 'B' },
  { id: 'p_b3', name: 'Khôi Nguyên', group: 'B' },
  { id: 'p_b4', name: 'Chí Khang', group: 'B' },
];

export const INITIAL_KNOCKOUT_MATCHES: KnockoutMatch[] = [
  {
    id: 'ko_semi1',
    stage: 'semi1',
    title: 'Bán Kết 1',
    player1Label: 'Nhất Bảng A (A1)',
    player2Label: 'Nhì Bảng B (B2)',
    status: 'scheduled',
  },
  {
    id: 'ko_semi2',
    stage: 'semi2',
    title: 'Bán Kết 2',
    player1Label: 'Nhất Bảng B (B1)',
    player2Label: 'Nhì Bảng A (A2)',
    status: 'scheduled',
  },
  {
    id: 'ko_third_place',
    stage: 'third_place',
    title: 'Tranh Hạng Ba',
    player1Label: 'Thua Bán Kết 1',
    player2Label: 'Thua Bán Kết 2',
    status: 'scheduled',
  },
  {
    id: 'ko_final',
    stage: 'final',
    title: 'Trận Chung Kết',
    player1Label: 'Thắng Bán Kết 1',
    player2Label: 'Thắng Bán Kết 2',
    status: 'scheduled',
  },
];

export const INITIAL_TOURNAMENT_STATE: TournamentState = {
  title: 'GIẢI ĐẤU CỜ VÔ ĐỊCH MÙA GIẢI 2026',
  subtitle: 'Vòng Bảng & Vòng Loại Trực Tiếp (Bán Kết - Chung Kết)',
  adminPin: '24072013',
  players: DEFAULT_PLAYERS,
  matches: [], // Only added when admin inputs
  knockoutMatches: INITIAL_KNOCKOUT_MATCHES,
  notifications: [
    {
      id: 'notif_welcome',
      timestamp: new Date().toISOString(),
      type: 'system',
      roundText: 'Hệ thống',
      title: 'Khởi tạo giải đấu thành công',
      detail: 'Bảng A (4 kỳ thủ) và Bảng B (4 kỳ thủ) đã sẵn sàng. Ban tổ chức sẽ cập nhật lịch thi đấu và kết quả trực tiếp.',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

/**
 * Hiển thị tỉ số chuẩn cờ:
 * 1 - 0, 1/2 - 1/2, 0 - 1
 */
export function formatChessScore(score1?: number, score2?: number): string {
  if (score1 === undefined || score2 === undefined) return 'Chưa đấu';
  if (score1 === 0.5 && score2 === 0.5) return '1/2 - 1/2';
  return `${score1} - ${score2}`;
}

export function formatScoreBadge(score?: number): string {
  if (score === undefined) return '-';
  if (score === 0.5) return '½';
  return score.toString();
}

/**
 * Tự động xác định buổi theo giờ thi đấu:
 * - Chiều: từ 13h00 đến 17h00 (13:00 - 17:00)
 * - Tối: từ 17h01 đến 23h00 (17:01 - 23:00)
 * - Sáng: trước 13h00 (ví dụ 06h00 - 12h59)
 */
export function detectSessionFromTime(timeStr?: string): SessionType {
  if (!timeStr) return 'sang';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) return 'sang';

  const totalMinutes = h * 60 + m;
  if (totalMinutes >= 13 * 60 && totalMinutes <= 17 * 60) {
    return 'chieu';
  }
  if (totalMinutes > 17 * 60) {
    return 'toi';
  }
  return 'sang';
}

/**
 * Hiển thị tên buổi thi đấu chính xác:
 * Tự động chuẩn hóa dựa trên buổi được lưu hoặc giờ thi đấu thực tế
 */
export function formatSessionName(session?: SessionType, time?: string): string {
  if (time) {
    const computed = detectSessionFromTime(time);
    if (session === 'sang' && computed !== 'sang') {
      return computed === 'toi' ? 'Tối' : 'Chiều';
    }
    if (session === 'chieu' && computed === 'toi') {
      return 'Tối';
    }
    if (session === 'toi' && computed !== 'toi') {
      return computed === 'chieu' ? 'Chiều' : 'Sáng';
    }
  }

  if (session === 'toi') return 'Tối';
  if (session === 'chieu') return 'Chiều';
  return 'Sáng';
}

export interface MatchLiveStatus {
  status: 'upcoming' | 'imminent' | 'ongoing' | 'finished';
  label: string;
  badgeClass: string;
  dotClass: string;
  remainingMinutes?: number;
}

/**
 * Trả về đối tượng Date thời điểm bắt đầu trận đấu
 */
export function getMatchStartDateTime(date?: string, time?: string): Date | null {
  if (!date || !time) return null;
  try {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    if (!y || !m || !d || isNaN(hh)) return null;
    return new Date(y, m - 1, d, hh, mm || 0, 0);
  } catch {
    return null;
  }
}

/**
 * Xác định trạng thái thời gian của trận đấu:
 * 1. Nếu đã ấn định tỉ số -> "Đã kết thúc"
 * 2. Nếu đang trong giờ thi đấu -> "Đang diễn ra"
 * 3. Nếu sắp đến giờ (trong vòng 30 phút) -> "Sắp diễn ra (Còn X phút)"
 * 4. Nếu chưa tới giờ thi đấu (> 30 phút) -> "Chưa diễn ra"
 */
export function getMatchLiveStatus(
  date?: string,
  time?: string,
  isFinished?: boolean,
  score1?: number,
  score2?: number
): MatchLiveStatus {
  // 1. Đã ấn định tỉ số -> Đã kết thúc
  if (isFinished || (score1 !== undefined && score2 !== undefined)) {
    return {
      status: 'finished',
      label: 'Đã kết thúc',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      dotClass: 'bg-emerald-400',
    };
  }

  // 2. Thiếu ngày giờ -> Chưa diễn ra
  if (!date || !time) {
    return {
      status: 'upcoming',
      label: 'Chưa diễn ra',
      badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-800',
      dotClass: 'bg-slate-500',
    };
  }

  try {
    const matchStart = getMatchStartDateTime(date, time);
    if (!matchStart) {
      return {
        status: 'upcoming',
        label: 'Chưa diễn ra',
        badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-800',
        dotClass: 'bg-slate-500',
      };
    }

    const now = new Date();
    const diffMs = matchStart.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    // Nếu chưa tới giờ thi đấu
    if (diffMs > 0) {
      // Trong vòng 30 phút trước trận: Sắp diễn ra
      if (diffMinutes <= 30) {
        const timeLabel = diffMinutes <= 0 ? '< 1 phút' : `${diffMinutes} phút`;
        return {
          status: 'imminent',
          label: `Sắp diễn ra (${timeLabel})`,
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/80 shadow-sm shadow-amber-950/50',
          dotClass: 'bg-amber-400 animate-ping',
          remainingMinutes: diffMinutes,
        };
      }

      return {
        status: 'upcoming',
        label: 'Chưa diễn ra',
        badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-800',
        dotClass: 'bg-slate-500',
      };
    }

    // Đang trong giờ thi đấu (hoặc đã đến giờ mà chưa ấn định tỉ số)
    return {
      status: 'ongoing',
      label: 'Đang diễn ra',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-sm shadow-rose-950/50',
      dotClass: 'bg-rose-500 animate-pulse',
    };
  } catch (err) {
    return {
      status: 'upcoming',
      label: 'Chưa diễn ra',
      badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-800',
      dotClass: 'bg-slate-500',
    };
  }
}

/**
 * Tính toán Bảng xếp hạng cho một bảng đấu:
 * Thắng: 1 điểm, Hòa: 0.5 điểm, Thua: 0 điểm.
 * Sắp xếp theo:
 * 1. Tổng điểm giảm dần
 * 2. Đối đầu trực tiếp
 * 3. Số ván thắng
 * 4. Hệ số Sonneborn-Berger
 */
export function calculateStandings(
  players: Player[],
  matches: Match[],
  group: GroupId
): Standing[] {
  const groupPlayers = players.filter((p) => p.group === group);
  const finishedGroupMatches = matches.filter(
    (m) => m.group === group && m.status === 'finished' && m.score1 !== undefined && m.score2 !== undefined
  );

  // Khởi tạo bảng thống kê cho từng kỳ thủ
  const statsMap = new Map<string, {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    opponentsPoints: { opponentId: string; result: 'win' | 'draw' | 'loss' }[];
  }>();

  for (const player of groupPlayers) {
    statsMap.set(player.id, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      opponentsPoints: [],
    });
  }

  // Đối đầu trực tiếp giữa 2 kỳ thủ: headToHead[p1][p2] = points earned by p1 against p2
  const headToHead: Record<string, Record<string, number>> = {};
  for (const p of groupPlayers) {
    headToHead[p.id] = {};
    for (const opp of groupPlayers) {
      headToHead[p.id][opp.id] = 0;
    }
  }

  for (const match of finishedGroupMatches) {
    const s1 = statsMap.get(match.player1Id);
    const s2 = statsMap.get(match.player2Id);
    const score1 = match.score1 ?? 0;
    const score2 = match.score2 ?? 0;

    if (s1 && s2) {
      s1.played += 1;
      s2.played += 1;

      if (score1 === 1) {
        s1.won += 1;
        s1.points += 1;
        s2.lost += 1;
        s1.opponentsPoints.push({ opponentId: match.player2Id, result: 'win' });
        s2.opponentsPoints.push({ opponentId: match.player1Id, result: 'loss' });
      } else if (score1 === 0.5 && score2 === 0.5) {
        s1.drawn += 1;
        s1.points += 0.5;
        s2.drawn += 1;
        s2.points += 0.5;
        s1.opponentsPoints.push({ opponentId: match.player2Id, result: 'draw' });
        s2.opponentsPoints.push({ opponentId: match.player1Id, result: 'draw' });
      } else if (score2 === 1) {
        s2.won += 1;
        s2.points += 1;
        s1.lost += 1;
        s1.opponentsPoints.push({ opponentId: match.player2Id, result: 'loss' });
        s2.opponentsPoints.push({ opponentId: match.player1Id, result: 'win' });
      }

      headToHead[match.player1Id][match.player2Id] = (headToHead[match.player1Id][match.player2Id] || 0) + score1;
      headToHead[match.player2Id][match.player1Id] = (headToHead[match.player2Id][match.player1Id] || 0) + score2;
    }
  }

  // Tính hệ số Sonneborn-Berger:
  // SB = Tổng điểm của các đối thủ mà kỳ thủ thắng + 0.5 * Tổng điểm của các đối thủ mà kỳ thủ hòa
  const result: Standing[] = groupPlayers.map((player) => {
    const s = statsMap.get(player.id)!;
    let sonnebornBerger = 0;
    for (const opp of s.opponentsPoints) {
      const oppStats = statsMap.get(opp.opponentId);
      const oppTotalPoints = oppStats ? oppStats.points : 0;
      if (opp.result === 'win') {
        sonnebornBerger += oppTotalPoints;
      } else if (opp.result === 'draw') {
        sonnebornBerger += 0.5 * oppTotalPoints;
      }
    }

    return {
      playerId: player.id,
      playerName: player.name,
      group,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      points: s.points,
      sonnebornBerger,
      rank: 1,
      isQualifiedSemi: false,
    };
  });

  // Sắp xếp
  result.sort((a, b) => {
    // 1. Điểm số
    if (b.points !== a.points) return b.points - a.points;

    // 2. Đối đầu trực tiếp (nếu có)
    const h2hA = headToHead[a.playerId]?.[b.playerId] ?? 0;
    const h2hB = headToHead[b.playerId]?.[a.playerId] ?? 0;
    if (h2hA !== h2hB) return h2hB - h2hA;

    // 3. Số ván thắng
    if (b.won !== a.won) return b.won - a.won;

    // 4. Hệ số Sonneborn-Berger
    if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;

    // 5. Tên chữ cái
    return a.playerName.localeCompare(b.playerName, 'vi');
  });

  // Gán thứ hạng & Top 2 vào bán kết
  result.forEach((standing, index) => {
    standing.rank = index + 1;
    standing.isQualifiedSemi = index < 2;
  });

  return result;
}

/**
 * Tự động sắp xếp lịch thi đấu theo thứ tự thời gian tăng dần:
 * 1. Ngày thi đấu (YYYY-MM-DD)
 * 2. Giờ thi đấu (HH:mm)
 * 3. Bảng A trước Bảng B
 * 4. Lượt đấu
 * 5. Bàn đấu
 */
function normalizeTimeForSort(t?: string): string {
  if (!t) return '99:99';
  const parts = t.trim().split(':');
  if (parts.length < 2) return t.padStart(5, '0');
  const hh = parts[0].padStart(2, '0');
  const mm = parts[1].padStart(2, '0');
  return `${hh}:${mm}`;
}

export function sortMatchesChronologically(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    // 1. So sánh ngày thi đấu (YYYY-MM-DD)
    const dateA = a.date || '9999-12-31';
    const dateB = b.date || '9999-12-31';
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    // 2. So sánh giờ thi đấu (HH:mm)
    const timeA = normalizeTimeForSort(a.time);
    const timeB = normalizeTimeForSort(b.time);
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    // 3. Nếu cùng ngày giờ: Bảng A trước Bảng B
    if (a.group !== b.group) return a.group.localeCompare(b.group);

    // 4. Theo lượt đấu
    if (a.round !== b.round) return a.round - b.round;

    // 5. Theo số bàn đấu
    return (a.tableNumber || 1) - (b.tableNumber || 1);
  });
}

/**
 * Khởi tạo 2 ván ban đầu cho trận Bán kết.
 * Bán kết ban đầu gồm 2 ván chính (đi & về). Nếu hòa mới đấu tiếp các ván phụ đến ván 7.
 * Admin là người quyết định ai cầm Trắng ai cầm Đen (không tự động ép buộc).
 */
export function createDefaultSemiGames(
  p1Id: string,
  p2Id: string,
  initialWhiteId?: string
): KnockoutGame[] {
  const isCustom = !!initialWhiteId;
  const white1 = initialWhiteId || p1Id;
  const black1 = white1 === p1Id ? p2Id : p1Id;

  return [
    {
      gameNumber: 1,
      whitePlayerId: white1,
      blackPlayerId: black1,
      status: 'scheduled',
      notes: 'Lượt 1 (Chính thức)',
      colorsSelected: isCustom,
    },
    {
      gameNumber: 2,
      whitePlayerId: black1,
      blackPlayerId: white1,
      status: 'scheduled',
      notes: 'Lượt 2 (Chính thức)',
      colorsSelected: isCustom,
    },
  ];
}

/**
 * Admin đổi bên Trắng ⇄ Đen cho một ván cụ thể trong Bán kết
 */
export function swapSemiGameColors(match: KnockoutMatch, gameNumber: number): KnockoutMatch {
  if (!match.games) return match;
  const games = match.games.map((g) => {
    if (g.gameNumber === gameNumber) {
      return {
        ...g,
        whitePlayerId: g.blackPlayerId,
        blackPlayerId: g.whitePlayerId,
        colorsSelected: true,
      };
    }
    return g;
  });
  return {
    ...match,
    games,
    colorsChosen: true,
  };
}

/**
 * Admin chỉ định kỳ thủ cầm Trắng cho loạt trận Bán kết (bắt đầu từ Ván 1)
 */
export function setSeriesInitialColors(match: KnockoutMatch, whitePlayerId: string): KnockoutMatch {
  if (!match.player1Id || !match.player2Id) return match;
  const p1Id = match.player1Id;
  const p2Id = match.player2Id;
  const otherId = whitePlayerId === p1Id ? p2Id : p1Id;

  const currentGames = match.games && match.games.length > 0
    ? match.games
    : createDefaultSemiGames(p1Id, p2Id, whitePlayerId);

  const updatedGames = currentGames.map((g) => {
    // Không đổi các ván đã hoàn thành
    if (g.status === 'finished') return g;
    const isOdd = g.gameNumber % 2 === 1;
    return {
      ...g,
      whitePlayerId: isOdd ? whitePlayerId : otherId,
      blackPlayerId: isOdd ? otherId : whitePlayerId,
      colorsSelected: true,
    };
  });

  return {
    ...match,
    games: updatedGames,
    colorsChosen: true,
  };
}

/**
 * Admin chỉ định cụ thể ai Trắng ai Đen cho một ván
 */
export function setSpecificGameColors(
  match: KnockoutMatch,
  gameNumber: number,
  whitePlayerId: string,
  blackPlayerId: string
): KnockoutMatch {
  if (!match.games) return match;
  const games = match.games.map((g) => {
    if (g.gameNumber === gameNumber) {
      return {
        ...g,
        whitePlayerId,
        blackPlayerId,
        colorsSelected: true,
      };
    }
    return g;
  });
  return {
    ...match,
    games,
    colorsChosen: true,
  };
}

/**
 * Đánh giá kết quả loạt trận Bán kết theo luật:
 * 1. Mỗi trận 3 lượt, ai thắng 2 lượt trước thì thắng chung cuộc.
 * 2. Trường hợp 2 người bằng điểm thì đấu tiếp từng ván phụ đến khi có người thắng.
 * 3. Đến ván thứ 7 (Armageddon): ai cầm TRẮNG mà hòa thì THUA, ai cầm ĐEN mà hòa sẽ THẮNG!
 */
export function evaluateSemiFinalMatch(match: KnockoutMatch): KnockoutMatch {
  if (!match.player1Id || !match.player2Id) return match;
  const p1Id = match.player1Id;
  const p2Id = match.player2Id;

  let games = match.games ? [...match.games] : [];
  if (games.length === 0) {
    games = createDefaultSemiGames(p1Id, p2Id);
  }

  // Tự động thu gọn về 2 ván chính nếu loạt trận chưa bắt đầu và đang có > 2 ván
  const anyFinished = games.some((g) => g.status === 'finished');
  if (!anyFinished && games.length > 2) {
    games = games.slice(0, 2);
  }

  // Chuẩn hóa kỳ thủ trong từng ván
  games = games.map((g) => {
    let wId = g.whitePlayerId;
    let bId = g.blackPlayerId;
    if (wId !== p1Id && wId !== p2Id) {
      wId = g.gameNumber % 2 === 1 ? p1Id : p2Id;
      bId = g.gameNumber % 2 === 1 ? p2Id : p1Id;
    }
    return {
      ...g,
      whitePlayerId: wId,
      blackPlayerId: bId,
    };
  });

  let p1Wins = 0;
  let p2Wins = 0;
  let p1Points = 0;
  let p2Points = 0;
  let finishedCount = 0;

  for (const game of games) {
    if (game.status === 'finished' && game.scoreWhite !== undefined && game.scoreBlack !== undefined) {
      finishedCount++;
      const isP1White = game.whitePlayerId === p1Id;
      const scoreP1 = isP1White ? game.scoreWhite : game.scoreBlack;
      const scoreP2 = isP1White ? game.scoreBlack : game.scoreWhite;

      p1Points += scoreP1;
      p2Points += scoreP2;

      if (scoreP1 > scoreP2) {
        p1Wins++;
        game.winnerId = p1Id;
      } else if (scoreP2 > scoreP1) {
        p2Wins++;
        game.winnerId = p2Id;
      } else {
        // Hòa (0.5 - 0.5)
        if (game.gameNumber === 7 || game.isArmageddon) {
          // Luật Armageddon ván 7: Cầm Trắng hòa sẽ Thua, Cầm Đen hòa sẽ Thắng!
          const blackWinnerId = game.blackPlayerId;
          game.winnerId = blackWinnerId;
          game.armageddonRuleApplied = true;
          if (blackWinnerId === p1Id) {
            p1Wins++;
          } else {
            p2Wins++;
          }
        } else {
          game.winnerId = undefined;
          game.armageddonRuleApplied = false;
        }
      }
    }
  }

  let winnerId: string | undefined = undefined;
  let isFinished = false;
  let outcomeNote = '';

  // Bán kết 2 trận chính thức:
  // - Nếu tỉ số nghiêng về 1 bên (2-0, 1.5-0.5): kết thúc ngay!
  // - Nếu hòa (1-1): mới đấu tiếp các ván phụ đến ván 7 Armageddon.
  if (finishedCount === 1) {
    outcomeNote = `Đã đấu 1/2 ván chính (Tỉ số: ${p1Points} - ${p2Points})`;
  } else if (finishedCount === 2) {
    const stagePrize =
      match.stage === 'final'
        ? 'Đoạt Cúp Vô Địch Toàn Giải'
        : match.stage === 'third_place'
        ? 'Đoạt Huy Chương Đồng (Hạng Ba)'
        : 'Giành vé vào Chung Kết';

    if (p1Points > p2Points) {
      // 2 - 0 hoặc 1.5 - 0.5
      winnerId = p1Id;
      isFinished = true;
      outcomeNote = `Thắng sau 2 ván chính (${p1Points} - ${p2Points}) - ${stagePrize}`;
      games = games.filter((g) => g.gameNumber <= 2);
    } else if (p2Points > p1Points) {
      // 0 - 2 hoặc 0.5 - 1.5
      winnerId = p2Id;
      isFinished = true;
      outcomeNote = `Thắng sau 2 ván chính (${p2Points} - ${p1Points}) - ${stagePrize}`;
      games = games.filter((g) => g.gameNumber <= 2);
    } else {
      // Hòa 1 - 1 sau 2 ván chính -> Mở Ván 3 (Tie-break 1)
      if (!games.some((g) => g.gameNumber === 3)) {
        const g2 = games.find((g) => g.gameNumber === 2);
        const w3 = g2 ? g2.blackPlayerId : p1Id;
        const b3 = g2 ? g2.whitePlayerId : p2Id;
        games.push({
          gameNumber: 3,
          whitePlayerId: w3,
          blackPlayerId: b3,
          status: 'scheduled',
          colorsSelected: false,
          notes: 'Ván 3 (Ván phụ Tie-break 1: Đấu tiếp do hòa 1 - 1)',
        });
      }
      outcomeNote = `Hòa 1 - 1 sau 2 ván chính (${p1Points} - ${p2Points}) - Đang đấu ván phụ Tie-break`;
    }
  } else if (finishedCount === 3) {
    const stagePrize =
      match.stage === 'final'
        ? 'Đoạt Cúp Vô Địch Toàn Giải'
        : match.stage === 'third_place'
        ? 'Đoạt Huy Chương Đồng (Hạng Ba)'
        : 'Giành vé vào Chung Kết';

    const g3 = games.find((g) => g.gameNumber === 3);
    if (g3 && g3.status === 'finished') {
      if (g3.scoreWhite !== g3.scoreBlack) {
        winnerId = g3.winnerId;
        isFinished = true;
        outcomeNote = `Thắng ở Ván phụ thứ 3 (Tie-break 1) - ${stagePrize}`;
      } else {
        // Ván 3 hòa -> mở Ván 4
        if (!games.some((g) => g.gameNumber === 4)) {
          const w4 = g3.blackPlayerId;
          const b4 = g3.whitePlayerId;
          games.push({
            gameNumber: 4,
            whitePlayerId: w4,
            blackPlayerId: b4,
            status: 'scheduled',
            colorsSelected: false,
            notes: 'Ván 4 (Ván phụ Tie-break 2: Đấu tiếp do vẫn hòa)',
          });
        }
        outcomeNote = `Vẫn hòa sau Ván 3 - Đang đấu tiếp Ván 4 (Tie-break 2)`;
      }
    }
  } else if (finishedCount === 4) {
    const stagePrize =
      match.stage === 'final'
        ? 'Đoạt Cúp Vô Địch Toàn Giải'
        : match.stage === 'third_place'
        ? 'Đoạt Huy Chương Đồng (Hạng Ba)'
        : 'Giành vé vào Chung Kết';

    const g4 = games.find((g) => g.gameNumber === 4);
    if (g4 && g4.status === 'finished') {
      if (g4.scoreWhite !== g4.scoreBlack) {
        winnerId = g4.winnerId;
        isFinished = true;
        outcomeNote = `Thắng ở Ván phụ thứ 4 (Tie-break 2) - ${stagePrize}`;
      } else {
        // Ván 4 hòa -> mở Ván 5
        if (!games.some((g) => g.gameNumber === 5)) {
          const w5 = g4.blackPlayerId;
          const b5 = g4.whitePlayerId;
          games.push({
            gameNumber: 5,
            whitePlayerId: w5,
            blackPlayerId: b5,
            status: 'scheduled',
            colorsSelected: false,
            notes: 'Ván 5 (Ván phụ Tie-break 3: Đấu tiếp do vẫn hòa)',
          });
        }
        outcomeNote = `Vẫn hòa sau Ván 4 - Đang đấu tiếp Ván 5 (Tie-break 3)`;
      }
    }
  } else if (finishedCount === 5) {
    const stagePrize =
      match.stage === 'final'
        ? 'Đoạt Cúp Vô Địch Toàn Giải'
        : match.stage === 'third_place'
        ? 'Đoạt Huy Chương Đồng (Hạng Ba)'
        : 'Giành vé vào Chung Kết';

    const g5 = games.find((g) => g.gameNumber === 5);
    if (g5 && g5.status === 'finished') {
      if (g5.scoreWhite !== g5.scoreBlack) {
        winnerId = g5.winnerId;
        isFinished = true;
        outcomeNote = `Thắng ở Ván phụ thứ 5 (Tie-break 3) - ${stagePrize}`;
      } else {
        // Ván 5 hòa -> mở Ván 6
        if (!games.some((g) => g.gameNumber === 6)) {
          const w6 = g5.blackPlayerId;
          const b6 = g5.whitePlayerId;
          games.push({
            gameNumber: 6,
            whitePlayerId: w6,
            blackPlayerId: b6,
            status: 'scheduled',
            colorsSelected: false,
            notes: 'Ván 6 (Ván phụ Tie-break 4: Đấu tiếp do vẫn hòa)',
          });
        }
        outcomeNote = `Vẫn hòa sau Ván 5 - Đang đấu tiếp Ván 6 (Tie-break 4)`;
      }
    }
  } else if (finishedCount === 6) {
    const stagePrize =
      match.stage === 'final'
        ? 'Đoạt Cúp Vô Địch Toàn Giải'
        : match.stage === 'third_place'
        ? 'Đoạt Huy Chương Đồng (Hạng Ba)'
        : 'Giành vé vào Chung Kết';

    const g6 = games.find((g) => g.gameNumber === 6);
    if (g6 && g6.status === 'finished') {
      if (g6.scoreWhite !== g6.scoreBlack) {
        winnerId = g6.winnerId;
        isFinished = true;
        outcomeNote = `Thắng ở Ván phụ thứ 6 (Tie-break 4) - ${stagePrize}`;
      } else {
        // Ván 6 hòa -> tiến vào Ván 7 Armageddon!
        if (!games.some((g) => g.gameNumber === 7)) {
          const w7 = g6.blackPlayerId;
          const b7 = g6.whitePlayerId;
          games.push({
            gameNumber: 7,
            whitePlayerId: w7,
            blackPlayerId: b7,
            status: 'scheduled',
            colorsSelected: false,
            isArmageddon: true,
            notes: 'Ván 7 Armageddon: Trắng buộc phải thắng. Nếu hòa thì Đen thắng chung cuộc!',
          });
        }
        outcomeNote = `Bằng điểm sau 6 ván - Tiến vào Ván 7 Armageddon (Sinh tử)`;
      }
    }
  } else if (finishedCount >= 7) {
    const stagePrize =
      match.stage === 'final'
        ? 'Đoạt Cúp Vô Địch Toàn Giải'
        : match.stage === 'third_place'
        ? 'Đoạt Huy Chương Đồng (Hạng Ba)'
        : 'Giành vé vào Chung Kết';

    const g7 = games.find((g) => g.gameNumber === 7);
    if (g7 && g7.status === 'finished') {
      winnerId = g7.winnerId;
      isFinished = true;
      outcomeNote = g7.armageddonRuleApplied
        ? `Thắng ván 7 Armageddon (Theo luật: Cầm Đen hòa sẽ thắng) - ${stagePrize}`
        : `Thắng ván 7 Armageddon - ${stagePrize}`;
    }
  }

  return {
    ...match,
    games,
    score1: p1Points,
    score2: p2Points,
    wins1: p1Wins,
    wins2: p2Wins,
    winnerId,
    status: isFinished ? 'finished' : 'scheduled',
    outcomeNote,
  };
}

/**
 * Cập nhật cặp đấu Bán kết và Chung kết dựa trên kết quả vòng bảng
 */
export function syncKnockoutBrackets(
  currentKnockouts: KnockoutMatch[],
  standingsA: Standing[],
  standingsB: Standing[],
  players: Player[]
): KnockoutMatch[] {
  let updated = currentKnockouts.map((k) => ({ ...k }));

  let semi1 = updated.find((k) => k.stage === 'semi1');
  let semi2 = updated.find((k) => k.stage === 'semi2');
  let thirdPlace = updated.find((k) => k.stage === 'third_place');
  let finalMatch = updated.find((k) => k.stage === 'final');

  // Nhất Bảng A (A1) vs Nhì Bảng B (B2)
  if (semi1 && standingsA[0] && standingsB[1]) {
    const newP1 = standingsA[0].playerId;
    const newP2 = standingsB[1].playerId;
    const playersChanged = semi1.player1Id !== newP1 || semi1.player2Id !== newP2;
    semi1.player1Id = newP1;
    semi1.player2Id = newP2;

    if (playersChanged || !semi1.games || semi1.games.length === 0) {
      semi1.games = createDefaultSemiGames(newP1, newP2);
    }
    // Đánh giá trạng thái Bán kết 1
    semi1 = evaluateSemiFinalMatch(semi1);
    updated = updated.map((m) => (m.stage === 'semi1' ? semi1! : m));
  }

  // Nhất Bảng B (B1) vs Nhì Bảng A (A2)
  if (semi2 && standingsB[0] && standingsA[1]) {
    const newP1 = standingsB[0].playerId;
    const newP2 = standingsA[1].playerId;
    const playersChanged = semi2.player1Id !== newP1 || semi2.player2Id !== newP2;
    semi2.player1Id = newP1;
    semi2.player2Id = newP2;

    if (playersChanged || !semi2.games || semi2.games.length === 0) {
      semi2.games = createDefaultSemiGames(newP1, newP2);
    }
    // Đánh giá trạng thái Bán kết 2
    semi2 = evaluateSemiFinalMatch(semi2);
    updated = updated.map((m) => (m.stage === 'semi2' ? semi2! : m));
  }

  // Xác định người thắng & người thua bán kết
  const getSemiOutcome = (match?: KnockoutMatch) => {
    if (!match || match.status !== 'finished' || !match.winnerId) {
      return { winnerId: undefined, loserId: undefined };
    }
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    return { winnerId: match.winnerId, loserId };
  };

  const outcome1 = getSemiOutcome(semi1);
  const outcome2 = getSemiOutcome(semi2);

  // Trận Tranh Hạng Ba (áp dụng thể thức 2 ván, hòa đấu tie-break đến ván 7 Armageddon)
  if (thirdPlace) {
    const prevP1 = thirdPlace.player1Id;
    const prevP2 = thirdPlace.player2Id;
    thirdPlace.player1Id = outcome1.loserId;
    thirdPlace.player2Id = outcome2.loserId;

    if (thirdPlace.player1Id && thirdPlace.player2Id) {
      const changed = prevP1 !== thirdPlace.player1Id || prevP2 !== thirdPlace.player2Id;
      if (changed || !thirdPlace.games || thirdPlace.games.length === 0) {
        thirdPlace.games = createDefaultSemiGames(thirdPlace.player1Id, thirdPlace.player2Id);
      }
      thirdPlace = evaluateSemiFinalMatch(thirdPlace);
    }
    updated = updated.map((m) => (m.stage === 'third_place' ? thirdPlace! : m));
  }

  // Trận Chung Kết (áp dụng thể thức 2 ván, hòa đấu tie-break đến ván 7 Armageddon)
  if (finalMatch) {
    const prevP1 = finalMatch.player1Id;
    const prevP2 = finalMatch.player2Id;
    finalMatch.player1Id = outcome1.winnerId;
    finalMatch.player2Id = outcome2.winnerId;

    if (finalMatch.player1Id && finalMatch.player2Id) {
      const changed = prevP1 !== finalMatch.player1Id || prevP2 !== finalMatch.player2Id;
      if (changed || !finalMatch.games || finalMatch.games.length === 0) {
        finalMatch.games = createDefaultSemiGames(finalMatch.player1Id, finalMatch.player2Id);
      }
      finalMatch = evaluateSemiFinalMatch(finalMatch);
    }
    updated = updated.map((m) => (m.stage === 'final' ? finalMatch! : m));
  }

  return updated;
}

/**
 * Tạo lịch thi đấu vòng tròn 6 lượt (Round-robin 2 lượt đi/về) chuẩn cho 4 người trong một bảng
 * 4 người: 1, 2, 3, 4
 * Lượt 1 (Đi): 1 vs 4, 2 vs 3
 * Lượt 2 (Đi): 4 vs 3, 1 vs 2
 * Lượt 3 (Đi): 2 vs 4, 3 vs 1
 * Lượt 4 (Về): 4 vs 1, 3 vs 2
 * Lượt 5 (Về): 3 vs 4, 2 vs 1
 * Lượt 6 (Về): 4 vs 2, 1 vs 3
 */
export function generateStandardRoundRobin(
  group: GroupId,
  players: Player[],
  startDate: string,
  startHour: number = 8
): Match[] {
  const groupPlayers = players.filter((p) => p.group === group);
  if (groupPlayers.length < 4) return [];

  const [p1, p2, p3, p4] = groupPlayers;
  const pairings: { round: number; leg: LegType; p1: Player; p2: Player; session: SessionType; time: string }[] = [
    // Lượt 1 (Đi) - Sáng
    { round: 1, leg: 'di', p1: p1, p2: p4, session: 'sang', time: '08:00' },
    { round: 1, leg: 'di', p1: p2, p2: p3, session: 'sang', time: '09:30' },
    // Lượt 2 (Đi) - Chiều
    { round: 2, leg: 'di', p1: p4, p2: p3, session: 'chieu', time: '14:00' },
    { round: 2, leg: 'di', p1: p1, p2: p2, session: 'chieu', time: '15:30' },
    // Lượt 3 (Đi) - Sáng hôm sau
    { round: 3, leg: 'di', p1: p2, p2: p4, session: 'sang', time: '08:00' },
    { round: 3, leg: 'di', p1: p3, p2: p1, session: 'sang', time: '09:30' },
    // Lượt 4 (Về) - Chiều
    { round: 4, leg: 've', p1: p4, p2: p1, session: 'chieu', time: '14:00' },
    { round: 4, leg: 've', p1: p3, p2: p2, session: 'chieu', time: '15:30' },
    // Lượt 5 (Về) - Sáng ngày 3
    { round: 5, leg: 've', p1: p3, p2: p4, session: 'sang', time: '08:00' },
    { round: 5, leg: 've', p1: p2, p2: p1, session: 'sang', time: '09:30' },
    // Lượt 6 (Về) - Chiều ngày 3
    { round: 6, leg: 've', p1: p4, p2: p2, session: 'chieu', time: '14:00' },
    { round: 6, leg: 've', p1: p1, p2: p3, session: 'chieu', time: '15:30' },
  ];

  return pairings.map((pair, idx) => ({
    id: `m_${group.toLowerCase()}_r${pair.round}_${idx + 1}_${Date.now() + idx}`,
    group,
    round: pair.round,
    leg: pair.leg,
    date: startDate,
    time: pair.time,
    session: pair.session,
    player1Id: pair.p1.id,
    player2Id: pair.p2.id,
    status: 'scheduled',
    tableNumber: (idx % 2) + 1,
  }));
}
