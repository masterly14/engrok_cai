# Informe Técnico: Migración de Números de WhatsApp

# Business a la API Cloud mediante OAuth2 para

# Proveedores de Tecnología Verificados

## Resumen Ejecutivo: Migración de Números de WhatsApp para

## Proveedores de Tecnología

Se confirma de manera definitiva que los clientes pueden migrar sus números

existentes de WhatsApp Business a la API Cloud de WhatsApp Business. Este proceso

puede integrarse de manera fluida en la aplicación de un Proveedor de Tecnología

Verificado (PTV), principalmente a través del flujo de Embedded Signup habilitado por

OAuth2. Esta capacidad agiliza significativamente la transición para las empresas que

buscan aprovechar la escalabilidad y las funciones avanzadas de la API Cloud.

La implementación de OAuth2 a través de Embedded Signup simplifica el proceso

general de incorporación y migración. Reduce sustancialmente la sobrecarga técnica

para los PTV al automatizar muchos pasos de configuración inicial y al permitir

migraciones iniciadas por el cliente. Este informe detallará los mecanismos precisos,

los requisitos previos esenciales y las consideraciones posteriores a la migración para

una transición exitosa, con un enfoque particular en las implicaciones de permisos

específicos de la API.

## 1. Comprender la Migración de Números de WhatsApp Business

Esta sección fundamental clarificará los diferentes tipos de números de WhatsApp

Business y describirá los diversos escenarios de migración, proporcionando un

contexto esencial para los procesos técnicos que se detallarán a continuación.

**1.1. Distinción entre WhatsApp Business App, API On-Premises y Números de**

**API Cloud**

La plataforma de WhatsApp Business ofrece diferentes modalidades para que las

empresas interactúen con sus clientes, cada una con sus propias características y

casos de uso.

La **WhatsApp Business App** es una aplicación móvil gratuita diseñada principalmente

para pequeñas empresas. Ofrece funcionalidades limitadas, como respuestas rápidas y

un catálogo básico de productos. Su uso está orientado a volúmenes bajos de

mensajes y es gestionada por un solo usuario o un equipo reducido.

### 1

En contraste, la **WhatsApp Business Platform (API)** es una solución avanzada

desarrollada por Meta, diseñada para medianas y grandes empresas que manejan un


alto volumen de interacciones con clientes. Esta plataforma permite una comunicación

escalable y personalizada, la automatización de flujos de trabajo y la integración con

herramientas empresariales existentes, como sistemas CRM y plataformas de comercio

electrónico.

### 1

Dentro de la WhatsApp Business Platform, existen dos modelos de implementación

principales:

```
● La API Cloud es la versión alojada por Meta de la WhatsApp Business Platform.
```
```
Lanzada en mayo de 2022, elimina la necesidad de que las empresas o los PTV
```
```
alojen sus propios servidores, simplificando la implementación, el mantenimiento
```
```
y la escalabilidad de la mensajería empresarial.
```
### 1

```
● La API On-Premises es un modelo de implementación alternativo donde el
```
```
cliente de la API de WhatsApp Business se autoaloja en los propios servidores
```
```
de una empresa o proveedor de soluciones. Este modelo requiere la gestión de
```
```
la infraestructura del servidor subyacente.
```
### 1

**1.2. Descripción General de los Escenarios de Migración**

La migración de números de WhatsApp Business puede ocurrir en varias situaciones,

dependiendo de la configuración actual del número.

La migración de un número de **WhatsApp Business App/Messenger a la API Cloud**

implica la transición de un número de teléfono actualmente registrado con la aplicación

WhatsApp Messenger o WhatsApp Business a la plataforma de la API Cloud.

### 3

Históricamente, migrar un número desde la WhatsApp Business App requería eliminar

la cuenta de la aplicación existente, lo que resultaba en la pérdida permanente del

historial de chat.

### 3

```
Sin embargo, un avance significativo ahora permite a los
```
Proveedores de Tecnología Verificados incorporar números de la WhatsApp Business

App manteniendo el historial de chat existente. Esta característica, conocida como

"Coexistencia", también permite el uso concurrente de la aplicación móvil y la API

Cloud, ofreciendo una transición mucho más fluida para las empresas.

### 3

```
La evolución
```
de la capacidad de migración, pasando de un proceso destructivo que implicaba la

pérdida del historial de chat a la función de "Coexistencia" habilitada por los

Proveedores de Soluciones, representa un cambio estratégico por parte de Meta. Este

desarrollo busca reducir la fricción para las empresas que adoptan la API al abordar

una preocupación importante como la pérdida de datos y al ofrecer una mayor

flexibilidad operativa, permitiendo el uso simultáneo de la aplicación y la API. Para los


Proveedores de Tecnología Verificados, esta capacidad de "Coexistencia" se convierte

en una propuesta de valor crucial, ya que les permite ofrecer una experiencia de

migración superior y menos disruptiva a un amplio segmento de clientes potenciales

que actualmente utilizan la WhatsApp Business App. Esto amplía directamente el

mercado al que puede dirigirse el PTV y mejora su ventaja competitiva al proporcionar

una solución que la ruta de migración directa de Meta no ofrece, transformando una

limitación técnica en una oportunidad de negocio significativa.

El escenario de migración de la **API On-Premises a la API Cloud** implica la

transferencia de un número de teléfono empresarial desde un cliente de la API de

WhatsApp Business autoalojado a la API Cloud de Meta. Este proceso generalmente

requiere la generación de metadatos específicos de la configuración On-Premises.

### 2

Finalmente, la migración de un **Socio de Soluciones a otro Socio de Soluciones**

**(API Cloud a API Cloud)** es una ruta de migración común donde un número de la API

Cloud se transfiere de una Cuenta de WhatsApp Business (WABA) de un Proveedor de

Soluciones a la de otro. Este proceso suele conservar el nombre de visualización, la

calificación de calidad, los límites de mensajes de plantillas y las plantillas

aprobadas.

### 10

## 2. El Papel Central de OAuth2 y Embedded Signup

Esta sección detallará cómo OAuth2, específicamente a través del flujo de Embedded

Signup de Meta, sirve como el mecanismo principal y más optimizado para las

migraciones iniciadas por el cliente, ofreciendo ventajas significativas para los

Proveedores de Tecnología Verificados.

**2.1. Cómo Facebook Login for Business y Embedded Signup Agilizan el Proceso**

El Embedded Signup es una herramienta fundamental para simplificar la incorporación

y migración de números de WhatsApp Business. Su tecnología subyacente se basa en

el producto Facebook Login for Business y aprovecha el SDK de JavaScript de Meta.

### 5

Esta base proporciona un flujo de autenticación seguro, estandarizado y fácil de usar,

basado en OAuth2.

### 14

El diseño del Embedded Signup faculta al cliente para iniciar y dirigir el proceso de

incorporación y migración. Los clientes se autentican utilizando sus credenciales

existentes de Facebook o Meta Business a través de una interfaz familiar.

### 5

```
Esto reduce
```

significativamente la carga de configuración inicial para el PTV, permitiendo un modelo

de incorporación más escalable.

Una ventaja central del Embedded Signup es su capacidad para generar

automáticamente todos los activos necesarios de WhatsApp, como una nueva Cuenta

de WhatsApp Business (WABA), y luego otorgar automáticamente a la aplicación del

PTV el acceso requerido a estos activos recién creados o migrados.

### 5

```
Esta
```
automatización elimina los pasos manuales y propensos a errores de creación de

activos y asignación de permisos que tradicionalmente eran manejados por el PTV.

Tras la finalización exitosa del flujo de Embedded Signup, el SDK de JavaScript del

PTV recibe información crucial: el ID de la nueva WABA del cliente, el ID de su número

de teléfono empresarial y un código de token intercambiable.

### 5

```
El servidor backend del
```
PTV debe entonces realizar una llamada segura de servidor a servidor para

intercambiar este código de corta duración por un token de acceso de Usuario del

Sistema de Integración de Negocios con alcance de cliente.

### 5

```
Este token de larga
```
duración es crucial para la comunicación continua y automatizada de servidor a

servidor, lo que permite a la aplicación del PTV gestionar programáticamente los

activos de WhatsApp del cliente.

### 13

**2.2. Ventajas de Embedded Signup para Migraciones Iniciadas por el Cliente**

El Embedded Signup es la solución preferida de Meta debido a su simplicidad inherente

y a la significativa reducción en el número de llamadas a la API requeridas por parte del

### PTV.

### 11

```
Automatiza configuraciones complejas, incluida la configuración de webhooks y
```
números de teléfono, que tradicionalmente requerían intervención manual.

### 14

Las empresas incorporadas a través de Embedded Signup conservan la propiedad total

de todos sus activos de WhatsApp. Esto les permite aprovechar estos activos con otras

soluciones de Meta, como "Anuncios que hacen clic en WhatsApp", asegurando una

mayor flexibilidad y posibilidades de integración más allá de la plataforma del PTV.

### 5

```
El
```
diseño de Embedded Signup, al automatizar la creación de activos, la concesión de

acceso y, fundamentalmente, al permitir flujos iniciados por el cliente, aborda

directamente un desafío crítico para los Proveedores de Tecnología Verificados: la

escalabilidad de la incorporación de clientes. Los procesos manuales para cada cliente

implicarían una sobrecarga operativa sustancial, consumiendo recursos valiosos de

desarrollo y soporte. Esta automatización, respaldada por el marco OAuth2, permite a


los PTV incorporar y migrar clientes de manera mucho más eficiente y a una escala

mayor. Esto se traduce en que los PTV pueden reasignar sus valiosos recursos de

ingeniería y soporte de tareas de configuración repetitivas al desarrollo y la oferta de

servicios más avanzados y de valor añadido, como integraciones sofisticadas de

chatbots, análisis profundos de CRM o campañas de mensajería personalizadas. Este

cambio estratégico conduce a una mayor rentabilidad, una penetración más rápida en

el mercado y una posición competitiva más sólida en el ecosistema de la API de

WhatsApp Business. El flujo de OAuth2, por lo tanto, no es simplemente un detalle

técnico; es un facilitador fundamental de negocio para los PTV que buscan expandir su

base de clientes.

Además, el flujo es ampliamente reconocido como la "forma más rápida y sencilla" de

establecer una cuenta de WhatsApp Business y registrar un número, acortando

significativamente el tiempo de valor para los nuevos clientes.

### 7

```
También proporciona un
```
seguimiento del progreso en tiempo real y una experiencia de autenticación familiar de

Facebook/Meta, mejorando el recorrido general del usuario durante la incorporación.

### 14

## 3. Requisitos Previos para una Migración Exitosa de Números

Esta sección delineará las condiciones esenciales y los pasos preparatorios que deben

cumplirse meticulosamente antes de iniciar cualquier migración de números de

WhatsApp Business. Se hará hincapié en los requisitos críticos de seguridad,

cumplimiento y estado de la cuenta.

**3.1. Estados Requeridos de la Cuenta de Meta Business y la WABA**

Para una migración exitosa, la Cuenta de Meta Business que posee o poseerá la

Cuenta de WhatsApp Business (WABA) debe tener un estado verificado.

### 4

```
Esta
```
verificación asegura la legitimidad de la empresa que interactúa con la plataforma de

WhatsApp.

Asimismo, la Cuenta de WhatsApp Business (WABA) existente (de origen) debe tener

un estado aprobado.

### 4

```
Una WABA no aprobada o con infracciones de políticas no
```
puede someterse a migración. La información empresarial precisa y completa,

incluyendo el nombre legal, la dirección física y un sitio web válido, debe

proporcionarse y mantenerse actualizada en la configuración del Administrador

Comercial de Meta. Esta información es crucial para el cumplimiento de la Política

Comercial de WhatsApp, y los detalles incompletos pueden llevar a bloqueos de la

cuenta.

### 7


**3.2. Importancia de Desactivar la Verificación en Dos Pasos (2FA)**

La desactivación de la Verificación en Dos Pasos (2FA) en el número de teléfono es un

requisito previo crítico y no negociable antes de iniciar cualquier tipo de migración.

### 4

Esta medida de seguridad, aunque vital para la protección de la cuenta, actúa como un

guardián durante las transferencias. La abrumadora insistencia en la desactivación de

la 2FA en casi todos los documentos relacionados con la migración subraya su función

como un mecanismo de seguridad fundamental. Su propósito principal es prevenir

transferencias no autorizadas de un número de WhatsApp. Por lo tanto, para cualquier

migración legítima, esta medida de seguridad debe levantarse temporalmente, creando

una dependencia ineludible y un punto de coordinación crítico.

Para los números actualmente en la API Cloud, la 2FA se puede desactivar

generalmente a través del Administrador Comercial de Meta. Para los usuarios de la

API On-Premises, se requiere una llamada explícita a la API al endpoint de Verificación

en Dos Pasos.

### 10

```
Si el PTV no posee la WABA de origen, el propietario del número de
```
teléfono debe coordinar con su Proveedor de Soluciones actual para desactivar la

### 2FA.

### 4

```
Para los PTV, esto significa que una estrategia de comunicación robusta y una
```
guía clara para los clientes son primordiales. Deben educar a los clientes sobre la

necesidad de desactivar la 2FA y proporcionar instrucciones precisas sobre cómo

hacerlo. La falta de una gestión efectiva de este paso es una causa común de fallos en

la migración

### 16

```
, lo que provoca frustración y retrasos. Esto también subraya la
```
necesidad de que los PTV tengan procedimientos claros de escalada en caso de que el

proveedor anterior de un cliente no coopere en la desactivación de la 2FA.

Después de una migración exitosa y una verificación exhaustiva del estado, la 2FA

debe reactivarse rápidamente para restaurar la capa adicional de seguridad para la

cuenta de WhatsApp.

### 2

**3.3. Consideraciones sobre el Nombre de Visualización y el Método de Pago**

El número de teléfono empresarial debe tener un nombre de visualización aprobado

(name_status es APPROVED) por WhatsApp. Cualquier solicitud pendiente de cambio de

nombre de visualización debe resolverse antes de que la migración pueda continuar.

### 4

La WABA de origen debe tener un método de pago válido y asociado.

### 4

```
Para los
```
Proveedores de Soluciones, es imperativo tener una línea de crédito establecida con

Meta y compartir esta línea de crédito con la nueva WABA del cliente como parte del


proceso de incorporación.

### 5

```
El número de teléfono designado para la migración debe
```
ser capaz de recibir SMS o llamadas de voz, ya que estos métodos se utilizan para la

entrega obligatoria del código de verificación durante el proceso.

### 16

## 4. Proceso de Migración Paso a Paso para Proveedores de

## Tecnología

Esta sección proporcionará pasos detallados y accionables para que los Proveedores

de Tecnología Verificados faciliten la migración de números de WhatsApp Business.

Distinguirá entre el flujo de Embedded Signup recomendado y los métodos

programáticos impulsados por API, ofreciendo una guía completa para la

implementación.

**4.1. Migración a través de Embedded Signup (Recomendado para PTV)**

El Embedded Signup es el método preferido para los PTV debido a su eficiencia y

automatización.

**4.1.1. Flujo Iniciado por el Cliente y Responsabilidades del PTV**

La responsabilidad principal del PTV es integrar y presentar el flujo de Embedded

Signup (versión 2) a sus clientes. Esto se logra típicamente incrustando un enlace o

botón en el sitio web o portal del cliente del PTV, lo que inicia la experiencia de registro

alojada por Meta.

### 5

Dentro de la ventana de Embedded Signup, el cliente se autentica utilizando sus

credenciales de Facebook o Meta Business. Luego selecciona una Meta Business

Portfolio existente o crea una nueva, elige una Cuenta de WhatsApp Business (WABA)

existente o crea una nueva, y finalmente ingresa y verifica su número de teléfono

empresarial y el nombre de visualización deseado.

### 5

Para los números actualmente activos en la WhatsApp Business App, el flujo de

Embedded Signup se puede personalizar para habilitar la "Coexistencia". Esta

característica crítica permite que el número se incorpore a la API Cloud mientras se

conserva el historial de chat existente y se permite el uso concurrente tanto de la

aplicación móvil como de la API.

### 5

**4.1.2. Captura de IDs de Activos e Intercambio de Tokens**

Una vez que el cliente completa con éxito el flujo, Embedded Signup devuelve datos

esenciales al SDK de JavaScript del PTV como un evento de mensaje. Estos datos


incluyen el ID de la WABA recién creada o migrada del cliente, el ID de su número de

teléfono empresarial y un código de token intercambiable.

### 5

El servidor backend del PTV debe entonces usar este código de token intercambiable

en una llamada segura a la API de servidor a servidor. El propósito de esta llamada es

intercambiar el código de corta duración por un token de acceso de Usuario del

Sistema de Integración de Negocios con alcance de cliente.

### 5

```
Este token de larga
```
duración es crucial ya que otorga a la aplicación del PTV acceso programático a los

activos de WhatsApp recién adquiridos por el cliente para su gestión continua.

**4.1.3. Registro del Número de Teléfono para la API Cloud**

Una vez que se obtiene el token de acceso con alcance de cliente, el PTV procede a

registrar el número de teléfono para su uso con la API Cloud.

### 5

```
Este proceso de registro
```
a menudo incluye la configuración de la verificación en dos pasos para el número, lo

cual es un requisito de seguridad para el uso de la API Cloud.

### 2

El endpoint principal de la API para crear/registrar un número de teléfono en una WABA

es una solicitud POST a /<WHATSAPP_BUSINESS_ACCOUNT_ID>/phone_numbers. El

cuerpo de la solicitud debe incluir el código de país (cc), el número de teléfono

(phone_number) y, lo que es crucial, el nombre de visualización aprobado

(verified_name).

### 18

Después de la solicitud de registro, se debe obtener un código de verificación. Esto se

realiza mediante una llamada POST a

/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/request_code, especificando el método de

entrega preferido (SMS o VOZ) y el idioma. El cliente luego proporciona este código de

6 dígitos, que el PTV verifica utilizando una llamada POST a

/<PHONE_NUMBER_ID>/verify_code.

### 10

```
Si bien los documentos describen la "iniciación de
```
la migración" y el "registro del número de teléfono" como pasos distintos, el proceso de

registro en sí mismo es una fase crucial y multifacética. Esto implica que la migración

no es una única llamada atómica a la API, sino más bien una fase preparatoria

(desactivación de la 2FA, obtención de activos/tokens) seguida por el registro del

número en la API Cloud de destino. Para los PTV, esto implica que, si bien el

Embedded Signup automatiza gran parte del aprovisionamiento inicial de activos y el

intercambio de tokens, el acto final de la migración sigue implicando una fase de

registro distinta que requiere la interacción del cliente para proporcionar el código de

verificación. El flujo de la aplicación del PTV debe manejar con elegancia esta


transferencia y guiar al cliente a través del paso de verificación. Comprender este

proceso de varias etapas es clave para construir herramientas de migración robustas y

fáciles de usar.

Una ventaja significativa de este proceso es que el registro del número de teléfono

empresarial ocurre instantáneamente tras la verificación exitosa, lo que permite que el

número continúe enviando y recibiendo mensajes con una interrupción mínima.

### 11

```
Los
```
parámetros explícitos como

migrate_phone_number=true, las llamadas separadas a la API para solicitar y verificar

códigos, y la desactivación obligatoria de la 2FA no son arbitrarios. Reflejan decisiones

intencionales de diseño de la API de Meta centradas en la seguridad y el control. Estos

pasos en capas evitan que una sola llamada a la API no verificada transfiera activos

sensibles como números de teléfono sin la confirmación explícita del propietario. Para

los PTV, esto significa que la adhesión estricta a estos procesos de varios pasos no se

trata solo de lograr la funcionalidad, sino de mantener la integridad y la seguridad de la

presencia de WhatsApp Business de sus clientes. También destaca la necesidad de

construir un manejo de errores robusto, mecanismos de reintento y una

retroalimentación clara para el usuario en su integración para gestionar posibles fallas o

retrasos en cada paso sensible a la seguridad.

**4.1.4. Suscripción a Webhooks y Compartir Línea de Crédito**

Después del registro, el PTV debe suscribir su aplicación a los webhooks en la nueva

WABA del cliente. Esto es esencial para recibir notificaciones en tiempo real sobre

mensajes entrantes, actualizaciones de estado de mensajes y otros eventos críticos.

### 5

Si el PTV opera como un Socio de Soluciones, se le exige que comparta su línea de

crédito establecida con la nueva WABA del cliente. Esto asegura que los costos de

mensajería del cliente se gestionen a través del acuerdo de facturación del Socio de

Soluciones con Meta.

### 5

**4.2. Migración Programática (Impulsada por API)**

Aunque el Embedded Signup es el método preferido, también existen rutas de

migración programáticas que ofrecen un control más granular.

**4.2.1. Pasos Generales para la Migración de Socio a Socio**


Al igual que con Embedded Signup, el primer y más crítico paso es asegurarse de que

la verificación en dos pasos esté desactivada en el número de teléfono que se va a

migrar.

### 10

El PTV realiza una llamada POST al endpoint

/<WHATSAPP_BUSINESS_ACCOUNT_ID>/phone_numbers, donde

WHATSAPP_BUSINESS_ACCOUNT_ID se refiere al ID de la WABA de _destino_. La solicitud

debe incluir cc (código de país), phone_number y, crucialmente,

migrate_phone_number=true.

### 10

Después de la iniciación, el PTV solicita un código de registro realizando una llamada

POST a /<PHONE_NUMBER_ID>/request_code, especificando el code_method (SMS o VOZ)

y el language. Una vez que el cliente recibe y proporciona el código de 6 dígitos, el PTV

realiza una llamada POST final a /<PHONE_NUMBER_ID>/verify_code para confirmar la

propiedad y completar la migración.

### 10

**4.2.2. Consideraciones para la Migración de On-Premises a Cloud**

Para migrar un número de una configuración de API On-Premises a la API Cloud, un

paso inicial implica el uso de la API de Copia de Seguridad y Restauración (POST

/v1/settings/backup) desde el cliente On-Premises existente. Esto genera una cadena de

metadatos codificada que describe el número de teléfono empresarial y su

configuración.

### 8

Estos metadatos generados se utilizan luego al registrar el número para su uso con la

API Cloud. Esta acción inherentemente desregistra el número de la API On-Premises,

ya que un número solo puede estar activo en una API a la vez.

### 8

## 5. Permisos y Tokens de Acceso para Proveedores de Tecnología

Esta sección proporcionará un desglose detallado de los permisos de API críticos y los

tipos de tokens de acceso que requiere la aplicación de un Proveedor de Tecnología

Verificado para gestionar y migrar eficazmente los números de WhatsApp Business.

**5.1. Explicación Detallada de los Permisos** whatsapp_business_management **y**

whatsapp_business_messaging

La gestión efectiva de los activos de WhatsApp Business y la habilitación de la

mensajería a través de la API Cloud requieren permisos específicos.


El permiso whatsapp_business_management es fundamental para que la aplicación acceda

y gestione varias configuraciones y activos de la Cuenta de WhatsApp Business

(WABA). Esto incluye el control programático sobre las plantillas de mensajes, los

nombres de visualización y las configuraciones de números de teléfono.

### 5

```
Durante la
```
migración, este permiso es crucial para iniciar migraciones programáticas (por ejemplo,

al establecer

migrate_phone_number=true) y para gestionar los activos de la WABA que se generan o

transfieren automáticamente a través de Embedded Signup. Después de la migración,

permite la gestión continua de las plantillas de mensajes (creación, edición, estado de

aprobación), la configuración de números de teléfono y otras configuraciones a nivel de

WABA.

El permiso whatsapp_business_messaging se requiere específicamente para que la

aplicación acceda e interactúe con los endpoints principales de la API Cloud de

WhatsApp. Su función principal es permitir el envío y la recepción de mensajes a través

de la plataforma.

### 2

```
Durante la migración, este permiso es esencial para el paso final del
```
registro del número de teléfono para el uso de la API Cloud, ya que significa que el

número está listo para la mensajería a través de la API Cloud.

### 2

```
Después de la
```
migración, es el permiso fundamental para todas las operaciones de mensajería en

curso, lo que permite a la aplicación del PTV enviar mensajes salientes y recibir

mensajes entrantes y notificaciones de webhook.

Además de los permisos específicos de WhatsApp, el permiso business_management es

a menudo necesario si la aplicación necesita acceder a endpoints que se dirigen al

Meta Business Portfolio más amplio.

### 2

```
Esto incluye la gestión de la configuración
```
comercial, los métodos de pago y los roles de usuario dentro del Administrador

Comercial de Meta. En el contexto de la migración, apoya el proceso general de

verificación comercial y garantiza que la aplicación del PTV tenga el acceso necesario

a la Cuenta de Meta Business del cliente durante la incorporación y la asociación de

activos. Después de la migración, permite tareas administrativas relacionadas con la

Cuenta de Meta Business del cliente, asegurando la facturación adecuada, la gestión

de usuarios y el cumplimiento.

**5.2. Papel de los Tokens de Acceso de Usuario del Sistema y los Tokens de**

**Acceso de Usuario en la Migración**

La elección del tipo de token de acceso es fundamental para la seguridad y la

funcionalidad de la aplicación de un PTV.


Los **Tokens de Acceso de Usuario del Sistema** son explícitamente diseñados para la

comunicación de servidor a servidor y procesos automatizados, lo que los hace ideales

para las operaciones de backend de la aplicación de un Proveedor de Tecnología.

### 13

Para los PTV, Meta recomienda específicamente el uso de tokens de acceso de

Usuario del Sistema de Integración de Negocios.

### 15

```
Estos tokens pueden configurarse
```
para no expirar nunca, lo cual es crucial para operaciones continuas y desatendidas sin

la necesidad de actualizaciones frecuentes de tokens.

### 13

```
Su alcance está ligado al ID
```
de la empresa cliente, representando a la empresa cliente para las llamadas a la

### API.

### 13

```
Al generar un Token de Acceso de Usuario del Sistema, la aplicación del PTV
```
debe tener asignados explícitamente los permisos de la API de Graph necesarios:

business_management, whatsapp_business_management y whatsapp_business_messaging.

### 15

Los usuarios del sistema permiten un control de acceso granular sobre los datos de la

WABA, lo que permite a los PTV definir permisos específicos para diferentes

departamentos internos o funcionalidades dentro de su propia plataforma.

### 15

Los **Tokens de Acceso de Usuario** , por otro lado, suelen asociarse con una cuenta

personal de Facebook y son más adecuados para acciones en tiempo real basadas en

la entrada directa del usuario, o para la configuración inicial y las pruebas a través de

herramientas como Graph API Explorer o Facebook Login.

### 2

```
Generalmente son de corta
```
duración, especialmente para actividades basadas en el navegador, y pueden ser

revocados por el usuario.

### 13

**5.3. Tabla Imprescindible: Permisos Clave de la API de WhatsApp Business para**

**Proveedores de Tecnología**

La siguiente tabla detalla los permisos esenciales de la API de WhatsApp Business, su

función y su relevancia durante y después del proceso de migración, así como los tipos

de tokens de acceso comúnmente utilizados. Esta información es crucial para que los

PTV aseguren que sus aplicaciones estén correctamente autorizadas para todas las

tareas necesarias, evitando errores comunes relacionados con los permisos y

agilizando el proceso de desarrollo.


Permiso Descripció

```
n
```
```
Función
```
```
Principal
```
```
durante la
```
```
Migración
```
```
Función
```
```
Principal
```
```
Post-Migració
```
```
n
```
```
Tipo(s) de
```
```
Token
```
```
Comúnme
```
```
nte
```
```
Utilizados
```
whatsapp_business_managem

ent

```
Gestiona la
```
```
configuraci
```
```
ón de la
```
```
WABA,
```
```
plantillas y
```
```
números
```
```
de
```
```
teléfono.
```
```
Iniciar
```
```
migraciones
```
```
programátic
```
```
as,
```
```
gestionar
```
```
activos
```
```
generados a
```
```
través de
```
```
Embedded
```
```
Signup.
```
```
Gestión
```
```
continua de
```
```
plantillas,
```
```
cambios de
```
```
nombre de
```
```
visualización,
```
```
configuración
```
```
de números
```
```
de teléfono.
```
```
Usuario del
```
```
Sistema,
```
```
Usuario
```
whatsapp_business_messagin

g

```
Accede a
```
```
los
```
```
endpoints
```
```
de la API
```
```
Cloud,
```
```
envía/recib
```
```
e
```
```
mensajes.
```
```
Registrar el
```
```
número de
```
```
teléfono
```
```
para el uso
```
```
de la API
```
```
Cloud (paso
```
```
final de la
```
```
migración).
```
```
Envío y
```
```
recepción de
```
```
todo tipo de
```
```
mensajes
```
```
(texto,
```
```
multimedia,
```
```
plantillas),
```
```
gestión de
```
```
conversacion
```
```
es.
```
```
Usuario del
```
```
Sistema,
```
```
Usuario
```
business_management Gestiona

```
los activos
```
```
de Meta
```
```
Business
```
```
Portfolio.
```
```
Apoyar la
```
```
configuració
```
```
n general de
```
```
la cuenta
```
```
comercial, la
```
```
verificación
```
```
y la
```
```
asociación
```
```
de activos
```
```
durante la
```
```
Gestionar la
```
```
configuración
```
```
comercial, los
```
```
métodos de
```
```
pago, los
```
```
roles de
```
```
usuario
```
```
dentro de la
```
```
Cuenta de
```
```
Meta
```
```
Business.
```
```
Usuario del
```
```
Sistema,
```
```
Usuario
```

```
incorporació
```
```
n.
```
## 6. Mejores Prácticas y Consideraciones Post-Migración

Esta sección describirá los pasos y consideraciones cruciales que deben llevarse a

cabo después de una migración exitosa de números de WhatsApp Business para

asegurar una operación fluida, la integridad de los datos y un rendimiento óptimo.

**6.1. Verificación del Éxito de la Migración y Actualización de Integraciones**

Inmediatamente después de que se complete el proceso de migración, el PTV debe

verificar que el estado del número de teléfono migrado se muestre como "Conectado"

en el panel de su nuevo proveedor o mediante llamadas a la API.

### 12

```
Es imperativo
```
enviar y recibir mensajes de prueba desde y hacia el número migrado para confirmar

que la funcionalidad principal de mensajería funciona correctamente en el nuevo

entorno.

### 9

La actualización de todas las integraciones es un paso crítico. Cualquier CRM

existente, chatbots, plataformas de comercio electrónico u otras herramientas

empresariales que previamente se integraron con el número de WhatsApp deben

actualizarse. Esto incluye reemplazar los tokens de API antiguos con los nuevos

obtenidos de la plataforma del nuevo proveedor.

### 16

```
La instrucción clara de "Actualizar
```
sus Integraciones" y "Reemplazar los tokens de API antiguos por los nuevos" revela

una relación causal crítica: el acto de migrar un número a una nueva WABA o

proveedor inherentemente invalida las conexiones API y los tokens de acceso

anteriores. Esta es una medida de seguridad para garantizar que solo el nuevo PTV

autorizado tenga acceso. Para los PTV, esto significa que deben comunicar

inequívocamente a sus clientes que la migración no es un proceso pasivo. Las

actualizaciones de integración posteriores a la migración no son opcionales, sino

obligatorias para restaurar la funcionalidad completa de sus sistemas conectados

(CRMs, chatbots, etc.). Esto requiere un esfuerzo bien coordinado entre el equipo

técnico del PTV y los equipos internos de TI u operaciones del cliente para asegurar

una transición fluida y evitar interrupciones del servicio.

Se debe realizar una verificación exhaustiva del estado de toda la nueva configuración,

incluyendo la conectividad de la API, la funcionalidad de los webhooks y las rutas de

entrega de mensajes.

### 9


**6.2. Migración de Plantillas e Implicaciones de la Calificación de Calidad**

Generalmente, todas las plantillas de mensajes pre-aprobadas asociadas con el

número migrado se transferirán a la nueva Cuenta de WhatsApp Business (WABA).

### 11

Sin embargo, una consideración crítica es que las calificaciones de calidad de estas

plantillas migradas NO se conservarán; todas comenzarán con una calificación de

"DESCONOCIDO" en la nueva WABA.

### 11

```
Las empresas deberán restablecer la calidad
```
de las plantillas con el tiempo a través de una mensajería consistente y de alta calidad.

La afirmación explícita de que las calificaciones de calidad de las plantillas se

restablecen a "DESCONOCIDO" no es solo un detalle técnico; tiene implicaciones

comerciales significativas. La plataforma de WhatsApp depende en gran medida de las

calificaciones de calidad de las plantillas para determinar los límites de mensajería, la

entregabilidad y la reputación general de la empresa. Un reinicio significa que, incluso

si las plantillas están disponibles, su rendimiento y alcance iniciales podrían verse

afectados hasta que se establezcan nuevas métricas de calidad a través de la

interacción del usuario. Los PTV deben aconsejar proactivamente a sus clientes sobre

estrategias para reconstruir rápidamente una alta calidad de plantillas. Esto podría

implicar enviar inicialmente mensajes altamente atractivos y personalizados a una

audiencia más pequeña y receptiva, monitorear de cerca los comentarios de los

usuarios y evitar prácticas que puedan generar señales negativas. Esto transforma un

detalle técnico posterior a la migración en un imperativo operativo estratégico para

mantener una comunicación efectiva.

Aunque el registro del número de teléfono suele ser instantáneo, la duplicación y

reindexación de las plantillas pueden llevar algún tiempo. Para minimizar el posible

tiempo de inactividad en el uso de las plantillas, los PTV pueden iniciar el proceso de

migración de plantillas _antes_ del registro del número de teléfono, si las APIs de Meta lo

permiten.

### 11

**6.3. Minimización del Tiempo de Inactividad y Manejo de Mensajes en Cola**

Si el proceso de migración se ejecuta correctamente, la transferencia real del número

de teléfono entre WABAs o entornos de API suele tardar solo unos segundos. Esto

resulta en una interrupción mínima o, en muchos casos, prácticamente inexistente del

servicio de WhatsApp.

### 9

Cualquier mensaje enviado al número migrado durante el breve período de transición

es típicamente puesto en cola por los sistemas de Meta. Estos mensajes se entregan


luego a la nueva WABA una vez que el proceso de migración se completa por completo

y el número está activo en su nuevo entorno.

### 3

## 7. Solución de Problemas Comunes de Migración

Esta sección abordará los problemas más frecuentes encontrados durante la migración

de números de WhatsApp Business, proporcionando soluciones prácticas y

accionables para que los Proveedores de Tecnología diagnostiquen y resuelvan estos

problemas de manera eficiente.

**7.1. Abordar Fallos de 2FA**

El problema más común es que el proceso de migración no se completa, a menudo con

un error que indica que la Verificación en Dos Pasos (2FA) todavía está activa en el

número de teléfono.

### 16

```
La solución inmediata es asegurarse de que la 2FA esté
```
desactivada en el número de teléfono. Si el cliente es el propietario de la WABA, puede

hacerlo a través de su Administrador Comercial de Meta. Si el número es gestionado

por un Proveedor de Soluciones anterior, el cliente debe ponerse en contacto con ese

proveedor y solicitarle que desactive la 2FA.

### 12

```
Los intentos de migración solo deben
```
reintentarse una vez que se confirme que la 2FA está desactivada.

**7.2. Problemas de Entrega de OTP**

Otro problema frecuente es que el código de verificación de Contraseña de Un Solo

Uso (OTP) de 6 dígitos, esencial para verificar la propiedad del número de teléfono, no

llega a través del método elegido (SMS o llamada de voz).

### 16

```
Se debe aconsejar al
```
cliente que pruebe el método de entrega de código alternativo (por ejemplo, si falla el

SMS, intente la llamada de voz, o viceversa). Además, asegúrese de que el número de

teléfono sea capaz de recibir SMS o llamadas de voz internacionales, ya que el sistema

de verificación de Meta puede originarse desde números internacionales.

### 16

**7.3. Número Aparece Desconectado Después de la Migración**

Si después de la migración, el número de teléfono aparece desconectado o fuera de

línea en el panel del nuevo sistema

### 16

```
, primero se deben verificar todos los detalles
```
comerciales dentro del Administrador Comercial de Meta, asegurándose

particularmente de que la URL del sitio web asociada con la empresa sea correcta,

activa y accesible.

### 7

```
Si se migra desde un proveedor específico como Genesys Engage
```
a Genesys Cloud, se recomienda eliminar la antigua integración de WhatsApp de la


plataforma de origen y esperar de 1 a 2 minutos antes de proceder con la nueva

migración para permitir que el número se desconecte por completo.

### 4

**7.4. Plantillas Faltantes Después de la Migración**

Es posible que algunas plantillas de mensajes que estaban presentes en la antigua

WABA no sean visibles o estén disponibles en la nueva WABA después de la

migración.

### 16

```
Es importante tener en cuenta que solo las plantillas de mensajes
```
_aprobadas_ se transfieren automáticamente durante la migración. Cualquier plantilla que

estuviera en estado pendiente, rechazada o borrador en el momento de la migración no

se moverá y debe volver a enviarse manualmente para su aprobación en la nueva

### WABA.

### 12

**7.5. Mensajes que No Llegan al Nuevo Sistema**

Si después de la migración, hay problemas con el flujo de mensajes, ya sea que los

mensajes entrantes no sean recibidos por la aplicación del PTV o que los mensajes

salientes no se envíen

### 16

```
, el paso principal de solución de problemas es verificar que la
```
aplicación del PTV esté correctamente suscrita a los webhooks en la

_nueva_ WABA del cliente.

### 5

```
Las configuraciones incorrectas de webhooks son una causa
```
común de fallos en los mensajes entrantes. Además, confirme que todos los tokens de

API estén actualizados y configurados correctamente dentro de las integraciones del

### PTV.

### 16

```
Se debe realizar una verificación completa del estado del cliente de la API y de
```
los webhooks.

### 9

Muchos de los problemas comunes de migración son prevenibles, ya que a menudo se

derivan de una falta de validación previa a la migración o de pasos de configuración

posteriores a la migración que se pasan por alto. Esto implica que los PTV deberían ir

más allá de simplemente proporcionar pasos para la solución de problemas. Deben

desarrollar e implementar listas de verificación robustas previas a la migración y

herramientas de validación automatizadas dentro de sus plataformas. Al guiar a los

clientes a través de estos requisitos previos y pasos de verificación posteriores a la

migración _antes_ de que surjan los problemas, los PTV pueden reducir

significativamente la sobrecarga de soporte, mejorar la satisfacción del cliente y

asegurar una experiencia de migración más fluida y predecible. Esto cambia el enfoque

de la resolución reactiva de problemas a la prevención proactiva.


## Conclusión: Facilitando Migraciones Fluidas de la API de

## WhatsApp Business

Este informe confirma que la migración de números existentes de WhatsApp Business

a la API Cloud es totalmente compatible con Meta. El flujo de Embedded Signup,

habilitado por OAuth2, se destaca como el método más optimizado y recomendado

para los Proveedores de Tecnología Verificados. Se ha subrayado el papel crítico de los

requisitos previos, como la desactivación de la Verificación en Dos Pasos, la necesidad

de permisos específicos de la API (whatsapp_business_management,

whatsapp_business_messaging), y la importancia de la verificación posterior a la migración

y las actualizaciones de integración.

Al dominar estas capacidades de migración, particularmente la función de

"Coexistencia" para los usuarios de la WhatsApp Business App, los Proveedores de

Tecnología Verificados pueden ofrecer un valor sin precedentes a las empresas. Esto

permite transiciones más fluidas y menos disruptivas para los clientes, preservando el

valioso historial de chat y liberando todo el potencial de escalabilidad y las funciones

avanzadas de la WhatsApp Business Platform. Esto posiciona a los PTV como socios

esenciales en los viajes de transformación digital de sus clientes.

La WhatsApp Business Platform está en constante evolución, y Meta introduce

continuamente nuevas características y refina los procesos existentes. Para los

Proveedores de Tecnología, mantenerse al tanto de estas actualizaciones e integrar las

mejores prácticas es crucial para proporcionar soluciones de vanguardia y mantener

una ventaja competitiva en el dinámico panorama de la mensajería empresarial.

Adoptar procesos de migración automatizados, seguros y centrados en el cliente será

clave para el éxito a largo plazo.


