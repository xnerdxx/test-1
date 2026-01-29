import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to tabs after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.title}>KrishiMitra</Text>
        <Text style={styles.titleTe}>కృషి మిత్ర</Text>
        <Text style={styles.subtitle}>Your Soil, Smarter. Your Harvest, Better.</Text>
        <Text style={styles.subtitleTe}>మీ నేల, తెలివైనది. మీ పంట, మెరుగైనది.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D7A3E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  titleTe: {
    fontSize: 28,
    fontWeight: '600',
    color: '#F4A300',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#F5E6D3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleTe: {
    fontSize: 14,
    color: '#F5E6D3',
    textAlign: 'center',
  },
});