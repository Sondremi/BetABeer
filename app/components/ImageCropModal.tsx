import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';

const clamp = (value: number, minValue: number, maxValue: number) => Math.max(minValue, Math.min(maxValue, value));

type ImageCropModalProps = {
  visible: boolean;
  imageUri: string | null;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio: number;
  shape: 'circle' | 'rect';
  title?: string;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
};

const ImageCropModal = ({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  aspectRatio,
  shape,
  title,
  onCancel,
  onConfirm,
}: ImageCropModalProps) => {
  const [processing, setProcessing] = useState(false);
  const [resolvedSize, setResolvedSize] = useState<{ width: number; height: number } | null>(
    imageWidth && imageHeight ? { width: imageWidth, height: imageHeight } : null
  );

  const screenWidth = Dimensions.get('window').width;
  const frameWidth = Math.min(screenWidth - theme.spacing.xxxl * 2, 320);
  const frameHeight = Math.round(frameWidth / aspectRatio);

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panValue = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const subscriptionId = pan.addListener((value) => {
      panValue.current = value;
    });

    return () => {
      pan.removeListener(subscriptionId);
    };
  }, [pan]);

  useEffect(() => {
    if (!imageUri) return;
    pan.setValue({ x: 0, y: 0 });
    panStart.current = { x: 0, y: 0 };
    if (imageWidth && imageHeight) {
      setResolvedSize({ width: imageWidth, height: imageHeight });
    } else {
      setResolvedSize(null);
    }
  }, [imageUri, imageWidth, imageHeight, pan]);

  const scale = useMemo(() => {
    if (!resolvedSize) return 1;
    return Math.max(frameWidth / resolvedSize.width, frameHeight / resolvedSize.height);
  }, [frameHeight, frameWidth, resolvedSize]);

  const maxOffsetX = useMemo(() => {
    if (!resolvedSize) return 0;
    const displayedWidth = resolvedSize.width * scale;
    return Math.max(0, (displayedWidth - frameWidth) / 2);
  }, [frameWidth, resolvedSize, scale]);

  const maxOffsetY = useMemo(() => {
    if (!resolvedSize) return 0;
    const displayedHeight = resolvedSize.height * scale;
    return Math.max(0, (displayedHeight - frameHeight) / 2);
  }, [frameHeight, resolvedSize, scale]);

  const panResponder = useMemo(() => (
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStart.current = { ...panValue.current };
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = clamp(panStart.current.x + gesture.dx, -maxOffsetX, maxOffsetX);
        const nextY = clamp(panStart.current.y + gesture.dy, -maxOffsetY, maxOffsetY);
        pan.setValue({ x: nextX, y: nextY });
      },
      onPanResponderRelease: () => {
        panStart.current = { ...panValue.current };
      },
    })
  ), [maxOffsetX, maxOffsetY, pan]);

  const handleConfirm = async () => {
    if (!imageUri || !resolvedSize) return;

    try {
      setProcessing(true);
      const displayedWidth = resolvedSize.width * scale;
      const displayedHeight = resolvedSize.height * scale;
      const imageLeft = (frameWidth - displayedWidth) / 2 + panValue.current.x;
      const imageTop = (frameHeight - displayedHeight) / 2 + panValue.current.y;

      const originX = clamp(Math.round((0 - imageLeft) / scale), 0, resolvedSize.width - 1);
      const originY = clamp(Math.round((0 - imageTop) / scale), 0, resolvedSize.height - 1);
      const cropWidth = clamp(Math.round(frameWidth / scale), 1, resolvedSize.width - originX);
      const cropHeight = clamp(Math.round(frameHeight / scale), 1, resolvedSize.height - originY);

      const result = await manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );

      onConfirm(result.uri);
    } catch (error) {
      console.error('Failed to crop image:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleImageLoad = (event: any) => {
    if (resolvedSize) return;
    const { width, height } = event?.nativeEvent?.source || {};
    if (typeof width === 'number' && typeof height === 'number') {
      setResolvedSize({ width, height });
    }
  };

  const frameStyle = [
    styles.cropFrame,
    { width: frameWidth, height: frameHeight },
    shape === 'circle'
      ? { borderRadius: Math.round(frameWidth / 2) }
      : { borderRadius: theme.borderRadius.sm },
  ];

  const handleCancel = () => {
    if (processing) return;
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, styles.modalContent]}>
          <Text style={globalStyles.modalTitle}>{title || 'Tilpass bildet'}</Text>
          <Text style={styles.helperText}>Dra bildet for å plassere det i rammen.</Text>
          <View style={styles.cropAreaWrap}>
            <View style={frameStyle}>
              {imageUri && (
                <Animated.Image
                  {...panResponder.panHandlers}
                  source={{ uri: imageUri }}
                  onLoad={handleImageLoad}
                  style={{
                    width: resolvedSize ? resolvedSize.width * scale : frameWidth,
                    height: resolvedSize ? resolvedSize.height * scale : frameHeight,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                  }}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleCancel} disabled={processing}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} disabled={processing || !resolvedSize}>
              <Text style={globalStyles.saveButtonText}>{processing ? 'Lagrer...' : 'Bruk'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    maxWidth: 420,
  },
  cropAreaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  cropFrame: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.backgroundDeep,
    overflow: 'hidden',
  },
  helperText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sm,
    marginBottom: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.lg,
  },
});

export default ImageCropModal;
