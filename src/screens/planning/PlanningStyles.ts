/**
 * PlanningStyles - Tous les styles du Planning
 */

import { StyleSheet } from 'react-native';

export const planningStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewModeButtonActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e293b',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  navigationSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  todayButton: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff6b47',
    marginTop: 4,
  },
  // Week View
  weekView: {
    flex: 1,
  },
  weekDaysScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  weekDayCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 60,
  },
  weekDayCardSelected: {
    backgroundColor: '#ff6b47',
  },
  weekDayCardToday: {
    borderWidth: 2,
    borderColor: '#ff6b47',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  weekDayNameSelected: {
    color: '#fff',
  },
  weekDayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  weekDayNumberSelected: {
    color: '#fff',
  },
  weekDayDot: {
    marginTop: 6,
    backgroundColor: '#ff6b47',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weekDayDotSelected: {
    backgroundColor: '#fff',
  },
  weekDayDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  weekEventsContainer: {
    flex: 1,
    padding: 16,
  },
  weekEventCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  weekEventCardPast: {
    opacity: 0.6,
  },
  weekEventColorBar: {
    width: 4,
  },
  weekEventContent: {
    flex: 1,
    padding: 16,
  },
  weekEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  weekEventLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  weekEventLabelPast: {
    color: '#94a3b8',
  },
  weekEventTime: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  weekEventTimePast: {
    color: '#64748b',
  },
  weekEventAddress: {
    fontSize: 13,
    color: '#94a3b8',
  },
  weekEventAddressPast: {
    color: '#64748b',
  },
  emptyWeekDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyWeekDayText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  // Day View
  dayView: {
    flex: 1,
  },
  timeline: {
    paddingVertical: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  timeColumn: {
    width: 70,
    paddingTop: 12,
    paddingLeft: 16,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  eventsColumn: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 16,
  },
  emptySlot: {
    height: 44,
  },
  timelineEvent: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  timelineEventPast: {
    opacity: 0.6,
  },
  timelineEventFuture: {
    // Style par défaut
  },
  timelineEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timelineEventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  timelineEventTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  timelineEventAddress: {
    fontSize: 12,
    color: '#94a3b8',
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 70,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ef4444',
  },
  currentTimeText: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyDayMessage: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  modalField: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalButton: {
    backgroundColor: '#ff6b47',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

