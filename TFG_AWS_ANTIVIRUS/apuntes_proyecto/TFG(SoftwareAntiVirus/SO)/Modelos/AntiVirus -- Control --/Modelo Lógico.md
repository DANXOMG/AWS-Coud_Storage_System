- - - - - - -
- Tags: #ModeloAntiVirus #Logico #AntiVirus
- - - - - 

## Introducción del proyecto <u>(AntiVirus)</u>

- Vamos a realizar una aplicación que permita realizar las siguientes acciones, funcionando como antivirus:
	- **Escaneo y reconocimiento** de archivos maliciosos con su respectiva comprobación en una base de datos con firmas.
	- **Previenen y alertan** al *usuario* de posibles ataques según la configuración del dispositivo
	- Actuará de forma **pasiva**, esperando órdenes del usuario.
	- Control de **entrada y salida** de datos del sistema (De manera básica).
	- **(OPCIONAL)** Integración en el sistema operativo, accediendo a funciones críticas para detectar malware.
	- **(OPCIONAL)** Integración de la IA para ciertas funcionalidades.
	- **(OPCIONAL)** Creación de contenedores de prueba de malware

- Se va a realizar la **aplicación** y su integración de funciones completamente en **Python**.
- Realizaremos la programación en el **Framework QT**.

## Consideración de la definición "antivirus"

- - - - -

- Se diría que es un **software de protección** que se utiliza para *reconocer y solucionar* problemas de seguridad en dispositivos, yendo desde el reconocimiento directo de malware a la monitorización y limitación del **manejo de datos** dentro de una red en relación al dispositivo.

- - - - 

## Características principales del Software

- - - - 
- Como mínimo se respetarán los siguientes puntos:
	1.  Se va a limitar el desarrollo al *sistema operativo* Linux, con **Debian** como base.
	2.  El antivirus tendrá el nombre de **"Control"**.
	3.  La creación del software será en **Python con POO**.