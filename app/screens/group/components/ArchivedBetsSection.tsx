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
        <TouchableOpacity
          style={groupStyles.archivedSectionHeader}
          onPress={() => setExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={globalStyles.sectionTitleLeft}>
            Avsluttede bets ({archivedBets.length})
          </Text>
          <View style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}>
            <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
              {expanded ? '▾' : '▸'}
            </Text>
          </View>
        </TouchableOpacity>

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
