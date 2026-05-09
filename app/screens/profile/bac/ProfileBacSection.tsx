import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { profileChartConfig, profileChartDataset, profileScreenTokens, profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import { INPUT_LIMITS } from '../../../utils/inputValidation';
import type { ProfileUserInfo } from '../profileTypes';
import { useProfileBac } from './useProfileBac';

type ProfileBacSectionProps = {
  userId?: string;
  userInfo: ProfileUserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<ProfileUserInfo>>;
};

const DRINK_NUMBER_PLACEHOLDER = 'Skriv verdi';
const DRINK_TEXT_PLACEHOLDER = 'Skriv type/navn';
const hourOptions = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));

const ProfileBacSection = ({ userId, userInfo, setUserInfo }: ProfileBacSectionProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const [showHighscoreDetails, setShowHighscoreDetails] = React.useState(false);
  const {
    isExpanded,
    toggleExpanded,
    hasBacRequiredInfo,
    currentBAC,
    chartProjection,
    chartWidth,
    latestDrinkEntry,
    latestDrinkLabel,
    highscoreUpdatedLabel,
    canResetBacHighscore,
    resettingBacHighscore,
    estimatedAdditionalDrinksToBeatHighscore,
    estimatorDrinkOptions,
    selectedEstimatorDrinkKey,
    setSelectedEstimatorDrinkKey,
    drinkModalVisible,
    showDrinkValidationHint,
    drinkValidationMessage,
    canSaveDrink,
    drinkForm,
    setDrinkForm,
    endTimeAllowed,
    openDrinkModal,
    closeDrinkModal,
    handleAddDrink,
    handleResetDrinks,
    handleResetBacHighscore,
    handleAddLatestDrinkAgain,
    getSizeOptions,
    getSizeOptionLabel,
    getAlcoholPercentOptions,
    getCustomSizeOptions,
    getCustomSizeOptionLabel,
    getCustomAlcoholPercentOptions,
    getRecommendedQuantityOptions,
    getTimeParts,
    updateTimeValue,
    resetDrinkFormForCategory,
  } = useProfileBac({ userId, userInfo, setUserInfo, windowWidth });

  const showCompactStats = !isExpanded && chartProjection;

  return (
    <>
      <View style={[globalStyles.section, profileStyles.compactSection]}>
        <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
          <View style={[globalStyles.sectionHeaderRow, !isExpanded && globalStyles.collapsedHeaderRow]}>
            <Text style={globalStyles.sectionTitleLeft}>Promillekalkulator</Text>
            <TouchableOpacity
              style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}
              onPress={toggleExpanded}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? 'Minimer promillekalkulator' : 'Utvid promillekalkulator'}
            >
              <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
                {isExpanded ? '▾' : '▸'}
              </Text>
            </TouchableOpacity>
          </View>

          {showCompactStats && (
            <View style={profileStyles.compactStatsBlock}>
              <View style={profileStyles.chartSummaryRow}>
                <View style={[profileStyles.statPill, profileStyles.compactStatPill]}>
                  <Text style={[profileStyles.statLabel, profileStyles.compactStatLabel]}>Promille nå</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={[profileStyles.statValue, profileStyles.compactStatValue]}>{currentBAC}‰</Text>
                  </View>
                </View>
                <View style={[profileStyles.statPill, profileStyles.compactStatPill]}>
                  <Text style={[profileStyles.statLabel, profileStyles.compactStatLabel]}>
                    Høyeste {chartProjection.peakTime}
                  </Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={[profileStyles.statValue, profileStyles.compactStatValue]}>
                      {chartProjection.peak.toFixed(3)}‰
                    </Text>
                  </View>
                </View>
                <View style={[profileStyles.statPill, profileStyles.compactStatPill]}>
                  <Text style={[profileStyles.statLabel, profileStyles.compactStatLabel]}>0.2‰ Cirka kl</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={[profileStyles.statValue, profileStyles.compactStatValue]}>
                      {chartProjection.soberTime}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[profileStyles.chartInteractiveShell, { width: chartWidth }]}>
                <LineChart
                  data={{
                    labels: chartProjection.labels,
                    datasets: [{ data: chartProjection.values, ...profileChartDataset }],
                  }}
                  width={chartWidth}
                  height={100}
                  yAxisLabel=""
                  yAxisSuffix="‰"
                  fromZero
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLabels={false}
                  withHorizontalLabels={false}
                  withDots={false}
                  chartConfig={profileChartConfig}
                  bezier
                  style={profileStyles.sparkline}
                />
              </View>
            </View>
          )}

          {isExpanded && (
            <View style={globalStyles.inputGroup}>
              <TouchableOpacity
                style={[globalStyles.primaryButtonShadow, profileStyles.bacPrimaryButton, !hasBacRequiredInfo && globalStyles.disabledButton]}
                onPress={openDrinkModal}
                disabled={!hasBacRequiredInfo}
              >
                <Text style={[globalStyles.primaryButtonText, profileStyles.bacPrimaryButtonText]}>Legg til drikke</Text>
              </TouchableOpacity>
              <View style={profileStyles.bacSecondaryRow}>
                <TouchableOpacity
                  style={[
                    globalStyles.outlineButtonGold,
                    profileStyles.bacRepeatPill,
                    (!hasBacRequiredInfo || !latestDrinkEntry) && globalStyles.disabledButton,
                  ]}
                  onPress={handleAddLatestDrinkAgain}
                  disabled={!hasBacRequiredInfo || !latestDrinkEntry}
                >
                  <Text style={[globalStyles.outlineButtonGoldText, profileStyles.bacRepeatPillText]}>
                    {`Gjenta sist (${latestDrinkLabel})`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={profileStyles.bacResetTextButton}
                  onPress={handleResetDrinks}
                  disabled={!hasBacRequiredInfo}
                >
                  <Text
                    style={[
                      profileStyles.bacResetText,
                      !hasBacRequiredInfo && profileStyles.bacResetTextDisabled,
                    ]}
                  >
                    Nullstill historikk
                  </Text>
                </TouchableOpacity>
              </View>
              {!hasBacRequiredInfo && (
                <Text style={globalStyles.secondaryText}>
                  Sett vekt og kjønn i innstillinger for å bruke promillekalkulatoren.
                </Text>
              )}
            </View>
          )}
          {isExpanded && chartProjection && (
            <View style={[globalStyles.inputGroup, profileStyles.chartCard]}>
              <Text style={globalStyles.sectionTitle}>Anslått promille de neste 3 timene</Text>
              <View style={profileStyles.chartSummaryRow}>
                <View style={profileStyles.statPill}>
                  <Text style={profileStyles.statLabel}>Promille nå</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={profileStyles.statValue}>{currentBAC}‰</Text>
                  </View>
                </View>
                <View style={profileStyles.statPill}>
                  <Text style={profileStyles.statLabel}>Høyeste {chartProjection.peakTime}</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={profileStyles.statValue}>{chartProjection.peak.toFixed(3)}‰</Text>
                  </View>
                </View>
                <View style={profileStyles.statPill}>
                  <Text style={profileStyles.statLabel}>0.2‰ Cirka kl</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={profileStyles.statValue}>{chartProjection.soberTime}</Text>
                  </View>
                </View>
              </View>
              <View style={[profileStyles.chartInteractiveShell, { width: chartWidth }]}
              >
                <LineChart
                  data={{
                    labels: chartProjection.labels,
                    datasets: [
                      { data: chartProjection.values, ...profileChartDataset },
                    ],
                  }}
                  width={chartWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="‰"
                  fromZero
                  chartConfig={profileChartConfig}
                  bezier
                  style={profileStyles.chart}
                />
              </View>
            </View>
          )}
          {isExpanded && hasBacRequiredInfo && (
            <View style={[globalStyles.inputGroup, profileStyles.highscoreCard]}>
              <View style={[globalStyles.rowSpread, profileStyles.highscoreHeaderRow]}>
                <Text style={[globalStyles.sectionTitle, { marginBottom: 0 }]}>Promille-highscore</Text>
                <TouchableOpacity
                  style={profileStyles.highscoreToggleButton}
                  onPress={() => setShowHighscoreDetails((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={showHighscoreDetails ? 'Skjul highscore-detaljer' : 'Vis highscore-detaljer'}
                >
                  <Text style={profileStyles.highscoreToggleText}>
                    {showHighscoreDetails ? 'Skjul' : 'Vis detaljer'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={profileStyles.chartSummaryRow}>
                <View style={profileStyles.statPill}>
                  <Text style={profileStyles.statLabel}>Promille</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={profileStyles.statValue}>
                      {userInfo.bacHighscoreAllTime ? `${userInfo.bacHighscoreAllTime.toFixed(3)}‰` : '0.000‰'}
                    </Text>
                  </View>
                </View>
                <View style={profileStyles.statPill}>
                  <Text style={profileStyles.statLabel}>Tidspunkt</Text>
                  <View style={profileStyles.statMainSlot}>
                    <Text style={profileStyles.statValue}>{highscoreUpdatedLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={profileStyles.highscoreFooterRow}>
                <TouchableOpacity
                  style={profileStyles.highscoreResetButton}
                  onPress={handleResetBacHighscore}
                  disabled={!canResetBacHighscore}
                >
                  <Text
                    style={[
                      profileStyles.highscoreResetText,
                      !canResetBacHighscore && profileStyles.highscoreResetTextDisabled,
                    ]}
                  >
                    {resettingBacHighscore ? 'Nullstiller...' : 'Nullstill highscore'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showHighscoreDetails && (
                <>
                  {userInfo.bacHighscoreAllTime && userInfo.bacHighscoreAllTime > 0 && estimatorDrinkOptions.length > 0 ? (
                    <>
                      <View style={[globalStyles.inputGroup, { marginBottom: 0 }]}> 
                        <Text style={globalStyles.addOptionText}>Se hvor mye du må drikke for å slå din highscore</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                          {estimatorDrinkOptions.map((option) => {
                            const isSelected = selectedEstimatorDrinkKey === option.key;
                            return (
                              <TouchableOpacity
                                key={option.key}
                                style={[globalStyles.selectionButton, isSelected && globalStyles.selectionButtonSelected]}
                                onPress={() => setSelectedEstimatorDrinkKey(option.key)}
                              >
                                <Text style={[globalStyles.selectionButtonText, isSelected && globalStyles.selectionButtonTextSelected]}>
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                      <Text style={globalStyles.secondaryText}>
                        {estimatedAdditionalDrinksToBeatHighscore === 0
                          ? 'Du har allerede slått din highscore med dagens drikking'
                          : typeof estimatedAdditionalDrinksToBeatHighscore === 'number'
                            ? `Du trenger omtrent ${estimatedAdditionalDrinksToBeatHighscore} enheter av valgt drikke for å slå highscores.`
                            : 'Vi klarte ikke å beregne et nøyaktig antall innenfor beregningsvinduet.'}
                      </Text>
                    </>
                  ) : (
                    <Text style={globalStyles.secondaryText}>
                      Legg til drikkehistorikk for å få forslag til hvor mye du trenger for å slå highscores.
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={drinkModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDrinkModal}
      >
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, profileStyles.drinkModalContent]}> 
            <Text style={[globalStyles.modalTitle, globalStyles.friendSpacing]}>Velg drikke</Text>
            <Text style={[globalStyles.mutedText, { marginBottom: theme.spacing.sm }]}>Dette påvirker ikke drikkestatistikk i grupper</Text>

            <View style={profileStyles.drinkFormScrollBox}>
              <ScrollView
                style={globalStyles.onboardingTextScroll}
                contentContainerStyle={globalStyles.leaderboardListWrap}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                  <Text style={globalStyles.label}>Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                    {[
                      { label: 'Øl / Cider / Selzer', value: 'øl' as const },
                      { label: 'Vin', value: 'vin' as const },
                      { label: 'Sprit', value: 'sprit' as const },
                      { label: 'Egendefinert', value: 'custom' as const },
                    ].map((categoryOption) => (
                      <TouchableOpacity
                        key={categoryOption.value}
                        style={[globalStyles.selectionButton, drinkForm.category === categoryOption.value && globalStyles.selectionButtonSelected]}
                        onPress={() => resetDrinkFormForCategory(categoryOption.value)}
                      >
                        <Text style={[globalStyles.selectionButtonText, drinkForm.category === categoryOption.value && globalStyles.selectionButtonTextSelected]}>
                          {categoryOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {drinkForm.category && (
                  <>
                    {drinkForm.category !== 'custom' && (
                      <>
                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Størrelse</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                            {getSizeOptions(drinkForm.category).map((size) => (
                              <TouchableOpacity
                                key={String(size)}
                                style={[globalStyles.selectionButton, drinkForm.sizeDl === size && globalStyles.selectionButtonSelected]}
                                onPress={() => setDrinkForm({ ...drinkForm, sizeDl: size, customSizeValue: '' })}
                              >
                                <Text style={[globalStyles.selectionButtonText, drinkForm.sizeDl === size && globalStyles.selectionButtonTextSelected]}>
                                  {getSizeOptionLabel(drinkForm.category, size)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {drinkForm.sizeDl === 'custom' && (
                          <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                            <Text style={globalStyles.label}>Egendefinert størrelse</Text>
                            <View style={globalStyles.requestActionRow}>
                              <View style={[globalStyles.inputShellDark, globalStyles.itemInfo, profileStyles.pickerGlowShell]}>
                                <TextInput
                                  style={[globalStyles.input, profileStyles.compactNumberInput]}
                                  value={drinkForm.customSizeValue}
                                  onChangeText={(text) => setDrinkForm({ ...drinkForm, customSizeValue: text })}
                                  placeholder={DRINK_NUMBER_PLACEHOLDER}
                                  placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                  keyboardType="decimal-pad"
                                />
                              </View>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRowCompact}>
                                {(['cl', 'dl', 'l'] as const).map((unit) => (
                                  <TouchableOpacity
                                    key={unit}
                                    style={[globalStyles.selectionButton, drinkForm.sizeUnit === unit && globalStyles.selectionButtonSelected]}
                                    onPress={() => setDrinkForm({ ...drinkForm, sizeUnit: unit })}
                                  >
                                    <Text style={[globalStyles.selectionButtonText, drinkForm.sizeUnit === unit && globalStyles.selectionButtonTextSelected]}>
                                      {unit}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          </View>
                        )}

                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Alkoholprosent</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                            {getAlcoholPercentOptions(drinkForm.category).map((percent) => {
                              const alcoholOption = percent as number | 'custom';
                              return (
                                <TouchableOpacity
                                  key={String(alcoholOption)}
                                  style={[globalStyles.selectionButton, drinkForm.alcoholPercent === alcoholOption && globalStyles.selectionButtonSelected]}
                                  onPress={() => setDrinkForm({ ...drinkForm, alcoholPercent: alcoholOption, customAlcoholPercent: '' })}
                                >
                                  <Text style={[globalStyles.selectionButtonText, drinkForm.alcoholPercent === alcoholOption && globalStyles.selectionButtonTextSelected]}>
                                    {alcoholOption === 'custom' ? 'Egendefinert' : `${alcoholOption}%`}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>

                        {drinkForm.alcoholPercent === 'custom' && (
                          <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                            <Text style={globalStyles.label}>Egendefinert alkoholprosent</Text>
                            <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                              <TextInput
                                style={[globalStyles.input, profileStyles.compactNumberInput]}
                                value={drinkForm.customAlcoholPercent}
                                onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercent: text })}
                                placeholder={DRINK_NUMBER_PLACEHOLDER}
                                placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                keyboardType="decimal-pad"
                              />
                            </View>
                          </View>
                        )}

                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Antall</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                            {[...getRecommendedQuantityOptions(), 'custom' as const].map((quantity) => (
                              <TouchableOpacity
                                key={String(quantity)}
                                style={[globalStyles.selectionButton, drinkForm.quantity === quantity && globalStyles.selectionButtonSelected]}
                                onPress={() => setDrinkForm({ ...drinkForm, quantity, customQuantity: '' })}
                              >
                                <Text style={[globalStyles.selectionButtonText, drinkForm.quantity === quantity && globalStyles.selectionButtonTextSelected]}>
                                  {quantity === 'custom' ? 'Egendefinert' : quantity}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {drinkForm.quantity === 'custom' && (
                          <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                            <Text style={globalStyles.label}>Egendefinert antall</Text>
                            <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                              <TextInput
                                style={[globalStyles.input, profileStyles.compactNumberInput]}
                                value={drinkForm.customQuantity}
                                onChangeText={(text) => setDrinkForm({ ...drinkForm, customQuantity: text })}
                                placeholder={DRINK_NUMBER_PLACEHOLDER}
                                placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                keyboardType="decimal-pad"
                              />
                            </View>
                          </View>
                        )}
                      </>
                    )}

                    {drinkForm.category === 'custom' && (
                      <>
                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Type/navn</Text>
                          <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                            <TextInput
                              style={[globalStyles.input, profileStyles.customAlcoholInput]}
                              value={drinkForm.customDrinkName}
                              onChangeText={(text) => setDrinkForm({ ...drinkForm, customDrinkName: text.slice(0, INPUT_LIMITS.drinkNameMax) })}
                              placeholder={DRINK_TEXT_PLACEHOLDER}
                              placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                              maxLength={INPUT_LIMITS.drinkNameMax}
                            />
                          </View>
                        </View>

                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Størrelse</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                            {getCustomSizeOptions().map((size) => (
                              <TouchableOpacity
                                key={String(size)}
                                style={[globalStyles.selectionButton, drinkForm.sizeDl === size && globalStyles.selectionButtonSelected]}
                                onPress={() => setDrinkForm({ ...drinkForm, sizeDl: size, customSizeValue: '' })}
                              >
                                <Text style={[globalStyles.selectionButtonText, drinkForm.sizeDl === size && globalStyles.selectionButtonTextSelected]}>
                                  {getCustomSizeOptionLabel(size)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {drinkForm.sizeDl === 'custom' && (
                          <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                            <Text style={globalStyles.label}>Egendefinert størrelse</Text>
                            <View style={globalStyles.requestActionRow}>
                              <View style={[globalStyles.inputShellDark, globalStyles.itemInfo, profileStyles.pickerGlowShell]}>
                                <TextInput
                                  style={[globalStyles.input, profileStyles.compactNumberInput]}
                                  value={drinkForm.customSizeValue}
                                  onChangeText={(text) => setDrinkForm({ ...drinkForm, customSizeValue: text })}
                                  placeholder={DRINK_NUMBER_PLACEHOLDER}
                                  placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                  keyboardType="decimal-pad"
                                />
                              </View>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRowCompact}>
                                {(['cl', 'dl', 'l'] as const).map((unit) => (
                                  <TouchableOpacity
                                    key={unit}
                                    style={[globalStyles.selectionButton, drinkForm.customSizeUnit === unit && globalStyles.selectionButtonSelected]}
                                    onPress={() => setDrinkForm({ ...drinkForm, customSizeUnit: unit })}
                                  >
                                    <Text style={[globalStyles.selectionButtonText, drinkForm.customSizeUnit === unit && globalStyles.selectionButtonTextSelected]}>
                                      {unit}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          </View>
                        )}

                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Alkoholprosent</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                            {getCustomAlcoholPercentOptions().map((percent) => (
                              <TouchableOpacity
                                key={String(percent)}
                                style={[globalStyles.selectionButton, drinkForm.alcoholPercent === percent && globalStyles.selectionButtonSelected]}
                                onPress={() => setDrinkForm({ ...drinkForm, alcoholPercent: percent, customAlcoholPercentManual: '' })}
                              >
                                <Text style={[globalStyles.selectionButtonText, drinkForm.alcoholPercent === percent && globalStyles.selectionButtonTextSelected]}>
                                  {percent === 'custom' ? 'Egendefinert' : `${percent}%`}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {drinkForm.alcoholPercent === 'custom' && (
                          <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                            <Text style={globalStyles.label}>Egendefinert alkoholprosent</Text>
                            <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                              <TextInput
                                style={[globalStyles.input, profileStyles.compactNumberInput]}
                                value={drinkForm.customAlcoholPercentManual}
                                onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercentManual: text })}
                                placeholder={DRINK_NUMBER_PLACEHOLDER}
                                placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                keyboardType="decimal-pad"
                              />
                            </View>
                          </View>
                        )}

                        <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}> 
                          <Text style={globalStyles.label}>Antall</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                            {[...getRecommendedQuantityOptions(), 'custom' as const].map((quantity) => (
                              <TouchableOpacity
                                key={String(quantity)}
                                style={[globalStyles.selectionButton, drinkForm.quantity === quantity && globalStyles.selectionButtonSelected]}
                                onPress={() => setDrinkForm({ ...drinkForm, quantity, customQuantity: '' })}
                              >
                                <Text style={[globalStyles.selectionButtonText, drinkForm.quantity === quantity && globalStyles.selectionButtonTextSelected]}>
                                  {quantity === 'custom' ? 'Egendefinert' : quantity}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {drinkForm.quantity === 'custom' && (
                          <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                            <Text style={globalStyles.label}>Egendefinert antall</Text>
                            <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                              <TextInput
                                style={[globalStyles.input, profileStyles.compactNumberInput]}
                                value={drinkForm.customQuantity}
                                onChangeText={(text) => setDrinkForm({ ...drinkForm, customQuantity: text })}
                                placeholder={DRINK_NUMBER_PLACEHOLDER}
                                placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                keyboardType="decimal-pad"
                              />
                            </View>
                          </View>
                        )}
                      </>
                    )}

                    <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                      <Text style={globalStyles.label}>Tidspunkt drukket (start)</Text>
                      <View style={profileStyles.timePickerRow}>
                        <View style={[globalStyles.pickerInput, profileStyles.timePickerShell, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={globalStyles.pickerItem}
                            selectedValue={getTimeParts(drinkForm.consumedAtTime).hour}
                            onValueChange={(value: string) =>
                              setDrinkForm({
                                ...drinkForm,
                                consumedAtTime: updateTimeValue(drinkForm.consumedAtTime, 'hour', value),
                              })
                            }
                          >
                            {hourOptions.map((hour) => (
                              <Picker.Item key={hour} label={hour} value={hour} />
                            ))}
                          </Picker>
                        </View>
                        <Text style={profileStyles.timeSeparator}>:</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.timePickerShell, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={globalStyles.pickerItem}
                            selectedValue={getTimeParts(drinkForm.consumedAtTime).minute}
                            onValueChange={(value: string) =>
                              setDrinkForm({
                                ...drinkForm,
                                consumedAtTime: updateTimeValue(drinkForm.consumedAtTime, 'minute', value),
                              })
                            }
                          >
                            {minuteOptions.map((minute) => (
                              <Picker.Item key={minute} label={minute} value={minute} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </View>

                    {endTimeAllowed && (
                      <View style={[globalStyles.inputGroup, globalStyles.distributionChoiceBlock]}>
                        <Text style={globalStyles.label}>Sluttidspunkt</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={profileStyles.buttonPickerRow}>
                          <TouchableOpacity
                            style={[globalStyles.selectionButton, !drinkForm.hasEndTime && globalStyles.selectionButtonSelected]}
                            onPress={() => setDrinkForm({ ...drinkForm, hasEndTime: false, consumedUntilTime: '' })}
                          >
                            <Text style={[globalStyles.selectionButtonText, !drinkForm.hasEndTime && globalStyles.selectionButtonTextSelected]}>
                              Ingen sluttid
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[globalStyles.selectionButton, drinkForm.hasEndTime && globalStyles.selectionButtonSelected]}
                            onPress={() =>
                              setDrinkForm({
                                ...drinkForm,
                                hasEndTime: true,
                                consumedUntilTime: drinkForm.consumedUntilTime || drinkForm.consumedAtTime,
                              })
                            }
                          >
                            <Text style={[globalStyles.selectionButtonText, drinkForm.hasEndTime && globalStyles.selectionButtonTextSelected]}>
                              Velg sluttid
                            </Text>
                          </TouchableOpacity>
                        </ScrollView>

                        {drinkForm.hasEndTime && (
                          <View style={profileStyles.timePickerRow}>
                            <View style={[globalStyles.pickerInput, profileStyles.timePickerShell, profileStyles.pickerGlowShell]}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={globalStyles.pickerItem}
                                selectedValue={getTimeParts(drinkForm.consumedUntilTime || drinkForm.consumedAtTime).hour}
                                onValueChange={(value: string) =>
                                  setDrinkForm({
                                    ...drinkForm,
                                    consumedUntilTime: updateTimeValue(
                                      drinkForm.consumedUntilTime || drinkForm.consumedAtTime,
                                      'hour',
                                      value
                                    ),
                                  })
                                }
                              >
                                {hourOptions.map((hour) => (
                                  <Picker.Item key={`end-hour-${hour}`} label={hour} value={hour} />
                                ))}
                              </Picker>
                            </View>
                            <Text style={profileStyles.timeSeparator}>:</Text>
                            <View style={[globalStyles.pickerInput, profileStyles.timePickerShell, profileStyles.pickerGlowShell]}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={globalStyles.pickerItem}
                                selectedValue={getTimeParts(drinkForm.consumedUntilTime || drinkForm.consumedAtTime).minute}
                                onValueChange={(value: string) =>
                                  setDrinkForm({
                                    ...drinkForm,
                                    consumedUntilTime: updateTimeValue(
                                      drinkForm.consumedUntilTime || drinkForm.consumedAtTime,
                                      'minute',
                                      value
                                    ),
                                  })
                                }
                              >
                                {minuteOptions.map((minute) => (
                                  <Picker.Item key={`end-minute-${minute}`} label={minute} value={minute} />
                                ))}
                              </Picker>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
            <View style={globalStyles.modalFooter}>
              {drinkForm.category && showDrinkValidationHint && drinkValidationMessage ? (
                <Text style={globalStyles.validationHelperText}>{drinkValidationMessage}</Text>
              ) : null}
              <View style={globalStyles.editButtonsContainer}>
                <TouchableOpacity onPress={closeDrinkModal}>
                  <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddDrink} disabled={!canSaveDrink}>
                  <Text style={[globalStyles.saveButtonText, !canSaveDrink && globalStyles.disabledGoldActionText]}>Legg til</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ProfileBacSection;
