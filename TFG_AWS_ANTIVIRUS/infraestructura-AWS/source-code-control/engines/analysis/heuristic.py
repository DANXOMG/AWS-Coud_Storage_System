#!/usr/bin/python3
import re
import math
from collections import Counter

# Creación de un analizador heurísitico, en caso de que la búsqueda de firmas falle, queremos encontrar patrones en cadenas (como ofuscaciones)

class Heuristic:    
    SUSPICIOUS_KEYWORDS = [
        # Redes / comunicación remota
        "nc", "netcat", "bash -i", "bash -c", "curl", "wget", "ftp", "scp", "telnet", "ssh", "perl -e", "python -c", "python3 -c",
        # Eliminación / manipulación de archivos
        "rm -rf", "chmod 777", "chown", "mv", "unlink", "dd if=", "mkfs", "mount", "umount",
        # Ejecución de comandos
        "system", "exec", "popen", "eval", "sh -c", "sudo", "su", "cron", "at", "kill", "pkill",
        # Compresión / cifrado / ofuscación
        "gzip", "tar", "openssl", "aes", "xor", "base64", "crypt", "zlib", "bzip2",
        # Scripts o herramientas comunes de hacking
        "msfconsole", "metasploit", "python3 -m http.server", "php -S", "nc -l", "nc -e",
        # Persistencia / autoarranque
        ".bashrc", ".profile", ".ssh/authorized_keys", "rc.local", "systemd", "init.d", "cron.d"
    ]


    def __init__(self, filepath):
        self.filepath = filepath
        self.data = self._read_file(filepath)   
        # Aqui quiero mencionar la variable

    # Lee los archivos en binario y los convierte en bloques
    def _read_file(self, filepath):
        try:
            with open(filepath, "rb") as f:
                return f.read()
        except Exception as e:
            print(f"[!] El archivo {filepath} no existe o no se puede leer: {e}")
            return b""
        

    # Cálculo del valor de la entropía para posteriormente ser analizada (TODO EN BLOQUES, DEBIDO A QUE LA ENTROPÍA SE VERIFICA CON BLOQUES)
    def shannon_entropy_method(self):
        data = self.data

        if not data:
            return 0.0
        
        counts = Counter(data)   
        length = len(data)
        entr = -sum((cnt/length) * math.log2(cnt/length) for cnt in counts.values())
        return entr
    
    # Analizador de la aletoriedad calculada (RECIBE COMO VALOR, LO QUE RETORNA shannon_entropy_method)
    def shannon_entropy(self):
        entr = self.shannon_entropy_method()
        if entr <= 1.5:
            msg = "El binario posiblemente no contenga cadenas ofuscadas (SEGÚN LA ENTROPÍA!!)"
        elif entr <= 2.5:
            msg = "El binario posiblemente contenga código compilado sin cifrar (SEGÚN LA ENTROPÍA!!)"
        else:
            msg = "El binario posiblemente contenga cadenas cifradas u ofuscadas (SEGÚN LA ENTROPÍA!!)"
        return entr, msg


    # Extrae las cadenas sospechosas  o legibles
    def extract_strings(self, min_len: int = 4):
        if not self.data:
            return []
        pattern = rb'[\x20-\x7E]{' + str(min_len).encode() + rb',}'
        raw = re.findall(pattern, self.data)
        return [s.decode('utf-8', errors='ignore') for s in raw]

    # Analizador de las cadenas sospechosas, sin analizar coincidencias parciales
    def suspect_chains(self, min_kw_len: int = 3):
    
        strings = self.extract_strings(min_len=4)
        if not strings:
            return []

        lower_strings = [s.lower() for s in strings]
        findings = []

        for kw in self.SUSPICIOUS_KEYWORDS:
            if len(kw.strip()) < min_kw_len:
                # Ignoramos keywords demasiado cortas (evita falsos positivos)
                continue
            kw_esc = re.escape(kw.lower())
            # Lookarounds para evitar casamientos dentro de palabras/identificadores
            pattern = re.compile(r'(?<![A-Za-z0-9_])' + kw_esc + r'(?![A-Za-z0-9_])', re.I)
            for idx, s in enumerate(lower_strings):
                if pattern.search(s):
                    findings.append((kw, idx, strings[idx]))  # guardamos contexto no-lower

        return findings

    # Función principal de Heuristic (Ejecuta todos los métodos para analizar en AWS)
    def main_heuristic_chains(self, filepath):
        print(f"[+] Ejecutando reconocimiento por cadenas encontradas...")
        binary = self._read_file(filepath)
        results = False

        if not binary:
            print(f"[!] No ha recibido binario correctamente para analizar")
        else:
            print(f"[+] Analizando binario o fichero {filepath}...")
            found = self.suspect_chains()

            if found:
                print("[+] Cadenas sospechosas encontradas:")
                for kw, idx, ctx in found:
                    print(f"    → {kw}  (string #{idx}): {ctx}")
            else:
                print("[-] No se han encontrado coincidencias sospechosas")

        # Ejecución de shannon
        print(f"[+] Ejecutando reconocimiento heurístico (Cálculo de entropía)...")
        ent, message = self.shannon_entropy() 

        print(f"[+] La entropía calculada es de {ent:.4f} -> {message}")
        return {"suspicious": found, "entropy": ent, "entropy_msg": message}
