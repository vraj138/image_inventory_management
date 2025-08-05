// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore} from 'firebase/firestore' 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "inventory-management-b3ea6.firebaseapp.com",
  projectId: "inventory-management-b3ea6",
  storageBucket: "inventory-management-b3ea6.firebasestorage.app",
  messagingSenderId: "996127832596",
  appId: "1:996127832596:web:372714ab034811f2cb4501",
  measurementId: "G-8NXCGDHH18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, firestore, googleProvider };