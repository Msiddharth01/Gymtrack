import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  getReactNativePersistence, 
  initializeAuth 
} from "firebase/auth";
import { initializeFirestore, enableNetwork } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDkjMR7SCWHKkrO7M9suXTwhIC6c7xl-QQ",
  authDomain: "fittrackai-61278.firebaseapp.com",
  projectId: "fittrackai-61278",
  storageBucket: "fittrackai-61278.firebasestorage.app",
  messagingSenderId: "740867048853",
  appId: "1:740867048853:web:2903a5029be63444fe229c"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: Platform.OS !== "web",
});
enableNetwork(db);

export { auth };
