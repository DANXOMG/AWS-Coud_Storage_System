import math
import re

# Tipos MIME que no deben analizarse heurísticamente por tener entropía alta por naturaleza
SKIP_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico',
    'mp4', 'mp3', 'wav', 'avi', 'mov', 'mkv',
    'zip', 'gz', 'tar', 'rar', '7z',
    'docx', 'xlsx', 'pptx', 'odt', 'ods',
    'pdf'
}

SUSPICIOUS_KEYWORDS = [
    (r'\beval\s*\(', 'eval()'),
    (r'base64_decode', 'base64_decode'),
    (r'exec\s*\(', 'exec()'),
    (r'shell_exec', 'shell_exec'),
    (r'system\s*\(', 'system()'),
    (r'passthru', 'passthru'),
    (r'nc\s+-e', 'nc -e (reverse shell)'),
    (r'rm\s+-rf\s+/', 'rm -rf /'),
    (r'/bin/sh', '/bin/sh'),
    (r'/bin/bash', '/bin/bash'),
    (r'chmod\s+[0-7]{3,4}', 'chmod'),
    (r'wget\s+http', 'wget http'),
    (r'curl\s+http.*\|\s*sh', 'curl pipe sh'),
]

class Heuristic:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.extension = filepath.rsplit('.', 1)[-1].lower() if '.' in filepath else ''

    def should_skip(self) -> bool:
        return self.extension in SKIP_EXTENSIONS

    def shannon_entropy(self):
        if self.should_skip():
            return 0.0, "Formato conocido — análisis heurístico omitido"
        try:
            with open(self.filepath, 'rb') as f:
                data = f.read()
            if not data:
                return 0.0, "Archivo vacío"
            freq = {}
            for b in data:
                freq[b] = freq.get(b, 0) + 1
            entropy = -sum((c/len(data)) * math.log2(c/len(data)) for c in freq.values())
            if entropy > 7.5:
                msg = "El binario posiblemente contenga cadenas cifradas u ofuscadas (SEGÚN LA ENTROPÍA!!)"
            else:
                msg = "El binario posiblemente no contenga cadenas ofuscadas (SEGÚN LA ENTROPÍA!!)"
            return entropy, msg
        except Exception as e:
            return 0.0, f"Error al calcular entropía: {e}"

    def suspect_chains(self):
        if self.should_skip():
            return []
        try:
            with open(self.filepath, 'r', errors='ignore') as f:
                content = f.read()
            found = []
            for pattern, label in SUSPICIOUS_KEYWORDS:
                if re.search(pattern, content, re.IGNORECASE):
                    found.append((label, pattern))
            return found
        except Exception:
            return []
