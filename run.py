import os
import sys
import subprocess
import signal
import time

# Reference paths relative to root directory
BACKEND_COMMAND = [
    os.path.join("venv", "Scripts", "python"),
    "-m", "uvicorn", "backend.main:app",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--reload"
]

FRONTEND_COMMAND = ["npm", "run", "dev"]
FRONTEND_CWD = "frontend"

processes = []


def terminate_all_processes(sig, frame):
    print("\n[Orchestrator] Shutting down backend and frontend systems...")
    for proc in processes:
        try:
            # Kill subprocess tree (Windows support)
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                proc.terminate()
        except Exception:
            pass
    print("[Orchestrator] Gracefully stopped all workers.")
    sys.exit(0)


def start_orchestrator():
    # Register termination signals
    signal.signal(signal.SIGINT, terminate_all_processes)
    signal.signal(signal.SIGTERM, terminate_all_processes)

    print("==============================================================")
    print("      ENTERPRISE AI DOCUMENT INTELLIGENCE RUNNER SYSTEM       ")
    print("==============================================================")
    
    # 1. Start Backend FastAPI server
    print("\n[Orchestrator] Launching Uvicorn FastAPI Backend...")
    try:
        backend_proc = subprocess.Popen(
            BACKEND_COMMAND,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(backend_proc)
    except Exception as e:
        print(f"[Orchestrator] Failed to start backend: {e}")
        sys.exit(1)

    # Give backend a moment to bind ports
    time.sleep(2)

    # 2. Start Frontend React Vite dev server
    print("\n[Orchestrator] Launching React Vite Frontend Dev Server...")
    try:
        # Use shell=True for windows to locate npm properly in the path environment
        frontend_proc = subprocess.Popen(
            FRONTEND_COMMAND,
            cwd=FRONTEND_CWD,
            stdout=sys.stdout,
            stderr=sys.stderr,
            shell=True
        )
        processes.append(frontend_proc)
    except Exception as e:
        print(f"[Orchestrator] Failed to start frontend: {e}")
        terminate_all_processes(None, None)

    print("\n[Orchestrator] Both servers started successfully.")
    print(" - Backend API running at: http://127.0.0.1:8000")
    print(" - Frontend SPA running at: http://localhost:5173 (usually)")
    print("Press Ctrl+C to terminate both servers.")

    # Keep orchestrator alive checking active child status
    while True:
        try:
            time.sleep(1)
            # Check if any process exited unexpectedly
            for proc in processes:
                if proc.poll() is not None:
                    print(f"\n[Orchestrator] Subprocess {proc.pid} terminated. Cleaning up...")
                    terminate_all_processes(None, None)
        except (KeyboardInterrupt, SystemExit):
            terminate_all_processes(None, None)


if __name__ == "__main__":
    start_orchestrator()
