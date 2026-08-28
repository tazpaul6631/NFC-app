import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.jiahsin.bus',
  appName: 'Bus Check-in',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    CapacitorSQLite: {
      iosIsEncryption: false,
      iosKeychainPrefix: 'vip',
      androidIsEncryption: false,
      logging: false,
    },
    SplashScreen: {
      launchAutoHide: false,
    },
    // Cap 8: inject --safe-area-inset-* into the WebView (needed on Android)
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT',
    },
    // Older Android only; ignored on Android 15+ (edge-to-edge enforced)
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
    },
  },
  // server: {
  //   url: 'http://10.0.149.28:8100',
  //   cleartext: true, // Cho phép chạy HTTP (không cần HTTPS)
  //   allowNavigation: ['10.0.149.28']
  // }
}

export default config
