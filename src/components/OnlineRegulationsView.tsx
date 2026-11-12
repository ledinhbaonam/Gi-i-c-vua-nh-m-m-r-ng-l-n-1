import React from 'react';
import {
  ShieldCheck,
  Video,
  Monitor,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  Mic,
  Scale,
  Award,
} from 'lucide-react';

export const OnlineRegulationsView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950 border border-amber-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Quy chế thi đấu trực tuyến chính thức</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Luật & Quy Định Thi Đấu Online
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quy chuẩn giám sát qua Google Meet, chia sẻ màn hình trực tiếp (Share Screen), kiểm soát chống gian lận và xử lý sự cố kỹ thuật đảm bảo tính công bằng tuyệt đối cho giải đấu.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
              <Video className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">Giám sát trực tiếp</div>
                <div className="text-lg font-extrabold text-white">Google Meet · Share Screen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Regulations Articles */}
      <div className="space-y-6">
        {/* Điều 1: Hình thức thi đấu qua Google Meet & Share Screen */}
        <section className="bg-slate-900/90 border border-amber-600/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-sm">
              1
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-400" />
                Điều 1: Hình Thức Thi Đấu & Giám Sát Qua Google Meet
              </h2>
              <p className="text-xs text-slate-400">Yêu cầu bắt buộc về phòng họp trực tuyến và chia sẻ màn hình</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Bắt Buộc Vào Phòng Google Meet:</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-[12px]">
                Tất cả kỳ thủ thi đấu phải tham gia vào đường link phòng <strong>Google Meet</strong> do Ban tổ chức cung cấp trước giờ thi đấu <strong>ít nhất 10 phút</strong> để điểm danh và nhận giám sát trực tiếp từ Ban trọng tài.
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-400" />
                <span>Chia Sẻ Toàn Màn Hình (Share Screen):</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-[12px]">
                Trong suốt thời gian ván đấu diễn ra, <strong>kỳ thủ bắt buộc phải Share Screen (Toàn màn hình máy tính / thiết bị)</strong> và mở Camera/Mic để Trọng tài và các kỳ thủ khác cùng giám sát, công khai minh bạch 100%.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Nguyên tắc màn hình:</strong> Khi đang Share Screen, kỳ thủ chỉ được mở duy nhất tab bàn cờ thi đấu chính thức. Nghiêm cấm chuyển đổi tab, mở trình duyệt ẩn danh hay bất kỳ cửa sổ nào khác.
            </span>
          </div>
        </section>

        {/* Điều 2: Chống Gian Lận (Fair-Play & Anti-Cheat) */}
        <section className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-extrabold text-sm">
              2
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Điều 2: Quy Định Chống Gian Lận Tuyệt Đối (Fair-Play)
              </h2>
              <p className="text-xs text-slate-400">Các hành vi bị nghiêm cấm và hình thức kỷ luật</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-1.5">
                <strong className="text-rose-300 block font-bold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Nghiêm Cấm Sử Dụng Phần Mềm Hỗ Trợ:
                </strong>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Tuyệt đối cấm sử dụng các công cụ phân tích cờ (Chess Engines: Stockfish, Komodo, Pikafish,...), bot tự động, tiện ích mở rộng trợ giúp nước đi hoặc sách khai cuộc trong khi đang thi đấu.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-1.5">
                <strong className="text-rose-300 block font-bold text-xs flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  Nghiêm Cấm Trợ Giúp Bên Ngoài:
                </strong>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Kỳ thủ không được phép nhận bất kỳ sự nhắc nước nào từ người khác (trực tiếp tại phòng, qua điện thoại, tin nhắn hay sử dụng tai nghe bluetooth bí mật).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-2 text-xs">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Ghi Hình Phòng Meet & Hậu Kiểm Biên Bản Ván Đấu:</span>
              </div>
              <p className="text-slate-300 text-[12px] leading-relaxed">
                Ban tổ chức sẽ <strong>ghi hình lại (Record) toàn bộ phòng Google Meet</strong> trong thời gian thi đấu. Mọi ván cờ đều được xuất file PGN để chạy thuật toán rà soát tỷ lệ trùng khớp nước đi (Accuracy rate). Kỳ thủ có dấu hiệu gian lận sẽ bị tước quyền thi đấu ngay lập tức, xử thua toàn bộ các trận và cấm tham gia các giải tiếp theo.
              </p>
            </div>
          </div>
        </section>

        {/* Điều 3: Nền tảng & Tài khoản thi đấu chính chủ */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
              3
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Điều 3: Nền Tảng Thi Đấu & Tài Khoản Chính Chủ
              </h2>
              <p className="text-xs text-slate-400">Xác thực danh tính kỳ thủ trên nền tảng cờ online</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300 text-[12px] leading-relaxed">
              <li>
                Ván đấu diễn ra trên nền tảng cờ trực tuyến chỉ định (Chess.com, Lichess.org, hoặc Cờ Tướng Online).
              </li>
              <li>
                Kỳ thủ phải thi đấu bằng <strong>đúng tài khoản cá nhân đã đăng ký</strong> với Ban tổ chức trước khi giải khởi tranh.
              </li>
              <li>
                <strong className="text-rose-400">Nghiêm cấm tuyệt đối:</strong> Mượn tài khoản, đổi tên tài khoản hoặc nhờ người khác đánh hộ (Proxy play). Phát hiện đánh hộ sẽ bị xử thua toàn giải ngay lập tức.
              </li>
            </ul>
          </div>
        </section>

        {/* Điều 4: Sự cố mạng, Rớt mạng & Disconnection */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
              4
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-sky-400" />
                Điều 4: Thiết Bị & Xử Lý Sự Cố Ngắt Kết Nối (Disconnection)
              </h2>
              <p className="text-xs text-slate-400">Quy tắc chuẩn quốc tế về thời gian đồng hồ khi rớt mạng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <strong className="text-white block font-bold text-xs">Trách Nhiệm Thiết Bị:</strong>
              <p className="text-slate-400 text-[12px] leading-relaxed">
                Kỳ thủ tự chịu trách nhiệm về đường truyền internet, nguồn điện và độ ổn định của thiết bị (máy tính, điện thoại) trong suốt buổi thi đấu.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <strong className="text-amber-300 block font-bold text-xs">Đồng Hồ Khi Rớt Mạng:</strong>
              <p className="text-slate-300 text-[12px] leading-relaxed">
                Khi ván cờ đang diễn ra, nếu kỳ thủ bị văng khỏi Google Meet hoặc rớt mạng bàn cờ, <strong>đồng hồ thi đấu của kỳ thủ đó vẫn tiếp tục chạy</strong> theo luật cờ quốc tế.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Thời Gian Kết Nối Lại & Xử Thua Rụng Kim:</span>
            </div>
            <p className="text-slate-400 text-[12px] leading-relaxed">
              Kỳ thủ có thời gian tối đa để kết nối lại phòng Meet và chia sẻ lại màn hình (theo thời gian còn lại trên đồng hồ hoặc tối đa 3 phút). Nếu hết giờ hoặc quá 3 phút không vào lại, ván cờ sẽ bị xử <strong>Thua do rụng kim / ngắt kết nối</strong>.
            </p>
          </div>
        </section>

        {/* Điều 5: Điểm danh, Đến muộn & Bỏ cuộc (Walkover) */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
              5
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Điều 5: Điểm Danh, Giờ Thi Đấu & Xử Thua Bỏ Cuộc
              </h2>
              <p className="text-xs text-slate-400">Thời gian quy định và chế tài xử lý vi phạm giờ giấc</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300 text-[12px] leading-relaxed">
              <li>
                <strong>Điểm danh trước 10 phút:</strong> Kỳ thủ phải có mặt trên Google Meet trước giờ thi đấu niêm yết ít nhất 10 phút.
              </li>
              <li>
                <strong>Xử thua đến muộn (Walkover):</strong> Đến muộn quá <strong>10 phút</strong> so với giờ thi đấu mà không có lý do chính đáng được Trọng tài chấp thuận sẽ bị xử thua ván đấu đó (0 - 1).
              </li>
              <li>
                <strong>Tự ý bỏ cuộc:</strong> Bỏ cuộc 2 ván không lý do sẽ bị tước quyền thi đấu và xóa tên khỏi bảng xếp hạng giải.
              </li>
            </ul>
          </div>
        </section>

        {/* Điều 6: Ứng xử thể thao & Quyền Trọng tài */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
              6
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Điều 6: Văn Hóa Ứng Xử & Quyết Định Của Ban Trọng Tài
              </h2>
              <p className="text-xs text-slate-400">Tinh thần thể thao và cơ chế giải quyết tranh chấp</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed text-[12px]">
              Tất cả các kỳ thủ tham gia thi đấu phải giữ gìn văn hóa ứng xử, tôn trọng đối thủ và tuân thủ tuyệt đối sự điều hành của Ban Trọng tài trên phòng họp Google Meet. Nghiêm cấm các hành vi khiêu khích, ngôn từ xúc phạm hoặc spam tin nhắn.
            </p>
            <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
              <div className="flex items-center gap-2 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mọi khiếu nại phải được gửi trong vòng 15 phút sau ván đấu kèm video/ảnh chụp minh chứng.</span>
              </div>
              <div className="text-white font-bold bg-amber-900/70 px-3 py-1.5 rounded-lg border border-amber-700/60 whitespace-nowrap self-start sm:self-auto">
                Quyết định của Trọng tài chính là phán quyết cuối cùng!
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
