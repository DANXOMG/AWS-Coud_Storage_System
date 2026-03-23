- - - -
- tags: #infraestructure #AntiVirus 
- - - - 

## Introducción a la adaptación del programa
- - - 
- Realizaremos una adaptación del *antivirus* original a una versión adaptable a un EC2, con las siguientes características:
	- **Análisis y escaneo** de archivos maliciosos sobre el input del usuario, utilizando firmas y heurística
	- **Envío de registros** al servidor, permitiendo el aviso al usuario que ejecute la subida *(De forma opcional podemos guardar información del usuario que sube el archivo, por si es malicioso saber las intenciones)*
	- Uso de la función de *Kubernetes* de AWS, permitiendo **analizar el comportamiento** del binario para recopilar más información del mismo.
	- Conexión con el servicio *S3* permitiendo subir o eliminar archivos maliciosos o sospechosos

## Características principales del Software

- - - - 
- Como mínimo se respetarán los siguientes puntos:
	1.  Se va a limitar el desarrollo al *sistema operativo* Linux, con **Ubuntu** como base, para el EC2.
	2.  El antivirus tendrá el nombre de **"Control"**.
	3. Servirá como *motor de seguridad de la infraestructura*, controlando la administración de la información subida o borrada
	4.  La creación del software será en **Python con POO**.