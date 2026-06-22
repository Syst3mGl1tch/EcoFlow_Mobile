import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import EcoFlowLogo from '../components/EcoFlowLogo';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <EcoFlowLogo size={120} showText={false} />
        <Text style={styles.title}>{'Descarte\ncorretamente\ncom EcoFlow'}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/welcome')} activeOpacity={0.85}>
        <Text style={styles.btnText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 36,
    paddingBottom: 48,
    paddingTop: 80,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 52,
  },
  btn: {
    backgroundColor: Colors.background,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
