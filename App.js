// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { purgeOldEntries } from './src/utils/storage';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen   from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    purgeOldEntries(); // ← runs once on every app open, silently cleans old data
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home"   component={HomeScreen}   />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}