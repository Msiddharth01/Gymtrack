import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { auth } from "../../firebase/config";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { theme, mode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getErrorMessage = (error: any) => {
    const code = error?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    if (code === 'auth/too-many-requests') {
      return "Too many failed login attempts. Please wait a few minutes before trying again.";
    }
    if (code === 'auth/unauthorized-domain') {
      return "Domain not authorized. Please add your web domain to Firebase Console > Authentication > Settings > Authorized domains.";
    }
    if (code === 'auth/invalid-email') {
      return "Invalid email format. Please check your email address.";
    }
    return error?.message || "Failed to sign in. Please try again.";
  };

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)/tracker');
    } catch (error: any) {
      console.log("LOGIN ERROR", error);
      Alert.alert("Login Failed", getErrorMessage(error));
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
        {/* Branding */}
        <View style={styles.brandingContainer}>
          <Text style={[styles.appName, { color: theme.text }]}>GymTrack</Text>
          <Text style={[styles.tagline, { color: theme.subtext }]}>Train smarter. Track better.</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>

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
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: theme.subtext }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={[styles.signupLink, { color: theme.primary }]}>Sign up</Text>
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
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signupText: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  signupLink: { fontSize: 14, fontWeight: "800" },
});
