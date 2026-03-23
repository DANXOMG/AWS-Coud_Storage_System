#!/usr/bin/python3

from firms import Firms
from heuristic import Heuristic
import os


class Analyzer(object):

    def __init__(self, db_cursor):
      self.firms = Firms(db_cursor)

    # --------- ALERTA DE PELIGROSIDAD -------------
    def risk_converter(self, level):
        if level == 1:
            return  "PELIGROSIDAD BAJA"
        elif level == 2:
            return  "PELIGROSIDAD MEDIA"
        else:
            return  "PELIGROSIDAD CRÍTICA"

    # -------- ANALISIS DE ARCHIVOS (MAIN FUNCTION) -------- #
    def main_method(self, route, strings):

    # Añadir resultados del detector básico
    # Ejecutar ambos detectores
        heur = Heuristic.shannon_entropy()
        hash_result = self.firms.analisys_hash(route)

        resultados = {}

        if hash_result:
            resultados["Hash Detector"] = hash_result
    
        if heur:
            resultados["Heuristic Detector"] = heur

        return resultados  # Esto está dentro de main_method

       
    

