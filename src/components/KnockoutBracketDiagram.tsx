import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { KnockoutMatch, KnockoutStage, Player } from '../types/tournament';
import { Trophy, Crown, Medal, GitBranch, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

interface KnockoutBracketDiagramProps {
  semi1?: KnockoutMatch;
  semi2?: KnockoutMatch;
  finalMatch?: KnockoutMatch;
  thirdPlace?: KnockoutMatch;
  players: Player[];
  onSelectMatch?: (stage: KnockoutStage) => void;
}

interface BracketNode {
  id: string;
  stage: KnockoutStage;
  title: string;
  match?: KnockoutMatch;
  x: number;
  y: number;
  width: number;
  height: number;
  isFinal?: boolean;
  isThirdPlace?: boolean;
}

export const KnockoutBracketDiagram: React.FC<KnockoutBracketDiagramProps> = ({
  semi1,
  semi2,
  finalMatch,
  thirdPlace,
  players,
  onSelectMatch,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredStage, setHoveredStage] = useState<KnockoutStage | null>(null);
  const [selectedStage, setSelectedStage] = useState<KnockoutStage | null>(null);

  const getPlayer = (id?: string) => players.find((p) => p.id === id);

  const getWinnerId = (m?: KnockoutMatch): string | undefined => {
    if (!m) return undefined;
    if (m.winnerId) return m.winnerId;
    if (m.status === 'finished' && m.score1 !== undefined && m.score2 !== undefined) {
      if (m.score1 > m.score2) return m.player1Id;
      if (m.score2 > m.score1) return m.player2Id;
    }
    return undefined;
  };

  const getLoserId = (m?: KnockoutMatch): string | undefined => {
    if (!m || m.status !== 'finished') return undefined;
    const winId = getWinnerId(m);
    if (!winId) return undefined;
    return winId === m.player1Id ? m.player2Id : m.player1Id;
  };

  const championPlayer = getPlayer(getWinnerId(finalMatch));
  const runnerUpPlayer = getPlayer(getLoserId(finalMatch));
  const thirdPlacePlayer = getPlayer(getWinnerId(thirdPlace));

  // Layout Dimensions (Canvas: 1040 x 500)
  const SVG_WIDTH = 1040;
  const SVG_HEIGHT = 500;

  const nodes: BracketNode[] = [
    {
      id: 'semi1',
      stage: 'semi1',
      title: 'BÁN KẾT 1',
      match: semi1,
      x: 40,
      y: 40,
      width: 270,
      height: 140,
    },
    {
      id: 'semi2',
      stage: 'semi2',
      title: 'BÁN KẾT 2',
      match: semi2,
      x: 40,
      y: 280,
      width: 270,
      height: 140,
    },
    {
      id: 'final',
      stage: 'final',
      title: 'CHUNG KẾT VÔ ĐỊCH',
      match: finalMatch,
      x: 450,
      y: 40,
      width: 290,
      height: 155,
      isFinal: true,
    },
    {
      id: 'third_place',
      stage: 'third_place',
      title: 'TRANH HẠNG BA',
      match: thirdPlace,
      x: 450,
      y: 280,
      width: 280,
      height: 140,
      isThirdPlace: true,
    },
  ];

  // D3 Rendering with smooth Bezier links & interactive state
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.d3-dynamic-layer').remove();

    const layer = svg.append('g').attr('class', 'd3-dynamic-layer');

    // 1. Defs & Gradients
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');

    // Winner path gradient (Gold)
    const goldGrad = defs.append('linearGradient')
      .attr('id', 'd3-gold-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    goldGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.9);
    goldGrad.append('stop').attr('offset', '100%').attr('stop-color', '#fbbf24').attr('stop-opacity', 1);

    // Loser path gradient to 3rd place (Amber/Slate)
    const bronzeGrad = defs.append('linearGradient')
      .attr('id', 'd3-bronze-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    bronzeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#64748b').attr('stop-opacity', 0.6);
    bronzeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d97706').attr('stop-opacity', 0.8);

    // Champion flow gradient
    const champGrad = defs.append('linearGradient')
      .attr('id', 'd3-champ-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    champGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 1);
    champGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.9);

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 2. Connector Links generator using D3 linkHorizontal
    const s1OutX = 40 + 270;
    const s1OutY = 40 + 70; // mid of semi1

    const s2OutX = 40 + 270;
    const s2OutY = 280 + 70; // mid of semi2

    const finalInX = 450;
    const finalInY = 40 + 77; // mid of final

    const thirdInX = 450;
    const thirdInY = 280 + 70; // mid of third place

    const isSemi1Finished = semi1?.status === 'finished';
    const isSemi2Finished = semi2?.status === 'finished';
    const isFinalFinished = finalMatch?.status === 'finished';
    const isThirdFinished = thirdPlace?.status === 'finished';

    interface LinkDef {
      from: [number, number];
      to: [number, number];
      active: boolean;
      type: 'winner' | 'loser' | 'trophy';
      label?: string;
    }

    const links: LinkDef[] = [
      // Semi 1 -> Final (Winner)
      {
        from: [s1OutX, s1OutY - 15],
        to: [finalInX, finalInY - 25],
        active: isSemi1Finished,
        type: 'winner',
        label: isSemi1Finished ? 'Thắng BK1' : 'Thắng BK1 (Vào CK)',
      },
      // Semi 2 -> Final (Winner)
      {
        from: [s2OutX, s2OutY - 15],
        to: [finalInX, finalInY + 25],
        active: isSemi2Finished,
        type: 'winner',
        label: isSemi2Finished ? 'Thắng BK2' : 'Thắng BK2 (Vào CK)',
      },
      // Semi 1 -> Third Place (Loser)
      {
        from: [s1OutX, s1OutY + 20],
        to: [thirdInX, thirdInY - 20],
        active: isSemi1Finished,
        type: 'loser',
        label: isSemi1Finished ? 'Thua BK1' : 'Thua BK1 (Tranh Hạng 3)',
      },
      // Semi 2 -> Third Place (Loser)
      {
        from: [s2OutX, s2OutY + 20],
        to: [thirdInX, thirdInY + 20],
        active: isSemi2Finished,
        type: 'loser',
        label: isSemi2Finished ? 'Thua BK2' : 'Thua BK2 (Tranh Hạng 3)',
      },
      // Final -> Champion Trophy Podium
      {
        from: [450 + 290, finalInY],
        to: [800, finalInY],
        active: isFinalFinished,
        type: 'trophy',
        label: 'Cúp Vô Địch 🏆',
      },
    ];

    const linkGenerator = d3.linkHorizontal()
      .x((d: any) => d[0])
      .y((d: any) => d[1]);

    const linkGroup = layer.append('g').attr('class', 'links');

    links.forEach((l) => {
      const pathData = linkGenerator({ source: l.from, target: l.to } as any);
      if (!pathData) return;

      const strokeColor =
        l.type === 'trophy'
          ? '#fbbf24'
          : l.type === 'winner'
          ? l.active
            ? 'url(#d3-gold-grad)'
            : '#475569'
          : l.active
          ? 'url(#d3-bronze-grad)'
          : '#334155';

      const strokeWidth = l.active ? (l.type === 'trophy' ? 4 : 3) : 2;
      const strokeDash = l.type === 'loser' ? '6 4' : l.active ? 'none' : '4 4';

      // Background path for glowing highlight
      if (l.active) {
        linkGroup.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', l.type === 'trophy' || l.type === 'winner' ? '#f59e0b' : '#d97706')
          .attr('stroke-width', strokeWidth + 4)
          .attr('stroke-opacity', 0.25)
          .attr('filter', 'url(#d3-glow)');
      }

      // Main line
      linkGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-dasharray', strokeDash)
        .attr('stroke-linecap', 'round');

      // Intermediate indicator dot
      const midX = (l.from[0] + l.to[0]) / 2;
      const midY = (l.from[1] + l.to[1]) / 2;

      linkGroup.append('circle')
        .attr('cx', midX)
        .attr('cy', midY)
        .attr('r', l.active ? 4.5 : 3)
        .attr('fill', l.active ? (l.type === 'winner' || l.type === 'trophy' ? '#fbbf24' : '#d97706') : '#475569')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.5);
    });

  }, [semi1, semi2, finalMatch, thirdPlace, players]);

  const handleMatchClick = (stage: KnockoutStage) => {
    setSelectedStage(stage);
    if (onSelectMatch) {
      onSelectMatch(stage);
    }
  };

  // Render a player card inside node
  const renderPlayerRow = (
    player?: Player,
    label?: string,
    score?: number,
    isWinner?: boolean,
    isEliminated?: boolean
  ) => {
    return (
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
          isWinner
            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
            : isEliminated
            ? 'bg-slate-950/60 border border-slate-800/80 text-slate-500 line-through decoration-slate-600'
            : 'bg-slate-950/80 border border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {isWinner ? (
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
          )}
          <div className="truncate">
            <div className={`text-xs font-bold truncate ${isWinner ? 'text-amber-300 font-extrabold' : player ? 'text-slate-100' : 'text-slate-500 italic'}`}>
              {player ? player.name : label || 'Chờ xác định'}
            </div>
            {label && (
              <div className="text-[10px] text-slate-400 font-normal truncate">
                {label}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <span
            className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
              isWinner
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : score !== undefined
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-600'
            }`}
          >
            {score !== undefined ? (score === 0.5 ? '½' : score) : '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden" ref={containerRef}>
      {/* Header with Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <span>Lược Đồ Phân Nhánh Knockout Trực Quan (D3.js)</span>
              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Interactive Bracket
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi đường đi của 4 kỳ thủ xuất sắc nhất từ vòng Bán kết đến trận Chung kết đoạt Cúp Vàng
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
            <span>Nhánh Thắng (Vào Chung Kết)</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-500 border-dashed border-b-2 border-slate-400" />
            <span>Nhánh Thua (Tranh Hạng 3)</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <Trophy className="w-3 h-3" />
            <span>Cúp Vô Địch</span>
          </div>
        </div>
      </div>

      {/* SVG Container with responsive viewbox */}
      <div className="relative overflow-x-auto pb-3 pt-1 scrollbar-thin">
        <div className="min-w-[980px] relative">
          {/* Background SVG for D3 dynamic connections and flows */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto block select-none pointer-events-none absolute inset-0 z-0"
            style={{ minHeight: '480px' }}
          />

          {/* HTML Overlay Nodes for crisp responsive typography, badges and interactions */}
          <div className="relative z-10" style={{ width: `${SVG_WIDTH}px`, height: `${SVG_HEIGHT}px` }}>
            {nodes.map((node) => {
              const m = node.match;
              const p1 = getPlayer(m?.player1Id);
              const p2 = getPlayer(m?.player2Id);
              const winId = getWinnerId(m);
              const isFinished = m?.status === 'finished';
              const isLive = m?.isLive;
              const isHovered = hoveredStage === node.stage;
              const isSelected = selectedStage === node.stage;

              const isP1Win = isFinished && winId === m?.player1Id;
              const isP2Win = isFinished && winId === m?.player2Id;
              const isP1Elim = isFinished && !isP1Win;
              const isP2Elim = isFinished && !isP2Win;

              return (
                <div
                  key={node.id}
                  onClick={() => handleMatchClick(node.stage)}
                  onMouseEnter={() => setHoveredStage(node.stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                  style={{
                    position: 'absolute',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                  }}
                  className={`rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer shadow-xl ${
                    node.isFinal
                      ? isFinished
                        ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/80 shadow-amber-950/40 ring-1 ring-amber-400/50'
                        : isLive
                        ? 'bg-gradient-to-b from-rose-950/30 to-slate-900 border-rose-500 shadow-rose-950/40 animate-pulse'
                        : 'bg-slate-900/95 border-amber-500/50 hover:border-amber-400'
                      : node.isThirdPlace
                      ? isFinished
                        ? 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-700/60 shadow-amber-950/20'
                        : 'bg-slate-900/95 border-slate-700 hover:border-amber-600/70'
                      : isFinished
                      ? 'bg-slate-900/95 border-indigo-500/60 shadow-indigo-950/30'
                      : isLive
                      ? 'bg-rose-950/30 border-rose-600 shadow-rose-950/30 animate-pulse'
                      : 'bg-slate-900/95 border-slate-700 hover:border-indigo-400'
                  } ${isHovered || isSelected ? 'scale-[1.02] -translate-y-0.5' : ''}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {node.isFinal ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      ) : node.isThirdPlace ? (
                        <Medal className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span className={`text-[11px] font-extrabold tracking-wider uppercase ${node.isFinal ? 'text-amber-300' : node.isThirdPlace ? 'text-amber-500' : 'text-indigo-300'}`}>
                        {node.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isLive ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                          <span>ĐANG ĐẤU</span>
                        </span>
                      ) : isFinished ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                          ĐÃ KẾT THÚC
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                          CHỜ ĐẤU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Players Rows */}
                  <div className="space-y-1.5">
                    {renderPlayerRow(
                      p1,
                      m?.player1Label,
                      m?.score1,
                      isP1Win,
                      isP1Elim
                    )}
                    {renderPlayerRow(
                      p2,
                      m?.player2Label,
                      m?.score2,
                      isP2Win,
                      isP2Elim
                    )}
                  </div>

                  {/* Footer Match Summary */}
                  {m?.outcomeNote && (
                    <div className="mt-2 text-[10px] text-amber-300/90 font-medium truncate bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30">
                      {m.outcomeNote}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Champion Podium Stand at the right end */}
            <div
              style={{
                position: 'absolute',
                left: '800px',
                top: '30px',
                width: '210px',
              }}
              className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/60 rounded-3xl p-4 text-center shadow-2xl relative overflow-hidden ring-1 ring-amber-400/40"
            >
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7 text-amber-400 drop-shadow" />
              </div>

              <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-1">
                Quán Quân Toàn Giải
              </div>

              <div className="text-sm font-black text-white truncate px-1 py-0.5">
                {championPlayer ? championPlayer.name : '(Chờ Chung kết)'}
              </div>

              <div className="text-[11px] text-amber-300/80 mt-1 font-semibold">
                🏆 Cúp Vàng Vô Địch 2026
              </div>

              {runnerUpPlayer && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Á Quân:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[120px]">
                    {runnerUpPlayer.name}
                  </span>
                </div>
              )}

              {thirdPlacePlayer && (
                <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Hạng Ba:</span>
                  <span className="font-bold text-amber-400 truncate max-w-[120px]">
                    {thirdPlacePlayer.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
