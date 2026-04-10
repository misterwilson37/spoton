// Firebase Configuration
// Using existing ellisbell Firebase project

const firebaseConfig = {
  apiKey: "AIzaSyDwfaJB8LVa6NX2kOPI7j4pCmQyiH3H4Lc",
  authDomain: "spot-on-games.firebaseapp.com",
  projectId: "spot-on-games",
  storageBucket: "spot-on-games.firebasestorage.app",
  messagingSenderId: "77896599950",
  appId: "1:77896599950:web:3df9ec887881b57ba13cdf",
  measurementId: "G-ZH4C895G2G"
};


// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
