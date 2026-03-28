import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function AppSelectorScreen({ navigation }) {
  const { state, toggleMonitoredApp, updateSettings } = useApp();
  const { settings } = state;
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = {};
    settings.availableApps.forEach(app => {
      if (!cats[app.category]) cats[app.category] = [];
      cats[app.category].push(app);
    });
    return cats;
  }, [settings.availableApps]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    const filtered = {};
    Object.entries(categories).forEach(([cat, apps]) => {
      const matching = apps.filter(app =>
        app.name.toLowerCase().includes(query)
      );
      if (matching.length > 0) filtered[cat] = matching;
    });
    return filtered;
  }, [categories, searchQuery]);

  const isSelected = (appId) => settings.monitoredApps.includes(appId);

  const selectAll = () => {
    const allIds = settings.availableApps.map(a => a.id);
    updateSettings({ monitoredApps: allIds });
  };

  const deselectAll = () => {
    updateSettings({ monitoredApps: [] });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choose Apps</Text>
          <Text style={styles.headerSub}>
            {settings.monitoredApps.length} selected
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor="#555566"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#555566" />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={selectAll}>
          <Text style={styles.quickBtnText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={deselectAll}>
          <Text style={styles.quickBtnText}>Deselect All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#6C63FF" />
          <Text style={styles.infoBannerText}>
            Selected apps will be locked when your screen time limit is reached. Complete the required reset to unlock them.
          </Text>
        </View>

        {Object.entries(filteredCategories).map(([category, apps]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.appGrid}>
              {apps.map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={[
                    styles.appCard,
                    isSelected(app.id) && styles.appCardSelected,
                  ]}
                  onPress={() => toggleMonitoredApp(app.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.appIconWrap,
                      isSelected(app.id) && styles.appIconWrapSelected,
                    ]}
                  >
                    <Ionicons
                      name={app.icon}
                      size={28}
                      color={isSelected(app.id) ? '#6C63FF' : '#8E8E93'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.appName,
                      isSelected(app.id) && styles.appNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {app.name}
                  </Text>
                  {isSelected(app.id) && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#6C63FF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color="#333344" />
            <Text style={styles.emptyText}>No apps found</Text>
          </View>
        )}

        {/* Note about real app detection */}
        <View style={styles.noteCard}>
          <Ionicons name="construct-outline" size={16} color="#555566" />
          <Text style={styles.noteText}>
            In the full version, this list will auto-populate with all apps installed on your device using the Screen Time API.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C2E',
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  doneBtn: {
    padding: 4,
  },
  doneBtnText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131F',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1C1C2E',
  },
  quickBtnText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.15)',
  },
  infoBannerText: {
    flex: 1,
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  appCard: {
    width: '30%',
    aspectRatio: 0.9,
    backgroundColor: '#13131F',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#1C1C2E',
    position: 'relative',
    gap: 8,
  },
  appCardSelected: {
    borderColor: 'rgba(108, 99, 255, 0.5)',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
  },
  appIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1C1C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconWrapSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  appName: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  appNameSelected: {
    color: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#555566',
    fontSize: 15,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  noteText: {
    flex: 1,
    color: '#555566',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
