# AI-Driven Learning Support System

Live Demo: https://e-learning-ai-based.onrender.com/

An AI-powered learning management platform that simplifies and customizes the learning experience using Google Gemini models. The system features smart course generation, student diagnostic assessments, automated remedial lesson plans, an interactive coding sandbox, spaced repetition 3D flashcards, and verified completion certificates.

## Key Features

1. **AI Content Curation & Course Generator**:
   - Inputs any learning topic (e.g., "Machine Learning", "Ohm's Law") and automatically compiles structured course modules with video resources, notes, and interactive quizzes.

2. **Diagnostic Assessment & Evaluation**:
   - Takes subject-based assessments to analyze the student's current proficiency level.
   - Evaluates quiz responses and highlights conceptual weak points.

3. **Individualized Course Builder**:
   - Generates custom remedial courses that specifically target the student's weaknesses identified in the diagnostic assessment.

4. **Interactive JavaScript Sandbox**:
   - Write, edit, and execute JavaScript code directly in the integrated coding environment.

5. **AI Study Buddy Drawer**:
   - Context-aware chatbot trained to act as a private tutor.
   - Supports speech recognition (mic voice input) and text-to-speech (read-aloud answers).

6. **3D Spaced Repetition Flashcards**:
   - Revision flashcards with 3D perspective flip transitions for testing memory recall.

7. **Verified Completion Certificates**:
   - Generates printable certificates with custom dynamic digital seals, scores, and completion IDs.

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Clean Theme), JavaScript (ES6)
- **Backend**: Node.js, Express.js
- **AI Engine**: Google GenAI SDK (`gemini-2.5-flash`)
- **Database**: Local JSON file storage (`data_store.json`) for zero-dependency portability.

---

## Installation & Setup

1. **Clone or Download the Project**:
   Ensure you are in the project folder.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file at the root of the project:
   ```env

   ```
   *(Note: If no API key is provided, the system runs in Mock Mode fallback for testing).*

4. **Start the Application**:
   ```bash
   npm start
   ```

5. **Access the App**:


---

