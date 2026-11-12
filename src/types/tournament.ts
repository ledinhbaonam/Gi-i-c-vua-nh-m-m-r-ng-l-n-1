export type GroupId = 'A' | 'B';
export type SessionType = 'sang' | 'chieu' | 'toi';
export type LegType = 'di' | 've';
export type MatchStatus = 'scheduled' | 'finished';

export interface Player {
  id: string;
  name: string;
  group: GroupId;
}

export type StreamPlatform = 'youtube' | 'twitch' | 'facebook' | 'drive' | 'direct' | 'custom';

export interface Match {
  id: string;
  group: GroupId;
  round: number; // 1 to 6
  leg: LegType; // 'di' (Lượt đi) | 've' (Lượt về)
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  session: SessionType; // 'sang' | 'chieu'
  player1Id: string;
  player2Id: string;
  score1?: number; // 1 (win), 0.5 (draw), 0 (loss)
  score2?: number; // 0 (loss), 0.5 (draw), 1 (win)
  status: MatchStatus;
  tableNumber?: number;
  notes?: string;
  updatedAt?: string;
  // Phát trực tiếp & Video lưu trữ (OBS Studio & Replay)
  isLive?: boolean;
  liveUrl?: string;
  replayUrl?: string;
  streamPlatform?: StreamPlatform;
  videoTitle?: string;
  recordedAt?: string;
}

export type KnockoutStage = 'semi1' | 'semi2' | 'third_place' | 'final';

export interface KnockoutGame {
  gameNumber: number; // Ván 1 -> 7
  whitePlayerId: string; // ID kỳ thủ cầm trắng (Do Admin chọn hoặc xác nhận)
  blackPlayerId: string; // ID kỳ thủ cầm đen (Do Admin chọn hoặc xác nhận)
  scoreWhite?: number; // 1 | 0.5 | 0
  scoreBlack?: number; // 0 | 0.5 | 1
  status: MatchStatus;
  winnerId?: string; // ID người thắng ván này
  isArmageddon?: boolean; // Ván thứ 7 sinh tử
  armageddonRuleApplied?: boolean; // Hòa ván 7 -> Đen thắng
  notes?: string;
  colorsSelected?: boolean; // Admin đã chỉ định bên Trắng/Đen
}

export interface KnockoutMatch {
  id: string;
  stage: KnockoutStage;
  title: string;
  player1Id?: string;
  player2Id?: string;
  player1Label: string; // e.g. "Nhất Bảng A"
  player2Label: string; // e.g. "Nhì Bảng B"
  score1?: number; // Tổng điểm
  score2?: number;
  wins1?: number; // Số ván thắng
  wins2?: number;
  winnerId?: string;
  date?: string;
  time?: string;
  session?: SessionType;
  status: MatchStatus;
  updatedAt?: string;
  games?: KnockoutGame[]; // Danh sách các ván đấu (Bán kết: 3 ván chính + ván phụ đến ván 7 Armageddon)
  outcomeNote?: string; // Tóm tắt kết quả
  notes?: string; // Ghi chú riêng của ban tổ chức (lỗi kỹ thuật, biên bản bổ sung...)
  colorsChosen?: boolean; // Admin đã chỉ định bên Trắng/Đen
  // Phát trực tiếp & Video lưu trữ (OBS Studio & Replay)
  isLive?: boolean;
  liveUrl?: string;
  replayUrl?: string;
  streamPlatform?: StreamPlatform;
  videoTitle?: string;
  recordedAt?: string;
}

export interface Standing {
  playerId: string;
  playerName: string;
  group: GroupId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  sonnebornBerger: number;
  rank: number;
  isQualifiedSemi: boolean; // Top 2
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'result' | 'schedule' | 'knockout' | 'system';
  roundText: string;
  title: string;
  detail: string;
}

export interface TournamentState {
  title: string;
  subtitle: string;
  adminPin: string;
  players: Player[];
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  notifications: NotificationLog[];
  lastUpdated: string;
}
