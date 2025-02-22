// pages/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import styles from '../styles/SplashScreen.module.css';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let firebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export default function SplashScreen() {
  const [fade, setFade] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setFade(1); // Start the fade-in animation
    const checkServerAndLoginStatus = async () => {
      try {
        const response = await fetch('https://sunosynth.onrender.com/', { timeout: 5000 }); // Timeout of 5 seconds
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'Server is active') {
            checkLoginStatus();
            return;
          }
        }
        setErrorMessage("Server is unreachable");
      } catch (error) {
        console.error("Error checking server status:", error);
        setErrorMessage("Server is unreachable");
      }
    };
    const checkLoginStatus = async () => {
      try {
        if (!firebaseApp) {
          console.warn("Firebase not initialized properly.  Check your environment variables and Firebase configuration.");
          setErrorMessage("Firebase configuration error. Check console.");
          return;
        }
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            router.push('/dashboard'); // Navigate to dashboard
          } else {
            router.push('/login'); // Navigate to login
          }
        });
      } catch (error) {
        console.error("Authentication error:", error);
        setErrorMessage(`Authentication error: ${error.message}`);
      }
    };
    checkServerAndLoginStatus();
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.splashScreen} style={{ opacity: fade }}>
        <div className={styles.logo}>
          <span>Suno</span>
          <span>Synth</span>
        </div>
        {errorMessage && (
          <div className={styles.error}>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}