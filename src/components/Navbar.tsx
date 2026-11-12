import React from 'react';
import { Eye, Shield, Trophy, Calendar, BarChart3, Bell, GitBranch, Settings, LogOut, BookOpen, ShieldCheck, TrendingUp, FileText } from 'lucide-react';

export type ActiveTab = 'rules' | 'regulations' | 'schedule' | 'standings' | 'knockout' | 'results' | 'statistics';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin: boolean;
  isViewerOnly: boolean;
  onSwitchToViewer: () => void;
  onOpenAdminAuth: () => void;
  onOpenSettings: () => void;
  onAdminLogout: () => void;
  tournamentTitle: string;
  onOpenReminderModal?: () => void;
  upcomingCount?: number;
  onOpenExportPdf?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  isViewerOnly,
  onSwitchToViewer,
  onOpenAdminAuth,
  onOpenSettings,
  onAdminLogout,
  tournamentTitle,
  onOpenReminderModal,
  upcomingCount = 0,
  onOpenExportPdf,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand Wordmark + Navigation Bar shifted to the left */}
        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/40 shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="shrink-0">
              <span className="font-display font-bold text-sm lg:text-base text-white tracking-tight whitespace-nowrap block">
                {tournamentTitle}
              </span>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                {isViewerOnly ? 'Chế độ Khán Giả' : isAdmin ? 'Quản Trị Viên (Admin)' : 'Giao Diện Giải Đấu'}
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Shifted to the left next to title, full pristine labels) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shrink min-w-0 overflow-x-auto scrollbar-none">
            {/* 1. Thể lệ (Phía trước lịch thi đấu) */}
            <button
              onClick={() => onTabChange('rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'rules'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Thể lệ</span>
            </button>

            {/* 2. Luật quy định (Sau khung thể lệ, trước lịch thi đấu) */}
            <button
              onClick={() => onTabChange('regulations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'regulations'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Luật quy định</span>
            </button>

            {/* 3. Lịch thi đấu */}
            <button
              onClick={() => onTabChange('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Lịch thi đấu</span>
            </button>

            {/* 4. Bảng xếp hạng */}
            <button
              onClick={() => onTabChange('standings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'standings'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Bảng xếp hạng</span>
            </button>

            {/* 5. Bán kết & Chung kết */}
            <button
              onClick={() => onTabChange('knockout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'knockout'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span>Bán kết & Chung kết</span>
            </button>

            {/* 6. Thông báo kết quả */}
            <button
              onClick={() => onTabChange('results')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>Thông báo kết quả</span>
            </button>

            {/* 7. Thống kê (Recharts) */}
            <button
              onClick={() => onTabChange('statistics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'statistics'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Thống kê</span>
            </button>
          </nav>
        </div>

        {/* Zone 3: Actions (Pushed to the right with plenty of breathing room) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Chuông Cảnh Báo Ván Đấu Sắp Diễn Ra */}
          {onOpenReminderModal && (
            <button
              type="button"
              onClick={onOpenReminderModal}
              title={
                upcomingCount > 0
                  ? `Có ${upcomingCount} ván đấu sắp diễn ra / đang chờ đấu`
                  : 'Xem thông báo & đếm ngược ván đấu sắp diễn ra'
              }
              className={`relative p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                upcomingCount > 0
                  ? 'bg-amber-950/60 border-amber-600/70 text-amber-300 shadow-md shadow-amber-950/40 hover:bg-amber-900/60'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bell className={`w-4 h-4 ${upcomingCount > 0 ? 'animate-bounce text-amber-300' : ''}`} />
              {upcomingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {upcomingCount}
                </span>
              )}
            </button>
          )}

          {/* Nút Xuất PDF / In Ấn Ngoại Tuyến */}
          {onOpenExportPdf && (
            <button
              type="button"
              onClick={onOpenExportPdf}
              title="Xuất lịch thi đấu & bảng xếp hạng ra file PDF để in hoặc chia sẻ ngoại tuyến"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>
          )}

          {/* Note: Viewer mode has NO buttons to switch to admin or edit, exactly as requested */}
          {isViewerOnly ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-medium shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span>Chế độ xem</span>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onSwitchToViewer}
                title="Chuyển sang giao diện người xem (không có nút chỉnh sửa)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Xem web viewer</span>
              </button>

              <button
                onClick={onOpenSettings}
                title="Cài đặt giải đấu & Đổi mã PIN"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={onAdminLogout}
                title="Đăng xuất quyền quản trị"
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onSwitchToViewer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Khán giả</span>
              </button>
              <button
                onClick={onOpenAdminAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-indigo-950 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Đăng nhập Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-start gap-1 border-t border-slate-800/80 bg-slate-950 px-2 py-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onTabChange('rules')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'rules' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Thể lệ
        </button>
        <button
          onClick={() => onTabChange('regulations')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'regulations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          Luật quy định
        </button>
        <button
          onClick={() => onTabChange('schedule')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'schedule' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Lịch thi đấu
        </button>
        <button
          onClick={() => onTabChange('standings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'standings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Bảng xếp hạng
        </button>
        <button
          onClick={() => onTabChange('knockout')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'knockout' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Bán kết & Chung kết
        </button>
        <button
          onClick={() => onTabChange('results')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'results' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Thông báo kết quả
        </button>
        <button
          onClick={() => onTabChange('statistics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'statistics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          Thống kê
        </button>
      </div>
    </header>
  );
};
