// Firebase Configuration
// Using existing ellisbell Firebase project

const firebaseConfig = {
  apiKey: "AIzaSyDfo45UBu-pR8nqMQhVlS_QgyYZ2kzBdvM",
  authDomain: "ellisbell-c185c.firebaseapp.com",
  projectId: "ellisbell-c185c",
  storageBucket: "ellisbell-c185c.firebasestorage.app",
  appId: "1:441560045695:web:94e51a006663404b8f474a"
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
