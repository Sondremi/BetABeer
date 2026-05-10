import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

type PlannedDistribution = {
  userId: string;
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
};

type DistributeModalProps = {
  distributeModalVisible: boolean;
  setDistributeModalVisible: (v: boolean) => void;
  hasAvailableDrinks: boolean;
  distributionLoading: boolean;
  distributions: PlannedDistribution[];
  memberData: Friend[];
  availableDistributionEntries: DistributionEntry[];
  renderMemberCard: (args: { item: Friend }) => React.ReactNode;
  distributingDrinks: boolean;
  handleCancelDistributionFlow: () => void;
  handleDistributeDrinks: () => void;
  handleRemoveDistribution: (index: number) => void;
};

const DistributeModal = ({
  distributeModalVisible,
  setDistributeModalVisible,
  hasAvailableDrinks,
  distributionLoading,
  distributions,
  memberData,
  availableDistributionEntries,
  renderMemberCard,
  distributingDrinks,
  handleCancelDistributionFlow,
  handleDistributeDrinks,
  handleRemoveDistribution,
}: DistributeModalProps) => {
  return (
    <Modal
      visible={distributeModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setDistributeModalVisible(false)}
    >
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentLarge]}>
          <Text style={globalStyles.modalTitle}>Del ut drikke</Text>

          {hasAvailableDrinks ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={groupStyles.modalScrollContent}
            >
              {distributionLoading ? (
                <Text style={groupStyles.modalLoadingText}>Laster...</Text>
              ) : (
                <>
                  <View style={groupStyles.modalSectionCard}>
                    <Text style={groupStyles.modalSectionTitle}>Tilgjengelig å dele ut</Text>
                    <View style={groupStyles.availableChipRow}>
                      {availableDistributionEntries.map((entry) => (
                        <View
                          key={`${entry.drinkType}-${entry.measureType}`}
                          style={groupStyles.availableChip}
                        >
                          <Text style={groupStyles.availableChipText}>
                            {entry.amount} {entry.measureType} {entry.drinkType}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={groupStyles.modalSectionCard}>
                    <Text style={groupStyles.modalSectionTitle}>Velg mottaker</Text>
                    {memberData.map((member) => (
                      <View key={member.id}>{renderMemberCard({ item: member })}</View>
                    ))}
                  </View>

                  {distributions.length > 0 && (
                    <View style={groupStyles.modalSectionCard}>
                      <Text style={groupStyles.modalSectionTitle}>
                        Planlagte utdelinger ({distributions.length})
                      </Text>
                      {distributions.map((dist, idx) => {
                        const member = memberData.find((m) => m.id === dist.userId);
                        return (
                          <View
                            key={`${dist.userId}-${dist.drinkType}-${dist.measureType}-${idx}`}
                            style={groupStyles.plannedDistRow}
                          >
                            <Text style={groupStyles.plannedDistName} numberOfLines={1}>
                              {member?.name || member?.username || 'Ukjent'}
                            </Text>
                            <Text style={groupStyles.plannedDistAmount}>
                              {dist.amount} {dist.measureType} {dist.drinkType}
                            </Text>
                            <TouchableOpacity onPress={() => handleRemoveDistribution(idx)}>
                              <Text style={groupStyles.plannedDistRemove}>×</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          ) : (
            <View style={[groupStyles.modalSectionCard, { alignItems: 'center', paddingVertical: theme.spacing.xl }]}>
              <Text style={groupStyles.modalSectionTitle}>Ingen drikker tilgjengelig</Text>
              <Text style={globalStyles.secondaryText}>Vinn noen bets først.</Text>
            </View>
          )}

          <View style={[globalStyles.editButtonsContainer, groupStyles.distributionFooterRow, groupStyles.modalFooterBordered]}>
            <TouchableOpacity onPress={handleCancelDistributionFlow} disabled={distributingDrinks}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.outlineButtonGold,
                groupStyles.distributionSubmitButton,
                (distributingDrinks || distributions.length === 0) && globalStyles.disabledButton,
              ]}
              onPress={handleDistributeDrinks}
              disabled={distributingDrinks || distributions.length === 0}
            >
              <Text style={[globalStyles.outlineButtonGoldText, groupStyles.distributionSubmitText]}>
                {distributingDrinks
                  ? 'Deles ut...'
                  : distributions.length > 0
                    ? `Del ut (${distributions.length})`
                    : 'Del ut'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DistributeModal;
