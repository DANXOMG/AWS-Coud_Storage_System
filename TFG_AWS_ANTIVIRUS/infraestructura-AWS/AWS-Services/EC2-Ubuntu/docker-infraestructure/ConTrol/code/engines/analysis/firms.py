import hashlib

class Firms(object):
    def __init__(self, db_connection): 
        self.conn = db_connection

    def hash_calc(self, route):
        sha256 = hashlib.sha256()
        try:
            with open(route, "rb") as f:
                for bloque in iter(lambda: f.read(4096), b""):
                    sha256.update(bloque)
            return sha256.hexdigest()
        except:
            return None

    def analisys_hash(self, route):
        file_hash = self.hash_calc(route)
        if not file_hash:
            return None
        cursor = self.conn.cursor()
        try:
            cursor.execute(
                "SELECT malicious_name, description, risk_level FROM malware_info WHERE firm=%s",
                (file_hash,)
            )
            return cursor.fetchone()
        finally:
            cursor.close()
