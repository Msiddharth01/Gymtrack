import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, interpolate } from 'react-native-reanimated';

const QUICK_SUGGESTIONS = ["Chest Workout", "Fat Loss Plan", "Beginner Routine", "Full Body"];

const TypingDot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0.3, 1], [0.8, 1.1]) }]
  }));

  return <Animated.View style={[styles.dot, style]} />;
};

export default function ChatScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");
  const [dietPrefState, setDietPrefState] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { theme, mode } = useTheme();
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am GymTrack AI. What muscle group do you want to train today?', sender: 'ai' }
  ]);


  useEffect(() => {
    // Auto-scroll to bottom whenever messages change
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);


  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const userText = inputText.trim();
    const lowerText = userText.toLowerCase();

    // Add user message
    const newMessages = [...messages, { id: Date.now().toString(), text: userText, sender: 'user' }];
    setMessages(newMessages);
    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let aiReply = "👋 I'm GymTrack AI!\n\nAsk me for a specific workout like:\n• 'legs workout'\n• 'chest workout'\n\nOr ask for specific plans like:\n• 'bulking diet'\n• 'cutting workout'";


    if (
      lowerText.includes("bulking plan") ||
      lowerText.includes("bulk plan") ||
      lowerText.includes("bulk workout") ||
      lowerText.includes("muscle gain workout")
    ) {
      aiReply = "💪 Bulking Workout Plan\n\nDay 1: Chest + Triceps\nDay 2: Back + Biceps\nDay 3: Legs\nDay 4: Shoulders\nDay 5: Arms\nDay 6: Rest / Light Cardio\n\nFocus:\nBench Press\nSquats\nDeadlift\nRows\nShoulder Press";
    }
    else if (
      lowerText.includes("cutting plan") ||
      lowerText.includes("cutting workout") ||
      lowerText.includes("fat loss workout") ||
      lowerText.includes("shred workout")
    ) {
      aiReply = "🔥 Cutting Workout Plan\n\nDay 1: Push + 20 min treadmill\nDay 2: Pull + Stairmaster\nDay 3: Legs + Core\nDay 4: HIIT + Abs\nDay 5: Upper Body + Cardio\nDay 6: Full Body Circuit\nDay 7: Rest\n\nCore:\nPlank\nLeg Raises\nRussian Twists\nMountain Climbers";
    }
    else if (dietPrefState) {
      if (lowerText.includes("non") || lowerText.includes("chicken") || lowerText.includes("egg")) {
        if (dietPrefState === 'bulking') {
          aiReply = "🍗 Non-Veg Bulking Diet Plan\n\n• Breakfast: Eggs + Toast + Banana\n• Lunch: Rice + Chicken + Curd\n• Snack: Peanut Butter Sandwich\n• Dinner: Chicken + Roti + Salad\n• Before Bed: Milk\n\n💡 Tip: Hit a 300-500 caloric surplus to gain muscle!";
        } else if (dietPrefState === 'cutting') {
          aiReply = "🍗 Non-Veg Cutting Diet\n\n• Breakfast: Egg Whites + Coffee\n• Lunch: Chicken + Rice (small)\n• Snack: Fruits\n• Dinner: Chicken + Salad\n• Before Bed: Greek Yogurt\n\n💡 Tip: Keep your protein high to prevent muscle waste!";
        } else {
          aiReply = "🍗 Non-Veg Diet Plan:\n\n• Breakfast: Eggs + Toast\n• Lunch: Rice + Chicken\n• Snack: Protein Shake\n• Dinner: Roti + Chicken + Salad\n• Before Bed: Milk\n\n💡 Tip: Aim for 1.6g-2g of protein per kg of body weight to build solid mass.";
        }
        setDietPrefState(null);
      } else if (lowerText.includes("veg")) {
        if (dietPrefState === 'bulking') {
          aiReply = "💪 Vegetarian Bulking Diet Plan\n\n• Breakfast: Oats + Banana + Peanut Butter + Milk\n• Lunch: Rice + Dal + Paneer + Curd\n• Snack: Dry Fruits + Shake\n• Dinner: Roti + Paneer + Sabzi\n• Before Bed: Milk\n\n💡 Tip: Eat high-calorie dense foods to easily hit your surplus.";
        } else if (dietPrefState === 'cutting') {
          aiReply = "🔥 Vegetarian Cutting Diet\n\n• Breakfast: Oats + Black Coffee\n• Lunch: Rice (small) + Dal + Paneer\n• Snack: Fruits + Green Tea\n• Dinner: Roti + Sabzi + Salad\n• Before Bed: Low-fat Milk\n\n💡 Tip: Limit cooking oils and stay properly hydrated to lose fat fast.";
        } else {
          aiReply = "🥗 Vegetarian Diet Plan:\n\n• Breakfast: Oats + Banana + Milk\n• Lunch: Rice + Dal + Paneer\n• Snack: Peanut Butter Sandwich\n• Dinner: Roti + Sabzi + Paneer\n• Before Bed: Milk\n\n💡 Tip: Combine grains and legumes (like rice and dal) to form complete amino acid profiles.";
        }
        setDietPrefState(null);
      } else {
        aiReply = "Please specify if you prefer a Vegetarian or Non-Vegetarian diet plan!";
      }
    } 
    else if (["bulking diet", "bulk diet", "muscle gain diet", "weight gain diet"].some(kw => lowerText.includes(kw))) {
      aiReply = "🍽️ Are you Vegetarian or Non-Vegetarian?";
      setDietPrefState('bulking');
    }
    else if (["cutting diet", "fat loss diet", "shred diet", "lean diet"].some(kw => lowerText.includes(kw))) {
      aiReply = "🥗 Are you Vegetarian or Non-Vegetarian?";
      setDietPrefState('cutting');
    }
    else if (["diet", "meal plan", "nutrition plan"].some(kw => lowerText.includes(kw))) {
      aiReply = "🥗 Sure! Are you Vegetarian or Non-Vegetarian?";
      setDietPrefState('normal');
    }
    else if (lowerText.includes("leg")) {
      aiReply = "🔥 Legs Workout:\n\n1. Squats – 4x12\n2. Lunges – 3x12\n3. Leg Press – 4x10\n4. Romanian Deadlift – 3x10\n5. Calf Raises – 4x20\n\n💡 Tip: Focus on pushing through your heels and maintaining a deep range of motion.";
    } else if (lowerText.includes("bicep") || lowerText.includes("arm")) {
      aiReply = "💪 Arms & Biceps Workout:\n\n1. Barbell Curl – 4x12\n2. Hammer Curl – 3x12\n3. Preacher Curl – 3x10\n4. Concentration Curl – 3x12\n\n💡 Tip: Keep your elbows tucked and avoid swinging your back for maximum isolation.";
    } else if (lowerText.includes("chest")) {
      aiReply = "🦍 Chest Workout:\n\n1. Flat Bench Press – 4x10\n2. Incline Dumbbell Press – 3x12\n3. Cable Crossovers – 4x15\n4. Push-ups – 3x Max\n\n💡 Tip: Squeeze your pecs together at the top of every movement to maximize growth.";
    } else if (lowerText.includes("back")) {
      aiReply = "🦇 Back Workout:\n\n1. Deadlifts – 4x8\n2. Pull-ups – 3x Max\n3. Barbell Rows – 4x10\n4. Lat Pulldowns – 3x12\n\n💡 Tip: Pull with your elbows and retract your scapula before starting the pull.";
    } else if (lowerText.includes("ab")) {
      aiReply = "🍫 Core & Abs Workout:\n\n1. Crunches – 4x20\n2. Planks – 3x 60s\n3. Hanging Leg Raises – 3x15\n4. Russian Twists – 4x20\n\n💡 Tip: Breathe out deeply on contraction and keep your core maximally braced.";
    } else if (lowerText.includes("beginner routine")) {
      aiReply = "🌱 Beginner Routine (3x/week):\n\n1. Squats – 3x10\n2. Pushups – 3x Max\n3. Dumbbell Rows – 3x12\n4. Plank – 3x 45s\n\n💡 Tip: Focus on form and consistency before adding heavy weights.";
    } else if (lowerText.includes("full body")) {
      aiReply = "🔥 Full Body Power:\n\n1. Deadlift – 3x5\n2. Bench Press – 3x8\n3. Squats – 3x8\n4. Pull-ups – 3x Max\n\n💡 Tip: Compound movements burn the most fat and build the most muscle.";
    } else if (lowerText.includes("weight loss") || lowerText.includes("fat loss")) {
      aiReply = "🔥 Fat Loss Tips:\n\n1. Caloric Deficit – Eat fewer calories than you burn.\n2. High Protein – Retains muscle mass while cutting.\n3. Cardio – HIIT or steady-state 3x a week.\n4. Hydration – 3L of water daily.\n\n💡 Tip: Consistency beats intensity. Stick to the deficit strictly for 4+ weeks to see real results.";
    } else {
      aiReply = "👋 I'm GymTrack AI!\n\nWorkout plan coming soon for that specific request. Try asking about:\n• 'legs workout'\n• 'beginner routine'\n• 'full body'";
    }

    // Simulate AI typing delay
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), text: aiReply, sender: 'ai' }
      ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={styles.chatArea} 
          showsVerticalScrollIndicator={false}
        >
          {/* Messages */}
          <View style={{ flexShrink: 1 }}>
            {messages.map((msg) => (
              <View key={msg.id} style={[
                styles.messageBubble, 
                msg.sender === 'user' ? [styles.userBubble, { backgroundColor: theme.primary }] : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border }]
              ]}>
                <Text style={[styles.messageText, msg.sender === 'user' ? { color: '#fff' } : { color: theme.text }]}>{msg.text}</Text>
              </View>
            ))}
            
            {isTyping && (
              <View style={[styles.typingIndicator, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.dotRow}>
                  <TypingDot delay={0} />
                  <TypingDot delay={200} />
                  <TypingDot delay={400} />
                </View>
                <Text style={[styles.typingText, { color: theme.subtext, marginLeft: 10 }]}>
                  GymTrack AI
                </Text>
              </View>
            )}
          </View>


          {/* Spacer to push content */}
          <View style={{ flex: 1 }} />

          {/* Quick Suggestions Buttons */}
          <View style={{ marginTop: 20 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {QUICK_SUGGESTIONS.map(s => (
                  <TouchableOpacity 
                    key={s} 
                    onPress={() => setInputText(s)} 
                    style={[styles.suggestionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.suggestionTxt, { color: theme.text }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Persistent Input Bar */}
        <View style={[styles.inputBarContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Ask about a workout..."
              placeholderTextColor={theme.subtext}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.primary }]} 
              onPress={handleSend}
            >
              <Text style={[styles.sendButtonText, { color: theme.selectedText }]}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chatArea: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexGrow: 1 },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 20, marginBottom: 12, marginTop: 8 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  typingIndicator: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginBottom: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  dotRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B3B' },
  typingText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  
  inputBarContainer: { paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, marginBottom: 4 },

  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginRight: 10, borderWidth: 1 },
  sendButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, justifyContent: 'center' },
  sendButtonText: { fontWeight: 'bold', fontSize: 15 },

  suggestionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  suggestionTxt: { fontSize: 13, fontWeight: '700' },
});