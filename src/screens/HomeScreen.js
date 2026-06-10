// ─── Home Screen ──────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, ScrollView,
  Share, KeyboardAvoidingView, Alert,
  StatusBar, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDateKey, getTabInfo } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  purple:      '#6C63FF',
  purpleLight: '#F0EEFF',
  bg:          '#F5F5FA',
  card:        '#FFFFFF',
  border:      '#E8E8F0',
  text:        '#1A1A2E',
  muted:       '#9090A8',
  lightRed:    '#FFCDD2',
  medRed:      '#E53935',
  darkRed:     '#B71C1C',
  darkRedBg:   '#FFEBEE',
};

const TAB_LABELS = { '-1': 'Yesterday', '0': 'Today', '1': 'Tomorrow' };

// ── Storage helpers ───────────────────────────────────────────────────────────
async function loadEntries(dateKey) {
  try {
    const raw = await AsyncStorage.getItem(`entries_v2_${dateKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveEntries(dateKey, entries) {
  await AsyncStorage.setItem(`entries_v2_${dateKey}`, JSON.stringify(entries));
}

async function addEntry(dateKey, number, count) {
  const entries = await loadEntries(dateKey);
  const id      = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const updated = [...entries, { id, number, count }];
  await saveEntries(dateKey, updated);
  return updated;
}

async function removeEntry(dateKey, id) {
  const entries = await loadEntries(dateKey);
  const updated = entries.filter(e => e.id !== id);
  await saveEntries(dateKey, updated);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [activeOffset,   setActiveOffset]   = useState(0);
  const [entries,        setEntries]         = useState([]);
  const [tabTotals,      setTabTotals]       = useState({});
  const [input,          setInput]           = useState('');
  const [inputCount,     setInputCount]      = useState(1);
  const [showPreview,    setShowPreview]      = useState(false);
  const [keyboardHeight, setKeyboardHeight]  = useState(0);
  const [keyboardVisible,setKeyboardVisible] = useState(false);

  const flatListRef = useRef(null);
  const inputRef    = useRef(null);

  const dateKey = getDateKey(activeOffset);
  const tabInfo = getTabInfo(activeOffset);

  // Past dates are read-only
  const isReadOnly = activeOffset < 0;

  const total4 = entries.filter(e => e.number.length === 4).reduce((s, e) => s + e.count, 0);
  const total3 = entries.filter(e => e.number.length === 3).reduce((s, e) => s + e.count, 0);

  // ── Load tab entries ────────────────────────────────────────────────────────
  const loadTab = useCallback(async () => {
    const data = await loadEntries(dateKey);
    setEntries(data);
  }, [dateKey]);

  useEffect(() => { loadTab(); }, [loadTab]);

  // ── Refresh totals for quick pills ─────────────────────────────────────────
  const refreshTotals = useCallback(async () => {
    const totals  = {};
    const offsets = [...new Set([-1, 0, 1, activeOffset])];
    for (const offset of offsets) {
      const d = await loadEntries(getDateKey(offset));
      totals[offset] = d.reduce((s, e) => s + e.count, 0);
    }
    setTabTotals(totals);
  }, [activeOffset]);

  useEffect(() => { refreshTotals(); }, [entries, refreshTotals]);

  // ── Keyboard listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function handleAdd() {
    const val = input.trim();
    if (!/^\d{3,4}$/.test(val)) {
      Alert.alert('Invalid', 'Please enter exactly 3 or 4 digits.');
      return;
    }
    const updated = await addEntry(dateKey, val, inputCount);
    setEntries(updated);
    setInput('');
    setInputCount(1);
    inputRef.current?.focus();
  }

  function handleRemove(id, number) {
    Alert.alert(
      'Remove Entry',
      `Remove "${number}" from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            const updated = await removeEntry(dateKey, id);
            setEntries(updated);
          },
        },
      ]
    );
  }

  function getTabLabel(offset) {
    if (TAB_LABELS[String(offset)]) return TAB_LABELS[String(offset)];
    if (offset > 0) return `+${offset} days`;
    return `${offset} days`;
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  const previewLines = [
    `${tabInfo.fullDate}   4-Digit: ${total4} | 3-Digit: ${total3}`,
    '─'.repeat(20),
    ...entries.map(e => `${e.number} - ${e.count}`),
  ];
  const previewText = previewLines.join('\n');

  async function handleShare() {
    try {
      await Share.share({ message: previewText, title: 'Counter Numbers' });
    } catch {}
  }

  // ── Render helpers ──────────────────────────────────────────────────────────
  function renderItem({ item }) {
    const isLight = item.count > 1 && item.count < 10;
    const isDark  = item.count >= 10;
    return (
      <View style={[
        styles.listRow,
        isLight && { backgroundColor: C.lightRed, borderColor: '#FFAB9F' },
        isDark  && { backgroundColor: C.darkRedBg, borderColor: '#EF9A9A' },
      ]}>
        <Text style={[styles.listNum, isDark && { color: C.darkRed }]}>
          {item.number}
        </Text>
        <Text style={styles.listDash}>—</Text>
        <View style={[
          styles.countPill,
          isLight && { backgroundColor: C.medRed },
          isDark  && { backgroundColor: C.darkRed },
          !isLight && !isDark && { backgroundColor: '#C8C8D8' },
        ]}>
          <Text style={styles.countPillText}>{item.count}</Text>
        </View>
        {/* Hide remove button on past (read-only) dates */}
        {!isReadOnly && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(item.id, item.number)}
          >
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderPreviewRow(item) {
    const isLight = item.count > 1 && item.count < 10;
    const isDark  = item.count >= 10;
    return (
      <View
        key={item.id}
        style={[
          styles.previewRow,
          isLight && { backgroundColor: C.lightRed },
          isDark  && { backgroundColor: C.darkRedBg },
        ]}
      >
        <Text style={[styles.previewNum, isDark && { color: C.darkRed, fontWeight: '800' }]}>
          {item.number}
        </Text>
        <Text style={styles.previewSep}>—</Text>
        <Text style={[
          styles.previewCount,
          isLight && { color: C.medRed, fontWeight: '700' },
          isDark  && { color: C.darkRed, fontWeight: '800' },
        ]}>
          {item.count}
        </Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />

      {/* ── Date Navigator ───────────────────────────────────────────────── */}
      <View style={styles.navigator}>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => setActiveOffset(o => o - 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.navArrowText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCenter}
          onPress={() => setActiveOffset(0)}
          activeOpacity={0.8}
        >
          <Text style={styles.navLabel}>{getTabLabel(activeOffset)}</Text>
          <Text style={styles.navDate}>{tabInfo.dayName}, {tabInfo.shortDate}</Text>
          {activeOffset !== 0 && (
            <Text style={styles.navBackToday}>tap to go Today</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => setActiveOffset(o => o + 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.navArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick jump pills ─────────────────────────────────────────────── */}
      <View style={styles.quickRow}>
        {[-1, 0, 1].map(offset => (
          <TouchableOpacity
            key={offset}
            style={[styles.quickPill, activeOffset === offset && styles.quickPillActive]}
            onPress={() => setActiveOffset(offset)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.quickPillText,
              activeOffset === offset && styles.quickPillTextActive,
            ]}>
              {TAB_LABELS[String(offset)]}
            </Text>
            {(tabTotals[offset] ?? 0) > 0 && <View style={styles.quickDot} />}
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Date header ─────────────────────────────────────────────────── */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{tabInfo.fullDate}</Text>
          <View style={styles.dateHeaderRight}>
            {isReadOnly && (
              <Text style={styles.readOnlyBadge}>Read Only</Text>
            )}
            {entries.length > 0 && (
              <Text style={styles.totalText}>{entries.length} rows</Text>
            )}
          </View>
        </View>

        {/* ── Input + stepper — hidden on past dates ───────────────────────── */}
        {!isReadOnly && (
          <>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="3–4 digits"
                placeholderTextColor={C.muted}
                value={input}
                onChangeText={t => { if (/^\d{0,4}$/.test(t)) setInput(t); }}
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setInputCount(c => Math.max(1, c - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepCount}>{inputCount}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setInputCount(c => Math.min(99, c + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addBtn, input.length >= 3 && styles.addBtnReady]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>
                ADD{inputCount > 1 ? `  ×${inputCount}` : ''}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Section label ────────────────────────────────────────────────── */}
        {entries.length > 0 && (
          <Text style={styles.sectionLabel}>ENTRIES</Text>
        )}

        {/* ── List ─────────────────────────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          style={styles.flex1}
          data={entries}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔢</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySub}>
                {isReadOnly ? 'No data for this day' : 'Add a 3–4 digit number above'}
              </Text>
            </View>
          }
        />

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={[
          styles.footer,
          {
            paddingBottom: keyboardVisible ? 8 : insets.bottom + 8,
            marginBottom:  keyboardVisible ? keyboardHeight - insets.bottom : 0,
          },
        ]}>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => { Keyboard.dismiss(); setShowPreview(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.previewBtnText}>📋  Preview & Share</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* ── Preview Bottom Sheet ─────────────────────────────────────────── */}
      <Modal
        visible={showPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPreview(false)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Preview</Text>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.previewDate}>{tabInfo.fullDate}</Text>
            <View style={styles.digitTotalsRow}>
              <View style={styles.digitBadge}>
                <Text style={styles.digitBadgeLabel}>4-Digit</Text>
                <Text style={styles.digitBadgeCount}>{total4}</Text>
              </View>
              <View style={styles.digitDivider} />
              <View style={styles.digitBadge}>
                <Text style={styles.digitBadgeLabel}>3-Digit</Text>
                <Text style={styles.digitBadgeCount}>{total3}</Text>
              </View>
            </View>

            <View style={styles.previewDivider} />

            {entries.length === 0
              ? <Text style={styles.previewEmpty}>No entries for this day.</Text>
              : entries.map(item => renderPreviewRow(item))
            }

            {entries.some(i => i.count > 1) && (
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: C.lightRed }]} />
                <Text style={styles.legendText}>count 2–9 = light red</Text>
                <View style={[styles.legendDot, { backgroundColor: C.darkRedBg, borderWidth: 1, borderColor: C.darkRed }]} />
                <Text style={styles.legendText}>count 10+ = dark red</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPreview(false)} activeOpacity={0.85}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex1:     { flex: 1 },
  container: { flex: 1, backgroundColor: C.bg },

  // ── Navigator ───────────────────────────────────────────────────────────────
  navigator: {
    flexDirection:   'row',
    alignItems:      'center',
    marginHorizontal: 12,
    marginTop:        14,
    marginBottom:     6,
    backgroundColor:  C.card,
    borderRadius:     14,
    borderWidth:      1.5,
    borderColor:      C.border,
    overflow:         'hidden',    
  },
  navArrow: {
    width:           48,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 22,
    backgroundColor: C.purpleLight,
  },
  navArrowText: {
    fontSize:   28,
    color:      C.purple,
    fontWeight: '300',
    lineHeight: 30,
  },
  navCenter: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: 10,
  },
  navLabel: {
    fontSize:   15,
    fontWeight: '800',
    color:      C.text,
  },
  navDate: {
    fontSize:  12,
    color:     C.muted,
    marginTop: 2,
  },
  navBackToday: {
    fontSize:   10,
    color:      C.purple,
    marginTop:  3,
    fontWeight: '600',
  },

  // ── Quick pills ─────────────────────────────────────────────────────────────
  quickRow: {
    flexDirection:    'row',
    marginHorizontal: 12,
    marginBottom:     8,
    gap:              8,
  },
  quickPill: {
    flex:            1,
    paddingVertical: 7,
    borderRadius:    10,
    alignItems:      'center',
    backgroundColor: C.card,
    borderWidth:     1.5,
    borderColor:     C.border,
    flexDirection:   'row',
    justifyContent:  'center',
    gap:             4,
  },
  quickPillActive:     { backgroundColor: C.purpleLight, borderColor: C.purple },
  quickPillText:       { fontSize: 12, fontWeight: '600', color: C.muted },
  quickPillTextActive: { color: C.purple },
  quickDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    backgroundColor: C.medRed,
  },

  // ── Date header ─────────────────────────────────────────────────────────────
  dateHeader: {
    flexDirection:    'row',
    alignItems:       'baseline',
    paddingHorizontal: 16,
    paddingVertical:  10,
  },
  dateText:       { fontSize: 20, fontWeight: '800', color: C.text, flex: 1 },
  dateHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalText:      { fontSize: 13, color: C.muted, fontWeight: '500' },
  readOnlyBadge: {
    fontSize:        10,
    color:           C.muted,
    fontWeight:      '700',
    backgroundColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius:    6,
    letterSpacing:   0.5,
  },

  // ── Input ───────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection:    'row',
    marginHorizontal: 16,
    marginBottom:     10,
    gap:              10,
    alignItems:       'center',
  },
  input: {
    flex:             1,
    backgroundColor:  C.card,
    borderWidth:      1.5,
    borderColor:      C.border,
    borderRadius:     12,
    paddingHorizontal: 16,
    paddingVertical:  14,
    fontSize:         17,
    color:            C.text,
    letterSpacing:    1.5,
  },
  stepper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.card,
    borderWidth:     1.5,
    borderColor:     C.border,
    borderRadius:    12,
    overflow:        'hidden',
    height:          52,
  },
  stepBtn: {
    width:           36,
    height:          52,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: C.purpleLight,
  },
  stepBtnText: { fontSize: 20, color: C.purple, fontWeight: '700', lineHeight: 24 },
  stepCount:   { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '800', color: C.text },

  addBtn: {
    marginHorizontal: 16,
    backgroundColor:  C.purple,
    borderRadius:     12,
    paddingVertical:  15,
    alignItems:       'center',
    marginBottom:     14,
    opacity:          0.7,
    elevation:        2,
    shadowColor:      C.purple,
    shadowOpacity:    0.3,
    shadowOffset:     { width: 0, height: 3 },
    shadowRadius:     6,
  },
  addBtnReady: { opacity: 1, elevation: 5, shadowOpacity: 0.5 },
  addBtnText:  { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },

  // ── List ────────────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize:         11,
    color:            C.muted,
    fontWeight:       '700',
    letterSpacing:    1,
    paddingHorizontal: 16,
    marginBottom:     6,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 12 },
  listRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.card,
    borderRadius:    12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom:    8,
    borderWidth:     1,
    borderColor:     C.border,
    elevation:       1,
    shadowColor:     '#000',
    shadowOpacity:   0.03,
    shadowOffset:    { width: 0, height: 1 },
    shadowRadius:    2,
  },
  listNum:  { flex: 1, fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: 1.5 },
  listDash: { fontSize: 16, color: C.muted, marginHorizontal: 8 },
  countPill: {
    minWidth:       34,
    height:         34,
    borderRadius:   17,
    justifyContent: 'center',
    alignItems:     'center',
    paddingHorizontal: 10,
  },
  countPillText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  removeBtn: {
    marginLeft:     10,
    width:          30,
    height:         30,
    borderRadius:   15,
    backgroundColor: '#ECECF4',
    justifyContent: 'center',
    alignItems:     'center',
  },
  removeBtnText: { fontSize: 18, color: C.muted, lineHeight: 22, marginTop: -1 },

  // ── Empty ───────────────────────────────────────────────────────────────────
  empty:      { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  emptyIcon:  { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.muted },
  emptySub:   { fontSize: 13, color: C.muted, marginTop: 5 },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 16,
    paddingTop:        12,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    backgroundColor:   C.bg,
  },
  previewBtn: {
    backgroundColor: C.text,
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
    elevation:       2,
    shadowColor:     '#000',
    shadowOpacity:   0.2,
    shadowOffset:    { width: 0, height: 2 },
    shadowRadius:    4,
  },
  previewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // ── Modal sheet ─────────────────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor:     '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal:   20,
    paddingTop:          12,
    maxHeight:           '82%',
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#DDD',
    alignSelf:       'center',
    marginBottom:    16,
  },
  sheetTitle:  { fontSize: 21, fontWeight: '800', color: C.text, marginBottom: 12 },
  sheetScroll: { maxHeight: 400 },

  previewDate: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  digitTotalsRow: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  C.purpleLight,
    borderRadius:     10,
    paddingVertical:  10,
    paddingHorizontal: 16,
    marginBottom:     12,
  },
  digitBadge:      { flex: 1, alignItems: 'center' },
  digitBadgeLabel: { fontSize: 11, color: C.purple, fontWeight: '600', letterSpacing: 0.5 },
  digitBadgeCount: { fontSize: 22, fontWeight: '800', color: C.purple, marginTop: 2 },
  digitDivider:    { width: 1, height: 36, backgroundColor: C.purple, opacity: 0.25 },

  previewDivider: { height: 1.5, backgroundColor: C.border, marginBottom: 10 },
  previewEmpty:   { color: C.muted, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  previewRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius:  8,
    marginBottom:  4,
  },
  previewNum:   { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: 1 },
  previewSep:   { fontSize: 15, color: C.muted, marginHorizontal: 8 },
  previewCount: { fontSize: 18, fontWeight: '600', color: C.text, minWidth: 32, textAlign: 'right' },

  legend: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    marginTop:     14,
    gap:           6,
  },
  legendDot:  { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: C.muted, marginRight: 10 },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  shareBtn: {
    flex:            1,
    backgroundColor: C.purple,
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
    elevation:       3,
    shadowColor:     C.purple,
    shadowOpacity:   0.4,
    shadowOffset:    { width: 0, height: 3 },
    shadowRadius:    6,
  },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: {
    flex:            1,
    backgroundColor: '#ECECF4',
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
  },
  closeBtnText: { color: C.text, fontSize: 16, fontWeight: '600' },
});