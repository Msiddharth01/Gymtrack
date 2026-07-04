import React, { useState, memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Platform, Dimensions, Image, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

const EXERCISE_DATABASE: Record<string, any> = {
  'Bench Press': { 
    name: 'Bench Press', 
    primary: ['Chest'], secondary: ['Shoulders', 'Triceps'], 
    primaryStr: 'Mid & Upper Chest', secondaryStr: 'Front Deltoids, Triceps',
    steps: ['Lie flat on bench, plant feet firmly.', 'Grip bar slightly wider than shoulder width.', 'Lower the bar to your mid-chest.', 'Press upward powerfully while exhaling.'], 
    mistakes: ['Elbows flaring out at 90°', 'Bouncing bar off chest', 'Not using leg drive or bracing core'], 
    sets: 'BEGINNER: 3x10\nINTERMEDIATE: 4x8\nADVANCED: 5x5', bestFor: 'UPPER BODY STRENGTH'
  },
  'Incline Dumbbell Press': { 
    name: 'Incline Dumbbell Press', 
    primary: ['Chest'], secondary: ['Shoulders', 'Triceps'], 
    primaryStr: 'Upper Chest (Clavicular)', secondaryStr: 'Front Deltoids, Triceps',
    steps: ['Set bench angle to 30-45 degrees.', 'Press dumbbells straight up.', 'Lower slowly to chest level.', 'Push back up contracting pec muscles.'], 
    mistakes: ['Bench angled too high (hits shoulders)', 'Clashing dumbbells at top', 'Flaring elbows'], 
    sets: 'ALL LEVELS: 4x8-12', bestFor: 'UPPER CHEST MASS'
  },
  'Lat Pulldown': { 
    name: 'Lat Pulldown', 
    primary: ['Lats'], secondary: ['Biceps', 'RearDelts'],
    primaryStr: 'Latissimus Dorsi', secondaryStr: 'Biceps, Rear Deltoids',
    steps: ['Sit down and adjust knee pads.', 'Grip the bar slightly wider than shoulders.', 'Pull bar to upper chest pulling with elbows.', 'Squeeze lats at the bottom.'], 
    mistakes: ['Pulling behind the neck', 'Swinging your torso back', 'Using arms instead of back'], 
    sets: 'BEGINNER: 3x12\nINTERMEDIATE: 4x10', bestFor: 'BACK WIDTH (V-TAPER)'
  },
  'Squat': { 
    name: 'Barbell Squat', 
    primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'LowerBack'], 
    primaryStr: 'Quadriceps, Gluteus Maximus', secondaryStr: 'Hamstrings, Core, Erector Spinae',
    steps: ['Rest bar across upper traps, brace core.', 'Push hips back and bend knees down.', 'Descend until thighs parallel to ground.', 'Drive through mid-foot to stand.'], 
    mistakes: ['Knees caving inwards (Valgus)', 'Heels lifting off ground', 'Rounding the lower back (Butt wink)'], 
    sets: 'BEGINNER: 3x8\nINTERMEDIATE: 4x6\nADVANCED: 5x5', bestFor: 'LEG MASS & RAW POWER'
  },
  'Deadlift': { 
    name: 'Conventional Deadlift', 
    primary: ['Hamstrings', 'Glutes', 'LowerBack'], secondary: ['Traps', 'Lats', 'Forearms'], 
    primaryStr: 'Posterior Chain (Hams, Glutes, Lower Back)', secondaryStr: 'Traps, Lats, Forearm Grip',
    steps: ['Stand with mid-foot exactly under the bar.', 'Hinge hips back and grip bar overhand.', 'Drop hips slightly, lift chest, brace core.', 'Push floor away with legs and stand tall.'], 
    mistakes: ['Severe lower back rounding (Cat back)', 'Hips shooting up too early', 'Bar drifting away from shins'], 
    sets: 'BEGINNER: 3x5\nADVANCED: 5x3', bestFor: 'FULL POSTERIOR OVERLOAD'
  },
  'Shoulder Press': { 
    name: 'Shoulder Press', 
    primary: ['Shoulders'], secondary: ['Triceps', 'Chest'], 
    primaryStr: 'Anterior & Lateral Deltoids', secondaryStr: 'Triceps, Upper Pectorals',
    steps: ['Sit on upright bench with back support.', 'Hold dumbbells at shoulder height.', 'Press dumbbells straight up to ceiling.', 'Lower under control to ear level.'], 
    mistakes: ['Extreme lower back arching', 'Half-repping at top', 'Flaring elbows directly sideways'], 
    sets: '3 SETS OF 8-12 REPS', bestFor: 'DELT HYPERTROPHY'
  },
  'Bicep Curls': {
    name: 'Bicep Curls',
    primary: ['Biceps'], secondary: ['Forearms'],
    primaryStr: 'Biceps Brachii', secondaryStr: 'Brachioradialis (Forearms)',
    steps: ['Stand tall holding dumbbells.', 'Supinate (turn) wrists outward as you curl up.', 'Squeeze biceps hard at the peak.', 'Lower weights slowly over 3 seconds.'],
    mistakes: ['Swinging torso for momentum', 'Dropping elbows back', 'Not fully extending at bottom'],
    sets: '3 SETS OF 10-15 REPS', bestFor: 'ARM ISOLATION'
  },
  'Tricep Pushdowns': {
    name: 'Tricep Pushdowns',
    primary: ['Triceps'], secondary: [],
    primaryStr: 'Triceps Brachii (All 3 lateral heads)', secondaryStr: 'None',
    steps: ['Grip rope or straight bar attachment.', 'Pin elbows rigidly to your ribs.', 'Push down until arms lock out completely.', 'Return slowly to 90 degrees.'],
    mistakes: ['Letting elbows drift forward', 'Using shoulder momentum'],
    sets: '4 SETS OF 12-15 REPS', bestFor: 'TRICEP ISOLATION'
  },
  'Crunches': {
    name: 'Crunches',
    primary: ['Abs'], secondary: ['Obliques'],
    primaryStr: 'Rectus Abdominis', secondaryStr: 'Obliques',
    steps: ['Lie flat with knees bent.', 'Place fingertips behind ears gently.', 'Contract abs to curl shoulders off floor.', 'Squeeze core and lower slowly.'],
    mistakes: ['Yanking neck forward with hands', 'Going way too fast', 'Coming all the way up to situp'],
    sets: '4 SETS TO FAILURE', bestFor: 'CORE CONDITIONING'
  }
};

const MUSCLE_GROUPS = [
  { id: 'chest', name: 'CHEST', sub: 'PECS & PUSH PROTOCOLS' },
  { id: 'back', name: 'BACK', sub: 'LATS, POSTERIOR CHAIN' },
  { id: 'arms', name: 'ARMS', sub: 'BICEPS, TRICEPS, FOREARMS' },
  { id: 'legs', name: 'LEGS', sub: 'QUADS, HAMSTRINGS, GLUTES' },
  { id: 'shoulders', name: 'SHOULDERS', sub: 'DELTOIDS & TRAPS' },
  { id: 'abs', name: 'ABS', sub: 'CORE STABILITY' },
  { id: 'cardio', name: 'CARDIO', sub: 'FAT BURN & STAMINA' }
];
// Muscle Icons Mapping
const muscleIcons: Record<string, any> = {
  "Chest": require("../../assets/muscles/chest.png"),
  "Upper Chest": require("../../assets/muscles/chest.png"),
  "Triceps": require("../../assets/muscles/triceps.png"),
  "Shoulders": require("../../assets/muscles/shoulder.png"),
  "Front Deltoids": require("../../assets/muscles/shoulder.png"),
  "Back": require("../../assets/muscles/back.png"),
  "Lats": require("../../assets/muscles/back.png"),
  "Legs": require("../../assets/muscles/legs.png"),
  "Quads": require("../../assets/muscles/legs.png"),
  "Glutes": require("../../assets/muscles/legs.png"),
  "Abs": require("../../assets/muscles/default.png"),
  "Cardio": require("../../assets/muscles/default.png"),
};




const ExerciseItem = memo(({ exName, idx, onTouch, theme }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity 
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.exListItem, { backgroundColor: theme.card }]}
        onPress={() => onTouch(exName)}
      >
        <View style={styles.exInfoWrapper}>
          <Text style={[styles.exIndex, { color: theme.primary }]}>{idx + 1}.</Text>
          <Text style={[styles.exListTitle, { color: theme.text }]}>{exName}</Text>
        </View>
        <Text style={[styles.chevron, { color: theme.subtext, opacity: 0.5 }]}>►</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const MuscleItem = ({ name, type }: { name: string, type: 'primary' | 'secondary' }) => {
  return (
    <View style={styles.muscleItem}>
      <Image
        source={muscleIcons[name] || require("../../assets/muscles/default.png")}
        style={styles.muscleIcon}
        resizeMode="contain"
      />
      <Text style={[
        styles.muscleItemText,
        type === "primary" ? styles.primaryMuscleText : styles.secondaryMuscleText
      ]}>
        {name}
      </Text>
    </View>
  );
};


export default function TargetIntelligenceScreen() {
  const { theme, mode } = useTheme();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEx, setSelectedEx] = useState<any>(null);

  const getDynamicExercises = (muscleId: string) => {
    if (muscleId === 'chest') return ['Bench Press', 'Incline Dumbbell Press', 'Cable Flys', 'Pushups'];
    if (muscleId === 'back') return ['Deadlift', 'Lat Pulldown', 'Barbell Rows', 'Pull-ups'];
    if (muscleId === 'legs') return ['Squat', 'Walking Lunges', 'Leg Press', 'Romanian Deadlift'];
    if (muscleId === 'shoulders') return ['Shoulder Press', 'Lateral Raises', 'Face Pulls'];
    if (muscleId === 'arms') return ['Bicep Curls', 'Tricep Pushdowns', 'Hammer Curls'];
    if (muscleId === 'abs') return ['Crunches', 'Plank Holds', 'Hanging Leg Raises'];
    return ['HIIT Sprints', 'Stair Climber', 'Rowing Machine'];
  };

  const handleExerciseTap = useCallback((exName: string) => {
    if (EXERCISE_DATABASE[exName]) {
      setSelectedEx(EXERCISE_DATABASE[exName]);
    } else {
      setSelectedEx({
        name: exName.toUpperCase(), primary: ['Chest'], secondary: ['Core'], primaryStr: 'TARGET MUSCLE', secondaryStr: 'SUPPORT MUSCLES',
        steps: ['Control negative phase securely.', 'Focus on mind-muscle connection.', 'Breathe out on concentric exertion.'],
        mistakes: ['Ego lifting', 'Insufficient range of motion', 'Jerking the weight rapidly'], sets: '3 SETS OF 10 REPS', bestFor: 'CONDITIONING'
      });
    }
  }, []);

  const renderMuscleGroup = ({ item: m }: any) => {
    const isSelected = selectedMuscle === m.id;
    const exercises = getDynamicExercises(m.id);

    return (
      <View key={m.id}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => setSelectedMuscle(isSelected ? null : m.id)} 
          style={[
            styles.muscleCard, 
            { backgroundColor: theme.card, borderColor: theme.border },
            isSelected && { borderColor: theme.primary, backgroundColor: mode === 'dark' ? '#0f0a1a' : '#f5f0ff' }
          ]}
        >
          <View>
            <Text style={[styles.muscleName, { color: theme.text }, isSelected && { color: theme.primary }]}>{m.name}</Text>
            <Text style={[styles.muscleSub, { color: theme.subtext }, isSelected && { color: mode === 'dark' ? '#C4B5FD' : theme.primary }]}>{m.sub}</Text>
          </View>
          <Text style={[styles.chevron, { color: theme.subtext }, isSelected && { color: theme.primary }]}>{isSelected ? '▼' : '►'}</Text>
        </TouchableOpacity>

        {/* EXPANDABLE PROTOCOL PANEL */}
        {isSelected && (
          <View style={[styles.protocolContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.protocolHeader, { color: theme.subtext }]}>{m.name} PROTOCOL</Text>
            <FlatList
              data={exercises}
              keyExtractor={(ex) => ex}
              renderItem={({ item: exName, index: idx }) => (
                <ExerciseItem 
                  exName={exName}
                  idx={idx}
                  onTouch={handleExerciseTap}
                  theme={theme}
                />
              )}
              scrollEnabled={false}
              initialNumToRender={5}
              windowSize={5}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topNav, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.masterTitle, { color: theme.text }]}>TARGET INTELLIGENCE</Text>
        <Text style={[styles.masterSub, { color: theme.primary }]}>ISOLATE & OVERLOAD SYSTEM</Text>
      </View>

      <FlatList
        data={MUSCLE_GROUPS}
        keyExtractor={(m) => m.id}
        renderItem={renderMuscleGroup}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 80 }} />}
      />

      {/* 🧠 ELITE EXERCISE DETAIL MODAL */}
      <Modal visible={!!selectedEx} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
            
            <View style={[styles.modalHeader, { borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedEx?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedEx(null)} style={[styles.modalCloseBtn, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalCloseIcon, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
              
              {/* MUSCLE ICON DISPLAY */}
              <View style={[styles.muscleDisplayContainer, { backgroundColor: theme.card }]}>
                {selectedEx?.primary?.map((m: string, i: number) => (
                  <MuscleItem key={`p-${i}`} name={m} type="primary" />
                ))}
                {selectedEx?.secondary?.map((m: string, i: number) => (
                  <MuscleItem key={`s-${i}`} name={m} type="secondary" />
                ))}
              </View>
              
              <View style={[styles.muscleLabelCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.labelGroup}>
                  <Text style={[styles.labelTextHeader, { color: theme.primary }]}>PRIMARY TARGET</Text>
                  <Text style={[styles.labelTextValue, { color: theme.text }]}>{selectedEx?.primaryStr}</Text>
                </View>
                <View style={[styles.labelDivider, { backgroundColor: theme.border }]} />
                <View style={styles.labelGroup}>
                  <Text style={styles.labelTextHeaderSecondary}>SECONDARY MUSCLES</Text>
                  <Text style={[styles.labelTextValueSecondary, { color: theme.subtext }]}>{selectedEx?.secondaryStr}</Text>
                </View>
              </View>

              <Text style={[styles.mSectionTitle, { color: theme.text }]}>HOW TO PERFORM</Text>
              <View style={[styles.executionBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {selectedEx?.steps?.map((step: string, i: number) => (
                  <View key={i} style={styles.stepRow}>
                    <Text style={[styles.stepNum, { color: theme.primary }]}>{(i+1).toString().padStart(2, '0')}</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.mSectionTitle, { color: theme.text }]}>COMMON MISTAKES</Text>
              <View style={[styles.mistakeBox, { backgroundColor: mode === 'dark' ? '#1a0d0d' : '#fff1f1', borderColor: mode === 'dark' ? '#3f1111' : '#fecaca' }]}>
                {selectedEx?.mistakes?.map((mis: string, i: number) => (
                  <View key={i} style={styles.mistakeRow}>
                    <View style={styles.mistakeDot} />
                    <Text style={[styles.mistakeText, { color: mode === 'dark' ? '#FCA5A5' : '#b91c1c' }]}>{mis}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.splitGridSection}>
                <View style={[styles.splitBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.splitBoxTitle, { color: theme.subtext }]}>VOLUME GUIDELINES</Text>
                  <Text style={[styles.splitBoxValBody, { color: theme.text }]}>{selectedEx?.sets}</Text>
                </View>
                <View style={[styles.splitBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.splitBoxTitle, { color: theme.subtext }]}>BEST FOR</Text>
                  <Text style={[styles.splitBoxVal, { color: theme.text }]}>{selectedEx?.bestFor}</Text>
                </View>
              </View>

              <View style={{ height: 60 }} />
            </ScrollView>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: { paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingBottom: 24, paddingHorizontal: 20, borderBottomWidth: 1 },
  masterTitle: { fontSize: 26, fontWeight: 'bold', letterSpacing: 1 },
  masterSub: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 4 },

  content: { padding: 20 },
  
  muscleCard: { padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  muscleName: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  muscleSub: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 4, opacity: 0.8 },
  chevron: { fontSize: 16, fontWeight: '900' },

  protocolContainer: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  protocolHeader: { fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  exListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, justifyContent: 'space-between' },
  exInfoWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exIndex: { fontSize: 16, fontWeight: '900', width: 30 },
  exListTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5, flexShrink: 1 },


  /* MUSCLE ICON STYLES */
  muscleDisplayContainer: { padding: 16, borderRadius: 20, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  muscleItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  muscleIcon: { width: 28, height: 28, marginRight: 10 },
  muscleItemText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  primaryMuscleText: { color: '#A855F7' },
  secondaryMuscleText: { color: '#FF3B3B' },

  /* ELITE MODAL STYLES */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { height: height * 0.92, padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase', width: '85%' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalCloseIcon: { color: '#aaa', fontSize: 24, fontWeight: '300' },


  /* DATA LABELS */
  modalScrollArea: { padding: 16, paddingBottom: 40 },
  anatomyLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 20 },
  legendNode: { flexDirection: 'row', alignItems: 'center' },
  legendBox: { width: 14, height: 14, borderRadius: 3, marginRight: 10 },
  legendText: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 2 },

  muscleLabelCard: { padding: 20, marginBottom: 20, borderRadius: 16, borderWidth: 1 },
  labelGroup: { marginBottom: 4 },
  labelTextHeader: { color: '#8B5CF6', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  labelTextValue: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  labelDivider: { height: 1, backgroundColor: '#222', opacity: 0.1, marginVertical: 12 },
  labelTextHeaderSecondary: { color: '#EF4444', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  labelTextValueSecondary: { fontSize: 14, fontWeight: '700' },

  splitGridSection: { flexDirection: 'column', gap: 16, marginBottom: 20 },
  splitBox: { padding: 20, borderRadius: 16, borderWidth: 1 },
  splitBoxTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  splitBoxVal: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  splitBoxValBody: { fontSize: 14, fontWeight: '800', lineHeight: 22 },

  mSectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 16, letterSpacing: 1.5, marginLeft: 4 },
  
  executionBox: { padding: 24, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  stepRow: { flexDirection: 'row', marginBottom: 20, paddingRight: 10 },
  stepNum: { fontSize: 14, fontWeight: '900', marginRight: 16, width: 24, marginTop: 2 },
  stepText: { fontSize: 16, lineHeight: 24, fontWeight: '600' },

  mistakeBox: { backgroundColor: '#1a0d0d', padding: 24, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3f1111' },
  mistakeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  mistakeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 14 },
  mistakeText: { color: '#FCA5A5', fontSize: 15, fontWeight: '700' },
});
