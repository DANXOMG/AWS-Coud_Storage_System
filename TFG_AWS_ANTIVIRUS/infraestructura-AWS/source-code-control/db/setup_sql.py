#!/usr/bin/python3

# CONFIGURACION AUTOMATICA EN SERVER CON EJECUCION DE main.py
import mysql.connector
from mysql.connector import errorcode
from cryptography.fernet import Fernet
import json
import os
import secrets
import string

def generate_password(length=20):
    """Genera una contraseña aleatoria segura, evitando caracteres problemáticos."""
    chars = string.ascii_letters + string.digits + "!#$%&()*+,-.:;<=>?@[]^_{|}~"
    return ''.join(secrets.choice(chars) for _ in range(length))

def get_root_connection():
    """Intenta conectar a MySQL/MariaDB como root usando unix_socket."""
    print("[*] Intentando conectar como root@localhost usando unix_socket...")
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            unix_socket="/var/run/mysqld/mysqld.sock",  # Especificar el socket Unix explícitamente
            raise_on_warnings=False  # Desactivar advertencias como excepciones
        )
        print("[+] Conexión exitosa como root@localhost (unix_socket).")
        return conn
    except mysql.connector.Error as err:
        print(f"[ERROR] No se pudo conectar a MySQL/MariaDB: {err}, errno: {err.errno}")
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("[!] Acceso denegado. Asegúrate de que root@localhost usa unix_socket y el script se ejecuta con sudo.")
        return None

def user_exists(cursor, user, host):
    """Verifica si un usuario existe en la base de datos."""
    try:
        cursor.execute("SELECT COUNT(*) FROM mysql.user WHERE User = %s AND Host = %s;", (user, host))
        return cursor.fetchone()[0] > 0
    except mysql.connector.Error as err:
        print(f"[ERROR] Error al verificar si el usuario existe: {err}")
        return False

def database_exists(cursor, database_name):
    """Verifica si una base de datos existe."""
    try:
        cursor.execute("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = %s;", (database_name,))
        return cursor.fetchone()[0] > 0
    except mysql.connector.Error as err:
        print(f"[ERROR] Error al verificar si la base de datos existe: {err}")
        return False

def setup_database():
    """Configura la base de datos y el usuario."""
    try:
        # Conectar como root
        conn = get_root_connection()
        if not conn:
            print("[ERROR] Fallo al conectar como root. Abortando configuración.")
            return False
        cursor = conn.cursor()

        # Verificar si la base de datos existe
        if database_exists(cursor, "malware_db"):
            print("[*] La base de datos 'malware_db' ya existe, continuando...")
        else:
            cursor.execute("CREATE DATABASE malware_db;")
            print("[+] Base de datos 'malware_db' creada exitosamente.")

        cursor.execute("USE malware_db;")

        # Crear tabla si no existe
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS malware_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firm VARCHAR(256) NOT NULL,
                malicious_name VARCHAR(256),
                description TEXT,
                risk_level VARCHAR(50)
            );
        """)
        print("[+] Tabla 'malware_info' configurada exitosamente.")

        # Crear usuario seguro
        user = "tfg_user"
        password = generate_password()

        # Verificar si el usuario existe antes de intentar eliminarlo
        if user_exists(cursor, user, 'localhost'):
            try:
                cursor.execute("DROP USER %s@%s;", (user, 'localhost'))
                print("[+] Usuario 'tfg_user'@'localhost' eliminado exitosamente.")
            except mysql.connector.Error as err:
                print(f"[WARNING] No se pudo eliminar el usuario 'tfg_user'@'localhost': {err}")
                # Continuar a pesar del error
        else:
            print("[*] El usuario 'tfg_user'@'localhost' no existe, omitiendo eliminación.")

        # Crear usuario y otorgar privilegios
        cursor.execute("CREATE USER %s@%s IDENTIFIED BY %s;", (user, 'localhost', password))
        cursor.execute("GRANT ALL PRIVILEGES ON malware_db.* TO %s@%s;", (user, 'localhost'))
        cursor.execute("FLUSH PRIVILEGES;")
        print("[+] Usuario 'tfg_user'@'localhost' creado y configurado exitosamente.")

        # Guardar contraseña encriptada en config.json
        key = Fernet.generate_key()
        cipher = Fernet(key)
        encrypted_password = cipher.encrypt(password.encode()).decode()

        os.makedirs("db/.pass", exist_ok=True)

        with open("db/.pass/secret.key", "wb") as key_file:
            key_file.write(key)

        with open("db/.pass/config.json", "w") as f:
            json.dump({"user": user, "password": encrypted_password}, f)

        conn.commit()
        cursor.close()
        conn.close()

        print("[+] Base de datos y usuario configurados correctamente.")
        return True

    except mysql.connector.Error as err:
        print(f"[ERROR] Error al configurar la base de datos: {err}")
        return False

if __name__ == "__main__":
    result = setup_database()
    print(result)
