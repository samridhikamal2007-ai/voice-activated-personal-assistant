import re
import logging
import threading
import time
from datetime import datetime, timedelta
import speech_recognition as sr
import pyttsx3

from weather_service import get_weather
from news_service import get_news
from reminder_manager import reminder_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssistantEngine:
    def __init__(self):
        self.tts_lock = threading.Lock()
        
        # Initialize pyttsx3 TTS Engine safely
        try:
            self.tts_engine = pyttsx3.init()
            # Set speech rate and volume
            self.tts_engine.setProperty('rate', 175)
            self.tts_engine.setProperty('volume', 1.0)
            
            # Select default clean voice (prefers female voice if available, typically index 1)
            voices = self.tts_engine.getProperty('voices')
            if len(voices) > 1:
                self.tts_engine.setProperty('voice', voices[1].id)
            elif len(voices) > 0:
                self.tts_engine.setProperty('voice', voices[0].id)
                
            self.tts_available = True
            logger.info("pyttsx3 Text-To-Speech engine initialized successfully.")
        except Exception as e:
            self.tts_available = False
            self.tts_engine = None
            logger.warning(f"Local pyttsx3 TTS engine could not be initialized: {e}. Falling back to visual-only/web speech synthesis.")

        # Initialize Speech Recognizer
        self.recognizer = sr.Recognizer()
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        logger.info("SpeechRecognition module loaded.")

    def speak(self, text: str):
        """Speaks the text using local pyttsx3 engine. Executed in a thread-safe manner."""
        if not self.tts_available or not self.tts_engine:
            logger.info(f"[TTS Offline Fallback] Speaking: '{text}'")
            return

        def _speak_worker():
            with self.tts_lock:
                try:
                    # Creating a new sub-instance or running loop inside lock
                    engine = pyttsx3.init()
                    engine.setProperty('rate', 170)
                    voices = engine.getProperty('voices')
                    if len(voices) > 1:
                        engine.setProperty('voice', voices[1].id)
                    engine.say(text)
                    engine.runAndWait()
                except Exception as ex:
                    logger.error(f"Error playing TTS: {ex}")

        # Run speech in a separate thread so it doesn't block the caller (especially background checks or web routes)
        threading.Thread(target=_speak_worker, daemon=True).start()

    def listen_and_transcribe(self) -> str:
        """Captures microphone input and transcribes it using Google Web Speech Recognition API."""
        try:
            with sr.Microphone() as source:
                logger.info("Adjusting mic for ambient noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.8)
                logger.info("Listening for audio command...")
                audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=8)
                
            logger.info("Audio received, transcribing...")
            query = self.recognizer.recognize_google(audio)
            logger.info(f"Transcribed query: '{query}'")
            return query
        except sr.WaitTimeoutError:
            logger.warning("Listening timed out (no speech detected).")
            return "ERROR: Listening timed out. No speech detected."
        except sr.RequestError as e:
            logger.error(f"Google speech recognition API requested error: {e}")
            return "ERROR: Google Speech API is currently unavailable."
        except sr.UnknownValueError:
            logger.warning("Google Speech Recognition could not understand the audio.")
            return "ERROR: Could not understand audio. Please speak clearly."
        except Exception as e:
            logger.error(f"Microphone or sound driver error: {e}")
            return "ERROR: Microphone is unavailable. Please check physical connection or install PyAudio driver."

    def process_command(self, query: str) -> dict:
        """
        Parses a textual voice query, maps it to specific functions, and compiles a comprehensive response.
        Returns a dictionary suitable for API and frontend consumption.
        """
        query_clean = query.strip().lower()
        
        # 1. Error state handling
        if query_clean.startswith("error:"):
            return {
                "response": query.replace("ERROR: ", ""),
                "command_type": "error",
                "data": None
            }

        logger.info(f"Processing command intent: '{query_clean}'")

        # 2. Conversational Intent - Welcome / Hello
        if any(greet in query_clean for greet in ["hello", "hi", "hey jarvis", "hey assistant", "wake up"]):
            response = "Greetings! I am initialized and ready to assist you. How can I serve you today?"
            return {"response": response, "command_type": "conversation", "data": None}

        # 3. Conversational Intent - Identity
        if any(q in query_clean for q in ["who are you", "what is your name", "tell me about yourself"]):
            response = "I am Antigravity, your hyper-premium cyberpunk personal assistant. I can set reminders, pull real-time weather details, read top headlines, and execute sci-fi routines."
            return {"response": response, "command_type": "conversation", "data": None}

        # 4. Easter Eggs / Conversational
        if "coffee" in query_clean:
            response = "I searched my database, but it appears my liquid delivery drivers are not installed. I recommend using manual brewing protocols!"
            return {"response": response, "command_type": "conversation", "data": None}

        if any(siri in query_clean for siri in ["siri", "alexa", "cortana", "google assistant"]):
            response = "They are excellent systems, but I run on customized antigravity cores. I believe our cyberpunk dashboard is infinitely more stylish!"
            return {"response": response, "command_type": "conversation", "data": None}

        # 5. Help / Command Guide
        if any(h in query_clean for h in ["help", "what can you do", "commands", "features"]):
            response = "I can set custom reminders, fetch weather details, and compile category-based news feeds. Try saying: 'weather in Paris', 'read the technology news', or 'remind me to exercise in 30 seconds'."
            return {"response": response, "command_type": "help", "data": None}

        # 6. News Intent
        # Pattern match: "read/get/show tech/science/business/general news" or "read news" or "latest headlines"
        news_match = re.search(r'(?:read|get|show|what is|tell me the)\s+(?:the\s+)?(technology|science|business|general)?\s*news', query_clean)
        if "news" in query_clean or "headlines" in query_clean or news_match:
            category = "general"
            if "tech" in query_clean or "technology" in query_clean:
                category = "technology"
            elif "science" in query_clean:
                category = "science"
            elif "business" in query_clean or "finance" in query_clean:
                category = "business"
            
            news_data = get_news(category, limit=5)
            if "error" in news_data:
                response = f"I encountered an error: {news_data['error']}"
                return {"response": response, "command_type": "news", "data": None}
            
            response = f"Here are the top stories for {category} news. First: {news_data['articles'][0]['title']}. Second: {news_data['articles'][1]['title']}. You can review all five articles on your dashboard."
            return {"response": response, "command_type": "news", "data": news_data}

        # 7. Weather Intent
        # Pattern match: "weather in [city]" or "weather of [city]" or "weather for [city]" or "check weather [city]"
        weather_match = re.search(r'weather\s+(?:in|of|for|at)?\s*([a-zA-Z\s\-\.\,\'\u00C0-\u017F]+)', query_clean)
        if weather_match:
            city = weather_match.group(1).strip()
            # Clean filler phrases
            city = re.sub(r'^(like|like in|like for|right now in|right now)\s+', '', city)
            if city:
                weather_data = get_weather(city)
                if "error" in weather_data:
                    response = f"I'm sorry, I could not fetch the weather: {weather_data['error']}"
                    return {"response": response, "command_type": "weather", "data": None}
                
                response = f"The weather in {weather_data['city']} is currently {weather_data['weather_desc']} at {weather_data['temp']} degrees Celsius, with a wind speed of {weather_data['wind_speed']} kilometers per hour."
                return {"response": response, "command_type": "weather", "data": weather_data}

        if "weather" in query_clean:
            # Fallback default weather
            weather_data = get_weather("London")
            if "error" in weather_data:
                response = f"Weather API is offline: {weather_data['error']}"
                return {"response": response, "command_type": "weather", "data": None}
            response = f"No location specified, defaulting to London. It is currently {weather_data['weather_desc']} at {weather_data['temp']} degrees Celsius."
            return {"response": response, "command_type": "weather", "data": weather_data}

        # 8. Reminders Intent
        # Parse relative: "remind me to [action] in [X] [seconds/minutes/hours]"
        # Parse absolute: "remind me to [action] at [HH:MM] [AM/PM]"
        
        # Relative matching:
        relative_match = re.search(r'remind me to\s+(.+?)\s+in\s+(\d+)\s+(second|minute|hour)s?', query_clean)
        if not relative_match:
            # Alternate phrasing: "set a reminder to [action] in..."
            relative_match = re.search(r'set a reminder to\s+(.+?)\s+in\s+(\d+)\s+(second|minute|hour)s?', query_clean)
            
        if relative_match:
            action = relative_match.group(1).strip()
            amount = int(relative_match.group(2))
            unit = relative_match.group(3)
            
            seconds = amount
            if "minute" in unit:
                seconds = amount * 60
            elif "hour" in unit:
                seconds = amount * 3600
                
            reminder = reminder_manager.add_reminder_relative(action, seconds)
            target_time = datetime.fromisoformat(reminder["target_time"]).strftime('%I:%M:%S %p')
            
            response = f"Acknowledged. I have scheduled a reminder to {action} in {amount} {unit}s, which will trigger at exactly {target_time}."
            return {
                "response": response,
                "command_type": "reminder",
                "data": {
                    "reminder": reminder,
                    "mode": "relative",
                    "seconds": seconds
                }
            }

        # Absolute matching: "remind me to [action] at [time]"
        absolute_match = re.search(r'remind me to\s+(.+?)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', query_clean)
        if not absolute_match:
            absolute_match = re.search(r'set a reminder to\s+(.+?)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', query_clean)
            
        if absolute_match:
            action = absolute_match.group(1).strip()
            hour = int(absolute_match.group(2))
            minute = int(absolute_match.group(3)) if absolute_match.group(4) else 0
            meridiem = absolute_match.group(4) # am or pm
            
            now = datetime.now()
            target_hour = hour
            
            # Format military time or adjust for AM/PM
            if meridiem:
                meridiem = meridiem.lower()
                if meridiem == "pm" and hour < 12:
                    target_hour = hour + 12
                elif meridiem == "am" and hour == 12:
                    target_hour = 0
            
            target_dt = now.replace(hour=target_hour, minute=minute, second=0, microsecond=0)
            
            # If target time is earlier than now, assume it's for tomorrow
            if target_dt <= now:
                target_dt += timedelta(days=1)
                
            seconds_delta = int((target_dt - now).total_seconds())
            reminder = reminder_manager.add_reminder_absolute(action, target_dt)
            target_time_str = target_dt.strftime('%I:%M %p')
            
            response = f"Understood. I've set a reminder to {action} at {target_time_str}."
            return {
                "response": response,
                "command_type": "reminder",
                "data": {
                    "reminder": reminder,
                    "mode": "absolute",
                    "seconds": seconds_delta
                }
            }

        # 9. Conversational / Unknown Fallback
        response = f"I recognized your request: '{query}', but could not map it to a specific cybernetic skill. Say 'help' for a full list of protocols I can run."
        return {"response": response, "command_type": "unknown", "data": None}

# Global assistant engine instance
assistant_engine = AssistantEngine()

if __name__ == "__main__":
    # Local CLI test
    engine = AssistantEngine()
    engine.speak("Voice engine activated successfully.")
    
    test_queries = [
        "Hello assistant",
        "What is the weather in Paris",
        "Remind me to grab coffee in 10 seconds",
        "Read the tech news",
        "Who are you"
    ]
    
    for q in test_queries:
        print(f"\nUser: {q}")
        res = engine.process_command(q)
        print("Assistant:", res["response"])
        time.sleep(1)
