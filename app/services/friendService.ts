import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Friend, FriendRequest } from '../types/userTypes';
import { defaultProfileImageMap } from '../utils/defaultProfileImages';
import { auth, firestore } from './firebase/FirebaseConfig';

const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');

export const listenToIncomingRequests = (currentUserId: string, callback: (requests: FriendRequest[]) => void) => {
  const friendRequestRef = collection(firestore, "friendRequests");
  const q = query(
    friendRequestRef,
    where("toUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  return onSnapshot(q, async (snapshot) => {
    const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const userDocRef = doc(firestore, "users", data.fromUserId);
      const userDoc = await getDoc(userDocRef);
      return {
        id: docSnap.id,
        ...data,
        name: data.fromUserName || (userDoc.exists() ? userDoc.data().name || 'Ukjent' : 'Ukjent'),
        username: data.fromUsername || (userDoc.exists() ? userDoc.data().username || 'ukjent' : 'ukjent'),
        profilePicture: data.fromUserProfileImage ? 
          defaultProfileImageMap[data.fromUserProfileImage] || DefaultProfilePicture 
          : DefaultProfilePicture,
      };
    }));
    callback(requests as FriendRequest[]);
  });
};

export const listenToOutgoingRequests = (currentUserId: string, callback: (requests: FriendRequest[]) => void) => {
  const friendRequestRef = collection(firestore, "friendRequests");
  const q = query(
    friendRequestRef,
    where("fromUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  return onSnapshot(q, async (snapshot) => {
    const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const userDocRef = doc(firestore, "users", data.toUserId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      return {
        id: docSnap.id,
        ...data,
        fromUserName: userData?.name || 'Ukjent',
        fromUsername: userData?.username || 'ukjent',
        fromUserProfileImage: userData?.profileImage || null,
        // For bakoverkompatibilitet
        name: userData?.name || 'Ukjent',
        username: userData?.username || 'ukjent',
        profilePicture: userData?.profileImage ? 
          defaultProfileImageMap[userData.profileImage] 
          : DefaultProfilePicture,
      };
    }));
    callback(requests as FriendRequest[]);
  });
};

export const friendSearch = async (searchTerm: string): Promise<Friend[]> => {
  if (!searchTerm) return [];
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('Ingen autentisert bruker for søk');
    return [];
  }
  const usersRef = collection(firestore, 'users');
  const q = query(
    usersRef,
    where('username', '>=', searchTerm),
    where('username', '<=', searchTerm + '\uf8ff'),
    orderBy('username')
  );
  try {
    const querySnapshot = await getDocs(q);
    const result = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || 'Ukjent',
      username: doc.data().username || 'ukjent',
      profilePicture: doc.data().profileImage ? 
        defaultProfileImageMap[doc.data().profileImage] || DefaultProfilePicture
        : DefaultProfilePicture,
    })).filter((user) => user.id !== currentUser.uid);
    return result;
  } catch (error) {
    console.error('Feil under søk:', error);
    throw new Error(`Kunne ikke søke: ${(error as Error).message}`);
  }
};

export const sendFriendRequest = async (toUserId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Bruker ikke autorisert');
  }
  if (toUserId === currentUser.uid) {
    throw new Error('Kan ikke sende venneforespørsel til deg selv')
  }
  const friendRequestRef = collection(firestore, "friendRequests");
  // Get current user's profile data
  const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
  const currentUserData = currentUserDoc.data();

  const docRef = await addDoc(friendRequestRef, {
    fromUserId: currentUser.uid,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp(),
    fromUserName: currentUserData?.name || 'Ukjent',
    fromUsername: currentUserData?.username || 'ukjent',
    fromUserProfileImage: currentUserData?.profileImage,
  });
  console.log("Venneforespørsel opprettet", docRef.id);
  return docRef.id;
};

export const getIncomingRequest = async (currentUserId: string) : Promise<FriendRequest[]> => {
  const friendRequestRef = collection(firestore, "friendRequests");
  const q = query(
    friendRequestRef,
    where("toUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FriendRequest[];
};

export const cancelFriendRequest = async (requestId: string) => {
  try {
    const requestDocRef = doc(firestore, 'friendRequests', requestId);
    await deleteDoc(requestDocRef);
    console.log('Friend request cancelled', requestId);
  } catch(error) {
    console.error(error)
    throw new Error(`Failed to cancel friend request: ${(error as Error).message}`)
  }
};

export const getOutgoingRequest = async (currentUserId: string) : Promise<FriendRequest[]> => {
  const friendRequestRef = collection(firestore, "friendRequests");
  const q = query(
    friendRequestRef,
    where("fromUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FriendRequest[];

  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      const userDocRef = doc(firestore, "users", request.toUserId);
      const userDoc = await getDoc(userDocRef);
      return {
        ...request,
        name: userDoc.exists() ? userDoc.data().name || 'Ukjent' : 'Ukjent',
        username: userDoc.exists() ? userDoc.data().username || 'ukjent' : 'ukjent',
        profilePicture: userDoc.exists() ? 
          userDoc.data().profileImage ? defaultProfileImageMap[userDoc.data().profileImage] || DefaultProfilePicture
          : DefaultProfilePicture
          : DefaultProfilePicture,
      };
    })
  );
  return enrichedRequests;
};

export const acceptFriendRequest = async (requestId: string, fromUserId: string, toUserId: string) : Promise<void> => {
  try {
    const fromUserRef = doc(firestore, "users", fromUserId);
    const toUserRef = doc(firestore, "users", toUserId);
    await Promise.all([
      updateDoc(fromUserRef, {friends: arrayUnion(toUserId)}),
      updateDoc(toUserRef, {friends: arrayUnion(fromUserId)}),
    ]);
    const requestDocRef = doc(firestore, "friendRequests", requestId);
    await deleteDoc(requestDocRef);
    console.log(`Friendship established and request deleted: ${requestId}`)
  } catch(error) {
    console.error(error)
    throw new Error(`Kunne ikke akseptere forespørsel: ${(error as Error).message}`)
  }
};

export const declineFriendRequest = async (requestId: string) => {
  try {
    const requestDocRef = doc(firestore, "friendRequests", requestId);
    await deleteDoc(requestDocRef);
    console.log("Forespørsel avslått og slettet", requestId);
  } catch (error) {
    console.error(error)
    throw new Error(`Kunne ikke avlså forespørsel: ${(error as Error).message}`);
  }
};

export const removeFriend = async (currentuserId: string, friendId: string) => {
  try {
    const currentUserRef = doc(firestore, 'users', currentuserId);
    const friendUserRef = doc(firestore, 'users', friendId);
    updateDoc(friendUserRef, {friends: arrayRemove(currentuserId)});
    updateDoc(currentUserRef, {friends: arrayRemove(friendId)});
    console.log("Fjernet venn");
  } catch(error) {
    console.error(error);
    throw new Error('Kunne ikke slette venn')
  }
};
