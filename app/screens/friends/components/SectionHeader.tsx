import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../styles/globalStyles';

type SectionHeaderProps = {
  collapsedHeader?: boolean;
  expanded: boolean;
  title: string;
  onToggle: () => void;
  collapseA11yLabel: string;
  expandA11yLabel: string;
};

const SectionHeader = ({
  collapsedHeader = false,
  expanded,
  title,
  onToggle,
  collapseA11yLabel,
  expandA11yLabel,
}: SectionHeaderProps) => {
  return (
    <View style={[globalStyles.sectionHeaderRow, collapsedHeader && globalStyles.collapsedHeaderRow]}>
      <Text style={globalStyles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? collapseA11yLabel : expandA11yLabel}
      >
        <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
          {expanded ? '▾' : '▸'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SectionHeader;
