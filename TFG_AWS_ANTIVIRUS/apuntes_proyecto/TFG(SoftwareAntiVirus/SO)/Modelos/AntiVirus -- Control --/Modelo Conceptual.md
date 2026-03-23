- - - 
- #ModeloAntiVirus #Conceptual #AntiVirus
- - - - -

## Explicación de la interfaz de entrada

- Lo primero que debemos pensar es la interfaz de entrada, la cual tendrá exactamente las funciones que vamos a importar
- Hay que tener en cuenta que cada acción debe tener su interfaz CLI


- **Escanear sistema** --> Realizará un barrido de archivos comprobando con la base de datos de firmas, la cual irá contrastando buscando *malware* conocido.
- **Reglas de Firewall** -->  Se podrá configurar el *Firewall* perteneciente al dispositivo, prohibiendo o modificando el tráfico entrante y saliente del mismo.
- **Limpiar basura** -->  Se realizará un mapeo de los archivos no necesarios para el sistema, borrando todo lo *sobrante*.
- **Dirección IP y MAC** -->  Muestra las direcciones IP y MAC del dispositivo
- **Wifi/conexión** --> Muestra la conexión a la que está conectado el dispositivo, mostrando el método de protección del mismo
- **Nombre del dispositivo** --> Muestra el nombre del sistema
- **Configuración** --> Se podrá configurar de forma general la App


> Está implementado para ser usado de forma independiente, pero el trabajo es en **AWS**, realiza la función de análisis de malware y subidas

