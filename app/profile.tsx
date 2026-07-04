import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { theme, mode, toggleTheme } = useTheme();
  const email = auth.currentUser?.email || '';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!auth.currentUser) return;
        
        // Load persistence states
        const savedStatus = await AsyncStorage.getItem("isProfileSaved");
        if (savedStatus === 'true') {
          setIsProfileSaved(true);
        }

        // Load local profile first for instant display
        const local = await AsyncStorage.getItem("userProfile");
        if (local) {
          const parsed = JSON.parse(local);
          setFirstName(parsed.firstName || '');
          setLastName(parsed.lastName || '');
          setGender(parsed.gender || 'Male');
        }

        // Try to fetch from Firestore to sync latest data
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid, "profile", "main"));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setGender(data.gender || 'Male');
            
            await AsyncStorage.setItem("userProfile", JSON.stringify({
              firstName: data.firstName,
              lastName: data.lastName,
              gender: data.gender
            }));
          }
        } catch (firestoreErr: any) {
          // Firestore fetch failed — local data is still shown, this is non-fatal
          console.warn("Firestore fetch failed, using local data:", firestoreErr?.code);
        }
      } catch (e) {
        console.error("Fetch Error:", e);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    if (!firstName.trim()) {
      Alert.alert("Invalid Name", "First name is required");
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleSaveOrUpdate = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        gender
      };

      // Always save locally first — this always succeeds
      await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
      await AsyncStorage.setItem("isProfileSaved", "true");

      setIsProfileSaved(true);
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Profile saved successfully!");

      // Try to sync to Firestore in the background
      setDoc(doc(db, "users", userId, "profile", "main"), profileData).catch((firestoreErr) => {
        console.warn("Firestore sync failed (local save succeeded):", firestoreErr?.code, firestoreErr?.message);
      });

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.multiRemove(["userProfile", "isProfileSaved"]);
      router.replace('/auth/login');
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not log out");
    }
  };

  const getInitials = () => {
    const f = firstName.charAt(0) || '';
    const l = lastName.charAt(0) || '';
    return (f + l).toUpperCase() || '?';
  };

  const isLocked = isProfileSaved && !isEditing;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Text style={[styles.backTxt, { color: theme.subtext }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{width: 50}} />
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>{getInitials()}</Text>
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>{firstName} {lastName}</Text>
        <Text style={[styles.userEmail, { color: theme.subtext }]}>{email}</Text>
      </View>
      
      {/* Bio Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Personal Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>First Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }, isLocked && styles.disabledInput]} 
            placeholder="John"
            placeholderTextColor={theme.subtext} 
            value={firstName} 
            onChangeText={setFirstName}
            editable={!isLocked}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>Last Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }, isLocked && styles.disabledInput]} 
            placeholder="Doe"
            placeholderTextColor={theme.subtext} 
            value={lastName} 
            onChangeText={setLastName}
            editable={!isLocked}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.subtext }]}>Email Address</Text>
          <TextInput 
            style={[styles.input, styles.lockedInput, { backgroundColor: theme.background, color: theme.subtext, borderColor: theme.border }]} 
            value={email} 
            editable={false} 
          />
        </View>

        <Text style={[styles.label, { color: theme.subtext }]}>Gender</Text>
        <View style={styles.rowChoices}>
          {['Male', 'Female', 'Other'].map(opt => (
            <TouchableOpacity 
              key={opt} 
              onPress={() => !isLocked && setGender(opt)} 
              disabled={isLocked}
              style={[
                styles.choiceBtn, 
                { backgroundColor: theme.background, borderColor: theme.border }, 
                gender === opt && { backgroundColor: theme.primary, borderColor: theme.primary },
                isLocked && gender !== opt && { opacity: 0.5 }
              ]}>
              <Text style={[styles.choiceTxt, { color: theme.subtext }, gender === opt && styles.choiceTxtActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferences Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>App Preferences</Text>
        <Text style={[styles.label, { color: theme.subtext }]}>Theme Mode</Text>
        <View style={styles.rowChoices}>
          <TouchableOpacity onPress={() => { if(mode !== 'dark') { toggleTheme(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } }} style={[styles.choiceBtn, { backgroundColor: theme.background, borderColor: theme.border }, mode === 'dark' && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
            <Text style={[styles.choiceTxt, { color: theme.subtext }, mode === 'dark' && styles.choiceTxtActive]}>Dark</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if(mode !== 'light') { toggleTheme(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } }} style={[styles.choiceBtn, { backgroundColor: theme.background, borderColor: theme.border }, mode === 'light' && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
            <Text style={[styles.choiceTxt, { color: theme.subtext }, mode === 'light' && styles.choiceTxtActive]}>Light</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Action Buttons */}
      {!isProfileSaved ? (
        <TouchableOpacity onPress={handleSaveOrUpdate} style={[styles.primaryBtn, { backgroundColor: theme.primary }]} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SAVE PROFILE</Text>}
        </TouchableOpacity>
      ) : isEditing ? (
        <TouchableOpacity onPress={handleSaveOrUpdate} style={[styles.primaryBtn, { backgroundColor: theme.primary }]} disabled={loading}>
           {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>UPDATE PROFILE</Text>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => { setIsEditing(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.outlineBtn, { borderColor: theme.primary }]}>
          <Text style={[styles.outlineBtnText, { color: theme.primary }]}>EDIT PROFILE</Text>
        </TouchableOpacity>
      )}


      <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: theme.border }]}>
        <Text style={[styles.logoutBtnText, { color: mode === 'dark' ? '#FF4444' : '#CC0000' }]}>SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: Platform.OS === 'ios' ? 40 : 20 },
  backBtn: { padding: 10, borderRadius: 12 },
  backTxt: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 14, fontWeight: '600', opacity: 0.8 },

  card: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 20 },
  
  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 15, fontWeight: '600' },
  disabledInput: { opacity: 0.5 },
  lockedInput: { opacity: 0.7 },
  
  rowChoices: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  choiceBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  choiceTxt: { fontWeight: '800', fontSize: 13 },
  choiceTxtActive: { color: '#fff' },
  
  primaryBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  outlineBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, borderWidth: 2 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  outlineBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  
  logoutBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderStyle: 'dashed' },
  logoutBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }
});
