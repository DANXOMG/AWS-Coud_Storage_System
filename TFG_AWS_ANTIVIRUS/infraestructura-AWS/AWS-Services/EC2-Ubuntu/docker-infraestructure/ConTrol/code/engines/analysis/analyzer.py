#!/usr/bin/python3
from .firms import Firms
from .heuristic import Heuristic

class Analyzer(object):
    def __init__(self, db_connection):
        self.firms = Firms(db_connection)

    def main_method(self, route, strings):
        hash_result = self.firms.analisys_hash(route)
        if hash_result:
            resultados = {
                "detection_source": "SIGNATURE_DATABASE",
                "Hash Detector": hash_result,
                "Heuristic Detector": "Skipped (Known Malware)"
            }
            return False, resultados

        h_engine = Heuristic(route)
        ent, ent_msg = h_engine.shannon_entropy()
        findings = h_engine.suspect_chains()
        resultados = {
            "detection_source": "HEURISTIC_ENGINE",
            "Heuristic Detector": {
                "entropy": round(ent, 4),
                "verdict": ent_msg,
                "suspicious_found": len(findings),
                "detected_keywords": [item[0] for item in findings]
            }
        }

        es_seguro = True
        if len(findings) > 0 or ent > 7.0:
            es_seguro = False

        return es_seguro, resultados
