"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Firebase configuration (ensure this is only done once)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


// Initialize Firebase (ensure this is only done once)
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

export default function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    // Listen for Firebase auth state changes for debugging
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase user signed in:", firebaseUser.uid);
      } else {
        console.log("No Firebase user signed in.");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Clerk state in FirebaseAuthProvider:", { isLoaded, user });
    if (!isLoaded || !user) {
      console.log("Clerk session not ready; skipping Firebase sign-in.");
      return;
    }

    async function signInToFirebase() {
      try {
        // Call the API endpoint to get the custom Firebase token
        const res = await fetch("api/firebase-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // send cookies so Clerk session is recognized
        });
        const data = await res.json();
        console.log("Response from /api/firebase-token:", data);
        if (data.firebaseToken) {
          const credential = await signInWithCustomToken(firebaseAuth, data.firebaseToken);
          // Force token refresh so any custom claims are applied
          await credential.user.getIdToken(true);
          console.log("Firebase sign-in successful, UID:", credential.user.uid);
          // Optionally, update custom claims:
          const claimRes = await fetch("/api/setFirebaseCustomClaims", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          console.log("Response from /api/setFirebaseCustomClaims:", await claimRes.json());
        } else {
          console.error("No Firebase token received:", data);
        }
      } catch (error) {
        console.error("Error during Firebase sign-in:", error);
      }
    }

    signInToFirebase();
  }, [isLoaded, user]);

  return <>{children}</>;
}
