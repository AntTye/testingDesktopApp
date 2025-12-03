import threading
import webview
import uvicorn
from backend.app import app

def start_api():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    t = threading.Thread(target=start_api, daemon=True)
    t.start()
    webview.create_window("Study Helper", "http://127.0.0.1:8000")
    webview.start()
