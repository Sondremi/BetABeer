import { collection, doc, query, where, getDocs, addDoc, serverTimestamp, updateDoc, arrayUnion, getDoc, deleteDoc, arrayRemove, increment } from 'firebase/firestore';
import { firestore, auth } from './FirebaseConfig';
import { GroupInvitation, Group } from '../../services/firebase/groupService'
import { DrinkEntry } from '@/app/types/drinkTypes';

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
            image: 'image_missing', // Note: ImageMissing not available here; use string
            createdBy: userId,
            members: [userId],
        };
    } catch(error) {
        console.error(error);
        throw new Error(`Kunne ikke opprette gruppe: ${(error as Error).message}`);
    }
}

export const profileService = {
  async getUserData(userId: string): Promise<{ weight?: number; gender?: 'male' | 'female'; drinks?: DrinkEntry[] }> {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        weight: data.weight,
        gender: data.gender,
        drinks: data.drinks || [],
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

    if (drinks.length === 0) return 0;

    let totalBAC = 0;
    drinks.forEach(drink => {
        const alcoholGrams = drink.sizeDl * drink.alcoholPercent * 0.8 * drink.quantity;
        const hoursSinceDrink = (currentTime - drink.timestamp) / (1000 * 60 * 60);
        const bacContribution = (alcoholGrams / (weight * bodyWaterPercentage)) - (metabolismRate * hoursSinceDrink);
        totalBAC += Math.max(0, bacContribution);
    })
    return Number(totalBAC.toFixed(3));
  }
};
