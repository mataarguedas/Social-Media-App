const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads/profile_pics');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile_pics/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const DJANGO_URL = 'http://localhost:8000/api/accounts';

app.post('/register', async (req, res) => {
    try {
        const response = await axios.post(`${DJANGO_URL}/register/`, req.body);
        res.status(201).json(response.data);
    } catch (error) {
        res.status(error.response.status).json(error.response.data);
    }
});

app.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${DJANGO_URL}/login/`, req.body);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(error.response.status).json(error.response.data);
    }
});

// Get user profile
app.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }
        
        const response = await axios.get(`${DJANGO_URL}/profile/`, {
            headers: { Authorization: token }
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Server error' });
    }
});

// Update user profile
app.put('/profile', upload.single('profile_picture'), async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }
        
        console.log('Request body:', req.body);
        console.log('File:', req.file);
        
        // Parse the userData from the form
        const userData = JSON.parse(req.body.userData || '{}');
        
        // Create a FormData instance to properly handle the multipart form data
        const formData = new FormData();
        
        // Build the profile data structure
        const profileData = {
            username: userData.username,
            profile: userData.profile || {}
        };
        
        // Add the profile data as a JSON string
        formData.append('data', JSON.stringify(profileData));
        
        // If a file was uploaded, add it to the form data
        if (req.file) {
            const filePath = path.join(__dirname, req.file.path);
            formData.append('profile_picture', fs.createReadStream(filePath), {
                filename: req.file.filename,
                contentType: req.file.mimetype
            });

            // Store only the filename part for the profile_picture field
            profileData.profile.profile_picture = `profile_pics/${req.file.filename}`;
        }
        
        console.log('Sending data to Django API...');
        
        const response = await axios.put(`${DJANGO_URL}/profile/`, formData, {
            headers: { 
                Authorization: token,
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        // Modify the response data to use our server path for the profile_picture
        const responseData = response.data;
        if (responseData.profile && responseData.profile.profile_picture && req.file) {
            // Update the profile_picture path to reflect what we'll serve from Express
            responseData.profile.profile_picture = `profile_pics/${req.file.filename}`;
        }
        
        console.log('Django API response (modified):', responseData);
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Profile update error details:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Server error: ' + error.message });
    }
});

// Serve uploaded files with CORS enabled
app.use('/uploads', (req, res, next) => {
    // Add CORS headers specifically for image resources
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Backend health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Server is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));