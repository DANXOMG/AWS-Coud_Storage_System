#!/usr/bin/python3
import hashlib
import re

# ---------- Explicación del motor ---------- #
# Comprueba con la base de datos con firmas, 
# examina las firmas internas para saber si es malicioso
# Está directamente relacionado con el swipper.py, el cual reconoce los archivos binarios del sistema, y detecta peligros

# ---------- Motor de firmas (POO) --------- #

class Firms(object):
    def __init__(self, db_cursor): 
        self.cursor = db_cursor  # Cursor para la base de datos 


    # ------------- MÉTODOS ------------ #

    # -------- CÁLCULO DEL HASH DE CADA ARCHIVO --------- # 
    def hash_calc(self, route):
        sha256 = hashlib.sha256()

        try:
            # Abrimos el archivo en modo binario (En binario, se hará la lectura completa de los bloques)
            with open(route, "rb") as f:
                # Lectura del archivo en bloques (Evitar sobrecargas del sistema de memoria)
                for bloque in iter(lambda: f.read(4096), b""):
                    sha256.update(bloque)   # Actualización del hash por cada bloque
            return sha256.hexdigest()   # Devolver el hash en formato hexadecimal 
    
        except:
            # En caso de no poder por permisos u otras cuestiones, retornar None
            return None

    # -------- ANALIZAR POR HASH (SE ENCARGA DE RECOPILAR LA INFO DE LA BASE DE DATOS, SE LA PASA A ANALYZER) ------- #
    def analisys_hash(self, route):
        file_hash = self.hash_calc(route)

        if not file_hash:
            return None

        self.cursor.execute(
            "SELECT malicious_name, description, risk_level FROM malware_info WHERE firm=%s", (file_hash,)
        )

        result = self.cursor.fetchone()

        if result:
            return {
                "Name": result[0],
                "Route": route,
                "Risk Level": self.risk_converter(result[2]),
                "Description": result[1]
            }
        return None
    
    # Patrones de firmas (NO ACABADO)
    def analisys_patterns(self, route):
        try:
            with open(route, "r", errors="ignore") as f:
                content = f.read()
        
        except:
            return None
        
        self.cursor.execute(
            "SELECT malicious_name, description, risk_level FROM firms WHERE tipo='pattern'"
        )

        firms = self.cursor.fetchall()

        for malicious_name, description, level in firms:
            if re.search(content):
                return {
                    "Name": malicious_name,
                    "Route": route,
                    "Risk Level": self.risk_converter(level),
                    "Description": description
                }
        return None

