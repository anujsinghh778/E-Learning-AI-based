const { GoogleGenAI } = require('@google/genai');
const youtubeService = require('./youtubeService');

// Load environment variables
require('dotenv').config();

const api_key = process.env.GEMINI_API_KEY;
let client = null;

if (api_key && api_key.trim() !== "" && api_key !== "YOUR_GEMINI_API_KEY") {
  try {
    client = new GoogleGenAI({ apiKey: api_key });
    console.log(" Google GenAI (Gemini) Client Initialized Successfully!");
  } catch (err) {
    console.error(" Failed to initialize Google GenAI Client:", err.message);
  }
} else {
  console.warn("️ GEMINI_API_KEY is not configured in .env. Running in Mock Mode for all AI features.");
}

class AIService {
  /**
   * Evaluates student diagnostic test answers and returns weak point analysis report.
   */
  async evaluateDiagnosticTest({ studentName, subject, classLevel, questions, userAnswers }) {
    let total = questions.length;
    let correctCount = 0;
    const weakPointsRaw = [];
    const strongPoints = [];

    questions.forEach((q, index) => {
      const selected = userAnswers[index];
      if (selected === q.correct) {
        correctCount++;
        strongPoints.push(q.topic);
      } else {
        weakPointsRaw.push({
          topic: q.topic,
          question: q.question,
          correctAnswer: q.options[q.correct],
          selectedAnswer: q.options[selected] !== undefined ? q.options[selected] : "Unanswered",
          conceptExplanation: q.conceptExplanation
        });
      }
    });

    const scorePct = Math.round((correctCount / total) * 100);
    let status = "Mastery Standard Achieved";
    if (scorePct < 80) status = "Moderate Conceptual Gaps Identified";
    if (scorePct < 50) status = "Needs Complete Remedial Course Focus";

    // If client is initialized and there are weak points, use Gemini to write custom feedback
    if (client && weakPointsRaw.length > 0) {
      try {
        const prompt = `
          You are an academic advisor. A student named "${studentName}" just completed a diagnostic assessment on "${subject}" at "${classLevel}" level.
          They scored ${scorePct}% (${correctCount}/${total} correct).
          
          Here are the questions they answered incorrectly:
          ${JSON.stringify(weakPointsRaw)}
          
          For each weak topic, write a concise explanation (1-2 sentences) of what conceptual error they likely made and how to correct it.
          Also provide a short status message summarizing their understanding.
          
          Output valid JSON matching this schema:
          {
            "status": "A short summary status of their knowledge state",
            "weakPoints": [
              {
                "topic": "Topic Name",
                "explanation": "Specific conceptual explanation and advice for the student"
              }
            ]
          }
        `;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response.text);
        return {
          studentName: studentName || "Student Learner",
          subject: subject || "General",
          classLevel: classLevel || "All Levels",
          scorePct,
          correctCount,
          total,
          status: parsed.status || status,
          weakPoints: parsed.weakPoints || weakPointsRaw.map(w => ({ topic: w.topic, explanation: w.conceptExplanation })),
          strongPoints
        };
      } catch (err) {
        console.error("Gemini Diagnostic evaluation failed, falling back to mock:", err.message);
      }
    }

    // Fallback Mock Evaluation
    const weakPoints = weakPointsRaw.map(wp => ({
      topic: wp.topic,
      explanation: wp.conceptExplanation || `Requires review of fundamental concepts in ${wp.topic}.`
    }));

    return {
      studentName: studentName || "Student Learner",
      subject: subject || "Computer Science",
      classLevel: classLevel || "Class 10-12",
      scorePct,
      correctCount,
      total,
      status,
      weakPoints: weakPoints.length > 0 ? weakPoints : [{ topic: "Advanced Applications of " + subject, explanation: "Focus on comprehensive problem solving." }],
      strongPoints
    };
  }

  /**
   * Generates an individualized complete syllabus course tailored specifically to a student's weak points.
   */
  async generateIndividualizedCourse({ studentName, subject, classLevel, weakPoints }) {
    const generatedId = 'ind-course-' + Math.random().toString(36).substring(2, 9);
    const topics = [];

    if (client && weakPoints && weakPoints.length > 0) {
      try {
        const prompt = `
          Generate an individualized remedial study course for a student named "${studentName}".
          Subject: "${subject}"
          Class Level: "${classLevel}"
          Identified Weak Topics: ${JSON.stringify(weakPoints)}

          Generate exactly 1 remedial lesson module for each of the identified weak topics.
          For each remedial lesson, provide:
          1. title: A clear title (e.g., "Remedial Module: [Topic Name]")
          2. duration: e.g., "12 min", "15 min"
          3. summary: A targeted explanation addressing the weak point.
          4. notes: An array of 3 key rules, formulas, or conceptual step-by-step guides.
          5. quiz: An array containing exactly 1 multiple-choice practice question.
             - question: A custom practice question.
             - options: 4 distinct choices.
             - correct: Index of correct choice (integer 0 to 3).
             - explanation: Concise explanation showing how to solve it.

          Output valid JSON matching this exact structure:
          {
            "title": "Remedial Course Title",
            "description": "Short explanation of how this targets the student's gaps.",
            "lessons": [
              {
                "title": "Remedial Module: ...",
                "duration": "15 min",
                "summary": "Summary text",
                "notes": ["Note 1", "Note 2", "Note 3"],
                "quiz": [
                  {
                    "question": "Question text?",
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                    "explanation": "Explanation..."
                  }
                ]
              }
            ]
          }
        `;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response.text);
        const lessons = parsed.lessons || [];

        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const curation = await youtubeService.getCurationForTopic(lesson.title, subject);
          
          topics.push({
            id: `${generatedId}-t${i + 1}`,
            title: lesson.title,
            duration: lesson.duration || "15 min",
            videoId: curation.videoId,
            summary: lesson.summary,
            notes: lesson.notes || [],
            quiz: (lesson.quiz || []).map(q => ({
              question: q.question,
              options: q.options,
              correct: q.correct,
              explanation: q.explanation
            }))
          });
        }

        return {
          id: generatedId,
          title: parsed.title || `Individualized ${subject} Mastery Course for ${studentName}`,
          category: `Custom Remedial / ${classLevel}`,
          classLevel: classLevel,
          syllabus: `Customized Complete Syllabus for ${studentName}`,
          subject: subject,
          description: parsed.description || `Complete individualized syllabus course generated for ${studentName}.`,
          thumbnail: `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80`,
          topics: topics
        };

      } catch (err) {
        console.error("Gemini Remedial Course generation failed, falling back to mock:", err.message);
      }
    }

    // Mock Fallback Curation
    for (let i = 0; i < weakPoints.length; i++) {
      const wp = weakPoints[i];
      const topicTitle = typeof wp === 'string' ? wp : wp.topic;
      const curation = await youtubeService.getCurationForTopic(topicTitle, subject);

      topics.push({
        id: `${generatedId}-t${i + 1}`,
        title: `Remedial Module ${i + 1}: ${topicTitle}`,
        duration: curation.duration,
        videoId: curation.videoId,
        summary: `Individualized study module targeting ${topicTitle}. Designed specifically for ${studentName} based on diagnostic assessment gaps. ${wp.explanation || ''}`,
        notes: [
          `Key Remedial Concept: Review fundamental definitions of ${topicTitle}.`,
          `Practical Application: Work through step-by-step example problems before attempting the module test.`,
          `Exam Tip: ${wp.explanation || 'Ensure careful unit analysis and verification of assumptions.'}`
        ],
        quiz: [
          {
            question: `Individualized Practice Question for ${studentName}: What is the core rule in ${topicTitle}?`,
            options: [
              `Systematic application of governing principles and formulas`,
              `Arbitrary selection without step verification`,
              `Ignoring initial conditions`,
              `Direct memory recall without understanding`
            ],
            correct: 0,
            explanation: `Correct conceptual understanding of ${topicTitle} requires systematic problem solving.`
          }
        ]
      });
    }

    return {
      id: generatedId,
      title: `Individualized ${subject} Mastery Course for ${studentName}`,
      category: `Custom Remedial / ${classLevel}`,
      classLevel: classLevel,
      syllabus: `Customized Complete Syllabus for ${studentName}`,
      subject: subject,
      description: `Complete individualized syllabus course generated for ${studentName}. Built specifically to target identified conceptual gaps in ${weakPoints.map(w => typeof w==='string'?w:w.topic).join(', ')}.`,
      thumbnail: `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80`,
      topics: topics
    };
  }

  /**
   * Generates a dynamic course by syllabus.
   */
  async generateCourse({ topic, classLevel, subject, syllabus }) {
    const classStr = classLevel || "Class 10";
    const subjStr = subject || topic || "Science";
    const syllStr = syllabus || "Global Standard";
    const generatedId = 'gen-course-' + Math.random().toString(36).substring(2, 9);
    const topics = [];

    if (client) {
      try {
        const prompt = `
          Generate a class-wise, topic-wise course structured around a syllabus.
          Topic: "${topic}"
          Class Level: "${classStr}"
          Subject: "${subjStr}"
          Syllabus Standard: "${syllStr}"

          Generate 4 structured sequential lessons.
          For each lesson, provide:
          1. title: E.g., "Lesson 1: Foundations of ..."
          2. duration: e.g., "12 min"
          3. summary: A clear 2-3 sentence explanation of the lesson content.
          4. notes: An array of 3 key rules, definitions, or formulas.
          5. quiz: An array containing exactly 1 multiple-choice practice question.
             - question: Question text.
             - options: 4 distinct choices.
             - correct: Index of correct choice (integer 0 to 3).
             - explanation: Concept explanation.

          Output valid JSON matching this exact structure:
          {
            "title": "Course Title",
            "description": "Overview of the course topics.",
            "lessons": [
              {
                "title": "Lesson ...",
                "duration": "15 min",
                "summary": "Summary...",
                "notes": ["Note 1", "Note 2", "Note 3"],
                "quiz": [
                  {
                    "question": "Question text?",
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                    "explanation": "Explanation..."
                  }
                ]
              }
            ]
          }
        `;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response.text);
        const lessons = parsed.lessons || [];

        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const curation = await youtubeService.getCurationForTopic(lesson.title, subjStr);

          topics.push({
            id: `${generatedId}-t${i + 1}`,
            title: lesson.title,
            duration: lesson.duration || "15 min",
            videoId: curation.videoId,
            summary: lesson.summary,
            notes: lesson.notes || [],
            quiz: (lesson.quiz || []).map(q => ({
              question: q.question,
              options: q.options,
              correct: q.correct,
              explanation: q.explanation
            }))
          });
        }

        return {
          id: generatedId,
          title: parsed.title || `${topic} (${classStr})`,
          category: `${classStr} / ${subjStr}`,
          classLevel: classStr,
          syllabus: syllStr,
          subject: subjStr,
          description: parsed.description || `AI-curated learning path for ${topic}.`,
          thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80`,
          topics: topics
        };

      } catch (err) {
        console.error("Gemini Course generation failed, falling back to mock:", err.message);
      }
    }

    // Mock Fallback Course
    const topicTitles = [
      `Foundations of ${topic}: Concepts & Principles`,
      `Core Mechanics & Deep Analysis of ${topic}`,
      `Practical Problem Solving & Applications of ${topic}`,
      `Advanced Masterclass & Exam Review for ${topic}`
    ];

    for (let i = 0; i < topicTitles.length; i++) {
      const title = topicTitles[i];
      const curation = await youtubeService.getCurationForTopic(title + " " + topic, subjStr);

      topics.push({
        id: `${generatedId}-t${i + 1}`,
        title: `Lesson ${i + 1}: ${title}`,
        duration: curation.duration,
        videoId: curation.videoId,
        summary: `Educational overview of ${title}. Covers fundamental definitions, real-world examples, step-by-step formulas, and critical concepts aligned with ${syllStr}.`,
        notes: [
          `Key Principle: ${topic} operates under fundamental laws of ${subjStr}.`,
          `Essential Rule: Pay close attention to unit conversions and definition boundaries.`,
          `Exam Tip: Questions test the difference between theoretical models and real-world conditions.`
        ],
        quiz: [
          {
            question: `What is the primary objective when studying ${title}?`,
            options: [
              `Understanding fundamental mechanisms and applying core concepts of ${topic}`,
              `Memorizing arbitrary numbers without theoretical context`,
              `Ignoring standard guidelines and formulas`,
              `Executing random calculations without verification`
            ],
            correct: 0,
            explanation: `Mastery of ${topic} relies on clear conceptual understanding and systematic problem solving.`
          }
        ]
      });
    }

    return {
      id: generatedId,
      title: `${topic} (${classStr})`,
      category: `${classStr} / ${subjStr}`,
      classLevel: classStr,
      syllabus: syllStr,
      subject: subjStr,
      description: `AI-curated learning path for ${topic}. Formatted class-wise and topic-wise according to ${syllStr} guidelines. Features video tutorials, key notes, adaptive quizzes, and AI assistant tutoring.`,
      thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80`,
      topics: topics
    };
  }

  /**
   * RAG AI Study Buddy chat without emojis.
   */
  async answerStudyBuddyQuery({ query, currentLesson }) {
    if (client) {
      try {
        const prompt = `
          You are a friendly, encouraging AI Study Buddy for an e-learning platform.
          The student is currently watching a video lesson titled: "${currentLesson.title}".
          
          Here is the lesson metadata & notes context:
          - Lesson Summary: "${currentLesson.summary}"
          - Key Principles:
          ${currentLesson.notes.map(n => `- ${n}`).join('\n')}
          
          Student's Question: "${query}"
          
          CRITICAL RULE: Answer the student's question strictly based on the lesson details provided above. If the answer cannot be reasonably inferred from this context, politely state: "I am sorry, but the instructor does not seem to cover that specific detail in this lesson."
          Keep your response clear, structured, and educational. Do NOT use emojis.
        `;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        return response.text;
      } catch (err) {
        console.error("Gemini Study Buddy chat failed, falling back to mock:", err.message);
      }
    }

    // Mock Fallback Chat
    const qLower = query.toLowerCase();
    
    if (qLower.includes("explain") || qLower.includes("what is") || qLower.includes("help")) {
      return `AI Study Buddy: In ${currentLesson.title}, the primary concept is:\n\n` +
             `Summary: ${currentLesson.summary}\n\n` +
             `Key Points:\n` +
             currentLesson.notes.map(n => `- ${n}`).join('\n');
    }

    if (qLower.includes("quiz") || qLower.includes("question") || qLower.includes("practice")) {
      return `AI Practice Check: Here is a quick checkpoint for ${currentLesson.title}:\n\n` +
             `Question: Explain how the concepts in this lesson apply to real-world scenarios.\n` +
             `Focus Point: ${currentLesson.notes[0] || 'Core definitions'}.`;
    }

    return `AI Assistant: Regarding ${currentLesson.title}, remember that ${currentLesson.notes[0] || 'understanding key definitions is essential'}. Let me know if you would like a step-by-step breakdown or another practice quiz.`;
  }

  /**
   * Generates a personalized AI Study Schedule
   */
  async generateSchedule({ examDate, dailyHours = 2, targetClass = "Class 10", targetSubject = "All Subjects" }) {
    if (client) {
      try {
        const prompt = `
          Generate a 7-day study planner schedule for a student.
          Exam Date / Goal: "${examDate}"
          Daily Study Allocation: ${dailyHours} hours
          Target Academic Class: "${targetClass}"
          Subject Focus: "${targetSubject}"

          Generate exactly 7 daily study items. For each day, provide a structured task and a specific focus area.
          Output valid JSON matching this schema:
          {
            "timeline": [
              {
                "day": "Day 1",
                "task": "A study action task (e.g. review notes, solve quizzes)",
                "focusArea": "The specific concepts to focus on"
              }
            ]
          }
        `;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response.text);
        const timeline = parsed.timeline || [];
        const today = new Date();
        const schedule = [];

        timeline.forEach((item, index) => {
          const d = new Date(today);
          d.setDate(d.getDate() + index + 1);
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

          schedule.push({
            day: item.day || `Day ${index + 1}`,
            dateStr: dateStr,
            targetHours: dailyHours,
            task: item.task,
            focusArea: item.focusArea,
            completed: false
          });
        });

        return {
          examDate: examDate || "Upcoming Assessment",
          dailyHours,
          targetClass,
          targetSubject,
          timeline: schedule
        };

      } catch (err) {
        console.error("Gemini Schedule generation failed, falling back to mock:", err.message);
      }
    }

    // Mock Fallback Schedule
    const days = 7;
    const schedule = [];
    const today = new Date();

    const tasksPool = [
      "Review Video Lesson & Take Interactive Notes",
      "Solve Topic Assessment & Review Explanations",
      "AI Study Buddy Session for Identified Weak Topics",
      "Comprehensive Practice Test & Exam Preparation"
    ];

    for (let i = 1; i <= days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      schedule.push({
        day: `Day ${i}`,
        dateStr: dateStr,
        targetHours: dailyHours,
        task: tasksPool[(i - 1) % tasksPool.length],
        focusArea: `${targetClass} - ${targetSubject} (Module ${Math.ceil(i/2)})`,
        completed: false
      });
    }

    return {
      examDate: examDate || "Upcoming Final Assessment",
      dailyHours,
      targetClass,
      targetSubject,
      timeline: schedule
    };
  }
}

module.exports = new AIService();
