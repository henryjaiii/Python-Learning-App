const http = require('http');
const https = require('https');

// Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore database
const db = admin.firestore();

const GEMINI_API_KEY = 'AIzaSyCMk8J0HNMqSwl7KmyRmM7TU68Jq9FYipQ';
const PORT = 3001;

// For executing Python code (simulated output)
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  // Set up CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Python code execution endpoint
  if (req.method === 'POST' && req.url === '/execute') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { code } = JSON.parse(body);
        console.log('📝 Executing Python code:', code);
        
        // Execute code using Python
        exec(`python -c "${code.replace(/"/g, '\\"')}"`, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            console.log('❌ Python execution error:', stderr || error.message);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: stderr || error.message }));
            return;
          }
          
          console.log('✅ Python executed successfully:', stdout);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ output: stdout || '(No output)' }));
        });
      } catch (error) {
        console.error('❌ Parse Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
  else if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const postData = JSON.stringify(requestData);
        
        const urlObj = new URL(geminiUrl);
        const options = {
          hostname: urlObj.hostname,
          port: 443,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        };

        const proxyReq = https.request(options, (proxyRes) => {
          let responseData = '';
          
          proxyRes.on('data', chunk => {
            responseData += chunk;
          });

          proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(responseData);
            console.log('✅ API request successful');
          });
        });

        proxyReq.on('error', (error) => {
          console.error('❌ Proxy Error:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        });

        proxyReq.write(postData);
        proxyReq.end();
        
      } catch (error) {
        console.error('❌ Parse Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } 
  // Test Firebase write
  else if (req.method === 'POST' && req.url === '/test-firebase') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        
        // Write to Firestore
        const docRef = await db.collection('test').add({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Firebase write successful! Document ID:', docRef.id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Data saved to Firebase!',
          documentId: docRef.id 
        }));
      } catch (error) {
        console.error('❌ Firebase Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  // Read Firebase data
  else if (req.method === 'GET' && req.url === '/test-firebase') {
    (async () => {
      try {
        const snapshot = await db.collection('test').orderBy('createdAt', 'desc').limit(10).get();
        const docs = [];
        snapshot.forEach(doc => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('✅ Firebase read successful! Total', docs.length, 'records');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: docs }));
      } catch (error) {
        console.error('❌ Firebase Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    })();
  }
  // Get lesson data
  else if (req.method === 'GET' && req.url.startsWith('/lessons/')) {
    const lessonId = req.url.split('/lessons/')[1];
    (async () => {
      try {
        const doc = await db.collection('lessons').doc(`lesson_${lessonId}`).get();
        
        if (!doc.exists) {
          console.log('❌ Lesson not found:', lessonId);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Lesson not found' }));
          return;
        }
        
        const lessonData = doc.data();
        console.log('✅ Lesson loaded successfully! Lesson ID:', lessonId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: lessonData }));
      } catch (error) {
        console.error('❌ Firebase Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    })();
  }
  // Get all lessons list
  else if (req.method === 'GET' && req.url === '/lessons') {
    (async () => {
      try {
        const snapshot = await db.collection('lessons').orderBy('id').get();
        const lessons = [];
        snapshot.forEach(doc => {
          lessons.push({ docId: doc.id, ...doc.data() });
        });
        
        console.log('✅ Lesson list loaded successfully! Total', lessons.length, 'lessons');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: lessons }));
      } catch (error) {
        console.error('❌ Firebase Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    })();
  }
  // User login verification - using Admin SDK + Firestore, no Web API Key required
  else if (req.method === 'POST' && req.url === '/auth/login') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        console.log('🔐 Login attempt for:', email);
        
        // Use Admin SDK to check if user exists
        let userRecord;
        try {
          userRecord = await admin.auth().getUserByEmail(email);
        } catch (getUserError) {
          console.log('❌ User not found:', email);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'User not found' 
          }));
          return;
        }
        
        // Get user record from Firestore and verify password
        try {
          const userDoc = await db.collection('users').doc(userRecord.uid).get();
          
          if (!userDoc.exists) {
            // First login, create user record
            await db.collection('users').doc(userRecord.uid).set({
              email: email,
              password: password,
              displayName: userRecord.displayName || '',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ First login - user record created');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName || '',
                emailVerified: userRecord.emailVerified
              }
            }));
            return;
          }
          
          // Verify password
          const userData = userDoc.data();
          if (userData.password !== password) {
            console.log('❌ Wrong password for:', email);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Invalid password' 
            }));
            return;
          }
          
          console.log('✅ Login successful for:', email);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            user: {
              uid: userRecord.uid,
              email: userRecord.email,
              displayName: userRecord.displayName || '',
              emailVerified: userRecord.emailVerified
            }
          }));
        } catch (firestoreError) {
          console.error('❌ Firestore Error:', firestoreError.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Login failed' }));
        }
        
      } catch (error) {
        console.error('❌ Login Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
  }
  // User registration - create account and store to Firestore
  else if (req.method === 'POST' && req.url === '/auth/signup') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { email, password, username } = JSON.parse(body);
        console.log('📝 Sign up attempt for:', email);
        
        // Check if user already exists
        try {
          await admin.auth().getUserByEmail(email);
          console.log('❌ User already exists:', email);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Email already in use' 
          }));
          return;
        } catch (getUserError) {
          // User does not exist, this is expected
        }
        
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: username,
          emailVerified: false
        });
        
        // Store user info in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          email: email,
          password: password,
          username: username,
          displayName: username,
          emailVerified: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ User registered successfully:', email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            emailVerified: userRecord.emailVerified
          }
        }));
        
      } catch (error) {
        console.error('❌ Sign up Error:', error.message);
        if (error.code === 'auth/weak-password') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Password is too weak' }));
        } else if (error.code === 'auth/invalid-email') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid email' }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Sign up failed' }));
        }
      }
    });
  }
  // Get user info
  else if (req.method === 'GET' && req.url.startsWith('/auth/user/')) {
    const uid = req.url.split('/auth/user/')[1];
    (async () => {
      try {
        console.log('🔍 Fetching user data for UID:', uid);
        
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
          console.log('❌ User not found:', uid);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
          return;
        }
        
        const userData = userDoc.data();
        console.log('✅ User data fetched:', uid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          user: {
            uid: uid,
            email: userData.email,
            username: userData.username,
            displayName: userData.displayName || userData.username,
            emailVerified: userData.emailVerified,
            createdAt: userData.createdAt
          }
        }));
      } catch (error) {
        console.error('❌ Error fetching user:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    })();
  }
  // Save user progress
  else if (req.method === 'POST' && req.url.startsWith('/progress/')) {
    const uid = req.url.split('/progress/')[1];
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { lessonId, progress, level, completed } = JSON.parse(body);
        console.log(`💾 Saving progress for user ${uid}, lesson ${lessonId}:`, progress);
        
        // Create or update user progress collection
        const progressRef = db.collection('users').doc(uid).collection('progress').doc(`lesson_${lessonId}`);
        
        // Build data to store, ignoring undefined values
        const progressData = {
          lessonId: lessonId,
          progress: progress,
          completed: completed || false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Only add level when it is not undefined
        if (level !== undefined) {
          progressData.level = level;
        }
        
        await progressRef.set(progressData, { merge: true });
        
        console.log(`✅ Progress saved for lesson ${lessonId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Progress saved'
        }));
      } catch (error) {
        console.error('❌ Error saving progress:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  // Get user progress
  else if (req.method === 'GET' && req.url.startsWith('/progress/')) {
    const uid = req.url.split('/progress/')[1];
    (async () => {
      try {
        console.log(`🔍 Fetching progress for user ${uid}`);
        
        const progressSnapshot = await db.collection('users').doc(uid).collection('progress').get();
        const progressData = {};
        
        progressSnapshot.forEach(doc => {
          progressData[doc.data().lessonId] = doc.data();
        });
        
        console.log(`✅ Progress fetched for user ${uid}:`, Object.keys(progressData).length, 'lessons');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          progress: progressData
        }));
      } catch (error) {
        console.error('❌ Error fetching progress:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    })();
  }
  else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Gemini Proxy Server Running', endpoint: 'POST /chat' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Gemini Proxy Server started successfully!`);
  console.log(`📍 Address: http://localhost:${PORT}`);
  console.log(`📍 For Android Emulator use: http://10.0.2.2:${PORT}`);
  console.log(`\nWaiting for requests...\n`);
});
