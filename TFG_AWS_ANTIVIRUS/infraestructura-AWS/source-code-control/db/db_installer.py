#!/usr/bin/python3
import time
import setup_sql
import subprocess

class InstallerDB:
    def __init__(self):
        self.installed = False

    def is_mysql_or_mariadb_running(self):
        """Comprueba si MySQL/MariaDB está activo."""
        services = ["mysql", "mariadb"]
        for service in services:
            try:
                result = subprocess.run(
                    ["systemctl", "is-active", "--quiet", service],
                    check=False
                )
                if result.returncode == 0:
                    return True
            except FileNotFoundError:
                pass

        # Fallback: intentar conexión directa
        try:
            conn = setup_sql.get_root_connection()
            if conn:
                conn.close()
                return True
        except Exception as e:
            print(f"[!] Error al intentar conexión directa: {e}")
            return False

        return False

    def decision_user(self):
        decision = input("Desea generar una copia en MySQL de las firmas de los archivos? (si/no): ")
        if decision.lower() == "si":
            print("[*] Iniciando instalación de la base de datos...")
            if self.is_mysql_or_mariadb_running():
                try:
                    self.installed = setup_sql.setup_database()
                    if self.installed:
                        print("[+] Base de datos configurada correctamente.")
                    else:
                        print("[!] Fallo al configurar la base de datos.")
                    return self.installed
                except Exception as e:
                    print(f"[!] Error al configurar la base de datos: {e}")
                    return False
            else:
                print("[!] El servicio de MySQL/MariaDB no está activo.")
                return False
        elif decision.lower() == "no":
            print("[*] Se omitirá la instalación de la base de datos.")
            return False
        else:
            print("[!] Opción no válida, cerrando instalador...")
            time.sleep(3)
            exit(1)

if __name__ == "__main__":
    installer = InstallerDB()
    result = installer.decision_user()
    print(f"Resultado: {result}")
