# AppReporte Mobile

Aplicación móvil ciudadana para reporte de incidentes urbanos.
Desarrollada con Expo / React Native. Permite crear reportes geolocalizados,
explorar incidentes en mapa, y votar para dar visibilidad.

## Stack

| Capa             | Tecnología                 |
|------------------|----------------------------|
| Framework        | Expo SDK 54                |
| UI               | React Native 0.81          |
| Navegación       | Expo Router 6 (file-based) |
| Mapas            | react-native-maps          |
| HTTP             | Axios                      |
| LocalStorage     | AsyncStorage               |
| Ubicación        | expo-location              |
| Cámara/Galería   | expo-image-picker          |
| Lenguaje         | JavaScript + TypeScript    |

## Funcionalidades

- Registro y login con JWT
- Crear reportes con título, categoría, descripción, ubicación GPS y foto
- Mapa interactivo con marcadores por tipo de incidente
- Búsqueda por tipo y radio de distancia
- Votar "yo también veo este incidente"
- Perfil de usuario con cierre de sesión

## Requisitos

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Smartphone con Expo Go o build nativo

## Configuración

IP del backend en `src/services/api.js`:

```javascript
const API_BASE = "http://<TU_IP>:8080/api";
```

## Levantar

```bash
cd reporte-mobile
npm install
npm start
```

Escanea el QR con Expo Go (Android/iOS).

## Estructura del proyecto

```
app/                    # Rutas (Expo Router)
├── (tabs)/             # Tabs: home, explore, profile
├── index.tsx           # Entry point + auth guard
src/
├── components/         # MapComponent, CreateReportModal
├── screens/            # LoginScreen, RegisterScreen
└── services/           # api.js, authService, incidenteService, tokenService
```
