import os
from dotenv import load_dotenv
load_dotenv()

try:
    from backend.utils.chat_engine import chat_bot
    print("Chat Engine loaded successfully")
    if chat_bot.client:
        print("Groq Client initialized")
    else:
        print("Groq Client failed to initialize")
except Exception as e:
    print(f"Error loading chat engine: {e}")
