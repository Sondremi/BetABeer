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
        (entry) => entry.drinkType === selectedDistribution.drinkType && entry.measureType === selectedDistribution.measureType
      )
    : null;

  const maxAvailable = selectedEntry?.amount || 0;
  const customAmountRaw = distributionCustomAmount.trim();
  const hasCustomAmountValue = customAmountRaw.length > 0;
  const customAmount = parseInt(distributionCustomAmount, 10);
  const resolvedAmount = distributionAmountMode === 'custom' ? customAmount : selectedDistribution?.amount || 0;

  const distributionValidationMessage = (() => {
    if (!selectedDistribution) return null;
    if (distributionAmountMode === 'custom' && !hasCustomAmountValue) return null;
    if (!Number.isInteger(resolvedAmount) || resolvedAmount <= 0) return 'Antall må være et heltall større enn 0.';
    if (resolvedAmount > maxAvailable) return `Du har kun ${maxAvailable} tilgjengelig.`;
    return null;
  })();

  const canConfirmDistribution = Boolean(selectedDistribution)
    && (distributionAmountMode !== 'custom' || hasCustomAmountValue)
    && distributionValidationMessage === null;

  const amountOptions = selectedEntry
    ? Array.from(new Set([1, 2, 3, 4, 5, 10, maxAvailable].filter((num) => num > 0 && num <= maxAvailable))).sort((a, b) => a - b)
    : [];

  return (
    <View
      style={[
        groupStyles.modalSectionCard,
        isSelected && groupStyles.memberSelectCardActive,
        (distributingDrinks || !hasAvailableDrinks) && globalStyles.disabledButton,
      ]}
    >
      <TouchableOpacity style={groupStyles.memberRow} onPress={() => onMemberTap(item.id)} disabled={distributingDrinks || !hasAvailableDrinks}>
        <Image
          source={item.profilePicture}
          style={[globalStyles.circularImage, groupStyles.memberAvatar, isSelected && groupStyles.memberSelectAvatarActive]}
        />
        <View style={groupStyles.memberMeta}>
          <Text style={[groupStyles.wagerUser, isSelected && groupStyles.memberSelectNameActive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={groupStyles.memberUsername}>@{item.username}</Text>
        </View>
        <Text style={[globalStyles.actionButtonText, isSelected ? groupStyles.memberSelectLabel : globalStyles.secondaryText]}>
          {isSelected ? 'Valgt' : 'Velg'}
        </Text>
      </TouchableOpacity>

      {isSelected && hasAvailableDrinks && (
        <View style={groupStyles.memberDistributionPanel}>
          <Text style={groupStyles.modalSectionTitle}>Velg drikke</Text>
          {availableDistributionEntries.map((entry) => (
            <TouchableOpacity
              key={`${entry.drinkType}-${entry.measureType}`}
              onPress={() => onDistributionSelect(entry.drinkType, entry.measureType)}
              style={[
                groupStyles.distributionChoiceButton,
                selectedDistribution?.drinkType === entry.drinkType
                && selectedDistribution?.measureType === entry.measureType
                && globalStyles.distributionChoiceButtonActive,
              ]}
            >
              <Text
                style={[
                  globalStyles.selectionButtonText,
                  selectedDistribution?.drinkType === entry.drinkType
                  && selectedDistribution?.measureType === entry.measureType
                  && globalStyles.primaryColorText,
                ]}
              >
                {entry.measureType} {entry.drinkType}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedDistribution && (
            <>
              <Text style={groupStyles.memberDistributionHelperText}>Velg antall</Text>
              <View style={groupStyles.amountChipRow}>
                {amountOptions.map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => onDistributionAmountChange(num)}
                    style={[groupStyles.amountChip, selectedDistribution.amount === num && globalStyles.distributionChoiceButtonActive]}
                  >
                    <Text style={[globalStyles.amountChipText, selectedDistribution.amount === num && globalStyles.amountChipTextSelected]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => {
                    onSetDistributionAmountMode('custom');
                    onSetHasInteractedDistributionCustomAmount(false);
                  }}
                  style={[groupStyles.amountChip, distributionAmountMode === 'custom' && globalStyles.distributionChoiceButtonActive]}
                >
                  <Text style={[globalStyles.amountChipText, distributionAmountMode === 'custom' && globalStyles.amountChipTextSelected]}>
                    Egendefinert
                  </Text>
                </TouchableOpacity>
              </View>

              {distributionAmountMode === 'custom' && (
                <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, distributionAmountFocused && globalStyles.inputShellFocusedGold]}>
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

              {distributionValidationMessage && (distributionAmountMode !== 'custom' || hasInteractedDistributionCustomAmount || hasCustomAmountValue) ? (
                <Text style={globalStyles.validationHelperText}>{distributionValidationMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, groupStyles.memberDistributionAddButton, !canConfirmDistribution && globalStyles.disabledButton]}
                onPress={onConfirmDistribution}
                disabled={!canConfirmDistribution}
              >
                <Text style={globalStyles.outlineButtonGoldText}>Legg til</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default DistributionMemberCard;
