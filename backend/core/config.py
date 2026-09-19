import os

class Settings:
    def get_gemini_keys(self):
        keys = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
        return [k.strip() for k in keys.split(",") if k.strip()]
        
    def get_groq_keys(self):
        keys = os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", ""))
        return [k.strip() for k in keys.split(",") if k.strip()]
        
    def get_openrouter_keys(self):
        keys = os.getenv("OPENROUTER_API_KEYS", os.getenv("OPENROUTER_API_KEY", ""))
        return [k.strip() for k in keys.split(",") if k.strip()]

settings = Settings()
