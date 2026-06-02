/* ==========================================================================
   ANTIGRAVITY OS v2.4 JS ENGINE
   Holographic Canvas Visualizer, Dual Speech Bridges, and Alarm Telemetry
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- SYSTEM STATE REGISTRY ---
    const state = {
        theme: "tron",
        engine: "web", // "web" or "python"
        assistantState: "idle", // "idle", "listening", "thinking", "speaking", "alarm"
        weatherTheme: "sunny",
        reminders: [],
        newsCategory: "general",
        isAlarmActive: false,
        alarmInterval: null,
        activeParticles: []
    };

    // --- DOM ELEMENT REFERENCES ---
    const themeSelect = document.getElementById("theme-selector");
    const engineSelect = document.getElementById("engine-selector");
    const clockEl = document.getElementById("digital-clock");
    const dateEl = document.getElementById("date-display");
    const sysStatusBadge = document.getElementById("system-status-badge");
    const sysStatusDesc = document.getElementById("system-status-desc");
    const micBtn = document.getElementById("mic-trigger");
    const voiceWaves = document.getElementById("voice-waves");
    const manualInput = document.getElementById("manual-text-input");
    const textSubmit = document.getElementById("text-submit");
    const termLog = document.getElementById("terminal-log-output");
    
    // Weather DOM Elements
    const wTemp = document.getElementById("w-temp");
    const wDesc = document.getElementById("w-desc");
    const wHumidity = document.getElementById("w-humidity");
    const wWind = document.getElementById("w-wind");
    const wLocBadge = document.getElementById("weather-location-badge");
    const wIconContainer = document.getElementById("weather-icon-container");

    // Reminders DOM Elements
    const addRemBtn = document.getElementById("add-reminder-btn");
    const remFormBox = document.getElementById("reminder-form-box");
    const remTitleInput = document.getElementById("rem-title");
    const remSecInput = document.getElementById("rem-seconds");
    const remSubmit = document.getElementById("rem-submit");
    const remCancel = document.getElementById("rem-cancel");
    const remListContainer = document.getElementById("reminders-list-container");

    // News DOM Elements
    const newsContainer = document.getElementById("news-feed-container");
    const newsTabs = document.querySelectorAll(".news-tab");

    // Canvas Reference
    const canvas = document.getElementById("holo-canvas");
    const ctx = canvas.getContext("2d");

    // --- UTILITIES: futuristic logging ---
    function writeLog(sender, text, type = "info") {
        const timestamp = new Date().toLocaleTimeString();
        const line = document.createElement("div");
        line.className = `terminal-line ${type}-line`;
        line.innerHTML = `<span class="time">[${timestamp}]</span> [${sender.toUpperCase()}] ${text}`;
        termLog.appendChild(line);
        termLog.scrollTop = termLog.scrollHeight;
    }

    // --- CLOCK CONTROLLER ---
    function updateClock() {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString();
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.innerText = now.toLocaleDateString('en-US', options).toUpperCase();
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- COLOR THEME DICTIONARY ---
    const THEME_COLORS = {
        tron: { primary: "#00F2FE", secondary: "#B92B27", accent: "#00ffff" },
        cyberpunk: { primary: "#FFE000", secondary: "#F12711", accent: "#ffaa00" },
        nebula: { primary: "#EA00FF", secondary: "#00F2FE", accent: "#ff0077" },
        matrix: { primary: "#00FF46", secondary: "#00ffff", accent: "#00aa22" }
    };

    function getThemeColor(role = "primary") {
        const colors = THEME_COLORS[state.theme] || THEME_COLORS.tron;
        return colors[role];
    }

    // --- HOLO ORB VISUALIZER ENGINE (HTML5 CANVAS) ---
    let rotationAngle = 0;
    let waveOffset = 0;

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.alpha = 1.0;
            this.size = Math.random() * 3 + 1;
            this.color = color;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.02;
        }
        draw(c) {
            c.save();
            c.globalAlpha = this.alpha;
            c.shadowBlur = 10;
            c.shadowColor = this.color;
            c.fillStyle = this.color;
            c.beginPath();
            c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    }

    function renderOrb() {
        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const color = getThemeColor("primary");
        const secColor = getThemeColor("secondary");

        ctx.clearRect(0, 0, width, height);
        
        rotationAngle += 0.01;
        waveOffset += 0.05;

        // Particle generation based on speak state
        if (state.assistantState === "speaking" && Math.random() < 0.4) {
            for (let i = 0; i < 3; i++) {
                state.activeParticles.push(new Particle(cx, cy, color));
            }
        }
        
        // Update and draw particles
        state.activeParticles = state.activeParticles.filter(p => p.alpha > 0);
        state.activeParticles.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        // 1. Draw glowing outer ambient field
        ctx.save();
        const glowRad = 110;
        const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, glowRad);
        
        if (state.assistantState === "alarm") {
            gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
            gradient.addColorStop(1, "rgba(239, 68, 68, 0.0)");
        } else if (state.assistantState === "listening") {
            gradient.addColorStop(0, "rgba(185, 43, 39, 0.35)");
            gradient.addColorStop(1, "rgba(185, 43, 39, 0.0)");
        } else {
            gradient.addColorStop(0, color + "33"); // Hex color alpha
            gradient.addColorStop(1, "rgba(0,0,0,0)");
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Draw rotating holographic ring segments
        ctx.save();
        ctx.translate(cx, cy);
        
        if (state.assistantState === "thinking") {
            ctx.rotate(-rotationAngle * 2.5); // Rapid counter-rotation
        } else {
            ctx.rotate(rotationAngle);
        }
        
        ctx.strokeStyle = state.assistantState === "alarm" ? "#ef4444" : color;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.strokeStyle;
        
        // Draw 3 distinct orbital segments
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 80, i * 2.1, i * 2.1 + 1.4);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Inner circle layer
        ctx.save();
        ctx.translate(cx, cy);
        
        if (state.assistantState === "thinking") {
            ctx.rotate(rotationAngle * 1.8);
            ctx.strokeStyle = secColor;
        } else {
            ctx.rotate(-rotationAngle * 0.5);
            ctx.strokeStyle = color;
        }

        ctx.lineWidth = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = ctx.strokeStyle;
        
        // Draw segmented inner core rings
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 60, i * 1.5, i * 1.5 + 0.9);
            ctx.stroke();
        }
        ctx.restore();

        // 4. Core orb rendering
        ctx.save();
        ctx.beginPath();
        
        let coreRadius = 45;
        
        // Dynamic animations per state
        if (state.assistantState === "listening") {
            // Pulse based on sine wave calculations
            coreRadius = 45 + Math.sin(waveOffset * 3) * 6;
            ctx.fillStyle = "rgba(185, 43, 39, 0.8)";
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#B92B27";
        } else if (state.assistantState === "thinking") {
            // Breathing orb
            coreRadius = 45 + Math.cos(waveOffset * 1.5) * 3;
            ctx.fillStyle = "rgba(234, 0, 255, 0.75)";
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#EA00FF";
        } else if (state.assistantState === "speaking") {
            // Highly reactive voice waves
            coreRadius = 42 + Math.abs(Math.sin(waveOffset * 4)) * 8;
            ctx.fillStyle = "rgba(255, 224, 0, 0.85)";
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FFE000";
        } else if (state.assistantState === "alarm") {
            // Warning flash
            const isFlash = Math.floor(waveOffset * 2.5) % 2 === 0;
            ctx.fillStyle = isFlash ? "rgba(239, 68, 68, 0.9)" : "rgba(13, 17, 39, 0.8)";
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#ef4444";
            coreRadius = 48;
        } else {
            // Breathing Idle state
            coreRadius = 43 + Math.sin(waveOffset * 0.8) * 2;
            ctx.fillStyle = "rgba(13, 17, 39, 0.85)";
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
        }

        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        if (state.assistantState === "idle" || state.assistantState === "alarm") {
            ctx.stroke();
        }
        
        // Render stylized text core when alarm is active
        if (state.assistantState === "alarm") {
            ctx.fillStyle = "#fff";
            ctx.font = "8px 'Orbitron'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("ALARM", cx, cy);
        }
        
        ctx.restore();

        // Repeat frame
        requestAnimationFrame(renderOrb);
    }
    renderOrb();

    // --- STATE SETTERS ---
    function setAssistantState(newState, labelText) {
        state.assistantState = newState;
        sysStatusDesc.innerText = labelText.toUpperCase();
        
        if (newState === "listening") {
            sysStatusBadge.innerText = "LISTENING";
            sysStatusBadge.style.color = "#ec4899";
            sysStatusBadge.style.borderColor = "#ec4899";
            sysStatusBadge.style.boxShadow = "0 0 8px rgba(236, 72, 153, 0.5)";
            voiceWaves.classList.add("active");
        } else if (newState === "thinking") {
            sysStatusBadge.innerText = "COGNITION";
            sysStatusBadge.style.color = "#ea580c";
            sysStatusBadge.style.borderColor = "#ea580c";
            sysStatusBadge.style.boxShadow = "0 0 8px rgba(234, 88, 12, 0.5)";
            voiceWaves.classList.remove("active");
        } else if (newState === "speaking") {
            sysStatusBadge.innerText = "VOCALIZING";
            sysStatusBadge.style.color = "#fbbf24";
            sysStatusBadge.style.borderColor = "#fbbf24";
            sysStatusBadge.style.boxShadow = "0 0 8px rgba(251, 191, 36, 0.5)";
            voiceWaves.classList.add("active");
        } else if (newState === "alarm") {
            sysStatusBadge.innerText = "ALERT";
            sysStatusBadge.style.color = "#ef4444";
            sysStatusBadge.style.borderColor = "#ef4444";
            sysStatusBadge.style.boxShadow = "0 0 8px rgba(239, 68, 68, 0.5)";
            voiceWaves.classList.remove("active");
        } else {
            // Idle
            sysStatusBadge.innerText = "ONLINE";
            sysStatusBadge.style.color = getThemeColor("primary");
            sysStatusBadge.style.borderColor = getThemeColor("primary");
            sysStatusBadge.style.boxShadow = `0 0 8px ${getThemeColor("primary")}88`;
            voiceWaves.classList.remove("active");
        }
    }

    // --- INTEGRATIVE SYNTHETIC AUDIO GENERATOR (WEB AUDIO API FAILSAFE) ---
    function playAlarmSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Loop a high-tech synthesized alert 3 times
            let time = audioCtx.currentTime;
            
            for (let i = 0; i < 4; i++) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                // Classic synth ping frequency sequence
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, time); // A5 note
                osc.frequency.exponentialRampToValueAtTime(1760, time + 0.15);
                
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
                
                osc.start(time);
                osc.stop(time + 0.45);
                
                time += 0.5; // Staggered sequence
            }
        } catch (e) {
            writeLog("audio", "Failed to compile synth wave oscillator nodes: " + e, "error");
        }
    }

    // --- SPEAK METHOD BRIDGES ---
    function speak(text) {
        if (state.engine === "web") {
            // Browser speechSynthesis API
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speaking
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                
                // Prefer clean system voices if possible
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Zira") || v.name.includes("Natural"));
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.onstart = () => {
                    setAssistantState("speaking", "Speaking response");
                    writeLog("speech", `Broadcasting audio: "${text}"`, "success");
                };

                utterance.onend = () => {
                    setAssistantState("idle", "Breathing / Cognitive engine idle");
                };

                utterance.onerror = (e) => {
                    writeLog("speech", "Browser SpeechSynthesis error: " + e.error, "error");
                    setAssistantState("idle", "Breathing / Cognitive engine idle");
                };

                window.speechSynthesis.speak(utterance);
            } else {
                writeLog("speech", "SpeechSynthesis unsupported by browser. Visual logs only.", "warn");
                setAssistantState("idle", "Breathing / Cognitive engine idle");
            }
        } else {
            // Engine is Python
            // Flask backend speaks locally. Python endpoint handles speech concurrently.
            // We just fetch the endpoint to trigger it.
            setAssistantState("speaking", "Vocalizing via host speaker...");
            fetch("/api/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text })
            })
            .then(r => r.json())
            .then(() => {
                // Return to idle after a simulated text length delay
                const delay = Math.max(2000, text.length * 60);
                setTimeout(() => {
                    if (state.assistantState === "speaking") {
                        setAssistantState("idle", "Breathing / Cognitive engine idle");
                    }
                }, delay);
            })
            .catch(err => {
                writeLog("sys", "Failed to trigger native speech engine: " + err, "error");
                setAssistantState("idle", "Breathing / Cognitive engine idle");
            });
        }
    }

    // --- RECOGNITION BRIDGES (WEB SPEECH API) ---
    let browserRecognizer = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        browserRecognizer = new SpeechRec();
        browserRecognizer.continuous = false;
        browserRecognizer.interimResults = false;
        browserRecognizer.lang = 'en-US';

        browserRecognizer.onstart = () => {
            setAssistantState("listening", "Listening to voice input...");
            writeLog("audio", "Capture core active. Recording frequencies...", "info");
        };

        browserRecognizer.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            writeLog("nlp", `Transcribed audio: "${transcript}"`, "success");
            executeCommand(transcript);
        };

        browserRecognizer.onerror = (event) => {
            writeLog("audio", "Voice recording error: " + event.error, "error");
            setAssistantState("idle", "Breathing / Cognitive engine idle");
        };

        browserRecognizer.onend = () => {
            if (state.assistantState === "listening") {
                setAssistantState("idle", "Breathing / Cognitive engine idle");
            }
        };
    }

    function triggerListening() {
        if (state.engine === "web") {
            if (browserRecognizer) {
                try {
                    browserRecognizer.start();
                } catch(e) {
                    writeLog("sys", "Browser recognizer already running.", "warn");
                }
            } else {
                writeLog("sys", "Web Speech API is not supported in this browser.", "error");
                speak("Browser speech recognition is unavailable. Please type your command.");
            }
        } else {
            // Python native engine triggers local microphone
            setAssistantState("listening", "Awaiting native microphone...");
            writeLog("sys", "Triggering host machine physical microphone capture...", "info");

            fetch("/api/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ speak_locally: true })
            })
            .then(res => res.json())
            .then(data => {
                if (data.command_type === "error") {
                    writeLog("audio", "Native capture failed: " + data.response, "error");
                    setAssistantState("idle", "Engine Idle");
                    speak("Native microphone failed. Please switch to Browser audio or type.");
                } else {
                    writeLog("sys", "Speech successfully recognized locally.", "success");
                    handleCommandResult(data);
                }
            })
            .catch(err => {
                writeLog("sys", "Native API communication error: " + err, "error");
                setAssistantState("idle", "Engine Idle");
            });
        }
    }

    // --- COMMAND EXECUTION GATEWAY ---
    function executeCommand(text) {
        setAssistantState("thinking", "Analyzing natural intent...");
        writeLog("nlp", `Processing telemetry stream: "${text}"`, "info");

        fetch("/api/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text,
                speak_locally: (state.engine === "python")
            })
        })
        .then(res => res.json())
        .then(data => {
            handleCommandResult(data);
        })
        .catch(err => {
            writeLog("sys", "Failed to transmit command: " + err, "error");
            setAssistantState("idle", "Breathing / Cognitive engine idle");
        });
    }

    function handleCommandResult(data) {
        writeLog("sys", `NLP matched [${data.command_type.toUpperCase()}] protocol.`, "info");
        
        // Trigger TTS readback
        speak(data.response);

        // Process special widget updates depending on command
        if (data.command_type === "weather" && data.data) {
            updateWeatherUI(data.data);
        } else if (data.command_type === "news" && data.data) {
            updateNewsUI(data.data.articles);
            // Highlight matching category tab
            newsTabs.forEach(tab => {
                if (tab.dataset.category === data.data.category) {
                    tab.classList.add("active");
                } else {
                    tab.classList.remove("active");
                }
            });
        } else if (data.command_type === "reminder" && data.data) {
            fetchReminders();
        }
    }

    // --- WEATHER UI RENDERING ---
    function updateWeatherUI(w) {
        wTemp.innerText = Math.round(w.temp);
        wDesc.innerText = w.weather_desc.toUpperCase();
        wHumidity.innerText = `${w.humidity} %`;
        wWind.innerText = `${w.wind_speed} km/h`;
        wLocBadge.innerText = w.city.split(",")[0].toUpperCase();

        // Select FontAwesome weather icon based on theme string
        let iconHtml = '<i class="fa-solid fa-cloud weather-main-icon"></i>';
        if (w.theme === "sunny") {
            iconHtml = '<i class="fa-solid fa-sun weather-main-icon"></i>';
        } else if (w.theme === "rainy") {
            iconHtml = '<i class="fa-solid fa-cloud-showers-heavy weather-main-icon"></i>';
        } else if (w.theme === "snowy") {
            iconHtml = '<i class="fa-solid fa-snowflake weather-main-icon"></i>';
        } else if (w.theme === "stormy") {
            iconHtml = '<i class="fa-solid fa-cloud-bolt weather-main-icon"></i>';
        }
        wIconContainer.innerHTML = iconHtml;

        // Apply Ambient transition classes to Body
        document.body.className = `theme-${state.theme} weather-${w.theme}`;
        writeLog("weather", `Ambient weather overlay set to: ${w.theme.toUpperCase()}`, "success");
    }

    function fetchWeather(city = "London") {
        fetch(`/api/weather?city=${encodeURIComponent(city)}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) updateWeatherUI(data);
        });
    }

    // --- REMINDERS TELEMETRY LOOP ---
    function formatTime(isoStr) {
        const dt = new Date(isoStr);
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function updateReminderMeters() {
        const cards = document.querySelectorAll(".reminder-card:not(.completed)");
        const now = new Date();
        
        cards.forEach(card => {
            const targetTime = new Date(card.dataset.target);
            const diffSeconds = Math.round((targetTime - now) / 1000);
            
            const badge = card.querySelector(".countdown-val");
            if (diffSeconds > 0) {
                // Print nicely
                if (diffSeconds > 60) {
                    badge.innerText = `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s remaining`;
                } else {
                    badge.innerText = `${diffSeconds}s remaining`;
                }
            } else {
                badge.innerText = "Triggering...";
                card.classList.add("completed");
            }
        });
    }
    setInterval(updateReminderMeters, 1000);

    function fetchReminders() {
        fetch("/api/reminders")
        .then(r => r.json())
        .then(data => {
            state.reminders = data.reminders || [];
            
            if (state.reminders.length === 0) {
                remListContainer.innerHTML = `
                    <div class="no-reminders-msg">
                        <i class="fa-solid fa-bell-slash"></i>
                        <p>No active reminders scheduled</p>
                    </div>`;
                return;
            }

            remListContainer.innerHTML = state.reminders.map(rem => {
                const isCompleted = rem.completed;
                return `
                    <div class="reminder-card ${isCompleted ? 'completed' : ''}" data-target="${rem.target_time}">
                        <div class="rem-info">
                            <span class="rem-title">${rem.title}</span>
                            <div class="rem-meta">
                                <span><i class="fa-solid fa-clock"></i> ${formatTime(rem.target_time)}</span>
                                <span class="countdown-val ${!isCompleted ? 'active' : ''}">${isCompleted ? 'Finished' : 'Calculating...'}</span>
                            </div>
                        </div>
                        <button class="rem-delete-btn" onclick="deleteReminder('${rem.id}')" title="Wipe telemetry">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>`;
            }).join("");
        });
    }

    // Set globally so inline HTML onclick works
    window.deleteReminder = function(id) {
        fetch(`/api/reminders/${id}`, { method: "DELETE" })
        .then(r => r.json())
        .then(() => {
            writeLog("sys", `Reminder wiped from scheduling table.`, "warn");
            fetchReminders();
        });
    };

    // Poll for triggered reminders in the background
    function checkTriggeredReminders() {
        if (state.isAlarmActive) return;

        fetch("/api/reminders/triggered")
        .then(r => r.json())
        .then(data => {
            if (data.triggered && data.triggered.length > 0) {
                const alarm = data.triggered[0];
                activateAlarmState(alarm);
            }
        })
        .catch(err => console.error("Error polling triggered alarms:", err));
    }
    setInterval(checkTriggeredReminders, 2000);

    function activateAlarmState(alarm) {
        state.isAlarmActive = true;
        setAssistantState("alarm", `ALARM TRIGGERED: ${alarm.title}`);
        writeLog("sys", `[ALARM PROTOCOL ACTIVE] Scheduled alert reached: "${alarm.title}"`, "error");

        // Flash Canvas Orb & Play synthetic sound sequence
        playAlarmSound();
        const soundInterval = setInterval(playAlarmSound, 2500);

        // Vocal alert warning
        speak(`Excuse me! This is your scheduled alarm alert to: ${alarm.title}.`);

        // Create overlay prompt
        const alertOverlay = document.createElement("div");
        alertOverlay.className = "alert-trigger-overlay";
        alertOverlay.innerHTML = `
            <div class="alert-modal glass-panel">
                <i class="fa-solid fa-bell-on pulse-alert-icon"></i>
                <h3>COGNITIVE ALARM REPORT</h3>
                <p>"${alarm.title.toUpperCase()}"</p>
                <button class="cyber-btn" id="dismiss-alarm-btn">DISMISS TRANSMISSION</button>
            </div>
        `;
        document.body.appendChild(alertOverlay);

        // Dismiss handler
        const dismissBtn = alertOverlay.querySelector("#dismiss-alarm-btn");
        const dismissAction = () => {
            clearInterval(soundInterval);
            alertOverlay.remove();
            state.isAlarmActive = false;
            setAssistantState("idle", "Breathing / Cognitive engine idle");
            writeLog("sys", "Alarm thread dismissed by user validation.", "info");
            fetchReminders(); // Refresh list to show completed card
        };

        dismissBtn.onclick = dismissAction;
        // Auto-dismiss after 15 seconds to prevent lockups
        setTimeout(() => {
            if (document.body.contains(alertOverlay)) dismissAction();
        }, 15000);
    }

    // --- NEWS AGGREGATOR READER ---
    function updateNewsUI(articles) {
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = '<p class="no-reminders-msg">Failed to pull news feeds.</p>';
            return;
        }

        newsContainer.innerHTML = articles.map(art => `
            <div class="news-card">
                <a href="${art.link}" target="_blank" class="news-title">${art.title}</a>
                <span class="news-desc">${art.description}</span>
                <div class="news-meta">
                    <span><i class="fa-regular fa-clock"></i> ${art.published.replace(" GMT", "")}</span>
                    <a href="${art.link}" target="_blank" style="color: var(--primary-color)"><i class="fa-solid fa-arrow-up-right-from-square"></i> DETS</a>
                </div>
            </div>
        `).join("");
    }

    function fetchNews(category = "general") {
        newsContainer.innerHTML = `
            <div class="news-placeholder">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Decoding channel feeds...</p>
            </div>`;
            
        fetch(`/api/news?category=${category}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                updateNewsUI(data.articles);
            } else {
                newsContainer.innerHTML = `<p class="no-reminders-msg">${data.error}</p>`;
            }
        })
        .catch(err => {
            newsContainer.innerHTML = '<p class="no-reminders-msg">Service Connection Fault.</p>';
        });
    }

    // --- USER EVENT HANDLERS ---

    // Speech activation click
    micBtn.onclick = () => {
        triggerListening();
    };

    // Manual typing instruction submit
    const submitTypedInput = () => {
        const text = manualInput.value.trim();
        if (text) {
            writeLog("term", `Direct console transmission: "${text}"`, "info");
            executeCommand(text);
            manualInput.value = "";
        }
    };
    textSubmit.onclick = submitTypedInput;
    manualInput.onkeydown = (e) => {
        if (e.key === "Enter") submitTypedInput();
    };

    // News Category Tabs Click Handlers
    newsTabs.forEach(tab => {
        tab.onclick = () => {
            newsTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            state.newsCategory = tab.dataset.category;
            fetchNews(state.newsCategory);
            writeLog("sys", `Dispatch Feed channel switched to: ${state.newsCategory.toUpperCase()}`, "info");
        };
    });

    // Reminder Form Toggles
    addRemBtn.onclick = () => {
        remFormBox.classList.toggle("collapsed");
    };

    remCancel.onclick = () => {
        remFormBox.classList.add("collapsed");
        remTitleInput.value = "";
        remSecInput.value = "";
    };

    remSubmit.onclick = () => {
        const title = remTitleInput.value.trim();
        const seconds = parseInt(remSecInput.value);

        if (!title || isNaN(seconds) || seconds <= 0) {
            writeLog("sys", "Failed scheduling: invalid telemetry details.", "warn");
            return;
        }

        fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title, seconds: seconds })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                writeLog("sys", `New telemetry alarm scheduled: "${title}" in ${seconds}s.`, "success");
                remFormBox.classList.add("collapsed");
                remTitleInput.value = "";
                remSecInput.value = "";
                fetchReminders();
            } else {
                writeLog("sys", `Failed adding alarm: ${data.error}`, "error");
            }
        });
    };

    // Engine Selection Change (Local PyAudio missing handler warnings)
    engineSelect.onchange = (e) => {
        state.engine = e.target.value;
        writeLog("sys", `Vocal processing path swapped to: ${state.engine.toUpperCase()}`, "warn");
        if (state.engine === "python") {
            writeLog("sys", `Notice: Host machine needs PyAudio module, or speech transcription will error.`, "system");
        }
    };

    // Color Theme Selector
    themeSelect.onchange = (e) => {
        const newTheme = e.target.value;
        document.body.classList.remove(`theme-${state.theme}`);
        state.theme = newTheme;
        document.body.classList.add(`theme-${state.theme}`);
        writeLog("sys", `Dashboard visual skins configured to theme: ${state.theme.toUpperCase()}`, "success");
    };

    // --- SYSTEM BOOT BOOTSTRAP INITIALIZATION ---
    function initializeAssistant() {
        writeLog("boot", "Running cybernetic subsystem self-check...", "system");
        
        // Warm up and verify Web Speech API compatibility
        if (browserRecognizer) {
            writeLog("boot", "Google Web Speech API bridge detected.", "success");
        } else {
            writeLog("boot", "Failsafe browser Web Speech API absent. Keyboard console direct entry required.", "warn");
        }

        // Fetch initial telemetry panels
        fetchWeather("London");
        fetchReminders();
        fetchNews("general");

        writeLog("boot", "Subsystems initialized successfully. Neural cognitive core status: ONLINE.", "success");
    }

    initializeAssistant();
});
