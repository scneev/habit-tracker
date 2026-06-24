import React, { useRef, useEffect, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, getMonthIncome } from '../store/AppContext';
import { today } from '../utils/dateUtils';
import { Goal } from '../types';
import { getColors } from '../utils/theme';
import { AnimBar } from '../components/AnimBar';
import { MONO, NUMS } from '../utils/fonts';

const GOAL_COLORS = ['#FF4D26', '#3366EE', '#22AA55', '#EE8800', '#AA33EE'];
const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '💼', '🌍', '📈', '🏆', '💎', '✈️', '📱', '👟', '🎸'];

function makeId() { return Math.random().toString(36).slice(2); }

function fmt(n: number, cur: string): string {
  if (n >= 1_000_000) return `${cur}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${cur}${(n / 1_000).toFixed(1)}K`;
  return `${cur}${n.toLocaleString()}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n.toLocaleString()}`;
}

function paydays(): { label: string; days: number }[] {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
  function daysTo(target: number) {
    let next = new Date(y, mo, target);
    if (d > target) next = new Date(y, mo + 1, target);
    return Math.max(0, Math.ceil((next.getTime() - new Date(y, mo, d).getTime()) / 86400000));
  }
  return [
    { label: '20th', days: daysTo(20) },
    { label: '5th', days: daysTo(5) },
  ];
}

function animStyle(anim: Animated.Value, dy = 20) {
  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  };
}

export default function MoneyScreen() {
  const nav = useNavigation<any>();
  const { state, dispatch } = useAppStore();
  const { savings, savingsGoal, currency, monthlyIncome, incomeLog, goals, isDark, financeSetup, planApartmentSav, planCarSav } = state;
  const c = getColors(isDark);

  const [editSavings, setEditSavings] = useState(false);
  const [savingsInput, setSavingsInput] = useState(String(savings));
  const [showSetup, setShowSetup] = useState(false);
  const [setupSavings, setSetupSavings] = useState('');
  const [setupGoal, setSetupGoal] = useState('');
  const [setupIncome, setSetupIncome] = useState('');
  const [setupCurrency, setSetupCurrency] = useState('$');
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState(GOAL_EMOJIS[0]);
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
  const [goalDeadline, setGoalDeadline] = useState('');
  const [expandGoal, setExpandGoal] = useState<string | null>(null);
  const [goalCurrentInput, setGoalCurrentInput] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const cardAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  const t = today();
  const yearMonth = t.slice(0, 7);
  const monthIncome = getMonthIncome(incomeLog, yearMonth);
  const pct = savingsGoal > 0 ? Math.min(100, (savings / savingsGoal) * 100) : 0;
  const monthsToGoal =
    savingsGoal > 0 && monthlyIncome + monthIncome > 0
      ? Math.ceil(Math.max(0, savingsGoal - savings) / (monthlyIncome + monthIncome * 0.5))
      : null;
  const projected12 = savings + (monthlyIncome + monthIncome * 0.5) * 12;
  const pd = paydays();
  const isSetup = financeSetup;

  useEffect(() => {
    if (!isSetup) return;
    Animated.stagger(
      70,
      cardAnims.map((a) => Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 180, friction: 22 }))
    ).start();
  }, [isSetup]);

  function saveSetup() {
    const s = parseFloat(setupSavings.replace(/,/g, '')) || 0;
    const g = parseFloat(setupGoal.replace(/,/g, '')) || 0;
    const inc = parseFloat(setupIncome.replace(/,/g, '')) || 0;
    dispatch({ type: 'SET_SAVINGS', payload: s });
    dispatch({ type: 'SET_FINANCE_CONFIG', payload: { savingsGoal: g, currency: setupCurrency || '$', monthlyIncome: inc } });
    setShowSetup(false);
  }

  function saveSavingsEdit() {
    const val = parseFloat(savingsInput.replace(/,/g, ''));
    if (!isNaN(val)) dispatch({ type: 'SET_SAVINGS', payload: val });
    setEditSavings(false);
  }

  function addGoal() {
    const name = goalName.trim();
    const target = parseFloat(goalTarget.replace(/,/g, ''));
    if (!name || !target) return;
    if (editingGoal) {
      dispatch({ type: 'EDIT_GOAL', payload: { ...editingGoal, name, emoji: goalEmoji, target, color: goalColor, deadline: goalDeadline.trim() || undefined } });
      setEditingGoal(null);
    } else {
      dispatch({ type: 'ADD_GOAL', payload: { id: makeId(), name, emoji: goalEmoji, target, current: 0, deadline: goalDeadline.trim() || undefined, color: goalColor } });
    }
    setAddingGoal(false);
    setGoalName(''); setGoalTarget(''); setGoalDeadline('');
    setGoalEmoji(GOAL_EMOJIS[0]); setGoalColor(GOAL_COLORS[0]);
  }

  function startEditGoal(g: Goal) {
    setEditingGoal(g);
    setGoalName(g.name);
    setGoalTarget(String(g.target));
    setGoalEmoji(g.emoji);
    setGoalColor(g.color);
    setGoalDeadline(g.deadline ?? '');
    setAddingGoal(true);
    setExpandGoal(null);
  }

  function updateGoalCurrent(goalId: string) {
    const val = parseFloat(goalCurrentInput.replace(/,/g, ''));
    if (isNaN(val)) return;
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    dispatch({ type: 'EDIT_GOAL', payload: { ...g, current: val } });
    setExpandGoal(null);
    setGoalCurrentInput('');
  }

  const headerStyle = [styles.header];
  const titleStyle = [styles.title, { color: c.text, fontFamily: MONO }];

  // ─── SETUP PROMPT ─────────────────────────────────────────────
  if (!isSetup && !showSetup) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <View style={headerStyle}><Text style={titleStyle}>MONEY.</Text></View>
        <View style={styles.setupPrompt}>
          <Text style={[styles.setupIcon, { color: c.accent }]}>▣</Text>
          <Text style={[styles.setupTitle, { color: c.text, fontFamily: MONO }]}>TRACK YOUR FINANCES</Text>
          <Text style={[styles.setupSub, { color: c.muted, fontFamily: MONO }]}>
            Set a savings goal, log income, and track your progress toward what matters most.
          </Text>
          <TouchableOpacity style={[styles.setupBtn, { backgroundColor: c.accent }]} onPress={() => setShowSetup(true)}>
            <Text style={[styles.setupBtnTxt, { fontFamily: MONO }]}>SET UP MONEY TRACKER →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── SETUP FORM ───────────────────────────────────────────────
  if (showSetup) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <View style={headerStyle}>
          <Text style={titleStyle}>MONEY.</Text>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView contentContainerStyle={styles.setupForm}>
            <Text style={[styles.setupFormTitle, { color: c.text, fontFamily: MONO }]}>CONFIGURE</Text>

            <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>CURRENCY SYMBOL</Text>
            <View style={styles.chipRow}>
              {['$', '€', '£', '¥', '₮', '₩'].map((cur) => (
                <TouchableOpacity
                  key={cur}
                  style={[styles.chip, { borderColor: c.border, backgroundColor: c.surface }, setupCurrency === cur && { borderColor: c.accent, backgroundColor: c.accentBg }]}
                  onPress={() => setSetupCurrency(cur)}
                >
                  <Text style={[styles.chipTxt, { color: setupCurrency === cur ? c.accent : c.muted }]}>{cur}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>CURRENT SAVINGS</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
              value={setupSavings}
              onChangeText={setSetupSavings}
              placeholder="0"
              placeholderTextColor={c.dim}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>SAVINGS GOAL (OPTIONAL)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
              value={setupGoal}
              onChangeText={setSetupGoal}
              placeholder="0"
              placeholderTextColor={c.dim}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>MONTHLY INCOME (REGULAR)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
              value={setupIncome}
              onChangeText={setSetupIncome}
              placeholder="0"
              placeholderTextColor={c.dim}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent }]} onPress={saveSetup}>
              <Text style={[styles.saveBtnTxt, { fontFamily: MONO }]}>SAVE →</Text>
            </TouchableOpacity>
            {isSetup && (
              <TouchableOpacity style={styles.cancelLink} onPress={() => setShowSetup(false)}>
                <Text style={[styles.cancelLinkTxt, { color: c.dim, fontFamily: MONO }]}>CANCEL</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ─── MAIN DASHBOARD ───────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>MONEY.</Text>
        <TouchableOpacity onPress={() => setShowSetup(true)}>
          <Text style={[styles.editLink, { color: c.dim, fontFamily: MONO }]}>EDIT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ─── SAVINGS ─────────────────────────── */}
        <Animated.View style={[styles.card, { backgroundColor: c.surface }, animStyle(cardAnims[0])]}>
          <Text style={[styles.sectionLabel, { color: c.muted, fontFamily: MONO }]}>SAVINGS</Text>
          <View style={styles.savingsRow}>
            {editSavings ? (
              <TextInput
                style={[styles.savingsInput, { color: c.accent, borderBottomColor: c.accent, fontFamily: MONO }]}
                value={savingsInput}
                onChangeText={setSavingsInput}
                keyboardType="decimal-pad"
                autoFocus
                onSubmitEditing={saveSavingsEdit}
                onBlur={saveSavingsEdit}
                returnKeyType="done"
              />
            ) : (
              <TouchableOpacity onPress={() => { setSavingsInput(String(savings)); setEditSavings(true); }}>
                <Text style={[styles.savingsAmt, { color: c.text }]}>
                  <Text style={{ fontWeight: '100' }}>{currency}</Text>
                  <Text style={{ fontFamily: NUMS }}>{fmtNum(savings)}</Text>
                  <Text style={[styles.savingsEdit, { color: c.dim }]}> ✎</Text>
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.savingsPct, { color: c.accent, fontFamily: MONO }]}>{pct.toFixed(1)}%</Text>
          </View>
          <AnimBar pct={pct} color={c.accent} height={5} />
          <View style={styles.barLabels}>
            <Text style={[styles.barLabel, { color: c.dim, fontFamily: MONO }]}>0</Text>
            <Text style={[styles.barLabel, { color: c.dim, fontFamily: MONO }]}>
              {savingsGoal > 0 ? `GOAL: ${fmt(savingsGoal, currency)}` : 'NO GOAL SET'}
            </Text>
          </View>

          <View style={[styles.statsRow, { borderTopColor: c.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: c.accent, fontFamily: MONO }]}>
                {monthsToGoal !== null ? `${monthsToGoal}mo` : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: c.dim, fontFamily: MONO }]}>TO GOAL</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: c.accent, fontFamily: MONO }]}>{fmt(projected12, currency)}</Text>
              <Text style={[styles.statLabel, { color: c.dim, fontFamily: MONO }]}>12MO PROJ</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: c.accent, fontFamily: MONO }]}>{fmt(monthIncome, currency)}</Text>
              <Text style={[styles.statLabel, { color: c.dim, fontFamily: MONO }]}>SIDE/MO</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── PAYDAY ───────────────────────────── */}
        <Animated.View style={[styles.paydayRow, animStyle(cardAnims[1])]}>
          {pd.map((p) => (
            <View
              key={p.label}
              style={[
                styles.paydayPill,
                { backgroundColor: c.surface },
                p.days === 0 && { backgroundColor: c.accent },
              ]}
            >
              <Text style={[styles.paydayNum, { color: p.days === 0 ? c.cream : c.text, fontFamily: NUMS }]}>
                {p.days === 0 ? 'TODAY' : p.days}
              </Text>
              <Text style={[styles.paydayLabel, { color: c.dim, fontFamily: MONO }]}>
                {p.days === 0 ? '🎉 PAYDAY' : `DAYS TO ${p.label}`}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ─── GOALS ───────────────────────────── */}
        <Animated.View style={[styles.card, { backgroundColor: c.surface }, animStyle(cardAnims[2])]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: c.muted, fontFamily: MONO }]}>SAVING FOR</Text>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: c.accent }]}
              onPress={() => {
                setAddingGoal((v) => !v);
                setEditingGoal(null);
                setGoalName(''); setGoalTarget(''); setGoalDeadline('');
              }}
            >
              <Text style={[styles.logBtnTxt, { color: c.cream, fontFamily: MONO }]}>
                {addingGoal ? 'CANCEL' : '+ ADD'}
              </Text>
            </TouchableOpacity>
          </View>

          {addingGoal && (
            <View style={[styles.addGoalForm, { borderTopColor: c.border }]}>
              <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>WHAT ARE YOU SAVING FOR?</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g. Dream trip to Japan"
                placeholderTextColor={c.dim}
              />

              <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>HOW MUCH DO YOU NEED? ({currency})</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
                value={goalTarget}
                onChangeText={setGoalTarget}
                placeholder="0"
                placeholderTextColor={c.dim}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>TARGET DATE (OPTIONAL)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
                value={goalDeadline}
                onChangeText={setGoalDeadline}
                placeholder="e.g. Dec 2026"
                placeholderTextColor={c.dim}
              />

              <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>ICON</Text>
              <View style={styles.chipRow}>
                {GOAL_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, { backgroundColor: c.surface2, borderColor: c.border }, goalEmoji === e && { backgroundColor: c.accent }]}
                    onPress={() => setGoalEmoji(e)}
                  >
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>COLOR</Text>
              <View style={styles.chipRow}>
                {GOAL_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[styles.colorDot, { backgroundColor: col }, goalColor === col && styles.colorDotOn]}
                    onPress={() => setGoalColor(col)}
                  />
                ))}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent, marginTop: 12 }]} onPress={addGoal}>
                <Text style={[styles.saveBtnTxt, { fontFamily: MONO }]}>{editingGoal ? 'UPDATE GOAL' : 'ADD GOAL'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {goals.length === 0 && !addingGoal && (
            <Text style={[styles.empty, { color: c.dim, fontFamily: MONO }]}>No goals yet · Tap + ADD to set one</Text>
          )}

          {goals.map((g, idx) => {
            const gPct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
            const needed = Math.max(0, g.target - g.current);
            const isExpanded = expandGoal === g.id;
            return (
              <View key={g.id} style={[styles.goalRow, { borderTopColor: c.border }, idx > 0 && { borderTopWidth: 1 }]}>
                <TouchableOpacity
                  style={styles.goalHeader}
                  onPress={() => {
                    setExpandGoal(isExpanded ? null : g.id);
                    setGoalCurrentInput(String(g.current));
                  }}
                >
                  <Text style={styles.goalEmoji}>{g.emoji}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalName, { color: c.text, fontFamily: MONO }]}>{g.name.toUpperCase()}</Text>
                    <Text style={[styles.goalNeed, { color: c.muted, fontFamily: MONO }]}>
                      Need {fmt(needed, currency)} more{g.deadline ? ` · by ${g.deadline}` : ''}
                    </Text>
                    <AnimBar pct={gPct} color={g.color} height={4} />
                    <View style={styles.goalMeta}>
                      <Text style={[styles.goalMetaTxt, { color: c.dim, fontFamily: MONO }]}>
                        {fmt(g.current, currency)} / {fmt(g.target, currency)}
                      </Text>
                      <Text style={[styles.goalPct, { color: g.color, fontFamily: MONO }]}>{gPct.toFixed(0)}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.goalExpand, { borderTopColor: c.border }]}>
                    <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>I'VE SAVED ({currency})</Text>
                    <View style={styles.goalUpdateRow}>
                      <TextInput
                        style={[styles.formInput, { flex: 1, backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
                        value={goalCurrentInput}
                        onChangeText={setGoalCurrentInput}
                        keyboardType="decimal-pad"
                        placeholderTextColor={c.dim}
                      />
                      <TouchableOpacity style={[styles.updateBtn, { backgroundColor: c.accent }]} onPress={() => updateGoalCurrent(g.id)}>
                        <Text style={[styles.updateBtnTxt, { fontFamily: MONO }]}>SAVE</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity
                        style={[styles.goalActionBtn, { backgroundColor: c.surface2 }]}
                        onPress={() => startEditGoal(g)}
                      >
                        <Text style={[styles.goalActionTxt, { color: c.text, fontFamily: MONO }]}>EDIT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.goalActionBtn, { backgroundColor: c.accentBg }]}
                        onPress={() => { dispatch({ type: 'DELETE_GOAL', payload: g.id }); setExpandGoal(null); }}
                      >
                        <Text style={[styles.goalActionTxt, { color: c.accent, fontFamily: MONO }]}>DELETE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* ─── TARGETS ─────────────────────────── */}
        <Animated.View style={[styles.card, { backgroundColor: c.surface }, animStyle(cardAnims[3])]}>
          <Text style={[styles.sectionLabel, { color: c.muted, fontFamily: MONO }]}>TARGETS</Text>

          {/* Apartment */}
          {(() => {
            const pct2 = Math.min(100, Math.round((planApartmentSav / 30) * 100));
            return (
              <View style={[styles.targetItem, { borderBottomColor: c.border }]}>
                <View style={styles.targetHeader}>
                  <Text style={[styles.targetName, { color: c.text, fontFamily: MONO }]}>🏠 APARTMENT DOWN PAYMENT</Text>
                  <Text style={[styles.targetPct, { color: c.accent, fontFamily: MONO }]}>{pct2}%</Text>
                </View>
                <Text style={[styles.targetSub, { color: c.muted, fontFamily: MONO }]}>
                  {planApartmentSav}M₮ of 30M₮ · {Math.max(0, 30 - planApartmentSav)}M₮ to go
                </Text>
                <View style={[styles.targetTrack, { backgroundColor: c.surface2 }]}>
                  <View style={[styles.targetFill, { width: `${pct2}%` as any, backgroundColor: c.accent }]} />
                </View>
                <View style={styles.targetBtns}>
                  {[1, 2, 3].map((n) => (
                    <TouchableOpacity key={n} style={[styles.targetBtn, { backgroundColor: c.accentBg }]}
                      onPress={() => dispatch({ type: 'PLAN_SET_APARTMENT', payload: Math.min(planApartmentSav + n, 30) })}>
                      <Text style={[styles.targetBtnTxt, { color: c.accent, fontFamily: MONO }]}>+{n}M₮</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.targetBtn, { backgroundColor: c.surface2 }]}
                    onPress={() => dispatch({ type: 'PLAN_SET_APARTMENT', payload: 0 })}>
                    <Text style={[styles.targetBtnTxt, { color: c.muted, fontFamily: MONO }]}>Reset</Text>
                  </TouchableOpacity>
                </View>
                {planApartmentSav >= 30 && (
                  <Text style={[styles.targetDone, { color: '#22c55e', fontFamily: MONO }]}>DOWN PAYMENT READY!</Text>
                )}
              </View>
            );
          })()}

          {/* Harrier */}
          {(() => {
            const pct2 = Math.min(100, Math.round((planCarSav / 45) * 100));
            return (
              <View style={styles.targetItem}>
                <View style={styles.targetHeader}>
                  <Text style={[styles.targetName, { color: c.text, fontFamily: MONO }]}>🚗 HARRIER 65</Text>
                  <Text style={[styles.targetPct, { color: '#60a5fa', fontFamily: MONO }]}>{pct2}%</Text>
                </View>
                <Text style={[styles.targetSub, { color: c.muted, fontFamily: MONO }]}>
                  {planCarSav}M₮ of 45M₮ · {Math.max(0, 45 - planCarSav)}M₮ to go
                </Text>
                <View style={[styles.targetTrack, { backgroundColor: c.surface2 }]}>
                  <View style={[styles.targetFill, { width: `${pct2}%` as any, backgroundColor: '#3b82f6' }]} />
                </View>
                <View style={styles.targetBtns}>
                  {[1, 3, 5].map((n) => (
                    <TouchableOpacity key={n} style={[styles.targetBtn, { backgroundColor: 'rgba(59,130,246,0.12)' }]}
                      onPress={() => dispatch({ type: 'PLAN_SET_CAR', payload: Math.min(planCarSav + n, 45) })}>
                      <Text style={[styles.targetBtnTxt, { color: '#60a5fa', fontFamily: MONO }]}>+{n}M₮</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.targetBtn, { backgroundColor: c.surface2 }]}
                    onPress={() => dispatch({ type: 'PLAN_SET_CAR', payload: 0 })}>
                    <Text style={[styles.targetBtnTxt, { color: c.muted, fontFamily: MONO }]}>Reset</Text>
                  </TouchableOpacity>
                </View>
                {planCarSav >= 45 && (
                  <Text style={[styles.targetDone, { color: '#60a5fa', fontFamily: MONO }]}>HARRIER READY!</Text>
                )}
              </View>
            );
          })()}
        </Animated.View>

        {/* ─── SIDE INCOME ─────────────────────── */}
        <Animated.View style={[styles.card, { backgroundColor: c.surface }, animStyle(cardAnims[4])]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: c.muted, fontFamily: MONO }]}>SIDE INCOME</Text>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: c.accent }]}
              onPress={() => nav.navigate('LogIncome')}
            >
              <Text style={[styles.logBtnTxt, { color: c.cream, fontFamily: MONO }]}>+ LOG</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.incomeTotal, { color: c.accent }]}>
            <Text style={{ fontWeight: '100' }}>{currency}</Text>
            <Text style={{ fontFamily: NUMS }}>{fmtNum(monthIncome)}</Text>
          </Text>
          <Text style={[styles.incomeSub, { color: c.dim, fontFamily: MONO }]}>THIS MONTH</Text>

          {incomeLog.length === 0 ? (
            <Text style={[styles.empty, { color: c.dim, fontFamily: MONO }]}>No income logged yet</Text>
          ) : (
            incomeLog.slice(0, 8).map((entry) => (
              <View key={entry.id} style={[styles.incomeRow, { borderTopColor: c.border }]}>
                <View style={styles.incomeLeft}>
                  <Text style={[styles.incomeSource, { color: c.text, fontFamily: MONO }]}>{entry.source.toUpperCase()}</Text>
                  <Text style={[styles.incomeDate, { color: c.dim, fontFamily: MONO }]}>
                    {entry.date}{entry.note ? ` · ${entry.note}` : ''}
                  </Text>
                </View>
                <View style={styles.incomeRight}>
                  <Text style={[styles.incomeAmt, { color: c.accent, fontFamily: MONO }]}>+{fmt(entry.amount, currency)}</Text>
                  <TouchableOpacity onPress={() => dispatch({ type: 'DELETE_INCOME', payload: entry.id })}>
                    <Text style={[styles.deleteBtn, { color: c.dim }]}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  editLink: { fontSize: 10, letterSpacing: 2 },
  content: { padding: 16, paddingBottom: 40 },

  setupPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  setupIcon: { fontSize: 48, marginBottom: 16 },
  setupTitle: { fontSize: 14, letterSpacing: 3, marginBottom: 12 },
  setupSub: { fontSize: 12, textAlign: 'center', lineHeight: 22, letterSpacing: 1, marginBottom: 32 },
  setupBtn: { borderRadius: 24, paddingVertical: 18, paddingHorizontal: 32 },
  setupBtnTxt: { color: '#fff', fontSize: 11, letterSpacing: 3 },
  setupForm: { padding: 24, paddingBottom: 40 },
  setupFormTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 2, marginBottom: 24, marginTop: 8 },

  card: { borderRadius: 28, padding: 20, marginBottom: 12 },
  sectionLabel: { fontSize: 9, letterSpacing: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  logBtnTxt: { fontSize: 10, letterSpacing: 2 },

  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, marginBottom: 12 },
  savingsAmt: { fontSize: 52, fontWeight: '200', letterSpacing: -2, lineHeight: 56 },
  savingsEdit: { fontSize: 16 },
  savingsInput: { fontSize: 52, fontWeight: '200', borderBottomWidth: 1, minWidth: 120 },
  savingsPct: { fontSize: 14, letterSpacing: 1 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  barLabel: { fontSize: 9, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, letterSpacing: -0.5 },
  statLabel: { fontSize: 9, marginTop: 3, letterSpacing: 2 },
  statDivider: { width: 1, marginVertical: 2 },

  paydayRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  paydayPill: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
  paydayNum: { fontSize: 36, fontWeight: '200', letterSpacing: -1, lineHeight: 40 },
  paydayLabel: { fontSize: 9, marginTop: 6, letterSpacing: 2 },

  goalRow: { paddingVertical: 14 },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  goalEmoji: { fontSize: 28, marginTop: 2 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  goalNeed: { fontSize: 11, marginBottom: 8, letterSpacing: 1 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  goalMetaTxt: { fontSize: 9, letterSpacing: 1 },
  goalPct: { fontSize: 11, letterSpacing: 1 },
  goalExpand: { paddingTop: 12, borderTopWidth: 1, marginTop: 8 },
  goalUpdateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  goalActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  goalActionBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  goalActionTxt: { fontSize: 10, letterSpacing: 2 },
  updateBtn: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  updateBtnTxt: { color: '#fff', fontSize: 10, letterSpacing: 2 },

  targetItem: { paddingTop: 14, paddingBottom: 4 },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  targetName: { fontSize: 10, letterSpacing: 1.5 },
  targetPct: { fontSize: 12, letterSpacing: 1 },
  targetSub: { fontSize: 10, letterSpacing: 1, marginBottom: 10 },
  targetTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  targetFill: { height: '100%', borderRadius: 3 },
  targetBtns: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  targetBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  targetBtnTxt: { fontSize: 10, letterSpacing: 1 },
  targetDone: { fontSize: 10, letterSpacing: 2, textAlign: 'center', marginTop: 6 },

  incomeTotal: { fontSize: 42, fontWeight: '200', letterSpacing: -1, marginTop: 4, lineHeight: 46 },
  incomeSub: { fontSize: 9, letterSpacing: 3, marginBottom: 14 },
  incomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1 },
  incomeLeft: { flex: 1 },
  incomeSource: { fontSize: 12, letterSpacing: 1.5 },
  incomeDate: { fontSize: 9, marginTop: 3, letterSpacing: 1 },
  incomeRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  incomeAmt: { fontSize: 16, letterSpacing: -0.5 },
  deleteBtn: { fontSize: 18 },

  label: { fontSize: 9, letterSpacing: 3, marginBottom: 8, marginTop: 16 },
  formInput: { height: 50, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
  saveBtn: { borderRadius: 24, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  saveBtnTxt: { color: '#fff', fontSize: 11, letterSpacing: 3 },
  cancelLink: { alignItems: 'center', paddingVertical: 14 },
  cancelLinkTxt: { fontSize: 11, letterSpacing: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipTxt: { fontSize: 12 },
  emojiBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotOn: { borderWidth: 3, borderColor: '#FFFFFF' },
  addGoalForm: { paddingTop: 8, borderTopWidth: 1, marginTop: 4 },
  empty: { textAlign: 'center', fontSize: 11, letterSpacing: 2, paddingVertical: 20 },
});
