// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore} from 'firebase/firestore' 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "inventory-management-b3ea6.firebaseapp.com",
  projectId: "inventory-management-b3ea6",
  storageBucket: "inventory-management-b3ea6.appspot.com",
  messagingSenderId: "996127832596",
  appId: "1:996127832596:web:372714ab034811f2cb4501",
  measurementId: "G-8NXCGDHH18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const firestore = getFirestore(app);

export {firestore}