import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth } from './FirebaseConfig';

const firestore = getFirestore();

export const authService = {
  createUser: async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const user = userCredential.user;
      await setDoc(doc(firestore, 'users', user.uid), {
        username: userData.username,
        name: userData.name,
        email: userData.email,
        phone: userData.phone ?? null,
        weight: userData.weight ?? null,
        gender: userData.gender ?? null,
        friends: [],
        groups: [],
        createdAt: serverTimestamp(),
      });
      return {
        id: user.uid,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        phone: userData.phone ?? null,
        weight: userData.weight ?? null,
        gender: userData.gender ?? null, 
      };
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error('Kunne ikke opprette bruker');
    }
  },

  loginUser: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: user.uid,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          weight: userData.weight,
          gender: userData.gender,
          friends: userData.friends || [],
          groups: userData.groups || [],
        };
      }
      throw new Error('Brukerdata ikke funnet');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Kunne ikke logge inn');
    }
  },

  logoutUser: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Kunne ikke logge ut');
    }
  },

  getCurrentUser: () => {
    return auth.currentUser;
  },

  updateUser: async (userId, updateData) => {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      return updateData;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Kunne ikke oppdatere bruker');
    }
  },

  deleteUser: async (userId) => {
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await currentUser.delete();
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error('Kunne ikke slette bruker');
    }
  },

  checkUsernameExists: async (username) => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Check username error:', error);
      throw new Error('Kunne ikke sjekke brukernavn');
    }
  },

  onAuthStateChanged: (callback) => {
    return firebaseOnAuthStateChanged(auth, callback);
  },
};