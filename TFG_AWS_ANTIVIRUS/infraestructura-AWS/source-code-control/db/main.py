#!/usr/bin/python3

# SCRIPT AUTOMATICO INSTALADOR DE BASE DE DATOS
# Consta de 2 scripts:
#   setup_sql.py    --> Creación de las tablas y el usuario en la base de datos
#   db_installer.py --> Inserción y comprobación de requisitos mínimos para la instalación

from db_installer import InstallerDB
import setup_sql
import time

# VARIABLES GLOBALES
# Colores ANSI
green = "\033[92m"
red = "\033[91m"  # Mejor usar 91 para rojo brillante
yellow = "\033[93m"
close_color = "\033[0m"


def installer():
    # Instanciar la clase InstallerDB
    installerdb = InstallerDB()

    print(f"{green}[+] Bienvenido al instalador de la base de datos de firmas del antivirus ConTrol, creando secuencias de inicio...{close_color}")
    time.sleep(2)
    print(f"{green}[+] Se va a ejecutar la secuencia de creación de la base de datos...{close_color}")
    time.sleep(1)

    # Llamada al método que pregunta al usuario y ejecuta la instalación
    decision = installerdb.decision_user()

    if not decision:
        print(f"{red}[!] La instalación ha tenido errores, ¡NO COMPLETADA!{close_color}")
    else:
        print(f"{green}[+] Base de datos instalada correctamente.{close_color}")


# === EJECUCIÓN PRINCIPAL ===
if __name__ == "__main__":
    installer()
