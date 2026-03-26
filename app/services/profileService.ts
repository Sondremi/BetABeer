import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { DrinkEntry, Group, GroupInvitation } from '../types/drinkTypes';
import { auth, firestore } from './firebase/FirebaseConfig';

const GROUP_INVITATIONS_COLLECTION = 'group_invitations';

export const getGroupInvitation = async (currentUserId: string) : Promise<GroupInvitation[]> => {
  const groupInvitationRef = collection(firestore, GROUP_INVITATIONS_COLLECTION);
  const q = query(
    groupInvitationRef,
    where("toUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      groupName: data.groupName || data.group_name || 'Group',
    };
  }) as GroupInvitation[];
};

export const acceptGroupInvitation = async (group: GroupInvitation) : Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Bruker ikke autorisert");
        return;
    }
    const invitationRef = doc(firestore, GROUP_INVITATIONS_COLLECTION, group.id);
    const groupRef = doc(firestore, "groups", group.groupId);
    const userRef = doc(firestore, "users", currentUser.uid);
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
    const groupInvitationRef = doc(firestore, GROUP_INVITATIONS_COLLECTION, requestId);
    await deleteDoc(groupInvitationRef);
    console.log("Invitasjon avslått og slettet", requestId);
  } catch (error) {
    console.error(error)
    throw new Error(`Kunne ikke avlså forespørsel: ${(error as Error).message}`);
  }
};

export const createGroup = async (userId: string): Promise<Group> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("Bruker ikke autorisert");
        throw new Error('Faaaaah')
    }
    try {
        const groupDoc = await addDoc(collection(firestore, 'groups'), {
            name: 'Gruppenavn',
            image: 'image_missing',
            members: [currentUser.uid],
            bets: [],
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid
        });
        const userRef = doc(firestore, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        let userGroups: string[] = userSnap.exists() && userSnap.data().groups ? userSnap.data().groups : [];
        await updateDoc(userRef, { groups: [...userGroups, groupDoc.id] });
        return {
            id: groupDoc.id,
            name: 'Gruppenavn',
            memberCount: 1,
            image: 'image_missing',
            createdBy: userId,
            members: [userId],
        };
    } catch(error) {
        console.error(error);
        throw new Error(`Kunne ikke opprette gruppe: ${(error as Error).message}`);
    }
}

export const updateGroupName = async(groupId: string, newName: string): Promise<void> => {
    try {
        const groupRef = doc(firestore, 'groups', groupId)
        await updateDoc(groupRef, {name: newName})
        const inviteQuery = query(collection(firestore, GROUP_INVITATIONS_COLLECTION), where('groupId', '==', groupId))
        const inviteSnapshot = await getDocs(inviteQuery)
        const updatePromises = inviteSnapshot.docs.map((invDoc) => (
          updateDoc(doc(firestore, GROUP_INVITATIONS_COLLECTION, invDoc.id), {
            groupName: newName,
            group_name: newName,
          })
        ));
        const updateResults = await Promise.allSettled(updatePromises);
        const failedUpdates = updateResults.filter((result) => result.status === 'rejected').length;
        if (failedUpdates > 0) {
          console.warn(`Updated group name, but failed to update ${failedUpdates} invitation document(s).`);
        }
    } catch (error) {
        console.error(error)
        throw new Error(`${(error as Error).message}`)
    }
}

export const profileService = {
  async getUserData(userId: string): Promise<{ weight?: number; gender?: 'male' | 'female'; drinks?: DrinkEntry[] }> {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const drinks = (data.drinks || []) as DrinkEntry[];
      const latestDrinkTimestamp = drinks.length > 0 ? Math.max(...drinks.map(drink => drink.timestamp)) : null;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      if (latestDrinkTimestamp && Date.now() - latestDrinkTimestamp >= twentyFourHoursMs) {
        await updateDoc(userRef, { drinks: [] });
        return {
          weight: data.weight,
          gender: data.gender,
          drinks: [],
        };
      }

      return {
        weight: data.weight,
        gender: data.gender,
        drinks,
      };
    }
    return {};
  },

  async addDrink(userId: string, drink: DrinkEntry): Promise<void> {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {drinks: arrayUnion(drink)});
    console.log('Adding drink for user', userId, drink);
  },

  async resetDrinks(userId: string): Promise<void> {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {drinks: []});
    console.log('Resetting drinks for user', userId);
  },

  calculateBAC(drinks: DrinkEntry[], weight: number, gender: 'male' | 'female', currentTime: number): number {
    const bodyWaterPercentage = gender === 'male' ? 0.65 : 0.55;
    const metabolismRate = 0.15;
    const absorptionTimeMs = 45 * 60 * 1000; // 45 minutes (average)

    if (drinks.length === 0) return 0;

    let totalBAC = 0;
    drinks.forEach(drink => {
        const alcoholGrams = drink.sizeDl * drink.alcoholPercent * 0.8 * drink.quantity;
        const timeSinceDrinkMs = currentTime - drink.timestamp;
        const absopedGrams = Math.min(alcoholGrams, alcoholGrams * (timeSinceDrinkMs / absorptionTimeMs));
        const hoursSinceDrink = timeSinceDrinkMs / (1000 * 60 * 60);
        const bacContribution = (absopedGrams / (weight * bodyWaterPercentage)) - (metabolismRate * Math.max(0, hoursSinceDrink - (absorptionTimeMs / (1000 * 60 * 60))));
        totalBAC += Math.max(0, bacContribution);
    })
    return Number(totalBAC.toFixed(3));
  }
};
