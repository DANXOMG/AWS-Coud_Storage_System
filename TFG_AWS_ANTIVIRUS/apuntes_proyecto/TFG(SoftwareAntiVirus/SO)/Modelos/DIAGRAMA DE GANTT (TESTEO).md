- - - 
- tags: #organizacion #gantt
- - - - 

## COMPROBACIONES DE FUNCIONAMIENTO (ANTIVIRUS)
- - - 
### FUNCIONES PARA CONTROL

#### TAREA 1 (1 SEP - 30 SEP)
- - - 
>  **Escaneo y reconocimiento** de archivos maliciosos con su respectiva comprobación en una base de datos con firmas.


##### CONTENIDO
- - -
- Debemos crear herramienta que escanee y barra los archivos desde la raíz, que permita, de forma compleja, comprobar las firmas a través de una base de datos (MySQL) las firmas más conocidas.
	- Realizar la herramienta en Python, adaptándola a la interfaz gráfica creada con QT
	- Métodos  de la clase *MotorFirms*
		- Detector básico de cadenas peligrosas en binarios o archivos ejecutables
		- En caso de no encontrar nada, pasa al siguiente método
		- Calcula primero los hashes
		- Analizador de hashes de archivos, permitiendo encontrar relaciones y coincidencias con la base de datos de firmas de malware

#### Bloque de programas
- - - 
- **Motor de analisis de archivos**
	- *swipper.py* --> Motor de búsqueda de binarios y archivos según ciertas características
	- *motor_firms.py* --> Motor de cálculo y análisis de hashes, incluye interacción con la base de datos
	- *firms.py* --> Motor de búsqueda según firmas, mediante la creación de una base de datos en MySQL
	- *heuristic.py* --> Se trata del motor de búsqueda heurística, ya que es posible que según firmas no siempre encuentre coincidencias (Cadenas sospechosas y entropía)

> **Primera prueba testeada V1**
> 	RESULTADOS --> **Prueba Pasada** 16/09/2025 (Archivo de testeo de prueba *tester_v1.py*)




## COMPROBACIONES DE FUNCIONAMIENTO (INF-AWS)
- - -
- 