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
    <TouchableOpacity
      style={[globalStyles.sectionHeaderRow, collapsedHeader && globalStyles.collapsedHeaderRow]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={expanded ? collapseA11yLabel : expandA11yLabel}
    >
      <Text style={globalStyles.sectionTitle}>{title}</Text>
      <View style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}>
        <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
          {expanded ? '▾' : '▸'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SectionHeader;
