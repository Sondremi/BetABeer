import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { DrinkTransaction, DrinkType, MeasureType, MemberDrinkStats } from '../../../types/drinkTypes';
import TransactionRow from './TransactionRow';

type DrinkDetailView = 'consume' | 'consumed' | 'distribute';

type DrinkBreakdownRow = {
  key: string;
  label: string;
  amount: number;
  drinkType?: DrinkType;
  measureType?: MeasureType;
};

type DetailedDrinkOverviewCardProps = {
  item: MemberDrinkStats;
  isOwnUser: boolean;
  selectedDetailView: DrinkDetailView;
  onSelectDetailView: (view: DrinkDetailView) => void;
  consumingDrinkKey: string | null;
  onRegisterConsumedDrink: (drinkType: DrinkType, measureType: MeasureType) => void;
  memberDistributedTransactions: DrinkTransaction[];
  memberReceivedTransactions: DrinkTransaction[];
  defaultProfilePicture: any;
  getMemberName: (member: Pick<MemberDrinkStats, 'name' | 'username'>) => string;
  getMemberUsernameLabel: (member: Pick<MemberDrinkStats, 'username'>) => string;
};

const DetailedDrinkOverviewCard = ({
  item,
  isOwnUser,
  selectedDetailView,
  onSelectDetailView,
  consumingDrinkKey,
  onRegisterConsumedDrink,
  memberDistributedTransactions,
  memberReceivedTransactions,
  defaultProfilePicture,
  getMemberName,
  getMemberUsernameLabel,
}: DetailedDrinkOverviewCardProps) => {
  const totalToConsume = Object.values(item.drinksToConsume).reduce((sum, drinkTypeObj) => {
    return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
  }, 0);

  const totalConsumed = Object.values(item.drinksConsumed || {}).reduce((sum, drinkTypeObj) => {
    return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
  }, 0);

  const totalToDistribute = Object.values(item.drinksToDistribute).reduce((sum, drinkTypeObj) => {
    return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
  }, 0);

  const drinkBreakdown: { [key: string]: { [key: string]: number } } = {};
  Object.entries(item.drinksToConsume).forEach(([drinkType, measures]) => {
    Object.entries(measures || {}).forEach(([measureType, amount]) => {
      if (!drinkBreakdown[drinkType]) drinkBreakdown[drinkType] = {};
      drinkBreakdown[drinkType][measureType] = (drinkBreakdown[drinkType][measureType] || 0) + (amount || 0);
    });
  });

  const drinkBreakdownRows: DrinkBreakdownRow[] = Object.entries(drinkBreakdown).flatMap(([drinkType, measures]) =>
    Object.entries(measures)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([measureType, amount]) => ({
        key: `${drinkType}-${measureType}`,
        drinkType: drinkType as DrinkType,
        measureType: measureType as MeasureType,
        label: `${drinkType} - ${measureType}`,
        amount,
      }))
  );

  const consumedBreakdown: { [key: string]: { [key: string]: number } } = {};
  Object.entries(item.drinksConsumed || {}).forEach(([drinkType, measures]) => {
    Object.entries(measures || {}).forEach(([measureType, amount]) => {
      if (!consumedBreakdown[drinkType]) consumedBreakdown[drinkType] = {};
      consumedBreakdown[drinkType][measureType] = (consumedBreakdown[drinkType][measureType] || 0) + (amount || 0);
    });
  });

  const consumedBreakdownRows: DrinkBreakdownRow[] = Object.entries(consumedBreakdown).flatMap(([drinkType, measures]) =>
    Object.entries(measures)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([measureType, amount]) => ({
        key: `consumed-${drinkType}-${measureType}`,
        label: `${drinkType} - ${measureType}`,
        amount,
      }))
  );

  const distributeBreakdown: { [key: string]: { [key: string]: number } } = {};
  Object.entries(item.drinksToDistribute || {}).forEach(([drinkType, measures]) => {
    Object.entries(measures || {}).forEach(([measureType, amount]) => {
      if (!distributeBreakdown[drinkType]) distributeBreakdown[drinkType] = {};
      distributeBreakdown[drinkType][measureType] = (distributeBreakdown[drinkType][measureType] || 0) + (amount || 0);
    });
  });

  const distributeBreakdownRows: DrinkBreakdownRow[] = Object.entries(distributeBreakdown).flatMap(([drinkType, measures]) =>
    Object.entries(measures)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([measureType, amount]) => ({
        key: `distribute-${drinkType}-${measureType}`,
        label: `${drinkType} - ${measureType}`,
        amount,
      }))
  );

  const selectedRows: DrinkBreakdownRow[] =
    selectedDetailView === 'consume'
      ? drinkBreakdownRows
      : selectedDetailView === 'consumed'
        ? consumedBreakdownRows
        : distributeBreakdownRows;

  const selectedSectionTitle =
    selectedDetailView === 'consume'
      ? 'Må drikke'
      : selectedDetailView === 'consumed'
        ? 'Drukket'
        : 'Til utdeling';

  const showDistributeTransferSection = selectedDetailView === 'distribute' && memberDistributedTransactions.length > 0;
  const shouldScrollDistributedTransfers = memberDistributedTransactions.length > 5;
  const showReceivedTransferSection = selectedDetailView === 'consume' && memberReceivedTransactions.length > 0;
  const shouldScrollReceivedTransfers = memberReceivedTransactions.length > 5;

  return (
    <View style={groupStyles.detailedMemberCard}>
      <View style={groupStyles.detailedMemberHeader}>
        <Image
          source={item.profilePicture || defaultProfilePicture}
          style={[globalStyles.circularImage, groupStyles.detailedMemberAvatar]}
        />
        <View style={{ flex: 1 }}>
          <Text style={globalStyles.primaryText}>{getMemberName(item)}</Text>
          <Text style={globalStyles.detailedMemberSubtext}>{getMemberUsernameLabel(item)} • {item.betsWon} vunnet • {item.betsLost} tap</Text>
        </View>
      </View>

      <View style={groupStyles.statChipRow}>
        <TouchableOpacity
          onPress={() => onSelectDetailView('consume')}
          style={[groupStyles.statChip, selectedDetailView === 'consume' && groupStyles.statChipPrimary]}
        >
          <Text style={globalStyles.detailedMemberSubtext}>Må drikke</Text>
          <Text style={groupStyles.statChipValue}>{totalToConsume}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSelectDetailView('consumed')}
          style={[groupStyles.statChip, selectedDetailView === 'consumed' && groupStyles.statChipPrimary]}
        >
          <Text style={globalStyles.detailedMemberSubtext}>Drukket</Text>
          <Text style={groupStyles.statChipValue}>{totalConsumed}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSelectDetailView('distribute')}
          style={[groupStyles.statChip, selectedDetailView === 'distribute' && groupStyles.statChipPrimary]}
        >
          <Text style={globalStyles.detailedMemberSubtext}>Til utdeling</Text>
          <Text style={groupStyles.statChipValue}>{totalToDistribute}</Text>
        </TouchableOpacity>
      </View>

      {selectedRows.length > 0 || showDistributeTransferSection || showReceivedTransferSection ? (
        <View style={groupStyles.modalSectionCard}>
          <Text style={groupStyles.modalSectionTitle}>{selectedSectionTitle}</Text>
          {selectedDetailView === 'consume' && isOwnUser && (
            <Text style={[globalStyles.secondaryText, globalStyles.distributionChoiceBlock]}>
              Trykk &quot;Drikk&quot; for å registrere at du har drukket én av valgt type.
            </Text>
          )}

          {selectedRows.length > 0 ? (
            <ScrollView
              style={selectedRows.length > 5 ? groupStyles.statsBreakdownScroll : undefined}
              nestedScrollEnabled={selectedRows.length > 5}
              showsVerticalScrollIndicator={selectedRows.length > 5}
            >
              {selectedRows.map((row) => (
                <View key={row.key} style={groupStyles.statsBreakdownRow}>
                  <Text style={groupStyles.statsBreakdownLabel}>{row.label}</Text>
                  <View style={globalStyles.requestActionRow}>
                    <Text style={groupStyles.statsBreakdownValue}>{row.amount}</Text>
                    {selectedDetailView === 'consume' && isOwnUser && row.amount > 0 && row.drinkType && row.measureType && (
                      <TouchableOpacity
                        onPress={() => onRegisterConsumedDrink(row.drinkType!, row.measureType!)}
                        disabled={Boolean(consumingDrinkKey)}
                        style={[
                          globalStyles.outlineButtonGold,
                          groupStyles.consumeActionButton,
                          consumingDrinkKey && globalStyles.disabledButton,
                        ]}
                      >
                        <Text style={[globalStyles.outlineButtonGoldText, groupStyles.consumeActionButtonText]}>
                          {consumingDrinkKey === row.key ? 'Laster...' : 'Drikk'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            selectedDetailView === 'distribute' && (
              <Text style={[globalStyles.secondaryText, globalStyles.distributionChoiceBlock]}>
                Ingen drikker tilgjengelig for utdeling akkurat nå.
              </Text>
            )
          )}

          {showDistributeTransferSection && (
            <View>
              <Text style={[groupStyles.modalSectionTitle, { marginTop: theme.spacing.sm }]}>Siste overføringer</Text>
              <ScrollView
                style={shouldScrollDistributedTransfers ? globalStyles.betOptionsScrollWrap : undefined}
                nestedScrollEnabled={shouldScrollDistributedTransfers}
                showsVerticalScrollIndicator={shouldScrollDistributedTransfers}
              >
                <View style={[globalStyles.listContainer, globalStyles.leaderboardListWrap]}>
                  {memberDistributedTransactions.map((transaction, idx) => (
                    <View key={`${transaction.fromUserId}-${transaction.toUserId}-${transaction.timestamp}-${idx}`}>
                      <TransactionRow item={transaction} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {showReceivedTransferSection && (
            <View>
              <Text style={[groupStyles.modalSectionTitle, { marginTop: theme.spacing.sm }]}>Siste overføringer</Text>
              <ScrollView
                style={shouldScrollReceivedTransfers ? globalStyles.betOptionsScrollWrap : undefined}
                nestedScrollEnabled={shouldScrollReceivedTransfers}
                showsVerticalScrollIndicator={shouldScrollReceivedTransfers}
              >
                <View style={[globalStyles.listContainer, globalStyles.leaderboardListWrap]}>
                  {memberReceivedTransactions.map((transaction, idx) => (
                    <View key={`${transaction.fromUserId}-${transaction.toUserId}-${transaction.timestamp}-${idx}`}>
                      <TransactionRow item={transaction} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <View style={[groupStyles.modalSectionCard, { alignItems: 'center' }]}>
          <Text style={groupStyles.noConsumeDrinksTitle}>
            {selectedDetailView === 'consume'
              ? 'Ingen drikker til konsum'
              : selectedDetailView === 'consumed'
                ? 'Ingen registrerte drikker'
                : 'Ingen drikker til utdeling'}
          </Text>
          <Text style={groupStyles.noConsumeDrinksSubtext}>
            {selectedDetailView === 'consume'
              ? 'Alt er enten utdelt eller ferdig drukket.'
              : selectedDetailView === 'consumed'
                ? 'Ingen drikker er registrert som drukket ennå.'
                : 'Ingen drikker er tilgjengelige for utdeling akkurat nå.'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default DetailedDrinkOverviewCard;
