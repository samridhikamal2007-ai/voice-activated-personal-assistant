<<<<<<< HEAD
# ANTIGRAVITY OS v2.4 // Futuristic voice-activated assistant

An exceptionally designed, high-performance, and futuristic **voice-activated personal assistant** that combines a robust **Python-native cognitive backend** with a stunning **cyberpunk/glassmorphic telemetry dashboard** in the browser. 

Designed for developers, tech enthusiasts, and recruitment panels, this project stands out through its visual mechanics, ambient animations, and a bulletproof dual-mode speech architecture that ensures it runs seamlessly on any environment without driver failures.

---

## 🌟 Key Features

1. **Holographic Orbital Visualizer (HTML5 Canvas)**
   * A gorgeous 2D-rendered holographic sphere representing the assistant’s cognitive state.
   * Dynamically morphs shape, speed, particles, and glows across five distinct core states:
     * **Idle:** Gentle breathing cyan concentric rings.
     * **Listening:** Active frequency wave height reacting to voice commands.
     * **Cognition (Thinking):** Opposite-spinning sunset-orange orbital segment layers.
     * **Vocalizing (Speaking):** Golden particle storm exploding outwards based on word rhythm.
     * **Alert (Alarm Triggered):** High-frequency emergency red-flashing indicator.

2. **Dynamic Ambient Weather Adaptations**
   * The dashboard automatically changes its background weather theme based on geocoded location telemetry.
   * **Sunny/Clear:** Warm ambient solar rays with floating dust particles.
   * **Rainy/Drizzle:** Steel-gray grid overlays with custom neon blue raindrops cascading down the screen.
   * **Snowy/Cold:** Mist transitions with floating white crystalline structures.
   * **Stormy/Thunder:** Deep magenta grids with flickering electrical lightning glows.

3. **Dual Vocal Processing Architecture (Zero-Failure Fallback)**
   * **Python Core Mode:** Captures input from the physical microphone using `SpeechRecognition` and speaks responses through offline `pyttsx3` models.
   * **Browser Failsafe Mode (Web Speech API):** High-precision in-browser recording (SpeechRecognition) and rich natural voices (SpeechSynthesis). This completely bypasses tricky C-compilation errors for `PyAudio` drivers on Windows/Mac, guaranteeing a perfect demo on any computer!

4. **Multi-Channel News Dispatch Deck**
   * Aggregates real-time specialized news from RSS feeds.
   * Users can click categories (**General**, **Technology**, **Science**, **Business**) in tabs or voice-activate them (*"read the tech news"*).

5. **Advanced Alarms & Persisted Reminders**
   * Set relative countdowns (*"remind me to inspect servers in 10 seconds"*) or absolute times (*"remind me to check code at 6:30 PM"*).
   * Scheduled alarms countdown dynamically on the UI, persist through local `reminders.json` data, and vocalize/chime when triggered. Includes an **automatic synthetic Web Audio oscillator engine** to generate digital sirens even if default MP3 files fail to load.

6. **Under-The-Hood System Console**
   * Real-time scrolling retro-futuristic terminal showing internal threads, geocoding lookups, parsing confidences, and socket ports.

7. **Hot-Swappable Theme Matrix**
   * Switch the entire aesthetic between **TRON Cyan**, **Cyberpunk Amber**, **Deep Nebula Purple**, and **Matrix Digital Green** using a dashboard selector dropdown.

---

## 🧬 System Architecture

```
                 +-------------------------------------------------+
                 |                WEB UI FRONTEND                  |
                 |  - Glassmorphic CSS Grid / Responsive Layouts   |
                 |  - HTML5 Holographic Canvas Visualizer Engine   |
                 |  - Failsafe Web Speech API (Mic / Synthesizer)  |
                 |  - Real-Time Reminder Countdown & Synthetic Alms |
                 +------------------------+------------------------+
                                          |
                                HTTP JSON REST APIs
                                          |
                 +------------------------v------------------------+
                 |                 FLASK BACKEND                   |
                 |  - main.py (Multi-Threaded Server & Router)     |
                 |  - reminder_manager.py (JSON Persistence Loop)  |
                 |  - assistant_engine.py (NLP intent regex parsing)|
                 +----+-------------------+-------------------+----+
                      |                   |                   |
        [Open-Meteo API]            [BBC RSS Feeds]     [pyttsx3 / SpeechRec]
      Geocoded Weather telemetry   Multi-channel news    Native Mic & Speakers
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.10 or higher (Tested fully on Python 3.14!)
* Pip package manager

### 1. Clone & Set Up Directory
```bash
git clone https://github.com/YOUR_USERNAME/voice-activated-personal-assistant.git
cd voice-activated-personal-assistant
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```
> **Note:** If `PyAudio` installation fails due to your system's C++ build libraries, do not worry! The setup script will complete successfully for all other dependencies (Flask, pyttsx3, requests, SpeechRecognition), and our **Browser Failsafe Mode** will activate automatically in the browser to ensure 100% operation.

### 3. Initialize Assistant Server
```bash
python main.py
```

### 4. Deploy Console
Open your browser and navigate to:
```url
http://127.0.0.1:5000
```
*(We recommend Google Chrome or Microsoft Edge for the best Web Speech API experience).*

---

## 🛰️ Command Cheat-Sheet

Activate the assistant by **clicking the glowing circular microphone orb** (or typing in the direct terminal input bar) and execute these protocols:

| Objective | Command Telemetry Examples | System Action |
|---|---|---|
| **Weather** | `"weather in Tokyo"` / `"what is the weather like in Paris"` | Geocodes city, updates grid animation theme, and speaks weather report. |
| **Alarms** | `"remind me to drink water in 10 seconds"` / `"remind me to code in 5 minutes"` | Creates countdown cards, schedules background check, triggers audio-visual alarms. |
| **News** | `"read the technology news"` / `"latest headlines"` / `"science news"` | Updates feed panel with live BBC dispatches, vocalizes first two articles. |
| **Identity** | `"who are you?"` / `"hey assistant"` / `"hello jarvis"` | Greets user with unique modular dialog replies. |
| **Easter Eggs** | `"make me a coffee"` / `"what is your favorite assistant?"` | Futuristic sci-fi joke dialog vocalization. |
| **Support** | `"help"` / `"features"` | Vocally instructs user on how to interface with dashboard widgets. |

---

## 📂 File Directory Blueprint

* `main.py` - Standard thread router containing all REST routes, backend cleanups, and proxy systems.
* `assistant_engine.py` - Cognitive brain translating string queries into specific intents using pattern matching.
* `reminder_manager.py` - Thread-safe scheduler running a continuous 1-second interval loop, saving to `reminders.json`.
* `weather_service.py` - Handles zero-key geocoding lookups and WMO parsing to change dashboard styles.
* `news_service.py` - RSS XML Parser with custom whitespace/HTML character cleaners.
* `templates/index.html` - Sleek glassmorphic HTML grid layouts with glowing indicators.
* `static/style.css` - Custom styling declarations, particle grids, falling rain variables, and neon animations.
* `static/app.js` - Canvas renderer, polling tickers, clock events, Web Audio synthesizer, and browser-native voice recording hooks.
=======
# voice-activated-personal-assistant
>>>>>>> 16490b2c9f75fe57408d550cf232fb7991c0e82d
