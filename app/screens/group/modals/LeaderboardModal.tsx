import React from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const LeaderboardModal = (props: any) => {
  const {
    leaderboardModalVisible,
    setLeaderboardModalVisible,
    globalStyles,
    groupStyles,
    theme,
    leaderboardView,
    setLeaderboardView,
    leaderboardLoading,
    leaderboardData,
    renderDetailedDrinkOverview,
    groupAverageBacTone,
    groupAverageBAC,
    averageBacBarProgress,
    bacVisualMax,
    bacLeaderboardData,
    getBacRangeTone,
    DefaultProfilePicture,
    renderPodiumCard,
    renderLeaderboardItem,
  } = props;

  return (
    <Modal visible={leaderboardModalVisible} animationType="slide" transparent onRequestClose={() => setLeaderboardModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.leaderboardModalContent]}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={[globalStyles.modalTitle, { marginBottom: theme.spacing.sm, fontSize: 18, fontWeight: '600', color: theme.colors.text }]}>
              {leaderboardView === 'betsWon' ? 'Betting Statistikk' : leaderboardView === 'drinkStats' ? 'Drikke Statistikk' : 'Promille Statistikk'}
            </Text>

            {leaderboardLoading && <Text style={groupStyles.modalLoadingText}>Laster...</Text>}

            <View style={groupStyles.leaderboardToggleRow}>
              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, groupStyles.leaderboardToggleButton, leaderboardView === 'betsWon' && globalStyles.defaultButton]}
                onPress={() => setLeaderboardView('betsWon')}
              >
                <Text style={[globalStyles.outlineButtonGoldText, { color: leaderboardView === 'betsWon' ? theme.colors.background : theme.colors.primary, fontSize: 14 }]}>Bets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, groupStyles.leaderboardToggleButton, leaderboardView === 'drinkStats' && globalStyles.defaultButton]}
                onPress={() => setLeaderboardView('drinkStats')}
              >
                <Text style={[globalStyles.outlineButtonGoldText, { color: leaderboardView === 'drinkStats' ? theme.colors.background : theme.colors.primary, fontSize: 14 }]}>Drikke</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, groupStyles.leaderboardToggleButton, leaderboardView === 'bac' && globalStyles.defaultButton]}
                onPress={() => setLeaderboardView('bac')}
              >
                <Text style={[globalStyles.outlineButtonGoldText, { color: leaderboardView === 'bac' ? theme.colors.background : theme.colors.primary, fontSize: 14 }]}>Promille</Text>
              </TouchableOpacity>
            </View>

            {leaderboardData.length > 0 ? (
              <View style={globalStyles.friendSpacing}>
                {leaderboardView === 'drinkStats' ? (
                  <View>
                    <Text style={groupStyles.modalSectionTitle}>Medlemmer</Text>
                    <View>
                      {leaderboardData.map((member: any) => (
                        <View key={member.userId}>{renderDetailedDrinkOverview({ item: member })}</View>
                      ))}
                    </View>
                  </View>
                ) : leaderboardView === 'bac' ? (
                  <View>
                    <View style={groupStyles.bacAverageCard}>
                      <View style={groupStyles.bacAverageHeaderRow}>
                        <Text style={groupStyles.bacAverageTitle}>Gjennomsnittlig promille</Text>
                        <Text style={[groupStyles.bacAverageValue, { color: groupAverageBacTone.valueText }]}>{groupAverageBAC.toFixed(3)}‰</Text>
                      </View>
                      <View style={groupStyles.bacAverageTrack}>
                        <View
                          style={[
                            groupStyles.bacAverageFill,
                            { backgroundColor: groupAverageBacTone.averageFill },
                            { width: `${Math.max(4, Math.round(averageBacBarProgress * 100))}%` },
                          ]}
                        />
                      </View>
                      <View style={groupStyles.bacAverageScaleRow}>
                        <Text style={globalStyles.detailedMemberSubtext}>0.000</Text>
                        <Text style={globalStyles.detailedMemberSubtext}>{bacVisualMax.toFixed(3)}</Text>
                      </View>
                      <Text style={groupStyles.bacAverageHint}>🟦 Lav: under 0.50‰</Text>
                      <Text style={groupStyles.bacAverageHint}>🟨 Moderat: 0.50-1.09‰</Text>
                      <Text style={groupStyles.bacAverageHint}>🟧 Høy: 1.10-1.59‰</Text>
                      <Text style={groupStyles.bacAverageHint}>🟥 Svært høy: 1.60‰+</Text>
                    </View>

                    <View style={[globalStyles.listContainer, { paddingBottom: theme.spacing.md }]}>
                      {bacLeaderboardData.map((member: any, idx: number) => {
                        const bacTone = getBacRangeTone(member.currentBAC);

                        return (
                          <View
                            key={member.userId}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: bacTone.rowBorder,
                              borderRadius: theme.borderRadius.md,
                              backgroundColor: bacTone.rowBackground,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              marginBottom: 8,
                            }}
                          >
                            <View
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: bacTone.badgeBackground,
                                borderWidth: 1,
                                borderColor: bacTone.badgeBorder,
                                marginRight: 10,
                                minWidth: 46,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 12, color: bacTone.badgeText, fontWeight: '700' }}>#{idx + 1}</Text>
                            </View>

                            <Image source={member.profilePicture || DefaultProfilePicture} style={[globalStyles.circularImage, { width: 42, height: 42, marginRight: 10 }]} />

                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={[groupStyles.wagerUser, { fontSize: 14, color: theme.colors.text }]} numberOfLines={1}>
                                {member.username}
                              </Text>
                              <Text style={[globalStyles.secondaryText, { fontSize: 11, color: theme.colors.textSecondary }]}>
                                {member.betsWon} vunnet • {member.betsLost} tapt
                              </Text>
                            </View>

                            <View
                              style={{
                                minWidth: 84,
                                borderRadius: theme.borderRadius.md,
                                borderWidth: 2,
                                borderColor: bacTone.valueCardBorder,
                                backgroundColor: bacTone.valueCardBackground,
                                paddingVertical: 6,
                                paddingHorizontal: 8,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 10, color: bacTone.badgeText, letterSpacing: 0.4 }}>PROMILLE</Text>
                              <Text style={{ fontSize: 16, color: bacTone.valueText, fontWeight: '700' }}>{member.currentBAC.toFixed(3)}‰</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={groupStyles.leaderboardPodiumRow}>
                      {leaderboardData[1] && renderPodiumCard({ member: leaderboardData[1], placement: 2 })}
                      {leaderboardData[0] && renderPodiumCard({ member: leaderboardData[0], placement: 1 })}
                      {leaderboardData[2] && renderPodiumCard({ member: leaderboardData[2], placement: 3 })}
                    </View>
                    {leaderboardData.length > 3 && (
                      <View style={[globalStyles.listContainer, globalStyles.leaderboardListWrap]}>
                        {leaderboardData.slice(3).map((member: any, idx: number) => (
                          <View key={member.userId}>{renderLeaderboardItem({ item: member, index: idx })}</View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <Text style={[globalStyles.emptyStateText, groupStyles.leaderboardEmptyStateText]}>Ingen data tilgjengelig ennå</Text>
            )}
          </ScrollView>

          <View style={[globalStyles.editButtonsContainer, groupStyles.modalFooterBordered]}>
            <TouchableOpacity onPress={() => setLeaderboardModalVisible(false)}>
              <Text style={[globalStyles.cancelButtonText, groupStyles.leaderboardCloseButtonText]}>Lukk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LeaderboardModal;
