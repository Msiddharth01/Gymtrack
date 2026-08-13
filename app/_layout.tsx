import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootLayoutContent() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { theme } = useTheme();

  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 1500);

    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
      clearTimeout(timer);
    });

    return () => {
      clearTimeout(timer);
      subscriber();
    };
  }, []);

  useEffect(() => {
    if (initializing) return;
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segments.some(s => s === 'auth' || s === 'login' || s === 'signup');

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/tracker');
    }

  }, [user, initializing, segments, rootNavigationState?.key]);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.text,
      contentStyle: { backgroundColor: theme.background } 
    }}>
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Profile' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}