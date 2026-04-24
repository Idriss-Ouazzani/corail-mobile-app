/**
 * OnboardingScreen - Présentation de l'app au premier lancement
 * Flow : Page pro (getcorail.com) → Réseau chauffeurs indépendants → 0% commission, 100% gratuit → Ambition → C'est parti
 * Swipe horizontal, style simple et élégant.
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
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_MAX_HEIGHT = Math.min(320, SCREEN_HEIGHT * 0.42);

// Images locales : page pro (flow du site getcorail.com)
const PAGE_PRO_1 = require('../../assets/onboarding/ma-page-pro-1.jpeg') as ImageSourcePropType;
const PAGE_PRO_2 = require('../../assets/onboarding/ma-page-pro-2.jpeg') as ImageSourcePropType;

// Images libres de droits (Unsplash)
const UNSPLASH_LINK_SHARE = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=85'; // échange pro / partage avec clients
const UNSPLASH_NETWORK = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';
const UNSPLASH_FREE = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=90';
const UNSPLASH_AMBITION = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=85';
const UNSPLASH_LETS_GO = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=85'; // transport / c'est parti (ex-page 2)

const SLIDES = [
  {
    key: '1',
    images: [PAGE_PRO_1, PAGE_PRO_2] as [ImageSourcePropType, ImageSourcePropType],
    title: 'Votre page professionnelle',
    subtitle: 'Sur getcorail.com, vos clients découvrent votre profil, vos tarifs et peuvent vous réserver en direct. Complétez « Ma Page Pro » dans l’app pour activer votre lien.',
  },
  {
    key: '2',
    imageUri: UNSPLASH_LINK_SHARE,
    title: 'Un lien à partager',
    subtitle: 'Partagez le lien de votre page avec vos clients. Ils vous contactent, vous enchaînez les courses sans intermédiaire.',
  },
  {
    key: '3',
    imageUri: UNSPLASH_NETWORK,
    title: 'Un nouveau réseau de chauffeurs indépendants',
    subtitle: 'Entraide entre professionnels : publiez vos courses indisponibles, prenez celles des autres. Un réseau structuré, sans plateforme qui s’intercale.',
  },
  {
    key: '4',
    imageUri: UNSPLASH_FREE,
    title: '0% de commission. 100% gratuit.',
    subtitle: 'Aucun abonnement. Vous publiez une course = vous gagnez un crédit. Vous en prenez une = vous en utilisez un. Le service reste gratuit pour vous.',
  },
  {
    key: '5',
    imageUri: UNSPLASH_AMBITION,
    title: 'Notre ambition',
    subtitle: 'Structurer la profession et donner aux chauffeurs une infrastructure pour aujourd’hui. Un réseau pour demain.',
  },
  {
    key: '6',
    imageUri: UNSPLASH_LETS_GO,
    title: 'C’est parti',
    subtitle: 'Accédez à votre tableau de bord, complétez votre page pro et rejoignez le réseau.',
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

  const renderSlide = ({ item }: { item: (typeof SLIDES)[0] }) => {
    const hasImages = 'images' in item && Array.isArray((item as { images?: ImageSourcePropType[] }).images);
    const hasImage = !!(item as { image?: ImageSourcePropType }).image;
    const hasImageUri = !!(item as { imageUri?: string }).imageUri;
    const hasIcon = 'icon' in item && item.icon;
    return (
      <View style={styles.slide}>
        <View style={styles.contentBlock}>
          <View style={[styles.imageWrap, { height: IMAGE_MAX_HEIGHT }]}>
            {hasImages ? (
              <View style={styles.twoImagesRow}>
                {(item as { images: ImageSourcePropType[] }).images.map((img, i) => (
                  <ExpoImage
                    key={i}
                    source={img}
                    style={styles.twoImagesExpo}
                    contentFit="contain"
                    transition={150}
                  />
                ))}
                <View style={styles.imageOverlay} pointerEvents="none" />
              </View>
            ) : hasImage ? (
              <>
                <Image
                  source={(item as { image: ImageSourcePropType }).image}
                  style={styles.slideImage}
                  resizeMode="contain"
                />
                <View style={styles.imageOverlay} pointerEvents="none" />
              </>
            ) : hasImageUri ? (
              <>
                <Image
                  source={{ uri: (item as { imageUri: string }).imageUri }}
                  style={styles.slideImage}
                  resizeMode="contain"
                />
                <View style={styles.imageOverlay} pointerEvents="none" />
              </>
            ) : (
              <View style={styles.iconWrap}>
                <Ionicons
                  name={hasIcon ? (item as { icon: keyof typeof Ionicons.glyphMap }).icon : 'help-circle'}
                  size={64}
                  color="#0ea5e9"
                />
              </View>
            )}
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

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
  twoImagesRow: {
    flexDirection: 'row',
    flex: 1,
    width: '100%',
    gap: 12,
    alignItems: 'stretch',
    position: 'relative',
  },
  /** RN Image + height 100 % dans une ligne flex peut rendre une hauteur nulle ; expo-image + flex évite les cases vides. */
  twoImagesExpo: {
    flex: 1,
    minWidth: 0,
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  iconWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
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
