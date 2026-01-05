/**
 * App.tsx Styles
 * 
 * Styles extraits de App.tsx pour améliorer la lisibilité
 * Organisés par sections fonctionnelles
 */

import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 71, 0.4)',
    marginBottom: 16,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: { fontSize: 16, color: '#94a3b8', marginBottom: 4 },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 12 },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: { fontSize: 12, fontWeight: '700', color: '#000000' },

  // ============================================================================
  // CREDITS
  // ============================================================================
  creditsBalance: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  creditsBalanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  creditsIconLargeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
  },
  creditsAddButton: {
    marginLeft: 12,
  },
  creditsExplainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  creditsExplainerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  creditsExplainerText: {
    fontSize: 12,
    color: '#94a3b8',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    shadowColor: '#000',
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
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 3 },
  statLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },

  // Stats Compact
  statsContainerCompact: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCardCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statIconWrapperCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfoCompact: {
    flex: 1,
  },
  statValueCompact: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#f1f5f9', 
    marginBottom: 2 
  },
  statLabelCompact: { 
    fontSize: 11, 
    color: '#94a3b8' 
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
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
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '600',
  },
  secondaryStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },

  // ============================================================================
  // SECTION (Generic)
  // ============================================================================
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
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
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  badgesInfoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  emptyBadgeCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    borderStyle: 'dashed',
  },
  emptyBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 12,
  },
  emptyBadgeSubtext: {
    fontSize: 13,
    color: '#64748b',
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
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
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
    marginBottom: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 4,
  },
  groupMemberCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyGroupCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderStyle: 'dashed',
  },
  emptyGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 12,
  },
  emptyGroupSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  // ============================================================================
  // QR CODE BUTTON
  // ============================================================================
  qrCodeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  qrCodeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  qrCodeButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrCodeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  qrCodeButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: '#94a3b8' },

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
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 100,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: '#000000' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginTop: 24, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileStatItem: { flex: 1, alignItems: 'center' },
  profileStatValue: { fontSize: 26, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  profileStatLabel: { fontSize: 12, color: '#94a3b8' },
  profileStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)' },

  // ============================================================================
  // MENU
  // ============================================================================
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#f1f5f9' },

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
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    // Glassmorphism effect
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  bottomNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 68,
  },
  
  // Nav Items (regular tabs)
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  navIconBoxActive: {
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.4)',
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  navTextActive: {
    color: '#ff6b47',
    fontWeight: '700',
  },

  // Center FAB - Integrated in the nav
  centerFABIntegrated: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginHorizontal: 4,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    // Lift effect
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
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
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
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  publishModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  publishModalSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  publishLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 12,
    marginTop: 16,
  },
  publishOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  publishOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
  },
  publishOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  publishOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  publishOptionTextActive: {
    color: '#fff',
  },
  publishVehicleTypes: {
    gap: 8,
  },
  publishVehicleType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
  },
  publishVehicleTypeActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  publishVehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  publishVehicleTypeTextActive: {
    color: '#fff',
  },
  publishModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  publishCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  publishConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  publishConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // ============================================================================
  // CREDITS MODAL
  // ============================================================================
  creditsModalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  creditsModalGradient: {
    padding: 24,
  },
  creditsModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  creditsModalIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  creditsModalIconText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6b47',
  },
  creditsModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  creditsModalClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  creditsModalContent: {
    maxHeight: 400,
  },
  creditsModalSection: {
    marginBottom: 24,
  },
  creditsModalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  creditsModalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  creditsModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingLeft: 8,
  },
  creditsModalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748b',
  },
  creditsModalItemText: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  creditsModalBadge: {
    fontWeight: '700',
    color: '#ff6b47',
  },
  creditsModalBadgePositive: {
    fontWeight: '700',
    color: '#10b981',
  },
  creditsModalFreeSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  creditsModalFreeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: 8,
    marginBottom: 8,
  },
  creditsModalFreeText: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
  },
});

