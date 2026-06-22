import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import EcoFlowLogo from '../components/EcoFlowLogo';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <EcoFlowLogo size={140} />
        <Text style={styles.appName}>EcoFlow</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnLogin} onPress={() => router.push('/login')} activeOpacity={0.85}>
          <Text style={styles.btnLoginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnRegister} onPress={() => router.push('/register')} activeOpacity={0.85}>
          <Text style={styles.btnRegisterText}>Cadastro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBeige,
    paddingHorizontal: 36,
    paddingBottom: 56,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  buttons: {
    gap: 14,
    alignItems: 'center',
  },
  btnLogin: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    width: '80%',
  },
  btnLoginText: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '700',
  },
  btnRegister: {
    backgroundColor: Colors.card,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  btnRegisterText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
});
