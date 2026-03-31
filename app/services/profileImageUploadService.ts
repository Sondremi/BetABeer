import { deleteObject, getDownloadURL, getMetadata, listAll, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase/FirebaseConfig';

const PROFILE_IMAGES_ROOT = 'profileImages';
const GROUP_IMAGES_ROOT = 'groupImages';
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

const getBlobFromUri = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Kunne ikke lese bildefilen.');
  }
  return response.blob();
};

const getUsageBytesRecursive = async (folderRef: ReturnType<typeof ref>): Promise<number> => {
  const listed = await listAll(folderRef);

  const fileSizes = await Promise.all(
    listed.items.map(async (itemRef) => {
      const metadata = await getMetadata(itemRef);
      return Number(metadata.size || 0);
    })
  );

  const subfolderSizes = await Promise.all(
    listed.prefixes.map((prefixRef) => getUsageBytesRecursive(prefixRef))
  );

  return fileSizes.reduce((sum, size) => sum + size, 0) + subfolderSizes.reduce((sum, size) => sum + size, 0);
};

export const getProfileImageStorageUsageBytes = async (): Promise<number> => {
  try {
    const rootRef = ref(storage, PROFILE_IMAGES_ROOT);
    return await getUsageBytesRecursive(rootRef);
  } catch (error) {
    console.warn('Kunne ikke lese lagringsbruk for profilbilder:', error);
    return 0;
  }
};

export const getGroupImageStorageUsageBytes = async (): Promise<number> => {
  try {
    const rootRef = ref(storage, GROUP_IMAGES_ROOT);
    return await getUsageBytesRecursive(rootRef);
  } catch (error) {
    console.warn('Kunne ikke lese lagringsbruk for gruppebilder:', error);
    return 0;
  }
};

export const uploadProfileImage = async (userId: string, fileUri: string): Promise<string> => {
  if (!userId) throw new Error('Mangler bruker for opplasting.');

  const imageBlob = await getBlobFromUri(fileUri);

  if (imageBlob.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error('Bildet er for stort. Maks størrelse for profilbilde er 2 MB.');
  }

  const currentUsage = await getProfileImageStorageUsageBytes();

  if (currentUsage + imageBlob.size > STORAGE_LIMIT_BYTES) {
    throw new Error('Profilbildeopplasting er midlertidig stoppet fordi lagringsgrensen på 5GB er nådd.');
  }

  const imageRef = ref(storage, `${PROFILE_IMAGES_ROOT}/${userId}/profile.jpg`);
  await uploadBytes(imageRef, imageBlob, {
    contentType: imageBlob.type || 'image/jpeg',
    cacheControl: 'public,max-age=3600',
  });

  return getDownloadURL(imageRef);
};

export const uploadGroupImage = async (groupId: string, fileUri: string): Promise<string> => {
  if (!groupId) throw new Error('Mangler gruppe for opplasting.');

  const imageBlob = await getBlobFromUri(fileUri);

  if (imageBlob.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error('Bildet er for stort. Maks størrelse for gruppebilde er 2 MB.');
  }

  const currentUsage = await getGroupImageStorageUsageBytes();
  if (currentUsage + imageBlob.size > STORAGE_LIMIT_BYTES) {
    throw new Error('Gruppebilde-opplasting er midlertidig stoppet fordi lagringsgrensen på 5GB er nådd.');
  }

  const imageRef = ref(storage, `${GROUP_IMAGES_ROOT}/${groupId}/group.jpg`);
  await uploadBytes(imageRef, imageBlob, {
    contentType: imageBlob.type || 'image/jpeg',
    cacheControl: 'public,max-age=3600',
  });

  return getDownloadURL(imageRef);
};

export const removeGroupImage = async (groupId: string): Promise<void> => {
  if (!groupId) return;

  const imageRef = ref(storage, `${GROUP_IMAGES_ROOT}/${groupId}/group.jpg`);
  try {
    await deleteObject(imageRef);
  } catch (error: any) {
    if (error?.code !== 'storage/object-not-found') {
      throw error;
    }
  }
};
