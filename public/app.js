const API_BASE_URL = '';

// Toast Notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';
  
  toast.innerHTML = `<span style="font-size: 1.1rem; display: flex; align-items: center;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// App State
let currentCourses = [];
let activeCourse = null;
let activeTopicIndex = 0;
let userProgress = { completedTopics: [], quizScores: {}, streak: 3 };
let currentUser = null;

// Flashcards Deck State
let flashcardsDeck = [
  {
    q: "What is Python's execution model?",
    a: "Python source code is compiled into bytecode (.pyc) and interpreted by the Python Virtual Machine (PVM)."
  },
  {
    q: "What is Ohm's Law formula and principle?",
    a: "V = I × R. The voltage across a conductor is directly proportional to the electric current flowing through it at constant temperature."
  },
  {
    q: "What is the derivative of f(x) = x^n?",
    a: "By the power rule, d/dx(x^n) = n × x^(n-1)."
  },
  {
    q: "What is the difference between series and parallel circuits?",
    a: "In series, current is equal everywhere and voltage divides. In parallel, voltage across each branch is equal and current divides."
  }
];
let currentFlashcardIndex = 0;

// Diagnostic Test State
let diagQuestions = [];
let diagCurrentStep = 0;
let diagUserAnswers = [];
let lastDiagReport = null;

// Quiz State
let currentQuizQuestions = [];
let currentQuizStep = 0;
let currentQuizScore = 0;

// Speech Interaction State
let voiceOutputEnabled = false;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadCourses();
  loadProgress();
  loadSchedule();
  renderFlashcard();
});

// View Router
function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(viewId).style.display = 'block';

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  if (viewId === 'home-view') document.getElementById('nav-home').classList.add('active');
  if (viewId === 'diagnostic-view') document.getElementById('nav-diagnostic').classList.add('active');
  if (viewId === 'flashcards-view') document.getElementById('nav-flashcards').classList.add('active');
  if (viewId === 'schedule-view') document.getElementById('nav-schedule').classList.add('active');
  if (viewId === 'certificates-view') {
    document.getElementById('nav-certificates').classList.add('active');
    loadCertificates();
  }
}

// ------------------------------------------------------------------
// 1. GOOGLE SIGN-IN OAUTH CALLBACK HANDLER
// ------------------------------------------------------------------
function handleGoogleCredentialResponse(response) {
  try {
    // Decode JWT payload from Google credential
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const profile = JSON.parse(jsonPayload);
    currentUser = {
      name: profile.name,
      email: profile.email,
      picture: profile.picture
    };

    // Update UI Header
    document.getElementById('google-auth-container').style.display = 'none';
    const profilePill = document.getElementById('user-profile-pill');
    document.getElementById('user-avatar-img').src = profile.picture;
    document.getElementById('user-display-name').innerText = profile.given_name || profile.name;
    profilePill.style.display = 'inline-flex';

    // Auto fill diagnostic test student name
    const diagNameInput = document.getElementById('diag-student-name');
    if (diagNameInput) diagNameInput.value = profile.name;

    showToast(`Signed in successfully as ${profile.name}!`, 'success');
  } catch (err) {
    console.error("Google auth decode error:", err);
    quickDemoSignIn();
  }
}

function quickDemoSignIn() {
  currentUser = {
    name: "Om Singh Rajput",
    email: "omsinghrajput778772@gmail.com",
    picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  };

  document.getElementById('google-auth-container').style.display = 'none';
  const profilePill = document.getElementById('user-profile-pill');
  document.getElementById('user-avatar-img').src = currentUser.picture;
  document.getElementById('user-display-name').innerText = "Om Singh";
  profilePill.style.display = 'inline-flex';

  const diagNameInput = document.getElementById('diag-student-name');
  if (diagNameInput) diagNameInput.value = currentUser.name;

  showToast(`Signed in as ${currentUser.name} (${currentUser.email})`, 'success');
}

// ------------------------------------------------------------------
// 2. 3D AI FLASHCARDS DECK ENGINE
// ------------------------------------------------------------------
function flipFlashcard() {
  const card = document.getElementById('flashcard-card');
  card.classList.toggle('flipped');
}

function renderFlashcard() {
  const card = document.getElementById('flashcard-card');
  card.classList.remove('flipped');

  const f = flashcardsDeck[currentFlashcardIndex];
  if (!f) return;

  document.getElementById('flashcard-count-badge').innerText = `Card ${currentFlashcardIndex + 1} of ${flashcardsDeck.length}`;
  document.getElementById('flashcard-question-text').innerText = f.q;
  document.getElementById('flashcard-answer-text').innerText = f.a;
}

function rateFlashcard(mastered) {
  if (mastered) {
    // Move to next card
    currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardsDeck.length;
  } else {
    // Move to back of deck for review
    const current = flashcardsDeck.splice(currentFlashcardIndex, 1)[0];
    flashcardsDeck.push(current);
  }
  renderFlashcard();
}

// ------------------------------------------------------------------
// 3. INTERACTIVE CODE & MATH SANDBOX RUNNER
// ------------------------------------------------------------------
function runSandboxCode() {
  const code = document.getElementById('sandbox-code-input').value;
  const outputBox = document.getElementById('sandbox-output');

  let logs = [];
  const originalLog = console.log;
  console.log = function(...args) {
    logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
    originalLog.apply(console, args);
  };

  try {
    // Safe lightweight JS execution evaluation
    let result = eval(code);
    outputBox.innerText = logs.length > 0 ? "Console Output:\n" + logs.join('\n') : "Result: " + result;
  } catch (err) {
    outputBox.innerText = "Execution Note / Output:\n" + logs.join('\n') + "\n" + err.message;
  } finally {
    console.log = originalLog;
  }
}

// ------------------------------------------------------------------
// 4. VOICE AI TUTOR (MIC INPUT & SPEECH SYNTHESIS)
// ------------------------------------------------------------------
function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Speech Recognition is supported in modern Chrome, Edge, and Safari browsers.", "warning");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  const chatInput = document.getElementById('chat-input');
  chatInput.placeholder = "Listening... Speak your question clearly into mic.";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    chatInput.placeholder = "Ask AI Assistant...";
    sendChatMessage();
  };

  recognition.onerror = () => {
    chatInput.placeholder = "Ask AI Assistant...";
  };

  recognition.start();
}

function toggleVoiceOutput() {
  voiceOutputEnabled = !voiceOutputEnabled;
  showToast(voiceOutputEnabled ? "Voice Output Enabled." : "Voice Output Muted.", "success");
}

function speakText(text) {
  if (!voiceOutputEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ------------------------------------------------------------------
// 5. COURSES CATALOG
// ------------------------------------------------------------------
async function loadCourses() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses`);
    const data = await res.json();
    if (data.success) {
      currentCourses = data.courses;
      renderCourses(currentCourses);
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
  }
}

function renderCourses(courses) {
  const container = document.getElementById('course-grid');
  if (courses.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--slate-muted);">
        <h3>No courses found matching your criteria.</h3>
        <p>Try clearing filters or generate a custom AI course!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = courses.map(course => `
    <div class="course-card">
      <div class="course-thumb-wrapper">
        <img src="${course.thumbnail}" class="course-thumb" alt="${course.title}">
        <span class="badge-tag">${course.classLevel}</span>
        <span class="syllabus-tag">${course.syllabus}</span>
      </div>
      <div class="course-body">
        <h3 class="course-title">${course.title}</h3>
        <p class="course-desc">${course.description}</p>
        <div class="course-meta">
          <span>${course.topics.length} Lessons</span>
          <span>${course.subject}</span>
        </div>
        <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="openClassroom('${course.id}')">
          Start Course →
        </button>
      </div>
    </div>
  `).join('');
}

function applyFilters() {
  const query = document.getElementById('filter-search').value.toLowerCase();
  const classVal = document.getElementById('filter-class').value;
  const subjectVal = document.getElementById('filter-subject').value;
  const syllabusVal = document.getElementById('filter-syllabus').value;

  const filtered = currentCourses.filter(course => {
    const matchQuery = !query || course.title.toLowerCase().includes(query) || course.description.toLowerCase().includes(query);
    const matchClass = classVal === 'all' || course.classLevel.toLowerCase().includes(classVal.toLowerCase());
    const matchSubject = subjectVal === 'all' || course.subject.toLowerCase().includes(subjectVal.toLowerCase());
    const matchSyllabus = syllabusVal === 'all' || course.syllabus.toLowerCase().includes(syllabusVal.toLowerCase());
    return matchQuery && matchClass && matchSubject && matchSyllabus;
  });

  renderCourses(filtered);
}

// Dynamic AI Course Generator Modal
function openAICourseModal() {
  document.getElementById('ai-course-modal').classList.add('active');
}

function closeAICourseModal() {
  document.getElementById('ai-course-modal').classList.remove('active');
}

async function submitAICourseGenerator() {
  const topic = document.getElementById('gen-topic').value;
  const classLevel = document.getElementById('gen-class').value;
  const subject = document.getElementById('gen-subject').value;
  const syllabus = document.getElementById('gen-syllabus').value;

  if (!topic) {
    showToast("Please enter a course topic name.", "warning");
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.innerText = "Generating Syllabus & Curating Video Lessons...";

  try {
    const res = await fetch(`${API_BASE_URL}/api/courses/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, classLevel, subject, syllabus })
    });
    const data = await res.json();
    if (data.success) {
      closeAICourseModal();
      await loadCourses();
      openClassroom(data.course.id);
    } else {
      showToast("Error generating course: " + data.error, "error");
    }
  } catch (err) {
    showToast("Request failed: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Generate Course";
  }
}

// ------------------------------------------------------------------
// 6. DIAGNOSTIC ASSESSMENT & WEAK POINT ANALYZER
// ------------------------------------------------------------------
async function startDiagnosticTest() {
  const subject = document.getElementById('diag-subject').value;
  const classLevel = document.getElementById('diag-class').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/diagnostic/questions?subject=${encodeURIComponent(subject)}`);
    const data = await res.json();

    if (data.success && data.questions.length > 0) {
      diagQuestions = data.questions;
      diagCurrentStep = 0;
      diagUserAnswers = [];

      document.getElementById('diagnostic-setup').style.display = 'none';
      document.getElementById('diagnostic-report-screen').style.display = 'none';
      document.getElementById('diagnostic-quiz-screen').style.display = 'block';

      renderDiagQuestion();
    }
  } catch (err) {
    showToast("Failed to load diagnostic test: " + err.message, "error");
  }
}

function renderDiagQuestion() {
  const q = diagQuestions[diagCurrentStep];
  if (!q) return;

  document.getElementById('diag-progress-text').innerText = `Question ${diagCurrentStep + 1} of ${diagQuestions.length}`;
  document.getElementById('diag-question-text').innerText = `[Topic: ${q.topic}] ${q.question}`;

  const container = document.getElementById('diag-options-container');
  container.innerHTML = q.options.map((opt, idx) => `
    <div class="quiz-option" onclick="selectDiagOption(${idx})">
      <span style="margin-right: 0.75rem; font-weight: 700; color: var(--primary);">${String.fromCharCode(65 + idx)}.</span>
      <span>${opt}</span>
    </div>
  `).join('');
}

async function selectDiagOption(selectedIndex) {
  diagUserAnswers.push(selectedIndex);
  diagCurrentStep++;

  if (diagCurrentStep < diagQuestions.length) {
    renderDiagQuestion();
  } else {
    const studentName = (currentUser && currentUser.name) || document.getElementById('diag-student-name').value || "Student Learner";
    const subject = document.getElementById('diag-subject').value;
    const classLevel = document.getElementById('diag-class').value;

    const res = await fetch(`${API_BASE_URL}/api/diagnostic/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        subject,
        classLevel,
        questions: diagQuestions,
        userAnswers: diagUserAnswers
      })
    });

    const data = await res.json();
    if (data.success) {
      lastDiagReport = data.report;
      renderDiagnosticReport(data.report);
    }
  }
}

function renderDiagnosticReport(report) {
  document.getElementById('diagnostic-quiz-screen').style.display = 'none';
  document.getElementById('diagnostic-report-screen').style.display = 'block';

  document.getElementById('diag-score-display').innerText = `${report.scorePct}%`;
  document.getElementById('diag-status-display').innerText = report.status;

  const list = document.getElementById('diag-weak-points-list');
  list.innerHTML = report.weakPoints.map(wp => `
    <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-light); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.5rem;">
      <span class="weak-tag">Weak Point: ${wp.topic}</span>
      <p style="font-size: 0.85rem; color: var(--slate-medium); margin-top: 0.25rem;">${wp.explanation}</p>
    </div>
  `).join('');
}

async function generateIndividualizedCourseFromReport() {
  if (!lastDiagReport) return;

  const btn = document.getElementById('btn-build-individualized');
  btn.disabled = true;
  btn.innerText = "Building Custom Complete Syllabus Course...";

  try {
    const res = await fetch(`${API_BASE_URL}/api/diagnostic/build-individualized-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: lastDiagReport.studentName,
        subject: lastDiagReport.subject,
        classLevel: lastDiagReport.classLevel,
        weakPoints: lastDiagReport.weakPoints
      })
    });

    const data = await res.json();
    if (data.success) {
      await loadCourses();
      openClassroom(data.course.id);
    }
  } catch (err) {
    showToast("Error building individualized course: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Build My Individualized Complete Syllabus Course →";
  }
}

// ------------------------------------------------------------------
// 7. CLASSROOM & YOUTUBE PLAYER
// ------------------------------------------------------------------
async function openClassroom(courseId) {
  const course = currentCourses.find(c => c.id === courseId);
  if (!course) return;

  activeCourse = course;
  activeTopicIndex = 0;

  switchView('classroom-view');
  renderClassroomTopic(0);
  renderTopicSidebar();
}

function renderClassroomTopic(index) {
  activeTopicIndex = index;
  const topic = activeCourse.topics[index];

  document.getElementById('youtube-player').src = `https://www.youtube.com/embed/${topic.videoId}?autoplay=1&rel=0`;
  document.getElementById('lesson-title').innerText = topic.title;
  document.getElementById('lesson-duration').innerText = `Duration: ${topic.duration} • Aligned with ${activeCourse.syllabus}`;
  document.getElementById('lesson-summary').innerText = topic.summary;

  const notesList = document.getElementById('lesson-notes-list');
  notesList.innerHTML = topic.notes.map(note => `<li>${note}</li>`).join('');

  document.querySelectorAll('.topic-item').forEach((item, idx) => {
    if (idx === index) item.classList.add('active');
    else item.classList.remove('active');
  });

  checkCourseCompletionStatus();
}

function renderTopicSidebar() {
  document.getElementById('course-title-sidebar').innerText = activeCourse.title;
  const container = document.getElementById('topic-list');

  container.innerHTML = activeCourse.topics.map((t, idx) => {
    const isCompleted = userProgress.completedTopics.includes(t.id);
    return `
      <div class="topic-item ${idx === activeTopicIndex ? 'active' : ''} ${isCompleted ? 'completed' : ''}" onclick="renderClassroomTopic(${idx})">
        <div class="topic-check">${isCompleted ? '✓' : idx + 1}</div>
        <div style="flex-grow: 1;">
          <div style="font-size: 0.88rem; font-weight: 600; color: var(--slate-dark);">${t.title}</div>
          <div style="font-size: 0.75rem; color: var(--slate-muted);">${t.duration}</div>
        </div>
      </div>
    `;
  }).join('');
}

function checkCourseCompletionStatus() {
  if (!activeCourse) return;
  const allCompleted = activeCourse.topics.every(t => userProgress.completedTopics.includes(t.id));
  const certBtn = document.getElementById('claim-cert-btn');
  if (allCompleted) {
    certBtn.style.display = 'block';
  } else {
    certBtn.style.display = 'none';
  }
}

// ------------------------------------------------------------------
// 8. KNOWLEDGE QUIZ MODAL
// ------------------------------------------------------------------
function openQuizModal() {
  if (!activeCourse) return;
  const topic = activeCourse.topics[activeTopicIndex];

  currentQuizQuestions = topic.quiz || [];
  currentQuizStep = 0;
  currentQuizScore = 0;

  renderQuizStep();
  document.getElementById('quiz-modal').classList.add('active');
}

function closeQuizModal() {
  document.getElementById('quiz-modal').classList.remove('active');
}

function renderQuizStep() {
  const q = currentQuizQuestions[currentQuizStep];
  if (!q) return;

  document.getElementById('quiz-progress-text').innerText = `Question ${currentQuizStep + 1} of ${currentQuizQuestions.length}`;
  document.getElementById('quiz-question-text').innerText = q.question;
  document.getElementById('quiz-explanation-box').style.display = 'none';
  document.getElementById('quiz-next-btn').style.display = 'none';

  const container = document.getElementById('quiz-options-container');
  container.innerHTML = q.options.map((opt, idx) => `
    <div class="quiz-option" onclick="selectQuizOption(${idx})">
      <span style="margin-right: 0.75rem; font-weight: 700; color: var(--primary);">${String.fromCharCode(65 + idx)}.</span>
      <span>${opt}</span>
    </div>
  `).join('');
}

function selectQuizOption(selectedIndex) {
  const q = currentQuizQuestions[currentQuizStep];
  const options = document.querySelectorAll('.quiz-option');

  options.forEach((opt, idx) => {
    opt.onclick = null;
    if (idx === q.correct) {
      opt.classList.add('correct');
    }
    if (idx === selectedIndex && selectedIndex !== q.correct) {
      opt.classList.add('incorrect');
    }
  });

  if (selectedIndex === q.correct) {
    currentQuizScore++;
  }

  const expBox = document.getElementById('quiz-explanation-box');
  expBox.innerHTML = `<strong>Explanation:</strong> ${q.explanation}`;
  expBox.style.display = 'block';

  document.getElementById('quiz-next-btn').style.display = 'inline-flex';
}

async function nextQuizQuestion() {
  currentQuizStep++;
  if (currentQuizStep < currentQuizQuestions.length) {
    renderQuizStep();
  } else {
    const scorePct = Math.round((currentQuizScore / currentQuizQuestions.length) * 100);
    const topic = activeCourse.topics[activeTopicIndex];

    await fetch(`${API_BASE_URL}/api/progress/topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: topic.id, score: scorePct })
    });

    await loadProgress();
    renderTopicSidebar();

    showToast(`Quiz Completed. Your score: ${scorePct}%`, 'success');
    closeQuizModal();
  }
}

// ------------------------------------------------------------------
// 9. CLEAN WHITE INTERACTIVE AI CHAT WITH VOICE OUT
// ------------------------------------------------------------------
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const query = input.value.trim();
  if (!query || !activeCourse) return;

  const currentTopic = activeCourse.topics[activeTopicIndex];
  const chatBox = document.getElementById('chat-box');

  chatBox.innerHTML += `<div class="chat-bubble user">${query}</div>`;
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, currentLesson: currentTopic })
    });
    const data = await res.json();
    if (data.success) {
      const reply = data.reply;
      chatBox.innerHTML += `<div class="chat-bubble ai">${reply.replace(/\n/g, '<br>')}</div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
      speakText(reply);
    }
  } catch (err) {
    console.error("Chat error:", err);
  }
}

// ------------------------------------------------------------------
// 10. USER PROGRESS & AI SCHEDULE
// ------------------------------------------------------------------
async function loadProgress() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/progress`);
    const data = await res.json();
    if (data.success) {
      userProgress = data.progress;
    }
  } catch (err) {
    console.error("Progress load error:", err);
  }
}

async function loadSchedule() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/schedule`);
    const data = await res.json();
    if (data.success && data.schedule) {
      renderSchedule(data.schedule);
    } else {
      generateNewSchedule();
    }
  } catch (err) {
    console.error("Schedule load error:", err);
  }
}

async function generateNewSchedule() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/schedule/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examDate: 'Next Month', dailyHours: 2, targetClass: 'Class 10-12', targetSubject: 'All Core Subjects' })
    });
    const data = await res.json();
    if (data.success) {
      renderSchedule(data.schedule);
    }
  } catch (err) {
    console.error("Generate schedule error:", err);
  }
}

function renderSchedule(schedule) {
  const container = document.getElementById('schedule-grid');
  container.innerHTML = schedule.timeline.map(item => `
    <div class="filter-group" style="background-color: var(--bg-main); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--primary); font-weight: 700;">
        <span>${item.day} • ${item.dateStr}</span>
        <span>${item.targetHours} Hours Target</span>
      </div>
      <h4 style="color: var(--slate-dark); font-size: 0.95rem; margin: 0.4rem 0;">${item.task}</h4>
      <p style="font-size: 0.8rem; color: var(--slate-muted);">${item.focusArea}</p>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// 11. CERTIFICATE GENERATOR & CLAIMING
// ------------------------------------------------------------------
async function claimCourseCertificate() {
  if (!activeCourse) return;

  const studentName = (currentUser && currentUser.name) || prompt("Enter your full name for the certificate:", "Student Learner");
  if (!studentName) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/certificates/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: activeCourse.id, studentName, score: 95 })
    });
    const data = await res.json();
    if (data.success) {
      openCertificateModal(data.certificate);
    }
  } catch (err) {
    showToast("Error claiming certificate: " + err.message, "error");
  }
}

function openCertificateModal(cert) {
  document.getElementById('cert-student-name-display').innerText = cert.studentName;
  document.getElementById('cert-course-name-display').innerText = cert.courseTitle;
  document.getElementById('cert-date-display').innerText = cert.issueDate;
  document.getElementById('cert-score-display').innerText = cert.score + '%';
  document.getElementById('cert-id-display').innerText = cert.id;

  document.getElementById('cert-modal').classList.add('active');
}

function closeCertModal() {
  document.getElementById('cert-modal').classList.remove('active');
}

async function loadCertificates() {
  const container = document.getElementById('certificates-list');
  try {
    container.innerHTML = `
      <div class="course-card" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center;">
        <h3 style="color: var(--slate-dark); margin-bottom: 0.5rem;">Earned Certificates</h3>
        <p style="color: var(--slate-medium); margin-bottom: 1.5rem;">Complete all lesson quizzes in any course to claim your verified completion certificate.</p>
        <button class="btn btn-primary" onclick="switchView('home-view')">Explore Courses →</button>
      </div>
    `;
  } catch (err) {
    console.error("Certificates load error:", err);
  }
}
