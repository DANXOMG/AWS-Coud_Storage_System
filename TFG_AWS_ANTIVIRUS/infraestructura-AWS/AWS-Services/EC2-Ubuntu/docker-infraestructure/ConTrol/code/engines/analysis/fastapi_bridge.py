import os
import uuid
import mysql.connector
from fastapi import FastAPI, UploadFile, File, HTTPException

try:
    from analyzer import Analyzer
except ImportError:
    from engines.analysis.analyzer import Analyzer

app = FastAPI()
QUARANTINE_PATH = "/tmp/quarantine/"

def get_db_connection():
    try:
        return mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="",
            database="malware_db",
            auth_plugin='mysql_native_password'
        )
    except Exception as e:
        print(f"Error conexión DB: {e}")
        return None

@app.post("/scan")
async def scan_file(file: UploadFile = File(...)):
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    req_id = str(uuid.uuid4())
    os.makedirs(QUARANTINE_PATH, exist_ok=True)
    file_path = os.path.join(QUARANTINE_PATH, f"{req_id}_{file.filename}")

    try:
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        strings_data = content.decode('utf-8', errors='ignore')

        # Pasamos la conexión, no el cursor
        engine = Analyzer(db)
        es_seguro, resultados = engine.main_method(file_path, strings_data)
        db.close()

        status = "CLEAN" if es_seguro else "MALWARE_DETECTED"
        return {
            "status": status,
            "file": file.filename,
            "analysis": resultados
        }
    except Exception as e:
        print(f"[ERROR Scan]: {e}")
        raise HTTPException(status_code=500, detail=f"Error durante el análisis: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
