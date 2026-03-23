FROM python:3.11-slim

WORKDIR /home/app

# Copiar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar app
COPY . .

# Servicio corriendo en el puerto 5000
EXPOSE 5000

# Ejecución del servicio FLASK
CMD ["python", "app.py"]