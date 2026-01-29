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
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { useLanguageStore } from '../../store/languageStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SensorsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { language } = useLanguageStore();

  const translations = {
    en: {
      title: 'Sensor Monitoring',
      allSensors: 'All Sensors',
      moisture: 'Moisture',
      ph: 'pH Level',
      temperature: 'Temperature',
      battery: 'Battery',
      lastUpdate: 'Last Update',
      viewHistory: 'View 7-Day History',
      history: 'Historical Data',
    },
    te: {
      title: 'సెన్సార్ పర్యవేక్షణ',
      allSensors: 'అన్ని సెన్సార్లు',
      moisture: 'నమి',
      ph: 'pH స్థాయి',
      temperature: 'ఉష్ణోగ్రత',
      battery: 'బ్యాటరీ',
      lastUpdate: 'చివరి అప్‌డేట్',
      viewHistory: '7-రోజుల చరిత్ర చూడండి',
      history: 'చారిత్రిక డేటా',
    },
    hi: {
      title: 'सेंसर निगरानी',
      allSensors: 'सभी सेंसर',
      moisture: 'नमी',
      ph: 'pH स्तर',
      temperature: 'तापमान',
      battery: 'बैटरी',
      lastUpdate: 'आखिरी अपडेट',
      viewHistory: '7-दिन का इतिहास देखें',
      history: 'एतिहासिक डेटा',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sensors/live`);
      setSensors(response.data.sensors);
    } catch (error) {
      console.error('Error loading sensors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHistory = async (sensorId: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sensors/${sensorId}/history`);
      setHistory(response.data.history);
      setSelectedSensor(sensorId);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSensors();
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
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Ionicons name="radio" size={28} color="#2D7A3E" />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C44536" />
        }
      >
        <Text style={styles.sectionTitle}>{t.allSensors}</Text>

        {sensors.map((sensor) => (
          <View key={sensor.id} style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <View>
                <Text style={styles.sensorName}>{sensor.name}</Text>
                <Text style={styles.sensorId}>{sensor.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#2D7A3E20' }]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{sensor.status}</Text>
              </View>
            </View>

            {/* Sensor Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Ionicons name="water" size={32} color="#0D9488" />
                <Text style={styles.metricValue}>{sensor.moisture}%</Text>
                <Text style={styles.metricLabel}>{t.moisture}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${sensor.moisture}%`, backgroundColor: '#0D9488' }]} />
                </View>
              </View>

              <View style={styles.metricBox}>
                <Ionicons name="flask" size={32} color="#C44536" />
                <Text style={styles.metricValue}>{sensor.ph}</Text>
                <Text style={styles.metricLabel}>{t.ph}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(sensor.ph / 14) * 100}%`, backgroundColor: '#C44536' },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricBox}>
                <Ionicons name="thermometer" size={32} color="#F4A300" />
                <Text style={styles.metricValue}>{sensor.temperature}°C</Text>
                <Text style={styles.metricLabel}>{t.temperature}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(sensor.temperature / 50) * 100}%`, backgroundColor: '#F4A300' },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricBox}>
                <Ionicons name="battery-half" size={32} color="#2D7A3E" />
                <Text style={styles.metricValue}>{sensor.battery}%</Text>
                <Text style={styles.metricLabel}>{t.battery}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${sensor.battery}%`, backgroundColor: '#2D7A3E' }]} />
                </View>
              </View>
            </View>

            <View style={styles.sensorFooter}>
              <Text style={styles.lastUpdate}>
                {t.lastUpdate}: {new Date(sensor.last_update).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => loadHistory(sensor.id)}
              >
                <Text style={styles.historyButtonText}>{t.viewHistory}</Text>
                <Ionicons name="arrow-forward" size={16} color="#C44536" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* History Chart */}
        {selectedSensor && history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>{t.history}</Text>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t.moisture}</Text>
              <ScrollView horizontal>
                <LineChart
                  data={{
                    labels: history.slice(-24).filter((_, i) => i % 4 === 0).map((h, i) => `${i * 4}h`),
                    datasets: [
                      {
                        data: history.slice(-24).map((h) => h.moisture),
                      },
                    ],
                  }}
                  width={350}
                  height={200}
                  yAxisSuffix="%"
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '3',
                      strokeWidth: '2',
                      stroke: '#0D9488',
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t.ph}</Text>
              <ScrollView horizontal>
                <LineChart
                  data={{
                    labels: history.slice(-24).filter((_, i) => i % 4 === 0).map((h, i) => `${i * 4}h`),
                    datasets: [
                      {
                        data: history.slice(-24).map((h) => h.ph),
                      },
                    ],
                  }}
                  width={350}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(196, 69, 54, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '3',
                      strokeWidth: '2',
                      stroke: '#C44536',
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  sensorId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D7A3E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#2D7A3E',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricBox: {
    width: '48%',
    margin: '1%',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sensorFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C4453610',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#C44536',
    fontWeight: '600',
    marginRight: 4,
  },
  historySection: {
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
});