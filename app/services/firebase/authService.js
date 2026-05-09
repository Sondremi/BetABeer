import { EmailAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, linkWithCredential, onAuthStateChanged as firebaseOnAuthStateChanged, reload, sendEmailVerification, sendPasswordResetEmail, signInAnonymously, signInWithCredential, signInWithEmailAndPassword, signOut, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth } from './FirebaseConfig';

const firestore = getFirestore();
const normalizeValue = (value) => String(value || '').trim().toLowerCase();
const toDisplayValue = (value) => String(value || '').trim();

export const MEDIA_UPLOAD_VERIFICATION_MESSAGE =
  'Du må verifisere e-postadressen din før du kan laste opp bilder. Gå til innstillinger for å sende verifisering på nytt.';

const buildFallbackUsername = (email, uid) => {
  const emailPrefix = String(email || '')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 18);
  const uidSuffix = String(uid || '').slice(0, 6);
  return (emailPrefix || 'user') + (uidSuffix ? `_${uidSuffix}` : '');
};

const ensureUserDocument = async (firebaseUser) => {
  const userRef = doc(firestore, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  const email = toDisplayValue(firebaseUser.email);
  const emailLower = normalizeValue(firebaseUser.email);
  const displayName = toDisplayValue(firebaseUser.displayName);

  if (!userDoc.exists()) {
    const username = buildFallbackUsername(firebaseUser.email, firebaseUser.uid);

    await setDoc(userRef, {
      username,
      usernameLower: normalizeValue(username),
      name: displayName || username,
      email,
      emailLower,
      isGuest: false,
      phone: firebaseUser.phoneNumber || null,
      weight: null,
      gender: null,
      friends: [],
      groups: [],
      createdAt: serverTimestamp(),
    });

    return {
      id: firebaseUser.uid,
      username,
      name: displayName || username,
      email,
      phone: firebaseUser.phoneNumber || null,
      weight: null,
      gender: null,
      isGuest: false,
      friends: [],
      groups: [],
    };
  }

  const userData = userDoc.data();
  const updates = {};

  if (email && normalizeValue(userData.email) !== emailLower) {
    updates.email = email;
    updates.emailLower = emailLower;
  }

  if (displayName && !toDisplayValue(userData.name)) {
    updates.name = displayName;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = serverTimestamp();
    await updateDoc(userRef, updates);
  }

  return {
    id: firebaseUser.uid,
    username: userData.username,
    name: userData.name,
    email: userData.email || email,
    phone: userData.phone,
    weight: userData.weight,
    gender: userData.gender,
    isGuest: Boolean(userData.isGuest),
    friends: userData.friends || [],
    groups: userData.groups || [],
  };
};

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
        isGuest: false,
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

  loginWithGoogleIdToken: async (idToken) => {
    try {
      if (!idToken) {
        throw new Error('missing-google-id-token');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return await ensureUserDocument(userCredential.user);
    } catch (error) {
      console.error('Google login error:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/account-exists-with-different-credential') {
          throw new Error('Denne e-posten er allerede registrert med en annen innloggingsmetode');
        }
        if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
          throw new Error('Google-innlogging ble avbrutt');
        }
      }

      if (error instanceof Error && error.message === 'missing-google-id-token') {
        throw new Error('Mangler Google ID-token. Sjekk OAuth-oppsett i appen.');
      }

      throw new Error('Kunne ikke logge inn med Google');
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

  refreshCurrentUser: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Bruker ikke autorisert');
    }
    await reload(currentUser);
    return auth.currentUser;
  },

  ensureVerifiedEmailForMediaUpload: async () => {
    const currentUser = await authService.refreshCurrentUser();
    if (!currentUser?.email) {
      throw new Error('Kontoen mangler e-postadresse.');
    }
    if (!currentUser.emailVerified) {
      throw new Error(MEDIA_UPLOAD_VERIFICATION_MESSAGE);
    }
    return true;
  },

  resendEmailVerification: async () => {
    try {
      const currentUser = await authService.refreshCurrentUser();
      if (!currentUser?.email) {
        throw new Error('missing-email-for-verification');
      }

      if (currentUser.emailVerified) {
        return { status: 'already-verified', email: currentUser.email };
      }

      await sendEmailVerification(currentUser);
      return { status: 'sent', email: currentUser.email };
    } catch (error) {
      console.error('Resend email verification error:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/too-many-requests') {
          throw new Error('For mange forespørsler. Prøv igjen litt senere.');
        }
      }

      if (error instanceof Error && error.message === 'missing-email-for-verification') {
        throw new Error('Fant ingen e-postadresse for verifisering.');
      }

      throw new Error('Kunne ikke sende verifiseringsmail.');
    }
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

  loginGuestUser: async (guestUsername) => {
    try {
      const trimmedUsername = String(guestUsername || '').trim();
      if (!trimmedUsername) {
        throw new Error('missing-guest-username');
      }
      if (trimmedUsername.length < 3 || trimmedUsername.length > 24) {
        throw new Error('invalid-guest-username-length');
      }

      const currentUser = auth.currentUser;
      let guestUser = currentUser;
      let createdAnonymousThisCall = false;

      if (guestUser && !guestUser.isAnonymous) {
        await signOut(auth);
        guestUser = null;
      }

      if (!guestUser || !guestUser.isAnonymous) {
        const userCredential = await signInAnonymously(auth);
        guestUser = userCredential.user;
        createdAnonymousThisCall = true;
      }

      const normalizedUsername = normalizeValue(trimmedUsername);
      const usersRef = collection(firestore, 'users');
      const lowerQuery = query(usersRef, where('usernameLower', '==', normalizedUsername));
      const lowerSnapshot = await getDocs(lowerQuery);
      const usernameTakenByAnother = lowerSnapshot.docs.some((docSnap) => docSnap.id !== guestUser.uid);

      if (usernameTakenByAnother) {
        if (createdAnonymousThisCall) {
          await guestUser.delete().catch(() => {});
        }
        throw new Error('guest-username-taken');
      }

      await setDoc(doc(firestore, 'users', guestUser.uid), {
        username: trimmedUsername,
        usernameLower: normalizedUsername,
        name: trimmedUsername,
        email: '',
        emailLower: '',
        isGuest: true,
        phone: null,
        weight: null,
        gender: null,
        friends: [],
        groups: [],
        createdAt: serverTimestamp(),
      }, { merge: true });

      await updateProfile(guestUser, { displayName: trimmedUsername }).catch(() => {});

      return {
        id: guestUser.uid,
        username: trimmedUsername,
        name: trimmedUsername,
        email: '',
        isGuest: true,
      };
    } catch (error) {
      console.error('Guest login error:', error);

      if (error instanceof Error) {
        if (error.message === 'missing-guest-username') {
          throw new Error('Brukernavn er påkrevd for gjestebruker');
        }
        if (error.message === 'invalid-guest-username-length') {
          throw new Error('Brukernavn må være mellom 3 og 24 tegn');
        }
        if (error.message === 'guest-username-taken') {
          throw new Error('Brukernavnet er allerede tatt');
        }
      }

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/operation-not-allowed') {
          throw new Error('Gjestelogin er ikke aktivert i Firebase Auth. Aktiver Anonymous provider i Firebase Console.');
        }
        if (errorCode === 'permission-denied') {
          throw new Error('Manglende Firestore-tilgang for gjestelogin. Sjekk firestore.rules for users/{uid} create/update.');
        }
      }

      throw new Error('Kunne ikke logge inn som gjest');
    }
  },

  upgradeGuestAccount: async (payload) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('not-anonymous-user');
      }

      const trimmedName = String(payload.name || '').trim();
      const trimmedEmail = String(payload.email || '').trim();
      const normalizedEmail = normalizeValue(trimmedEmail);
      const userRef = doc(firestore, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userRef);
      const existingUsername = toDisplayValue(userSnapshot.data()?.username);
      const resolvedUsername = existingUsername || buildFallbackUsername(trimmedEmail, currentUser.uid);
      const normalizedUsername = normalizeValue(resolvedUsername);

      if (!trimmedName || !trimmedEmail || !payload.password) {
        throw new Error('missing-required-upgrade-fields');
      }

      const emailSnapshot = await getDocs(query(
        collection(firestore, 'users'),
        where('emailLower', '==', normalizedEmail)
      ));
      const emailTakenByAnother = emailSnapshot.docs.some((docSnap) => docSnap.id !== currentUser.uid);
      if (emailTakenByAnother) {
        throw new Error('upgrade-email-taken');
      }

      const credential = EmailAuthProvider.credential(trimmedEmail, String(payload.password));
      await linkWithCredential(currentUser, credential);
      await updateProfile(auth.currentUser, { displayName: trimmedName });

      await updateDoc(userRef, {
        username: resolvedUsername,
        usernameLower: normalizedUsername,
        name: trimmedName,
        email: trimmedEmail,
        emailLower: normalizedEmail,
        isGuest: false,
        updatedAt: serverTimestamp(),
      });

      return { status: 'upgraded' };
    } catch (error) {
      console.error('Guest upgrade error:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = String(error.code);
        if (errorCode === 'auth/email-already-in-use') {
          throw new Error('E-postadressen er allerede i bruk');
        }
        if (errorCode === 'auth/invalid-email') {
          throw new Error('Ugyldig e-postadresse');
        }
        if (errorCode === 'auth/weak-password') {
          throw new Error('Passordet er for svakt');
        }
      }

      if (error instanceof Error) {
        if (error.message === 'not-anonymous-user') {
          throw new Error('Kun gjestebrukere kan oppgradere konto her');
        }
        if (error.message === 'missing-required-upgrade-fields') {
          throw new Error('Alle felter må fylles ut');
        }
        if (error.message === 'upgrade-email-taken') {
          throw new Error('E-postadressen er allerede i bruk');
        }
      }

      throw new Error('Kunne ikke oppgradere gjestekonto');
    }
  },
};
