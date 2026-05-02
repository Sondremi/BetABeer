import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const DistributeModal = (props: any) => {
  const {
    distributeModalVisible,
    setDistributeModalVisible,
    globalStyles,
    groupStyles,
    theme,
    hasAvailableDrinks,
    distributionLoading,
    distributions,
    shouldScrollPlannedDistributions,
    memberData,
    availableDistributionEntries,
    renderMemberCard,
    distributingDrinks,
    handleCancelDistributionFlow,
    handleDistributeDrinks,
  } = props;

  return (
    <Modal visible={distributeModalVisible} animationType="slide" transparent onRequestClose={() => setDistributeModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentLarge]}>
          <Text
            style={[
              globalStyles.modalTitle,
              { marginBottom: theme.spacing.md, fontSize: 20, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
            ]}
          >
            Del ut drikker
          </Text>

          {hasAvailableDrinks ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
              {distributionLoading && <Text style={groupStyles.modalLoadingText}>Laster...</Text>}

              {distributions.length > 0 && (
                <View style={groupStyles.modalSectionCard}>
                  <Text style={groupStyles.modalSectionTitle}>Planlagte utdelinger</Text>
                  <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Legg til flere først, og send alle samlet senere.</Text>
                  <ScrollView
                    style={shouldScrollPlannedDistributions ? globalStyles.betOptionsScrollWrap : undefined}
                    nestedScrollEnabled={shouldScrollPlannedDistributions}
                    showsVerticalScrollIndicator={shouldScrollPlannedDistributions}
                  >
                    {distributions.map((dist: any, idx: number) => {
                      const member = memberData.find((m: any) => m.id === dist.userId);
                      return (
                        <View
                          key={`${dist.userId}-${dist.drinkType}-${dist.measureType}-${dist.amount}-${idx}`}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: theme.colors.primary + '10',
                            padding: 10,
                            borderRadius: 8,
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>{member?.name}</Text>
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                            {dist.amount} {dist.measureType} {dist.drinkType}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={groupStyles.modalSectionCard}>
                <Text style={groupStyles.modalSectionTitle}>Tilgjengelig å dele ut</Text>
                {availableDistributionEntries.map((entry: any) => (
                  <View key={`${entry.drinkType}-${entry.measureType}`} style={groupStyles.availabilityRow}>
                    <Text style={{ flex: 1, color: theme.colors.text, fontSize: 14 }}>
                      {entry.measureType} {entry.drinkType}
                    </Text>
                    <Text style={groupStyles.distributionAmountPlainText}>{entry.amount}</Text>
                  </View>
                ))}
              </View>

              <View style={groupStyles.modalSectionCard}>
                <Text style={groupStyles.modalSectionTitle}>Velg mottaker</Text>
                <ScrollView style={groupStyles.recipientListWrap} nestedScrollEnabled showsVerticalScrollIndicator>
                  <View>
                    {memberData.map((member: any) => (
                      <View key={member.id}>{renderMemberCard({ item: member })}</View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
          ) : (
            <View style={[groupStyles.modalSectionCard, { alignItems: 'center', paddingVertical: theme.spacing.xl }]}>
              <Text style={[globalStyles.emptyStateText, { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' }]}>
                Ingen drikker tilgjengelig for utdeling
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm }}>
                Vinn noen bets først.
              </Text>
            </View>
          )}

          <View style={[globalStyles.editButtonsContainer, globalStyles.modalFooter, groupStyles.distributionFooterRow]}>
            <TouchableOpacity onPress={handleCancelDistributionFlow} disabled={distributingDrinks}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDistributeDrinks} disabled={distributingDrinks || distributions.length === 0}>
              <Text style={[globalStyles.saveButtonText, distributions.length === 0 && globalStyles.disabledGoldActionText]}>
                {distributingDrinks ? 'Deles ut...' : 'Del ut'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DistributeModal;
