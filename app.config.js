import 'dotenv/config';

export default {
  expo: {
    name: process.env.APP_VARIANT === 'development' ? 'Algebro (Dev)' : 'Algebro',
    slug: 'algebro',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router'
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      problemsLatestUrl: process.env.EXPO_PUBLIC_PROBLEMS_LATEST_URL || '',
      eas: {
        projectId: "11d26774-eebd-4426-aa12-064a3460fc6a"
      }
    }
  }
};

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return "com.davidtowers.algebro.dev";
    }
    if (IS_PREVIEW) {
        return "com.davidtowers.algebro.preview";
    }
    return "com.davidtowers.algebro";
};

const getAppName = () => {
    if (IS_DEV) {
        return "Algebro Dev";
    }
    if (IS_PREVIEW) {
        return "Algebro Preview";
    }
    return "Algebro";
};
