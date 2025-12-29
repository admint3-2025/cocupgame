# GuessUp - Juego de Adivinanzas para Android

Un divertido juego de adivinar palabras con pistas de amigos, desarrollado con React Native y Expo.

## 🎮 Características

- ✅ Detección de inclinación del dispositivo (acelerómetro)
- ✅ Banco de palabras en múltiples categorías
- ✅ Temporizador de 60 segundos
- ✅ Contador de palabras correctas y pasadas
- ✅ Interfaz colorida y atractiva
- ✅ 100% gratuito - sin costos de desarrollo

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js instalado (descargar de https://nodejs.org/)
- Un smartphone Android para probar

### Pasos para ejecutar:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el proyecto:**
   ```bash
   npm start
   ```

3. **Probar en tu teléfono:**
   - Descarga la app "Expo Go" desde Google Play Store (gratis)
   - Escanea el código QR que aparece en la terminal
   - ¡El juego se cargará en tu teléfono!

## 📱 Cómo Jugar

1. Coloca el teléfono en tu frente (como en la imagen)
2. Tu amigo te dará pistas sobre la palabra
3. **Inclina el teléfono hacia arriba** para pasar a la siguiente palabra
4. **Inclina el teléfono hacia abajo** cuando adivines correctamente
5. ¡Adivina tantas palabras como puedas en 60 segundos!

## 🎯 Categorías de Palabras

- **Animales:** León, Elefante, Jirafa, etc.
- **Películas:** Titanic, Matrix, Avatar, etc.
- **Objetos:** Teléfono, Computadora, Reloj, etc.
- **Profesiones:** Doctor, Profesor, Ingeniero, etc.
- **Acciones:** Bailar, Cantar, Correr, etc.

## 🛠️ Tecnologías Utilizadas

- React Native
- Expo (para facilitar el desarrollo)
- Expo Sensors (acelerómetro)
- 100% JavaScript

## 📦 Compilar para Android

Para crear un APK e instalar en cualquier Android:

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

(La primera vez te pedirá crear una cuenta gratuita en Expo)

## 🎨 Personalización

Puedes agregar más palabras editando el archivo `src/data/words.js`

## 📝 Licencia

Este proyecto es de código abierto y gratuito para usar, modificar y compartir.

---

Desarrollado con ❤️ usando tecnologías 100% gratuitas
