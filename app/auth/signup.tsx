import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebase/config";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
  const { theme, mode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      if (!email || !email.includes('@')) {
        Alert.alert("Invalid Email", "Please enter a valid email");
        return;
      }

      if (!password || password.length < 6) {
        Alert.alert("Weak Password", "Password must be at least 6 characters");
        return;
      }

      setLoading(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      Alert.alert("Success", "Account created!");

      router.replace("/tracker");

    } catch (error: any) {
      Alert.alert("Signup Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.brandingContainer}>
          <Text style={[styles.appName, { color: theme.text }]}>GymTrack</Text>
          <Text style={[styles.tagline, { color: theme.subtext }]}>Train smarter. Track better.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Create Account</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: theme.subtext }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  brandingContainer: { alignItems: "center", marginBottom: 28 },
  appName: { fontSize: 42, fontWeight: "900", letterSpacing: -1, marginBottom: 4 },
  tagline: { fontSize: 13, fontWeight: "600", opacity: 0.6, letterSpacing: 0.5 },
  card: { borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12, borderWidth: 1 },
  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: 24, textAlign: 'center', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  button: { borderRadius: 16, height: 56, alignItems: "center", justifyContent: 'center', marginTop: 12, marginBottom: 20, shadowColor: '#FF3B3B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  loginText: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  loginLink: { fontSize: 14, fontWeight: "800" },
});
