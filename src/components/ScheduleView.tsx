import React, { useState, useMemo } from 'react';
import { Match, Player, GroupId, SessionType, LegType } from '../types/tournament';
import { formatChessScore, formatSessionName, detectSessionFromTime, sortMatchesChronologically, getMatchLiveStatus } from '../utils/tournamentEngine';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, RotateCcw, Sparkles, Filter, Swords, Radio, FileText, Search, X, User, Layers, ListOrdered } from 'lucide-react';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

interface ScheduleViewProps {
  matches: Match[];
  players: Player[];
  isAdmin: boolean;
  onAddMatch: (match: Omit<Match, 'id' | 'status'>) => void;
  onUpdateMatchScore: (matchId: string, score1: number, score2: number) => void;
  onResetMatchScore: (matchId: string) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenQuickPairModal: () => void;
  onOpenExportPdf?: () => void;
  onOpenMatchNote?: (match: Match) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  matches,
  players,
  isAdmin,
  onAddMatch,
  onUpdateMatchScore,
  onResetMatchScore,
  onDeleteMatch,
  onOpenQuickPairModal,
  onOpenExportPdf,
  onOpenMatchNote,
}) => {
  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('08:30');
  const [session, setSession] = useState<SessionType>('sang');
  const [group, setGroup] = useState<GroupId>('A');
  const [round, setRound] = useState<number>(1);
  const [leg, setLeg] = useState<LegType>('di');
  const [notes, setNotes] = useState<string>('');

  // Filter available players for selected group
  const groupPlayers = players.filter((p) => p.group === group);
  const [player1Id, setPlayer1Id] = useState<string>(groupPlayers[0]?.id || '');
  const [player2Id, setPlayer2Id] = useState<string>(groupPlayers[1]?.id || '');
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state for match list
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<'all' | GroupId>('all');
  const [filterRound, setFilterRound] = useState<string>('all');
  const [filterSession, setFilterSession] = useState<'all' | SessionType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'imminent' | 'upcoming' | 'ongoing' | 'finished'>('all');

  // Auto-sync player dropdowns when group changes
  const handleGroupChange = (newGroup: GroupId) => {
    setGroup(newGroup);
    const available = players.filter((p) => p.group === newGroup);
    if (available.length >= 2) {
      setPlayer1Id(available[0].id);
      setPlayer2Id(available[1].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!player1Id || !player2Id) {
      setFormError('Vui lòng chọn đủ 2 kỳ thủ thi đấu.');
      return;
    }

    if (player1Id === player2Id) {
      setFormError('Hai kỳ thủ trong một ván đấu phải khác nhau.');
      return;
    }

    onAddMatch({
      group,
      round,
      leg,
      date,
      time,
      session,
      player1Id,
      player2Id,
      tableNumber,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    // Advance table number or keep clean
    setTableNumber((prev) => (prev % 2) + 1);
  };

  // Get player name by ID
  const getPlayerName = (id: string): string => {
    const found = players.find((p) => p.id === id);
    return found ? found.name : 'Chưa xác định';
  };

  // Thống kê nhanh số lượng ván đấu theo trạng thái thời gian thực và theo bảng/lượt
  const filterMetrics = useMemo(() => {
    let ongoing = 0;
    let upcoming = 0;
    let finished = 0;
    const groupCounts: Record<'all' | GroupId, number> = { all: 0, A: 0, B: 0 };
    const roundCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    const baseMatches = searchQuery.trim()
      ? matches.filter((m) => {
          const qRaw = searchQuery.toLowerCase().trim();
          const qNorm = removeVietnameseTones(qRaw);
          const p1Raw = getPlayerName(m.player1Id).toLowerCase();
          const p1Norm = removeVietnameseTones(p1Raw);
          const p2Raw = getPlayerName(m.player2Id).toLowerCase();
          const p2Norm = removeVietnameseTones(p2Raw);
          return (
            p1Raw.includes(qRaw) ||
            p1Norm.includes(qNorm) ||
            p2Raw.includes(qRaw) ||
            p2Norm.includes(qNorm)
          );
        })
      : matches;

    groupCounts.all = baseMatches.length;

    for (const m of baseMatches) {
      if (m.group === 'A') groupCounts.A++;
      else if (m.group === 'B') groupCounts.B++;

      if (m.round >= 1 && m.round <= 6) {
        roundCounts[m.round] = (roundCounts[m.round] || 0) + 1;
      }

      const isFinished = m.status === 'finished' || (m.score1 !== undefined && m.score2 !== undefined);
      const live = getMatchLiveStatus(m.date, m.time, isFinished, m.score1, m.score2);

      if (live.status === 'finished' || isFinished) {
        finished++;
      } else if (live.status === 'ongoing' || m.isLive) {
        ongoing++;
      } else {
        // 'upcoming' hoặc 'imminent'
        upcoming++;
      }
    }

    return {
      total: baseMatches.length,
      ongoing,
      upcoming,
      finished,
      groupCounts,
      roundCounts,
    };
  }, [matches, searchQuery, players]);

  const statusCounts = filterMetrics;

  // Filtered and chronologically sorted matches (tự động chèn theo ngày giờ tăng dần)
  const filteredMatches = useMemo(() => {
    const list = matches.filter((m) => {
      // Lọc theo tên kỳ thủ tìm kiếm
      if (searchQuery.trim()) {
        const qRaw = searchQuery.toLowerCase().trim();
        const qNorm = removeVietnameseTones(qRaw);
        const p1Raw = getPlayerName(m.player1Id).toLowerCase();
        const p1Norm = removeVietnameseTones(p1Raw);
        const p2Raw = getPlayerName(m.player2Id).toLowerCase();
        const p2Norm = removeVietnameseTones(p2Raw);

        const matchP1 = p1Raw.includes(qRaw) || p1Norm.includes(qNorm);
        const matchP2 = p2Raw.includes(qRaw) || p2Norm.includes(qNorm);

        if (!matchP1 && !matchP2) return false;
      }

      if (filterGroup !== 'all' && m.group !== filterGroup) return false;
      if (filterRound !== 'all' && m.round.toString() !== filterRound) return false;
      if (filterSession !== 'all') {
        const actualSession = m.time ? detectSessionFromTime(m.time) : m.session;
        if (m.session !== filterSession && actualSession !== filterSession) return false;
      }
      if (filterStatus !== 'all') {
        const isFinished = m.status === 'finished' || (m.score1 !== undefined && m.score2 !== undefined);
        const live = getMatchLiveStatus(m.date, m.time, isFinished, m.score1, m.score2);

        if (filterStatus === 'ongoing') {
          if (isFinished) return false;
          if (live.status !== 'ongoing' && !m.isLive) return false;
        } else if (filterStatus === 'upcoming') {
          if (isFinished) return false;
          if (m.isLive) return false;
          if (live.status !== 'upcoming' && live.status !== 'imminent') return false;
        } else if (filterStatus === 'imminent') {
          if (isFinished) return false;
          if (live.status !== 'imminent') return false;
        } else if (filterStatus === 'finished') {
          if (!isFinished && live.status !== 'finished') return false;
        }
      }
      return true;
    });
    return sortMatchesChronologically(list);
  }, [matches, filterGroup, filterRound, filterSession, filterStatus, searchQuery, players]);

  return (
    <div className="space-y-8">
      {/* Admin Match Input Section (Only visible to admin) */}
      {isAdmin && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 mb-5">
            <div>
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Thêm Lịch Thi Đấu Mới
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập lịch thi đấu chi tiết cho từng trận hoặc sử dụng công cụ sinh lịch tự động
              </p>
            </div>
            <button
              onClick={onOpenQuickPairModal}
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gợi ý tạo lịch 6 lượt tự động</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ngày thi đấu */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ngày thi đấu
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Giờ thi đấu */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Giờ thi đấu
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    setTime(newTime);
                    setSession(detectSessionFromTime(newTime));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Buổi thi đấu (Sáng / Chiều / Tối) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Buổi thi đấu
                  </label>
                  <span className="text-[10px] text-indigo-400">Tự nhận diện theo giờ</span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSession('sang')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                      session === 'sang'
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => setSession('chieu')}
                    title="Buổi Chiều (13h - 17h)"
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                      session === 'chieu'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Chiều
                  </button>
                  <button
                    type="button"
                    onClick={() => setSession('toi')}
                    title="Buổi Tối (17h01 - 23h)"
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                      session === 'toi'
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tối
                  </button>
                </div>
              </div>

              {/* Bảng đấu (Bảng A / Bảng B) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bảng đấu
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleGroupChange('A')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      group === 'A'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bảng A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGroupChange('B')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      group === 'B'
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bảng B
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Lượt đấu (Lượt 1 - 6) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lượt đấu (Vòng)
                </label>
                <select
                  value={round}
                  onChange={(e) => setRound(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value={1}>Lượt 1</option>
                  <option value={2}>Lượt 2</option>
                  <option value={3}>Lượt 3</option>
                  <option value={4}>Lượt 4</option>
                  <option value={5}>Lượt 5</option>
                  <option value={6}>Lượt 6</option>
                </select>
              </div>

              {/* Tính chất Lượt: Đi hay Về */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Giai đoạn lượt
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLeg('di')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      leg === 'di'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lượt Đi
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeg('ve')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      leg === 've'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lượt Về
                  </button>
                </div>
              </div>

              {/* Player 1 (Trắng / Tiên) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Player 1 (Kỳ thủ 1)
                </label>
                <select
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {groupPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player 2 (Đen / Hậu) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Player 2 (Kỳ thủ 2)
                </label>
                <select
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {groupPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ghi chú trận đấu riêng của Ban tổ chức */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Ghi chú riêng cho trận đấu (Ban tổ chức)</span>
                <span className="text-[10px] text-slate-500">Tùy chọn: lỗi kỹ thuật, biên bản bổ sung...</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Bàn 2 gặp sự cố kết nối, xin thi đấu bù / Khiếu nại về đồng hồ..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm trận đấu vào lịch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 1. Thanh tìm kiếm kỳ thủ (Player Search Bar) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>Tìm Kiếm Trận Đấu Theo Kỳ Thủ</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập tên kỳ thủ hoặc bấm phím tắt bên dưới để xem toàn bộ các ván đấu của người đó
            </p>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa tìm kiếm: "{searchQuery}"</span>
            </button>
          )}
        </div>

        {/* Input field with search icon & clear button */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập tên kỳ thủ để lọc trận đấu (ví dụ: Lê Quang Liêm, Trường Sơn, Minh Thắng...)"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick player filter chips */}
        {players.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
            <span className="shrink-0 text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-500" />
              <span>Kỳ thủ:</span>
            </span>
            {players.map((p) => {
              const isSelected =
                searchQuery.toLowerCase().trim() === p.name.toLowerCase().trim();
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSearchQuery(isSelected ? '' : p.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          BỘ LỌC TOÀN DIỆN LỊCH THI ĐẤU (CHO CẢ ADMIN VÀ VIEWER)
          Hỗ trợ lọc đồng thời theo:
          1. Trạng thái (Tất cả, Đang diễn ra, Sắp tới, Đã kết thúc)
          2. Nhóm / Bảng thi đấu (Cả 2 Bảng, Bảng A, Bảng B)
          3. Lượt thi đấu (Tất cả lượt, Lượt 1 – 6)
          4. Buổi thi đấu (Sáng / Chiều / Tối)
          ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Header của bảng lọc */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-white tracking-wide uppercase">
                  Bộ Lọc Lịch Thi Đấu
                </h3>
                {statusCounts.ongoing > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    Đang thi đấu ({statusCounts.ongoing})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Lọc nhanh theo Bảng (A/B), Lượt đấu (1 – 6) hoặc Trạng thái (Đang diễn ra, Sắp tới, Đã kết thúc)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Counter badge */}
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              Hiển thị <span className="text-white font-extrabold text-indigo-400">{filteredMatches.length}</span> / {matches.length} ván
            </div>

            {/* Reset button if any filter is active */}
            {(filterStatus !== 'all' || filterGroup !== 'all' || filterRound !== 'all' || filterSession !== 'all' || searchQuery.trim() !== '') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterGroup('all');
                  setFilterRound('all');
                  setFilterSession('all');
                }}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Đặt lại toàn bộ các tiêu chí lọc về mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. HÀNG 1: LỌC THEO TRẠNG THÁI (Status) */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-500" />
            <span>Trạng thái trận đấu:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Tất cả */}
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-indigo-950/70 border-indigo-500/80 ring-1 ring-indigo-500/50 text-white shadow-md shadow-indigo-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Swords className={`w-4 h-4 shrink-0 ${filterStatus === 'all' ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div className="truncate text-xs font-bold">Tất cả trận</div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {statusCounts.total}
              </span>
            </button>

            {/* Đang diễn ra */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'ongoing' ? 'all' : 'ongoing')}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                filterStatus === 'ongoing'
                  ? 'bg-rose-950/70 border-rose-500/90 ring-1 ring-rose-500/50 text-white shadow-md shadow-rose-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-rose-200 hover:bg-rose-950/20 hover:border-rose-900/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Radio className={`w-4 h-4 shrink-0 ${filterStatus === 'ongoing' ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                <div className="truncate text-xs font-bold flex items-center gap-1">
                  <span>Đang diễn ra</span>
                  {statusCounts.ongoing > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
                </div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                filterStatus === 'ongoing'
                  ? 'bg-rose-600 text-white'
                  : statusCounts.ongoing > 0
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {statusCounts.ongoing}
              </span>
            </button>

            {/* Sắp tới */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'upcoming' ? 'all' : 'upcoming')}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                filterStatus === 'upcoming'
                  ? 'bg-amber-950/70 border-amber-500/90 ring-1 ring-amber-500/50 text-white shadow-md shadow-amber-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-amber-200 hover:bg-amber-950/20 hover:border-amber-900/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock className={`w-4 h-4 shrink-0 ${filterStatus === 'upcoming' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className="truncate text-xs font-bold">Sắp diễn ra</div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                filterStatus === 'upcoming'
                  ? 'bg-amber-600 text-white'
                  : statusCounts.upcoming > 0
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {statusCounts.upcoming}
              </span>
            </button>

            {/* Đã kết thúc */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'finished' ? 'all' : 'finished')}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                filterStatus === 'finished'
                  ? 'bg-emerald-950/70 border-emerald-500/90 ring-1 ring-emerald-500/50 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-emerald-200 hover:bg-emerald-950/20 hover:border-emerald-900/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${filterStatus === 'finished' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div className="truncate text-xs font-bold">Đã kết thúc</div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                filterStatus === 'finished'
                  ? 'bg-emerald-600 text-white'
                  : statusCounts.finished > 0
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {statusCounts.finished}
              </span>
            </button>
          </div>
        </div>

        {/* 2. HÀNG 2: LỌC THEO NHÓM BẢNG (Group A / B) */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Nhóm / Bảng thi đấu:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Cả 2 Bảng */}
            <button
              type="button"
              onClick={() => setFilterGroup('all')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <span>Cả 2 Bảng</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                filterGroup === 'all' ? 'bg-indigo-800/80 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {filterMetrics.groupCounts.all}
              </span>
            </button>

            {/* Bảng A */}
            <button
              type="button"
              onClick={() => setFilterGroup(filterGroup === 'A' ? 'all' : 'A')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'A'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-400 shadow-md shadow-amber-950/50 ring-1 ring-amber-400/50'
                  : 'bg-slate-950/80 text-amber-300/80 border-slate-800 hover:text-amber-200 hover:bg-amber-950/30 hover:border-amber-800/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Bảng A</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                filterGroup === 'A' ? 'bg-amber-800 text-white' : 'bg-amber-950/80 text-amber-300 border border-amber-900/60'
              }`}>
                {filterMetrics.groupCounts.A}
              </span>
            </button>

            {/* Bảng B */}
            <button
              type="button"
              onClick={() => setFilterGroup(filterGroup === 'B' ? 'all' : 'B')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'B'
                  ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white border-sky-400 shadow-md shadow-sky-950/50 ring-1 ring-sky-400/50'
                  : 'bg-slate-950/80 text-sky-300/80 border-slate-800 hover:text-sky-200 hover:bg-sky-950/30 hover:border-sky-800/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Bảng B</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                filterGroup === 'B' ? 'bg-sky-800 text-white' : 'bg-sky-950/80 text-sky-300 border border-sky-900/60'
              }`}>
                {filterMetrics.groupCounts.B}
              </span>
            </button>
          </div>
        </div>

        {/* 3. HÀNG 3: LỌC THEO LƯỢT THI ĐẤU (Round 1 - 6) */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
            <span>Lượt thi đấu (Vòng 1 – 6):</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
            {/* Tất cả lượt */}
            <button
              type="button"
              onClick={() => setFilterRound('all')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                filterRound === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <span>Tất cả lượt</span>
            </button>

            {[1, 2, 3, 4, 5, 6].map((r) => {
              const rStr = r.toString();
              const isSelected = filterRound === rStr;
              const count = filterMetrics.roundCounts[r] || 0;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRound(isSelected ? 'all' : rStr)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <span>Lượt {r}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. HÀNG 4: BỘ LỌC BỔ SUNG & XUẤT DỮ LIỆU */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Buổi filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Buổi:</span>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Tất cả các buổi</option>
                <option value="sang">Buổi Sáng (&lt; 13h)</option>
                <option value="chieu">Buổi Chiều (13h - 17h)</option>
                <option value="toi">Buổi Tối (17h01 - 23h)</option>
              </select>
            </div>

          </div>

          {/* Nút Xuất PDF */}
          {onOpenExportPdf && (
            <button
              type="button"
              onClick={onOpenExportPdf}
              title="Xuất lịch thi đấu ra file PDF để in ấn hoặc chia sẻ ngoại tuyến"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-950 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm ml-auto sm:ml-0"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xuất PDF Lịch</span>
            </button>
          )}
        </div>

        {/* 5. HÀNG 5: THẺ CHIP CÁC TIÊU CHÍ ĐANG LỌC (Active Filter Badges) */}
        {(filterStatus !== 'all' || filterGroup !== 'all' || filterRound !== 'all' || filterSession !== 'all' || searchQuery.trim() !== '') && (
          <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Đang lọc:</span>

            {/* Nhóm Bảng */}
            {filterGroup !== 'all' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                filterGroup === 'A'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/70'
                  : 'bg-sky-950/60 text-sky-300 border-sky-800/70'
              }`}>
                <span>Nhóm: Bảng {filterGroup}</span>
                <button
                  type="button"
                  onClick={() => setFilterGroup('all')}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Bỏ lọc nhóm"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Lượt đấu */}
            {filterRound !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/70">
                <span>Lượt: Lượt {filterRound}</span>
                <button
                  type="button"
                  onClick={() => setFilterRound('all')}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Bỏ lọc lượt đấu"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Trạng thái */}
            {filterStatus !== 'all' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                filterStatus === 'ongoing'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/70'
                  : filterStatus === 'upcoming'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/70'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
              }`}>
                <span>
                  {filterStatus === 'ongoing'
                    ? '🔴 Đang diễn ra'
                    : filterStatus === 'upcoming'
                    ? '⏳ Sắp diễn ra'
                    : '✅ Đã kết thúc'}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Bỏ lọc trạng thái"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Kỳ thủ tìm kiếm */}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/70">
                <span>Kỳ thủ: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Bỏ lọc theo kỳ thủ"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Buổi */}
            {filterSession !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <span>Buổi: {filterSession === 'sang' ? 'Sáng' : filterSession === 'chieu' ? 'Chiều' : 'Tối'}</span>
                <button
                  type="button"
                  onClick={() => setFilterSession('all')}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Bỏ lọc buổi"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterGroup('all');
                setFilterRound('all');
                setFilterSession('all');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer ml-auto font-medium"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          {searchQuery.trim() ? (
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          ) : (
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          )}
          <h3 className="font-display text-base font-semibold text-slate-300">
            {matches.length === 0
              ? 'Chưa có lịch thi đấu nào'
              : searchQuery.trim()
              ? `Không tìm thấy ván đấu nào của kỳ thủ "${searchQuery}"`
              : 'Không có trận đấu nào phù hợp với bộ lọc'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {matches.length === 0
              ? isAdmin
                ? 'Lịch thi đấu sẽ chỉ xuất hiện khi quản trị viên thêm lịch mới hoặc bấm "Gợi ý tạo lịch 6 lượt tự động".'
                : 'Ban tổ chức hiện đang sắp xếp lịch thi đấu. Kết quả sẽ được cập nhật trực tiếp tại đây.'
              : searchQuery.trim()
              ? 'Không có ván đấu nào khớp với tên kỳ thủ này. Hãy thử bấm chọn tên từ danh sách gợi ý hoặc xóa ô tìm kiếm.'
              : 'Hiện không có ván đấu nào thỏa mãn trạng thái hoặc tiêu chí tìm kiếm bạn đang chọn.'}
          </p>
          {matches.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Xóa tìm kiếm kỳ thủ
                </button>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterGroup('all');
                  setFilterRound('all');
                  setFilterSession('all');
                }}
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Xem lại tất cả trận đấu ({matches.length})
              </button>
            </div>
          ) : (
            isAdmin && (
              <button
                onClick={onOpenQuickPairModal}
                type="button"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Tạo lịch 6 lượt nhanh cho giải
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const p1Name = getPlayerName(match.player1Id);
            const p2Name = getPlayerName(match.player2Id);
            const isFinished = match.status === 'finished' || (match.score1 !== undefined && match.score2 !== undefined);
            const liveStatus = getMatchLiveStatus(match.date, match.time, isFinished, match.score1, match.score2);

            return (
              <div
                key={match.id}
                className={`bg-slate-900/80 border rounded-2xl p-4 sm:p-5 transition-all shadow-lg ${
                  match.isLive
                    ? 'border-rose-600/80 bg-rose-950/25 shadow-rose-950/30'
                    : isFinished
                    ? 'border-slate-800 bg-slate-900/90'
                    : liveStatus.status === 'imminent'
                    ? 'border-amber-600/80 bg-amber-950/20 shadow-amber-950/30 ring-1 ring-amber-500/40'
                    : liveStatus.status === 'ongoing'
                    ? 'border-rose-700/80 bg-rose-950/20 shadow-rose-950/20'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Header metadata row */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/70 mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 font-medium flex-wrap">
                    <span
                      className={`font-bold ${
                        match.group === 'A' ? 'text-amber-400' : 'text-sky-400'
                      }`}
                    >
                      Bảng {match.group}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">
                      Lượt {match.round} ({match.leg === 'di' ? 'Đi' : 'Về'})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-200">
                      {formatSessionName(match.session, match.time)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${liveStatus.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.dotClass}`} />
                      <span>{liveStatus.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{match.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{match.time}</span>
                    </div>
                  </div>
                </div>

                {/* Match duel layout */}
                <div className="grid grid-cols-12 items-center py-2 gap-2">
                  {/* Player 1 */}
                  <div className="col-span-5 text-right">
                    <div
                      className={`text-sm font-semibold truncate ${
                        isFinished && match.score1 === 1
                          ? 'text-emerald-400 font-bold'
                          : isFinished && match.score1 === 0
                          ? 'text-slate-400'
                          : 'text-white'
                      }`}
                      title={p1Name}
                    >
                      {p1Name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Trắng / Tiên</div>
                  </div>

                  {/* Score or VS Badge */}
                  <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                    {isFinished ? (
                      <div className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white tabular-nums tracking-wide shadow-inner">
                        {formatChessScore(match.score1, match.score2)}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        VS
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-slate-400 text-center">
                      {liveStatus.label}
                    </span>
                  </div>

                  {/* Player 2 */}
                  <div className="col-span-5 text-left">
                    <div
                      className={`text-sm font-semibold truncate ${
                        isFinished && match.score2 === 1
                          ? 'text-emerald-400 font-bold'
                          : isFinished && match.score2 === 0
                          ? 'text-slate-400'
                          : 'text-white'
                      }`}
                      title={p2Name}
                    >
                      {p2Name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Đen / Hậu</div>
                  </div>
                </div>

                {/* Match Notes display if available */}
                {match.notes && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2 shadow-inner">
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

                {/* Admin Note Action Row */}
                {isAdmin && onOpenMatchNote && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenMatchNote(match)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Thêm hoặc chỉnh sửa ghi chú biên bản cho trận đấu này"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{match.notes ? 'Sửa ghi chú biên bản' : '+ Thêm ghi chú'}</span>
                    </button>
                  </div>
                )}

                {/* Admin score actions & controls */}
                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 mr-1 font-medium">
                        Cập nhật tỉ số:
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(match.id, 1, 0)}
                        title="Kỳ thủ 1 thắng (+1 điểm)"
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          match.score1 === 1 && match.score2 === 0
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-800'
                        }`}
                      >
                        1 - 0
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(match.id, 0.5, 0.5)}
                        title="Hai kỳ thủ hòa (+0.5 điểm mỗi người)"
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          match.score1 === 0.5 && match.score2 === 0.5
                            ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-800 text-amber-400 border-slate-800'
                        }`}
                      >
                        ½ - ½
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(match.id, 0, 1)}
                        title="Kỳ thủ 2 thắng (+1 điểm)"
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          match.score1 === 0 && match.score2 === 1
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-800'
                        }`}
                      >
                        0 - 1
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {isFinished && (
                        <button
                          type="button"
                          onClick={() => onResetMatchScore(match.id)}
                          title="Hủy kết quả đưa về trạng thái chờ đấu"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteMatch(match.id)}
                        title="Xóa trận đấu này"
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
