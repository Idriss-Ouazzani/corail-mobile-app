/**
 * OnboardingScreen - Présentation de l'app au premier lancement
 * Swipe entre les slides : VTC → Chauffeur privé, Devis/Factures, Planning, Gratuité, C'est parti
 * Images réelles (Unsplash) pour illustrer chaque situation.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Photos Unsplash (libres de droit) : situations réelles
const U = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=85`;

const SLIDES = [
  {
    key: '1',
    image: U('1449965408869-eaa3f722e40d'), // voiture / conduite pro
    title: 'VTC → Chauffeur privé',
    subtitle: 'Passez d’un statut VTC classique à chauffeur privé. Corail vous accompagne au quotidien.',
  },
  {
    key: '2',
    image: U('1554224155-6726b3ff858f'), // documents / factures
    title: 'Devis & factures',
    subtitle: 'Créez des devis en quelques taps, générez vos factures et gardez la main sur votre activité.',
  },
  {
    key: '3',
    image: U('1506784365847-bbad939e9335'), // calendrier / planning
    title: 'Votre planning',
    subtitle: 'Visualisez vos courses à venir, personnelles et marketplace, dans un calendrier clair.',
  },
  {
    key: '4',
    image: U('1513885535751-8b9238bd345a'), // cadeau / gratuit
    title: 'Gratuit pour le chauffeur',
    subtitle: 'Aucun abonnement. Vous publiez des courses, vous en prenez d’autres : le service reste gratuit pour vous.',
  },
  {
    key: '5',
    image: U('1544620347-c4fd4a3d5957'), // route / départ
    title: 'C’est parti',
    subtitle: 'Accédez à votre tableau de bord, aux annonces et à vos outils pro.',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  const onNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index < SLIDES.length - 1) {
      flatListRef.current?.scrollToOffset({ offset: (index + 1) * SCREEN_WIDTH, animated: true });
    } else {
      onComplete();
    }
  };

  const onSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  const renderSlide = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={styles.slide}>
      <View style={styles.contentBlock}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
          <View style={styles.imageOverlay} pointerEvents="none" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.8}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButtonWrap} onPress={onNext} activeOpacity={0.9}>
            <LinearGradient
              colors={['#0ea5e9', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  contentBlock: {
    alignItems: 'center',
    width: '100%',
    marginTop: 56,
  },
  imageWrap: {
    width: SCREEN_WIDTH - 56,
    maxWidth: 320,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0ea5e9',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  nextButtonWrap: {
    flex: 1,
    maxWidth: 200,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
    gap: 8,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
