# 🐧 Guía Paso a Paso: Subir App a Google Play desde Servidor Ubuntu

## 📋 IMPORTANTE: Requisitos del Servidor Ubuntu

**ADVERTENCIA**: Para compilar aplicaciones Android necesitas un entorno con interfaz gráfica. 
- Si tu servidor Ubuntu es **sin interfaz gráfica** (headless), necesitarás una máquina local con Ubuntu Desktop, Windows o Mac.
- Android Studio **requiere interfaz gráfica** para generar el APK/AAB firmado.

**Solución recomendada**: Usar tu máquina local para la compilación y el servidor solo para hosting.

---

## 🎯 OPCIÓN 1: Compilar en Máquina Local (RECOMENDADO)

### Paso 1: Exportar Proyecto desde Lovable
```bash
# En Lovable web:
# 1. Click en "GitHub" (arriba a la derecha)
# 2. "Connect to GitHub"
# 3. "Create Repository"
```

### Paso 2: En tu Máquina Local (Windows/Mac/Ubuntu Desktop)
```bash
# Clonar repositorio
git clone https://github.com/TU-USUARIO/TU-REPO.git
cd TU-REPO

# Instalar dependencias
npm install
```

### Paso 3: Configurar Capacitor
```bash
# Las dependencias ya están instaladas, ahora inicializa
npx cap init

# Responde:
# App name: Halcón Teleguardia
# App ID: com.teleguardia.halcon
# Web directory: dist
```

### Paso 4: Agregar Plataforma Android
```bash
npx cap add android
```

### Paso 5: Configurar Variables de Entorno
```bash
# Crear archivo .env en la raíz (si no existe)
echo "VITE_SUPABASE_URL=https://junctwbyjtjhwjjioytc.supabase.co" >> .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bmN0d2J5anRqaHdqamlveXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODY2MjQsImV4cCI6MjA3MDc2MjYyNH0.8atLoOXuQXwDUnFog-rhYBBdCK_Cp3vi6TZAyNdqtG0" >> .env
```

### Paso 6: Editar capacitor.config.ts
```bash
nano capacitor.config.ts
```

Asegúrate de que la sección `server` esté comentada:
```typescript
server: {
  // Para producción estas líneas deben estar comentadas
  // url: 'https://tu-servidor.com',
  // cleartext: true
}
```

### Paso 7: Configurar Permisos Android
```bash
nano android/app/src/main/AndroidManifest.xml
```

Agrega estos permisos ANTES de `<application>`:
```xml
<!-- GPS -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Cámara (QR) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Notificaciones -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

Dentro de `<application>` agrega:
```xml
android:usesCleartextTraffic="true"
```

### Paso 8: Build de Producción
```bash
npm run build
npx cap sync android
```

### Paso 9: Generar Keystore (Solo primera vez)
```bash
keytool -genkey -v -keystore halcon-release-key.keystore -alias halcon -keyalg RSA -keysize 2048 -validity 10000
```

Completa:
- **Password**: [Crea una y GUÁRDALA]
- **Nombre**: Teleguardia
- **Organización**: Teleguardia
- **Ciudad**: [Tu ciudad]
- **Estado**: [Tu estado/región]
- **Código país**: CL

**IMPORTANTE**: Guarda este archivo y la contraseña. Son IRREEMPLAZABLES.

### Paso 10: Configurar Firma en build.gradle
```bash
nano android/app/build.gradle
```

Busca `android {` y agrega dentro:
```gradle
signingConfigs {
    release {
        storeFile file('../../halcon-release-key.keystore')
        storePassword 'TU_PASSWORD_AQUI'
        keyAlias 'halcon'
        keyPassword 'TU_PASSWORD_AQUI'
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

### Paso 11: Instalar Android Studio
**Windows/Mac**: Descarga desde https://developer.android.com/studio

**Ubuntu Desktop**:
```bash
sudo snap install android-studio --classic
```

### Paso 12: Abrir Proyecto en Android Studio
```bash
npx cap open android
```

O manualmente: Abre Android Studio → Open → Selecciona la carpeta `android/`

### Paso 13: Generar AAB Firmado

En Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Selecciona **Android App Bundle**
3. Click **Next**
4. **Key store path**: Selecciona `halcon-release-key.keystore`
5. **Key store password**: Tu contraseña
6. **Key alias**: halcon
7. **Key password**: Tu contraseña
8. **Build variant**: release
9. Click **Finish**

El archivo se genera en:
```
android/app/release/app-release.aab
```

---

## 🎯 OPCIÓN 2: Compilar desde Servidor Ubuntu SIN Interfaz Gráfica

Si tu servidor NO tiene interfaz gráfica, puedes generar el AAB por línea de comandos:

### Requisitos Adicionales en Ubuntu Server
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Java JDK 17
sudo apt install openjdk-17-jdk -y

# Verificar Java
java -version

# Instalar Android SDK Command Line Tools
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
rm commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest

# Configurar variables de entorno
echo 'export ANDROID_HOME=~/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# Aceptar licencias
yes | sdkmanager --licenses

# Instalar Build Tools y Platform
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

### Clonar y Preparar Proyecto
```bash
# Ir a tu directorio de proyectos
cd /var/www  # o donde tengas tus proyectos

# Clonar desde GitHub
git clone https://github.com/TU-USUARIO/TU-REPO.git halcon-app
cd halcon-app

# Instalar Node.js 18+ si no lo tienes
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versión
node -v
npm -v

# Instalar dependencias
npm install
```

### Configurar y Build
```bash
# Inicializar Capacitor
npx cap init

# Agregar Android
npx cap add android

# Crear keystore
keytool -genkey -v -keystore halcon-release-key.keystore -alias halcon -keyalg RSA -keysize 2048 -validity 10000

# Configurar build.gradle (igual que antes)
nano android/app/build.gradle

# Build
npm run build
npx cap sync android
```

### Generar AAB por Línea de Comandos
```bash
# Ir a carpeta android
cd android

# Limpiar build anterior
./gradlew clean

# Generar AAB firmado
./gradlew bundleRelease

# El AAB estará en:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Descargar AAB a tu Máquina Local
```bash
# Desde tu máquina local, usa SCP
scp usuario@tu-servidor:/ruta/al/proyecto/android/app/build/outputs/bundle/release/app-release.aab ~/Desktop/

# O usa FileZilla/WinSCP
```

---

## 🏪 PASO FINAL: Subir a Google Play Console

### 1. Crear Cuenta Developer
- Ve a https://play.google.com/console
- Paga $25 USD (único pago de por vida)
- Completa tu perfil

### 2. Crear Nueva App
- Click **Crear aplicación**
- Nombre: **Halcón Teleguardia**
- Idioma: **Español**
- Tipo: **Aplicación**
- Gratuita/Pago: **Gratuita**

### 3. Completar Ficha de la Tienda

#### Descripción Corta:
```
Sistema de gestión de seguridad, alarmas y patrullaje en tiempo real
```

#### Descripción Completa:
```
Halcón Teleguardia - Sistema integral de gestión de operaciones de seguridad

🚨 FUNCIONES PRINCIPALES:
• Gestión de alarmas en tiempo real
• Rastreo GPS de patrullas y supervisores
• Scanner QR para verificación de rondas
• Control de turnos y personal
• Reportes ejecutivos y estadísticas
• Dashboard con métricas en vivo

👥 Roles: Operadores, Supervisores, Despachadores, Directores, Administradores

🔒 Seguridad robusta con autenticación y roles configurables
```

### 4. Recursos Gráficos

Necesitas:
- **Icono**: 512x512 px (usa halcon-eyes-logo.png)
- **Screenshots**: Mínimo 2, tamaño 1080x1920 px
- **Banner** (opcional): 1024x500 px

### 5. Subir AAB
1. **Producción** → **Crear nueva versión**
2. Sube `app-release.aab`
3. Completa notas de la versión:
```
Versión inicial de Halcón Teleguardia
- Gestión de alarmas
- Rastreo GPS
- Scanner QR
- Dashboard operativo
```
4. **Revisar versión** → **Iniciar lanzamiento**

### 6. Completar Cuestionarios
Google te pedirá:
- **Política de privacidad**: URL (puedes crearla en tu servidor)
- **Clasificación de contenido**
- **Público objetivo**: Mayores de 18
- **Permisos**: Explica por qué usas GPS y cámara

### 7. Esperar Aprobación
- Tiempo: 3-7 días
- Recibirás emails sobre el estado
- Si hay problemas, Google te dirá qué corregir

---

## 🔄 Para Actualizaciones Futuras

```bash
# 1. Hacer cambios en código
# 2. Commit y push a GitHub
git add .
git commit -m "Actualización v1.0.1"
git push

# 3. En servidor o local
git pull
npm run build
npx cap sync android

# 4. Editar version en build.gradle
nano android/app/build.gradle
# Incrementa versionCode y versionName

# 5. Generar nuevo AAB
cd android
./gradlew bundleRelease

# 6. Subir a Google Play como nueva versión
```

---

## ⚠️ Errores Comunes y Soluciones

### Error: "SDK location not found"
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### Error: Java version
```bash
sudo update-alternatives --config java
# Selecciona Java 17
```

### Error: Gradle build failed
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Error: Permission denied
```bash
chmod +x android/gradlew
```

---

## 📦 Resumen de Archivos Importantes

```
TU-PROYECTO/
├── capacitor.config.ts          ← Configuración de Capacitor
├── halcon-release-key.keystore  ← TU LLAVE (NUNCA SUBIR A GIT)
├── android/
│   ├── app/
│   │   ├── build.gradle         ← Versión y firma
│   │   └── src/main/
│   │       └── AndroidManifest.xml  ← Permisos
│   └── build/outputs/bundle/release/
│       └── app-release.aab      ← Archivo para Google Play
```

---

## ✅ Checklist Final

- [ ] Keystore generado y guardado
- [ ] Contraseñas guardadas en lugar seguro
- [ ] Permisos configurados en AndroidManifest.xml
- [ ] build.gradle configurado con firma
- [ ] AAB generado exitosamente
- [ ] Iconos preparados (512x512)
- [ ] Screenshots tomados (mínimo 2)
- [ ] Descripción de la app escrita
- [ ] Política de privacidad lista
- [ ] Cuenta de Google Play creada ($25)

---

¡Éxito con tu publicación! 🚀

Si tienes dudas en cualquier paso, pregúntame.
