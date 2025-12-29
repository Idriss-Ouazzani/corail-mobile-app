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
    credits: 0,
    features: [
      { text: 'Publier des courses', included: true },
      { text: 'Accès marketplace', included: false },
      { text: 'Créer des groupes', included: false },
      { text: 'Crédits Corail', value: '0 C/mois' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '29,99€',
    period: '/mois',
    color: '#0ea5e9',
    popular: true,
    credits: 5,
    features: [
      { text: 'Publier des courses', included: true },
      { text: 'Accès marketplace', included: true },
      { text: 'Créer des groupes', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Crédits Corail', value: '5 C/mois' },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '49,99€',
    period: '/mois',
    color: '#fbbf24',
    credits: 10,
    features: [
      { text: 'Tout Premium', included: true },
      { text: 'Priorité 15min sur courses', included: true },
      { text: 'Badge Platinum', included: true },
      { text: 'Analytics avancés', included: true },
      { text: 'Crédits Corail', value: '10 C/mois' },
    ],
  },
];

const CREDIT_PACKS = [
  { id: '1', amount: 1, price: 5, popular: false },
  { id: '5', amount: 5, price: 20, discount: 20, popular: true },
  { id: '10', amount: 10, price: 35, discount: 30 },
  { id: '20', amount: 20, price: 60, discount: 40 },
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
          <View key={plan.id} style={[
            styles.planCard,
            currentPlan === plan.id && styles.planCardActive
          ]}>
            {plan.popular && currentPlan !== plan.id && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAIRE</Text>
              </View>
            )}
            {currentPlan === plan.id && (
              <View style={styles.currentPlanTopBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.currentPlanTopBadgeText}>PLAN ACTUEL</Text>
              </View>
            )}
            <LinearGradient
              colors={
                currentPlan === plan.id
                  ? [`${plan.color}25`, `${plan.color}10`]
                  : [`${plan.color}15`, `${plan.color}05`]
              }
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

        {/* Acheter des crédits */}
        <Text style={styles.sectionTitle}>Acheter des crédits Corail</Text>
        <Text style={styles.sectionSubtitle}>
          Besoin de plus de crédits ? Achetez-les à l'unité ou par pack.
        </Text>
        
        {/* Comment gagner des crédits */}
        <View style={styles.creditsInfoBox}>
          <Ionicons name="bulb" size={20} color="#fbbf24" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.creditsInfoTitle}>Gagnez des crédits gratuitement !</Text>
            <Text style={styles.creditsInfoText}>
              • <Text style={{ fontWeight: '700' }}>+1 crédit</Text> à chaque course que vous publiez{'\n'}
              • <Text style={{ fontWeight: '700' }}>+1 crédit bonus</Text> quand votre course est prise et terminée{'\n'}
              • <Text style={{ fontWeight: '700' }}>5 ou 10 crédits/mois</Text> avec un abonnement
            </Text>
          </View>
        </View>
        
        <View style={styles.creditPacksGrid}>
          {CREDIT_PACKS.map((pack) => (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.creditPackCard,
                pack.popular && styles.creditPackCardPopular,
              ]}
              activeOpacity={0.8}
            >
              {pack.popular && (
                <View style={styles.creditPackBadge}>
                  <Text style={styles.creditPackBadgeText}>MEILLEUR PRIX</Text>
                </View>
              )}
              <View style={styles.creditPackIcon}>
                <Text style={styles.creditPackIconText}>C</Text>
              </View>
              <Text style={styles.creditPackAmount}>{pack.amount}</Text>
              <Text style={styles.creditPackLabel}>crédit{pack.amount > 1 ? 's' : ''}</Text>
              <View style={styles.creditPackPriceRow}>
                <Text style={styles.creditPackPrice}>{pack.price}€</Text>
                {pack.discount && (
                  <View style={styles.creditPackDiscount}>
                    <Text style={styles.creditPackDiscountText}>-{pack.discount}%</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.creditPackButton}>
                <LinearGradient
                  colors={['#ff6b47', '#ff8a6d']}
                  style={styles.creditPackButtonGradient}
                >
                  <Text style={styles.creditPackButtonText}>Acheter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

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
    marginBottom: 8,
    marginTop: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 20,
  },
  planCard: {
    marginBottom: 20,
    position: 'relative',
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 20,
  },
  currentPlanTopBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    zIndex: 10,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPlanTopBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginLeft: 4,
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
    marginTop: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 12,
    lineHeight: 20,
  },
  creditsInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  creditsInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  creditsInfoText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 22,
  },
  // Credit Packs
  creditPacksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 10,
  },
  creditPackCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: '1.5%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    position: 'relative',
  },
  creditPackCardPopular: {
    borderColor: 'rgba(255, 107, 71, 0.4)',
    borderWidth: 2,
  },
  creditPackBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#ff6b47',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditPackBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  creditPackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 71, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  creditPackIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b47',
  },
  creditPackAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  creditPackLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  creditPackPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creditPackPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b47',
    marginRight: 8,
  },
  creditPackDiscount: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  creditPackDiscountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  creditPackButton: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  creditPackButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  creditPackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SubscriptionScreen;

