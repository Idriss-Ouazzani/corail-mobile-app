/**
 * Corail API Client
 * Communication avec le backend FastAPI
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { Ride, RideListResponse, User, Group, ApiError } from '../types';
import { firebaseAuth } from './firebase';

class ApiClient {
  private client: AxiosInstance;
  private userId: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 60000, // 60 secondes pour Render (réveil) + Databricks
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Ajoute automatiquement le token Firebase
    this.client.interceptors.request.use(
      async (config) => {
        console.log('[API] 🔄 Interceptor appelé');
        
        // Récupérer le token Firebase automatiquement
        try {
          console.log('[API] 🔍 Tentative de récupération du token...');
          const token = await firebaseAuth.getIdToken();
          console.log('[API] 📦 Token reçu:', token ? `Oui (${token.length} chars)` : 'Non (null/undefined)');
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`[API] 🔐 Token Firebase ajouté aux headers`);
          } else {
            console.warn('[API] ⚠️ Pas de token Firebase disponible !');
          }
        } catch (error) {
          console.error('[API] ❌ Erreur récupération token:', error);
        }

        // User ID pour tracking (optionnel)
        if (this.userId) {
          config.headers['X-User-Id'] = this.userId;
        }

        console.log(`[API] 📤 ${config.method?.toUpperCase()} ${this.client.defaults.baseURL}${config.url}`);
        console.log(`[API] 📋 Headers:`, config.headers);
        return config;
      },
      (error) => {
        console.error('[API] ❌ Erreur dans interceptor:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          console.error(`[API Error] ${error.response.status}:`, error.response.data);
          
          // Gérer l'erreur 401 (non authentifié)
          if (error.response.status === 401) {
            throw new Error('Session expirée. Reconnectez-vous.');
          }
          
          throw new Error(error.response.data?.detail || 'Une erreur est survenue');
        }
        throw new Error('Erreur de connexion au serveur');
      }
    );
  }

  // Auth - Simplifié car Firebase gère les tokens
  setUserId(userId: string) {
    this.userId = userId;
  }

  clearAuth() {
    this.userId = null;
  }

  // Rides
  async listMarketplaceRides(params: {
    skip?: number;
    limit?: number;
    filterType?: 'all' | 'public' | 'groups' | 'my_published';
  } = {}): Promise<RideListResponse> {
    const { skip = 0, limit = 20, filterType = 'all' } = params;
    const response = await this.client.get('/api/v1/rides/marketplace', {
      params: { skip, limit, filter: filterType },
    });
    return response.data;
  }

  async getRide(rideId: string): Promise<Ride> {
    const response = await this.client.get(`/api/v1/rides/${rideId}`);
    return response.data;
  }

  async listMyRides(): Promise<RideListResponse> {
    const response = await this.client.get('/api/v1/rides/my-rides');
    return response.data;
  }

  // Rides
  async getRides(params?: {
    status?: string;
    visibility?: string;
    skip?: number;
    limit?: number;
  }): Promise<Ride[]> {
    const response = await this.client.get('/api/v1/rides', { params });
    return response.data;
  }

  async createRide(rideData: {
    pickup_address: string;
    dropoff_address: string;
    scheduled_at: string;
    price_cents: number;
    visibility?: 'PUBLIC' | 'GROUP';
    vehicle_type?: string;
    distance_km?: number;
    duration_minutes?: number;
    group_id?: string;
  }): Promise<Ride> {
    const response = await this.client.post('/api/v1/rides', rideData);
    return response.data;
  }

  async claimRide(rideId: string): Promise<Ride> {
    const response = await this.client.post(`/api/v1/rides/${rideId}/claim`);
    return response.data;
  }

  async completeRide(rideId: string): Promise<Ride> {
    const response = await this.client.post(`/api/v1/rides/${rideId}/complete`);
    return response.data;
  }

  async cancelRide(rideId: string): Promise<Ride> {
    const response = await this.client.post(`/api/v1/rides/${rideId}/cancel`);
    return response.data;
  }

  async deleteRide(rideId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/api/v1/rides/${rideId}`);
    return response.data;
  }

  // Groups
  async listMyGroups(): Promise<{ data: Group[] }> {
    const response = await this.client.get('/api/v1/groups/my-groups');
    return response.data;
  }

  async getGroup(groupId: string): Promise<Group> {
    const response = await this.client.get(`/api/v1/groups/${groupId}`);
    return response.data;
  }

  // User
  async getUser(userId: string): Promise<User> {
    const response = await this.client.get(`/api/v1/users/${userId}`);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    if (!this.userId) throw new Error('User ID not set');
    return this.getUser(this.userId);
  }

  // Credits Corail 🪸
  async getCredits(): Promise<{ credits: number }> {
    const response = await this.client.get('/api/v1/credits');
    return response.data;
  }

  // ============================================================================
  // 👤 USERS
  // ============================================================================

  /**
   * Créer un utilisateur dans Databricks après inscription Firebase
   */
  async createUser(userData: {
    id: string;
    email: string;
    full_name: string;
    verification_status?: string;
  }) {
    const { data } = await this.client.post('/api/v1/users', userData);
    return data;
  }

  // ============================================================================
  // ✅ VERIFICATION PROFESSIONNELLE
  // ============================================================================

  /**
   * Récupérer le statut de vérification
   */
  async getVerificationStatus() {
    const { data } = await this.client.get('/api/v1/verification/status');
    return data;
  }

  /**
   * Soumettre les documents de vérification
   */
  async submitVerification(verification: {
    full_name: string;
    phone: string;
    professional_card_number: string;
    siren: string;
  }) {
    const { data } = await this.client.post('/api/v1/verification/submit', verification);
    return data;
  }

  /**
   * [ADMIN] Récupérer toutes les vérifications en attente
   */
  async getPendingVerifications() {
    const { data } = await this.client.get('/api/v1/admin/verification/pending');
    return data;
  }

  /**
   * [ADMIN] Valider ou rejeter une vérification
   */
  async reviewVerification(userId: string, review: {
    status: 'VERIFIED' | 'REJECTED';
    rejection_reason?: string;
  }) {
    const { data } = await this.client.post(`/api/v1/admin/verification/${userId}/review`, review);
    return data;
  }

  // ============================================================================
  // 🏆 BADGES
  // ============================================================================

  /**
   * Récupérer tous les badges disponibles
   */
  async getAllBadges() {
    const { data } = await this.client.get('/api/v1/badges');
    return data;
  }

  /**
   * Récupérer les badges d'un utilisateur
   */
  async getUserBadges(userId: string) {
    const { data } = await this.client.get(`/api/v1/users/${userId}/badges`);
    return data;
  }

  /**
   * Attribuer un badge à un utilisateur (manuel, pour tests)
   */
  async awardBadge(userId: string, badgeId: string) {
    const { data } = await this.client.post(`/api/v1/users/${userId}/badges/${badgeId}`);
    return data;
  }

  // ============================================================================
  // 🚗 PERSONAL RIDES (Enregistrement courses externes)
  // ============================================================================

  /**
   * Créer une nouvelle course personnelle
   */
  async createPersonalRide(rideData: {
    source: 'UBER' | 'BOLT' | 'DIRECT_CLIENT' | 'MARKETPLACE' | 'OTHER';
    pickup_address: string;
    dropoff_address: string;
    scheduled_at?: string;
    price_cents?: number;
    distance_km?: number;
    duration_minutes?: number;
    client_name?: string;
    client_phone?: string;
    notes?: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  }) {
    const { data } = await this.client.post('/api/v1/personal-rides', rideData);
    return data;
  }

  /**
   * Liste toutes les courses personnelles
   * Filtres optionnels: status, source
   */
  async listPersonalRides(filters?: {
    status?: string;
    source?: string;
    limit?: number;
  }) {
    const { data } = await this.client.get('/api/v1/personal-rides', { params: filters });
    return data;
  }

  /**
   * Récupérer les détails d'une course personnelle
   */
  async getPersonalRide(rideId: string) {
    const { data } = await this.client.get(`/api/v1/personal-rides/${rideId}`);
    return data;
  }

  /**
   * Mettre à jour une course personnelle
   */
  async updatePersonalRide(rideId: string, updates: {
    source?: string;
    pickup_address?: string;
    dropoff_address?: string;
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
    price_cents?: number;
    distance_km?: number;
    duration_minutes?: number;
    client_name?: string;
    client_phone?: string;
    notes?: string;
    status?: string;
  }) {
    const { data } = await this.client.put(`/api/v1/personal-rides/${rideId}`, updates);
    return data;
  }

  /**
   * Supprimer une course personnelle
   */
  async deletePersonalRide(rideId: string) {
    const { data } = await this.client.delete(`/api/v1/personal-rides/${rideId}`);
    return data;
  }

  /**
   * Récupérer les statistiques des courses personnelles
   * (revenus, nombre de courses, distance, par source)
   */
  async getPersonalRidesStats() {
    const { data } = await this.client.get('/api/v1/personal-rides/stats/summary');
    return data;
  }

  // ============================================================================
  // PLANNING & NOTIFICATIONS
  // ============================================================================

  /**
   * Récupérer les événements du planning
   */
  async getPlanningEvents(params?: {
    start_date?: string; // YYYY-MM-DD
    end_date?: string;
    event_type?: 'RIDE' | 'BREAK' | 'MAINTENANCE' | 'PERSONAL';
  }) {
    const { data } = await this.client.get('/api/v1/planning/events', { params });
    return data;
  }

  /**
   * Créer un événement de planning
   */
  async createPlanningEvent(event: {
    event_type: 'RIDE' | 'BREAK' | 'MAINTENANCE' | 'PERSONAL';
    start_time: string; // ISO format
    end_time: string;
    estimated_duration_minutes?: number;
    start_address?: string;
    end_address?: string;
    start_lat?: number;
    start_lng?: number;
    end_lat?: number;
    end_lng?: number;
    ride_id?: string;
    ride_source?: string;
    notes?: string;
    color?: string;
  }) {
    const { data } = await this.client.post('/api/v1/planning/events', event);
    return data;
  }

  /**
   * Mettre à jour un événement de planning
   */
  async updatePlanningEvent(eventId: string, updates: {
    start_time?: string;
    end_time?: string;
    estimated_duration_minutes?: number;
    start_address?: string;
    end_address?: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    color?: string;
  }) {
    const { data } = await this.client.put(`/api/v1/planning/events/${eventId}`, updates);
    return data;
  }

  /**
   * Supprimer un événement de planning
   */
  async deletePlanningEvent(eventId: string) {
    const { data } = await this.client.delete(`/api/v1/planning/events/${eventId}`);
    return data;
  }

  /**
   * Vérifier les conflits d'horaires
   */
  async checkPlanningConflicts(start_time: string, end_time: string) {
    const { data } = await this.client.get('/api/v1/planning/conflicts', {
      params: { start_time, end_time }
    });
    return data;
  }

  /**
   * Récupérer les préférences de notification
   */
  async getNotificationPreferences() {
    const { data } = await this.client.get('/api/v1/notifications/preferences');
    return data;
  }

  /**
   * Mettre à jour les préférences de notification
   */
  async updateNotificationPreferences(preferences: {
    reminder_30min?: boolean;
    reminder_1h?: boolean;
    reminder_custom_minutes?: number;
    reminder_custom_enabled?: boolean;
    notify_ride_start?: boolean;
    notify_ride_completion?: boolean;
    notify_conflicts?: boolean;
    notify_marketplace_opportunities?: boolean;
    quiet_hours_enabled?: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
  }) {
    const { data } = await this.client.put('/api/v1/notifications/preferences', preferences);
    return data;
  }
}

const API_BASE_URL = 'https://corail-backend-6e5o.onrender.com';

// Pour dev local, utiliser :
// const API_BASE_URL = 'http://localhost:8000';

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

