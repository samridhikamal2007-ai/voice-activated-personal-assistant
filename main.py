import logging
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

from assistant_engine import assistant_engine
from reminder_manager import reminder_manager
from weather_service import get_weather
from news_service import get_news

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/static"
)
CORS(app)

# --- WEB UI FRONTEND ROUTE ---

@app.route("/")
def index():
    """Serves the main holographic dashboard UI."""
    return render_template("index.html")

# --- ASSISTANT ENGINE API ROUTES ---

@app.route("/api/voice", methods=["POST"])
def voice_endpoint():
    """
    Core NLP processing route.
    Accepts text queries from client or captures local mic audio if text is omitted.
    """
    data = request.json or {}
    text_query = data.get("text")
    speak_locally = data.get("speak_locally", True)

    logger.info(f"Received API call to /api/voice. Speak locally={speak_locally}")

    # If text is provided (e.g. from browser-speech capture or manual typing)
    if text_query:
        logger.info(f"Processing client-sent query: '{text_query}'")
        result = assistant_engine.process_command(text_query)
    else:
        # No text provided: capture using Python's native mic + SpeechRecognition!
        logger.info("No text provided. Triggering host microphone...")
        transcription = assistant_engine.listen_and_transcribe()
        result = assistant_engine.process_command(transcription)

    # Trigger host-side TTS engine to speak response if requested and applicable
    if speak_locally and result.get("command_type") != "error":
        assistant_engine.speak(result["response"])

    return jsonify(result)

@app.route("/api/speak", methods=["POST"])
def speak_endpoint():
    """Triggers the Python text-to-speech engine to speak the given payload."""
    data = request.json or {}
    text = data.get("text")
    if not text:
        return jsonify({"error": "No speech text provided"}), 400
        
    logger.info(f"Vocalizing via python engine: '{text}'")
    assistant_engine.speak(text)
    return jsonify({"success": True})

# --- WEATHER AND NEWS PROXIES ---

@app.route("/api/weather", methods=["GET"])
def weather_route():
    """Proxy route to fetch geocoded weather forecasts."""
    city = request.args.get("city", "London")
    res = get_weather(city)
    return jsonify(res)

@app.route("/api/news", methods=["GET"])
def news_route():
    """Proxy route to aggregate news feeds by category."""
    category = request.args.get("category", "general")
    res = get_news(category)
    return jsonify(res)

# --- PERSISTENT REMINDER OPERATIONS ---

@app.route("/api/reminders", methods=["GET", "POST"])
def reminders_route():
    """Retrieve all reminders or add a new custom reminder."""
    if request.method == "GET":
        reminders = reminder_manager.get_all_reminders()
        return jsonify({"reminders": reminders})
    
    # POST - Create new reminder manually
    data = request.json or {}
    title = data.get("title")
    seconds = data.get("seconds")
    
    if not title or seconds is None:
        return jsonify({"error": "Fields 'title' and 'seconds' are required."}), 400
        
    try:
        seconds = int(seconds)
        reminder = reminder_manager.add_reminder_relative(title, seconds)
        return jsonify({"success": True, "reminder": reminder})
    except Exception as e:
        logger.error(f"Error adding manual reminder: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/reminders/<reminder_id>", methods=["DELETE"])
def delete_reminder_route(reminder_id):
    """Delete a reminder by ID."""
    deleted = reminder_manager.delete_reminder(reminder_id)
    if deleted:
        return jsonify({"success": True})
    return jsonify({"error": "Reminder not found"}), 404

@app.route("/api/reminders/triggered", methods=["GET"])
def triggered_reminders_route():
    """
    Polled by the frontend to see if any background reminders triggered recently.
    Clears them from the queue upon fetching.
    """
    triggered = reminder_manager.pop_triggered_reminders()
    return jsonify({"triggered": triggered})

# --- SERVER SHUTDOWN PROTOCOL ---

@app.after_serving
def cleanup():
    """Shutdown background threads when the Flask server stops."""
    logger.info("Stopping reminder manager background threads...")
    reminder_manager.shutdown()

if __name__ == "__main__":
    logger.info("Launching Cybernetic Personal Assistant server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
