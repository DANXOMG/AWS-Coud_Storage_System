#!/usr/bin/python3

# Ejeuctor del motor principal de analizador de antivirus, realiza una llamada a los objetos de análisis y comprobación del módulo
# El principal flujo del programa en cuanto detecta inserción de archivos es este script

from analyzer import Analyzer

# Variables globales

# Colores ANSI
yellow = "\u001b[33m"
red = "\u001b[31m"
green = "\u001b[32m"
close_color = "\u001b[0m"

def detection(client, file_analyze):
    # Nombro clase
    analyzer = Analyzer()

    # Bucle analizador
    while client:
        print(f"{green}[+] Interacción por parte de cliente{close_color} {client} {yellow}detectada{close_color} (Archivo {client})...")

        # Empezar a analizar de forma general primero
        if analyzer.main_method(file_analyze, ) == True:
            print(f"{green}[+] El binario o fichero especificado es correcto, lanzando a {yellow}S3{close_color}{close_color}")

        # NO ACABADO (GENERAR ANALISIS)
        else:
            
