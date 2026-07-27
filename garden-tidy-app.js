import React, { useState, useMemo, useRef } from 'react';
import { TreePine, Leaf, Mountain, Eye, Trash2, X, RotateCcw, Copy } from 'lucide-react';

// ---- 配色（庭の素材にちなんだ色）----
const COLORS = {
  ground: '#DDD2B4',     // 白川砂・敷き砂利
  groundLine: '#CBBC98', // 砂紋（熊手の線）
  tree: '#3E5230',       // 苔色・深緑
  shrub: '#8CA06B',      // 若草色
  stone: '#9A9284',      // 御影石
  stoneStroke: '#75705F',
  accent: '#B33A2E',     // 朱色（視点・候補の色）
  ink: '#2B2A26',        // 墨色
  paper: '#F7F3EA',
  line: '#E4DCC8',
};

// ---- 図形計算用の小さな関数 ----
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleOf = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);
const angDiff = (a1, a2) => {
  const d = Math.abs(a1 - a2) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
};
const halfAngle = (from, to, r) => Math.atan2(r, Math.max(dist(from, to), 0.0001));
const indexOf = (list, id) => list.findIndex((o) => o.id === id) + 1;

// ---- 初期サンプル配置 ----
const INITIAL_VIEWPOINT = { x: 50, y: 92 };
const INITIAL_TREES = [
  { id: 'tree-1', x: 38, y: 12, r: 6, baseline: true, bird: false },
  { id: 'tree-2', x: 86, y: 12, r: 8, baseline: true, bird: false },
  { id: 'tree-3', x: 65, y: 12, r: 6, baseline: true, bird: false },
  { id: 'tree-4', x: 12, y: 19, r: 6, baseline: true, bird: false },
  { id: 'tree-5', x: 93, y: 29, r: 5, baseline: true, bird: false },
  { id: 'tree-6', x: 7.06, y: 47.09, r: 5, baseline: true, bird: false },
  { id: 'tree-7', x: 50, y: 48, r: 6, baseline: true, bird: false },
  { id: 'tree-8', x: 93.83, y: 54.71, r: 6, baseline: true, bird: false },
  { id: 'tree-1000', x: 25, y: 8.41, r: 3, baseline: false, bird: true },
  { id: 'tree-1001', x: 72.09, y: 4.82, r: 5, baseline: false, bird: false },
  { id: 'tree-1003', x: 94.73, y: 37.78, r: 5, baseline: false, bird: false },
  { id: 'tree-1006', x: 9.3, y: 26.12, r: 5, baseline: false, bird: false },
  { id: 'tree-1007', x: 44.06, y: 6.84, r: 4, baseline: false, bird: true },
  { id: 'tree-1008', x: 53.48, y: 12.0, r: 4, baseline: false, bird: false },
  { id: 'tree-1009', x: 7.06, y: 8.18, r: 4, baseline: false, bird: false },
  { id: 'tree-1010', x: 97.65, y: 17.83, r: 4, baseline: false, bird: false },
];
const INITIAL_SHRUBS = [
  { id: 'shrub-1', x: 67.6, y: 26.23, r: 3, baseline: true },
  { id: 'shrub-2', x: 40.92, y: 26.68, r: 3, baseline: true },
  { id: 'shrub-3', x: 19.39, y: 36.32, r: 3, baseline: true },
  { id: 'shrub-4', x: 85.54, y: 41.26, r: 3, baseline: true },
  { id: 'shrub-5', x: 12.44, y: 57.17, r: 4, baseline: true },
  { id: 'shrub-6', x: 41, y: 56, r: 3, baseline: true },
  { id: 'shrub-7', x: 57.74, y: 54.26, r: 3, baseline: true },
  { id: 'shrub-8', x: 84.64, y: 62.56, r: 3, baseline: true },
  { id: 'shrub-1002', x: 24.1, y: 38.9, r: 3, baseline: false },
  { id: 'shrub-1011', x: 54.6, y: 59.3, r: 3, baseline: false },
  { id: 'shrub-1012', x: 77.47, y: 64.46, r: 3, baseline: false },
  { id: 'shrub-1013', x: 3.25, y: 41.37, r: 3, baseline: false },
  { id: 'shrub-1014', x: 45.85, y: 18.05, r: 3, baseline: false },
  { id: 'shrub-1015', x: 80.83, y: 19.62, r: 3, baseline: false },
  { id: 'shrub-1016', x: 32.17, y: 5.94, r: 3, baseline: false },
  { id: 'shrub-1017', x: 36.43, y: 51.46, r: 3, baseline: false },
];
const INITIAL_STONES = [
  { id: 'stone-1', x: 76, y: 24, r: 6, baseline: true },
  { id: 'stone-2', x: 47, y: 25, r: 4, baseline: true },
  { id: 'stone-3', x: 25, y: 31.17, r: 4, baseline: true },
  { id: 'stone-4', x: 64, y: 31, r: 3, baseline: true },
  { id: 'stone-5', x: 81.95, y: 37, r: 4, baseline: true },
  { id: 'stone-6', x: 38, y: 46.86, r: 4, baseline: true },
  { id: 'stone-7', x: 17.83, y: 50.45, r: 5, baseline: true },
  { id: 'stone-8', x: 60.43, y: 44.84, r: 4, baseline: true },
  { id: 'stone-9', x: 81.05, y: 54.93, r: 4, baseline: true },
  { id: 'stone-10', x: 48.54, y: 57.85, r: 4, baseline: true },
];

const MODES = [
  { key: 'viewpoint', label: '視点', icon: Eye },
  { key: 'tree', label: '庭木', icon: TreePine },
  { key: 'shrub', label: '低木・地被', icon: Leaf },
  { key: 'stone', label: '景石', icon: Mountain },
];

const RADIUS_RANGE = {
  tree: [3, 15],
  shrub: [1, 8],
  stone: [1, 8],
};

export default function GardenTidyApp() {
  const [viewpoint, setViewpoint] = useState(INITIAL_VIEWPOINT);
  const [trees, setTrees] = useState(INITIAL_TREES);
  const [shrubs, setShrubs] = useState(INITIAL_SHRUBS);
  const [stones, setStones] = useState(INITIAL_STONES);
  const [mode, setMode] = useState('tree');
  const [selected, setSelected] = useState(null); // { type, id }
  const [removedIds, setRemovedIds] = useState(() => new Set());

  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const counterRef = useRef(1000);

  const toSvgCoords = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const setArray = (type) => ({ tree: setTrees, shrub: setShrubs, stone: setStones }[type]);

  const addObject = (type, x, y) => {
    const id = `${type}-${counterRef.current++}`;
    const r = type === 'tree' ? 7 : type === 'shrub' ? 3 : 4;
    const obj = type === 'tree'
      ? { id, x, y, r, baseline: false, bird: false }
      : { id, x, y, r, baseline: false };
    setArray(type)((prev) => [...prev, obj]);
    setSelected({ type, id });
  };

  const updatePosition = (type, id, x, y) => {
    setArray(type)((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
  };

  const updateRadius = (type, id, r) => {
    setArray(type)((prev) => prev.map((o) => (o.id === id ? { ...o, r } : o)));
  };

  const toggleBird = (id) => {
    setTrees((prev) => prev.map((t) => (t.id === id ? { ...t, bird: !t.bird } : t)));
  };

  const deleteObject = (type, id) => {
    setArray(type)((prev) => prev.filter((o) => o.id !== id));
    setSelected((s) => (s && s.id === id ? null : s));
  };

  const handleCanvasClick = (e) => {
    const { x, y } = toSvgCoords(e.clientX, e.clientY);
    if (mode === 'viewpoint') {
      setViewpoint({ x, y });
      setSelected(null);
      return;
    }
    addObject(mode, x, y);
  };

  const handlePointerDownObject = (e, type, id) => {
    e.stopPropagation();
    dragRef.current = { type, id };
    setSelected({ type, id });
  };

  const handleViewpointPointerDown = (e) => {
    e.stopPropagation();
    dragRef.current = { type: 'viewpoint' };
  };

  const handleSvgPointerMove = (e) => {
    if (!dragRef.current) return;
    const { x, y } = toSvgCoords(e.clientX, e.clientY);
    if (dragRef.current.type === 'viewpoint') setViewpoint({ x, y });
    else updatePosition(dragRef.current.type, dragRef.current.id, x, y);
  };

  const stopDrag = () => { dragRef.current = null; };

  const resetSample = () => {
    setViewpoint(INITIAL_VIEWPOINT);
    setTrees(INITIAL_TREES);
    setShrubs(INITIAL_SHRUBS);
    setStones(INITIAL_STONES);
    setSelected(null);
  };

  const clearAll = () => {
    setTrees([]);
    setShrubs([]);
    setStones([]);
    setSelected(null);
  };

  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportData = JSON.stringify({ viewpoint, trees, shrubs, stones });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // クリップボードが使えない場合は、下のテキストを手動で選択してコピーしてもらう
    }
  };

  // ---- 判定ロジック ----
  // ・既存(baseline)の庭木・低木は判定の対象外（絶対に候補にならない）
  // ・新しく追加したものだけ、元の自動判定（鳥／重なり・隣接／景石を妨げる）にかける
  const analysis = useMemo(() => {
    const treeFlags = {};
    trees.forEach((t) => { treeFlags[t.id] = []; });
    trees.forEach((t) => {
      if (!t.baseline && t.bird) treeFlags[t.id].push('鳥が運んだ種');
    });

    const pairLines = [];
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        const a = trees[i], b = trees[j];
        if (dist(a, b) < a.r + b.r) {
          if (!a.baseline) treeFlags[a.id].push(`木${indexOf(trees, b.id)}と隣接`);
          if (!b.baseline) treeFlags[b.id].push(`木${indexOf(trees, a.id)}と隣接`);
          if (!a.baseline || !b.baseline) pairLines.push({ a, b, kind: 'touch' });
        }
        const diff = angDiff(angleOf(viewpoint, a), angleOf(viewpoint, b));
        const hw = halfAngle(viewpoint, a, a.r) + halfAngle(viewpoint, b, b.r);
        if (diff < hw) {
          if (!a.baseline) treeFlags[a.id].push(`木${indexOf(trees, b.id)}と重なる(前後)`);
          if (!b.baseline) treeFlags[b.id].push(`木${indexOf(trees, a.id)}と重なる(前後)`);
          if (!a.baseline || !b.baseline) pairLines.push({ a, b, kind: 'sightline' });
        }
      }
    }

    const shrubFlags = {};
    shrubs.forEach((s) => { shrubFlags[s.id] = []; });
    const blockLines = [];
    shrubs.forEach((s) => {
      if (s.baseline) return;
      stones.forEach((st) => {
        if (dist(viewpoint, s) >= dist(viewpoint, st)) return;
        const diff = angDiff(angleOf(viewpoint, s), angleOf(viewpoint, st));
        const hw = halfAngle(viewpoint, s, s.r) + halfAngle(viewpoint, st, st.r);
        if (diff < hw) {
          shrubFlags[s.id].push(`石${indexOf(stones, st.id)}の眺めを妨げる`);
          blockLines.push({ from: viewpoint, to: st, shrubId: s.id });
        }
      });
    });

    return { treeFlags, shrubFlags, pairLines, blockLines };
  }, [trees, shrubs, stones, viewpoint]);

  const flaggedTrees = trees.filter((t) => !removedIds.has(t.id) && analysis.treeFlags[t.id].length > 0);
  const flaggedShrubs = shrubs.filter((s) => !removedIds.has(s.id) && analysis.shrubFlags[s.id].length > 0);

  // ---- カテゴリ別に「消す」ボタンの判定 ----
  const REASON_TEST = {
    bird: (r) => r === '鳥が運んだ種',
    sightline: (r) => r.endsWith('と重なる(前後)'),
    touch: (r) => r.endsWith('と隣接'),
    block: (r) => r.endsWith('の眺めを妨げる'),
  };

  const removeByCategory = (category) => {
    const test = REASON_TEST[category];
    setRemovedIds((prev) => {
      const next = new Set(prev);
      trees.forEach((t) => {
        if ((analysis.treeFlags[t.id] || []).some(test)) next.add(t.id);
      });
      shrubs.forEach((s) => {
        if ((analysis.shrubFlags[s.id] || []).some(test)) next.add(s.id);
      });
      return next;
    });
  };

  const restoreAll = () => setRemovedIds(new Set());

  const CATEGORY_BUTTONS = [
    { key: 'bird', label: '鳥が運んだ種' },
    { key: 'sightline', label: '前後で重なる木' },
    { key: 'touch', label: '隣接する木' },
    { key: 'block', label: '景石を妨げる木' },
  ];

  const selectedObj = useMemo(() => {
    if (!selected) return null;
    const list = { tree: trees, shrub: shrubs, stone: stones }[selected.type];
    return list.find((o) => o.id === selected.id) || null;
  }, [selected, trees, shrubs, stones]);

  const rakeLines = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const y = 8 + i * 12;
    return `M -5 ${y} Q 25 ${y - 3} 50 ${y} T 105 ${y}`;
  }), []);

  return (
    <div
      style={{ backgroundColor: COLORS.paper, fontFamily: "'Hiragino Sans','Yu Gothic','Noto Sans JP',sans-serif", color: COLORS.ink }}
      className="min-h-screen w-full flex justify-center p-3"
    >
      <div className="w-full max-w-md">
        <header className="mb-3">
          <h1 className="text-lg font-bold">庭木整理参考アプリ</h1>
          <div className="mt-2 p-2.5 rounded-lg text-xs leading-relaxed bg-white border" style={{ borderColor: COLORS.line }}>
            <p><span className="font-semibold">① 庭木の整理</span>　鳥が運んだ種／前後で重なる木／隣接する木が伐採・抜根の候補</p>
            <p className="mt-1"><span className="font-semibold">② 低木・地被の整理</span>　景石の眺めを妨げるものが撤去の候補</p>
          </div>
        </header>

        <div className="mb-2 p-2.5 rounded-lg bg-white border" style={{ borderColor: COLORS.line }}>
          <p className="text-xs font-semibold mb-1.5">候補を試しに消す</p>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {CATEGORY_BUTTONS.map(({ key, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => removeByCategory(key)}
                className="text-xs px-2 py-1.5 rounded border"
                style={{ borderColor: COLORS.accent, color: COLORS.accent, backgroundColor: '#fff' }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={restoreAll}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border"
            style={{ borderColor: COLORS.line }}
          >
            <RotateCcw size={13} /> 元に戻す
          </button>
        </div>

        <div className="flex gap-1.5 mb-2">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => setMode(key)}
              className="flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-xs gap-0.5 border"
              style={mode === key
                ? { backgroundColor: COLORS.accent, color: '#fff', borderColor: COLORS.accent }
                : { backgroundColor: '#fff', color: COLORS.ink, borderColor: COLORS.line }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs mb-1.5" style={{ opacity: 0.65 }}>
          下の図は不適切な配置の事例です。下の①と②を削除することで、適切な配置を残す事例として参考にしてください。
        </p>

        <div className="rounded-xl overflow-hidden border" style={{ borderColor: COLORS.line }}>
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            style={{ touchAction: 'none', display: 'block', width: '100%', height: 'auto', backgroundColor: COLORS.ground }}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            <rect x="0" y="0" width="100" height="100" fill="transparent" onClick={handleCanvasClick} />

            {rakeLines.map((d, i) => (
              <path key={i} d={d} stroke={COLORS.groundLine} strokeWidth="0.5" fill="none" opacity="0.6" pointerEvents="none" />
            ))}

            {analysis.pairLines.filter((p) => p.kind === 'touch' && !removedIds.has(p.a.id) && !removedIds.has(p.b.id)).map((p, i) => (
              <line key={`t${i}`} x1={p.a.x} y1={p.a.y} x2={p.b.x} y2={p.b.y} stroke={COLORS.accent} strokeWidth="0.6" opacity="0.55" pointerEvents="none" />
            ))}
            {analysis.pairLines.filter((p) => p.kind === 'sightline' && !removedIds.has(p.a.id) && !removedIds.has(p.b.id)).map((p, i) => {
              const far = dist(viewpoint, p.a) > dist(viewpoint, p.b) ? p.a : p.b;
              return <line key={`s${i}`} x1={viewpoint.x} y1={viewpoint.y} x2={far.x} y2={far.y} stroke={COLORS.accent} strokeWidth="0.5" strokeDasharray="1.5,1.5" opacity="0.5" pointerEvents="none" />;
            })}
            {analysis.blockLines.filter((b) => !removedIds.has(b.shrubId)).map((b, i) => (
              <line key={`b${i}`} x1={b.from.x} y1={b.from.y} x2={b.to.x} y2={b.to.y} stroke={COLORS.accent} strokeWidth="0.5" strokeDasharray="1.5,1.5" opacity="0.5" pointerEvents="none" />
            ))}

            {stones.map((s, i) => (
              <g key={s.id} onPointerDown={(e) => handlePointerDownObject(e, 'stone', s.id)} style={{ cursor: 'pointer' }}>
                <circle cx={s.x} cy={s.y} r={s.r} fill={COLORS.stone} stroke={COLORS.stoneStroke} strokeWidth="0.6" />
                {selected?.type === 'stone' && selected.id === s.id && (
                  <circle cx={s.x} cy={s.y} r={s.r + 1.5} fill="none" stroke={COLORS.ink} strokeWidth="0.5" strokeDasharray="1,1" />
                )}
                <text x={s.x} y={s.y + 1} fontSize="3.2" textAnchor="middle" fill="#fff" pointerEvents="none">石{i + 1}</text>
              </g>
            ))}

            {shrubs.map((s, i) => {
              if (removedIds.has(s.id)) return null;
              const flagged = analysis.shrubFlags[s.id]?.length > 0;
              return (
                <g key={s.id} onPointerDown={(e) => handlePointerDownObject(e, 'shrub', s.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={s.x} cy={s.y} r={s.r} fill={COLORS.shrub} stroke={flagged ? COLORS.accent : 'none'} strokeWidth={flagged ? 1 : 0} strokeDasharray={flagged ? '1.5,1' : 'none'} />
                  {selected?.type === 'shrub' && selected.id === s.id && (
                    <circle cx={s.x} cy={s.y} r={s.r + 1.5} fill="none" stroke={COLORS.ink} strokeWidth="0.5" strokeDasharray="1,1" />
                  )}
                  <text x={s.x} y={s.y + 0.9} fontSize="2.6" textAnchor="middle" fill={COLORS.ink} pointerEvents="none">低{i + 1}</text>
                </g>
              );
            })}

            {trees.map((t, i) => {
              if (removedIds.has(t.id)) return null;
              const flagged = analysis.treeFlags[t.id]?.length > 0;
              return (
                <g key={t.id} onPointerDown={(e) => handlePointerDownObject(e, 'tree', t.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={t.x} cy={t.y} r={t.r} fill={COLORS.tree} stroke={flagged ? COLORS.accent : 'none'} strokeWidth={flagged ? 1.2 : 0} strokeDasharray={flagged ? '1.8,1.2' : 'none'} />
                  {selected?.type === 'tree' && selected.id === t.id && (
                    <circle cx={t.x} cy={t.y} r={t.r + 1.5} fill="none" stroke={COLORS.ink} strokeWidth="0.5" strokeDasharray="1,1" />
                  )}
                  <text x={t.x} y={t.y + 1} fontSize="3.2" textAnchor="middle" fill="#fff" pointerEvents="none">木{i + 1}</text>
                </g>
              );
            })}

            <g onPointerDown={handleViewpointPointerDown} style={{ cursor: 'grab' }}>
              <circle cx={viewpoint.x} cy={viewpoint.y} r="2.2" fill={COLORS.accent} />
              <text x={viewpoint.x} y={viewpoint.y + 6} fontSize="3.2" textAnchor="middle" fill={COLORS.ink} pointerEvents="none">上座(視点)</text>
            </g>
          </svg>
        </div>

        {selectedObj && (
          <div className="mt-2 p-3 rounded-lg border bg-white" style={{ borderColor: COLORS.line }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">
                {selected.type === 'tree' ? '庭木' : selected.type === 'shrub' ? '低木・地被' : '景石'}を編集
              </span>
              <button type="button" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <label className="text-xs block mb-1">大きさ：{selectedObj.r}</label>
            <input
              type="range"
              min={RADIUS_RANGE[selected.type][0]}
              max={RADIUS_RANGE[selected.type][1]}
              value={selectedObj.r}
              onChange={(e) => updateRadius(selected.type, selected.id, Number(e.target.value))}
              className="w-full mb-2"
            />
            {selected.type === 'tree' && (
              <label className="flex items-center gap-2 text-xs mb-2">
                <input type="checkbox" checked={selectedObj.bird} onChange={() => toggleBird(selectedObj.id)} />
                鳥が運んだ種（不適格な木）
              </label>
            )}
            <button
              type="button"
              onClick={() => deleteObject(selected.type, selected.id)}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded"
              style={{ backgroundColor: COLORS.accent, color: '#fff' }}
            >
              <Trash2 size={13} /> 削除
            </button>
          </div>
        )}

        <div className="flex gap-2 mt-2 mb-2">
          <button type="button" onClick={resetSample} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border" style={{ borderColor: COLORS.line }}>
            <RotateCcw size={13} /> サンプルに戻す
          </button>
          <button type="button" onClick={clearAll} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border" style={{ borderColor: COLORS.line }}>
            <Trash2 size={13} /> すべて消去
          </button>
        </div>

        <div className="mb-4">
          <button type="button" onClick={() => setShowExport((v) => !v)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border" style={{ borderColor: COLORS.line }}>
            <Copy size={13} /> 今の配置を書き出す
          </button>
          {showExport && (
            <div className="mt-2 p-2.5 rounded-lg border bg-white" style={{ borderColor: COLORS.line }}>
              <p className="text-xs mb-1.5" style={{ opacity: 0.7 }}>
                下の文字列をコピーしてチャットに貼り付けてください。この配置を新しいサンプルとして反映します。
              </p>
              <textarea
                readOnly
                rows={4}
                value={exportData}
                onFocus={(e) => e.target.select()}
                className="w-full text-xs p-2 rounded border"
                style={{ borderColor: COLORS.line, fontFamily: 'monospace' }}
              />
              <button type="button" onClick={handleCopy} className="mt-1.5 text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.accent, color: '#fff' }}>
                {copied ? 'コピーしました' : 'コピー'}
              </button>
            </div>
          )}
        </div>

        <section className="mb-3">
          <h2 className="text-sm font-bold mb-1">① 伐採・抜根の候補（{flaggedTrees.length}件）</h2>
          {flaggedTrees.length === 0 ? (
            <p className="text-xs" style={{ opacity: 0.6 }}>該当する木はありません。</p>
          ) : (
            <ul className="space-y-1">
              {flaggedTrees.map((t) => (
                <li
                  key={t.id}
                  onClick={() => setSelected({ type: 'tree', id: t.id })}
                  className="text-xs p-2 rounded bg-white border cursor-pointer"
                  style={{ borderColor: COLORS.line }}
                >
                  <span className="font-semibold">木{indexOf(trees, t.id)}</span>　{analysis.treeFlags[t.id].join(' / ')}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold mb-1">② 低木・地被の撤去候補（{flaggedShrubs.length}件）</h2>
          {flaggedShrubs.length === 0 ? (
            <p className="text-xs" style={{ opacity: 0.6 }}>該当するものはありません。</p>
          ) : (
            <ul className="space-y-1">
              {flaggedShrubs.map((s) => (
                <li
                  key={s.id}
                  onClick={() => setSelected({ type: 'shrub', id: s.id })}
                  className="text-xs p-2 rounded bg-white border cursor-pointer"
                  style={{ borderColor: COLORS.line }}
                >
                  <span className="font-semibold">低{indexOf(shrubs, s.id)}</span>　{analysis.shrubFlags[s.id].join(' / ')}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-4 pt-3 border-t text-xs leading-relaxed" style={{ borderColor: COLORS.line, opacity: 0.75 }}>
          <div className="flex items-center gap-1.5 mb-0.5"><span style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.tree, display: 'inline-block' }} /> 庭木</div>
          <div className="flex items-center gap-1.5 mb-0.5"><span style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.shrub, display: 'inline-block' }} /> 低木・地被</div>
          <div className="flex items-center gap-1.5 mb-0.5"><span style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.stone, display: 'inline-block' }} /> 景石</div>
          <div className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.accent, display: 'inline-block' }} /> 視点／候補（点線の枠と線）</div>
          <p className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.line }}>
            ※ ここで示す候補はあくまで目安です。実際にどう手を入れるべきかは、木の健康状態や庭全体のバランスなど、現地でなければ分からないことも多くあります。伐採・撤去を決める前に、造園の専門家にご相談することをおすすめします。
          </p>
        </footer>
      </div>
    </div>
  );
}
