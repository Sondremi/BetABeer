import { useCallback, useMemo } from 'react';
import { INPUT_LIMITS, isValidEmailFormat, normalizeSingleLineText } from '../../../utils/inputValidation';
import { showAlert } from '../../../utils/platformAlert';
import type { SettingsUserInfo } from '../types';

type UseSettingsValidationParams = {
  editedInfo: SettingsUserInfo;
};

export const useSettingsValidation = ({ editedInfo }: UseSettingsValidationParams) => {
  const validateEditedData = useCallback(() => {
    const normalizedName = normalizeSingleLineText(editedInfo.name);
    const normalizedEmail = editedInfo.email.trim();

    if (!normalizedName) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (normalizedName.length > INPUT_LIMITS.profileNameMax) {
      showAlert('Feil', `Navn kan maks være ${INPUT_LIMITS.profileNameMax} tegn`);
      return false;
    }

    if (!normalizedEmail) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    if (normalizedEmail.length > INPUT_LIMITS.emailMax) {
      showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn`);
      return false;
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    if (
      editedInfo.weight != null
      && (isNaN(editedInfo.weight)
      || editedInfo.weight < INPUT_LIMITS.weightMinKg
      || editedInfo.weight > INPUT_LIMITS.weightMaxKg)
    ) {
      showAlert('Feil', `Vekt må være mellom ${INPUT_LIMITS.weightMinKg} og ${INPUT_LIMITS.weightMaxKg} kg`);
      return false;
    }

    return true;
  }, [editedInfo]);

  const canSaveEditedData = useMemo(() => {
    const normalizedName = normalizeSingleLineText(editedInfo.name);
    const normalizedEmail = editedInfo.email.trim();

    if (!normalizedName) return false;
    if (normalizedName.length > INPUT_LIMITS.profileNameMax) return false;
    if (!normalizedEmail) return false;
    if (normalizedEmail.length > INPUT_LIMITS.emailMax) return false;
    if (!isValidEmailFormat(normalizedEmail)) return false;

    if (
      editedInfo.weight != null
      && (isNaN(editedInfo.weight)
      || editedInfo.weight < INPUT_LIMITS.weightMinKg
      || editedInfo.weight > INPUT_LIMITS.weightMaxKg)
    ) {
      return false;
    }

    return true;
  }, [editedInfo]);

  return {
    validateEditedData,
    canSaveEditedData,
  };
};
