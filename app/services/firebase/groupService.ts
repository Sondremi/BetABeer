import { collection, doc, query, where, getDocs, addDoc, serverTimestamp, updateDoc, arrayUnion, getDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { firestore, auth } from './FirebaseConfig';

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  fromUserId: string;
  toUserId: string;
  status: 'accepted' | 'pending' | 'declined';
  createdAt: any;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  profilePicture: any;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  image: any;
  createdBy: string;
  members: string[];
}

export const sendGroupInvitation = async (toUserId: string, group: Group) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Bruker ikke autorisert');
  }
  if (toUserId === currentUser.uid) {
    throw new Error('Kan ikke sende venneforespørsel til deg selv')
  }
  const groupInvitationRef = collection(firestore, "group_invitations");
  const docRef =  await addDoc(groupInvitationRef, {
    groupName: group.name,
    groupId: group.id,
    fromUserId: currentUser.uid,
    toUserId: toUserId,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  console.log("Gruppe invitasjon sendt", docRef.id);
  return docRef.id;
};

export const getGroupInvitation = async (currentUserId: string) : Promise<GroupInvitation[]> => {
  const groupInvitationRef = collection(firestore, "group_invitations");
  const q = query(
    groupInvitationRef,
    where("receiver", "==", currentUserId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GroupInvitation[];
};

export const acceptGroupInvitation = async (group: GroupInvitation) : Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Bruker ikke autorisert");
        return;
    }
    const invitationRef = doc(firestore, "group_invitations", group.id);
    const groupRef = doc(firestore, "groups", group.groupId);
    const userRef = doc(firestore, "users", group.toUserId);
    await Promise.all([
        updateDoc(groupRef, {members: arrayUnion(group.toUserId)}),
        updateDoc(userRef, {groups: arrayUnion(group.groupId)}),
    ]);
    await deleteDoc(invitationRef);
    console.log(`Gruppeinvitasjon akseptert: ${group.id}`)
  } catch(error) {
    console.error(error)
    throw new Error(`Kunne ikke akseptere gruppeinvitasjon: ${(error as Error).message}`)
  }
};

export const declineGroupInvitation = async (requestId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Bruker ikke autorisert");
        return;
    }
  try {
    const groupInvitationRef = doc(firestore, "group_invitations", requestId);
    await deleteDoc(groupInvitationRef);
    console.log("Invitasjon avslått og slettet", requestId);
  } catch (error) {
    console.error(error)
    throw new Error(`Kunne ikke avlså forespørsel: ${(error as Error).message}`);
  }
};

export const removeFriendFromGroup = async (friendId: string, groupId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Ikke autentisert");
        return;
    }
  try {
    const groupRef = doc(firestore, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
        throw new Error('Gruppen finnes ikke')
    }
    const groupData = groupSnap.data();
    if (groupData.createdBy !== currentUser.uid) {
        throw new Error('Kun eier av gruppen kan fjerne medlemmer')
    }
    if (friendId in groupData.members) {
        const friendUserRef = doc(firestore, 'users', friendId);
        updateDoc(groupRef, {members: arrayRemove(friendId)});
        updateDoc(friendUserRef, {groups: arrayRemove(groupId)});
        console.log("Fjernet venn");
    }
  } catch(error) {
    console.error(error);
    throw new Error('Kunne ikke slette venn')
  }
};

export const exitGroup = async (groupId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Ikke autentisert");
        return;
    }
  try {
    const groupRef = doc(firestore, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
        throw new Error('Gruppen finnes ikke')
    }
    const groupData = groupSnap.data();
    if (groupData.createdBy === currentUser.uid) {
        throw new Error('Gruppeeier kan ikke forlate gruppen')
    }
    const currentUserRef = doc(firestore, 'users', currentUser.uid);
    updateDoc(currentUserRef, {groups: arrayRemove(groupId)});
    updateDoc(groupRef, {members: arrayRemove(currentUser.uid)});
    console.log("Fjernet venn");
  } catch(error) {
    console.error(error);
    throw new Error('Kunne ikke slette venn')
  }
};

