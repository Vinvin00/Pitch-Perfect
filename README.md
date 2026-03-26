Pitch Perfect 🎤
An AI-powered presentation coaching app that records your delivery, analyzes your performance across multiple dimensions, and gives you brutally honest, data-driven feedback.

What it does
Record yourself presenting, and Pitch Perfect will evaluate your:

Eye Contact — Are you engaging your audience or staring at the floor?
Posture & Composure — Upright and commanding, or slouched and distracted?
Gestures — Purposeful and expressive, or stiff and robotic?
Vocal Delivery — Pace (WPM), volume, consistency, and clarity
Energy — Movement, dynamism, and presence
Filler Words — Every "um", "uh", and "like" is counted and penalized

After each session, you get a detailed score breakdown and can chat directly with the AI coach to dig into your results and get a personalized improvement plan.

Evaluation Modes
Choose the scenario that matches your context:
ModeEnergyFormalityGoalEntertainingHighLow–MediumEngageProfessional PitchMediumMedium–HighPersuadeCorporateLow–MediumHighAuthority
Each mode uses a different scoring rubric — what makes a great entertainer is different from what makes a commanding executive.

Tech Stack
LayerTechnologyFrontendReact + TypeScript + ViteRoutingReact RouterAuth & DatabaseFirebase (Auth + Firestore + Storage)AI AnalysisOpenAI API (vision + audio)Backend APINode.js / Express (server.js) + Vercel serverless functions (api/)

Project Structure
├── src/
│   ├── App.tsx                  # Routes and protected route logic
│   ├── components/
│   │   ├── screens/
│   │   │   ├── Login.tsx        # Auth (sign in / sign up)
│   │   │   ├── Home.tsx         # Session history dashboard
│   │   │   ├── NewSession.tsx   # Choose evaluation mode
│   │   │   ├── Record.tsx       # Webcam recording + real-time audio analysis
│   │   │   ├── Evaluation.tsx   # Score breakdown and results
│   │   │   └── Chat.tsx         # AI coaching chat
│   │   ├── server.js            # Express server (local dev)
│   │   ├── firbaseconfig.ts     # Firebase initialization
│   │   └── useAuth.ts           # Auth context hook
├── api/
│   ├── analyze.js               # POST /api/analyze — video/audio evaluation
│   └── chat.js                  # POST /api/chat — coaching conversation
├── index.html
└── package.json

Getting Started
Prerequisites

Node.js >= 20
A Firebase project with Auth, Firestore, and Storage enabled
An OpenAI API key

Installation
bashgit clone <repo-url>
cd pitchcoach
npm install
Environment Variables
Create a .env file in the project root:
env# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Firebase (add your project's config values)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
Running Locally
Start the backend API server:
bashnode src/components/server.js
In a separate terminal, start the frontend dev server:
bashnpm run dev
The app will be available at http://localhost:5173.

How a Session Works

Login — Sign up or log in with email and password
New Session — Pick your presentation mode (Entertaining, Professional Pitch, or Corporate)
Record — Present to your webcam; the app captures video frames and analyzes your audio in real time (volume, pace, filler words, silence, movement)
Evaluate — Frames and audio data are sent to the /api/analyze endpoint, which calls the OpenAI API with a mode-specific scoring prompt
Review — See your overall score and per-category breakdown with specific feedback
Chat — Ask the AI coach follow-up questions, request a practice plan, or drill into any weak category
History — All sessions are saved to Firestore and accessible from the Home dashboard


API Endpoints
POST /api/analyze
Evaluates a recorded presentation.
Request body:
json{
  "frames": ["base64...", "..."],
  "evaluationType": "professional-pitch",
  "duration": 120,
  "audioAnalysis": {
    "wordCount": 240,
    "wpm": 130,
    "fillerWordCount": 4,
    "silencePercent": 12,
    "averageVolume": 62,
    "transcript": "..."
  }
}
Response: JSON object with overallScore, categories (per-metric scores and feedback), summary, topStrength, topImprovement, and details.

POST /api/chat
Sends a message to the AI coach with full session context.
Request body:
json{
  "message": "How do I fix my posture?",
  "history": [{ "role": "user", "content": "..." }],
  "sessionContext": {
    "evaluationType": "corporate",
    "evaluation": { "overallScore": 42, "..." : "..." },
    "audioAnalysis": { "..." : "..." }
  }
}
Response: { "reply": "..." }

Deployment
The api/ directory contains Vercel-compatible serverless functions for production deployment. The Express server.js is used for local development only.
To deploy:
bashvercel deploy
Make sure your OPENAI_API_KEY and Firebase config are set in your Vercel project's environment variables.

License
MIT
