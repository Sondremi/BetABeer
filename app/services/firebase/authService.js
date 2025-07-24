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
        groupInvitations: [],
        groups: [],
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
          friends: userData.friends || [],
          friendRequests: userData.friendRequests || [],
          groupInvitations: userData.groupInvitations || [],
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
      console.error('Send friend request error:', error);
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
      console.error('Accept friend request error:', error);
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
      console.error('Reject friend request error:', error);
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
      console.error('Withdraw friend request error:', error);
      throw new Error('Kunne ikke trekke tilbake venneforespørsel');
    }
  },

  sendGroupInvitation: async (fromUserId, toUserId, groupId, groupName) => {
    try {
      console.log('Attempting to send group invitation:', { fromUserId, toUserId, groupId, groupName });

      if (!fromUserId || !toUserId || !groupId || !groupName) {
        console.error('Invalid input parameters:', { fromUserId, toUserId, groupId, groupName });
        throw new Error('Ugyldige inputparametere');
      }

      if (fromUserId === toUserId) {
        console.error('Self-invitation attempted');
        throw new Error('Kan ikke invitere deg selv til en gruppe');
      }

      const toUserDocRef = doc(firestore, 'users', toUserId);
      const toUserDoc = await getDoc(toUserDocRef);
      if (!toUserDoc.exists()) {
        console.error('Recipient user does not exist:', toUserId);
        throw new Error('Mottaker finnes ikke');
      }

      const toUserData = toUserDoc.data();
      if (!toUserData.groupInvitations) {
        console.log('Initializing empty groupInvitations array for user:', toUserId);
        await updateDoc(toUserDocRef, { groupInvitations: [] });
      }

      if (toUserData.groupInvitations?.some(inv => inv.groupId === groupId && inv.from === fromUserId && inv.status === 'pending')) {
        console.error('Group invitation already sent:', { groupId, fromUserId });
        throw new Error('Gruppeinvitasjon allerede sendt');
      }

      const groupDocRef = doc(firestore, 'groups', groupId);
      const groupDoc = await getDoc(groupDocRef);
      if (!groupDoc.exists()) {
        console.error('Group does not exist:', groupId);
        throw new Error('Gruppen finnes ikke');
      }

      const groupData = groupDoc.data();
      if (!groupData.members) {
        console.error('Group members field missing:', groupId);
        throw new Error('Gruppen har ingen medlemmer definert');
      }

      if (!groupData.members.includes(fromUserId)) {
        console.error('Sender is not a group member:', { fromUserId, groupId });
        throw new Error('Du er ikke medlem av gruppen');
      }

      await updateDoc(toUserDocRef, {
        groupInvitations: arrayUnion({
          groupId,
          groupName,
          from: fromUserId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }),
      });
      console.log('Group invitation sent successfully:', { toUserId, groupId });
    } catch (error) {
      console.error('Send group invitation error:', error, { fromUserId, toUserId, groupId });
      throw new Error(error.message || 'Kunne ikke sende gruppeinvitasjon');
    }
  },

  acceptGroupInvitation: async (userId, groupId, fromUserId) => {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        console.error('User does not exist:', userId);
        throw new Error('Bruker finnes ikke');
      }
      const userData = userDoc.data();
      const matchingInvitation = userData.groupInvitations?.find(inv => inv.groupId === groupId && inv.from === fromUserId && inv.status === 'pending');
      if (!matchingInvitation) {
        console.error('No pending group invitation found:', { groupId, fromUserId });
        throw new Error('Ingen ventende gruppeinvitasjon funnet');
      }

      const groupDocRef = doc(firestore, 'groups', groupId);
      const groupDoc = await getDoc(groupDocRef);
      if (!groupDoc.exists()) {
        console.error('Group does not exist:', groupId);
        throw new Error('Gruppen finnes ikke');
      }
      if (groupDoc.data().members.includes(userId)) {
        console.error('User is already a group member:', { userId, groupId });
        throw new Error('Du er allerede medlem av gruppen');
      }

      await updateDoc(userDocRef, {
        groupInvitations: arrayRemove({
          groupId,
          groupName: matchingInvitation.groupName,
          from: fromUserId,
          status: 'pending',
          createdAt: matchingInvitation.createdAt,
        }),
        groups: arrayUnion(groupId),
      });

      await updateDoc(groupDocRef, {
        members: arrayUnion(userId),
      });
      console.log('Group invitation accepted:', { userId, groupId });
    } catch (error) {
      console.error('Accept group invitation error:', error);
      throw new Error('Kunne ikke godta gruppeinvitasjon');
    }
  },

  rejectGroupInvitation: async (userId, groupId, fromUserId) => {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        console.error('User does not exist:', userId);
        throw new Error('Bruker finnes ikke');
      }
      const userData = userDoc.data();
      const matchingInvitation = userData.groupInvitations?.find(inv => inv.groupId === groupId && inv.from === fromUserId && inv.status === 'pending');
      if (!matchingInvitation) {
        console.error('No pending group invitation found:', { groupId, fromUserId });
        throw new Error('Ingen ventende gruppeinvitasjon funnet');
      }

      await updateDoc(userDocRef, {
        groupInvitations: arrayRemove({
          groupId,
          groupName: matchingInvitation.groupName,
          from: fromUserId,
          status: 'pending',
          createdAt: matchingInvitation.createdAt,
        }),
      });
      console.log('Group invitation rejected:', { userId, groupId });
    } catch (error) {
      console.error('Reject group invitation error:', error);
      throw new Error('Kunne ikke avslå gruppeinvitasjon');
    }
  },

  onAuthStateChanged: (callback) => {
    return firebaseOnAuthStateChanged(auth, callback);
  },
};