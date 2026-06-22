import { Platform } from 'react-native';

// Android Emulator usa 10.0.2.2 para acessar o localhost do PC
// Dispositivo físico: troque pelo IP do seu PC na rede Wi-Fi (ex: 192.168.1.10)
const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'
    : 'http://localhost:8080';

export default BASE_URL;
