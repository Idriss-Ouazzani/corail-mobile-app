/**
 * PlanningUtils - Fonctions utilitaires pour le Planning
 */

export const getEventColor = (eventType: string): string => {
  switch (eventType) {
    case 'RIDE': return '#ff6b47';
    case 'BREAK': return '#10b981';
    case 'MAINTENANCE': return '#f59e0b';
    case 'PERSONAL': return '#8b5cf6';
    default: return '#64748b';
  }
};

export const getEventIcon = (eventType: string, source?: string): string => {
  if (eventType === 'RIDE') {
    if (source === 'UBER') return 'logo-uber';
    if (source === 'BOLT') return 'flash';
    if (source === 'DIRECT') return 'call';
    if (source === 'MARKETPLACE') return 'git-network';
    return 'car';
  }
  switch (eventType) {
    case 'BREAK': return 'cafe';
    case 'MAINTENANCE': return 'construct';
    case 'PERSONAL': return 'person';
    default: return 'calendar';
  }
};

export const getEventLabel = (event: any): string => {
  if (event.event_type === 'RIDE') {
    if (event.ride_source === 'UBER') return 'Uber';
    if (event.ride_source === 'BOLT') return 'Bolt';
    if (event.ride_source === 'DIRECT') return 'Course directe';
    if (event.ride_source === 'MARKETPLACE') return 'Corail Marketplace';
    return 'Course VTC';
  }
  switch (event.event_type) {
    case 'BREAK': return 'Pause';
    case 'MAINTENANCE': return 'Entretien';
    case 'PERSONAL': return 'Personnel';
    default: return 'Événement';
  }
};

export const formatTime = (datetime: string): string => {
  return datetime.substring(11, 16); // HH:MM
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'SCHEDULED': return 'rgba(99, 102, 241, 0.2)';
    case 'IN_PROGRESS': return 'rgba(16, 185, 129, 0.2)';
    case 'COMPLETED': return 'rgba(100, 116, 139, 0.2)';
    case 'CANCELLED': return 'rgba(239, 68, 68, 0.2)';
    default: return 'rgba(100, 116, 139, 0.2)';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'SCHEDULED': return 'Planifié';
    case 'IN_PROGRESS': return 'En cours';
    case 'COMPLETED': return 'Terminé';
    case 'CANCELLED': return 'Annulé';
    default: return status;
  }
};

export const getWeekDays = (selectedDate: string) => {
  const current = new Date(selectedDate);
  const firstDayOfWeek = new Date(current);
  const dayOfWeek = current.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Lundi = premier jour
  firstDayOfWeek.setDate(current.getDate() + diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    weekDays.push({
      date: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: day.getDate(),
      isToday: day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      isSelected: day.toISOString().split('T')[0] === selectedDate,
    });
  }
  return weekDays;
};

