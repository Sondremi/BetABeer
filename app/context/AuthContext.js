import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/firebase/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth må brukes innenfor AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              username: userData.username,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
            });
          }
        } catch (error) {
          console.error('Feil ved henting av brukerdata:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    login: authService.loginUser,
    logout: authService.logoutUser,
    register: authService.createUser,
    updateUser: authService.updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};