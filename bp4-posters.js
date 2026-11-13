// =============================================
// bp4-posters.js v1.0.0 — the 20 made-up B-movie posters for Balanced Placement IV.
// Every picture is drawn here as SVG (300 × 300), so nothing loads from another website
// and the art stays sharp at any size. Pictures are drawn "cover" style: any part of the
// 300 × 300 square can be cropped to fit a wide billboard or a tall poster slot.
// Titles approved by Jake, Nov 13 2026 (no cafeteria jokes; the CS teacher is fair game).
// =============================================

export const VERSION = '1.0.0';

// ---------- little drawing kit ----------
const grad = (id, a, b, vertical = true) =>
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="300" fill="url(#${id})"/>`;
const moon = (cx, cy, r, c = '#f7e5a8') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
const stars = (c = '#fff', seed = 3) => {
    let s = '', x = seed * 37;
    for (let i = 0; i < 22; i++) { x = (x * 73 + 41) % 997; s += `<circle cx="${x % 300}" cy="${(x * 7) % 150}" r="${1 + (x % 3) * .5}" fill="${c}" opacity=".8"/>`; }
    return s;
};
const city = (c = '#0e0b22', lit = '#f7e5a8', y0 = 0) => {
    const b = [[0, 230, 40], [36, 205, 34], [66, 245, 44], [106, 220, 30], [132, 250, 50], [178, 212, 36], [210, 238, 44], [250, 200, 50]];
    let s = `<g fill="${c}">` + b.map(([x, y, w]) => `<rect x="${x}" y="${y + y0}" width="${w}" height="${300 - y - y0 + 1}"/>`).join('') + '</g>';
    s += `<g fill="${lit}">` + b.map(([x, y], i) => `<rect x="${x + 8}" y="${y + y0 + 10 + (i % 3) * 9}" width="5" height="7"/>`).join('') + '</g>';
    return s;
};
const ground = (y, c) => `<rect y="${y}" width="300" height="${300 - y}" fill="${c}"/>`;

// ---------- the pictures ----------
const ART = {
    hamster: () => grad('g1', '#1b1446', '#e2553f') + moon(225, 70, 42) +
        `<g fill="#f7e5a8" opacity=".22"><polygon points="40,300 70,300 140,40 128,36"/><polygon points="260,300 285,300 190,30 178,34"/></g>
        <g fill="#2a1a12"><ellipse cx="150" cy="175" rx="92" ry="78"/><ellipse cx="150" cy="105" rx="62" ry="54"/><circle cx="104" cy="62" r="18"/><circle cx="196" cy="62" r="18"/></g>
        <g fill="#e2553f"><circle cx="104" cy="62" r="9"/><circle cx="196" cy="62" r="9"/></g>
        <circle cx="126" cy="100" r="9" fill="#fff4c2"/><circle cx="174" cy="100" r="9" fill="#fff4c2"/><circle cx="128" cy="101" r="4" fill="#e2553f"/><circle cx="176" cy="101" r="4" fill="#e2553f"/>
        <rect x="143" y="128" width="6" height="10" fill="#fff4c2"/><rect x="151" y="128" width="6" height="10" fill="#fff4c2"/>` + city(),

    waffles: () => grad('g2', '#2bb3c0', '#f4e3b0') +
        `<defs><pattern id="waf" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d9902f"/><rect width="6" height="6" x="2" y="2" fill="#b86f1c"/></pattern></defs>
        <g fill="#fff8d6" opacity=".55"><polygon points="70,92 110,92 150,260 30,260"/><polygon points="210,62 240,62 270,200 180,200"/></g>
        <g transform="rotate(-12 90 80)"><ellipse cx="90" cy="80" rx="58" ry="17" fill="url(#waf)" stroke="#7a4410" stroke-width="3"/><ellipse cx="90" cy="68" rx="18" ry="11" fill="#f6d046" stroke="#7a4410" stroke-width="3"/></g>
        <g transform="rotate(10 225 52)"><ellipse cx="225" cy="52" rx="40" ry="12" fill="url(#waf)" stroke="#7a4410" stroke-width="3"/><ellipse cx="225" cy="44" rx="12" ry="8" fill="#f6d046" stroke="#7a4410" stroke-width="3"/></g>` +
        ground(255, '#4f8a3a') +
        `<g fill="#c4472f"><polygon points="20,255 60,222 100,255"/><polygon points="190,255 235,215 280,255"/></g>
        <g fill="#f2ead3"><rect x="30" y="253" width="60" height="32"/><rect x="200" y="253" width="70" height="36"/></g>
        <g fill="#2b5d8a"><rect x="44" y="262" width="12" height="12"/><rect x="66" y="262" width="12" height="12"/><rect x="214" y="262" width="12" height="12"/><rect x="242" y="262" width="12" height="20"/></g>
        <g stroke="#1d1d1d" stroke-width="3" stroke-linecap="round"><line x1="145" y1="262" x2="145" y2="278"/><line x1="145" y1="278" x2="138" y2="290"/><line x1="145" y1="278" x2="153" y2="289"/><line x1="145" y1="267" x2="135" y2="258"/><line x1="145" y1="267" x2="155" y2="258"/></g><circle cx="145" cy="255" r="5" fill="#1d1d1d"/>`,

    dustbunnies: () => `<defs><radialGradient id="g3" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#6c3d8f"/><stop offset="1" stop-color="#140c1f"/></radialGradient></defs><rect width="300" height="300" fill="url(#g3)"/>
        <rect width="300" height="60" fill="#0b0712"/><rect y="52" width="300" height="10" fill="#2a1b3a"/><g fill="#0b0712"><rect x="12" y="52" width="14" height="248"/><rect x="274" y="52" width="14" height="248"/></g>` + ground(262, '#3a2650') +
        `<g fill="#bfb3cf"><circle cx="95" cy="225" r="38"/><circle cx="70" cy="240" r="24"/><circle cx="122" cy="240" r="26"/><circle cx="96" cy="196" r="20"/>
        <circle cx="205" cy="232" r="30"/><circle cx="186" cy="246" r="18"/><circle cx="226" cy="246" r="20"/><circle cx="206" cy="210" r="16"/>
        <circle cx="152" cy="252" r="16"/><circle cx="142" cy="258" r="10"/><circle cx="163" cy="259" r="11"/>
        <ellipse cx="84" cy="168" rx="7" ry="22" transform="rotate(-15 84 168)"/><ellipse cx="106" cy="166" rx="7" ry="22" transform="rotate(12 106 166)"/>
        <ellipse cx="198" cy="190" rx="6" ry="17" transform="rotate(-15 198 190)"/><ellipse cx="214" cy="189" rx="6" ry="17" transform="rotate(12 214 189)"/></g>
        <g fill="#ff3b3b"><circle cx="84" cy="218" r="6"/><circle cx="106" cy="218" r="6"/><circle cx="198" cy="226" r="5"/><circle cx="214" cy="226" r="5"/><circle cx="147" cy="252" r="3"/><circle cx="157" cy="252" r="3"/></g>
        <path d="M85 236 l5 6 l5 -6 l5 6 l5 -6" stroke="#140c1f" stroke-width="3" fill="none"/>`,

    teacher: () => `<defs><radialGradient id="g4" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#3b6fd8"/><stop offset="1" stop-color="#0a0f2a"/></radialGradient></defs><rect width="300" height="300" fill="url(#g4)"/>
        <g fill="#7fb2ff" opacity=".18">${Array.from({ length: 30 }, (_, i) => `<rect x="${(i * 53) % 280}" y="${(i * 97) % 280}" width="22" height="8" rx="2"/>`).join('')}</g>
        <path d="M60 300 q0 -70 90 -78 q90 8 90 78 z" fill="#1f2a44"/>
        <rect x="132" y="190" width="36" height="34" fill="#e9b893"/>
        <ellipse cx="150" cy="135" rx="62" ry="72" fill="#f1c39c"/>
        <path d="M88 118 q2 -62 62 -66 q60 4 62 66 q-14 -30 -62 -32 q-48 2 -62 32 z" fill="#6b3b22"/>
        <path d="M112 178 q38 64 76 0 q-6 30 -38 46 q-32 -16 -38 -46 z" fill="#c4512a"/>
        <path d="M128 170 q22 -10 44 0" stroke="#c4512a" stroke-width="8" fill="none" stroke-linecap="round"/>
        <g stroke="#111" stroke-width="5" fill="#bfe3ff"><rect x="96" y="112" width="48" height="34" rx="8"/><rect x="156" y="112" width="48" height="34" rx="8"/></g>
        <line x1="144" y1="124" x2="156" y2="124" stroke="#111" stroke-width="5"/>
        <g fill="#2b5fd0">${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${101 + c * 14}" y="${117 + r * 9}" width="11" height="6" rx="1"/><rect x="${161 + c * 14}" y="${117 + r * 9}" width="11" height="6" rx="1"/>`).join('')).join('')}</g>
        <path d="M134 160 q16 8 32 0" stroke="#8a4a2e" stroke-width="4" fill="none" stroke-linecap="round"/>`,

    socks: () => grad('g5', '#11233b', '#2d6a7a') + stars('#cfe', 5) +
        `<rect x="70" y="150" width="160" height="150" rx="10" fill="#e8edf2"/><rect x="70" y="150" width="160" height="26" rx="6" fill="#c9d3dc"/>
        <circle cx="150" cy="235" r="48" fill="#5d7489"/><circle cx="150" cy="235" r="38" fill="#9fd3e6"/><circle cx="200" cy="163" r="5" fill="#e04848"/>
        <g fill="#f2f2f2" stroke="#d44" stroke-width="3">
          <path d="M60 40 h22 v44 q0 14 -14 14 h-24 q-10 0 -10 -10 q0 -10 10 -10 h16 z" transform="rotate(-20 60 60)"/>
          <path d="M220 60 h22 v44 q0 14 -14 14 h-24 q-10 0 -10 -10 q0 -10 10 -10 h16 z" transform="rotate(25 230 80)"/>
          <path d="M140 70 h20 v40 q0 12 -12 12 h-22 q-9 0 -9 -9 q0 -9 9 -9 h14 z" transform="rotate(8 150 90)"/></g>
        <g fill="#111"><circle cx="62" cy="58" r="3"/><circle cx="72" cy="55" r="3"/><circle cx="226" cy="80" r="3"/><circle cx="236" cy="84" r="3"/><circle cx="146" cy="88" r="3"/><circle cx="155" cy="88" r="3"/></g>
        <path d="M140 150 l-12 -40 M160 150 l12 -40" stroke="#a6f" stroke-width="3" opacity=".6"/>`,

    principal: () => grad('g6', '#f3d27a', '#e08a3a') +
        `<rect y="200" width="300" height="100" fill="#7a4a24"/><rect y="200" width="300" height="10" fill="#5e3818"/>
        <g transform="rotate(-18 210 170)"><rect x="150" y="160" width="150" height="20" fill="#f2c230"/><polygon points="150,160 150,180 128,170" fill="#e8c9a0"/><polygon points="134,167 134,173 128,170" fill="#333"/><rect x="290" y="160" width="20" height="20" fill="#e88"/></g>
        <circle cx="70" cy="150" r="52" fill="#d62c2c"/><path d="M70 100 q6 -16 18 -18" stroke="#5a3" stroke-width="6" fill="none"/>
        <g transform="translate(150 162)"><circle cx="0" cy="0" r="6" fill="#e9b893"/><rect x="-6" y="6" width="12" height="20" fill="#24305e"/><polygon points="-2,7 2,7 1,18 -1,18" fill="#d33"/>
        <line x1="-4" y1="26" x2="-6" y2="38" stroke="#24305e" stroke-width="4"/><line x1="4" y1="26" x2="6" y2="38" stroke="#24305e" stroke-width="4"/>
        <line x1="-6" y1="10" x2="-14" y2="2" stroke="#24305e" stroke-width="3"/><line x1="6" y1="10" x2="14" y2="2" stroke="#24305e" stroke-width="3"/></g>
        <text x="150" y="150" font-size="10" text-anchor="middle" fill="#5e3818">!</text>`,

    laundry: () => grad('g7', '#0f1530', '#3a2a5e') + moon(60, 60, 30) + stars('#fff', 7) + ground(250, '#1b1430') +
        `<path d="M40 260 q20 -70 60 -80 q20 -40 60 -20 q50 -10 70 40 q30 10 30 60 z" fill="#6c8ebf"/>
        <path d="M60 250 q30 -40 60 -30 q30 -30 60 0 q30 0 40 30 z" fill="#c75b7a"/><path d="M110 200 q20 -10 40 4" stroke="#f2e6a0" stroke-width="10" fill="none"/>
        <path d="M70 190 q-30 -40 -10 -90 l8 4 q-12 40 14 80 z" fill="#6c8ebf"/><path d="M230 190 q30 -40 14 -90 l-8 2 q8 44 -16 84 z" fill="#c75b7a"/>
        <g fill="#ffe14d"><circle cx="130" cy="214" r="7"/><circle cx="162" cy="210" r="7"/></g><g fill="#111"><circle cx="131" cy="215" r="3"/><circle cx="163" cy="211" r="3"/></g>`,

    goldfish: () => grad('g8', '#160933', '#3c1a6b') + stars('#fff', 2) +
        `<ellipse cx="230" cy="70" rx="56" ry="14" fill="none" stroke="#e7a33a" stroke-width="5"/><circle cx="230" cy="70" r="32" fill="#c9672c"/><path d="M198 70 a32 32 0 0 0 64 0" fill="none" stroke="#e7a33a" stroke-width="5"/>
        <circle cx="140" cy="190" r="92" fill="#8fd6e8" opacity=".35"/><path d="M48 190 a92 92 0 0 0 184 0 z" fill="#3a9fc0" opacity=".7"/><ellipse cx="140" cy="102" rx="54" ry="10" fill="none" stroke="#bfefff" stroke-width="4"/>
        <ellipse cx="135" cy="190" rx="44" ry="28" fill="#7ccf4a"/><polygon points="176,190 214,164 214,216" fill="#5aa832"/>
        <g stroke="#111" stroke-width="4"><line x1="106" y1="178" x2="118" y2="190"/><line x1="118" y1="178" x2="106" y2="190"/></g>
        <path d="M96 202 q8 6 16 0" stroke="#111" stroke-width="3" fill="none"/><path d="M128 162 q6 -10 14 -2" stroke="#4a8a2a" stroke-width="5" fill="none"/>`,

    pugs: () => grad('g9', '#3b1f54', '#e07a4a') + stars('#fff', 9) +
        `<circle cx="150" cy="320" r="150" fill="#4a2d6a"/>
        <ellipse cx="150" cy="150" rx="88" ry="78" fill="#d9b48a"/><path d="M70 110 q-22 -30 6 -46 q16 10 22 34 z" fill="#3a2a22"/><path d="M230 110 q22 -30 -6 -46 q-16 10 -22 34 z" fill="#3a2a22"/>
        <ellipse cx="150" cy="175" rx="50" ry="40" fill="#3a2a22"/><circle cx="114" cy="140" r="16" fill="#111"/><circle cx="186" cy="140" r="16" fill="#111"/><circle cx="118" cy="135" r="5" fill="#fff"/><circle cx="190" cy="135" r="5" fill="#fff"/>
        <ellipse cx="150" cy="162" rx="14" ry="9" fill="#111"/><path d="M150 172 v12 M132 186 q18 10 36 0" stroke="#111" stroke-width="4" fill="none"/><path d="M146 190 q4 18 8 0" fill="#e06b8b"/>
        <path d="M100 110 q50 -20 100 0" stroke="#b08a62" stroke-width="5" fill="none"/>`,

    locker: () => grad('g10', '#2a2f36', '#12151a') +
        `${[0, 1, 2, 3].map(i => `<rect x="${12 + i * 72}" y="30" width="64" height="250" fill="#3f6fa8" stroke="#2a4d78" stroke-width="3"/>${[0, 1, 2, 3].map(j => `<rect x="${24 + i * 72}" y="${46 + j * 8}" width="40" height="3" fill="#2a4d78"/>`).join('')}`).join('')}
        <rect x="156" y="30" width="64" height="250" fill="#08080c"/><polygon points="220,30 268,46 268,266 220,280" fill="#5b8bc4" stroke="#2a4d78" stroke-width="3"/>
        <g fill="#7dff6a"><ellipse cx="176" cy="120" rx="8" ry="5"/><ellipse cx="200" cy="120" rx="8" ry="5"/></g>
        <path d="M160 230 q30 -20 20 -60 q-6 -20 14 -24" stroke="#6bd15a" stroke-width="12" fill="none" stroke-linecap="round"/>
        <text x="188" y="20" font-size="14" text-anchor="middle" fill="#9ab" font-family="sans-serif">217</text>`,

    mummy: () => grad('g11', '#1d2350', '#d98c4a') + moon(220, 70, 34) +
        `<polygon points="0,300 90,170 180,300" fill="#a3713c"/><polygon points="120,300 220,150 320,300" fill="#8a5c2e"/>
        <rect x="104" y="140" width="92" height="130" rx="20" fill="#9fc4ff"/><g fill="#5a86d6">${[0, 1, 2, 3, 4].map(i => `<rect x="${108 + i * 18}" y="140" width="8" height="130"/>`).join('')}</g>
        <circle cx="150" cy="112" r="38" fill="#e8dcc0"/><g stroke="#c9b993" stroke-width="4">${[0, 1, 2, 3].map(i => `<line x1="114" y1="${92 + i * 12}" x2="186" y2="${98 + i * 12}"/>`).join('')}</g>
        <path d="M112 92 q38 -60 76 0 z" fill="#d23d3d"/><circle cx="196" cy="58" r="9" fill="#fff"/>
        <g fill="#ffcc33"><circle cx="138" cy="112" r="5"/><circle cx="162" cy="112" r="5"/></g>
        <rect x="70" y="160" width="40" height="18" rx="9" fill="#e8dcc0" transform="rotate(-20 90 169)"/><rect x="190" y="160" width="40" height="18" rx="9" fill="#e8dcc0" transform="rotate(20 210 169)"/>`,

    moth: () => grad('g12', '#0b0d1f', '#24264a') + stars('#ccf', 4) +
        `<rect x="40" y="170" width="220" height="130" fill="#3a2f2a"/><polygon points="20,175 150,110 280,175" fill="#2a211d"/><rect x="128" y="220" width="44" height="80" fill="#1a1412"/>
        <circle cx="200" cy="200" r="40" fill="#ffe680" opacity=".25"/><circle cx="200" cy="200" r="11" fill="#fff3a8"/><rect x="196" y="186" width="8" height="6" fill="#555"/>
        <g fill="#c9b48a"><path d="M150 80 q-90 -60 -130 10 q30 50 130 20 z"/><path d="M150 80 q90 -60 130 10 q-30 50 -130 20 z"/></g>
        <g fill="#7a6648"><circle cx="70" cy="80" r="12"/><circle cx="230" cy="80" r="12"/></g><ellipse cx="150" cy="90" rx="10" ry="34" fill="#5a4a34"/>
        <path d="M146 58 q-14 -24 -28 -26 M154 58 q14 -24 28 -26" stroke="#5a4a34" stroke-width="3" fill="none"/>`,

    pigeon: () => grad('g13', '#f2a65a', '#f6d38a') + city('#4d5566', '#ffe7a3', 20) +
        `<ellipse cx="150" cy="170" rx="70" ry="60" fill="#8d97a8"/><circle cx="150" cy="100" r="38" fill="#7d879a"/><path d="M118 130 q32 18 64 0 q-2 20 -32 26 q-30 -6 -32 -26z" fill="#4fa38a"/>
        <circle cx="160" cy="92" r="9" fill="#ffb347"/><circle cx="162" cy="92" r="4" fill="#111"/><polygon points="184,100 206,106 184,112" fill="#e6a23a"/>
        <rect x="76" y="140" width="36" height="70" rx="10" fill="#c7313d" transform="rotate(20 94 175)"/><text x="150" y="196" font-size="30" text-anchor="middle" font-family="Bangers, sans-serif" fill="#f2f2f2">P</text>
        <g transform="rotate(-25 214 122)"><rect x="204" y="96" width="9" height="46" fill="#f4c542"/><rect x="216" y="100" width="9" height="42" fill="#f4c542"/></g>
        <path d="M130 228 l-6 22 M170 228 l6 22" stroke="#e6a23a" stroke-width="5"/>`,

    bathtub: () => grad('g14', '#5fc3e4', '#0d3a6e') +
        `${[30, 80, 140, 210, 260].map((x, i) => `<circle cx="${x}" cy="${250 - i * 37}" r="${5 + i % 3 * 3}" fill="none" stroke="#bfefff" stroke-width="2"/>`).join('')}
        <ellipse cx="160" cy="70" rx="110" ry="58" fill="#ffd23a"/><circle cx="90" cy="30" r="34" fill="#ffd23a"/><polygon points="50,40 20,48 50,54" fill="#f08a24"/>
        <path d="M60 80 q100 40 200 0" stroke="#e8b81a" stroke-width="6" fill="none"/>
        <g transform="translate(150 220)"><ellipse cx="0" cy="0" rx="46" ry="18" fill="#c9c9c9"/><rect x="-10" y="-30" width="20" height="16" fill="#aaa"/><rect x="2" y="-46" width="4" height="18" fill="#888"/>
        <g fill="#ffe680"><circle cx="-22" cy="0" r="5"/><circle cx="0" cy="0" r="5"/><circle cx="22" cy="0" r="5"/></g></g>
        <polygon points="150,200 110,120 190,120" fill="#ffe680" opacity=".25"/>`,

    wifi: () => grad('g15', '#3a0f1f', '#d8442c') +
        `<g fill="none" stroke="#f6e7c1" stroke-width="16" stroke-linecap="round"><path d="M70 120 a110 110 0 0 1 160 0"/><path d="M98 150 a70 70 0 0 1 104 0"/><path d="M126 178 a30 30 0 0 1 48 0"/></g>
        <circle cx="150" cy="200" r="11" fill="#f6e7c1"/><g stroke="#ff2a2a" stroke-width="18" stroke-linecap="round"><line x1="80" y1="70" x2="220" y2="210"/><line x1="220" y1="70" x2="80" y2="210"/></g>
        <g fill="#1a0a10">${[20, 60, 100, 140, 180, 220, 260].map((x, i) => `<circle cx="${x}" cy="${248 + (i % 2) * 6}" r="13"/><rect x="${x - 15}" y="${260 + (i % 2) * 6}" width="30" height="50" rx="10"/>`).join('')}</g>
        <g fill="#7fd0ff">${[20, 100, 180, 260].map(x => `<rect x="${x - 6}" y="262" width="12" height="9" rx="2"/>`).join('')}</g>`,

    carpet: () => grad('g16', '#2a1236', '#592a6e') +
        `<polygon points="0,0 80,60 80,240 0,300" fill="#3a1a48"/><polygon points="300,0 220,60 220,240 300,300" fill="#3a1a48"/><rect x="80" y="60" width="140" height="180" fill="#1a0a22"/><rect x="128" y="120" width="44" height="120" fill="#4a2a10"/>
        <path d="M0 300 L0 230 q40 -90 90 -40 q20 -60 60 -20 q30 -70 70 -10 q40 -40 80 40 L300 300 z" fill="#c4692a"/>
        <g stroke="#e8954a" stroke-width="3">${Array.from({ length: 40 }, (_, i) => `<line x1="${(i * 29) % 300}" y1="${245 + (i * 13) % 50}" x2="${(i * 29) % 300 + 4}" y2="${235 + (i * 13) % 50}"/>`).join('')}</g>
        <g fill="#fff"><ellipse cx="120" cy="215" rx="12" ry="8"/><ellipse cx="160" cy="210" rx="12" ry="8"/></g><g fill="#111"><circle cx="124" cy="216" r="4"/><circle cx="164" cy="211" r="4"/></g>`,

    rutabaga: () => grad('g17', '#0f2a14', '#3a1a5a') + city('#0b130d', '#b6ff6a') +
        `<circle cx="150" cy="140" r="110" fill="#b6ff6a" opacity=".12"/>
        <path d="M150 230 q-80 -10 -80 -80 q0 -60 80 -66 q80 6 80 66 q0 70 -80 80z" fill="#9b5fc0"/><path d="M90 150 q60 20 120 0 q0 60 -60 78 q-60 -18 -60 -78z" fill="#e8d6a0"/>
        <path d="M150 84 q-30 -50 -10 -70 M150 84 q0 -60 20 -76 M150 84 q30 -40 50 -44" stroke="#4fbf3a" stroke-width="10" fill="none" stroke-linecap="round"/>
        <g fill="#111"><circle cx="128" cy="140" r="8"/><circle cx="172" cy="140" r="8"/></g><path d="M126 176 q24 -14 48 0" stroke="#111" stroke-width="5" fill="none"/>
        <g fill="#ffe14d" transform="translate(240 40)"><circle r="20" fill="#111"/><path d="M0 0 L-17 -10 A20 20 0 0 1 17 -10 Z M0 0 L17 -10 A20 20 0 0 1 0 20 Z" opacity="0"/><circle r="5"/>
        <path d="M0 -6 L-8 -18 A20 20 0 0 1 8 -18 Z"/><path d="M5 3 L19 4 A20 20 0 0 1 11 17 Z"/><path d="M-5 3 L-11 17 A20 20 0 0 1 -19 4 Z"/></g>`,

    blob: () => grad('g18', '#1c2a1c', '#0a120a') +
        `<rect y="230" width="300" height="70" fill="#6b4423"/><rect y="230" width="300" height="10" fill="#523318"/>
        <path d="M40 240 q-10 -110 60 -140 q50 -30 100 0 q70 30 60 140 z" fill="#5ee05a" opacity=".9"/>
        <g transform="rotate(-12 120 170)"><rect x="96" y="150" width="50" height="64" fill="#fff"/>${[0, 1, 2, 3, 4].map(i => `<line x1="102" y1="${162 + i * 10}" x2="140" y2="${162 + i * 10}" stroke="#8ab" stroke-width="2"/>`).join('')}<text x="121" y="160" font-size="9" text-anchor="middle" fill="#d33" font-family="sans-serif">A+</text></g>
        <g transform="rotate(14 190 190)"><rect x="168" y="170" width="44" height="56" fill="#fff"/>${[0, 1, 2, 3].map(i => `<line x1="174" y1="${182 + i * 10}" x2="206" y2="${182 + i * 10}" stroke="#8ab" stroke-width="2"/>`).join('')}</g>
        <g fill="#fff"><circle cx="130" cy="120" r="14"/><circle cx="178" cy="114" r="18"/></g><g fill="#111"><circle cx="134" cy="122" r="6"/><circle cx="182" cy="118" r="8"/></g>
        <path d="M30 240 q8 -14 20 0 M250 240 q10 -16 20 0" fill="#5ee05a"/>`,

    grandma: () => grad('g19', '#5a2a6e', '#e889b5') + stars('#fff', 6) +
        `<rect x="95" y="150" width="110" height="120" rx="14" fill="#9aa4b4"/><g stroke="#6c7686" stroke-width="3">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M100 ${160 + i * 18} l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8" fill="none"/>`).join('')}</g>
        <rect x="105" y="60" width="90" height="80" rx="14" fill="#c0c8d4"/><circle cx="150" cy="44" r="26" fill="#e6e6ee"/><circle cx="128" cy="36" r="14" fill="#e6e6ee"/><circle cx="172" cy="36" r="14" fill="#e6e6ee"/>
        <g fill="none" stroke="#333" stroke-width="4"><circle cx="130" cy="96" r="14"/><circle cx="170" cy="96" r="14"/><line x1="144" y1="96" x2="156" y2="96"/></g>
        <g fill="#ff4d6d"><circle cx="130" cy="96" r="6"/><circle cx="170" cy="96" r="6"/></g><rect x="130" y="120" width="40" height="8" rx="3" fill="#555"/>
        <g stroke="#ffd23a" stroke-width="5" stroke-linecap="round"><line x1="70" y1="150" x2="140" y2="220"/><line x1="230" y1="150" x2="160" y2="220"/></g>
        <circle cx="150" cy="226" r="14" fill="#d23d6d"/><line x1="150" y1="58" x2="150" y2="20" stroke="#aaa" stroke-width="3"/><circle cx="150" cy="18" r="5" fill="#ff4d6d"/>`,

    loop: () => grad('g20', '#06121f', '#183a5a') + city('#030a12', '#4ad0ff') +
        `<g fill="none" stroke-linecap="round"><circle cx="150" cy="120" r="90" stroke="#4ad0ff" stroke-width="10" stroke-dasharray="120 30"/>
        <circle cx="150" cy="120" r="60" stroke="#ff4dd2" stroke-width="10" stroke-dasharray="80 24"/><circle cx="150" cy="120" r="30" stroke="#ffe14d" stroke-width="10" stroke-dasharray="40 16"/></g>
        <g fill="#4ad0ff"><polygon points="232,96 252,120 222,124"/></g><g fill="#ff4dd2"><polygon points="196,82 214,100 188,108"/></g>
        <rect x="110" y="190" width="80" height="54" rx="4" fill="#20262e"/><rect x="116" y="196" width="68" height="40" fill="#0b6aa8"/><rect x="100" y="244" width="100" height="8" rx="3" fill="#3a434e"/>
        <circle cx="150" cy="216" r="11" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="40 30"/>`,
};

// ---------- the posters ----------
// page: poster background; title / tagline: text colours; badge: [background, text].
export const POSTERS = [
    { id: 'hamster', title: 'Attack of the 50-Foot Hamster', tagline: 'He ate the science fair. Now he wants the city.', badge: 'NOW SHOWING', page: '#140d2e', title_c: '#ffd23a', tag_c: '#f3e8ff', badge_c: ['#e2553f', '#fff'] },
    { id: 'waffles', title: 'Earth vs. the Flying Waffles', tagline: 'Breakfast is OVER.', badge: 'IN 3-D!', page: '#0d3b45', title_c: '#f6d046', tag_c: '#fff8d6', badge_c: ['#d9902f', '#1d1d1d'] },
    { id: 'dustbunnies', title: 'Dawn of the Dust Bunnies', tagline: 'Never. Look. Under. The. Bed.', badge: 'RATED G FOR GROSS', page: '#120a1c', title_c: '#ff5a5a', tag_c: '#d9cde8', badge_c: ['#bfb3cf', '#140c1f'] },
    { id: 'teacher', title: 'The Teacher Who Saw Every Tab', tagline: 'His glasses see EVERYTHING. His goatee knows the rest.', badge: 'SAVE YOUR WORK!', page: '#08102a', title_c: '#ff8a3d', tag_c: '#dbe7ff', badge_c: ['#ffd23a', '#08102a'] },
    { id: 'socks', title: 'Invasion of the Sock Snatchers', tagline: 'Where do the missing ones go? Now we know.', badge: 'COMING SOON', page: '#0c1a2b', title_c: '#ff6b6b', tag_c: '#e2f1ff', badge_c: ['#a6f', '#fff'] },
    { id: 'principal', title: 'The Incredible Shrinking Principal', tagline: 'Detention has never been smaller.', badge: 'HELD OVER!', page: '#3a1d0a', title_c: '#ffd86b', tag_c: '#ffe9c7', badge_c: ['#d62c2c', '#fff'] },
    { id: 'laundry', title: 'Night of the Living Laundry', tagline: 'The pile is MOVING.', badge: 'ONE NIGHT ONLY', page: '#0b0f22', title_c: '#ffe14d', tag_c: '#dcd6ff', badge_c: ['#c75b7a', '#fff'] },
    { id: 'goldfish', title: 'Zombie Goldfish from Planet Z', tagline: 'Three-second memory. Infinite hunger.', badge: 'IN 3-D!', page: '#12072a', title_c: '#7ccf4a', tag_c: '#e6dcff', badge_c: ['#e7a33a', '#12072a'] },
    { id: 'pugs', title: 'Planet of the Pugs', tagline: 'They snort. They snore. They RULE.', badge: 'NOW SHOWING', page: '#24123a', title_c: '#ffb347', tag_c: '#ffe7d1', badge_c: ['#e07a4a', '#fff'] },
    { id: 'locker', title: 'The Thing in the Gym Locker', tagline: 'Nobody has opened #217 since 1987.', badge: 'SEE IT IF YOU DARE', page: '#0e1114', title_c: '#7dff6a', tag_c: '#d6e2ee', badge_c: ['#3f6fa8', '#fff'] },
    { id: 'mummy', title: "Curse of the Mummy's Pajamas", tagline: 'Wrapped for bedtime. Wrapped for TERROR.', badge: 'COMING SOON', page: '#161a3a', title_c: '#ffcc33', tag_c: '#f3e9d2', badge_c: ['#5a86d6', '#fff'] },
    { id: 'moth', title: 'Mega-Moth vs. the Porch Light', tagline: 'One light. One moth. Ten stories tall.', badge: 'FREE POPCORN', page: '#08091a', title_c: '#fff3a8', tag_c: '#d8d2c2', badge_c: ['#c9b48a', '#08091a'] },
    { id: 'pigeon', title: 'I Was a Teenage Pigeon', tagline: 'He came for the french fries. He stayed for revenge.', badge: 'NOW SHOWING', page: '#3a2412', title_c: '#ffe7a3', tag_c: '#fff1dc', badge_c: ['#c7313d', '#fff'] },
    { id: 'bathtub', title: '20,000 Leagues Under the Bathtub', tagline: 'The rubber duck knows too much.', badge: 'IN SMELL-O-VISION', page: '#082b4a', title_c: '#ffd23a', tag_c: '#d8f3ff', badge_c: ['#f08a24', '#fff'] },
    { id: 'wifi', title: 'The Day the Wi-Fi Stood Still', tagline: 'No signal. No escape.', badge: 'ONE NIGHT ONLY', page: '#1e0710', title_c: '#ff4a3a', tag_c: '#f6e7c1', badge_c: ['#f6e7c1', '#1e0710'] },
    { id: 'carpet', title: 'Beware the Creeping Carpet', tagline: 'Shag has never been this scary.', badge: 'HELD OVER!', page: '#1a0a22', title_c: '#ff9a4a', tag_c: '#f0dcff', badge_c: ['#c4692a', '#fff'] },
    { id: 'rutabaga', title: 'Return of the Radioactive Rutabaga', tagline: 'Eat your vegetables… before they eat YOU.', badge: 'COMING SOON', page: '#081a0c', title_c: '#b6ff6a', tag_c: '#e8f7dc', badge_c: ['#9b5fc0', '#fff'] },
    { id: 'blob', title: 'The Blob That Ate My Homework', tagline: "It's not an excuse. It's a WARNING.", badge: 'NOW SHOWING', page: '#0a120a', title_c: '#5ee05a', tag_c: '#e2f5df', badge_c: ['#fff', '#0a120a'] },
    { id: 'grandma', title: 'Robot Grandma 3000', tagline: "She's knitting a sweater. Out of STEEL.", badge: 'IN 3-D!', page: '#2e1238', title_c: '#ff8fc4', tag_c: '#f8e6ff', badge_c: ['#ffd23a', '#2e1238'] },
    { id: 'loop', title: 'Attack of the Infinite Loop', tagline: 'It never ends. It never ends. It never ends.', badge: 'HELD OVER… FOREVER', page: '#040c16', title_c: '#4ad0ff', tag_c: '#dff4ff', badge_c: ['#ff4dd2', '#fff'] },
];

export function artSVG(id) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${ART[id]()}</svg>`;
}

// "Film stills" for rounds with a row of pictures: crops of the same picture (in the
// picture's 300 × 300 units). Each still is drawn cover-style inside its crop.
export const STILLS = [
    { x: 0, y: 0, w: 300, h: 300 },
    { x: 60, y: 20, w: 180, h: 180 },
    { x: 100, y: 120, w: 180, h: 180 },
];
