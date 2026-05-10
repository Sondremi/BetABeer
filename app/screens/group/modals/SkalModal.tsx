import React, { useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { DrinkType, MeasureType } from '../../../types/drinkTypes';

type SkalDistribution = {
  name: string;
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
};

type SkalModalProps = {
  visible: boolean;
  distributions: SkalDistribution[];
  onClose: () => void;
};

const SkalModal = ({ visible, distributions, onClose }: SkalModalProps) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, { width: '85%', paddingVertical: 36 }]}>
          <View style={groupStyles.skalContainer}>
            <Text style={groupStyles.skalEmoji}>🍺</Text>
            <Text style={groupStyles.skalTitle}>Skål!</Text>
            {distributions.length > 0 && (
              <>
                <Text style={groupStyles.skalSubtitle}>Du delte ut til:</Text>
                {distributions.map((d, idx) => (
                  <View key={idx} style={groupStyles.skalRow}>
                    <Text style={groupStyles.skalRowName} numberOfLines={1}>{d.name}</Text>
                    <Text style={groupStyles.skalRowDrink}>{d.amount} {d.measureType} {d.drinkType}</Text>
                  </View>
                ))}
              </>
            )}
            <TouchableOpacity style={groupStyles.skalCloseButton} onPress={onClose}>
              <Text style={groupStyles.skalCloseText}>Lukk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SkalModal;
