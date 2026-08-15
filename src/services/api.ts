import { Platform } from 'react-native';

// Android Emulator: 10.0.2.2 | iOS Simulator: localhost | Dispositivo fisico: troque pelo IP do PC
const HOST =
  Platform.OS === 'android'
    ? '10.0.2.2'
    : 'localhost';

export const API_URL = `http://${HOST}:8080/api`;

console.log('[API] Platform:', Platform.OS);
console.log('[API] API_URL:', API_URL);
