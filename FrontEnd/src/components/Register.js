import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// Adjust this path to match your Django urls.py mapping for RegisterView.
// Common examples: /api/register/ or /api/auth/register/
const REGISTER_ENDPOINT = `${BASE_URL}/api/register/`;

export default function Register({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const onSubmit = async () => {
    setErrors({});
    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrors(prev => ({ ...prev, form: 'Please fill in all fields.' }));
      return;
    }

    // basic email shape check; server will enforce allowed domains
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors(prev => ({ ...prev, email: 'Enter a valid email address.' }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Django/DRF returns field-based errors or detail messages.
        // Your serializer raises errors like "Este correo electrónico ya está registrado."
        // and also the message listing allowed domains when the domain isn't allowed.
        // We hoist those errors to the UI. :contentReference[oaicite:3]{index=3}
        const fieldErrors = {};
        if (data.username) fieldErrors.username = Array.isArray(data.username) ? data.username.join(' ') : String(data.username);
        if (data.email) fieldErrors.email = Array.isArray(data.email) ? data.email.join(' ') : String(data.email);
        if (data.password) fieldErrors.password = Array.isArray(data.password) ? data.password.join(' ') : String(data.password);
        if (data.detail) fieldErrors.form = String(data.detail);

        // If serializer sent a non-field error (e.g., domain not allowed) it may be under "non_field_errors" or email.
        if (data.non_field_errors) {
          fieldErrors.form = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : String(data.non_field_errors);
        }

        // If email domain is not allowed, your serializer’s email validator returns
        // a message that includes the allowed domains from settings.ALLOWED_EMAIL_DOMAINS. 
        setErrors(fieldErrors);
        return;
      }

      // Success: your RegisterView returns JWT tokens { refresh, access } on 201. :contentReference[oaicite:5]{index=5}
      if (data?.access && data?.refresh) {
        await AsyncStorage.multiSet([
          ['token_access', data.access],
          ['token_refresh', data.refresh],
          ['auth_username', username.trim()],
          ['auth_email', email.trim()],
        ]);

        Alert.alert('Welcome 🎉', 'Your account has been created.');
        // Navigate to your next screen (e.g., Profile/Home)
        // navigation?.replace('Home');
      } else {
        // Unexpected shape
        Alert.alert('Registered', 'Account created. Please log in.');
        // navigation?.navigate('Login');
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, form: 'Network error. Check your connection or server.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create your U Date account</Text>
      <Text style={styles.sub}>Only verified college emails can register.</Text>

      {!!errors.form && <Text style={styles.error}>{errors.form}</Text>}

      <View style={styles.field}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="yourusername"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, errors.username && styles.inputError]}
          returnKeyType="next"
        />
        {!!errors.username && <Text style={styles.errorSmall}>{errors.username}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>College Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@university.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, errors.email && styles.inputError]}
          returnKeyType="next"
        />
        {!!errors.email && <Text style={styles.errorSmall}>{errors.email}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.pwdRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPwd}
            autoCapitalize="none"
            style={[styles.input, styles.inputPwd, errors.password && styles.inputError]}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={() => setShowPwd(s => !s)} style={styles.pwdToggle}>
            <Text style={styles.pwdToggleText}>{showPwd ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {!!errors.password && <Text style={styles.errorSmall}>{errors.password}</Text>}
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={loading}
        style={[styles.btn, loading && { opacity: 0.7 }]}
      >
        {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation?.navigate?.('Login')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, justifyContent: 'center', backgroundColor: '#0b0b12' },
  header: { fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 6 },
  sub: { color: '#b8b8c3', marginBottom: 18 },
  field: { marginBottom: 14 },
  label: { color: '#e0e0ea', marginBottom: 6 },
  input: {
    backgroundColor: '#181825',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
  },
  inputPwd: { paddingRight: 70 },
  inputError: { borderColor: '#ff6b6b' },
  pwdRow: { position: 'relative', justifyContent: 'center' },
  pwdToggle: { position: 'absolute', right: 12, padding: 6 },
  pwdToggleText: { color: '#7d7df5', fontWeight: '600' },
  btn: {
    backgroundColor: '#7d7df5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#b8b8c3' },
  error: { color: '#ff8a8a', marginBottom: 8 },
  errorSmall: { color: '#ff8a8a', marginTop: 6, fontSize: 12 },
});
