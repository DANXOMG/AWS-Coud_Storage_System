- - - 
- tags: #infraestructure 
- - - - 

- La idea principal es ejecutar un servicio de **guardado de archivos** en la nube que contenga las siguientes funcionalidades:
	- Envío automatizado de notificaciones cuando en el servicio quede poco espacio *(Al desarrollador o monitor del sitio y cliente)* > (PUEDE VARIAR LA NOTIFICACIÓN)
	- Habilitar el análisis de archivos a través del antivirus creado por nosotros *ConTrol*
	- Generación de logs de **monitorización** de archivos en servidor, envío al desarrollador
	- Nube funcional con **objetos**, utilizando un bucket **S3** para guardar y almacenar recursos
		- *OPCIONAL* --> Copia de seguridad cada cierto tiempo (*TFG --> 2 DIAS*)
	- Lambda como disparador cuando se ejecute la subida del archivo

> MODELO CONCEPTUAL VISUAL ![[modelo_conceptual.png]]
>

- La infraestructura constará de **3 motores indispensables**:
	- *EC2 (Web Server)* --> Comunicación directa con el cliente
	- *Lambda (Aviso de subida)* -->Dispara un aviso para el servidor 
	- *S3 (Nube cliente)* --> Guardado de información para el cliente


