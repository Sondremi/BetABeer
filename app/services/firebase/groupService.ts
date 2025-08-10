import { collection, doc, query, where, getDocs, addDoc, serverTimestamp, updateDoc, arrayUnion, getDoc, deleteDoc, arrayRemove, increment } from 'firebase/firestore';
import { firestore, auth } from './FirebaseConfig';
import { MemberDrinkStats, DrinkType, MeasureType } from '../../types/bettingTypes'

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
  const q = query(
    groupInvitationRef,
    where('groupId', '==', group.id),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending')
  );
  const existingInvitations = await getDocs(q);
  if (!existingInvitations.empty) {
    throw new Error(`Invitasjon til bruker er allerede sendt`);
  }
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
    where("toUserId", "==", currentUserId),
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
    if (!groupData.members.includes(friendId)) {
      throw new Error('Bruker er ikke medlem av gruppen');
    }
    const friendUserRef = doc(firestore, 'users', friendId);
    await Promise.all([
        updateDoc(groupRef, {members: arrayRemove(friendId)}),
        updateDoc(friendUserRef, {groups: arrayRemove(groupId)})
    ])
    console.log("Fjernet venn");
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
    await Promise.all([
        updateDoc(currentUserRef, {groups: arrayRemove(groupId)}),
        updateDoc(groupRef, {members: arrayRemove(currentUser.uid)})
    ]);
    console.log("Forlot gruppe");
  } catch(error) {
    console.error(error);
    throw new Error('Kunne ikke forlate gruppen')
  }
};

export const deleteGroup = async (groupId: string) => { 
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Ikke autentisert");
        return;
    }
    try {
        const groupRef = doc(firestore, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists() || groupSnap.id === 'default') {
            throw new Error('Gruppen finnes ikke eller er goofy');
        }
        const groupData = groupSnap.data();
        if (groupData.createdBy !== currentUser.uid) {
            throw new Error("Du er ikke grov nok til å slette gruppa");
        }
        const memberUpdates = groupData.members.map((memberId: string) => 
            updateDoc(doc(firestore, 'users', memberId), {
                groups: arrayRemove(groupId),
            })
        );
        await Promise.all([...memberUpdates, deleteDoc(groupRef)]);
        console.log('Gruppe slettet');
    } catch (error) {
        console.error(error);
        throw new Error('Kunne ikke slette gruppe');
    }
};

export const distributeDrinks = async (
  fromUserId: string,
  groupId: string,
  distributions: { userId: string; drinkType: DrinkType; measureType: MeasureType; amount: number }[]
): Promise<void> => {
  if (!fromUserId || !groupId) {
    throw new Error('Bruker eller gruppe ikke tilgjengelig');
  }

  // Fetch user's drinksToDistribute from Firestore
  const fromUserRef = doc(firestore, 'users', fromUserId);
  const fromUserDoc = await getDoc(fromUserRef);
  if (!fromUserDoc.exists()) {
    throw new Error('Bruker ikke funnet');
  }
  const userData = fromUserDoc.data();
  const drinksToDistribute: MemberDrinkStats['drinksToDistribute'] = userData.drinksToDistribute || {};

  // Validate distributions
  const totalsByDrink: { [key in DrinkType]?: { [key in MeasureType]?: number } } = {};
  distributions.forEach(({ drinkType, measureType, amount }) => {
    if (!totalsByDrink[drinkType]) totalsByDrink[drinkType] = {};
    if (!totalsByDrink[drinkType]![measureType]) totalsByDrink[drinkType]![measureType] = 0;
    totalsByDrink[drinkType]![measureType]! += amount;
  });
  for (const [drinkType, measures] of Object.entries(totalsByDrink)) {
    for (const [measureType, total] of Object.entries(measures)) {
      const available = drinksToDistribute[drinkType as DrinkType]?.[measureType as MeasureType] || 0;
      if (total > available) {
        throw new Error(`Ikke nok ${measureType} ${drinkType} tilgjengelig`);
      }
    }
  }

  // Update Firestore
  await Promise.all(distributions.map(async ({ userId, drinkType, measureType, amount }) => {
    // Verify toUserId is a group member
    const groupRef = doc(firestore, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists() || !groupDoc.data().members.includes(userId)) {
      throw new Error('Mottaker er ikke medlem av gruppen');
    }

    // Create distribution record
    const distributionRef = collection(firestore, `groups/${groupId}/drink_distributions`);
    await addDoc(distributionRef, {
      fromUserId,
      toUserId: userId,
      drinkType,
      measureType,
      amount,
      createdAt: serverTimestamp(),
    });

    // Update recipient's drinksToConsume
    const toUserRef = doc(firestore, 'users', userId);
    await updateDoc(toUserRef, {
      [`drinksToConsume.${drinkType}.${measureType}`]: increment(amount)
    });

    // Update distributor's drinksToDistribute
    await updateDoc(fromUserRef, {
      [`drinksToDistribute.${drinkType}.${measureType}`]: increment(-amount)
    });
  }));
};