import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLanguageStore } from '../../store/languageStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [sensors, setSensors] = useState<any[]>([]);
  const { language } = useLanguageStore();

  const translations = {
    en: {
      welcome: 'Welcome to KrishiMitra',
      dashboard: 'Dashboard',
      activeSensors: 'Active Sensors',
      farmers: 'Farmers Empowered',
      yieldIncrease: 'Avg. Yield Increase',
      savings: 'Avg. Annual Savings',
      weather: 'Weather Today',
      sensorStatus: 'Sensor Status',
      alerts: 'Alerts',
      viewAll: 'View All',
    },
    te: {
      welcome: 'కృషి మిత్రకు స్వాగతం',
      dashboard: 'డాష్‌బోర్డ్',
      activeSensors: 'సక్రియ సెన్సార్లు',
      farmers: 'రైతులకు సహాయం',
      yieldIncrease: 'సగటు దిగుబడి పెరుగుదల',
      savings: 'సగటు వార్షిక ఆదా',
      weather: 'నేటి వాతావరణం',
      sensorStatus: 'సెన్సార్ స్థితి',
      alerts: 'హెచ్చరికలు',
      viewAll: 'అన్నీ చూడండి',
    },
    hi: {
      welcome: 'कृषि मित्र में आपका स्वागत है',
      dashboard: 'डैशबोर्ड',
      activeSensors: 'सक्रिय सेंसर',
      farmers: 'सशक्त किसान',
      yieldIncrease: 'औसत उपज वृद्धि',
      savings: 'औसत वार्षिक बचत',
      weather: 'आज का मौसम',
      sensorStatus: 'सेंसर स्थिति',
      alerts: 'अलर्ट',
      viewAll: 'सभी देखें',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, weatherRes, sensorsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/dashboard/stats`),
        axios.get(`${BACKEND_URL}/api/weather`),
        axios.get(`${BACKEND_URL}/api/sensors/live`),
      ]);

      setStats(statsRes.data);
      setWeather(weatherRes.data);
      setSensors(sensorsRes.data.sensors);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C44536" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t.welcome}</Text>
            <Text style={styles.subtitle}>{t.dashboard}</Text>
          </View>
          <TouchableOpacity style={styles.languageButton}>
            <Ionicons name="language" size={24} color="#2D7A3E" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#2D7A3E' }]}>
            <Ionicons name="radio" size={32} color="#FFF" />
            <Text style={styles.statValue}>{stats?.active_sensors || 0}</Text>
            <Text style={styles.statLabel}>{t.activeSensors}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F4A300' }]}>
            <Ionicons name="people" size={32} color="#FFF" />
            <Text style={styles.statValue}>{stats?.total_farmers || 0}</Text>
            <Text style={styles.statLabel}>{t.farmers}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#C44536' }]}>
            <Ionicons name="trending-up" size={32} color="#FFF" />
            <Text style={styles.statValue}>{stats?.average_yield_increase || '0%'}</Text>
            <Text style={styles.statLabel}>{t.yieldIncrease}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#0D9488' }]}>
            <Ionicons name="wallet" size={32} color="#FFF" />
            <Text style={styles.statValue}>{stats?.cost_savings || '₹0'}</Text>
            <Text style={styles.statLabel}>{t.savings}</Text>
          </View>
        </View>

        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.weather}</Text>
              <Ionicons name="partly-sunny" size={24} color="#F4A300" />
            </View>
            <View style={styles.weatherContent}>
              <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
              <Text style={styles.weatherDesc}>{weather.description}</Text>
              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetail}>
                  <Ionicons name="water" size={20} color="#0D9488" />
                  <Text style={styles.weatherDetailText}>{weather.humidity}%</Text>
                </View>
                <View style={styles.weatherDetail}>
                  <Ionicons name="rainy" size={20} color="#0D9488" />
                  <Text style={styles.weatherDetailText}>{weather.rainfall}mm</Text>
                </View>
                <View style={styles.weatherDetail}>
                  <Ionicons name="speedometer" size={20} color="#0D9488" />
                  <Text style={styles.weatherDetailText}>{weather.wind_speed} km/h</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Sensor Status */}
        <View style={styles.sensorSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.sensorStatus}</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>{t.viewAll}</Text>
            </TouchableOpacity>
          </View>
          {sensors.slice(0, 2).map((sensor, index) => (
            <View key={sensor.id} style={styles.sensorCard}>
              <View style={styles.sensorHeader}>
                <Text style={styles.sensorName}>{sensor.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#2D7A3E20' }]}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{sensor.status}</Text>
                </View>
              </View>
              <View style={styles.sensorMetrics}>
                <View style={styles.metric}>
                  <Ionicons name="water" size={20} color="#0D9488" />
                  <Text style={styles.metricValue}>{sensor.moisture}%</Text>
                  <Text style={styles.metricLabel}>Moisture</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="flask" size={20} color="#C44536" />
                  <Text style={styles.metricValue}>{sensor.ph}</Text>
                  <Text style={styles.metricLabel}>pH</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="thermometer" size={20} color="#F4A300" />
                  <Text style={styles.metricValue}>{sensor.temperature}°C</Text>
                  <Text style={styles.metricLabel}>Temp</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Alerts */}
        {stats?.alerts && stats.alerts.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.sectionTitle}>{t.alerts}</Text>
            {stats.alerts.map((alert: any, index: number) => (
              <View key={index} style={styles.alertCard}>
                <Ionicons
                  name={alert.severity === 'info' ? 'information-circle' : 'warning'}
                  size={24}
                  color={alert.severity === 'info' ? '#0D9488' : '#F4A300'}
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  languageButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  weatherCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  weatherContent: {
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#C44536',
  },
  weatherDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  weatherDetail: {
    alignItems: 'center',
  },
  weatherDetailText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginTop: 4,
  },
  sensorSection: {
    margin: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#C44536',
    fontWeight: '600',
  },
  sensorCard: {
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
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D7A3E',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#2D7A3E',
    fontWeight: '600',
  },
  sensorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertSection: {
    margin: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 12,
  },
});