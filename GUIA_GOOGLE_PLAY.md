# Guía Completa: Publicar App Halcón en Google Play Store

## 📋 REQUISITOS PREVIOS

### Software Necesario
- ✅ Node.js (v18 o superior)
- ✅ Android Studio (última versión)
- ✅ Java Development Kit (JDK 17 o superior)
- ✅ Git

### Cuentas y Costos
- Cuenta de Google Play Console: $25 USD (pago único)
- Servidor donde tu aplicación ya está montada

---

## 🚀 PASO 1: Preparar el Proyecto Localmente

### 1.1 Exportar desde Lovable a GitHub
```bash
# En Lovable:
# 1. Click en "GitHub" (esquina superior derecha)
# 2. Click en "Connect to GitHub"
# 3. Autoriza la app de Lovable
# 4. Click en "Create Repository"
```

### 1.2 Clonar el Proyecto
```bash
# Clona tu repositorio
git clone https://github.com/TU-USUARIO/TU-REPO.git
cd TU-REPO

# Instala dependencias
npm install
```

---

## 📱 PASO 2: Configurar Capacitor

### 2.1 Las dependencias ya están instaladas
Las siguientes ya están en tu package.json:
- @capacitor/core
- @capacitor/cli
- @capacitor/android
- @capacitor/camera
- @capacitor/geolocation

### 2.2 Inicializar Capacitor
```bash
npx cap init
```

Cuando te pregunte:
- **App name**: `Halcón Teleguardia`
- **App ID**: `com.teleguardia.halcon`
- **Web asset directory**: `dist`

### 2.3 Agregar Plataforma Android
```bash
npx cap add android
```

---

## ⚙️ PASO 3: Configurar Permisos Android

### 3.1 Editar AndroidManifest.xml
Archivo: `android/app/src/main/AndroidManifest.xml`

Agrega estos permisos antes de la etiqueta `<application>`:

```xml
<!-- Permisos para GPS -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Permisos para Cámara (QR Scanner) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Permisos para Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Permisos para notificaciones -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Características requeridas -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

---

## 🎨 PASO 4: Configurar Iconos y Splash Screen

### 4.1 Iconos de la Aplicación
Necesitas iconos en estos tamaños (en formato PNG):

- **512x512** - Para Google Play Store
- **192x192** - xxxhdpi
- **144x144** - xxhdpi
- **96x96** - xhdpi
- **72x72** - hdpi
- **48x48** - mdpi

Coloca los iconos en:
```
android/app/src/main/res/
  ├── mipmap-xxxhdpi/ic_launcher.png (192x192)
  ├── mipmap-xxhdpi/ic_launcher.png (144x144)
  ├── mipmap-xhdpi/ic_launcher.png (96x96)
  ├── mipmap-hdpi/ic_launcher.png (72x72)
  └── mipmap-mdpi/ic_launcher.png (48x48)
```

**Tip**: Usa tu logo actual `halcon-eyes-logo.png` y redimensiónalo.

### 4.2 Splash Screen
El splash screen ya está configurado en `capacitor.config.ts` con:
- Color de fondo: #1a1f2e
- Sin spinner
- Duración: 2 segundos

---

## 🔧 PASO 5: Configurar Build de Producción

### 5.1 Actualizar capacitor.config.ts
En el archivo `capacitor.config.ts`, asegúrate de que la sección `server` esté comentada para producción:

```typescript
server: {
  // Para desarrollo apunta a tu servidor
  // Para producción comenta estas líneas
  // url: 'https://tu-servidor.com',
  // cleartext: true
}
```

### 5.2 Build del Proyecto
```bash
# Crear build de producción
npm run build

# Sincronizar con Capacitor
npx cap sync android
```

---

## 🔐 PASO 6: Crear Keystore para Firma

### 6.1 Generar Keystore
```bash
# Desde la raíz del proyecto
keytool -genkey -v -keystore halcon-release-key.keystore -alias halcon -keyalg RSA -keysize 2048 -validity 10000
```

Te preguntará:
- **Password**: Crea una contraseña segura (GUÁRDALA)
- **Nombre y apellido**: Teleguardia
- **Unidad organizativa**: Seguridad
- **Organización**: Teleguardia
- **Ciudad**: Tu ciudad
- **Estado**: Tu estado
- **Código de país**: CL (o tu país)

### 6.2 Configurar build.gradle
Archivo: `android/app/build.gradle`

Busca la sección `android { ... }` y agrega dentro de ella:

```gradle
signingConfigs {
    release {
        storeFile file('../../halcon-release-key.keystore')
        storePassword 'TU_PASSWORD'
        keyAlias 'halcon'
        keyPassword 'TU_PASSWORD'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

**IMPORTANTE**: Nunca subas el keystore a GitHub. Agrégalo a `.gitignore`:
```bash
echo "*.keystore" >> .gitignore
```

---

## 📦 PASO 7: Generar APK/AAB para Google Play

### 7.1 Abrir en Android Studio
```bash
npx cap open android
```

### 7.2 Generar AAB (Android App Bundle)
En Android Studio:
1. Click en **Build** → **Generate Signed Bundle / APK**
2. Selecciona **Android App Bundle**
3. Click **Next**
4. Selecciona tu keystore (`halcon-release-key.keystore`)
5. Ingresa las contraseñas
6. Selecciona **release** como build variant
7. Click **Finish**

El AAB se generará en:
```
android/app/release/app-release.aab
```

---

## 🏪 PASO 8: Subir a Google Play Console

### 8.1 Crear Cuenta de Developer
1. Ve a [Google Play Console](https://play.google.com/console)
2. Paga $25 USD (único pago)
3. Completa tu perfil de desarrollador

### 8.2 Crear Nueva Aplicación
1. Click en **Crear aplicación**
2. Nombre: **Halcón Teleguardia**
3. Idioma predeterminado: **Español**
4. Tipo: **App**
5. Categoría: **Negocios** o **Productividad**

### 8.3 Completar Información de la Tienda

#### Descripción Corta (80 caracteres):
```
Sistema de gestión de seguridad, alarmas y patrullaje en tiempo real
```

#### Descripción Completa (4000 caracteres):
```
Halcón Teleguardia es el sistema integral para la gestión de operaciones de seguridad privada.

🚨 CARACTERÍSTICAS PRINCIPALES:

• Gestión de Alarmas en Tiempo Real
  - Recepción y asignación instantánea de alarmas
  - Seguimiento del estado de cada servicio
  - Cronómetro automático de respuesta

• Rastreo GPS de Patrullas
  - Ubicación en tiempo real de supervisores y patrullas
  - Historial de recorridos
  - Optimización de asignaciones

• Scanner QR
  - Verificación de rondas mediante códigos QR
  - Registro automático de visitas
  - Reportes de cumplimiento

• Gestión de Personal
  - Control de turnos
  - Asignación de supervisores
  - Registro de actividades

• Reportes Ejecutivos
  - Dashboard con métricas en tiempo real
  - Estadísticas de rendimiento
  - Análisis de tiempos de respuesta

• Gestión de Clientes
  - Base de datos completa de clientes
  - Historial de servicios
  - Cotizaciones y seguimiento

👥 ROLES DE USUARIO:
- Operadores de Alarmas
- Supervisores Motorizados
- Despachadores
- Directores Técnicos
- Administradores

🔒 SEGURIDAD:
- Autenticación segura
- Roles y permisos configurables
- Sincronización en tiempo real con la base de datos

📊 IDEAL PARA:
- Empresas de seguridad privada
- Centrales de monitoreo
- Equipos de supervisión y patrullaje

Optimiza las operaciones de tu empresa de seguridad con Halcón Teleguardia.
```

#### Screenshots (Necesitas al menos 2):
Tamaño: 1080x1920 (16:9)
- Captura de pantalla de dashboard
- Captura de mapa con patrullas
- Captura de gestión de alarmas
- Captura de lista de clientes

### 8.4 Subir el AAB
1. En la sección **Producción**
2. Click en **Crear nueva versión**
3. Sube el archivo `app-release.aab`
4. Completa las notas de la versión
5. Click en **Revisar versión**
6. Click en **Iniciar lanzamiento en producción**

### 8.5 Completar Cuestionario de Contenido
Google te pedirá información sobre:
- Política de privacidad (necesitas una URL)
- Clasificación de contenido
- Públicos objetivo
- Permisos utilizados (explica GPS, Cámara, etc.)

---

## ⏱️ PASO 9: Esperar Revisión

- **Tiempo de revisión**: 3-7 días normalmente
- Recibirás emails sobre el estado
- Si hay problemas, Google te indicará qué corregir

---

## 🔄 PASO 10: Actualizaciones Futuras

### Cuando necesites actualizar:

```bash
# 1. Hacer cambios en el código
# 2. Hacer build
npm run build

# 3. Sincronizar
npx cap sync android

# 4. Incrementar version en android/app/build.gradle
# Busca:
versionCode 2        # Incrementa este número
versionName "1.0.1"  # Incrementa la versión

# 5. Generar nuevo AAB en Android Studio
# 6. Subir a Google Play Console como nueva versión
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "cleartext traffic not permitted"
En `AndroidManifest.xml`, agrega en `<application>`:
```xml
android:usesCleartextTraffic="true"
```

### Error: GPS no funciona
Verifica que los permisos estén en `AndroidManifest.xml` y que el usuario haya dado permisos en el dispositivo.

### Error: Cámara no funciona
Verifica el permiso `CAMERA` y que `@capacitor/camera` esté instalado.

### Build falla
```bash
# Limpia el build
cd android
./gradlew clean
cd ..

# Vuelve a sincronizar
npx cap sync android
```

---

## 📞 RECURSOS ADICIONALES

- [Documentación Capacitor](https://capacitorjs.com/docs)
- [Google Play Console](https://play.google.com/console)
- [Lovable + Capacitor Guide](https://docs.lovable.dev)

---

## ✅ CHECKLIST FINAL

Antes de subir a Google Play:

- [ ] Iconos en todos los tamaños
- [ ] Screenshots de la app
- [ ] Descripción completa
- [ ] Política de privacidad (URL)
- [ ] Keystore generado y guardado de forma segura
- [ ] AAB firmado generado
- [ ] Permisos configurados correctamente
- [ ] App probada en dispositivo físico
- [ ] Versión incrementada en build.gradle

---

## 💡 CONSEJOS FINALES

1. **Guarda el keystore y las contraseñas**: Si los pierdes, no podrás actualizar la app
2. **Prueba en dispositivos reales**: No solo en emulador
3. **Revisa los permisos**: Explica claramente por qué necesitas GPS y cámara
4. **Política de privacidad**: Es obligatoria, puede ser una página simple en tu sitio web
5. **Screenshots atractivos**: Primera impresión para los usuarios

---

¡Éxito con tu publicación! 🚀
