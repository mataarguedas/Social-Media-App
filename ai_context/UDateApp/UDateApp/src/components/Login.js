import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://10.0.2.2:5000'; // Use the correct address for the emulator

const Login = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/accounts/login/`, {
        username,
        password
      });

      await login(response.data.access);
      // Navigation is handled by AppNavigator in App.js
    } catch (error) {
      console.error('Error response:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        errorMessage = 'No response from the server. Please check your network connection.';
      } else {
        errorMessage = 'An error occurred. Please try again.';
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('/home/emma/app/UDateApp/UDateApp/public/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Login</Text>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username:</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Password:</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec729c',
    padding: 20
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  form: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 20
  },
  formGroup: {
    marginBottom: 15
  },
  label: {
    color: '#fff',
    marginBottom: 5,
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 10,
    color: '#000'
  },
  button: {
    backgroundColor: '#ec729c',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center'
  },
  registerText: {
    color: '#fff',
    textDecorationLine: 'underline'
  }
});

export default Login;