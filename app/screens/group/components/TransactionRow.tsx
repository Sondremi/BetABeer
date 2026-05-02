import React from 'react';
import { Text, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import type { DrinkTransaction } from '../../../types/drinkTypes';

type TransactionRowProps = {
  item: DrinkTransaction;
};

const TransactionRow = ({ item }: TransactionRowProps) => {
  return (
    <View style={groupStyles.transactionRow}>
      <Text style={groupStyles.transactionTitleText}>
        {item.fromUsername} → {item.toUsername}
      </Text>
      <Text style={groupStyles.transactionDetailText}>
        {item.amount} {item.measureType} {item.drinkType}
      </Text>
    </View>
  );
};

export default TransactionRow;
