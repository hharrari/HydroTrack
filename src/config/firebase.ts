// This file is used to configure the Firebase project.

const firebaseConfig = {
  projectId: "studio-3993683728-fa9f1",
  appId: "1:939205078514:web:71abd8bf5f8f1f30ad0f6b",
  apiKey: "AIzaSyCwGVZLp0Tu_CslSd2cLX2uErM-4ZZAda8",
  authDomain: "studio-3993683728-fa9f1.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "939205078514",
  storageBucket: "studio-3993683728-fa9f1.appspot.com"
};

// Check that all environment variables are set
for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value && key !== 'measurementId') {
        console.error(`Firebase config value "${key}" is not set. Please check your firebase config.`);
    }
}

export default firebaseConfig;
