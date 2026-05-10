import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { Bet } from '../../../types/drinkTypes';

type ArchivedBetsSectionProps = {
  bets: Bet[];
  userId?: string;
  canManageBet: (bet: Bet) => boolean;
  renderBet: (args: { item: Bet; index: number }) => React.ReactNode;
  onReactivate: (betIndex: number) => void;
};

const ArchivedBetsSection = ({ bets, userId: _userId, canManageBet, renderBet, onReactivate }: ArchivedBetsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  const archivedBets = bets.filter((bet) => bet.isFinished);
  if (archivedBets.length === 0) return null;

  return (
    <View style={groupStyles.betListSection}>
      <View style={[groupStyles.actionCard, groupStyles.betListCard]}>
        <TouchableOpacity
          style={groupStyles.archivedSectionHeader}
          onPress={() => setExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={globalStyles.sectionTitleLeft}>
            Avsluttede bets ({archivedBets.length})
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {expanded && (
          <View style={{ marginTop: theme.spacing.md }}>
            {archivedBets.map((item) => {
              const originalIndex = bets.findIndex((bet) => bet.id === item.id);
              return (
                <View key={item.id}>
                  {renderBet({ item, index: originalIndex })}
                  {canManageBet(item) && (
                    <TouchableOpacity
                      style={groupStyles.betReactivateRow}
                      onPress={() => onReactivate(originalIndex)}
                    >
                      <Text style={groupStyles.betReactivateText}>Gjenåpne bet ↩</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default ArchivedBetsSection;
