#!/usr/bin/python3
import mysql.connector
import os

def setup_database():
    print("[*] Conectando a MariaDB como root...")
    try:
        conn = mysql.connector.connect(
            host="127.0.0.1",
            port=3306,
            user="root",
            password="",
            auth_plugin="mysql_native_password"
        )
        cursor = conn.cursor()

        cursor.execute("CREATE DATABASE IF NOT EXISTS malware_db;")
        cursor.execute("USE malware_db;")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS malware_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firm VARCHAR(256) NOT NULL,
                malicious_name VARCHAR(256),
                description TEXT,
                risk_level VARCHAR(50)
            );
        """)
        print("[+] DB y tabla listas.")

        sql_file = "hashdb.sql"
        if os.path.exists(sql_file):
            print(f"[*] Cargando firmas desde {sql_file}...")
            with open(sql_file, 'r', encoding='utf-8') as f:
                for cmd in f.read().split(';'):
                    cmd = cmd.strip()
                    if cmd:
                        try:
                            cursor.execute(cmd)
                        except Exception:
                            pass
            print("[+] Firmas cargadas.")
        else:
            print("[!] hashdb.sql no encontrado, omitiendo firmas.")

        conn.commit()
        cursor.close()
        conn.close()
        print("[+] Setup completado.")
        return True

    except Exception as e:
        print(f"[ERROR] {e}")
        return False

if __name__ == "__main__":
    setup_database()
