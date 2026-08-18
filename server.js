require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware for Vercel / cross-domain access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Google OAuth Verification & User Auth
app.post('/api/auth/google', (req, res) => {
  try {
    const { token, profile } = req.body;
    res.json({
      success: true,
      user: {
        id: 'google-user-' + Math.random().toString(36).substring(2, 9),
        name: profile ? profile.name : 'Google Student',
        email: profile ? profile.email : 'student@gmail.com',
        picture: profile ? profile.picture : ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Courses catalog with optional filters
app.get('/api/courses', (req, res) => {
  try {
    const { classLevel, subject, syllabus, query } = req.query;
    const courses = db.getCourses({ classLevel, subject, syllabus, query });
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get specific Course details
app.get('/api/courses/:id', (req, res) => {
  try {
    const course = db.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. AI Dynamic Course Generator
app.post('/api/courses/generate', async (req, res) => {
  try {
    const { topic, classLevel, subject, syllabus } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic parameter is required' });
    }

    const generatedCourse = await aiService.generateCourse({ topic, classLevel, subject, syllabus });
    db.addCourse(generatedCourse);

    res.json({ success: true, course: generatedCourse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DIAGNOSTIC ASSESSMENT & WEAK POINT ANALYZER API
app.get('/api/diagnostic/questions', (req, res) => {
  try {
    const { subject } = req.query;
    const questions = db.getDiagnosticQuestions(subject);
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/diagnostic/evaluate', async (req, res) => {
  try {
    const { studentName, subject, classLevel, questions, userAnswers } = req.body;
    const report = await aiService.evaluateDiagnosticTest({ studentName, subject, classLevel, questions, userAnswers });
    db.saveDiagnosticReport('default_student', report);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/diagnostic/build-individualized-course', async (req, res) => {
  try {
    const { studentName, subject, classLevel, weakPoints } = req.body;
    const customCourse = await aiService.generateIndividualizedCourse({ studentName, subject, classLevel, weakPoints });
    db.addCourse(customCourse);
    res.json({ success: true, course: customCourse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. User Progress & Analytics
app.get('/api/progress', (req, res) => {
  try {
    const userId = req.query.userId || 'default_student';
    const progress = db.getUserProgress(userId);
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/progress/topic', (req, res) => {
  try {
    const { userId = 'default_student', topicId, score } = req.body;
    if (!topicId) {
      return res.status(400).json({ success: false, error: 'topicId is required' });
    }
    const updatedProgress = db.updateTopicProgress(userId, topicId, score);
    res.json({ success: true, progress: updatedProgress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. RAG AI Study Buddy Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { query, currentLesson } = req.body;
    if (!query || !currentLesson) {
      return res.status(400).json({ success: false, error: 'query and currentLesson are required' });
    }
    const reply = await aiService.answerStudyBuddyQuery({ query, currentLesson });
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Study Schedule Generator
app.post('/api/schedule/generate', async (req, res) => {
  try {
    const { userId = 'default_student', examDate, dailyHours, targetClass, targetSubject } = req.body;
    const schedule = await aiService.generateSchedule({ examDate, dailyHours, targetClass, targetSubject });
    db.saveSchedule(userId, schedule);
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/schedule', (req, res) => {
  try {
    const userId = req.query.userId || 'default_student';
    const schedule = db.getSchedule(userId);
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Certificate Generation & Verification
app.post('/api/certificates/issue', (req, res) => {
  try {
    const { userId = 'default_student', studentName, courseId, score } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'courseId is required' });
    }
    const certificate = db.issueCertificate({ userId, studentName, courseId, score });
    res.json({ success: true, certificate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/certificates/:id', (req, res) => {
  try {
    const cert = db.getCertificateById(req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    res.json({ success: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` AI-Driven Learning Support System Server Running!`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
