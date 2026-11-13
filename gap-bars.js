// =============================================
// gap-bars.js v1.0.0 — the measuring lines shown after Submit in Balanced Placement
// I and II (Balanced III draws its own, from bp3-layout.js, because it has stacks).
//
// Items sit in one line along the container's long side ("main" axis):
//   main bars  — container edge → item → gap → item → … → container edge, measured
//                edge to edge along the container's middle line. They should all match.
//   cross bars — for each item, the space on either side of it across the short side.
//                The two should match (the item is centred).
// Colours: green = within TOL px of where it should be, amber = close, red = off.
// =============================================

export const VERSION = '1.0.0';
export const TOL = 4;

// boxes: [{ x, y, w, h }] — centres and sizes, in canvas pixels.
// rect:  { x, y, w, h } — the container. horizontal: true when the long side runs left-right.
export function rowGaps(boxes, rect, horizontal) {
    const M = b => horizontal ? b.x : b.y, len = b => horizontal ? b.w : b.h, dep = b => horizontal ? b.h : b.w;
    const mainStart = horizontal ? rect.x : rect.y, mainEnd = mainStart + (horizontal ? rect.w : rect.h);
    const crossStart = horizontal ? rect.y : rect.x, crossEnd = crossStart + (horizontal ? rect.h : rect.w);
    const sorted = [...boxes].sort((a, b) => M(a) - M(b));
    const target = ((mainEnd - mainStart) - sorted.reduce((t, b) => t + len(b), 0)) / (sorted.length + 1);
    const line = (m1, m2, c, alongMain) => (alongMain === horizontal)
        ? { x1: m1, y1: c, x2: m2, y2: c } : { x1: c, y1: m1, x2: c, y2: m2 };
    const bars = [];
    const mid = (crossStart + crossEnd) / 2;
    let prev = mainStart;
    for (const b of sorted) {
        const lo = M(b) - len(b) / 2;
        bars.push({ ...line(prev, lo, mid, true), len: lo - prev, kind: 'main', target });
        prev = M(b) + len(b) / 2;
    }
    bars.push({ ...line(prev, mainEnd, mid, true), len: mainEnd - prev, kind: 'main', target });
    sorted.forEach((b, i) => {
        const c = horizontal ? b.y : b.x;
        const before = (c - dep(b) / 2) - crossStart, after = crossEnd - (c + dep(b) / 2);
        bars.push({ ...line(crossStart, c - dep(b) / 2, M(b), false), len: before, kind: 'cross', pairLen: after });
        bars.push({ ...line(c + dep(b) / 2, crossEnd, M(b), false), len: after, kind: 'cross', pairLen: before });
    });
    return bars;
}

export function barColor(b) {
    const miss = b.kind === 'main' ? Math.abs(b.len - b.target) : Math.abs(b.len - b.pairLen);
    return miss <= TOL ? '#22c55e' : miss <= TOL * 2.5 ? '#fbbf24' : '#ef4444';
}

export function drawGapBars(ctx, bars) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const b of bars) {
        if (b.len < 2) continue;              // overlapping or outside: nothing to measure
        const col = barColor(b);
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        const horiz = b.y1 === b.y2, t = 5;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2);
        if (horiz) { ctx.moveTo(b.x1, b.y1 - t); ctx.lineTo(b.x1, b.y1 + t); ctx.moveTo(b.x2, b.y2 - t); ctx.lineTo(b.x2, b.y2 + t); }
        else { ctx.moveTo(b.x1 - t, b.y1); ctx.lineTo(b.x1 + t, b.y1); ctx.moveTo(b.x2 - t, b.y2); ctx.lineTo(b.x2 + t, b.y2); }
        ctx.stroke();
        const label = String(Math.round(b.len));
        const w = ctx.measureText(label).width + 6;
        const mx = (b.x1 + b.x2) / 2, my = (b.y1 + b.y2) / 2;
        const lx = horiz ? mx : mx + w / 2 + 4, ly = horiz ? my - 10 : my;
        ctx.fillStyle = 'rgba(20,20,20,0.85)';
        ctx.fillRect(lx - w / 2, ly - 7, w, 14);
        ctx.fillStyle = col;
        ctx.fillText(label, lx, ly);
    }
    ctx.restore();
}
