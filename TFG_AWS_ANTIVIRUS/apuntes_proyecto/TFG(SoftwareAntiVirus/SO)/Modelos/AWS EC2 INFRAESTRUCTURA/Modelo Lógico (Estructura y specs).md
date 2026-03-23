- - - 
- tags: #infraestructure #Logico 
- - - -

# EC2 (Corazón de la infraestructura)
- - - 
- Se trata del servidor principal, el cual va a tener estas funcionalidades:
	- **Host** de la web de nube
	- **Antivirus** y funciones de escaneo (Antivirus POO)
	- Envío de **mensajes** según ciertos registros (SQS, SNS)
	- Conexión directa a la *nube* o **S3**

#### Características principales
- - - 
##### Especificaciones del servidor

| Sistema operativo   | Almacenamiento    | Servicios almacenados   |
| ------------------- | ----------------- | ----------------------- |
| Ubuntu Server 22.04 | 8 GB (Escalables) | - S3, Lambda, Antivirus |

- El servidor consta de las siguientes características instaladas
	- Python 3.12 con librerías *(Pondremos un requirements.txt en GitHub con las necesarias)*
	- Apache2 *(Servidor web para la interacción con el usuario)*
	- Antivirus-ConTrol *(Interacción con las subidas del cliente)*
	- *(OPCIONAL)* Implementación de SSH para el acceso al servidor

> Habría que agregarle la instalación manual de **aws-cli** con el siguiente comando
> ```bash
> curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" 
> ```


##### WEB
- - -
- La web tendrá una temática de *nube*, un servidor de guardado de archivos en red que permite al cliente poder acceder desde cualquier parte a los mismos

###### Funcionalidades:
1. *Interfaz y diseño en decisión (?)*
2. Aviso al cliente en caso de que se esté quedando sin espacio
3. Aviso de **fallo de subida** debido a archivo malicioso (Interacción Antivirus)
4. Mensaje al desarrollador de copias de seguridad de las mismas, guardando registro de todos las subidas del cliente
5. Guardado directo en un contenedor para mantener el aislamiento y analizarlo
# Lambda (Disparador del Antivirus)
- - -
- Se trata del servicio *Lambda*, el cual es capaz de **ejecutar un proceso en cuanto ocurre algo**, debe tener las siguientes funcionalidades:
	- **Código disparador** que detecte la subida, lo manda primero al *bucket* temporal y posteriormente lo agrega al original, borrando el archivo del temporal
	- Configurar la **manipulación** de objetos en el S3