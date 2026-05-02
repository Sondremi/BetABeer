import { useCallback, useEffect, useState } from 'react';
import { friendSearch } from '../../../services/friendService';
import type { Friend, FriendWithPending } from '../../../types/userTypes';
import { INPUT_LIMITS, normalizeSingleLineText } from '../../../utils/inputValidation';
import { showAlert } from '../../../utils/platformAlert';

type UseFriendSearchParams = {
  friends: FriendWithPending[];
};

export const useFriendSearch = ({ friends }: UseFriendSearchParams) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const performSearch = useCallback(async (term: string) => {
    const normalizedTerm = normalizeSingleLineText(term);
    if (!normalizedTerm) {
      setSearchResults([]);
      return;
    }

    if (normalizedTerm.length > INPUT_LIMITS.friendSearchMax) {
      showAlert('Feil', `Søket er for langt (maks ${INPUT_LIMITS.friendSearchMax} tegn).`);
      return;
    }

    try {
      const results = await friendSearch(normalizedTerm);
      const filteredResults = (results as Friend[]).filter(
        (result) => !friends.some((friend) => friend.id === result.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error handling search: ', error);
    }
  }, [friends]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      void performSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, performSearch]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    searchFocused,
    setSearchFocused,
    performSearch,
  };
};
