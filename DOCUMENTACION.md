# Documentación de la Pasarela de Pagos (Frontend)

Este documento explica la estructura, el diseño y la lógica del código de la pasarela de pagos construida con HTML, CSS y Vanilla JavaScript.

## 1. Arquitectura del Proyecto

El proyecto está diseñado como una **Single Page Application (SPA)**, lo que significa que el usuario navega entre diferentes pantallas sin necesidad de recargar la página del navegador. 

Los archivos principales son:
- `index.html`: La estructura base de la página. Contiene un contenedor principal (`<main id="app">`) donde se inyectan las diferentes "pantallas" usando JavaScript.
- `styles.css`: La hoja de estilos. Contiene todas las variables de diseño y las reglas CSS necesarias para lograr el aspecto "premium" solicitado.
- `app.js`: Contiene la lógica de enrutamiento y las vistas (HTML en forma de *strings*) que se inyectan en el HTML base.

> **Nota:** Debido a que el entorno actual de Windows no cuenta con Node.js instalado, se descartó el uso de React/Vite para evitar errores de compilación, utilizando en su lugar **HTML/JS/CSS puro**, logrando exactamente el mismo resultado visual y la misma fluidez.

---

## 2. Estilos y Diseño (Glassmorphism & Dark Mode)

Para mantener la fidelidad con la interfaz proporcionada en el enlace de AWS Amplify, se utilizó un enfoque de CSS moderno:

### Variables Globales
En el archivo `styles.css`, dentro del selector `:root`, se definieron los colores principales:
- `--bg-color: #0B1120`: El fondo azul oscuro profundo.
- `--accent-color: #5B44F2`: El color morado/azulado para los botones principales y estados de foco.

### Efecto Glassmorphism
Para las tarjetas flotantes (`.glass-card`), se utilizó la siguiente combinación para simular el vidrio esmerilado:
```css
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
```
Esto crea una tarjeta semi-transparente que desenfoca el fondo (los círculos brillantes).

### Brillos de Fondo (Glows)
Los destellos de luz de fondo se lograron creando dos `div` (`.background-glow`) con la propiedad `radial-gradient` y posicionándolos de manera absoluta en las esquinas de la pantalla.

---

## 3. Lógica de Enrutamiento (app.js)

El archivo `app.js` controla qué se muestra en la pantalla dependiendo de las acciones del usuario. Funciona mediante las siguientes piezas clave:

### Vistas (View Generators)
Cada pantalla es generada por una función que retorna un texto en formato HTML. Por ejemplo:
- `loginView()`: Retorna el HTML del formulario de ingreso de correo.
- `paymentMethodsView()`: Retorna el HTML con los botones de PSE, PayPal y Tarjeta.
- `cardFormView()`: Retorna el formulario detallado de la tarjeta.
- `successView()`: Muestra el mensaje de éxito final.

### Navegación (`navigate(path)`)
Esta función recibe una ruta (como `/login` o `/success`), ejecuta la función de la vista correspondiente y reemplaza el contenido interno del `<main id="app">` en el `index.html`. 

Inmediatamente después, ejecuta un `setTimeout` de 0 ms para llamar a la función `attachEvents(path)`.

### Eventos (`attachEvents(path)`)
Como el HTML se destruye y se vuelve a crear con cada navegación, los detectores de eventos (`EventListeners`) se deben volver a asignar. Esta función se encarga de:
- Escuchar el evento `submit` de los formularios.
- Prevenir la recarga de la página con `e.preventDefault()`.
- Capturar los datos (como dar formato automático a los números de tarjeta y fechas).
- Llamar a `navigate()` para llevar al usuario a la siguiente pantalla simulando el flujo de AWS (Cognito -> API Gateway -> Lambda).

---

## 4. Flujo Simulado de la Arquitectura AWS

El frontend actual simula la conexión con la arquitectura de AWS proporcionada en el diagrama:

1. **Cognito (Login):** Las pantallas de `/` (Identificación), `/verify` (Verificación) y `/auth` (Autenticación) simulan el flujo de MFA y validación de tokens de AWS Cognito.
2. **Pagos (API Gateway & Lambda):** Al seleccionar el método de pago y hacer clic en "Pagar ahora", el evento `submit` intercepta la acción. En un escenario real (producción), aquí se haría un `fetch()` o llamada Axios al endpoint de Amazon API Gateway, el cual invocaría la Lambda `Payment Service`.
3. **Éxito:** Una vez la Lambda responde con un estado HTTP 200, la SPA redirige al usuario a la vista `/success` mostrando *"Su pago fue procesado y aceptado"*.
