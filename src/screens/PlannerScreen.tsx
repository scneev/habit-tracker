import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/AppContext';
import { getColors } from '../utils/theme';
import { MONO, NUMS } from '../utils/fonts';
import { today } from '../utils/dateUtils';

type PlanTab = 'today' | 'schedule' | 'weekly' | 'monthly' | 'yearly' | 'savings';

const PLAN_TABS: { id: PlanTab; label: string }[] = [
  { id: 'today', label: 'TODAY' },
  { id: 'schedule', label: 'DAILY' },
  { id: 'weekly', label: 'WEEKLY' },
  { id: 'monthly', label: 'MONTHLY' },
  { id: 'yearly', label: 'YEARLY' },
  { id: 'savings', label: 'SAVINGS' },
];

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const TODAY_TASKS = [
  { id: 'usdt', priority: 'high', label: 'DO TODAY', title: 'Set up USDT wallet', desc: 'Download Binance → create account → get wallet address. Unlocks international clients forever.' },
  { id: 'pitch-target', priority: 'high', label: 'DO TODAY', title: 'Pick 1 UB business to pitch', desc: "Instagram → find a local brand whose content looks weak → screenshot their worst reel → that's your target." },
  { id: 'sample-reel', priority: 'high', label: 'DO TODAY', title: 'Make 1 free sample reel for them', desc: 'Stock footage + CapCut + your hook text. 30-40 min. Done beats perfect.' },
  { id: 'pitch-dm', priority: 'high', label: 'DO TODAY', title: 'Send the pitch DM', desc: '"Сайн байна уу, танай брэндэд зориулж нэг хийл хийж үзлээ. Үзэх үү?" + attach reel.' },
  { id: 'trade-journal', priority: 'med', label: 'THIS WEEK', title: 'Open trading journal spreadsheet', desc: 'Google Sheets: Date / Setup type / Entry reason / Result / Lesson. Log every demo trade.' },
  { id: 'fiverr-price', priority: 'med', label: 'THIS WEEK', title: 'Update Fiverr price to $25', desc: 'Log in → edit gig → change price. Takes 2 min.' },
  { id: 'payday-reminder', priority: 'med', label: 'SET REMINDER', title: 'Set payday savings reminder', desc: 'Phone alarm on 5th + 20th every month: "Transfer 500K₮ to savings NOW before spending."' },
  { id: 'read-goals', priority: 'low', label: '', title: 'Read your 3 goals (2 min)', desc: '1) Apartment down payment  2) 3 retainer clients  3) Demo trading profitable. Read every morning.' },
];

const SCHEDULE = [
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

const WEEKLY_DAYS = [
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

const MONTHLY = [
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

const YEARLY = [
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

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const [tab, setTab] = useState<PlanTab>('today');
  const { state, dispatch } = useAppStore();
  const c = getColors(state.isDark);
  const t = today();
  const weekKey = getWeekKey(t);

  const todayChecked = state.planTodayChecked[t] ?? [];
  const weeklyChecked = state.planWeeklyChecked[weekKey] ?? [];
  const apSav = state.planApartmentSav;
  const carSav = state.planCarSav;
  const apPct = Math.min(100, Math.round((apSav / 30) * 100));
  const carPct = Math.min(100, Math.round((carSav / 45) * 100));

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: c.muted, fontFamily: MONO }]}>your roadmap</Text>
        <Text style={[styles.title, { color: c.text }]}>PLANNER.</Text>
      </View>

      {/* Sub-tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {PLAN_TABS.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tabBtn, { backgroundColor: tab === id ? c.accent : c.surface }]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabTxt, { color: tab === id ? c.cream : c.muted, fontFamily: MONO }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─── TODAY ──────────────────────────────── */}
        {tab === 'today' && (
          <>
            <View style={[styles.progressCard, { backgroundColor: c.surface }]}>
              <View style={styles.progressRow}>
                <Text style={[styles.progLabel, { color: c.muted, fontFamily: MONO }]}>{todayChecked.length} / {TODAY_TASKS.length} done</Text>
                <Text style={[styles.progLabel, { color: c.accent, fontFamily: MONO }]}>{Math.round((todayChecked.length / TODAY_TASKS.length) * 100)}%</Text>
              </View>
              <View style={[styles.progTrack, { backgroundColor: c.surface2 }]}>
                <View style={[styles.progFill, { backgroundColor: c.accent, width: `${(todayChecked.length / TODAY_TASKS.length) * 100}%` as any }]} />
              </View>
            </View>

            {TODAY_TASKS.map((task) => {
              const checked = todayChecked.includes(task.id);
              const pColor = task.priority === 'high' ? '#ef4444' : task.priority === 'med' ? '#f97316' : c.muted;
              const pBg = task.priority === 'high' ? 'rgba(239,68,68,0.15)' : task.priority === 'med' ? 'rgba(249,115,22,0.15)' : 'transparent';
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskCard, { backgroundColor: c.surface, opacity: checked ? 0.4 : 1 }]}
                  onPress={() => dispatch({ type: 'PLAN_TODAY_TOGGLE', payload: { date: t, id: task.id } })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.checkbox, { borderColor: checked ? '#22c55e' : c.border, backgroundColor: checked ? '#22c55e' : 'transparent' }]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    {!!task.label && (
                      <View style={[styles.priorityBadge, { backgroundColor: pBg }]}>
                        <Text style={[styles.priorityTxt, { color: pColor, fontFamily: MONO }]}>{task.label}</Text>
                      </View>
                    )}
                    <Text style={[styles.taskTitle, { color: c.text, fontFamily: MONO }]}>{task.title}</Text>
                    <Text style={[styles.taskDesc, { color: c.muted }]}>{task.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.goalsCard, { backgroundColor: c.cream }]}>
              <Text style={[styles.goalsCardLabel, { color: 'rgba(20,22,27,0.5)', fontFamily: MONO }]}>3 GOALS — READ EVERY MORNING</Text>
              <Text style={[styles.goalsCardItem, { color: c.bg, fontFamily: MONO }]}>1. Apartment down payment (30M₮)</Text>
              <Text style={[styles.goalsCardItem, { color: c.bg, fontFamily: MONO }]}>2. 3 retainer clients signed</Text>
              <Text style={[styles.goalsCardItem, { color: c.bg, fontFamily: MONO }]}>3. Demo trading profitable</Text>
            </View>
          </>
        )}

        {/* ─── SCHEDULE ───────────────────────────── */}
        {tab === 'schedule' && (
          <>
            {SCHEDULE.map((sec) => (
              <View key={sec.section}>
                <Text style={[styles.sectionLabel, { color: c.muted, borderBottomColor: c.border, fontFamily: MONO }]}>{sec.section}</Text>
                {sec.slots.map((slot, i) => (
                  <View key={i} style={[styles.slotCard, { backgroundColor: c.surface }]}>
                    <Text style={[styles.slotTime, { color: c.dim, fontFamily: MONO }]}>{slot.time}</Text>
                    <View style={[styles.slotBar, { backgroundColor: slot.color }]} />
                    <View style={styles.slotBody}>
                      <Text style={[styles.slotTitle, { color: c.text, fontFamily: MONO }]}>{slot.title}</Text>
                      <Text style={[styles.slotDetail, { color: c.muted }]}>{slot.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {/* ─── WEEKLY ─────────────────────────────── */}
        {tab === 'weekly' && (
          <>
            {WEEKLY_DAYS.map((day) => (
              <View key={day.day} style={[styles.weekCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.weekDayName, { color: c.text, fontFamily: MONO }]}>{day.day}</Text>
                <View style={[styles.focusBadge, { backgroundColor: day.focusBg }]}>
                  <Text style={[styles.focusTxt, { color: day.focusColor, fontFamily: MONO }]}>{day.focus}</Text>
                </View>
                {day.tasks.map((task) => {
                  const checked = weeklyChecked.includes(task.id);
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.weekTaskRow}
                      onPress={() => dispatch({ type: 'PLAN_WEEKLY_TOGGLE', payload: { weekKey, id: task.id } })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.weekCheckbox, { borderColor: checked ? '#22c55e' : c.border, backgroundColor: checked ? '#22c55e' : 'transparent' }]}>
                        {checked && <Text style={[styles.checkmark, { fontSize: 9 }]}>✓</Text>}
                      </View>
                      <Text style={[styles.weekTaskTxt, { color: checked ? c.dim : c.text, fontFamily: MONO, textDecorationLine: checked ? 'line-through' : 'none' }]}>
                        {task.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={[styles.weekCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.numbersTitle, { color: '#eab308', fontFamily: MONO }]}>WEEKLY HARD NUMBERS</Text>
              {['Pitches sent: minimum 2', 'Reels/content delivered: minimum 2', 'Trades logged: minimum 10', 'Payday week: transfer 500K₮+ immediately'].map((item, i) => (
                <Text key={i} style={[styles.numbersItem, { color: c.muted, fontFamily: MONO }]}>· {item}</Text>
              ))}
            </View>
          </>
        )}

        {/* ─── MONTHLY ────────────────────────────── */}
        {tab === 'monthly' && (
          <>
            {MONTHLY.map((m) => (
              <View key={m.label} style={[styles.monthCard, { borderColor: c.border }]}>
                <View style={[styles.monthHead, { backgroundColor: m.color }]}>
                  <Text style={[styles.monthHeadTitle, { fontFamily: MONO }]}>{m.label}</Text>
                  <Text style={[styles.monthHeadTarget, { fontFamily: MONO }]}>{m.target}</Text>
                </View>
                <View style={[styles.monthBody, { backgroundColor: c.surface }]}>
                  {m.items.map((item, i) => (
                    <View key={i} style={styles.monthItemRow}>
                      <Text style={{ color: '#22c55e', fontSize: 11 }}>→</Text>
                      <Text style={[styles.monthItemTxt, { color: c.text, fontFamily: MONO }]}>{item}</Text>
                    </View>
                  ))}
                  <View style={[styles.failRow, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                    <Text style={[styles.failTxt, { color: '#f87171', fontFamily: MONO }]}>✗  FAIL: {m.fail}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ─── YEARLY ─────────────────────────────── */}
        {tab === 'yearly' && (
          <>
            {YEARLY.map((y) => (
              <View key={y.year} style={[styles.yearCard, { backgroundColor: c.surface, borderLeftColor: y.color }]}>
                <Text style={[styles.yearTitle, { color: c.text, fontFamily: MONO }]}>{y.year}</Text>
                <Text style={[styles.yearSub, { color: c.muted, fontFamily: MONO }]}>{y.sub}</Text>
                {y.items.map((item, i) => (
                  <View key={i} style={styles.yearItemRow}>
                    <Text style={{ color: c.dim, fontSize: 10 }}>▸</Text>
                    <Text style={[styles.yearItemTxt, { color: c.text, fontFamily: MONO }]}>{item}</Text>
                  </View>
                ))}
                <View style={[styles.milestone, { backgroundColor: y.milestoneBg }]}>
                  <Text style={[styles.milestoneTxt, { color: y.milestoneColor, fontFamily: MONO }]}>{y.milestone}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ─── SAVINGS ────────────────────────────── */}
        {tab === 'savings' && (
          <>
            {/* Apartment */}
            <View style={[styles.savCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.savLabel, { color: c.muted, fontFamily: MONO }]}>APARTMENT DOWN PAYMENT</Text>
              <Text style={[styles.savAmount, { color: c.text }]}>
                <Text style={{ fontFamily: NUMS }}>{apSav}M</Text>
                <Text style={{ fontWeight: '100' }}>₮</Text>
              </Text>
              <Text style={[styles.savSub, { color: c.muted, fontFamily: MONO }]}>
                {apPct}% of 30M₮ · {Math.max(0, 30 - apSav)}M₮ to go
              </Text>
              <View style={[styles.savTrack, { backgroundColor: c.surface2 }]}>
                <View style={[styles.savFill, { width: `${apPct}%` as any, backgroundColor: c.accent }]} />
              </View>
              <View style={styles.savBtns}>
                {[1, 2, 3].map((n) => (
                  <TouchableOpacity key={n} style={[styles.savBtn, { backgroundColor: c.accentBg }]}
                    onPress={() => dispatch({ type: 'PLAN_SET_APARTMENT', payload: Math.min(apSav + n, 30) })}>
                    <Text style={[styles.savBtnTxt, { color: c.accent, fontFamily: MONO }]}>+{n}M₮</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.savBtn, { backgroundColor: c.surface2 }]}
                  onPress={() => dispatch({ type: 'PLAN_SET_APARTMENT', payload: 0 })}>
                  <Text style={[styles.savBtnTxt, { color: c.muted, fontFamily: MONO }]}>Reset</Text>
                </TouchableOpacity>
              </View>
              {apSav >= 30 && <Text style={[styles.savDone, { fontFamily: MONO }]}>DOWN PAYMENT READY!</Text>}
            </View>

            {/* Harrier */}
            <View style={[styles.savCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.savLabel, { color: c.muted, fontFamily: MONO }]}>HARRIER 65 TRACKER</Text>
              <Text style={[styles.savAmount, { color: c.text }]}>
                <Text style={{ fontFamily: NUMS }}>{carSav}M</Text>
                <Text style={{ fontWeight: '100' }}>₮</Text>
              </Text>
              <Text style={[styles.savSub, { color: c.muted, fontFamily: MONO }]}>
                {carPct}% of 45M₮ · {Math.max(0, 45 - carSav)}M₮ to go
              </Text>
              <View style={[styles.savTrack, { backgroundColor: c.surface2 }]}>
                <View style={[styles.savFill, { width: `${carPct}%` as any, backgroundColor: '#3b82f6' }]} />
              </View>
              <View style={styles.savBtns}>
                {[1, 3, 5].map((n) => (
                  <TouchableOpacity key={n} style={[styles.savBtn, { backgroundColor: 'rgba(59,130,246,0.12)' }]}
                    onPress={() => dispatch({ type: 'PLAN_SET_CAR', payload: Math.min(carSav + n, 45) })}>
                    <Text style={[styles.savBtnTxt, { color: '#60a5fa', fontFamily: MONO }]}>+{n}M₮</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.savBtn, { backgroundColor: c.surface2 }]}
                  onPress={() => dispatch({ type: 'PLAN_SET_CAR', payload: 0 })}>
                  <Text style={[styles.savBtnTxt, { color: c.muted, fontFamily: MONO }]}>Reset</Text>
                </TouchableOpacity>
              </View>
              {carSav >= 45 && <Text style={[styles.savDone, { fontFamily: MONO, color: '#60a5fa' }]}>HARRIER READY!</Text>}
            </View>

            {/* Goals */}
            <View style={[styles.savCard, { backgroundColor: c.cream }]}>
              <Text style={[styles.savLabel, { color: 'rgba(20,22,27,0.5)', fontFamily: MONO }]}>3 GOALS — READ EVERY MORNING</Text>
              <Text style={[styles.goalsCardItem, { color: c.bg, fontFamily: MONO }]}>1. Apartment down payment (30M₮)</Text>
              <Text style={[styles.goalsCardItem, { color: c.bg, fontFamily: MONO }]}>2. 3 retainer clients signed</Text>
              <Text style={[styles.goalsCardItem, { color: c.bg, fontFamily: MONO }]}>3. Demo trading profitable</Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 12, paddingHorizontal: 24 },
  headerLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },

  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tabTxt: { fontSize: 9, letterSpacing: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  progressCard: { borderRadius: 20, padding: 14, marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progLabel: { fontSize: 10, letterSpacing: 2 },
  progTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 2 },

  taskCard: { borderRadius: 20, padding: 14, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 5 },
  priorityTxt: { fontSize: 9, letterSpacing: 1 },
  taskTitle: { fontSize: 13, letterSpacing: 0.5, marginBottom: 4 },
  taskDesc: { fontSize: 11, lineHeight: 17, letterSpacing: 0.2 },

  goalsCard: { borderRadius: 20, padding: 16, marginTop: 6, marginBottom: 8 },
  goalsCardLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 12 },
  goalsCardItem: { fontSize: 14, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },

  sectionLabel: { fontSize: 9, letterSpacing: 3, marginTop: 16, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1 },
  slotCard: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  slotTime: { fontSize: 9, width: 44, flexShrink: 0, paddingTop: 11, paddingLeft: 8, paddingRight: 4, letterSpacing: 0.5 },
  slotBar: { width: 3, flexShrink: 0 },
  slotBody: { flex: 1, padding: 10 },
  slotTitle: { fontSize: 12, letterSpacing: 0.5, marginBottom: 2 },
  slotDetail: { fontSize: 11, lineHeight: 17, letterSpacing: 0.2 },

  weekCard: { borderRadius: 20, padding: 14, marginBottom: 8 },
  weekDayName: { fontSize: 12, letterSpacing: 2, marginBottom: 6 },
  focusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  focusTxt: { fontSize: 9, letterSpacing: 1.5 },
  weekTaskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  weekCheckbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  weekTaskTxt: { flex: 1, fontSize: 12, lineHeight: 18, letterSpacing: 0.3 },
  numbersTitle: { fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  numbersItem: { fontSize: 12, letterSpacing: 0.3, marginBottom: 6, lineHeight: 18 },

  monthCard: { marginBottom: 10, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  monthHead: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthHeadTitle: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  monthHeadTarget: { fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  monthBody: { padding: 14 },
  monthItemRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  monthItemTxt: { flex: 1, fontSize: 12, lineHeight: 18, letterSpacing: 0.3 },
  failRow: { marginTop: 8, padding: 9, borderRadius: 8, borderWidth: 1 },
  failTxt: { fontSize: 11, letterSpacing: 0.3 },

  yearCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 4 },
  yearTitle: { fontSize: 13, letterSpacing: 1.5, marginBottom: 4 },
  yearSub: { fontSize: 11, letterSpacing: 0.5, marginBottom: 12 },
  yearItemRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  yearItemTxt: { flex: 1, fontSize: 12, lineHeight: 18, letterSpacing: 0.3 },
  milestone: { marginTop: 12, padding: 10, borderRadius: 10 },
  milestoneTxt: { fontSize: 12, letterSpacing: 0.5, lineHeight: 18 },

  savCard: { borderRadius: 24, padding: 20, marginBottom: 12 },
  savLabel: { fontSize: 9, letterSpacing: 3, marginBottom: 4 },
  savAmount: { fontSize: 52, lineHeight: 58, letterSpacing: -2, marginVertical: 4 },
  savSub: { fontSize: 10, letterSpacing: 1.5, marginBottom: 14 },
  savTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  savFill: { height: '100%', borderRadius: 4 },
  savBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  savBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  savBtnTxt: { fontSize: 11, letterSpacing: 1.5 },
  savDone: { fontSize: 12, letterSpacing: 2, textAlign: 'center', marginTop: 14, color: '#22c55e' },
});
