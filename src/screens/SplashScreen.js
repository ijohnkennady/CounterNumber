// ─── Splash Screen ────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';



export default function SplashScreen({ navigation }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;
  const slideY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.timing(slideY,{ toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Navigate to Home after 2.6s
    const timer = setTimeout(() => navigation.replace('Home'), 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ scale }, { translateY: slideY }] }]}>
        {/* Icon badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeDigits}>0–9</Text>
        </View>

        <Text style={styles.title}>Counter Numbers</Text>
        <Text style={styles.sub}>Track  ·  Count  ·  Share</Text>
      </Animated.View>

      {/* Bottom version tag */}
      <Animated.Text style={[styles.version, { opacity: fade }]}>v1.0</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  badgeDigits: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },
});
