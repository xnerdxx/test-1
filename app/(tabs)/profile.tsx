import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLanguageStore } from '../../store/languageStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [yieldData, setYieldData] = useState<any>(null);
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'yield'>('recommendations');
  const { language, setLanguage } = useLanguageStore();

  const translations = {
    en: {
      title: 'Farm Insights',
      recommendations: 'Crop Recommendations',
      yieldPrediction: 'Yield Prediction',
      currentConditions: 'Current Conditions',
      suitability: 'Suitability Score',
      season: 'Season',
      yield: 'Expected Yield',
      price: 'Market Price',
      viewAll: 'View All Crops',
      predictYield: 'Predict Yield',
      confidence: 'Confidence',
      recommendationsTitle: 'Recommendations',
      language: 'Language',
      about: 'About KrishiMitra',
      aboutText: 'KrishiMitra is your AI-powered agricultural assistant, helping farmers make data-driven decisions for better yields and sustainable farming.',
    },
    te: {
      title: 'వ్యవసాయ అంతర్దృష్టులు',
      recommendations: 'పంట సిఫార్సులు',
      yieldPrediction: 'దిగుబడి అంచనా',
      currentConditions: 'ప్రస్తుత పరిస్థితులు',
      suitability: 'అనుకూలత స్కోర్',
      season: 'కాలం',
      yield: 'ఆశించిన దిగుబడి',
      price: 'మార్కెట్ ధర',
      viewAll: 'అన్ని పంటలు చూడండి',
      predictYield: 'దిగుబడి అంచనా',
      confidence: 'విశ్వాసం',
      recommendationsTitle: 'సిఫార్సులు',
      language: 'భాష',
      about: 'కృషి మిత్ర గురించి',
      aboutText: 'కృషి మిత్ర మీ AI-శక్తితో కూడిన వ్యవసాయ సహాయకం, రైతులకు మెరుగైన దిగుబడి మరియు స్థిరమైన వ్యవసాయం కోసం డేటా-ఆధారిత నిర్ణయాలు తీసుకోవడంలో సహాయం చేస్తుంది.',
    },
    hi: {
      title: 'कृषि अंतर्दृष्टि',
      recommendations: 'फसल सिफारिशें',
      yieldPrediction: 'उपज पूर्वानुमान',
      currentConditions: 'वर्तमान स्थितियां',
      suitability: 'उपयुक्तता स्कोर',
      season: 'मौसम',
      yield: 'अपेक्षित उपज',
      price: 'बाजार मूल्य',
      viewAll: 'सभी फसलें देखें',
      predictYield: 'उपज पूर्वानुमान',
      confidence: 'विश्वास',
      recommendationsTitle: 'सिफारिशें',
      language: 'भाषा',
      about: 'कृषि मित्र के बारे में',
      aboutText: 'कृषि मित्र आपका AI-संचालित कृषि सहायक है, जो किसानों को बेहतर उपज और टिकाऊ खेती के लिए डेटा-संचालित निर्णय लेने में मदद करता है।',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recsRes, yieldRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/crops/recommendations?ph=6.5&moisture=65`),
        axios.get(`${BACKEND_URL}/api/yield/predict?crop=${selectedCrop}&moisture=65&ph=6.5&temperature=30`),
      ]);

      setRecommendations(recsRes.data);
      setYieldData(yieldRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadYieldPrediction = async (crop: string) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/yield/predict?crop=${crop}&moisture=65&ph=6.5&temperature=30`
      );
      setYieldData(response.data);
      setSelectedCrop(crop);
    } catch (error) {
      console.error('Error loading yield prediction:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const cycleLanguage = () => {
    const languages: ('en' | 'te' | 'hi')[] = ['en', 'te', 'hi'];
    const currentIndex = languages.indexOf(language as any);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C44536" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Ionicons name="leaf" size={28} color="#2D7A3E" />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C44536" />
        }
      >
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recommendations' && styles.tabActive]}
            onPress={() => setActiveTab('recommendations')}
          >
            <Text style={[styles.tabText, activeTab === 'recommendations' && styles.tabTextActive]}>
              {t.recommendations}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'yield' && styles.tabActive]}
            onPress={() => setActiveTab('yield')}
          >
            <Text style={[styles.tabText, activeTab === 'yield' && styles.tabTextActive]}>
              {t.yieldPrediction}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crop Recommendations */}
        {activeTab === 'recommendations' && recommendations && (
          <View style={styles.section}>
            {/* Current Conditions */}
            <View style={styles.conditionsCard}>
              <Text style={styles.sectionTitle}>{t.currentConditions}</Text>
              <View style={styles.conditionsGrid}>
                <View style={styles.conditionItem}>
                  <Ionicons name="flask" size={24} color="#C44536" />
                  <Text style={styles.conditionLabel}>pH</Text>
                  <Text style={styles.conditionValue}>{recommendations.current_conditions.ph}</Text>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name="water" size={24} color="#0D9488" />
                  <Text style={styles.conditionLabel}>Moisture</Text>
                  <Text style={styles.conditionValue}>{recommendations.current_conditions.moisture}%</Text>
                </View>
              </View>
            </View>

            {/* Top Recommendations */}
            <Text style={styles.sectionTitle}>{t.recommendations}</Text>
            {recommendations.recommendations.map((crop: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.cropCard}
                onPress={() => {
                  setActiveTab('yield');
                  loadYieldPrediction(crop.crop_name);
                }}
              >
                <View style={styles.cropHeader}>
                  <View>
                    <Text style={styles.cropName}>{crop.crop_name}</Text>
                    <Text style={styles.cropNameLocal}>
                      {language === 'te' ? crop.crop_name_telugu : language === 'hi' ? crop.crop_name_hindi : ''}
                    </Text>
                  </View>
                  <View style={styles.suitabilityBadge}>
                    <Text style={styles.suitabilityScore}>{crop.suitability_score}%</Text>
                    <Text style={styles.suitabilityLabel}>{t.suitability}</Text>
                  </View>
                </View>

                <View style={styles.cropDetails}>
                  <View style={styles.cropDetail}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.cropDetailText}>{crop.season}</Text>
                  </View>
                  <View style={styles.cropDetail}>
                    <Ionicons name="trending-up" size={16} color="#666" />
                    <Text style={styles.cropDetailText}>{crop.expected_yield}</Text>
                  </View>
                  <View style={styles.cropDetail}>
                    <Ionicons name="cash" size={16} color="#666" />
                    <Text style={styles.cropDetailText}>{crop.market_price}</Text>
                  </View>
                </View>

                <View style={styles.cropFooter}>
                  <Text style={styles.moistureReq}>{crop.moisture_requirement}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Yield Prediction */}
        {activeTab === 'yield' && yieldData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.yieldPrediction}</Text>

            {/* Crop Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropSelector}>
              {['Rice', 'Cotton', 'Chili', 'Turmeric', 'Groundnut'].map((crop) => (
                <TouchableOpacity
                  key={crop}
                  style={[
                    styles.cropSelectorItem,
                    selectedCrop === crop && styles.cropSelectorItemActive,
                  ]}
                  onPress={() => loadYieldPrediction(crop)}
                >
                  <Text
                    style={[
                      styles.cropSelectorText,
                      selectedCrop === crop && styles.cropSelectorTextActive,
                    ]}
                  >
                    {crop}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Prediction Card */}
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionCrop}>{yieldData.crop}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{yieldData.confidence}% {t.confidence}</Text>
                </View>
              </View>

              <View style={styles.yieldDisplay}>
                <Text style={styles.yieldLabel}>{t.yield}</Text>
                <Text style={styles.yieldValue}>{yieldData.predicted_yield}</Text>
              </View>

              {/* Current Conditions */}
              <View style={styles.miniConditions}>
                <View style={styles.miniCondition}>
                  <Ionicons name="water" size={20} color="#0D9488" />
                  <Text style={styles.miniConditionText}>
                    {yieldData.current_conditions.moisture}% moisture
                  </Text>
                </View>
                <View style={styles.miniCondition}>
                  <Ionicons name="flask" size={20} color="#C44536" />
                  <Text style={styles.miniConditionText}>pH {yieldData.current_conditions.ph}</Text>
                </View>
                <View style={styles.miniCondition}>
                  <Ionicons name="thermometer" size={20} color="#F4A300" />
                  <Text style={styles.miniConditionText}>
                    {yieldData.current_conditions.temperature}°C
                  </Text>
                </View>
              </View>

              {/* Recommendations */}
              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>{t.recommendationsTitle}</Text>
                {yieldData.recommendations.map((rec: string, index: number) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#2D7A3E" />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.settingItem} onPress={cycleLanguage}>
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={24} color="#2D7A3E" />
              <Text style={styles.settingText}>{t.language}</Text>
            </View>
            <Text style={styles.settingValue}>{language.toUpperCase()}</Text>
          </TouchableOpacity>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>{t.about}</Text>
            <Text style={styles.aboutText}>{t.aboutText}</Text>
            <Text style={styles.aboutEmoji}>🌾</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  scrollView: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2D7A3E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  conditionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  conditionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  conditionItem: {
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  conditionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginTop: 4,
  },
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  cropNameLocal: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  suitabilityBadge: {
    backgroundColor: '#2D7A3E10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  suitabilityScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D7A3E',
  },
  suitabilityLabel: {
    fontSize: 10,
    color: '#2D7A3E',
  },
  cropDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cropDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cropDetailText: {
    fontSize: 12,
    color: '#666',
  },
  cropFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  moistureReq: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '600',
  },
  cropSelector: {
    marginBottom: 16,
  },
  cropSelectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cropSelectorItemActive: {
    backgroundColor: '#2D7A3E',
    borderColor: '#2D7A3E',
  },
  cropSelectorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  cropSelectorTextActive: {
    color: '#FFFFFF',
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionCrop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  confidenceBadge: {
    backgroundColor: '#F4A30020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F4A300',
  },
  yieldDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  yieldLabel: {
    fontSize: 14,
    color: '#666',
  },
  yieldValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D7A3E',
    marginTop: 8,
  },
  miniConditions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  miniCondition: {
    alignItems: 'center',
  },
  miniConditionText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  recommendationsSection: {
    marginTop: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  settingsSection: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#2C2C2C',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D7A3E',
  },
  aboutCard: {
    backgroundColor: '#2D7A3E10',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D7A3E',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  aboutEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginTop: 12,
  },
});