import React from 'react';
import {
  BookOpen,
  Trophy,
  Swords,
  Crown,
  Medal,
  Flame,
  CheckCircle2,
  Clock,
  Shuffle,
  Users,
  Award,
  ShieldCheck,
} from 'lucide-react';

export const RulesView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Điều Lệ Chính Thức</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Điều Lệ & Thể Thức Thi Đấu
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quy chuẩn giải đấu áp dụng tính điểm FIDE cờ vua / cờ tướng quốc tế, vòng tròn 2 lượt đi và về, phân nhánh bán kết đối đầu chéo, thể thức knockout 2 ván, Tie-break sinh tử và ván 7 Armageddon.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">Tổng kỳ thủ</div>
                <div className="text-xl font-extrabold text-white">8 Kỳ Thủ · 2 Bảng</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="space-y-6">
        {/* Điều 1: Đối tượng & Phân chia Bảng đấu */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
              1
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Điều 1: Đối Tượng & Phân Chia Bảng Đấu
              </h2>
              <p className="text-xs text-slate-400">Quy mô giải đấu và nguyên tắc phân bảng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Bảng A (4 Kỳ thủ)</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-[12px]">
                Gồm 4 kỳ thủ thi đấu vòng tròn 2 lượt (Lượt đi & Lượt về) với nhau. Mỗi kỳ thủ thi đấu tổng cộng 6 trận trong vòng bảng.
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Bảng B (4 Kỳ thủ)</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-[12px]">
                Gồm 4 kỳ thủ thi đấu vòng tròn 2 lượt (Lượt đi & Lượt về) độc lập. Top 2 kỳ thủ xuất sắc nhất bảng giành quyền vào Bán kết.
              </p>
            </div>
          </div>
        </section>

        {/* Điều 2: Thể thức Vòng bảng & Cách tính điểm FIDE */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
              2
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Điều 2: Thể Thức Vòng Bảng & Cách Tính Điểm Chuẩn
              </h2>
              <p className="text-xs text-slate-400">Điểm số từng trận, phân chia buổi thi đấu và tiêu chí xếp hạng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Thắng trận</span>
              <span className="text-2xl font-extrabold text-emerald-300">1.0 điểm</span>
              <p className="text-[11px] text-slate-400">Cộng 1 điểm vào bảng xếp hạng</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Hòa trận</span>
              <span className="text-2xl font-extrabold text-amber-300">0.5 điểm (½)</span>
              <p className="text-[11px] text-slate-400">Mỗi bên được nửa điểm</p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-center space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Thua trận</span>
              <span className="text-2xl font-extrabold text-rose-300">0 điểm</span>
              <p className="text-[11px] text-slate-400">Không nhận điểm</p>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Thứ tự ưu tiên xếp hạng khi bằng điểm (Tie-breaker hierarchy):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-2 text-[12px]">
              <li><strong>Tổng điểm tích lũy:</strong> Kỳ thủ có nhiều điểm hơn xếp trên.</li>
              <li><strong>Đối đầu trực tiếp (Head-to-head):</strong> Xét tổng điểm giữa 2 kỳ thủ trực tiếp trong các ván đối đầu.</li>
              <li><strong>Hệ số Sonneborn-Berger (SB):</strong> Tổng điểm của các đối thủ mà kỳ thủ đã thắng cộng với một nửa (0.5) tổng điểm của các đối thủ mà kỳ thủ đã hòa.</li>
              <li><strong>Số ván thắng:</strong> Kỳ thủ có số trận thắng nhiều hơn xếp trên.</li>
            </ol>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Phân ca thi đấu:</strong> Buổi Chiều (13:00 - 17:00), Buổi Tối (17:01 - 23:00), Buổi Sáng (06:00 - 12:59). Lịch thi đấu tự động sắp xếp theo trình tự thời gian chính xác, trận nào diễn ra trước sẽ hiển thị lên trước.
            </div>
          </div>
        </section>

        {/* Điều 3: Thể thức Vòng loại trực tiếp Knockout (Bán kết, Tranh hạng ba & Chung kết) */}
        <section className="bg-slate-900/90 border border-indigo-700/50 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-indigo-600/40">
              3
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                Điều 3: Thể Thức Vòng Bán Kết, Tranh Hạng Ba & Chung Kết
              </h2>
              <p className="text-xs text-slate-400">Quy tắc 2 ván chính thức, điều kiện kết thúc sớm và cơ chế Tie-break ván 7 Armageddon</p>
            </div>
          </div>

          {/* Phân nhánh Bán kết */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>Phân nhánh thi đấu chéo:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[11px] font-bold text-indigo-400 block mb-1">BÁN KẾT 1</span>
                <span className="text-white font-semibold">Nhất Bảng A (A1) vs Nhì Bảng B (B2)</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[11px] font-bold text-indigo-400 block mb-1">BÁN KẾT 2</span>
                <span className="text-white font-semibold">Nhất Bảng B (B1) vs Nhì Bảng A (A2)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic pt-1">
              * Hai kỳ thủ thắng ở 2 trận bán kết sẽ bước vào <strong>Trận Chung Kết Tranh Cúp Vô Địch</strong>. Hai kỳ thủ thua ở bán kết sẽ bước vào <strong>Trận Tranh Hạng Ba (Huy Chương Đồng)</strong>.
            </p>
          </div>

          {/* Quy tắc loạt trận (Đồng nhất cho cả Bán kết, Tranh hạng ba & Chung kết) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Quy tắc thi đấu áp dụng cho cả 4 trận Knockout (Bán kết 1, Bán kết 2, Tranh hạng ba, Chung kết):
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Nguyên tắc 1: 2 ván chính */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>1. Hai Ván Đấu Chính Thức (Đi & Về)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[12px]">
                  Mỗi loạt trận ban đầu gồm <strong>2 ván chính thức</strong> luân phiên màu quân.
                </p>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] font-semibold">
                  Tỉ số nghiêng về một bên (2 - 0 hoặc 1.5 - 0.5): Loạt trận KẾT THÚC NGAY LẬP TỨC. Người có điểm cao hơn giành chiến thắng chung cuộc.
                </div>
              </div>

              {/* Nguyên tắc 2: Hòa 1 - 1 */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <Shuffle className="w-4 h-4 shrink-0" />
                  <span>2. Tie-Break Khi Hòa 1 - 1</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[12px]">
                  Nếu sau 2 ván chính tỉ số là <strong>1 - 1</strong> (mỗi bên thắng 1 ván hoặc 2 ván đều hòa ½ - ½), hai kỳ thủ <strong>mới đấu tiếp từng ván phụ Tie-break</strong>.
                </p>
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] font-semibold">
                  Đấu từng ván một (Ván 3, Ván 4, Ván 5, Ván 6): Ai thắng ván nào sẽ thắng luôn loạt trận! Nếu ván phụ hòa thì mới mở tiếp ván kế tiếp.
                </div>
              </div>
            </div>

            {/* Ván 7 Armageddon Special Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-rose-950/50 to-amber-950/50 border border-amber-500/60 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>3. Ván Thứ 7 Armageddon (Sinh Tử Tuyệt Đối)</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                Trong trường hợp cả 6 ván đấu (2 ván chính + 4 ván phụ Tie-break) vẫn có tỉ số hòa nhau, ván thứ 7 sẽ là ván sinh tử cuối cùng:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-white border border-slate-400 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-white block">Kỳ thủ Cầm Trắng (Đi tiên)</strong>
                    <span className="text-rose-400 font-bold">BUỘC PHẢI THẮNG</span> (Nếu hòa thì THUA).
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-500 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-white block">Kỳ thủ Cầm Đen (Đi hậu)</strong>
                    <span className="text-emerald-400 font-bold">HÒA LÀ THẮNG CHUNG CUỘC</span>!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Điều 4: Cơ Cấu Giải Thưởng & Danh Hiệu Toàn Giải */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-sm">
              4
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Điều 4: Cơ Cấu Giải Thưởng & Danh Hiệu Toàn Giải
              </h2>
              <p className="text-xs text-slate-400">Hạng mục vinh danh các kỳ thủ đạt thứ hạng cao nhất</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-amber-950/20 border border-amber-600/50 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black mx-auto shadow-lg shadow-amber-500/30">
                1
              </div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Quán Quân (Vô Địch)</div>
              <div className="text-sm font-extrabold text-white">Cúp Vàng Danh Giá</div>
              <p className="text-[11px] text-amber-300/80">Kỳ thủ chiến thắng ở Trận Chung Kết</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black mx-auto">
                2
              </div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Á Quân (Hạng Nhì)</div>
              <div className="text-sm font-extrabold text-white">Cúp Bạc Danh Dự</div>
              <p className="text-[11px] text-slate-400">Kỳ thủ về nhì ở Trận Chung Kết</p>
            </div>

            <div className="bg-amber-950/10 border border-amber-800/40 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-black mx-auto">
                3
              </div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Hạng Ba (Quý Quân)</div>
              <div className="text-sm font-extrabold text-white">Huy Chương Đồng</div>
              <p className="text-[11px] text-amber-400/80">Kỳ thủ chiến thắng ở Trận Tranh Hạng Ba</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-black mx-auto">
                4
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hạng Tư</div>
              <div className="text-sm font-extrabold text-white">Kỷ Niệm Chương Top 4</div>
              <p className="text-[11px] text-slate-500">Kỳ thủ lọt vào Vòng Bán Kết</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
