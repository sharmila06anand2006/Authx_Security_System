const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Face registration endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, image } = req.body;

        if (!name || !image) {
            return res.status(400).json({ error: 'Name and image are required' });
        }

        // Generate user ID
        const userId = Date.now().toString();
        const faceId = `FACE_${userId}_${Date.now()}`;

        // Save image temporarily
        const imageData = image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(imageData, 'base64');
        const tempImagePath = path.join(__dirname, '..', 'temp', `${userId}.jpg`);

        // Ensure temp directory exists
        const tempDir = path.join(__dirname, '..', 'temp');
        try {
            await fs.mkdir(tempDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        await fs.writeFile(tempImagePath, imageBuffer);

        // Call Python script to process face encoding
        const pythonProcess = spawn('python', [
            path.join(__dirname, '..', 'python', 'train_face.py'),
            tempImagePath,
            name,
            userId
        ]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            // Clean up temp image
            try {
                await fs.unlink(tempImagePath);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }

            if (code === 0) {
                console.log('Face registration successful:', output);
                
                // Also save to face_data.json with image
                try {
                    const faceDataPath = path.join(__dirname, '..', 'db', 'data', 'face_data.json');
                    let faceData = {};
                    
                    try {
                        const data = await fs.readFile(faceDataPath, 'utf8');
                        faceData = JSON.parse(data);
                    } catch (err) {
                        // File doesn't exist or is empty
                    }

                    // Add image sample
                    if (!faceData[faceId]) {
                        faceData[faceId] = {
                            faceId: faceId,
                            userId: userId,
                            samples: []
                        };
                    }

                    faceData[faceId].samples.push({
                        image: image,
                        timestamp: new Date().toISOString()
                    });

                    await fs.writeFile(faceDataPath, JSON.stringify(faceData, null, 2));
                } catch (err) {
                    console.error('Error saving face data:', err);
                }

                res.json({
                    success: true,
                    message: 'Face registered successfully',
                    userId: userId,
                    faceId: faceId,
                    name: name
                });
            } else {
                console.error('Face registration failed:', errorOutput);
                res.status(500).json({
                    error: 'Face registration failed',
                    details: errorOutput || 'No face detected in image'
                });
            }
        });

    } catch (error) {
        console.error('Error in face registration:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get all registered faces
router.get('/registered', async (req, res) => {
    try {
        const usersPath = path.join(__dirname, '..', 'db', 'data', 'registered_users.json');
        const data = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(data);
        res.json(users);
    } catch (error) {
        console.error('Error reading registered users:', error);
        res.json([]);
    }
});

// Delete a registered face
router.delete('/registered/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Remove from registered users
        const usersPath = path.join(__dirname, '..', 'db', 'data', 'registered_users.json');
        let users = [];
        
        try {
            const data = await fs.readFile(usersPath, 'utf8');
            users = JSON.parse(data);
        } catch (err) {
            // File doesn't exist
        }

        users = users.filter(u => u.userId !== userId);
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        // Remove from face data
        const faceDataPath = path.join(__dirname, '..', 'db', 'data', 'face_data.json');
        let faceData = {};
        
        try {
            const data = await fs.readFile(faceDataPath, 'utf8');
            faceData = JSON.parse(data);
        } catch (err) {
            // File doesn't exist
        }

        // Remove all face IDs for this user
        Object.keys(faceData).forEach(faceId => {
            if (faceData[faceId].userId === userId) {
                delete faceData[faceId];
            }
        });

        await fs.writeFile(faceDataPath, JSON.stringify(faceData, null, 2));

        res.json({ success: true, message: 'Face deleted successfully' });
    } catch (error) {
        console.error('Error deleting face:', error);
        res.status(500).json({ error: 'Failed to delete face' });
    }
});

module.exports = router;
