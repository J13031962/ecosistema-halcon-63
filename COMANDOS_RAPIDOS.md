# 🚀 Comandos Rápidos - Capacitor Android

## Instalación Inicial (Solo una vez)
```bash
# 1. Instalar dependencias
npm install

# 2. Inicializar Capacitor (si aún no está)
npx cap init

# 3. Agregar Android
npx cap add android
```

## Desarrollo Diario
```bash
# Build + Sync + Abrir Android Studio
npm run build && npx cap sync android && npx cap open android
```

## Comandos Individuales
```bash
# Build del proyecto
npm run build

# Sincronizar cambios con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android

# Actualizar Capacitor
npx cap update android

# Ver logs del dispositivo
npx cap run android -l
```

## Generar APK/AAB
```bash
# 1. Build de producción
npm run build

# 2. Sync
npx cap sync android

# 3. Abrir Android Studio
npx cap open android

# 4. En Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle
```

## Limpiar Build
```bash
# Si tienes problemas
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Actualizar Versión
```bash
# Editar: android/app/build.gradle
# Incrementar:
#   versionCode 2
#   versionName "1.0.1"
```

## Probar en Dispositivo
```bash
# Con dispositivo conectado por USB
npx cap run android

# Con logs en tiempo real
npx cap run android -l
```

## Comandos de Android Studio
```bash
# Instalar apk en dispositivo conectado
adb install -r app-debug.apk

# Ver logs del dispositivo
adb logcat

# Lista dispositivos conectados
adb devices

# Desinstalar app
adb uninstall com.teleguardia.halcon
```

## Debugging
```bash
# Ver errores de build
./android/gradlew build --stacktrace

# Limpiar cache de npm
npm cache clean --force
rm -rf node_modules
npm install
```

## Configuración Rápida para Producción
1. Comentar `server.url` en `capacitor.config.ts`
2. `npm run build`
3. `npx cap sync android`
4. Abrir Android Studio
5. Build → Generate Signed Bundle
