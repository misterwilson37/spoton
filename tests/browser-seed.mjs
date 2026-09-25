import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { as, clearFirestore } from './emu.mjs';
await clearFirestore();
const o = as('owner');
const t = d => Timestamp.fromMillis(Date.UTC(2026, 8, d));
let n = 0;
const put = (d) => setDoc(doc(o.db, 'scores', `s${n++}`), d);
for (let i = 0; i < 120; i++) await put({ gameId: 'find-the-center', initials: 'TOP', score: 1000 - i, uid: `top${i}`, timestamp: t(10) });
await put({ gameId: 'find-the-center', initials: 'LOW', score: 3, uid: 'low', timestamp: t(11) });       // rank 121
await put({ gameId: 'find-the-center', initials: '=1+', score: 2, uid: 'evil', timestamp: t(11), flagged: true });
for (const [ini, sec] of [['FST', 42], ['MID', 95], ['SLW', 200]]) await put({ gameId: 'ft-basic-speed', initials: ini, score: sec, uid: `ft${ini}`, timestamp: t(12) });
await setDoc(doc(o.db, 'players', 'low'), { email: 'low.student@stu.test', lastPlayed: t(11) });
await setDoc(doc(o.db, 'players', 'ftFST'), { email: 'fast@stu.test', lastPlayed: t(12) });
await setDoc(doc(o.db, 'site-config', 'main'), { title: 'Spot On!' });
for (const [ini, streak] of [['STK', 7], ['TOP', 12]]) await put({ gameId: 'ft-streak', initials: ini, score: streak, uid: `st${ini}`, timestamp: t(12) });
const IMG = 'data:image/png;base64,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';
for (let i = 0; i < 3; i++) await setDoc(doc(o.db, 'picture-perfect-images', `img${i}`), { name: `Test ${i}`, imageUrl: IMG });
console.log('seeded', n);
process.exit(0);
