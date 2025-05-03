import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();

// Converted CSS to React Native StyleSheet
const styles = StyleSheet.create({
  app: {
    textAlign: 'center',
  },
  appLogo: {
    height: 200, // converted from 40vmin
    width: 200, // added width to maintain aspect ratio
    resizeMode: 'contain',
  },
  appHeader: {
    backgroundColor: '#282c34',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20, // converted from calc(10px + 2vmin)
    color: 'white',
  },
  appLink: {
    color: '#61dafb',
  },
});

// Component to handle protected routes
const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Profile" component={Profile} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <View style={styles.app}>
            <AppNavigator />
          </View>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
