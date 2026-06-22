import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('usuario').then((value) => {
      if (value) {
        router.replace('/home');
      }
    });
  }, []);

  return (
    <Stack
      initialRouteName="splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
