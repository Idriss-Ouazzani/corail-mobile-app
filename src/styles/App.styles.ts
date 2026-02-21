/**
 * App.tsx Styles
 * Styles extraits de App.tsx pour améliorer la lisibilité.
 * Utilise le thème centralisé (src/theme).
 */

import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const c = theme.colors;
const s = theme.spacing;
const r = theme.radii;

export const appStyles = StyleSheet.create({
  // ============================================================================
  // BASE STYLES
  // ============================================================================
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 },
  scrollContentCourses: { paddingTop: 16, paddingBottom: 120, paddingHorizontal: 20 },

  // ============================================================================
  // HERO SECTION
  // ============================================================================
  heroSection: { marginBottom: 20 },
  heroContent: { alignItems: 'center', paddingVertical: 20 },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.cardBgSubtleStrong,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: c.primaryBorder,
    marginBottom: s.md,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: { fontSize: 16, color: c.textMuted, marginBottom: 4 },
  userName: { fontSize: 26, fontWeight: 'bold', color: c.textSecondary, marginBottom: s.md },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.warning,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: { fontSize: 12, fontWeight: '700', color: c.black },

  // ============================================================================
  // CREDITS
  // ============================================================================
  creditsBalance: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  creditsBalanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s.lg,
  },
  creditsBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creditsIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  creditsIconLargeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.white,
  },
  creditsBalanceInfo: {
    flex: 1,
  },
  creditsBalanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  creditsBalanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: c.white,
  },
  creditsAddButton: {
    marginLeft: s.sm,
  },
  creditsExplainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: c.infoBgSoft,
    borderRadius: s.md,
    padding: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  creditsExplainerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textSecondary,
    marginBottom: 4,
  },
  creditsExplainerText: {
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 18,
  },

  // ============================================================================
  // STATS
  // ============================================================================
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: c.cardBgSubtle,
    borderRadius: r.md,
    padding: s.sm,
    marginHorizontal: 6,
    marginBottom: s.sm,
    borderWidth: 1,
    borderColor: c.borderLight,
    alignItems: 'center',
    shadowColor: c.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s.xs,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: c.textSecondary, marginBottom: 3 },
  statLabel: { fontSize: 10, color: c.textMuted, textAlign: 'center' },

  // Stats Compact
  statsContainerCompact: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCardCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.cardBgSubtle,
    borderRadius: s.md,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  statIconWrapperCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s.sm,
  },
  statInfoCompact: {
    flex: 1,
  },
  statValueCompact: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: c.textSecondary, 
    marginBottom: 2 
  },
  statLabelCompact: { 
    fontSize: 11, 
    color: c.textMuted 
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: r.sm,
    padding: s.sm,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryStatText: {
    fontSize: 13,
    color: c.textMuted,
    marginLeft: 6,
    fontWeight: '600',
  },
  secondaryStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: s.md,
  },

  // ============================================================================
  // SECTION (Generic)
  // ============================================================================
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: c.textSecondary, marginBottom: s.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.md,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.info,
  },

  // ============================================================================
  // BADGES SECTION
  // ============================================================================
  badgesScroll: {
    paddingVertical: 8,
  },
  badgesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: r.sm,
    padding: s.sm,
    marginTop: s.sm,
  },
  badgesInfoText: {
    fontSize: 12,
    color: c.textMuted,
    marginLeft: s.xs,
    flex: 1,
    lineHeight: 18,
  },
  emptyBadgeCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: s.md,
    padding: s.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: c.warningBg,
    borderStyle: 'dashed',
  },
  emptyBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSoft,
    marginTop: s.sm,
  },
  emptyBadgeSubtext: {
    fontSize: 13,
    color: c.textMutedDark,
    marginTop: 4,
    textAlign: 'center',
  },

  // ============================================================================
  // GROUPS SECTION
  // ============================================================================
  groupsScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  groupCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: s.md,
    padding: s.md,
    marginRight: s.sm,
    width: 140,
    borderWidth: 2,
    alignItems: 'center',
  },
  groupIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s.xs,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  groupMemberCount: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'center',
  },
  emptyGroupCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: s.md,
    padding: s.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderStyle: 'dashed',
  },
  emptyGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSoft,
    marginTop: s.sm,
  },
  emptyGroupSubtext: {
    fontSize: 13,
    color: c.textMutedDark,
    marginTop: 4,
    textAlign: 'center',
  },

  // ============================================================================
  // QR CODE BUTTON
  // ============================================================================
  qrCodeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  qrCodeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s.lg,
  },
  qrCodeButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrCodeIcon: {
    width: 56,
    height: 56,
    borderRadius: s.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s.md,
  },
  qrCodeButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.white,
    marginBottom: 4,
  },
  qrCodeButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ============================================================================
  // ACTION CARDS
  // ============================================================================
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.cardBgSubtle,
    borderRadius: r.lg,
    padding: 18,
    marginBottom: s.sm,
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: c.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: r.sm,
    backgroundColor: c.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s.md,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: c.textSecondary, marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: c.textMuted },

  // ============================================================================
  // PROFILE
  // ============================================================================
  profileHeader: { alignItems: 'center', paddingVertical: 30, marginBottom: 20 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: c.white },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 100,
    backgroundColor: c.warning,
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    borderRadius: r.sm,
    borderWidth: 3,
    borderColor: c.background,
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: c.black },
  profileName: { fontSize: 24, fontWeight: 'bold', color: c.textSecondary, marginTop: s.xl, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: c.textMuted, marginBottom: s.lg },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.cardBgSubtle,
    borderRadius: 20,
    padding: s.xl,
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: c.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileStatItem: { flex: 1, alignItems: 'center' },
  profileStatValue: { fontSize: 26, fontWeight: 'bold', color: c.textSecondary, marginBottom: 4 },
  profileStatLabel: { fontSize: 12, color: c.textMuted },
  profileStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)' },

  // ============================================================================
  // MENU
  // ============================================================================
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.cardBgSubtle,
    borderRadius: r.lg,
    padding: 18,
    marginBottom: s.sm,
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: c.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: r.sm,
    backgroundColor: c.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s.md,
  },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: c.textSecondary },

  // ============================================================================
  // BOTTOM NAVIGATION
  // ============================================================================
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  bottomNavGradient: {
    borderRadius: 32,
    paddingVertical: s.xs,
    paddingHorizontal: s.xs,
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: c.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  bottomNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 68,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.xs,
  },
  navIconBox: {
    width: 48,
    height: 48,
    borderRadius: s.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: c.cardBgSubtle,
  },
  navIconBoxActive: {
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    borderWidth: 1,
    borderColor: c.primaryBorder,
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: c.textMutedDark,
    letterSpacing: 0.2,
  },
  navTextActive: {
    color: c.primary,
    fontWeight: '700',
  },
  centerFABIntegrated: {
    width: 56,
    height: 56,
    borderRadius: r.lg,
    marginHorizontal: 4,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ translateY: -8 }],
  },
  centerFABGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ============================================================================
  // TABS (My Rides, etc.)
  // ============================================================================
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: s.xs,
    borderRadius: r.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: c.textMutedDark,
  },
  tabTextActive: {
    color: c.white,
    fontWeight: '700',
  },

  // ============================================================================
  // MODALS - Base
  // ============================================================================
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  // ============================================================================
  // PUBLISH MODAL
  // ============================================================================
  publishModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: s.xl,
    borderWidth: 1,
    borderColor: c.border,
  },
  publishModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textSecondary,
    marginBottom: s.xs,
  },
  publishModalSubtitle: {
    fontSize: 14,
    color: c.textMuted,
    marginBottom: s.xl,
  },
  publishLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSoft,
    marginBottom: s.sm,
    marginTop: s.md,
  },
  publishOptions: {
    flexDirection: 'row',
    gap: s.sm,
  },
  publishOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    paddingVertical: 14,
    borderRadius: r.sm,
    backgroundColor: c.background,
    borderWidth: 2,
    borderColor: c.border,
  },
  publishOptionActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  publishOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMutedDark,
  },
  publishOptionTextActive: {
    color: c.white,
  },
  publishVehicleTypes: {
    gap: s.xs,
  },
  publishVehicleType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.sm,
    paddingHorizontal: s.md,
    borderRadius: r.sm,
    backgroundColor: c.background,
    borderWidth: 2,
    borderColor: c.border,
  },
  publishVehicleTypeActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  publishVehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMutedDark,
    textAlign: 'center',
  },
  publishVehicleTypeTextActive: {
    color: c.white,
  },
  publishModalActions: {
    flexDirection: 'row',
    gap: s.sm,
    marginTop: s.xl,
  },
  publishCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: r.sm,
    backgroundColor: c.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textSoft,
  },
  publishConfirmButton: {
    flex: 1,
    borderRadius: r.sm,
    overflow: 'hidden',
  },
  publishConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    paddingVertical: 14,
  },
  publishConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: c.white,
  },

  // ============================================================================
  // CREDITS MODAL
  // ============================================================================
  creditsModalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: s.xl,
    overflow: 'hidden',
    shadowColor: c.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  creditsModalGradient: {
    padding: s.xl,
  },
  creditsModalHeader: {
    alignItems: 'center',
    marginBottom: s.xl,
    position: 'relative',
  },
  creditsModalIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.sm,
  },
  creditsModalIconText: {
    fontSize: 28,
    fontWeight: '800',
    color: c.primary,
  },
  creditsModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textSecondary,
    textAlign: 'center',
  },
  creditsModalClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: s.xs,
  },
  creditsModalContent: {
    maxHeight: 400,
  },
  creditsModalSection: {
    marginBottom: s.xl,
  },
  creditsModalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginBottom: s.sm,
  },
  creditsModalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textSoft,
  },
  creditsModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.xs,
    paddingLeft: s.xs,
  },
  creditsModalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.textMutedDark,
  },
  creditsModalItemText: {
    fontSize: 14,
    color: c.textMuted,
    flex: 1,
  },
  creditsModalBadge: {
    fontWeight: '700',
    color: c.primary,
  },
  creditsModalBadgePositive: {
    fontWeight: '700',
    color: c.success,
  },
  creditsModalFreeSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: s.md,
    padding: s.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.warningBorder,
  },
  creditsModalFreeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.warning,
    marginTop: s.xs,
    marginBottom: s.xs,
  },
  creditsModalFreeText: {
    fontSize: 13,
    color: c.textSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
});

