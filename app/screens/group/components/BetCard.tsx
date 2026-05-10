import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { Bet, BettingOption, BetWager } from '../../../types/drinkTypes';
import type { Friend } from '../../../types/userTypes';

type BetCardProps = {
  item: Bet;
  index: number;
  userId?: string;
  memberData: Friend[];
  canManageBet: (bet: Bet) => boolean;
  getUserWagerForBet: (bet: Bet) => BetWager | null;
  getOptionName: (bet: Bet, optionId: string) => string;
  onOpenPlaceBet: (bet: Bet, option: BettingOption) => void;
  onOpenEditBet: (bet: Bet, index: number) => void;
  onMarkFinished: (bet: Bet, index: number) => void;
  pencilIcon: any;
};

const BetCard = ({
  item,
  index,
  userId,
  memberData,
  canManageBet,
  getUserWagerForBet,
  getOptionName,
  onOpenPlaceBet,
  onOpenEditBet,
  onMarkFinished,
  pencilIcon,
}: BetCardProps) => {
  const creatorName = item.createdByUsername?.trim() || '';
  const createdAtLabel = item.createdAt
    ? (() => {
        const createdDate = new Date(item.createdAt);
        const dateLabel = createdDate.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' });
        const timeLabel = createdDate.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
        return `${dateLabel} kl ${timeLabel}`;
      })()
    : null;

  const betMeta = item.isAnonymous
    ? createdAtLabel
    : [creatorName ? `Av ${creatorName}` : '', createdAtLabel]
        .filter(Boolean)
        .join(' • ');

  const hiddenMemberIds = (item.hiddenFromUserIds || []).filter((memberId) => memberId !== userId);
  const hiddenForText = hiddenMemberIds.length > 0
    ? hiddenMemberIds
        .map((memberId) => {
          const member = memberData.find((entry) => entry.id === memberId);
          return member?.name || member?.username || 'Ukjent';
        })
        .join(', ')
    : '';

  const shouldScrollOptions = item.options.length > 5;
  const shouldScrollWagers = Boolean(item.wagers && item.wagers.length > 5);

  const renderBettingOption = (option: BettingOption) => {
    const userWager = getUserWagerForBet(item);
    const isUserChoice = userWager?.optionId === option.id;
    const isCorrect = item.correctOptionId === option.id;
    const isBetFinished = item.isFinished;

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          groupStyles.bettingOption,
          isUserChoice && globalStyles.selectionButtonSelected,
          isCorrect && groupStyles.bettingOptionCorrect,
          isBetFinished && !isCorrect && groupStyles.bettingOptionIncorrect,
        ]}
        onPress={() => !isBetFinished && onOpenPlaceBet(item, option)}
        disabled={isBetFinished}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              globalStyles.amountChipText,
              isUserChoice && globalStyles.selectionButtonTextSelected,
              isCorrect && groupStyles.optionNameCorrect,
              isBetFinished && !isCorrect && globalStyles.disabledActionText,
            ]}
          >
            {option.name} {isCorrect && '✓'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={groupStyles.betContainer}>
      <View style={[globalStyles.contentCard, globalStyles.betSpacing]}>
        <View style={[globalStyles.rowSpread, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={groupStyles.betTitle}>{item.title}</Text>
            {betMeta ? <Text style={groupStyles.betMetaText}>{betMeta}</Text> : null}
            {hiddenMemberIds.length > 0 ? (
              <Text style={groupStyles.betMetaText}>Ikke synlig for: {hiddenForText}</Text>
            ) : null}
            {item.isFinished && (
              <Text style={groupStyles.betStatusText}>
                Ferdig - Riktig svar: {getOptionName(item, item.correctOptionId || '')}
              </Text>
            )}
          </View>
          {canManageBet(item) && (
            <TouchableOpacity onPress={() => onOpenEditBet(item, index)} style={{ marginTop: 2 }}>
              <Image source={pencilIcon} style={globalStyles.primaryIcon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={globalStyles.listContainer}>
          <ScrollView
            style={shouldScrollOptions ? globalStyles.betOptionsScrollWrap : undefined}
            nestedScrollEnabled={shouldScrollOptions}
            showsVerticalScrollIndicator={shouldScrollOptions}
          >
            {item.options.map((option) => renderBettingOption(option))}
          </ScrollView>
        </View>

        {item.wagers && item.wagers.length > 0 && (
          <View style={globalStyles.sectionDivider}>
            <Text style={groupStyles.wagersSectionTitle}>Plasserte bets ({item.wagers.length}):</Text>
            <ScrollView
              style={shouldScrollWagers ? globalStyles.betOptionsScrollWrap : undefined}
              nestedScrollEnabled={shouldScrollWagers}
              showsVerticalScrollIndicator={shouldScrollWagers}
            >
              {item.wagers.map((wager, wagerIndex) => (
                <View
                  key={`${wager.userId}-${wager.optionId}-${wager.measureType}-${wager.drinkType}-${wagerIndex}`}
                  style={groupStyles.wagerListItem}
                >
                  <Text style={groupStyles.wagerUser}>{wager.username}</Text>
                  <Text style={groupStyles.wagerDetails}>
                    {wager.amount} {wager.measureType} {wager.drinkType} på {getOptionName(item, wager.optionId)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {!item.isFinished && canManageBet(item) && (
          <TouchableOpacity
            style={groupStyles.betMarkFinishedRow}
            onPress={() => onMarkFinished(item, index)}
          >
            <Text style={groupStyles.betMarkFinishedText}>Marker som ferdig →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default BetCard;
