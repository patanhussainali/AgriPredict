import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

class ChatEngine:
    def __init__(self):
        # Initialize Groq Client
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            print("ChatEngine: GROQ_API_KEY not found in environment variables.")
            self.client = None
            return

        try:
            self.client = Groq(api_key=self.api_key)
            print("ChatEngine: Groq Client Initialized")
        except Exception as e:
            print(f"ChatEngine: Failed to initialize Groq: {e}")
            self.client = None

    def get_response(self, query, lang="en"):
        if not self.client:
            return "Error: AI service is not available right now."
            
        try:
            system_prompt = (
                "You are an agricultural expert assistant. "
                "You answer questions related to farming, crops, weather, soil, and agriculture policies. "
                "If a user asks about a non-agriculture topic, politely steer them back to agriculture.\n"
                f"IMPORTANT: Please answer in the following language code: {lang}. "
                "If the language code is 'ta', answer in Tamil. "
                "If 'te', answer in Telugu. "
                "If 'hi', answer in Hindi. "
                "If 'kn', answer in Kannada. "
                "If 'ur', answer in Urdu. "
                "Otherwise answer in English."
            )
            
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=300,
            )
            
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq API Error: {e}")
            return "I encountered an error communicating with the AI service."

    def get_recommendation(self, data):
        """
        Generates a specific recommendation based on prediction parameters.
        data: Dict containing district, soil, season, etc.
        """
        if not self.client:
            return "AI service unavailable."

        try:
            # Construct a clear prompt based on user requirements
            prompt = (
                f"Based on the following conditions:\n"
                f"- Location: {data.get('district')}\n"
                f"- Season: {data.get('season')}\n"
                f"- Soil Type: {data.get('soil_type')}\n"
                f"- Water/Rainfall: {data.get('rainfall')}mm (Irrigation: {data.get('irrigation', 'N/A')})\n"
                f"- Temperature: {data.get('temp_min')}-{data.get('temp_max')}°C\n"
                f"- Humidity: {data.get('humidity', 'N/A')}%\n\n"
                "Please provide a concise recommendation answering ONLY these 3 points:\n"
                "1. Which crop is BEST suited for these specific conditions? (Ignore the user's selected crop if it's not the best).\n"
                "2. Which pesticides/fertilizers are best for that recommended crop?\n"
                "3. How long will it take to grow (duration)?\n\n"
                "Format the answer clearly with numbered points."
            )

            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert agricultural scientist providing specific crop advice."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.5,
                max_tokens=400,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq Recommendation Error: {e}")
            return "Could not generate AI recommendation at this time."

# Global instance
chat_bot = ChatEngine()
