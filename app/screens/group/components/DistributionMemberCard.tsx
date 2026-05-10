import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { DrinkType, MeasureType } from '../../../types/drinkTypes';
import type { Friend } from '../../../types/userTypes';

type DistributionEntry = {
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
};

type SelectedDistribution = {
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
};

type DistributionMemberCardProps = {
  item: Friend;
  selectedMember: string | null;
  selectedDistribution: SelectedDistribution | null;
  availableDistributionEntries: DistributionEntry[];
  distributionCustomAmount: string;
  distributionAmountMode: 'preset' | 'custom';
  hasInteractedDistributionCustomAmount: boolean;
  distributionAmountFocused: boolean;
  distributingDrinks: boolean;
  hasAvailableDrinks: boolean;
  onMemberTap: (userId: string) => void;
  onDistributionSelect: (drinkType: DrinkType, measureType: MeasureType) => void;
  onDistributionAmountChange: (amount: number) => void;
  onSetDistributionAmountMode: (mode: 'preset' | 'custom') => void;
  onSetHasInteractedDistributionCustomAmount: (value: boolean) => void;
  onSetDistributionCustomAmount: (value: string) => void;
  onSetDistributionAmountFocused: (value: boolean) => void;
  onConfirmDistribution: () => void;
  clampDigits: (value: string, maxDigits: number) => string;
};

const DistributionMemberCard = ({
  item,
  selectedMember,
  selectedDistribution,
  availableDistributionEntries,
  distributionCustomAmount,
  distributionAmountMode,
  hasInteractedDistributionCustomAmount,
  distributionAmountFocused,
  distributingDrinks,
  hasAvailableDrinks,
  onMemberTap,
  onDistributionSelect,
  onDistributionAmountChange,
  onSetDistributionAmountMode,
  onSetHasInteractedDistributionCustomAmount,
  onSetDistributionCustomAmount,
  onSetDistributionAmountFocused,
  onConfirmDistribution,
  clampDigits,
}: DistributionMemberCardProps) => {
  const isSelected = selectedMember === item.id;
  const selectedEntry = selectedDistribution
    ? availableDistributionEntries.find(
        (e) => e.drinkType === selectedDistribution.drinkType && e.measureType === selectedDistribution.measureType
      )
    : null;

  const maxAvailable = selectedEntry?.amount ?? 0;
  const customAmountRaw = distributionCustomAmount.trim();
  const hasCustomAmountValue = customAmountRaw.length > 0;
  const customAmount = parseInt(distributionCustomAmount, 10);
  const resolvedAmount = distributionAmountMode === 'custom' ? customAmount : (selectedDistribution?.amount ?? 0);

  const validationMessage = (() => {
    if (!selectedDistribution) return null;
    if (distributionAmountMode === 'custom' && !hasCustomAmountValue) return null;
    if (!Number.isInteger(resolvedAmount) || resolvedAmount <= 0) return 'Antall må være et heltall større enn 0.';
    if (resolvedAmount > maxAvailable) return `Du har kun ${maxAvailable} tilgjengelig.`;
    return null;
  })();

  const canConfirm =
    Boolean(selectedDistribution) &&
    (distributionAmountMode !== 'custom' || hasCustomAmountValue) &&
    validationMessage === null;

  const amountOptions = selectedEntry
    ? Array.from(new Set([1, 2, 3, 5, 10, maxAvailable].filter((n) => n > 0 && n <= maxAvailable))).sort((a, b) => a - b)
    : [];

  const disabled = distributingDrinks || !hasAvailableDrinks;

  return (
    <View style={[groupStyles.modalSectionCard, { marginBottom: theme.spacing.sm }, isSelected && groupStyles.memberSelectCardActive]}>
      <TouchableOpacity
        style={groupStyles.memberRow}
        onPress={() => onMemberTap(item.id)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Image
          source={item.profilePicture}
          style={[globalStyles.circularImage, groupStyles.memberAvatar, isSelected && groupStyles.memberSelectAvatarActive]}
        />
        <View style={groupStyles.memberMeta}>
          <Text style={[groupStyles.memberName, isSelected && groupStyles.memberSelectNameActive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={groupStyles.memberUsername}>@{item.username}</Text>
        </View>
        <Text style={[globalStyles.actionButtonText, isSelected ? groupStyles.memberSelectLabel : globalStyles.secondaryText]}>
          {isSelected ? 'Valgt ✓' : 'Velg'}
        </Text>
      </TouchableOpacity>

      {isSelected && hasAvailableDrinks && (
        <View style={groupStyles.memberDistributionPanel}>
          <Text style={groupStyles.modalSectionTitle}>Velg drikke</Text>
          {availableDistributionEntries.map((entry) => {
            const active =
              selectedDistribution?.drinkType === entry.drinkType &&
              selectedDistribution?.measureType === entry.measureType;
            return (
              <TouchableOpacity
                key={`${entry.drinkType}-${entry.measureType}`}
                onPress={() => onDistributionSelect(entry.drinkType, entry.measureType)}
                style={[groupStyles.distributionChoiceButton, active && globalStyles.distributionChoiceButtonActive]}
              >
                <Text style={[globalStyles.selectionButtonText, active && globalStyles.primaryColorText]}>
                  {entry.measureType} {entry.drinkType}
                </Text>
                <Text style={groupStyles.distributionAmountPlainText}>{entry.amount} igjen</Text>
              </TouchableOpacity>
            );
          })}

          {selectedDistribution && (
            <>
              <Text style={groupStyles.memberDistributionHelperText}>Velg antall</Text>
              <View style={groupStyles.amountChipRow}>
                {amountOptions.map((num) => {
                  const active = distributionAmountMode === 'preset' && selectedDistribution.amount === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      onPress={() => onDistributionAmountChange(num)}
                      style={[groupStyles.amountChip, active && globalStyles.distributionChoiceButtonActive]}
                    >
                      <Text style={[globalStyles.amountChipText, active && globalStyles.amountChipTextSelected]}>
                        {num === maxAvailable ? `${num} (maks)` : num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => {
                    onSetDistributionAmountMode('custom');
                    onSetHasInteractedDistributionCustomAmount(false);
                  }}
                  style={[groupStyles.amountChip, distributionAmountMode === 'custom' && globalStyles.distributionChoiceButtonActive]}
                >
                  <Text style={[globalStyles.amountChipText, distributionAmountMode === 'custom' && globalStyles.amountChipTextSelected]}>
                    Annet
                  </Text>
                </TouchableOpacity>
              </View>

              {distributionAmountMode === 'custom' && (
                <View style={[globalStyles.inputShellDark, { marginBottom: theme.spacing.sm }, distributionAmountFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    placeholder="Antall"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={distributionCustomAmount}
                    onChangeText={(text) => {
                      onSetDistributionCustomAmount(clampDigits(text, 3));
                      onSetHasInteractedDistributionCustomAmount(true);
                    }}
                    onFocus={() => onSetDistributionAmountFocused(true)}
                    onBlur={() => {
                      onSetDistributionAmountFocused(false);
                      onSetHasInteractedDistributionCustomAmount(true);
                    }}
                    keyboardType="numeric"
                    style={[globalStyles.input, groupStyles.inputInsideShell]}
                    maxLength={3}
                  />
                </View>
              )}

              {validationMessage && (distributionAmountMode !== 'custom' || hasInteractedDistributionCustomAmount || hasCustomAmountValue) && (
                <Text style={globalStyles.validationHelperText}>{validationMessage}</Text>
              )}

              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, groupStyles.memberDistributionAddButton, !canConfirm && globalStyles.disabledButton]}
                onPress={onConfirmDistribution}
                disabled={!canConfirm}
              >
                <Text style={globalStyles.outlineButtonGoldText}>Legg til →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default DistributionMemberCard;
