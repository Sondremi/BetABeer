import { doc, getDoc, getFirestore, onSnapshot, updateDoc } from 'firebase/firestore';
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
          const userRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const normalizedFirestoreEmail = String(userData.email || '').trim().toLowerCase();
            const normalizedAuthEmail = String(firebaseUser.email || '').trim().toLowerCase();

            if (normalizedAuthEmail && normalizedAuthEmail !== normalizedFirestoreEmail) {
              try {
                await updateDoc(userRef, {
                  email: String(firebaseUser.email || '').trim(),
                  emailLower: normalizedAuthEmail,
                });
              } catch (syncError) {
                console.error('Feil ved synk av e-post fra auth til Firestore:', syncError);
              }
            }

            setUser({
              id: firebaseUser.uid,
              username: userData.username,
              name: userData.name,
              email: firebaseUser.email || userData.email,
              phone: userData.phone,
              profileImage: userData.profileImage || null,
            });
          }
          else {
            // Keep authenticated state even if Firestore user doc is not yet available.
            setUser({
              id: firebaseUser.uid,
              username: '',
              name: '',
              email: firebaseUser.email || '',
              phone: null,
              profileImage: null,
            });
          }
        } catch (error) {
          console.error('Feil ved henting av brukerdata:', error);
          setUser({
            id: firebaseUser.uid,
            username: '',
            name: '',
            email: firebaseUser.email || '',
            phone: null,
            profileImage: null,
          });
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
        userDocUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser((prev) => ({
              id: currentUid,
              username: userData.username,
              name: userData.name,
              email: firebaseUser.email || userData.email,
              phone: userData.phone,
              profileImage: userData.profileImage || null,
            }));
          } else {
            // The Firestore profile may be created shortly after auth signup.
            setUser((prev) => prev || {
              id: currentUid,
              username: '',
              name: '',
              email: firebaseUser.email || '',
              phone: null,
              profileImage: null,
            });
          }
        }, (error) => {
          console.error('Feil ved onSnapshot for brukerdata: ', error);
          setUser((prev) => prev);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};