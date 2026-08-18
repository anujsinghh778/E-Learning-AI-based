const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data_store.json');

const DIAGNOSTIC_QUESTIONS_LIBRARY = {
  "Junior Science & Nature": [
    {
      id: "diag-jr-1",
      topic: "Plants & Photosynthesis",
      question: "What green pigment inside plant leaves absorbs sunlight to make food?",
      options: ["Melanin", "Chlorophyll", "Hemoglobin", "Carotene"],
      correct: 1,
      conceptExplanation: "Chlorophyll is the green pigment in plants that absorbs light energy during photosynthesis."
    },
    {
      id: "diag-jr-2",
      topic: "States of Matter",
      question: "When water freezes into ice, which state of matter does it become?",
      options: ["Gas", "Liquid", "Solid", "Plasma"],
      correct: 2,
      conceptExplanation: "Ice is the solid state of water formed below 0 degrees Celsius."
    }
  ],
  "Junior Mathematics": [
    {
      id: "diag-jm-1",
      topic: "Fractions & Shapes",
      question: "If a pizza is cut into 4 equal slices and you eat 1 slice, what fraction of the pizza is left?",
      options: ["1/4", "2/4", "3/4", "4/4"],
      correct: 2,
      conceptExplanation: "4 slices - 1 slice = 3 slices remaining, which is 3/4 of the total pizza."
    }
  ],
  "Computer Science": [
    {
      id: "diag-cs-1",
      topic: "Python Data Types & Variables",
      question: "Which Python data structure is ordered, mutable, and allows duplicate elements?",
      options: ["Tuple", "List", "Set", "Dictionary"],
      correct: 1,
      conceptExplanation: "Lists in Python are mutable, ordered sequences that allow duplicate items."
    },
    {
      id: "diag-cs-2",
      topic: "Control Flow & Loops",
      question: "What will `range(1, 5)` generate in a Python for loop?",
      options: ["1, 2, 3, 4, 5", "1, 2, 3, 4", "0, 1, 2, 3, 4", "5, 4, 3, 2, 1"],
      correct: 1,
      conceptExplanation: "`range(start, stop)` includes start (1) but excludes stop (5)."
    }
  ],
  "Physics": [
    {
      id: "diag-phys-1",
      topic: "Ohm's Law & Circuit Analysis",
      question: "If potential difference V across a resistor is 12V and current I is 3A, what is the resistance R?",
      options: ["36 Ohms", "4 Ohms", "0.25 Ohms", "9 Ohms"],
      correct: 1,
      conceptExplanation: "Ohm's Law: R = V / I = 12 / 3 = 4 Ohms."
    }
  ]
};

const DEFAULT_COURSES = [
  // JUNIOR CLASS 1-3 COURSES
  {
    id: "course-jr-101",
    title: "Class 1-3: Primary Science & Nature Explorers",
    category: "Class 1-3 Primary",
    classLevel: "Class 1-3",
    syllabus: "Primary Global Science Standard",
    subject: "Junior Science & Nature",
    description: "Fun, visual science lessons for young learners covering animals, plants, weather, human body, and simple experiments.",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80",
    topics: [
      {
        id: "jr101-t1",
        title: "Lesson 1: How Plants Grow from Seeds",
        duration: "10 min",
        videoId: "tkFPyue5X3o",
        summary: "Explore how seeds sprout roots into the soil and grow leaves towards the sun using water, air, and sunlight.",
        notes: [
          "Seeds need water, soil, sunlight, and air to germinate.",
          "Roots grow downward to soak up water and nutrients.",
          "Green leaves capture sunlight to make plant food."
        ],
        quiz: [
          {
            question: "What main things does a seed need to sprout into a plant?",
            options: ["Water, Sunlight, Soil & Air", "Only Ice Cream", "Only Dark Rooms", "Plastic and Metal"],
            correct: 0,
            explanation: "Plants need water, sunlight, soil nutrients, and air to grow healthy."
          }
        ]
      },
      {
        id: "jr101-t2",
        title: "Lesson 2: The Three States of Matter (Solid, Liquid, Gas)",
        duration: "12 min",
        videoId: "wclY8F-UoTE",
        summary: "Discover why ice is solid, water is liquid, and steam is gas with colorful real-life examples.",
        notes: [
          "Solids hold their shape (like a wooden block or ice cube).",
          "Liquids flow and take the shape of their container (like milk or juice).",
          "Gases spread out into the air (like water vapor or air inside balloons)."
        ],
        quiz: [
          {
            question: "Which of the following is an example of a liquid?",
            options: ["Wooden Chair", "Fresh Water", "Ice Cube", "Rock"],
            correct: 1,
            explanation: "Water flows easily and takes the shape of its glass, making it a liquid."
          }
        ]
      }
    ]
  },
  // JUNIOR CLASS 4-5 COURSES
  {
    id: "course-jr-401",
    title: "Class 4-5: Kids Scratch Coding & Block Logic",
    category: "Class 4-5 Primary",
    classLevel: "Class 4-5",
    syllabus: "Primary Tech & Computer Literacy",
    subject: "Computer Science",
    description: "Interactive visual block coding for kids. Learn logic building, animations, game creation, and algorithm thinking.",
    thumbnail: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
    topics: [
      {
        id: "jr401-t1",
        title: "Lesson 1: Introduction to Scratch & Sprite Motion",
        duration: "14 min",
        videoId: "VIpmkeqCgQ4",
        summary: "Learn how to drag visual coding blocks to make your cat character (Sprite) move across the screen and talk.",
        notes: [
          "Scratch uses drag-and-drop code blocks so kids learn computer logic without typing errors.",
          "The Green Flag script starts your program.",
          "Move steps blocks control character position on X and Y coordinates."
        ],
        quiz: [
          {
            question: "Which button starts a project in Scratch?",
            options: ["Green Flag", "Red Stop Circle", "Spacebar", "Enter Key"],
            correct: 0,
            explanation: "Clicking the Green Flag triggers all scripts attached to 'When Green Flag Clicked'."
          }
        ]
      }
    ]
  },
  // MIDDLE SCHOOL CLASS 6-8 COURSES
  {
    id: "course-mid-601",
    title: "Class 6-8: Middle School Mathematics & Pre-Algebra",
    category: "Class 6-8 Middle School",
    classLevel: "Class 6-8",
    syllabus: "Middle School Global Standard",
    subject: "Mathematics",
    description: "Master ratios, proportions, negative numbers, simple equations, geometry, and statistics.",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80",
    topics: [
      {
        id: "mid601-t1",
        title: "Lesson 1: Solving Simple One-Step Equations",
        duration: "15 min",
        videoId: "Qyd_v3DGzTM",
        summary: "Learn how to isolate variables using inverse operations (addition/subtraction and multiplication/division).",
        notes: [
          "Whatever operation you perform on one side of an equation, you must perform on the other.",
          "If x + 5 = 12, subtract 5 from both sides to find x = 7."
        ],
        quiz: [
          {
            question: "If 3x = 15, what is the value of x?",
            options: ["5", "12", "45", "3"],
            correct: 0,
            explanation: "Divide both sides by 3: x = 15 / 3 = 5."
          }
        ]
      }
    ]
  },
  // SECONDARY & HIGH SCHOOL COURSES (Class 9-12)
  {
    id: "course-cs-101",
    title: "Class 11-12: Computer Science & Python Masterclass",
    category: "Class 11-12 Higher Secondary",
    classLevel: "Class 11-12",
    syllabus: "Global Standard / CBSE / AP",
    subject: "Computer Science",
    description: "Master programming fundamentals, Python syntax, logic building, data structures, and algorithms.",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80",
    topics: [
      {
        id: "cs101-t1",
        title: "Lesson 1: Introduction to Computer Science & Python Setup",
        duration: "15 min",
        videoId: "rfscVS0vtbw",
        summary: "Learn what programming is, how Python works, environment setup, and executing your first script.",
        notes: [
          "Python is an interpreted, high-level, dynamically-typed language.",
          "Variables store data values in RAM without explicit type declarations.",
          "print() displays output to the console."
        ],
        quiz: [
          {
            question: "Which of the following functions displays output to the console in Python?",
            options: ["console.log()", "print()", "System.out.println()", "echo"],
            correct: 1,
            explanation: "print() is Python's built-in function to display text to standard output."
          }
        ]
      }
    ]
  },
  {
    id: "course-phys-10",
    title: "Class 9-10: Physics Electricity & Magnetism",
    category: "Class 9-10 Secondary",
    classLevel: "Class 9-10",
    syllabus: "CBSE / ICSE / Cambridge",
    subject: "Physics",
    description: "Understand electric current, Ohm's Law, resistance in series and parallel, and magnetic effects.",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80",
    topics: [
      {
        id: "phys10-t1",
        title: "Lesson 1: Electric Current & Ohm's Law",
        duration: "18 min",
        videoId: "w82a1FT5o88",
        summary: "Explore electric charge flow (I = Q/t), potential difference (V), and Ohm's law formula V = IR.",
        notes: [
          "Electric current is the rate of flow of electric charges: I = Q / t.",
          "Ohm's Law states that V = I * R at constant temperature.",
          "SI unit of resistance is Ohm."
        ],
        quiz: [
          {
            question: "According to Ohm's Law, what happens to current if resistance is doubled at constant voltage?",
            options: ["It doubles", "It quadruples", "It is halved", "It remains unchanged"],
            correct: 2,
            explanation: "Since I = V / R, doubling resistance R halves the current I."
          }
        ]
      }
    ]
  }
];

class Database {
  constructor() {
    this.data = {
      courses: DEFAULT_COURSES,
      userProgress: {},
      studySchedules: {},
      certificates: [],
      diagnosticReports: {}
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          courses: parsed.courses && parsed.courses.length > 0 ? parsed.courses : DEFAULT_COURSES,
          userProgress: parsed.userProgress || {},
          studySchedules: parsed.studySchedules || {},
          certificates: parsed.certificates || [],
          diagnosticReports: parsed.diagnosticReports || {}
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error("Error reading database file, using defaults:", err);
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error("Error saving database file:", err);
    }
  }

  getCourses(filters = {}) {
    let result = this.data.courses;
    if (filters.classLevel && filters.classLevel !== 'all') {
      result = result.filter(c => c.classLevel.toLowerCase().includes(filters.classLevel.toLowerCase()));
    }
    if (filters.subject && filters.subject !== 'all') {
      result = result.filter(c => c.subject.toLowerCase().includes(filters.subject.toLowerCase()));
    }
    if (filters.syllabus && filters.syllabus !== 'all') {
      result = result.filter(c => c.syllabus.toLowerCase().includes(filters.syllabus.toLowerCase()));
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q));
    }
    return result;
  }

  getCourseById(courseId) {
    return this.data.courses.find(c => c.id === courseId);
  }

  addCourse(newCourse) {
    this.data.courses.unshift(newCourse);
    this.save();
    return newCourse;
  }

  getDiagnosticQuestions(subject = "Computer Science") {
    return DIAGNOSTIC_QUESTIONS_LIBRARY[subject] || DIAGNOSTIC_QUESTIONS_LIBRARY["Junior Science & Nature"] || DIAGNOSTIC_QUESTIONS_LIBRARY["Computer Science"];
  }

  saveDiagnosticReport(userId = 'default_student', report) {
    this.data.diagnosticReports[userId] = report;
    this.save();
    return report;
  }

  getDiagnosticReport(userId = 'default_student') {
    return this.data.diagnosticReports[userId] || null;
  }

  getUserProgress(userId = 'default_student') {
    if (!this.data.userProgress[userId]) {
      this.data.userProgress[userId] = {
        completedTopics: [],
        quizScores: {},
        streak: 3,
        weakTopics: []
      };
      this.save();
    }
    return this.data.userProgress[userId];
  }

  updateTopicProgress(userId = 'default_student', topicId, score = null) {
    const prog = this.getUserProgress(userId);
    if (!prog.completedTopics.includes(topicId)) {
      prog.completedTopics.push(topicId);
    }
    if (score !== null) {
      prog.quizScores[topicId] = score;
      if (score < 60) {
        if (!prog.weakTopics.includes(topicId)) prog.weakTopics.push(topicId);
      } else {
        prog.weakTopics = prog.weakTopics.filter(id => id !== topicId);
      }
    }
    this.save();
    return prog;
  }

  saveSchedule(userId = 'default_student', scheduleObj) {
    this.data.studySchedules[userId] = scheduleObj;
    this.save();
    return scheduleObj;
  }

  getSchedule(userId = 'default_student') {
    return this.data.studySchedules[userId] || null;
  }

  issueCertificate({ userId = 'default_student', studentName, courseId, score }) {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error("Course not found");

    const certId = 'CERT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const cert = {
      id: certId,
      userId,
      studentName: studentName || 'Learner',
      courseId,
      courseTitle: course.title,
      subject: course.subject,
      classLevel: course.classLevel,
      issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      score: score || 90,
      verificationUrl: `/verify/${certId}`
    };

    this.data.certificates.push(cert);
    this.save();
    return cert;
  }

  getCertificateById(certId) {
    return this.data.certificates.find(c => c.id === certId);
  }
}

module.exports = new Database();
