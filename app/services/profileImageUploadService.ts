import { deleteObject, getDownloadURL, getMetadata, listAll, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase/FirebaseConfig';

const PROFILE_IMAGES_ROOT = 'profileImages';
const GROUP_IMAGES_ROOT = 'groupImages';
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024;
const BLOB_FETCH_TIMEOUT_MS = 12_000;
const STORAGE_USAGE_TIMEOUT_MS = 8_000;
const UPLOAD_TIMEOUT_MS = 20_000;
const DOWNLOAD_URL_TIMEOUT_MS = 10_000;
type UploadImageSource = string | Blob;

const isDataUrl = (value: string) => value.startsWith('data:');

const dataUrlToBlob = (dataUrl: string): Blob => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Ugyldig bildeformat fra filvelger.');
  }

  const mimeType = match[1] || 'image/jpeg';
  const base64Data = match[2];
  const decode = globalThis.atob;
  if (!decode) {
    throw new Error('Nettleseren støtter ikke opplasting av dette bildeformatet.');
  }

  const binary = decode(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, timeoutErrorMessage: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(timeoutErrorMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const getBlobFromUri = async (uri: string): Promise<Blob> => {
  try {
    const response = await withTimeout(fetch(uri), BLOB_FETCH_TIMEOUT_MS, 'Tidsavbrudd ved lesing av bildefil.');
    if (!response.ok) {
      throw new Error('Kunne ikke lese bildefilen.');
    }
    return await withTimeout(response.blob(), BLOB_FETCH_TIMEOUT_MS, 'Tidsavbrudd ved lesing av bildefil.');
  } catch {
    // Safari/WebKit can fail to fetch local picker URIs on web; XHR blob fallback is more reliable.
    return new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'blob';
      xhr.timeout = BLOB_FETCH_TIMEOUT_MS;

      xhr.onload = () => {
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
          resolve(xhr.response as Blob);
        } else {
          reject(new Error('Kunne ikke lese bildefilen.'));
        }
      };

      xhr.onerror = () => reject(new Error('Kunne ikke lese bildefilen.'));
      xhr.ontimeout = () => reject(new Error('Tidsavbrudd ved lesing av bildefil.'));
      xhr.send();
    });
  }
};

const getBlobFromSource = async (source: UploadImageSource): Promise<Blob> => {
  if (typeof source !== 'string') {
    return source;
  }

  if (isDataUrl(source)) {
    return dataUrlToBlob(source);
  }

  return getBlobFromUri(source);
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

export const uploadProfileImage = async (userId: string, fileSource: UploadImageSource): Promise<string> => {
  if (!userId) throw new Error('Mangler bruker for opplasting.');

  const imageBlob = await getBlobFromSource(fileSource);

  if (imageBlob.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error('Bildet er for stort. Maks størrelse for profilbilde er 4 MB.');
  }

  const currentUsage = await withTimeout(
    getProfileImageStorageUsageBytes(),
    STORAGE_USAGE_TIMEOUT_MS,
    'Tidsavbrudd ved sjekk av lagringsbruk for profilbilder.'
  ).catch((error) => {
    console.warn('Lagringsbruk-sjekk feilet for profilbilder, fortsetter med opplasting:', error);
    return 0;
  });

  if (currentUsage + imageBlob.size > STORAGE_LIMIT_BYTES) {
    throw new Error('Profilbildeopplasting er midlertidig stoppet fordi lagringsgrensen på 5GB er nådd.');
  }

  const imageRef = ref(storage, `${PROFILE_IMAGES_ROOT}/${userId}/profile.jpg`);
  await withTimeout(uploadBytes(imageRef, imageBlob, {
    contentType: imageBlob.type || 'image/jpeg',
    cacheControl: 'public,max-age=3600',
  }), UPLOAD_TIMEOUT_MS, 'Tidsavbrudd ved opplasting av profilbilde. Prøv igjen.');

  return withTimeout(
    getDownloadURL(imageRef),
    DOWNLOAD_URL_TIMEOUT_MS,
    'Tidsavbrudd ved henting av bilde-URL. Prøv igjen.'
  );
};

export const uploadGroupImage = async (groupId: string, fileSource: UploadImageSource): Promise<string> => {
  if (!groupId) throw new Error('Mangler gruppe for opplasting.');

  const imageBlob = await getBlobFromSource(fileSource);

  if (imageBlob.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error('Bildet er for stort. Maks størrelse for gruppebilde er 4 MB.');
  }

  const currentUsage = await withTimeout(
    getGroupImageStorageUsageBytes(),
    STORAGE_USAGE_TIMEOUT_MS,
    'Tidsavbrudd ved sjekk av lagringsbruk for gruppebilder.'
  ).catch((error) => {
    console.warn('Lagringsbruk-sjekk feilet for gruppebilder, fortsetter med opplasting:', error);
    return 0;
  });
  if (currentUsage + imageBlob.size > STORAGE_LIMIT_BYTES) {
    throw new Error('Gruppebilde-opplasting er midlertidig stoppet fordi lagringsgrensen på 5GB er nådd.');
  }

  const imageRef = ref(storage, `${GROUP_IMAGES_ROOT}/${groupId}/group.jpg`);
  await withTimeout(uploadBytes(imageRef, imageBlob, {
    contentType: imageBlob.type || 'image/jpeg',
    cacheControl: 'public,max-age=3600',
  }), UPLOAD_TIMEOUT_MS, 'Tidsavbrudd ved opplasting av gruppebilde. Prøv igjen.');

  return withTimeout(
    getDownloadURL(imageRef),
    DOWNLOAD_URL_TIMEOUT_MS,
    'Tidsavbrudd ved henting av bilde-URL. Prøv igjen.'
  );
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
