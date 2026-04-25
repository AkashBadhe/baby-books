# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---- React Native core ----
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# React Native New Architecture / TurboModules / Fabric
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# expo-modules / Expo
-keep class expo.modules.** { *; }
-keep class com.expo.** { *; }
-dontwarn expo.modules.**

# expo-av (audio/video)
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**

# expo-local-authentication (biometrics)
-keep class androidx.biometric.** { *; }

# expo-navigation-bar
-keep class androidx.core.view.WindowInsetsControllerCompat { *; }

# expo-keep-awake
-keep class android.os.PowerManager { *; }

# Kotlin
-keep class kotlin.** { *; }
-keepclassmembers class kotlin.Metadata { *; }
-dontwarn kotlin.**

# Prevent stripping of JS interface methods referenced by name
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}

# Keep line numbers for better crash reports in Play Console
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Add any project specific keep options here:
