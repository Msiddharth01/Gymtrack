import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Modal, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

// No legacy COLORS object - use global theme context instead

export default function InteractiveTracker() {
  const { theme, mode } = useTheme();
  const [goal, setGoal] = useState<'BULK' | 'CUT'>('bulk' as 'BULK');

  // Daily Stats Editable State
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState(0);

  // Animation Values
  const scoreScale = useSharedValue(1);

  
  // Custom Profile & Routine
  const [profileName, setProfileName] = useState('User');

  const getInitials = (name: string) => {
    if (!name) return "US";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };
  const workoutOptions = ['Push', 'Pull', 'Legs', 'Rest'];
  const [workoutDay, setWorkoutDay] = useState('Rest');

  const routineData: Record<string, any[]> = {
    Push: [
      { name: "Bench Press", sets: "3", reps: "6–10" },
      { name: "Incline DB Press", sets: "3", reps: "8–12" },
      { name: "Shoulder Press", sets: "3", reps: "10–12" },
      { name: "Cable Fly", sets: "3", reps: "12–15" },
      { name: "Lateral Raise", sets: "3", reps: "12–15" },
      { name: "Triceps Pushdown", sets: "3", reps: "12–15" }
    ],
    Pull: [
      { name: "Barbell Row", sets: "3", reps: "6–10" },
      { name: "Lat Pulldown", sets: "3", reps: "8–12" },
      { name: "Seated Row", sets: "3", reps: "10–12" },
      { name: "Shrugs", sets: "3", reps: "10–12" },
      { name: "Bicep Curl", sets: "3", reps: "12–15" },
      { name: "Hammer Curl", sets: "3", reps: "12–15" },
      { name: "Face Pull", sets: "3", reps: "15–20" }
    ],
    Legs: [
      { name: "Squat", sets: "3", reps: "6–10" },
      { name: "Romanian Deadlift", sets: "3", reps: "10–12" },
      { name: "Leg Extension", sets: "3", reps: "12–15" },
      { name: "Leg Curl", sets: "3", reps: "12–15" },
      { name: "Calf Raise", sets: "3", reps: "12–15" },
      { name: "Cable Crunch", sets: "3", reps: "12–15" },
      { name: "Leg Raise", sets: "3", reps: "15–20" }
    ],
    Rest: [
      { name: "Recovery Day", sets: "-", reps: "Stretch / Walk" }
    ]
  };

  const targets = goal.toUpperCase() === 'BULK' 
    ? { cal: 3000, pro: 180, water: 3, steps: 8000 }
    : { cal: 2000, pro: 160, water: 4, steps: 12000 };


  // Date State & Firestore Logic
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [prevData, setPrevData] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  const getPreviousDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const [currentDateObj, setCurrentDateObj] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const fullDate = new Date(year, month, d).toISOString().split("T")[0];
      days.push({ day: d, date: fullDate });
    }
    return days;
  };

  const daysGrid = getDaysInMonth(currentDateObj);

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDateObj);
    newDate.setMonth(currentDateObj.getMonth() + direction);
    setCurrentDateObj(newDate);
  };

  const changeYear = (direction: number) => {
    const newDate = new Date(currentDateObj);
    newDate.setFullYear(currentDateObj.getFullYear() + direction);
    setCurrentDateObj(newDate);
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (direction === "prev") current.setDate(current.getDate() - 1);
    else current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const fetchMarkedDates = async () => {
    try {
      if (!auth.currentUser) return;
      const logsRef = collection(db, "users", auth.currentUser.uid, "dailyLogs");
      const querySnapshot = await getDocs(logsRef);
      const marked: any = {};
      
      querySnapshot.forEach(doc => {
        marked[doc.id] = { marked: true, dotColor: theme.primary };
      });

      // Highlight selected date
      marked[selectedDate] = { 
        ...marked[selectedDate], 
        selected: true, 
        selectedColor: theme.primary 
      };
      
      setMarkedDates(marked);
    } catch (error: any) {
      // Silently handle permission errors — calendar dots are non-critical
      console.warn("fetchMarkedDates error:", error?.code);
    }
  };

  const fetchData = async () => {
    try {
      if (!auth.currentUser) return;
      
      // Try local storage first for speed
      const localData = await AsyncStorage.getItem(`daily_stats_${selectedDate}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setCalories(parsed.calories || 0);
          setProtein(parsed.protein || 0);
          setWater(parsed.water || 0);
          setSteps(parsed.steps || 0);
          if (parsed.goal) setGoal(parsed.goal);
          if (parsed.routine) setWorkoutDay(parsed.routine);
        } catch (e) {
          console.log("Local parse error:", e);
        }
      }

      // Try Firestore sync — non-fatal if rules block it
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "dailyLogs", selectedDate);
        const prevRef = doc(db, "users", auth.currentUser.uid, "dailyLogs", getPreviousDate(selectedDate));
        
        const [docSnap, prevSnap] = await Promise.all([getDoc(docRef), getDoc(prevRef)]);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCalories(data.calories || 0);
          setProtein(data.protein || 0);
          setWater(data.water || 0);
          setSteps(data.steps || 0);
          if (data.goal) setGoal(data.goal);
          if (data.routine) setWorkoutDay(data.routine);
          // Sync local storage with latest remote
          await AsyncStorage.setItem(`daily_stats_${selectedDate}`, JSON.stringify(data));
        } else if (!localData) {
          // If nothing locally and nothing remotely, reset to default
          setCalories(0);
          setProtein(0);
          setWater(0);
          setSteps(0);
          setGoal('bulk' as 'BULK');
          setWorkoutDay('Rest');
        }

        if (prevSnap.exists()) {
          setPrevData(prevSnap.data());
        } else {
          setPrevData(null);
        }
        fetchMarkedDates();
      } catch (firestoreErr: any) {
        console.warn("Firestore fetch error (local data shown):", firestoreErr?.code);
        if (!localData) {
          setCalories(0);
          setProtein(0);
          setWater(0);
          setSteps(0);
          setGoal('bulk' as 'BULK');
          setWorkoutDay('Rest');
        }
      }
    } catch (error) {
      console.log("Data fetch error:", error);
    }
  };


  const handleDelete = async () => {
    try {
      if (!auth.currentUser) return;
      
      // Remove from local storage always
      await AsyncStorage.removeItem(`daily_stats_${selectedDate}`);
      
      setCalories(0);
      setProtein(0);
      setWater(0);
      setSteps(0);
      Alert.alert("Deleted", "Entry removed for this day");

      // Try to delete from Firestore in background
      const ref = doc(db, "users", auth.currentUser.uid, "dailyLogs", selectedDate);
      deleteDoc(ref).then(() => fetchMarkedDates()).catch((e: any) => {
        console.warn("Firestore delete failed:", e?.code);
      });
    } catch (e) {
      console.log(e);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this day's data?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: handleDelete, style: "destructive" }
      ]
    );
  };

  const saveData = async () => {
    try {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const dataToSave = {
        calories, protein, water, steps, fatigue: 0, routine: workoutDay, goal, createdAt: new Date().toISOString()
      };
      
      // Always save locally first — this always succeeds
      await AsyncStorage.setItem(`daily_stats_${selectedDate}`, JSON.stringify(dataToSave));
      
      fetchMarkedDates();
      Alert.alert("Success", "Daily metrics saved!");

      // Try to sync to Firestore in the background
      setDoc(doc(db, "users", userId, "dailyLogs", selectedDate), dataToSave, { merge: true }).catch((firestoreErr) => {
        console.warn("Firestore sync failed (local save succeeded):", firestoreErr?.code, firestoreErr?.message);
      });
    } catch (error) {
      console.log("Save error:", error);
      Alert.alert("Error", "Could not save data");
    }
  };

      
  useEffect(() => {
    fetchData();
    fetchMarkedDates();
  }, [selectedDate]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!auth.currentUser) return;
        const local = await AsyncStorage.getItem("userProfile");
        
        if (local) {
          const parsed = JSON.parse(local);
          setProfileName(parsed.firstName || "User");
        }
        
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid, "profile", "main"));
        if (snap.exists()) {
          const data = snap.data();
          setProfileName(data.firstName || "User");
        }
      } catch (e) {
        console.log(e);
      }
    };
    loadProfile();
  }, []);

  // Score Calculation
  const getPercentage = (val: number, target: number) => Math.min(100, Math.round((val / target) * 100));
  const calScore = getPercentage(calories, targets.cal);
  const proScore = getPercentage(protein, targets.pro);
  const waterScore = getPercentage(water, targets.water);
  const stepScore = getPercentage(steps, targets.steps);
  const dailyScore = Math.floor((calScore + proScore + waterScore + stepScore) / 4);

  useEffect(() => {
    if (dailyScore >= 90) {
      scoreScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      scoreScale.value = withTiming(1);
    }
  }, [dailyScore]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }]
  }));


  // Helper for Streak (Count backwards from today in markedDates)
  const getStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (markedDates[dateStr]) streak++;
        else break;
    }
    return streak;
  };

  const streak = getStreak();

  // Recovery Interactive State (0 - 100)
  const [recovery, setRecovery] = useState<Record<string, number>>({
    Chest: 50, Shoulders: 50, Triceps: 50, Back: 50, Biceps: 50, 'Rear Delts': 50,
    Quads: 50, Hamstrings: 50, Glutes: 50, Calves: 50, Core: 50, FullBody: 50
  });

  // Dynamic Content Logic
  const getRoutine = () => {
    return routineData[workoutDay] || [];
  }

  const getRecoveryMuscles = () => {
    if (workoutDay === 'Push') return ['Chest', 'Shoulders', 'Triceps'];
    if (workoutDay === 'Pull') return ['Back', 'Biceps', 'Rear Delts'];
    if (workoutDay === 'Legs') return ['Quads', 'Hamstrings', 'Glutes', 'Calves'];
    if (workoutDay === 'HIIT' || workoutDay === 'Rest') return ['FullBody', 'Core'];
    if (workoutDay === 'Shoulders') return ['Shoulders', 'Triceps'];
    if (workoutDay === 'Arms') return ['Biceps', 'Triceps'];
    return [];
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good Morning, ${profileName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${profileName}`;
    if (hour >= 17 && hour < 22) return `Good Evening, ${profileName}`;
    return `Good Night, ${profileName}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* PROFILE HEADER (Top Navbar via User Requirement) */}
      <View style={[styles.topNavModule, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Text style={[styles.appNameLabel, { color: theme.text }]}>GymTrack</Text>
        <TouchableOpacity activeOpacity={0.7} style={[styles.profileBtnIcon, { borderColor: theme.primary, backgroundColor: theme.primary }]} onPress={() => router.push('/profile')}>
          <Text style={[styles.profileBtnLiteral, { color: '#fff' }]}>{getInitials(profileName)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Date Selector Hub */}
        <View style={[styles.dateSelectorHub, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedDate(new Date().toISOString().split("T")[0])} style={[styles.todayActionBtn, { backgroundColor: theme.background }]}>
            <Text style={[styles.todayActionTxt, { color: theme.primary }]}>TODAY</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCalendar(true)} style={styles.calendarTrigger}>
            <Text style={[styles.calendarDateLabel, { color: theme.text }]}>{selectedDate === new Date().toISOString().split("T")[0] ? 'CURRENT DATE' : selectedDate}</Text>
            <Text style={styles.calendarIconSmall}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Date Modal Portal */}
        <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)' }]}>
            <View style={[styles.calendarContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCalendar(false)} style={styles.modalQuickBtn}>
                   <Text style={[styles.modalQuickBtnTxt, { color: theme.primary }]}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.calendarHeader}>
                <View style={styles.yearNav}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => changeYear(-1)}><Text style={[styles.navText, { color: theme.primary }]}>◀ Year</Text></TouchableOpacity>
                  <Text style={[styles.yearText, { color: theme.text }]}>{currentDateObj.getFullYear()}</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => changeYear(1)}><Text style={[styles.navText, { color: theme.primary }]}>Year ▶</Text></TouchableOpacity>
                </View>

                <View style={styles.monthNav}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => changeMonth(-1)}><Text style={[styles.monthNavArrow, { color: theme.primary }]}>◀</Text></TouchableOpacity>
                  <Text style={[styles.monthText, { color: theme.text }]}>{currentDateObj.toLocaleString('default', { month: 'long' })}</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => changeMonth(1)}><Text style={[styles.monthNavArrow, { color: theme.primary }]}>▶</Text></TouchableOpacity>
                </View>
              </View>

              <View style={styles.weekLabels}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <Text key={i} style={[styles.weekText, { color: theme.text }]}>{d}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {daysGrid.map((item, index) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    key={index}
                    disabled={!item}
                    onPress={() => {
                      if (item) {
                        setSelectedDate(item.date);
                        setShowCalendar(false);
                      }
                    }}
                    style={[
                      styles.gridDayCard,
                      item?.date === selectedDate && [styles.gridDayActive, { backgroundColor: theme.primary }]
                    ]}
                  >
                    <Text style={[styles.gridDayText, { color: theme.text }, !item && { color: 'transparent' }, item?.date === selectedDate && { fontWeight: 'bold', color: '#fff' }]}>
                      {item?.day || ''}
                    </Text>
                    {item && markedDates[item.date] && <View style={[styles.gridSavedDot, { backgroundColor: theme.primary }, item.date === selectedDate && { backgroundColor: '#fff' }]} />}
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                  setCurrentDateObj(new Date());
                  setShowCalendar(false);
                }}
                style={[styles.modalFullTodayBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.modalFullTodayBtnTxt}>Go to Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 1. Hero Card Area */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>{getGreeting()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
               <Text style={[styles.subGreeting, { color: theme.subtext }]}>Time to crush your goals. </Text>
               {streak > 0 && <Text style={[styles.streakBadge, { backgroundColor: theme.card, borderColor: theme.border, color: '#FACC15' }]}>🔥 {streak} Day Streak</Text>}
            </View>
          </View>
        </View>

        <Animated.View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: dailyScore >= 90 ? '#22C55E' : theme.border, shadowColor: dailyScore >= 90 ? '#22C55E' : theme.primary }, animatedScoreStyle]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.heroLabel, { color: theme.subtext }]}>Daily Power Score</Text>
              <Text style={[styles.heroValue, { color: dailyScore >= 90 ? '#22C55E' : theme.text }]}>{dailyScore}<Text style={[styles.heroMax, { color: theme.subtext }]}>/100</Text></Text>
            </View>

            <View style={[styles.heroDivider, { backgroundColor: theme.divider }]} />
            <View>
              <Text style={[styles.heroLabel, { color: theme.subtext }]}>Optimization</Text>
              <View style={styles.goalToggleRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setGoal('bulk' as 'BULK')} style={[styles.goalPill, { backgroundColor: goal.toLowerCase() === 'bulk' ? theme.primary : theme.unselectedBg }]}>
                  <Text style={[styles.goalPillText, { color: goal.toLowerCase() === 'bulk' ? theme.selectedText : theme.unselectedText }]}>BULK</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setGoal('cut' as 'CUT')} style={[styles.goalPill, { backgroundColor: goal.toLowerCase() === 'cut' ? theme.primary : theme.unselectedBg }]}>
                  <Text style={[styles.goalPillText, { color: goal.toLowerCase() === 'cut' ? theme.selectedText : theme.unselectedText }]}>CUT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.background }]}>
            <View style={[styles.progressBarFill, { width: `${dailyScore}%`, backgroundColor: theme.primary }]} />
          </View>
        </Animated.View>

      {/* 2. Quick Stats Grid (Editable) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 0, color: theme.text }]}>Daily Metrics</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity activeOpacity={0.7} onPress={confirmDelete} style={[styles.saveBtn, { backgroundColor: '#EF4444' }]}><Text style={styles.saveBtnTxt}>RESET</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={saveData} style={[styles.saveBtn, { backgroundColor: theme.primary }]}><Text style={styles.saveBtnTxt}>SAVE</Text></TouchableOpacity>
        </View>
      </View>
      
      {prevData ? (
        <View style={[styles.prevDataRow, { backgroundColor: theme.card, borderLeftColor: '#FACC15' }]}>
          <Text style={[styles.prevDataText, { color: '#FACC15' }]}>
            💡 Yester-data: Cal {prevData.calories || 0} | Pro {prevData.protein || 0}g | {prevData.water || 0}L | {prevData.steps || 0} steps
          </Text>
        </View>
      ) : (
        <View style={[styles.prevDataRow, { backgroundColor: theme.card, borderLeftColor: theme.primary }]}>
           <Text style={[styles.noDataNote, { color: theme.text, marginBottom: 0 }]}>🚀 No metrics found for yesterday. Let's start a fresh record!</Text>
        </View>
      )}

      <View style={styles.quickGrid}>
        <StatEditor title="Calories" val={calories} setVal={(v: number) => { setCalories(v); Haptics.selectionAsync(); }} min={0} max={3000} step={50} target={targets.cal} unit="kcal" color={'#FACC15'} />
        <StatEditor title="Protein" val={protein} setVal={(v: number) => { setProtein(v); Haptics.selectionAsync(); }} min={0} max={250} step={5} target={targets.pro} unit="g" color={'#EF4444'} />
        <StatEditor title="Water" val={water} setVal={(v: number) => { setWater(v); Haptics.selectionAsync(); }} min={0} max={8} step={1} target={targets.water} unit="L" color={'#3B82F6'} />

        <StatEditor title="Steps" val={steps} setVal={(v: number) => { setSteps(v); Haptics.selectionAsync(); }} min={0} max={20000} step={500} target={targets.steps} unit="" color={'#22C55E'} />
      </View>


      {/* 3. Today's Workout Card (User Controlled) */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Curated Routine</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
        {workoutOptions.map(day => (
          <TouchableOpacity activeOpacity={0.7} key={day} onPress={() => setWorkoutDay(day)} style={[styles.dayPill, { backgroundColor: workoutDay === day ? theme.primary : theme.unselectedBg, borderColor: theme.border }]}>
            <Text style={[styles.dayPillText, { color: workoutDay === day ? theme.selectedText : theme.unselectedText }]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.workoutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.workoutHeader, { borderColor: theme.divider }]}>
          <Text style={[styles.workoutTitle, { color: theme.text }]}>{workoutDay} Routine</Text>
        </View>
        {getRoutine().map((item, index) => (
          <View key={index} style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 }}>{item.sets} sets • {item.reps}</Text>
          </View>
        ))}
      </View>

      {/* 7. Muscle Recovery Interactive Status */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Target Recovery Mapping</Text>
      <View style={[styles.recoveryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {getRecoveryMuscles().map((m: string) => (
          <RecoverySlider key={m} muscle={m} val={recovery[m]} setVal={(v: number) => setRecovery({...recovery, [m]: v})} />
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  </View>
  );
}

// ----- MICRO COMPONENTS -----

const StatEditor = ({ title, val, setVal, min, max, step, target, unit, color }: any) => {
  const { theme, mode } = useTheme();
  const isGoalReached = val >= target;

  return (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: isGoalReached ? '#22C55E' : theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[styles.statTitle, { color: isGoalReached ? '#22C55E' : theme.subtext, marginBottom: 0 }]}>{title}</Text>
        {isGoalReached && <Text style={{ marginLeft: 6 }}>✅</Text>}
      </View>
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isGoalReached ? '#22C55E' : theme.border }]}
        keyboardType="numeric"
        value={String(val || 0)}
        onChangeText={(text) => {
          const num = text.includes('.') ? parseFloat(text) : parseInt(text);
          if (!isNaN(num as number)) {
            const finalNum = step >= 1 ? Math.round(num as number) : num;
            setVal(Math.max(min, Math.min(max, finalNum as number)));
          } else if (text === '') {
            setVal(0);
          }
        }}

      />

      {Platform.OS !== 'web' ? (
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={val || 0}
          onValueChange={setVal}
          minimumTrackTintColor={isGoalReached ? '#22C55E' : color}
          maximumTrackTintColor={mode === 'dark' ? "#333" : "#ddd"}
          thumbTintColor={isGoalReached ? '#22C55E' : color}
        />
      ) : (
        <View style={styles.stepperRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setVal(Math.max(min, (val || 0) - step))} style={[styles.stepBtn, { backgroundColor: theme.background }]}><Text style={[styles.stepBtnTxt, { color: theme.text }]}>-</Text></TouchableOpacity>
          <Text style={[styles.statValueGrid, { color: isGoalReached ? '#22C55E' : color, fontSize: 18 }]}>{(val || 0)}<Text style={[styles.statUnit, { color: theme.subtext }]}>{unit}</Text></Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setVal(Math.min(max, (val || 0) + step))} style={[styles.stepBtn, { backgroundColor: theme.background }]}><Text style={[styles.stepBtnTxt, { color: theme.text }]}>+</Text></TouchableOpacity>
        </View>
      )}
      
      <Text style={[styles.statTarget, { color: theme.subtext }]}>Goal: {target} {unit}</Text>
    </View>
  )
}




const RecoverySlider = ({ muscle, val, setVal }: any) => {
  const { theme, mode } = useTheme();
  let color = '#EF4444'; let status = 'Fatigued';
  if (val >= 40) { color = '#FACC15'; status = 'Recovering'; }
  if (val >= 80) { color = '#22C55E'; status = 'Ready'; }
  
  return (
    <View style={styles.recoveryRow}>
      <View style={styles.recoveryHeader}>
        <Text style={[styles.recoveryMuscle, { color: theme.text }]}>{muscle}</Text>
        <Text style={[styles.recoveryStatus, { color }]}>{status}</Text>
      </View>
      <View style={styles.sliderDotsContainer}>
        {[0, 25, 50, 75, 100].map(dot => (
          <TouchableOpacity activeOpacity={0.7} key={dot} onPress={() => setVal(dot)} style={styles.sliderDotHitbox}>
            <View style={[styles.sliderDot, { backgroundColor: mode === 'dark' ? '#333' : '#ddd' }, val >= dot ? { backgroundColor: color, height: 12 } : {}]} />
          </TouchableOpacity>
        ))}
        {/* Fake connecting line */}
        <View style={[styles.sliderLine, { backgroundColor: theme.divider }]} />
      </View>
    </View>
  )
}

// ----- STYLES -----

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNavModule: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  appNameLabel: { fontSize: 26, fontWeight: 'bold' },
  profileBtnIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  profileBtnLiteral: { fontWeight: '900', fontSize: 15 },
  
  content: { padding: 20 },
  dateSelectorHub: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 8, marginBottom: 24, borderWidth: 1 },
  todayActionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 8 },
  todayActionTxt: { fontWeight: '900', fontSize: 13 },
  calendarTrigger: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 },
  calendarDateLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  calendarIconSmall: { fontSize: 18 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  calendarContainer: { borderRadius: 24, padding: 20, width: '90%', borderWidth: 1 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '900' },
  modalQuickBtn: { padding: 8 },
  modalQuickBtnTxt: { fontWeight: '900', fontSize: 14 },

  calendarHeader: { marginBottom: 20 },
  yearNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navText: { fontWeight: '700', fontSize: 13 },
  yearText: { fontWeight: '800', fontSize: 16 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthNavArrow: { fontSize: 22, fontWeight: 'bold' },
  monthText: { fontSize: 18, fontWeight: '900' },

  weekLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekText: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: 'bold' },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridDayCard: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2, borderRadius: 10 },
  gridDayActive: { },
  gridDayText: { fontSize: 14 },
  gridSavedDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },

  modalFullTodayBtn: { padding: 14, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  modalFullTodayBtnTxt: { fontWeight: '900', fontSize: 14 },

  streakBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 10, fontSize: 12, fontWeight: 'bold', borderWidth: 1 },
  prevDataRow: { padding: 12, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3 },
  prevDataText: { fontSize: 12, fontWeight: '700' },
  noDataNote: { fontSize: 12, fontWeight: '700', marginBottom: 16 },

  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveBtnTxt: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '800' },
  subGreeting: { fontSize: 15 },
  
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 28, borderWidth: 1, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroLabel: { fontSize: 13, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 8 },
  heroValue: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  heroMax: { fontSize: 20, fontWeight: '700' },
  heroDivider: { width: 1, height: 50 },
  goalToggleRow: { flexDirection: 'row', gap: 6 },
  goalPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  goalPillActive: { },
  goalPillText: { fontWeight: 'bold', fontSize: 13 },
  goalPillTextActive: { },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },

  aiCard: { borderRadius: 20, padding: 16, marginBottom: 28, borderWidth: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiIcon: { fontSize: 18, marginRight: 8 },
  aiTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  aiText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },

  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48%', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, alignItems: 'center' },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    borderWidth: 1,
  },
  statTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  statValueGrid: { fontSize: 24, fontWeight: '900' },
  statUnit: { fontSize: 12, fontWeight: 'bold' },
  statTarget: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  daySelector: { flexDirection: 'row', marginBottom: 16 },
  dayPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  dayPillActive: { },
  dayPillText: { fontWeight: 'bold' },
  dayPillTextActive: { },

  workoutCard: { borderRadius: 24, padding: 20, marginBottom: 36, borderWidth: 1 },
  workoutHeader: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
  workoutTitle: { fontSize: 20, fontWeight: '900' },
  workoutSubMode: { fontSize: 14 },
  workoutItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseName: { fontSize: 15, fontWeight: '700' },
  exerciseDetail: { fontSize: 14, fontWeight: '500' },

  recoveryCard: { borderRadius: 24, padding: 20, marginBottom: 36, borderWidth: 1 },
  recoveryRow: { marginBottom: 24 },
  recoveryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  recoveryMuscle: { fontSize: 15, fontWeight: '700' },
  recoveryStatus: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  sliderDotsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
  sliderLine: { position: 'absolute', left: 10, right: 10, height: 2, zIndex: -1 },
  sliderDotHitbox: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  sliderDot: { width: 10, height: 10, borderRadius: 5 },
});
