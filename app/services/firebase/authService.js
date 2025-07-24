import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc, where, arrayUnion, arrayRemove } from 'firebase/firestore';
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
        phone: userData.phone,
        friends: [],
        friendRequests: [],
        createdAt: serverTimestamp(),
      });
      return {
        id: user.uid,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      };
    } catch (error) {
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
          friends: userData.friends || [],
          friendRequests: userData.friendRequests || [],
        };
      }
      throw new Error('Brukerdata ikke funnet');
    } catch (error) {
      throw new Error('Kunne ikke logge inn');
    }
  },

  logoutUser: async () => {
    try {
      await signOut(auth);
    } catch (error) {
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
      throw new Error('Kunne ikke sjekke brukernavn');
    }
  },

  sendFriendRequest: async (fromUserId, toUserId) => {
    try {
      if (fromUserId === toUserId) {
        throw new Error('Kan ikke sende venneforespørsel til deg selv');
      }

      const toUserDocRef = doc(firestore, 'users', toUserId);
      const toUserDoc = await getDoc(toUserDocRef);
      if (!toUserDoc.exists()) {
        throw new Error('Mottaker finnes ikke');
      }

      const toUserData = toUserDoc.data();
      if (toUserData.friends?.includes(fromUserId)) {
        throw new Error('Dere er allerede venner');
      }
      if (toUserData.friendRequests?.some(req => req.from === fromUserId && req.status === 'pending')) {
        throw new Error('Venneforespørsel allerede sendt');
      }

      await updateDoc(toUserDocRef, {
        friendRequests: arrayUnion({
          from: fromUserId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      throw new Error(error.message || 'Kunne ikke sende venneforespørsel');
    }
  },

  acceptFriendRequest: async (userId, fromUserId) => {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const fromUserDocRef = doc(firestore, 'users', fromUserId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('Bruker finnes ikke');
      }
      if (!userDoc.data().friendRequests?.some(req => req.from === fromUserId && req.status === 'pending')) {
        throw new Error('Ingen ventende venneforespørsel funnet');
      }
      await updateDoc(userDocRef, {
        friends: arrayUnion(fromUserId),
        friendRequests: arrayRemove({
          from: fromUserId,
          status: 'pending',
        }),
      });
      await updateDoc(fromUserDocRef, {
        friends: arrayUnion(userId),
      });
    } catch (error) {
      throw new Error('Kunne ikke godta venneforespørsel');
    }
  },

  rejectFriendRequest: async (userId, fromUserId) => {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('Bruker finnes ikke');
      }
      if (!userDoc.data().friendRequests?.some(req => req.from === fromUserId && req.status === 'pending')) {
        throw new Error('Ingen ventende venneforespørsel funnet');
      }
      await updateDoc(userDocRef, {
        friendRequests: arrayRemove({
          from: fromUserId,
          status: 'pending',
        }),
      });
    } catch (error) {
      throw new Error('Kunne ikke avslå venneforespørsel');
    }
  },

  withdrawFriendRequest: async (fromUserId, toUserId) => {
    try {
      const toUserDocRef = doc(firestore, 'users', toUserId);
      const toUserDoc = await getDoc(toUserDocRef);
      if (!toUserDoc.exists()) {
        throw new Error('Mottaker finnes ikke');
      }
      const toUserData = toUserDoc.data();
      const matchingRequest = toUserData.friendRequests?.find(req => req.from === fromUserId && req.status === 'pending');
      if (!matchingRequest) {
        throw new Error('Ingen ventende venneforespørsel funnet');
      }
      await updateDoc(toUserDocRef, {
        friendRequests: arrayRemove({
          from: fromUserId,
          status: 'pending',
          createdAt: matchingRequest.createdAt,
        }),
      });
    } catch (error) {
      throw new Error('Kunne ikke trekke tilbake venneforespørsel');
    }
  },

  onAuthStateChanged: (callback) => {
    return firebaseOnAuthStateChanged(auth, callback);
  },
};