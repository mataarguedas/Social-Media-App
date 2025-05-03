import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform, // Import Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
// --- Import Date Time Picker ---
import DateTimePicker from '@react-native-community/datetimepicker';

// --- University Mapping ---
const universityMap = {
  'ucr.ac.cr': 'Universidad de Costa Rica (UCR)',
  'una.cr': 'Universidad Nacional (UNA)',
  'uned.cr': 'Universidad Estatal a Distancia (UNED)',
  'utn.ac.cr': 'Universidad Técnica Nacional (UTN)',
  'tec.ac.cr': 'Instituto Tecnológico de Costa Rica (TEC)',
  'earth.ac.cr': 'Universidad EARTH',
  'incase.edu': 'Instituto Nacional de Aprendizaje (INA)', // Assuming incase.edu maps to INA based on list order
  'ulatina.ac.cr': 'Universidad Latina de Costa Rica (ULatina)',
  'ulacit.ac.cr': 'Universidad Latinoamericana de Ciencia y Tecnología (ULACIT)',
  'veritas.cr': 'Universidad VERITAS',
  'uam.cr': 'Universidad Americana (UAM)',
  'uci.ac.cr': 'Universidad para la Cooperación Internacional (UCI)',
  'uaca.cr': 'Universidad Autónoma de Centroamérica (UACA)',
  'uiberoamerica.cr': 'Universidad de Iberoamérica (UNIBE)',
  'ucienciasmedicas.cr': 'Universidad de Ciencias Médicas (UCIMED)',
  'ucartago.cr': 'Universidad de Cartago (UCAR)',
  'usj.cr': 'Universidad San Judas Tadeo (USJ)',
  'ucienciasyarte.cr': 'Universidad de Ciencias y Artes de América Latina (UCAL)',
  'ufsjt.cr': 'Universidad Federada San Judas Tadeo (UFSJT)',
  'umagister.cr': 'Universidad Magister',
  'uip.cr': 'Universidad Internacional de las Américas (UIA)',
  'ucsa.cr': 'Universidad Católica Santo Ángel (UCSA)', // Corrected domain mapping based on user list
  'upapa.cr': 'Universidad Pablo de Olavide (UPO)', // Corrected domain mapping based on user list
  'uisil.cr': 'Universidad Internacional San Isidro Labrador (UISIL)',
  'uem.cr': 'Universidad Empresarial de Costa Rica (UEM)',
  'uicr.cr': 'Universidad Interamericana de Costa Rica (UICR)',
  'uea.cr': 'Universidad Euroamericana (UEA)',
  'uca.cr': 'Universidad Centroamericana de Ciencias Empresariales (UCA)',
  'uct.cr': 'Universidad de Costa Tropical (UCT)',
  'usac.cr': 'Universidad San Carlos (USAC)',
  'usc.cr': 'Universidad San Marcos (USC)',
};

// Define the correct API URL
const API_URL = 'http://10.0.2.2:5000';

const calculateAge = (dob) => {
  if (!dob) return null;
  try {
    const birthDate = new Date(dob);
    // Check if dob string was parsed correctly
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    console.error("Error calculating age:", e);
    return null; // Return null or some indicator of error
  }
};

const Profile = () => {
  const navigation = useNavigation();
  const { logout } = useAuth(); // Get logout function from context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({
    username: '',
    email: '',
    profile: {
      bio: '',
      profile_picture: null,
      full_name: '', // New
      date_of_birth: null, // New - use null for dates initially
      location: '', // New
      career: '', // New
      college_start_date: null, // New - use null for dates initially
    },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // For image picker preview
  const [profileImageUrl, setProfileImageUrl] = useState(null); // For displaying fetched image URL
  const [selectedFile, setSelectedFile] = useState(null); // For uploading new image

  // --- State for Date Pickers ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState(''); // 'dob' or 'college'
  const [tempDate, setTempDate] = useState(new Date()); // Temporary date holder

  // --- Fetch Profile Data ---
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          logout(); // Use context logout which handles state change
          return;
        }

        const urlToFetch = `${API_URL}/api/accounts/profile/`;
        console.log("PROFILE FETCH: Attempting GET request to:", urlToFetch);

        const response = await axios.get(urlToFetch, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = {
          ...response.data,
          // Ensure profile object exists, even if null/empty from backend
          profile: response.data.profile || { bio: '', profile_picture: null },
        };
        setUser(userData);

        // Construct and set the full image URL if profile_picture exists
        if (userData.profile && userData.profile.profile_picture) {
          const imageUrl = `${API_URL}/uploads/${userData.profile.profile_picture}`;
          console.log("Setting profile image URL:", imageUrl);
          setProfileImageUrl(imageUrl); // Use a separate state for fetched URL
          setPreviewImage(imageUrl); // Also set preview for initial display
        } else {
          setProfileImageUrl(null); // Clear image URL if none exists
          setPreviewImage(null); // Clear preview
        }

      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
          if (error.response.status === 401) {
            setError('Authentication failed. Please log in again.');
            logout(); // Use context logout
          } else {
            setError(`Failed to load profile (${error.response.status}). Please try again later.`);
          }
        } else if (error.request) {
          setError('Failed to load profile. No response from server.');
        }
        else {
          setError('Failed to load profile. An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Dependency array is empty, fetch only once on mount

  // --- Derive University Name ---
  const universityName = useMemo(() => {
    if (user && user.email) {
      const domain = user.email.split('@')[1];
      return universityMap[domain] || `Unknown Domain (${domain})`;
    }
    return 'University Not Specified'; // Default or loading state
  }, [user.email]); // Recalculate only when email changes

  const age = useMemo(() => calculateAge(user.profile?.date_of_birth), [user.profile?.date_of_birth]);

  // --- Handle Input Changes (for editing) ---
  const handleInputChange = (name, value) => {
    // Update nested profile fields
    if (['full_name', 'location', 'career', 'bio'].includes(name)) {
      setUser(prev => ({
        ...prev,
        profile: { ...prev.profile, [name]: value }
      }));
    } else if (name === 'username') { // Update top-level username
      setUser(prev => ({ ...prev, [name]: value }));
    }
    // Date changes are handled separately by onDateChange
  };

  // --- Date Picker Handlers ---
  const showDatepickerModal = (target) => {
    setDatePickerTarget(target);
    // Set initial date for picker (use existing value or today)
    const currentDate = target === 'dob' ? user.profile?.date_of_birth : user.profile?.college_start_date;
    setTempDate(currentDate ? new Date(currentDate) : new Date());
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Hide automatically on Android after selection
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      if (datePickerTarget === 'dob') {
        setUser(prev => ({ ...prev, profile: { ...prev.profile, date_of_birth: dateString } }));
      } else if (datePickerTarget === 'college') {
        setUser(prev => ({ ...prev, profile: { ...prev.profile, college_start_date: dateString } }));
      }
    }
  };


  // --- Handle Image Picking ---
  const handleImagePick = () => {
    // (Keep existing handleImagePick logic - see previous versions)
    const options = { /* ... */ };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) { return; }
      if (response.errorCode) { /* handle error */ return; }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setPreviewImage(asset.uri); // Show local preview immediately
        setSelectedFile({ // Prepare file for upload
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `profile_${Date.now()}.jpg`,
        });
      }
    });
  };


  // --- Handle Profile Update Submission ---
  const handleSubmit = async () => {
    setUpdating(true); // Use separate loading state for updates
    setError(null);
    try {
      const token = await AsyncStorage.getItem('access_token');

      // Prepare data payload - send only fields managed by UserSerializer/ProfileSerializer
      const profilePayload = {
        full_name: user.profile?.full_name || '',
        date_of_birth: user.profile?.date_of_birth || null,
        location: user.profile?.location || '',
        career: user.profile?.career || '',
        college_start_date: user.profile?.college_start_date || null,
        bio: user.profile?.bio || '',
      };

      // Decide data format: FormData for file uploads, JSON otherwise
      let dataToSend;
      let headers = { Authorization: `Bearer ${token}` };

      if (selectedFile) { // If new image is selected, use FormData
        dataToSend = new FormData();
        // Append non-file profile fields (check if backend expects nested or flat)
        // Assuming nested 'profile' data based on UserSerializer structure
        Object.keys(profilePayload).forEach(key => {
          // FormData usually expects string values or Blobs/Files
          if (profilePayload[key] !== null) { // Avoid sending null as "null" string
            dataToSend.append(`profile.${key}`, String(profilePayload[key]));
          }
        });
        dataToSend.append('username', user.username); // Send username if editable
        dataToSend.append('profile_picture', selectedFile); // Append the new file object
        headers['Content-Type'] = 'multipart/form-data';
      } else { // If no new image, send JSON
        dataToSend = {
          username: user.username, // Send username if editable
          profile: profilePayload, // Send nested profile data
        };
        headers['Content-Type'] = 'application/json';
      }


      const response = await axios.put(`${API_URL}/api/accounts/profile/`, dataToSend, { headers });

      console.log('Profile updated successfully:', response.data);
      const updatedUser = {
        ...response.data,
        profile: response.data.profile || { /* default profile fields */ },
      };
      setUser(updatedUser);

      if (updatedUser.profile && updatedUser.profile.profile_picture) {
        const imageUrl = `${API_URL}/uploads/${updatedUser.profile.profile_picture}`;
        setProfileImageUrl(imageUrl);
        setPreviewImage(imageUrl);
      } else if (!selectedFile) {
        setProfileImageUrl(null);
        setPreviewImage(null);
      }

      setIsEditing(false);
      setSelectedFile(null);

    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error);
      setError('Failed to update profile. Please try again.');
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // --- Handle Logout ---
  const handleLogout = () => {
    logout(); // Use context logout
  };

  // --- Render Logic ---
  if (loading && !user.username) { // Show loading only on initial fetch
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec729c" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (error && !user.username) { // Show full screen error only if initial fetch failed
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }


  // --- Main Profile Display ---
  console.log("Current isEditing state:", isEditing); 
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.profileContainer}>
        {/* Header with Title and Action Buttons */}
        <View style={styles.profileHeader}>
          {/* ... Header content ... */}
        </View>

        {/* Display general errors during editing */}
        {/* ... Error display ... */}

        {/* Profile Content Area */}
        <View style={styles.profileContent}>
          {/* Profile Picture (same as before) */}
          <View style={styles.profilePictureContainer}>
            {/* ... Image and Upload Button ... */}
          </View>

          {/* Profile Details */}
          <View style={styles.profileDetails}>
            {isEditing ? (
              // --- EDITING VIEW ---
              <View style={styles.editForm}>
                {/* Username */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Username:</Text>
                  {/* ... TextInput for username ... */}
                </View>
                {/* Full Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Full Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={user.profile?.full_name || ''}
                    onChangeText={(text) => handleInputChange('full_name', text)}
                    placeholder="Your full name"
                  />
                </View>
                {/* Email (Display Only) */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email:</Text>
                  <TextInput style={[styles.input, styles.disabledInput]} value={user.email} editable={false} />
                </View>
                {/* University (Display Only) */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>University:</Text>
                  <TextInput style={[styles.input, styles.disabledInput]} value={universityName} editable={false} />
                </View>
                {/* Career */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Career:</Text>
                  <TextInput
                    style={styles.input}
                    value={user.profile?.career || ''}
                    onChangeText={(text) => handleInputChange('career', text)}
                    placeholder="Your career"
                  />
                </View>
                {/* Location */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Location:</Text>
                  <TextInput
                    style={styles.input}
                    value={user.profile?.location || ''}
                    onChangeText={(text) => handleInputChange('location', text)}
                    placeholder="City, Country"
                  />
                </View>
                {/* Date of Birth */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Date of Birth:</Text>
                  <TouchableOpacity onPress={() => showDatepickerModal('dob')} style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{user.profile?.date_of_birth || 'Select Date'}</Text>
                  </TouchableOpacity>
                </View>
                {/* College Start Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>College Start Date:</Text>
                  <TouchableOpacity onPress={() => showDatepickerModal('college')} style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{user.profile?.college_start_date || 'Select Date'}</Text>
                  </TouchableOpacity>
                </View>
                {/* Bio */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Bio:</Text>
                  {/* ... TextInput for bio ... */}
                </View>
              </View>
            ) : (
              // --- DISPLAY VIEW ---
              <View style={styles.profileInfo}>
                <Text style={styles.username}>{user.profile?.full_name || user.username}</Text> {/* Display full name if available */}
                <Text style={styles.detailsBelowName}>
                  {/* Display Age if DOB is available */}
                  {age !== null && `${age} years old`}
                  {/* Add separator if both age and location exist */}
                  {age !== null && user.profile?.location ? ' • ' : ''}
                  {user.profile?.location}
                </Text>
                <Text style={styles.university}>{universityName}</Text>
                <Text style={styles.career}>{user.profile?.career || 'Career not specified'}</Text>
                <Text style={styles.email}>{user.email}</Text>
                {/* Display College Start Date if available */}
                {user.profile?.college_start_date &&
                  <Text style={styles.detailItem}>Started College: {user.profile.college_start_date}</Text>
                }
                <View style={styles.bioSection}>
                  <Text style={styles.bioTitle}>Bio:</Text>
                  <Text style={styles.bioText}>{user.profile?.bio || 'No bio yet.'}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* --- Date Picker Modal --- */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={tempDate} // Use temp date state
            mode={'date'}
            is24Hour={true}
            display="default" // Or "spinner"
            onChange={onDateChange}
            // Optional: Set max date, e.g., maximumDate={new Date()} for DOB
            maximumDate={datePickerTarget === 'dob' ? new Date() : undefined}
          />
        )}
      </View>
    </ScrollView>
  );
};

// --- Styles ---
// (Keep existing styles and add/modify as needed)
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa' // Light background for scrollable area
  },
  profileContainer: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#ec729c', // Maybe remove this background or choose a lighter one
    backgroundColor: '#fff', // White background for profile card look
    borderRadius: 8,
    margin: 15,
    shadowColor: '#000', // Add some shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: { /* existing style */ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { /* existing style */ marginTop: 10, fontSize: 18, color: '#555' },
  errorContainer: { /* existing style */ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  errorText: { /* existing style */ fontSize: 16, color: '#e74c3c', textAlign: 'center' },
  profileHeader: { /* existing style */ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { /* existing style */ fontSize: 24, color: '#333', fontWeight: 'bold' },
  actionButtons: { /* existing style */ flexDirection: 'row', gap: 10, alignItems: 'center' }, // Added alignItems
  editButton: { /* existing style */ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#007bff', borderRadius: 4 },
  editButtonText: { /* existing style */ color: 'white', fontSize: 14 },
  saveButton: { /* existing style */ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#28a745', borderRadius: 4 },
  saveButtonText: { /* existing style */ color: 'white', fontSize: 14 },
  cancelButton: { /* existing style */ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#6c757d', borderRadius: 4 },
  cancelButtonText: { /* existing style */ color: 'white', fontSize: 14 },
  logoutButton: { /* existing style */ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#dc3545', borderRadius: 4 },
  logoutButtonText: { /* existing style */ color: 'white', fontSize: 14 },
  profileContent: { /* existing style */ flexDirection: 'column' }, // Default is column, but explicit
  profilePictureContainer: { /* existing style */ alignItems: 'center', marginBottom: 25 },
  profilePicture: { /* existing style */ width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#eee', backgroundColor: '#ccc' }, // Adjusted size
  profilePicturePlaceholder: { /* existing style - might not be needed if using default image */ width: 150, height: 150, borderRadius: 75, backgroundColor: '#6c757d', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { /* existing style */ fontSize: 60, fontWeight: 'bold', color: 'white' },
  uploadButton: { /* existing style */ marginTop: 15, backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 4 },
  uploadButtonText: { /* existing style */ color: 'white', fontSize: 14 },
  profileDetails: { /* existing style */ flex: 1, marginTop: 20 }, // Added margin top
  profileInfo: { /* existing style */ paddingHorizontal: 10 }, // Use padding for spacing
  username: { /* existing style */ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'center' },
  email: { /* existing style */ fontSize: 16, color: '#666', marginBottom: 5, textAlign: 'center' },
  university: { // Added style for university
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bioSection: { /* existing style */ marginBottom: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  bioTitle: { /* existing style */ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 }, // Slightly bolder
  bioText: { /* existing style */ color: '#555', lineHeight: 22, fontSize: 15 }, // Adjusted line height/size
  // Edit Form Styles
  editForm: { /* existing style */ width: '100%' },
  formGroup: { /* existing style */ marginBottom: 20 }, // Increased spacing
  label: { /* existing style */ marginBottom: 8, color: '#333', fontWeight: '500', fontSize: 15 }, // Slightly larger label
  input: { /* existing style */ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, fontSize: 15, backgroundColor: '#fff' }, // Adjusted padding/border
  bioInput: { /* existing style */ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, fontSize: 15, textAlignVertical: 'top', minHeight: 120, backgroundColor: '#fff' }, // Adjusted padding/height
  disabledInput: { /* existing style */ backgroundColor: '#e9ecef', color: '#6c757d' }, // Standard disabled look
  detailsBelowName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  career: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '500',
  },
  university: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10, // Reduced margin
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailItem: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 15,
  },
  // Style for the date picker touchable area
  dateDisplay: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 15,
    color: '#000', // Color to show text
  }
});

export default Profile;