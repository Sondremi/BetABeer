import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { Bet } from '../../../types/drinkTypes';

type ArchivedBetsSectionProps = {
  bets: Bet[];
  renderBet: (args: { item: Bet; index: number }) => React.ReactNode;
};

const ArchivedBetsSection = ({ bets, renderBet }: ArchivedBetsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  const archivedBets = bets.filter((bet) => bet.isFinished);
  if (archivedBets.length === 0) return null;

  return (
    <View style={groupStyles.betListSection}>
      <View style={[groupStyles.actionCard, groupStyles.betListCard]}>
        <View style={groupStyles.archivedSectionHeader}>
          <Text style={globalStyles.sectionTitleLeft}>
            Avsluttede bets ({archivedBets.length})
          </Text>
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}
            onPress={() => setExpanded((prev) => !prev)}
          >
            <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
              {expanded ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={{ marginTop: theme.spacing.md }}>
            {archivedBets.map((item) => {
              const originalIndex = bets.findIndex((bet) => bet.id === item.id);
              return (
                <View key={item.id}>
                  {renderBet({ item, index: originalIndex })}
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
