import json
import os
import time
import uuid
import logging
from datetime import datetime, timedelta
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REMINDERS_FILE = os.path.join(os.path.dirname(__file__), "reminders.json")

class ReminderManager:
    def __init__(self):
        self.reminders = []
        self.lock = threading.Lock()
        self.triggered_ids = set() # Store recently triggered ids for frontend to fetch
        self.load_reminders()
        
        # Start background check thread
        self.stop_event = threading.Event()
        self.worker_thread = threading.Thread(target=self._check_loop, daemon=True)
        self.worker_thread.start()
        logger.info("Reminder background thread started.")

    def load_reminders(self):
        with self.lock:
            if os.path.exists(REMINDERS_FILE):
                try:
                    with open(REMINDERS_FILE, "r") as f:
                        self.reminders = json.load(f)
                    logger.info(f"Loaded {len(self.reminders)} reminders from file.")
                except Exception as e:
                    logger.error(f"Error reading reminders file: {e}")
                    self.reminders = []
            else:
                self.reminders = []

    def save_reminders(self):
        try:
            with open(REMINDERS_FILE, "w") as f:
                json.dump(self.reminders, f, indent=4)
        except Exception as e:
            logger.error(f"Error saving reminders file: {e}")

    def add_reminder_absolute(self, title: str, target_dt: datetime) -> dict:
        """Adds a reminder at an absolute datetime."""
        with self.lock:
            reminder_id = str(uuid.uuid4())
            reminder = {
                "id": reminder_id,
                "title": title.strip(),
                "target_time": target_dt.isoformat(),
                "completed": False,
                "created_at": datetime.now().isoformat()
            }
            self.reminders.append(reminder)
            self.save_reminders()
            logger.info(f"Reminder added: '{title}' set for {target_dt}")
            return reminder

    def add_reminder_relative(self, title: str, seconds: int) -> dict:
        """Adds a reminder relative to the current time (in X seconds)."""
        target_dt = datetime.now() + timedelta(seconds=seconds)
        return self.add_reminder_absolute(title, target_dt)

    def delete_reminder(self, reminder_id: str) -> bool:
        """Deletes a reminder by ID."""
        with self.lock:
            initial_len = len(self.reminders)
            self.reminders = [r for r in self.reminders if r["id"] != reminder_id]
            self.save_reminders()
            deleted = len(self.reminders) < initial_len
            if deleted:
                logger.info(f"Reminder deleted: {reminder_id}")
            return deleted

    def get_all_reminders(self) -> list:
        """Returns all reminders, sorted by target time."""
        with self.lock:
            # Return a copy to avoid multithreading race condition issues
            return sorted(self.reminders, key=lambda x: x["target_time"])

    def get_active_reminders(self) -> list:
        """Returns incomplete reminders."""
        with self.lock:
            return [r for r in self.reminders if not r["completed"]]

    def pop_triggered_reminders(self) -> list:
        """Retrieves and clears recently triggered reminders list for API consumption."""
        with self.lock:
            triggered = []
            for r in self.reminders:
                if r["id"] in self.triggered_ids:
                    triggered.append(r)
            self.triggered_ids.clear()
            return triggered

    def _check_loop(self):
        """Background loop executing every second to check for triggered reminders."""
        while not self.stop_event.is_set():
            now = datetime.now()
            with self.lock:
                changed = False
                for r in self.reminders:
                    if not r["completed"]:
                        try:
                            target_dt = datetime.fromisoformat(r["target_time"])
                            if now >= target_dt:
                                r["completed"] = True
                                self.triggered_ids.add(r["id"])
                                changed = True
                                logger.info(f"[ALARM] Reminder triggered: '{r['title']}'!")
                        except Exception as e:
                            logger.error(f"Error parsing reminder time in background loop: {e}")
                
                if changed:
                    self.save_reminders()
            
            # Rest for a tiny bit
            time.sleep(1)

    def shutdown(self):
        """Clean shutdown of background thread."""
        self.stop_event.set()
        self.worker_thread.join()

# Global reminder manager instance
reminder_manager = ReminderManager()

if __name__ == "__main__":
    # Test setting a reminder for 5 seconds from now
    print("Setting 5-second test reminder...")
    reminder_manager.add_reminder_relative("Test alarm", 5)
    
    # Wait to see if it triggers in log
    for _ in range(7):
        time.sleep(1)
        triggered = reminder_manager.pop_triggered_reminders()
        if triggered:
            print("Triggered reminders:", triggered)
    
    reminder_manager.shutdown()
