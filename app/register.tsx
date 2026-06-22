import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors } from '../constants/theme';
import EcoFlowIcon from '../components/EcoFlowIcon';
import { createUsuario } from '../src/services/usuarioService';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Atencao', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createUsuario({ nome: name, username: email, password });
      router.replace('/login');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar conta.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topIcon}>
        <EcoFlowIcon size={80} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Cadastro</Text>

          {[
            { placeholder: 'Nome', value: name, setter: setName, keyboard: 'default' as const, secure: false },
            { placeholder: 'Email', value: email, setter: setEmail, keyboard: 'email-address' as const, secure: false },
            { placeholder: 'Senha', value: password, setter: setPassword, keyboard: 'default' as const, secure: true },
            { placeholder: 'Confirmar senha', value: confirmPassword, setter: setConfirmPassword, keyboard: 'default' as const, secure: true },
          ].map((field) => (
            <TextInput
              key={field.placeholder}
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.placeholder}
              value={field.value}
              onChangeText={field.setter}
              keyboardType={field.keyboard}
              secureTextEntry={field.secure}
              autoCapitalize="none"
            />
          ))}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.7 }]} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.btnPrimaryText}>Cadastrar-se</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
            <Text style={styles.btnBackText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  topIcon: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 8,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.backgroundBeige,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPrimary: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  btnBack: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  btnBackText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
});
