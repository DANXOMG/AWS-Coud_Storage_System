from flask import Flask, request, jsonify, render_template, send_from_directory
import uuid
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

# RUTA CORRECTA: carpeta 'uploads' en la raíz del proyecto
BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Historial global (máximo 50 entradas)
analysis_history = []

@app.route('/')
def index():
    return render_template('index.html', history=analysis_history)

@app.route('/upload', methods=['POST'])
def upload_file():
    global analysis_history

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    cliente = request.form.get('cliente', 'Anónimo').strip()
    if not cliente:
        cliente = 'Anónimo'
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # ID único de sesión
    session_id = str(uuid.uuid4())[:8]
    session_dir = UPLOAD_FOLDER / session_id
    session_dir.mkdir(exist_ok=True)

    # Nombre seguro del archivo
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_filename = f"{cliente}__{timestamp}__{file.filename}"
    filepath = session_dir / safe_filename
    file.save(filepath)

    print(f"[+] Subido: {safe_filename} → {session_id}")

    # Análisis del archivo
    size = filepath.stat().st_size
    with open(filepath, 'rb') as f:
        sample = f.read(512)
        try:
            preview = sample.decode('utf-8', errors='ignore').strip()
            tipo = "texto"
        except:
            preview = f"[BINARIO: {len(sample)} bytes]"
            tipo = "binario"

    # Entrada en historial
    entry = {
        "id": session_id,
        "cliente": cliente,
        "archivo": safe_filename,
        "fecha": datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        "tamano": round(size / 1024, 2),
        "tipo": tipo,
        "preview": (preview[:100] + "...") if len(preview) > 100 else preview
    }
    analysis_history.append(entry)
    if len(analysis_history) > 50:
        analysis_history.pop(0)  # FIFO

    return jsonify({
        "success": True,
        "session_id": session_id,
        "resultado": {
            "tamaño_kb": round(size / 1024, 2),
            "tipo": tipo,
            "vista_previa": entry["preview"]
        }
    })

# RUTA DE DESCARGA (opcional pero útil)
@app.route('/download/<session_id>/<filename>')
def download_file(session_id, filename):
    file_path = UPLOAD_FOLDER / session_id / filename
    if file_path.exists():
        return send_from_directory(file_path.parent, filename, as_attachment=True)
    return "Archivo no encontrado", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)