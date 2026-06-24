export function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export interface PlanTask {
  id: string;
  priority: 'high' | 'med' | 'low';
  label: string;
  title: string;
  desc: string;
}

export const TODAY_TASKS: PlanTask[] = [
  { id: 'usdt', priority: 'high', label: 'DO TODAY', title: 'Set up USDT wallet', desc: 'Download Binance → create account → get wallet address. Unlocks international clients forever.' },
  { id: 'pitch-target', priority: 'high', label: 'DO TODAY', title: 'Pick 1 UB business to pitch', desc: "Instagram → find a local brand whose content looks weak → screenshot their worst reel → that's your target." },
  { id: 'sample-reel', priority: 'high', label: 'DO TODAY', title: 'Make 1 free sample reel for them', desc: 'Stock footage + CapCut + your hook text. 30-40 min. Done beats perfect.' },
  { id: 'pitch-dm', priority: 'high', label: 'DO TODAY', title: 'Send the pitch DM', desc: '"Сайн байна уу, танай брэндэд зориулж нэг хийл хийж үзлээ. Үзэх үү?" + attach reel.' },
  { id: 'trade-journal', priority: 'med', label: 'THIS WEEK', title: 'Open trading journal spreadsheet', desc: 'Google Sheets: Date / Setup type / Entry reason / Result / Lesson. Log every demo trade.' },
  { id: 'fiverr-price', priority: 'med', label: 'THIS WEEK', title: 'Update Fiverr price to $25', desc: 'Log in → edit gig → change price. Takes 2 min.' },
  { id: 'payday-reminder', priority: 'med', label: 'SET REMINDER', title: 'Set payday savings reminder', desc: 'Phone alarm on 5th + 20th every month: "Transfer 500K₮ to savings NOW before spending."' },
  { id: 'read-goals', priority: 'low', label: '', title: 'Read your 3 goals (2 min)', desc: '1) Apartment down payment  2) 3 retainer clients  3) Demo trading profitable. Read every morning.' },
];

export const SCHEDULE = [
  { section: 'MORNING', slots: [
    { time: '6:30', color: '#9ca3af', title: 'Wake up', detail: 'No phone for 10 min. Water. Brush teeth. Wash face.' },
    { time: '6:45', color: '#22c55e', title: '20 pushups + 20 squats + stretch', detail: '15 min. You sit all day. This keeps your brain sharp.' },
    { time: '7:00', color: '#eab308', title: 'Read your 3 goals — 2 min', detail: 'Written on paper near desk: apartment, 3 clients, profitable trading. Every single morning.' },
    { time: '7:10', color: '#ec4899', title: 'Family breakfast', detail: 'Eat with wife. Hold daughter. No phone at table.' },
    { time: '7:45', color: '#9ca3af', title: 'Commute — no doom scrolling', detail: 'Music or relevant YouTube. Thinking time. Not TikTok.' },
  ]},
  { section: 'WORK', slots: [
    { time: '8:00', color: '#3b82f6', title: 'Main job — full focus', detail: "Do your job well. 3M₮/month foundation. Don't half-ass it. Protect this until side income = 3x salary for 3 months." },
    { time: '13:00', color: '#eab308', title: 'Lunch — 10 min pitch planning', detail: 'While eating: find 1 business to pitch tonight or reply to client messages.' },
    { time: '17:00', color: '#9ca3af', title: 'Commute home — decompress', detail: 'Do NOT think about work. Arrive as husband and father first.' },
  ]},
  { section: 'EVENING — MONEY HOURS', slots: [
    { time: '18:00', color: '#ec4899', title: 'Dinner + family (1 hr)', detail: "Eat. Be present. Talk to wife. Hold daughter. This is what you're working for." },
    { time: '19:00', color: '#FF4D26', title: 'Side income block — 90 min', detail: 'Mon/Wed/Fri → Create: edit reel, make thumbnail, deliver\nTue/Thu → Pitch: DM 1 business, follow up, write captions\nOne deliverable per session. Don\'t multitask.' },
    { time: '20:30', color: '#a855f7', title: 'Trading journal — 30 min', detail: 'Demo only. 2-3 trades. Log every one: what did you see, why enter, result, lesson. DEMO ONLY.' },
    { time: '21:00', color: '#ec4899', title: 'Wind down — sleep by 22:00', detail: 'No screens after 21:30. Sleep-deprived Delger makes bad decisions.' },
  ]},
  { section: 'WEEKEND', slots: [
    { time: 'SAT 9', color: '#FF4D26', title: 'Deep work — 4 hours', detail: 'Batch client work, build portfolio, or learn one new skill. Full focus.' },
    { time: 'SAT 1P', color: '#eab308', title: 'Weekly review — 45 min', detail: "Check savings. Count clients. Review trading journal. 3 sentences: what worked, what didn't, what changes." },
    { time: 'SUN', color: '#ec4899', title: 'Full family day — zero work', detail: 'Your wife carries a newborn while you build. She needs this. You need this.' },
  ]},
];

export const WEEKLY_DAYS = [
  { day: 'MONDAY', focus: 'DELIVER', focusColor: '#fb923c', focusBg: 'rgba(249,115,22,0.15)',
    tasks: [{ id: 'mon-1', text: 'Deliver any client work due this week' }, { id: 'mon-2', text: 'Log demo trades in journal' }] },
  { day: 'TUESDAY', focus: 'PITCH', focusColor: '#4ade80', focusBg: 'rgba(34,197,94,0.15)',
    tasks: [{ id: 'tue-1', text: 'Send 1 cold DM to new UB business' }, { id: 'tue-2', text: 'Follow up on unanswered pitches' }] },
  { day: 'WEDNESDAY', focus: 'CREATE', focusColor: '#fb923c', focusBg: 'rgba(249,115,22,0.15)',
    tasks: [{ id: 'wed-1', text: 'Edit at least 1 reel or 2 thumbnails' }, { id: 'wed-2', text: 'Write caption text for pending content' }] },
  { day: 'THURSDAY', focus: 'GROW', focusColor: '#60a5fa', focusBg: 'rgba(59,130,246,0.15)',
    tasks: [{ id: 'thu-1', text: '1 pitch OR ask client for referral' }, { id: 'thu-2', text: 'Check trading journal — any pattern?' }] },
  { day: 'FRIDAY', focus: 'WRAP', focusColor: '#fbbf24', focusBg: 'rgba(234,179,8,0.15)',
    tasks: [{ id: 'fri-1', text: 'Invoice any clients who owe payment' }, { id: 'fri-2', text: "Deliver all week's work — zero carry-over" }] },
  { day: 'SATURDAY', focus: 'DEEP WORK', focusColor: '#c084fc', focusBg: 'rgba(168,85,247,0.15)',
    tasks: [{ id: 'sat-1', text: '4hr deep work block' }, { id: 'sat-2', text: 'Weekly review: savings, clients, trades' }, { id: 'sat-3', text: 'Transfer savings if payday was this week' }] },
  { day: 'SUNDAY', focus: 'FAMILY', focusColor: '#f472b6', focusBg: 'rgba(236,72,153,0.15)',
    tasks: [{ id: 'sun-1', text: 'Zero work. Full day with wife and daughter.' }] },
];

export const WEEKLY_HARD_NUMBERS = [
  'Pitches sent: minimum 2',
  'Reels/content delivered: minimum 2',
  'Trades logged: minimum 10',
  'Payday week: transfer 500K₮+ immediately',
];

export const MONTHLY = [
  { label: 'Month 1', target: '4–4.5M₮/mo', color: '#ef4444',
    items: ['USDT wallet live and tested', 'Fiverr updated to $25', '4 pitches sent (1 per week)', '1 free sample reel sent to target business', 'Trading journal started — 40+ trades', '1M₮ transferred to savings'],
    fail: 'No pitches sent, no USDT set up' },
  { label: 'Month 2', target: '4.5–5.5M₮/mo', color: '#f97316',
    items: ['First retainer client signed (600K₮+/mo)', 'First month delivered on time', '4 more pitches this month', '1.2M₮ saved this month'],
    fail: 'No retainer, stopped pitching' },
  { label: 'Month 3', target: '5.5–6.5M₮/mo', color: '#eab308',
    items: ['2nd retainer client signed', 'First international thumbnail via USDT', 'Ask 1 client for a referral', 'Savings total: 3M₮+ accumulated'],
    fail: 'Only 1 retainer, no international payment' },
  { label: 'Month 6', target: '7–9M₮/mo', color: '#22c55e',
    items: ['3 retainer clients all paying consistently', 'Side income alone: 4–6M₮/month', 'Savings: 8–10M₮ total', 'Trading: 200+ trades logged, know win rate'],
    fail: 'Side income under 2M₮/month' },
  { label: 'Month 12', target: '10–13M₮/mo', color: '#3b82f6',
    items: ['Savings total 20M₮+', '4–5 clients (local + international)', 'First prop firm evaluation attempted', 'Side income = salary or more', 'Know target apartment + mortgage requirements'],
    fail: 'Under 3 clients, savings under 12M₮' },
  { label: 'Month 18', target: '13–17M₮/mo', color: '#a855f7',
    items: ['Savings 30M₮ — down payment ready', 'First prop payout received', '5+ stable clients for 3 months straight', 'Begin apartment mortgage process'],
    fail: 'Savings under 20M₮' },
  { label: 'Month 24', target: '400–470M₮ cumulative', color: '#6b7280',
    items: ['Apartment mortgage signed', 'Side income 2x+ salary every month', 'Multiple prop trading payouts', 'Family in own home. Cycle breaking.'],
    fail: 'Still in borrowed room, no clear exit' },
];

export const YEARLY = [
  { year: 'YEAR 1 — BUILD & PROVE', sub: 'Age 22–23 · Nothing comfortable, everything moving', color: '#ef4444',
    items: ['Sign 3 retainer clients at 700–900K₮/month', 'Fix international payments via USDT', 'Log 500+ demo trades — know win rate', 'Save 12–18M₮ total', 'Build portfolio: 20+ pieces with real results'],
    milestone: 'End Y1: 3 clients · 15M₮ saved · real trading data', milestoneColor: '#f87171', milestoneBg: 'rgba(239,68,68,0.12)' },
  { year: 'YEAR 2 — SCALE & MOVE', sub: 'Age 23–24 · Stop surviving, start winning', color: '#22c55e',
    items: ['Hit 30M₮ savings — down payment locked', 'Side income exceeds salary every month', 'First prop trading payout', 'Apartment mortgage application submitted'],
    milestone: 'End Y2: Own apartment signed. Financial cycle breaking.', milestoneColor: '#4ade80', milestoneBg: 'rgba(34,197,94,0.12)' },
  { year: 'YEAR 3 — COMPOUND', sub: 'Age 24–25 · Building from your own home', color: '#3b82f6',
    items: ['Family in own apartment', 'Side income covers mortgage + living', 'Savings pivot to Harrier 65 (45M₮)', 'Multiple prop funded accounts'],
    milestone: 'End Y3: Harrier savings building · 3 income streams proven', milestoneColor: '#60a5fa', milestoneBg: 'rgba(59,130,246,0.12)' },
  { year: 'YEAR 4–5 — FREEDOM', sub: "Age 25–27 · This is what you're working toward", color: '#eab308',
    items: ['Toyota Harrier 65 purchased', '15–20M₮/month across all streams', 'Daughter starting school — stable home, car, income', 'Job is now optional. You choose.'],
    milestone: 'Year 5: The life you described. Built from a borrowed room at 22.', milestoneColor: '#fbbf24', milestoneBg: 'rgba(234,179,8,0.12)' },
];
