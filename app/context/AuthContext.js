import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/firebase/authService';

const AuthContext = createContext();
const firestore = getFirestore();

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
    const fetchAndSetUser = async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              username: userData.username,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              friends: userData.friends || [],
              friendRequests: userData.friendRequests || [],
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
    };

    let userDocUnsubscribe = null;
    let currentUid = null;
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      await fetchAndSetUser(firebaseUser);
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }
      if (firebaseUser) {
        currentUid = firebaseUser.uid;
        const userDocRef = doc(firestore, 'users', currentUid);
        const { onSnapshot } = require('firebase/firestore');
        userDocUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser((prev) => prev ? {
              ...prev,
              username: userData.username,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              friends: userData.friends || [],
              friendRequests: userData.friendRequests || [],
            } : null);
          }
        });
      }
    });

    return () => {
      unsubscribe && unsubscribe();
      userDocUnsubscribe && userDocUnsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    login: authService.loginUser,
    logout: authService.logoutUser,
    register: authService.createUser,
    updateUser: authService.updateUser,
    sendFriendRequest: authService.sendFriendRequest,
    acceptFriendRequest: authService.acceptFriendRequest,
    rejectFriendRequest: authService.rejectFriendRequest,
    sendGroupInvitation: authService.sendGroupInvitation,
    acceptGroupInvitation: authService.acceptGroupInvitation,
    rejectGroupInvitation: authService.rejectGroupInvitation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};