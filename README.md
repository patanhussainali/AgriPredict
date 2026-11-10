# 🌾 AgriPredict – AI-Powered Smart Agriculture Platform

**AgriPredict** is an AI-powered smart agriculture platform designed to help farmers make better farming decisions using Artificial Intelligence, Machine Learning, real-time weather information, and intelligent agricultural recommendations.

The platform provides crop yield prediction, plant disease detection, weather monitoring, and an AI-powered agricultural chatbot through a user-friendly web application.

🌐 **Live Demo:** https://agripredictf.vercel.app

📂 **GitHub Repository:** https://github.com/saidurga144/AgriPredict

---

## 🚀 Key Features

### 1. Crop Yield Prediction
- Predicts crop yield based on agricultural and environmental parameters.
- Analyzes district, crop type, and cultivation season.
- Considers rainfall, temperature, soil type, and soil nutrients (NPK).
- Provides estimated crop yield in tonnes per hectare.
- Displays risk levels, confidence scores, and farming recommendations.

### 2. Plant Disease Detection
- Allows farmers to upload crop or plant images.
- Uses AI-powered image analysis to identify potential plant diseases.
- Provides disease severity and confidence information.
- Suggests organic treatments and recommended pesticides.
- Provides preventive measures and crop protection advice.

### 3. Real-Time Weather Monitoring
- Retrieves weather information using geographical location.
- Displays current temperature, humidity, and wind speed.
- Provides weather forecasts.
- Visualizes weather information through interactive charts.
- Helps farmers understand environmental conditions.

### 4. AI Agricultural Chatbot
- Provides intelligent agricultural assistance.
- Answers questions related to crops, farming, and weather.
- Generates farming recommendations using Groq AI.
- Supports multilingual responses.
- Includes voice input functionality.

### 5. Farmer and Agricultural Officer Dashboards
- Separate dashboards for farmers and agricultural officers.
- Displays agricultural information and prediction results.
- Provides regional agricultural statistics.
- Includes interactive charts and data visualization.

### 6. Data Analytics
- Displays agricultural datasets.
- Provides graphical data visualization.
- Supports chart-based analysis.
- Presents crop and soil-related information.

### 7. User Authentication
- User registration and login.
- Firebase Authentication integration.
- Google sign-in support.
- Email verification and password recovery.
- User profile management.

---

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Frontend | React.js, HTML5, CSS3, JavaScript |
| Backend | Python, FastAPI |
| Machine Learning | Scikit-learn, NumPy, Pandas |
| Model Serialization | Joblib |
| Artificial Intelligence | Groq AI |
| AI Language Models | Llama 3.3 70B, Llama 4 Scout |
| Image Analysis | Llama 4 Scout, LLaVA |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| Weather API | OpenWeatherMap API |
| Data Visualization | Chart.js, Recharts |
| UI Framework | Tailwind CSS |
| HTTP Client | Axios |
| Deployment | Vercel |

---

## 🤖 AI and Machine Learning Models

### Artificial Intelligence Models
- **Llama 3.3 70B Versatile:** Generates intelligent agricultural responses and farming recommendations.
- **Llama 4 Scout:** Used for vision-based plant disease analysis.
- **LLaVA:** Included as an alternative vision-model option for plant image analysis.

### Machine Learning
- **Scikit-learn:** Machine learning model development and prediction.
- **Joblib:** Loading and managing serialized machine learning models.
- **Pandas:** Agricultural data preprocessing and manipulation.
- **NumPy:** Numerical computation and feature processing.

The backend supports loading a trained machine learning model through a Joblib model artifact.

---

## 🏗️ Project Architecture

The project follows a full-stack architecture consisting of three major layers:

**1. Presentation Layer**
- React.js frontend.
- Interactive dashboards.
- User authentication.
- Weather and analytics visualization.

**2. Application Layer**
- FastAPI backend.
- API integration.
- Prediction processing.
- AI chatbot and disease detection services.

**3. Intelligence Layer**
- Machine learning model inference.
- Groq AI integration.
- Vision-based plant disease analysis.
- Agricultural recommendation generation.

---

## 📁 Project Structure

```text
AgriPredict/
│
├── api/
│   ├── predict.py
│   └── chat.py
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── utils/
│       └── disease_engine.py
│
├── data/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── firebase.js
│   │
│   ├── package.json
│   └── index.html
│
├── requirements.txt
├── package.json
├── vercel.json
├── compress_model.py
├── start_app.bat
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.x
- Node.js and npm
- Git
- Groq API Key
- Firebase project configuration

### Step 1: Clone the Repository

```bash
git clone https://github.com/saidurga144/AgriPredict.git
```

```bash
cd AgriPredict
```

### Step 2: Install Backend Dependencies

```bash
python -m venv .venv
```

Activate the virtual environment:

**Windows:**
```bash
.venv\Scripts\activate
```

**Linux / macOS:**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
```

Create a `frontend/.env.local` file for the frontend configuration:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_API_URL=http://127.0.0.1:8000
```

**Important:** Frontend variables prefixed with `VITE_` are exposed in the browser bundle. For production, route AI requests through the backend and keep private API keys server-side. Never commit API keys to GitHub.

### Step 4: Start the Backend Server

Open a terminal:

```bash
cd backend
python main.py
```

Backend server:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### Step 5: Start the Frontend Application

Open another terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend application:

```text
http://localhost:5173
```

---

## 🔗 Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health check |
| GET | `/predict` | Crop yield prediction |
| POST | `/detect-disease` | Plant disease image analysis |
| GET | `/chat` | AI agricultural chatbot |

### Crop Prediction Parameters

The prediction endpoint accepts:

- District
- Crop
- Season
- Rainfall
- Minimum and maximum temperature
- Soil pH
- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- Soil type

---

## ☁️ Deployment

The project is configured for deployment using **Vercel**.

Deployment steps:

1. Push the project to GitHub.
2. Connect the GitHub repository to Vercel.
3. Configure the required environment variables.
4. Deploy the application.
5. Access the deployed application through the generated URL.

---

## 🔮 Future Enhancements

- Integration with IoT-based soil monitoring systems.
- Advanced crop disease classification models.
- Improved crop yield prediction accuracy.
- Satellite-based agricultural monitoring.
- Real-time fertilizer recommendations.
- Market price prediction and analysis.
- Advanced multilingual voice assistance.
- Integration with additional agricultural datasets.

---

## 🎯 Project Objective

The primary objective of AgriPredict is to modernize traditional agricultural practices through Artificial Intelligence and Machine Learning. By combining crop prediction, disease detection, weather monitoring, and intelligent agricultural assistance, the platform aims to support farmers in making informed decisions, improving productivity, and promoting sustainable agriculture.

---

## ⚠️ Implementation Notes

Some prediction and analytics components currently contain demonstration or simulated data. The backend prediction service supports a trained Joblib model when the corresponding model artifact is available; otherwise, it uses fallback data. These components should be connected to validated production datasets and models before treating predictions as real-world agricultural forecasts.

## 📄 License

No license file is currently included in this repository. Add an appropriate open-source license before distributing the project.

---

**Developed with ❤️ using Artificial Intelligence, Machine Learning, and Modern Web Technologies.**

🌱 **AgriPredict – Empowering Agriculture Through Intelligence.**
