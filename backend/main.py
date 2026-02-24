from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import random
from dotenv import load_dotenv
from groq import Groq

# Load .env from ROOT directory (one level up)
load_dotenv(dotenv_path="../.env")

# Initialize FastAPI
app = FastAPI()

# CORS - Allow Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq Client
api_key = os.getenv("GROQ_API_KEY")
client = None

if api_key:
    try:
        client = Groq(api_key=api_key)
        print("✅ Groq Client Initialized Successfully")
    except Exception as e:
        print(f"❌ Groq Init Failed: {e}")
else:
    print("⚠️ No GROQ_API_KEY found in .env")

@app.get("/")
def home():
    return {"status": "AgriPredict Backend Running", "ai_enabled": client is not None}

@app.get("/chat")
def chat(message: str, lang: str = "en"):
    """
    Chat endpoint using Real Groq AI
    """
    print(f"Received message: {message} ({lang})")
    
    if not client:
        return {
            "response": "⚠️ System Error: AI Service is not configured (Missing API Key).",
            "lang": lang,
            "status": "error"
        }

    try:
        # Prompt Engineering for Agri Assistant
        system_prompt = (
            f"You are an expert Agricultural Assistant. Answer in {lang} language. "
            "Keep answers concise, helpful, and focused on farming, crops, and weather. "
            "If asked about prices, give general estimates."
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            model="llama-3.3-70b-versatile", # Updated to supported model
            temperature=0.7,
            max_tokens=200,
        )

        reply = chat_completion.choices[0].message.content
        return {
            "response": reply,
            "lang": lang,
            "status": "success"
        }

    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "response": f"Error: {str(e)}", # Show actual error for debugging
            "lang": lang,
            "status": "error"
        }

if __name__ == "__main__":
    import uvicorn
    # Vercel likes port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
