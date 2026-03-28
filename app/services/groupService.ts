import { addDoc, arrayRemove, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { DrinkType, Group, MeasureType, MemberDrinkStats } from '../types/drinkTypes';
import { auth, firestore } from './firebase/FirebaseConfig';

const GROUP_INVITATIONS_COLLECTION = 'group_invitations';

export const sendGroupInvitation = async (toUserId: string, group: Group) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Bruker ikke autorisert');
  }
  if (toUserId === currentUser.uid) {
    throw new Error('Kan ikke sende venneforespørsel til deg selv')
  }
  const groupInvitationRef = collection(firestore, GROUP_INVITATIONS_COLLECTION);
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
    group_name: group.name,
    groupId: group.id,
    fromUserId: currentUser.uid,
    toUserId: toUserId,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  console.log("Gruppe invitasjon sendt", docRef.id);
  return docRef.id;
};

export const cancelGroupInvitation = async (invitationId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Bruker ikke autorisert');
  }

  const invitationRef = doc(firestore, GROUP_INVITATIONS_COLLECTION, invitationId);
  const invitationSnap = await getDoc(invitationRef);
  if (!invitationSnap.exists()) {
    throw new Error('Invitasjonen finnes ikke');
  }

  const invitationData = invitationSnap.data();
  if (invitationData.fromUserId !== currentUser.uid) {
    throw new Error('Du kan bare angre invitasjoner du har sendt');
  }
  if (invitationData.status !== 'pending') {
    throw new Error('Kun ventende invitasjoner kan angres');
  }

  await deleteDoc(invitationRef);
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

  // Fetch user's drinksToDistribute and username from Firestore
  const fromUserRef = doc(firestore, 'users', fromUserId);
  const fromUserDoc = await getDoc(fromUserRef);
  if (!fromUserDoc.exists()) {
    throw new Error('Bruker ikke funnet');
  }
  const userData = fromUserDoc.data();
  const drinksToDistribute: MemberDrinkStats['drinksToDistribute'] = userData.drinksToDistribute || {};
  const fromUsername = userData.username || userData.displayName || 'Ukjent';

  // Validate distributions
  const totalsByDrink: { [key in DrinkType]: { [key in MeasureType]: number } } = {
    'Øl': { 'Slurker': 0, 'Shot': 0, 'Chug': 0 },
    'Cider': { 'Slurker': 0, 'Shot': 0, 'Chug': 0 },
    'Hard selzer': { 'Slurker': 0, 'Shot': 0, 'Chug': 0 },
    'Vin': { 'Slurker': 0, 'Shot': 0, 'Chug': 0 },
    'Sprit': { 'Slurker': 0, 'Shot': 0, 'Chug': 0 }
  };
  
  distributions.forEach(({ drinkType, measureType, amount }) => {
    totalsByDrink[drinkType][measureType] += amount;
  });

  Object.entries(totalsByDrink).forEach(([drinkType, measures]) => {
    Object.entries(measures).forEach(([measureType, total]) => {
      const available = drinksToDistribute[drinkType as DrinkType]?.[measureType as MeasureType] || 0;
      if (total > available) {
        throw new Error(`Ikke nok ${measureType} ${drinkType} tilgjengelig`);
      }
    });
  });

  // Update Firestore and record transactions
  await Promise.all(distributions.map(async ({ userId, drinkType, measureType, amount }) => {
    // Verify toUserId is a group member
    const groupRef = doc(firestore, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists() || !groupDoc.data().members.includes(userId)) {
      throw new Error('Mottaker er ikke medlem av gruppen');
    }

    // Get recipient's username
    const toUserRef = doc(firestore, 'users', userId);
    const toUserDoc = await getDoc(toUserRef);
    const toUsername = toUserDoc.exists() ? 
      (toUserDoc.data().username || toUserDoc.data().displayName || 'Ukjent') : 
      'Ukjent';

    // Create transaction record in group's transactions collection
    const transactionRef = collection(firestore, `groups/${groupId}/transactions`);
    await addDoc(transactionRef, {
      fromUserId,
      fromUsername,
      toUserId: userId,
      toUsername,
      drinkType,
      measureType,
      amount,
      source: 'distribution',
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
    });

    // Update recipient's drinksToConsume
    await updateDoc(toUserRef, {
      [`drinksToConsume.${drinkType}.${measureType}`]: increment(amount)
    });

    // Update distributor's drinksToDistribute
    await updateDoc(fromUserRef, {
      [`drinksToDistribute.${drinkType}.${measureType}`]: increment(-amount)
    });
  }));
};

export const registerConsumedDrinks = async (
  userId: string,
  consumptions: { drinkType: DrinkType; measureType: MeasureType; amount: number }[]
): Promise<void> => {
  if (!userId) {
    throw new Error('Bruker ikke tilgjengelig');
  }

  if (!consumptions.length) {
    throw new Error('Ingen drikker å registrere');
  }

  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Ikke autorisert');
  }

  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('Bruker ikke funnet');
  }

  const userData = userDoc.data();
  const drinksToConsume: MemberDrinkStats['drinksToConsume'] = userData.drinksToConsume || {};
  const aggregated: { [key: string]: number } = {};

  consumptions.forEach(({ drinkType, measureType, amount }) => {
    if (amount <= 0) return;
    const key = `${drinkType}|${measureType}`;
    aggregated[key] = (aggregated[key] || 0) + amount;
  });

  const updatePayload: Record<string, any> = {};
  Object.entries(aggregated).forEach(([key, amount]) => {
    const [drinkType, measureType] = key.split('|') as [DrinkType, MeasureType];
    const available = drinksToConsume[drinkType]?.[measureType] || 0;
    if (amount > available) {
      throw new Error(`Du kan ikke registrere mer enn du har for ${measureType} ${drinkType}`);
    }
    updatePayload[`drinksToConsume.${drinkType}.${measureType}`] = increment(-amount);
    updatePayload[`drinksConsumed.${drinkType}.${measureType}`] = increment(amount);
  });

  if (!Object.keys(updatePayload).length) {
    throw new Error('Ingen gyldige endringer å lagre');
  }

  await updateDoc(userRef, updatePayload);
};