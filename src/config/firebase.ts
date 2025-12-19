// This file is used to configure the Firebase project.
// It is recommended to use environment variables to store the configuration.
// Create a .env.local file in the root of your project and add the following:
//
// NEXT_PUBLIC_FIREBASE_API_KEY=...
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
// NEXT_PUBLIC_FIREBASE_APP_ID=...

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Check that all environment variables are set
for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value || value.startsWith('YOUR_')) {
        console.error(`Firebase config value "${key}" is not set. Please check your firebase config.`);
    }
}

export default firebaseConfig;
