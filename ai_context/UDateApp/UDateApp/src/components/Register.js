import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://10.0.2.2:5000'; // Use the correct address for the emulator


const Register = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    emailAccount: '',
    emailDomain: 'ucr.ac.cr',
    password: ''
  });
  
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    general: ''
  });
  
  const [popup, setPopup] = useState({
    show: false,
    message: ''
  });
  
  const [loading, setLoading] = useState(false);

  const allowedDomains = [
    'ucr.ac.cr',
    'una.cr',
    'uned.cr',
    'utn.ac.cr',
    'tec.ac.cr',
    'earth.ac.cr',
    'incase.edu',
    'ulatina.ac.cr',
    'ulacit.ac.cr',
    'veritas.cr',
    'uam.cr',
    'uci.ac.cr',
    'uaca.cr',
    'uiberoamerica.cr',
    'ucienciasmedicas.cr',
    'ucartago.cr',
    'usj.cr',
    'ucienciasyarte.cr',
    'ufsjt.cr',
    'umagister.cr',
    'uip.cr',
    'ucsa.cr',
    'upapa.cr',
    'uisil.cr',
    'uem.cr',
    'uicr.cr',
    'uea.cr',
    'uca.cr',
    'uct.cr',
    'usac.cr',
    'usc.cr'
  ];

  
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({
      username: '',
      email: '',
      password: '',
      general: ''
    });

    // Validation
    if (!formData.username || !formData.emailAccount || !formData.password) {
      setErrors(prev => ({
        ...prev,
        general: 'Please fill in all fields'
      }));
      return;
    }

    setLoading(true);
    const fullEmail = `${formData.emailAccount}@${formData.emailDomain}`;
    const completeFormData = {
      username: formData.username,
      email: fullEmail,
      password: formData.password
    };

    try {
      const response = await axios.post(`${API_URL}/api/accounts/register/`, completeFormData);
      console.log(response.data);
      setPopup({
        show: true,
        message: 'Registration successful!'
      });
      
      setTimeout(() => {
        setPopup({ show: false, message: '' });
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      console.error(error);
      
      if (error.response) {
        const data = error.response.data;
        
        // Handle specific field errors
        if (data.email) {
          setErrors(prev => ({ ...prev, email: data.email[0] }));
          
          // Show popup for email already registered
          if (data.email[0].includes("ya está registrado")) {
            setPopup({
              show: true,
              message: `El correo electrónico ${fullEmail} ya está registrado.`
            });
          }
        }
        if (data.username) {
          setErrors(prev => ({ ...prev, username: data.username[0] }));
        }
        if (data.password) {
          setErrors(prev => ({ ...prev, password: data.password[0] }));
        }
        
        // If no specific field errors but still failed
        if (!data.email && !data.username && !data.password) {
          setErrors(prev => ({ 
            ...prev, 
            general: 'Registration failed. Please check your inputs.' 
          }));
        }
      } else if (error.request) {
        setErrors(prev => ({ 
          ...prev, 
          general: 'No response from the server. Please check your network connection.' 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          general: 'An error occurred. Please try again.' 
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Close popup after 3 seconds
  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => {
        setPopup({ show: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [popup.show]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>User Registration</Text>
        
        {errors.general ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        ) : null}
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Username:</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData({...formData, username: text})}
              placeholder="Enter username"
              placeholderTextColor="#999"
            />
            {errors.username ? (
              <Text style={styles.fieldError}>{errors.username}</Text>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email:</Text>
            <View style={styles.emailGroup}>
              <View style={styles.emailAccount}>
                <TextInput
                  style={styles.input}
                  value={formData.emailAccount}
                  onChangeText={(text) => setFormData({...formData, emailAccount: text})}
                  placeholder="username"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.emailDomain}>
                <Picker
                  selectedValue={formData.emailDomain}
                  style={styles.picker}
                  onValueChange={(itemValue) => setFormData({...formData, emailDomain: itemValue})}
                >
                  {allowedDomains.map((domain) => (
                    <Picker.Item key={domain} label={`@${domain}`} value={domain} />
                  ))}
                </Picker>
              </View>
            </View>
            {errors.email ? (
              <Text style={styles.fieldError}>{errors.email}</Text>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
        
        {/* Popup Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={popup.show}
          onRequestClose={() => setPopup({ show: false, message: '' })}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupContent}>
              <Text style={styles.popupMessage}>{popup.message}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setPopup({ show: false, message: '' })}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec729c',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  errorBox: {
    backgroundColor: '#fadbd8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%'
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center'
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
    marginBottom: 5
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 10,
    color: '#000'
  },
  emailGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emailAccount: {
    flex: 1,
    marginRight: 5
  },
  emailDomain: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 50, // Increased height slightly
    justifyContent: 'center', // Center vertically might help
  },
  picker: {
    width: '100%',
    height: 60,
    color: '#000'
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5
  },
  button: {
    backgroundColor: '#ff0000',
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
  loginLink: {
    marginTop: 20,
    alignItems: 'center'
  },
  loginText: {
    color: '#fff',
    textDecorationLine: 'underline'
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  popupContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    position: 'relative'
  },
  popupMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000'
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10
  },
  closeButtonText: {
    fontSize: 18,
    color: '#555'
  }
});

export default Register;