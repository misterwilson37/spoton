// Firebase Configuration
// Using existing ellisbell Firebase project

  const firebaseConfig = {
    apiKey: "AIzaSyA0idCPsfQBJjLq7rsEXOrb1fVlzyVuJYA",
    authDomain: "spotongames.firebaseapp.com",
    projectId: "spotongames",
    storageBucket: "spotongames.firebasestorage.app",
    messagingSenderId: "733304601780",
    appId: "1:733304601780:web:cc7062164ca6d978a72be1",
    measurementId: "G-7EX4VJN5P7"
  };


// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
