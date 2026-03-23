# Trabajo de final de grado (AWS + PYTHON ANTIVIRUS)

### Resumen

- Somos Daniel y Paco, realizaremos una documentación con pruebas gráficas de funcionamiento, mostrando el proceso completo de trabajo y los programas en RAW con toda su información comentada


#### Idea principal

- La idea es realizar una infraestructura en AWS (Amazon Web Service) que funcione sincronizada respetando los siguientes requisitos:

    1. infraestructura **backend**: El EC2 está conectado a una función *Lambda*, la cual activa al EC2 para que consiga copiar todos los datos e información de los clientes en una *copia de seguridad*
        - La infraestructura se sostiene en un conjunto de contenedores, que se organiza en una red desmilitarizada del servidor, para evitar problemas de seguridad *(Docker Web, Docker Antivirus y Docker Agente)*
        - Existirán 2 servicios almacenados de *AWS*, que realizarán el aviso de la copia de seguridad y guardado de datos de los clientes
            - *Lambda*: Función de aviso *(Copia de seguridad)*
            - *S3*: Función de guardado y almacenaje de datos

    2. Protocolo de **notificaciones**: El servidor ejecutará los servicios de notificación de *Amazon* para el aviso de copias de seguridad y restauración de los archivos de los clientes (**Al igual que el aviso de subida o no subida del archivo en cuestión**)

    3. El *Antivirus* es un proyecto individual adaptado a esta infraestructura, el cual se compone de diferentes motores de ejecución para realizar distintas acciones, como analizar, monitorizar y comprobar firmas en base de datos

## Antivirus ConTrol-AntiMalware

- Proyecto individual adaptado, generado con código python utilizando el método POO *(Programación Orientada a Objetos)*, permitiendo una mejor escalabilidad y adaptabilidad a diferentes situaciones de uso y plataformas, aunque originalmente ha sido creado orientado a Linux *(En el futuro se orientará multiplataforma)* 

- Se compone de la siguiente estructura de código

    ![Estructura ConTrol](apuntes_proyecto/assets_readme/ec2_st.excalidraw.png)
    <br>
    <br>

## Infraestructura AWS (Resumen técnico y especificaciones de entorno)

- Vista **gráfica** de nuestra idea

![Infraestructura AWS](apuntes_proyecto/assets_readme/INF_FINAL.png)
    <br>
    <br>


- **Especificaciones EC2**

    | Categoría | Especificación |
    |------------|----------------|
    | **Sistema Operativo** | Ubuntu Server 24.04 LTS (o 22.04 LTS) |
    | **Arquitectura** | x86_64 |
    | **Tipo de Instancia** | t2.micro *(gratuita)*  |
    | **vCPU** | 2 núcleos virtuales |
    | **Memoria RAM** | 1 GB – 4 GB (según instancia) |
    | **Almacenamiento (EBS)** | 8 GB SSD gp3 *(por defecto)* |
    | **Red** | 1 dirección IPv4 pública / 1 privada |
    | **Puerto SSH** | 22 *(abierto en Security Group)* |
    | **Puerto HTTP** | 80 *(abierto en Security Group)* |
    | **Usuario por defecto** | `ubuntu` |
    | **S3 Integration** | Mediante SDK (boto3) |
    | **Lambda Integration** | Permite comunicación vía EventBridge |

### Lógica y diseño técnico de EC2

- El servidor contiene una red DMZ que separa el funcionamiento de la infraestructura con el entorno de nube para funcionar correctamente

- El *EC2* contiene el servicio docker para funcionar correctamente mediante la siguiente estructura:
    - Servicio de **docker**: Contiene tres contenedores que se dedican a una parte del corazón de la infraestructura:
        - Contenedor **Web**: donde se ejecuta a través de un *Port Forwarding* hacia el servidor, haciendo que el mismo pueda sostener el propio servidor *Flask*.

        - Contenedor **Antivirus**: Contendrá todo el código fuente y funcionamiento del sistema de protección *ConTrol*, generado por nosotros

        - Contenedor **Agente**: Contiene un agente de inteligencia artificial generado con *n8n*, capaz de reconocer archivos sin necesidad de que pase por un filtro como *.png* o *.txt*

    - Servicio de **almacenamiento S3**: Será la base de **almacenamiento** de la infraestructura nube, contiene toda la información subida por los clientes

    - Sistema de aviso **Lambda**: Se encarga de avisar al sistema *EC2* de generar una copia de seguridad de los datos de los clientes, volcada directamente desde el *S3*

## Docker

### Docker Web

- Contenedor sostenido por los siguientes puntos:
    - Aplicación *Flask*: Es la parte que ejecuta de forma organizada lo que llega a ser visible para el *cliente*, realiza el guardado de la subida con el *código JS* **(Flask versión 2.3.3)**
    ![Muestra de entorno web establecido](/apuntes_proyecto/assets_readme/ec2_status.png)

    - Sistema de **base de datos**: Contiene la información de los clientes, desde nombre, id y contraseña, hasta el *plan pagado* de almacenamiento, que inicialmente será una versión de prueba de 10GB sin costos

    

### Docker Antivirus
- Contenedor que se sostiene la **lógica** y **programación** del sistema de filtrado y protección *ConTrol*, creado completamente por nosotros
- El código fuente es completamente abierto a colaboraciones y mejoras

### Docker Agente
- Contiene la lógica ejecutada sobre un **entorno n8n**, el cual permite realizar una comprobación de ficheros o archivos subidos a la *web*, haciendo un *análisis superficial* para saber si mandarlo o no al antivirus



## Sistema de almacenamiento S3
- Será la base de **almacenamiento** de la infraestructura nube, contiene toda la información subida por los clientes, contiene la siguiente configuración:
    - *(PARTE EN DESARROLLO E INVESTIGACIÓN)*

## Sistema de avisos por Lambda
- Se encarga de avisar al sistema *EC2* de generar una copia de seguridad de los datos de los clientes, volcada directamente desde el *S3*
    - *(PARTE EN DESARROLLO E INVESTIGACIÓN)*

## Sistema de notificaciones con Amazon SQS
- *(PARTE EN DESARROLLO E INVESTIGACIÓN)*

## **(ULTIMA ACTUALIZACION DE README.md 07/11/2025 11:44)**