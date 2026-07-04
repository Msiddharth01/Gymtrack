import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { theme, mode } = useTheme();
  
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <Tabs
      initialRouteName="tracker"
      screenOptions={{

        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        },
        headerTitleStyle: {
          color: theme.text,
          fontWeight: 'bold'
        },
        headerTintColor: theme.text,
        sceneStyle: { backgroundColor: theme.background }
      }}>
      <Tabs.Screen
        name="tracker"
        options={{
          headerShown: false,
          title: 'Tracker',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          headerShown: false,
          title: 'Train',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'ChatBot',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
