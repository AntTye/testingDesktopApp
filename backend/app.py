from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi import HTTPException
from fastapi.responses import PlainTextResponse
from pathlib import Path
from pydantic import BaseModel
import sys
import os

app = FastAPI()

userNotesDir = (Path(__file__).parent.parent.resolve() / "frontend" / "userNotes")

class CreateNoteRequest(BaseModel):
    filename: str

class SaveNoteRequest(BaseModel):
    filename: str
    content: str

class DeleteNoteRequest(BaseModel):
    filename: str

@app.get("/api/getNoteFiles")
def get_note_files():
    return [f.name for f in userNotesDir.glob("*.txt")]

@app.get("/api/getNoteContent", response_class=PlainTextResponse)
def get_note_content(filename: str):
    file_path = userNotesDir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return file_path.read_text(encoding="utf-8")

@app.post("/api/createNoteFile")
def create_note_file(req: CreateNoteRequest):
    safe_name = req.filename.strip()

    if not safe_name:
        raise HTTPException(status_code=400, detail="Filename required")

    if not safe_name.endswith(".txt"):
        safe_name += ".txt"

    path = userNotesDir / safe_name

    if path.exists():
        raise HTTPException(status_code=409, detail="File already exists")

    path.write_text("", encoding="utf-8")

    return {"filename": safe_name}

@app.post("/api/saveNote")
def save_note(req: SaveNoteRequest):
    path = userNotesDir / req.filename

    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    path.write_text(req.content, encoding="utf-8")
    return {"status": "saved"}

@app.post("/api/deleteNote")
def delete_note(req: DeleteNoteRequest):
    path = userNotesDir / req.filename

    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    path.unlink()  # deletes the file
    return {"status": "deleted"}

def get_frontend_dir() -> str:
    if hasattr(sys, "_MEIPASS"):        # When running from a PyInstaller bundle, sys._MEIPASS is the temp dir.
        base_path = Path(sys._MEIPASS)
    else:
        base_path = Path(__file__).resolve().parent.parent
    return str(base_path / "frontend")

frontend_dir = get_frontend_dir()

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")
