/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Match, KnockoutMatch, Player, Standing } from '../types/tournament';
import {
  formatChessScore,
  formatSessionName,
  sortMatchesChronologically,
  getMatchLiveStatus,
} from '../utils/tournamentEngine';
import { exportElementToPdf, printElement } from '../utils/pdfExport';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Calendar,
  BarChart3,
  Trophy,
  Swords,
  ShieldCheck,
  Sparkles,
  Sliders,
  Eye,
} from 'lucide-react';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentTitle: string;
  matches: Match[];
  knockoutMatches: KnockoutMatch[];
  players: Player[];
  standingsA: Standing[];
  standingsB: Standing[];
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  tournamentTitle,
  matches,
  knockoutMatches,
  players,
  standingsA,
  standingsB,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'schedule' | 'standings'>('all');
  const [filterGroup, setFilterGroup] = useState<'all' | 'A' | 'B'>('all');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeRulesNote, setIncludeRulesNote] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Lọc danh sách trận đấu cần in
  const printableMatches = matches.filter((m) => {
    if (filterGroup !== 'all' && m.group !== filterGroup) return false;
    return true;
  });
  const sortedPrintableMatches = sortMatchesChronologically(printableMatches);

  // Helper lấy tên kỳ thủ
  const getPlayerName = (id?: string): string => {
    if (!id) return 'Chưa xác định';
    const found = players.find((p) => p.id === id);
    return found ? found.name : id;
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportProgress(10);
    setStatusMessage('Bắt đầu khởi tạo bản in...');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Lich_Thi_Dau_Bang_Xep_Hang_${timestamp}.pdf`;

    try {
      await exportElementToPdf(reportRef.current, {
        filename,
        orientation: 'portrait',
        onProgress: (p, msg) => {
          setExportProgress(p);
          setStatusMessage(msg);
        },
      });
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err);
      setStatusMessage('Đã xảy ra lỗi khi tạo file PDF. Vui lòng thử lại!');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setStatusMessage('');
      }, 1000);
    }
  };

  const handlePrint = () => {
    printElement('printable-tournament-report');
  };

  const exportDateStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const exportTimeStr = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Xuất Lịch Thi Đấu & Bảng Xếp Hạng Ra PDF
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Định dạng chuẩn tài liệu in ấn A4, đầy đủ dấu tiếng Việt sắc nét để in ấn hoặc chia sẻ ngoại tuyến
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Chọn nội dung xuất */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    exportScope === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Toàn bộ tài liệu
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('schedule')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    exportScope === 'schedule'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chỉ Lịch thi đấu
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('standings')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    exportScope === 'standings'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chỉ Bảng xếp hạng
                </button>
              </div>

              {/* Lọc Bảng */}
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Cả 2 Bảng (A & B)</option>
                <option value="A">Chỉ Bảng A</option>
                <option value="B">Chỉ Bảng B</option>
              </select>

              {/* Checkbox chữ ký & ghi chú */}
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer ml-1 select-none">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Kèm chữ ký Trọng tài / BTC</span>
              </label>
            </div>

            {/* Các nút bấm tải về & in ấn */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>In trực tiếp</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Đang tạo PDF...' : 'Tải File PDF (.pdf)'}</span>
              </button>
            </div>
          </div>

          {/* Progress bar khi xuất PDF */}
          {isExporting && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>{statusMessage}</span>
                <span className="font-bold tabular-nums">{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 transition-all duration-300 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Printable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          <div className="max-w-[800px] mx-auto bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 font-sans border border-slate-300 text-[11px] leading-relaxed">
            {/* The printable target element captured by html2canvas & printed */}
            <div id="printable-tournament-report" ref={reportRef} className="space-y-6">
              {/* Header Quốc gia & Giải đấu */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="uppercase tracking-widest text-[10px] font-bold text-slate-500">
                  HỘI ĐỒNG TRỌNG TÀI & BAN TỔ CHỨC GIẢI ĐẤU
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-900">
                  {tournamentTitle}
                </h1>
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                  TỔNG HỢP LỊCH THI ĐẤU & BẢNG XẾP HẠNG CHÍNH THỨC
                </div>
                <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-center gap-3 flex-wrap">
                  <span>Ngày xuất bản: <strong>{exportDateStr}</strong> ({exportTimeStr})</span>
                  <span>·</span>
                  <span>Quy chuẩn tính điểm: <strong>Thắng 1, Hòa ½, Thua 0</strong></span>
                  <span>·</span>
                  <span>Hệ số phụ: <strong>Đối đầu trực tiếp & Sonneborn-Berger</strong></span>
                </div>
              </div>

              {/* PHẦN 1: BẢNG XẾP HẠNG VÒNG BẢNG */}
              {(exportScope === 'all' || exportScope === 'standings') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span>I. BẢNG XẾP HẠNG VÒNG BẢNG (VÒNG TRÒN 6 LƯỢT ĐI / VỀ)</span>
                    </h2>
                    <span className="text-[10px] text-slate-500 italic">
                      *Top 2 mỗi bảng giành quyền vào vòng Bán kết
                    </span>
                  </div>

                  {/* Bảng A */}
                  {(filterGroup === 'all' || filterGroup === 'A') && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        BẢNG A
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-center">
                            <th className="border border-slate-300 py-1.5 px-2 w-10">Hạng</th>
                            <th className="border border-slate-300 py-1.5 px-2 text-left">Họ và Tên Kỳ Thủ</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-12">Số trận</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-10">Thắng</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-10">Hòa</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-10">Thua</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-14 font-extrabold text-indigo-950 bg-indigo-50/50">Tổng điểm</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-14">Hệ số SB</th>
                            <th className="border border-slate-300 py-1.5 px-2 w-28 text-left">Trạng thái vé</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standingsA.map((s, idx) => (
                            <tr
                              key={s.playerId}
                              className={`text-center ${idx < 2 ? 'bg-amber-50/30' : ''}`}
                            >
                              <td className="border border-slate-300 py-1 px-2 font-bold">{s.rank}</td>
                              <td className="border border-slate-300 py-1 px-2 text-left font-semibold text-slate-900">
                                {s.playerName}
                              </td>
                              <td className="border border-slate-300 py-1 px-1">{s.played}</td>
                              <td className="border border-slate-300 py-1 px-1 font-semibold text-emerald-700">{s.won}</td>
                              <td className="border border-slate-300 py-1 px-1 text-amber-700">{s.drawn}</td>
                              <td className="border border-slate-300 py-1 px-1 text-slate-400">{s.lost}</td>
                              <td className="border border-slate-300 py-1 px-1 font-extrabold text-indigo-900 bg-indigo-50/40">
                                {s.points}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 font-mono text-[9px]">{s.sonnebornBerger.toFixed(2)}</td>
                              <td className="border border-slate-300 py-1 px-2 text-left text-[9px]">
                                {idx === 0 ? (
                                  <span className="font-bold text-amber-800">★ Nhất Bảng (Vào BK1)</span>
                                ) : idx === 1 ? (
                                  <span className="font-bold text-indigo-800">● Nhì Bảng (Vào BK2)</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Bảng B */}
                  {(filterGroup === 'all' || filterGroup === 'B') && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-xs font-bold text-slate-800 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                        BẢNG B
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-center">
                            <th className="border border-slate-300 py-1.5 px-2 w-10">Hạng</th>
                            <th className="border border-slate-300 py-1.5 px-2 text-left">Họ và Tên Kỳ Thủ</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-12">Số trận</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-10">Thắng</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-10">Hòa</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-10">Thua</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-14 font-extrabold text-indigo-950 bg-indigo-50/50">Tổng điểm</th>
                            <th className="border border-slate-300 py-1.5 px-1 w-14">Hệ số SB</th>
                            <th className="border border-slate-300 py-1.5 px-2 w-28 text-left">Trạng thái vé</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standingsB.map((s, idx) => (
                            <tr
                              key={s.playerId}
                              className={`text-center ${idx < 2 ? 'bg-sky-50/30' : ''}`}
                            >
                              <td className="border border-slate-300 py-1 px-2 font-bold">{s.rank}</td>
                              <td className="border border-slate-300 py-1 px-2 text-left font-semibold text-slate-900">
                                {s.playerName}
                              </td>
                              <td className="border border-slate-300 py-1 px-1">{s.played}</td>
                              <td className="border border-slate-300 py-1 px-1 font-semibold text-emerald-700">{s.won}</td>
                              <td className="border border-slate-300 py-1 px-1 text-amber-700">{s.drawn}</td>
                              <td className="border border-slate-300 py-1 px-1 text-slate-400">{s.lost}</td>
                              <td className="border border-slate-300 py-1 px-1 font-extrabold text-indigo-900 bg-indigo-50/40">
                                {s.points}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 font-mono text-[9px]">{s.sonnebornBerger.toFixed(2)}</td>
                              <td className="border border-slate-300 py-1 px-2 text-left text-[9px]">
                                {idx === 0 ? (
                                  <span className="font-bold text-sky-800">★ Nhất Bảng (Vào BK2)</span>
                                ) : idx === 1 ? (
                                  <span className="font-bold text-indigo-800">● Nhì Bảng (Vào BK1)</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN 2: LỊCH THI ĐẤU CHI TIẾT */}
              {(exportScope === 'all' || exportScope === 'schedule') && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span>II. LỊCH THI ĐẤU CHI TIẾT ({sortedPrintableMatches.length} TRẬN)</span>
                    </h2>
                    <span className="text-[10px] text-slate-500">
                      Sắp xếp tăng dần theo Ngày thi đấu · Giờ thi đấu · Bảng · Lượt
                    </span>
                  </div>

                  {sortedPrintableMatches.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 border border-dashed border-slate-300 rounded">
                      Chưa có lịch thi đấu nào được thiết lập.
                    </div>
                  ) : (
                    <table className="w-full border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-center">
                          <th className="border border-slate-300 py-1.5 px-1 w-8">STT</th>
                          <th className="border border-slate-300 py-1.5 px-2 w-20 text-left">Ngày đấu</th>
                          <th className="border border-slate-300 py-1.5 px-1 w-14">Giờ</th>
                          <th className="border border-slate-300 py-1.5 px-1 w-14">Buổi</th>
                          <th className="border border-slate-300 py-1.5 px-1 w-14">Bảng</th>
                          <th className="border border-slate-300 py-1.5 px-1 w-14">Lượt</th>
                          <th className="border border-slate-300 py-1.5 px-1 w-10">Bàn</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-right w-36">
                            Kỳ thủ 1 (Trắng/Tiên)
                          </th>
                          <th className="border border-slate-300 py-1.5 px-1 w-16 bg-slate-200/80">Tỉ số</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-left w-36">
                            Kỳ thủ 2 (Đen/Hậu)
                          </th>
                          <th className="border border-slate-300 py-1.5 px-1 w-20">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPrintableMatches.map((m, idx) => {
                          const p1Name = getPlayerName(m.player1Id);
                          const p2Name = getPlayerName(m.player2Id);
                          const isFinished = m.status === 'finished' || (m.score1 !== undefined && m.score2 !== undefined);
                          const live = getMatchLiveStatus(m.date, m.time, isFinished, m.score1, m.score2);

                          return (
                            <tr key={m.id} className={`text-center ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                              <td className="border border-slate-300 py-1 px-1 font-mono text-[9px] text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-300 py-1 px-2 text-left font-mono text-[9px]">
                                {m.date}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 font-bold text-slate-800">
                                {m.time}
                              </td>
                              <td className="border border-slate-300 py-1 px-1">
                                {formatSessionName(m.session, m.time)}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 font-bold">
                                Bảng {m.group}
                              </td>
                              <td className="border border-slate-300 py-1 px-1">
                                Lượt {m.round} ({m.leg === 'di' ? 'Đi' : 'Về'})
                              </td>
                              <td className="border border-slate-300 py-1 px-1 font-semibold">
                                Bàn {m.tableNumber || 1}
                              </td>
                              <td className={`border border-slate-300 py-1 px-2 text-right ${isFinished && m.score1 === 1 ? 'font-bold text-emerald-800' : 'font-semibold text-slate-900'}`}>
                                {p1Name}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 font-extrabold text-slate-900 bg-slate-100 font-mono">
                                {formatChessScore(m.score1, m.score2)}
                              </td>
                              <td className={`border border-slate-300 py-1 px-2 text-left ${isFinished && m.score2 === 1 ? 'font-bold text-emerald-800' : 'font-semibold text-slate-900'}`}>
                                {p2Name}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 text-[9px]">
                                {isFinished ? (
                                  <span className="text-emerald-700 font-semibold">Đã đấu</span>
                                ) : live.status === 'ongoing' ? (
                                  <span className="text-rose-700 font-bold">Đang đấu</span>
                                ) : (
                                  <span className="text-slate-500">Chờ đấu</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* PHẦN 3: VÒNG LOẠI TRỰC TIẾP (BÁN KẾT & CHUNG KẾT) */}
              {(exportScope === 'all' || exportScope === 'standings') && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span>III. VÒNG BÁN KẾT, TRANH HẠNG BA & CHUNG KẾT</span>
                    </h2>
                    <span className="text-[10px] text-slate-500">
                      Thể thức: 2 ván chính (Đi/Về) · Hòa 1-1 đấu Tie-break đến ván 7 Armageddon
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {knockoutMatches.map((k) => {
                      const p1 = getPlayerName(k.player1Id) || k.player1Label;
                      const p2 = getPlayerName(k.player2Id) || k.player2Label;
                      const isFinished = k.status === 'finished';

                      return (
                        <div
                          key={k.id}
                          className="border border-slate-300 rounded p-2.5 bg-slate-50/40 space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                            <span>{k.title}</span>
                            <span className="text-[10px] font-semibold text-indigo-900">
                              {k.score1 !== undefined && k.score2 !== undefined
                                ? `Tỉ số: ${k.score1} - ${k.score2}`
                                : 'Chưa diễn ra'}
                            </span>
                          </div>

                          <div className="space-y-1 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className={isFinished && k.winnerId === k.player1Id ? 'font-bold text-emerald-800' : 'text-slate-700'}>
                                {p1} ({k.player1Label})
                              </span>
                              <span className="font-bold">{k.score1 ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={isFinished && k.winnerId === k.player2Id ? 'font-bold text-emerald-800' : 'text-slate-700'}>
                                {p2} ({k.player2Label})
                              </span>
                              <span className="font-bold">{k.score2 ?? '-'}</span>
                            </div>
                          </div>

                          {k.outcomeNote && (
                            <div className="text-[9px] text-slate-500 italic pt-1 border-t border-slate-200">
                              {k.outcomeNote}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PHẦN 4: GHI CHÚ LUẬT & CHỮ KÝ XÁC NHẬN */}
              {includeSignatures && (
                <div className="pt-6 border-t border-slate-300 space-y-8">
                  {includeRulesNote && (
                    <div className="text-[9px] text-slate-500 leading-normal bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-700">Điều lệ thi đấu áp dụng:</div>
                      <div>
                        1. Thời gian thi đấu: 10 phút + 5 giây tích lũy mỗi nước đi (hoặc theo quy định cụ thể của Ban tổ chức). Kỳ thủ đi trễ quá 15 phút sẽ bị xử thua ván đấu.
                      </div>
                      <div>
                        2. Thể thức Bán kết & Chung kết: Đấu 2 ván chính. Nếu hòa 1 - 1, tiến hành đấu tiếp từng ván phụ Tie-break. Đến ván 7 Armageddon: Trắng buộc phải thắng, nếu Hòa thì Đen thắng chung cuộc.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 text-center text-xs pt-4 gap-4">
                    <div className="space-y-12">
                      <div className="space-y-0.5">
                        <div className="font-bold uppercase text-slate-900">TỔ TRƯỞNG TỔ TRỌNG TÀI</div>
                        <div className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 italic">
                        ..................................................
                      </div>
                    </div>

                    <div className="space-y-12">
                      <div className="space-y-0.5">
                        <div className="font-bold uppercase text-slate-900">TRƯỞNG BAN TỔ CHỨC GIẢI</div>
                        <div className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 italic">
                        ..................................................
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div>
            Khổ in: <strong>A4 Chuẩn</strong> · Hỗ trợ xuất file PDF ngoại tuyến hoặc gửi qua Zalo, Messenger, Email
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
