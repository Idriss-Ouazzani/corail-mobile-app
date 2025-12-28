import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionScreenProps {
  onBack: () => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'gratuit',
    color: '#64748b',
    features: [
      { text: 'Publier des courses', included: true },
      { text: 'Accès marketplace', included: false },
      { text: 'Créer des groupes', included: false },
      { text: 'Commission', value: '0%' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '29,99€',
    period: '/mois',
    color: '#0ea5e9',
    popular: true,
    features: [
      { text: 'Publier des courses', included: true },
      { text: 'Accès marketplace', included: true },
      { text: 'Créer des groupes', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Commission', value: '10%' },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '49,99€',
    period: '/mois',
    color: '#fbbf24',
    features: [
      { text: 'Tout Premium', included: true },
      { text: 'Priorité 15min sur courses', included: true },
      { text: 'Badge Platinum', included: true },
      { text: 'Analytics avancés', included: true },
      { text: 'Commission', value: '12%' },
    ],
  },
];

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onBack }) => {
  const [currentPlan] = useState('premium'); // Hassan is Premium

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan Banner */}
        <View style={styles.currentPlanBanner}>
          <LinearGradient
            colors={['rgba(14, 165, 233, 0.2)', 'rgba(14, 165, 233, 0.05)']}
            style={styles.currentPlanGradient}
          >
            <View style={styles.currentPlanIcon}>
              <Ionicons name="star" size={24} color="#0ea5e9" />
            </View>
            <View style={styles.currentPlanInfo}>
              <Text style={styles.currentPlanLabel}>Abonnement actuel</Text>
              <Text style={styles.currentPlanName}>Premium</Text>
            </View>
            <TouchableOpacity style={styles.managePlanButton}>
              <Text style={styles.managePlanText}>Gérer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Plans */}
        <Text style={styles.sectionTitle}>Choisir un forfait</Text>
        {PLANS.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAIRE</Text>
              </View>
            )}
            <LinearGradient
              colors={[
                `${plan.color}15`,
                `${plan.color}05`,
              ]}
              style={styles.planGradient}
            >
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>
                {currentPlan === plan.id && (
                  <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    {feature.included !== undefined ? (
                      <Ionicons
                        name={feature.included ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={feature.included ? '#10b981' : '#64748b'}
                      />
                    ) : (
                      <Ionicons name="arrow-forward" size={20} color={plan.color} />
                    )}
                    <Text style={styles.featureText}>{feature.text}</Text>
                    {feature.value && (
                      <Text style={[styles.featureValue, { color: plan.color }]}>
                        {feature.value}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {currentPlan !== plan.id && (
                <TouchableOpacity
                  style={styles.selectButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[plan.color, `${plan.color}dd`]}
                    style={styles.selectButtonGradient}
                  >
                    <Text style={styles.selectButtonText}>
                      {plan.id === 'free' ? 'Rétrograder' : 'Mettre à niveau'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        ))}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>
            Vous pouvez modifier ou annuler votre abonnement à tout moment depuis les paramètres.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currentPlanBanner: {
    marginBottom: 30,
  },
  currentPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  currentPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  managePlanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  managePlanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    zIndex: 10,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 4,
  },
  currentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#f1f5f9',
    marginLeft: 12,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default SubscriptionScreen;

