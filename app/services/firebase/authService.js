import { createUserWithEmailAndPassword, onAuthStateChanged as firebaseOnAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, verifyBeforeUpdateEmail } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth } from './FirebaseConfig';

const firestore = getFirestore();
const normalizeValue = (value) => String(value || '').trim().toLowerCase();

export const authService = {
  createUser: async (userData) => {
    try {
      const normalizedEmail = normalizeValue(userData.email);
      const trimmedUsername = String(userData.username || '').trim();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        userData.password
      );
      const user = userCredential.user;

      try {
        await sendEmailVerification(user);
      } catch (verificationError) {
        // Do not block account creation if verification email fails.
        console.error('Send verification email error:', verificationError);
      }

      await setDoc(doc(firestore, 'users', user.uid), {
        username: trimmedUsername,
        usernameLower: normalizeValue(trimmedUsername),
        name: userData.name,
        email: String(userData.email || '').trim(),
        emailLower: normalizedEmail,
        phone: userData.phone ?? null,
        weight: userData.weight ?? null,
        gender: userData.gender ?? null,
        friends: [],
        groups: [],
        createdAt: serverTimestamp(),
      });
      return {
        id: user.uid,
        username: trimmedUsername,
        name: userData.name,
        email: String(userData.email || '').trim(),
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
      const userCredential = await signInWithEmailAndPassword(auth, normalizeValue(email), password);
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
      const payload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      if (typeof updateData.email === 'string') {
        const trimmedEmail = String(updateData.email).trim();
        payload.email = trimmedEmail;
        payload.emailLower = normalizeValue(trimmedEmail);
      }

      await updateDoc(doc(firestore, 'users', userId), {
        ...payload,
      });
      return payload;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Kunne ikke oppdatere bruker');
    }
  },

  requestEmailChange: async (newEmail) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('unauthorized-email-change-attempt');
      }

      const normalizedNewEmail = normalizeValue(newEmail);
      const currentEmail = normalizeValue(currentUser.email);
      if (!normalizedNewEmail) {
        throw new Error('invalid-email');
      }
      if (normalizedNewEmail === currentEmail) {
        return { status: 'unchanged' };
      }

      await verifyBeforeUpdateEmail(currentUser, normalizedNewEmail);
      return { status: 'verification-sent' };
    } catch (error) {
      console.error('Request email change error:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/requires-recent-login') {
          throw new Error('Du må logge inn på nytt for å endre e-postadresse');
        }
        if (errorCode === 'auth/email-already-in-use') {
          throw new Error('E-postadressen er allerede i bruk');
        }
        if (errorCode === 'auth/invalid-email') {
          throw new Error('Ugyldig e-postadresse');
        }
      }

      if (error instanceof Error && error.message === 'unauthorized-email-change-attempt') {
        throw new Error('Bruker ikke autorisert');
      }

      throw new Error('Kunne ikke starte e-postendring');
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const normalizedEmail = normalizeValue(email);
      if (!normalizedEmail) {
        throw new Error('invalid-email');
      }

      await sendPasswordResetEmail(auth, normalizedEmail);
      return { status: 'sent' };
    } catch (error) {
      console.error('Request password reset error:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/invalid-email') {
          throw new Error('Ugyldig e-postadresse');
        }
        if (errorCode === 'auth/user-not-found') {
          throw new Error('Fant ingen bruker med denne e-postadressen');
        }
        if (errorCode === 'auth/too-many-requests') {
          throw new Error('For mange forsøk. Prøv igjen litt senere');
        }
      }

      if (error instanceof Error && error.message === 'invalid-email') {
        throw new Error('E-postadresse er påkrevd');
      }

      throw new Error('Kunne ikke sende passord-reset e-post');
    }
  },

  deleteUser: async (userId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('unauthorized-delete-attempt');
      }

      await deleteDoc(doc(firestore, 'users', userId));
      await currentUser.delete();
    } catch (error) {
      console.error('Delete user error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/requires-recent-login') {
          throw new Error('requires-recent-login');
        }
      }

      if (error instanceof Error && error.message === 'unauthorized-delete-attempt') {
        throw new Error('Du kan bare slette din egen bruker');
      }

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

  checkUsernameExistsInsensitive: async (username) => {
    try {
      const normalizedUsername = normalizeValue(username);
      if (!normalizedUsername) return false;

      const usersRef = collection(firestore, 'users');
      const lowerQuery = query(usersRef, where('usernameLower', '==', normalizedUsername));
      const lowerSnapshot = await getDocs(lowerQuery);
      if (!lowerSnapshot.empty) return true;

      // Backward compatibility: older users may not have usernameLower set.
      const allUsersSnapshot = await getDocs(usersRef);
      return allUsersSnapshot.docs.some((docSnap) => {
        const existingUsername = docSnap.data().username;
        return normalizeValue(existingUsername) === normalizedUsername;
      });
    } catch (error) {
      console.error('Check username (insensitive) error:', error);
      throw new Error('Kunne ikke sjekke brukernavn');
    }
  },

  checkEmailExistsInsensitive: async (email) => {
    try {
      const normalizedEmail = normalizeValue(email);
      if (!normalizedEmail) return false;

      const usersRef = collection(firestore, 'users');
      const lowerQuery = query(usersRef, where('emailLower', '==', normalizedEmail));
      const lowerSnapshot = await getDocs(lowerQuery);
      if (!lowerSnapshot.empty) return true;

      // Backward compatibility: older users may not have emailLower set.
      const allUsersSnapshot = await getDocs(usersRef);
      return allUsersSnapshot.docs.some((docSnap) => {
        const existingEmail = docSnap.data().email;
        return normalizeValue(existingEmail) === normalizedEmail;
      });
    } catch (error) {
      console.error('Check email (insensitive) error:', error);
      throw new Error('Kunne ikke sjekke e-postadresse');
    }
  },

  onAuthStateChanged: (callback) => {
    return firebaseOnAuthStateChanged(auth, callback);
  },
};