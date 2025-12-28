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
    const response = await this.client.get('/rides/marketplace', {
      params: { skip, limit, filter: filterType },
    });
    return response.data;
  }

  async getRide(rideId: string): Promise<Ride> {
    const response = await this.client.get(`/rides/${rideId}`);
    return response.data;
  }

  async listMyRides(): Promise<RideListResponse> {
    const response = await this.client.get('/rides/my-rides');
    return response.data;
  }

  // Rides
  async getRides(params?: {
    status?: string;
    visibility?: string;
    skip?: number;
    limit?: number;
  }): Promise<Ride[]> {
    const response = await this.client.get('/rides', { params });
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
    const response = await this.client.post('/rides', rideData);
    return response.data;
  }

  async claimRide(rideId: string): Promise<Ride> {
    const response = await this.client.post(`/rides/${rideId}/claim`);
    return response.data;
  }

  async completeRide(rideId: string): Promise<Ride> {
    const response = await this.client.post(`/rides/${rideId}/complete`);
    return response.data;
  }

  async cancelRide(rideId: string): Promise<Ride> {
    const response = await this.client.post(`/rides/${rideId}/cancel`);
    return response.data;
  }

  async deleteRide(rideId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/rides/${rideId}`);
    return response.data;
  }

  // Groups
  async listMyGroups(): Promise<{ data: Group[] }> {
    const response = await this.client.get('/groups/my-groups');
    return response.data;
  }

  async getGroup(groupId: string): Promise<Group> {
    const response = await this.client.get(`/groups/${groupId}`);
    return response.data;
  }

  // User
  async getUser(userId: string): Promise<User> {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    if (!this.userId) throw new Error('User ID not set');
    return this.getUser(this.userId);
  }

  // Credits Corail 🪸
  async getCredits(): Promise<{ credits: number }> {
    const response = await this.client.get('/credits');
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
    const { data } = await this.client.post('/users', userData);
    return data;
  }

  // ============================================================================
  // ✅ VERIFICATION PROFESSIONNELLE
  // ============================================================================

  /**
   * Récupérer le statut de vérification
   */
  async getVerificationStatus() {
    const { data } = await this.client.get('/verification/status');
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
    const { data } = await this.client.post('/verification/submit', verification);
    return data;
  }

  // ============================================================================
  // 🏆 BADGES
  // ============================================================================

  /**
   * Récupérer tous les badges disponibles
   */
  async getAllBadges() {
    const { data } = await this.client.get('/badges');
    return data;
  }

  /**
   * Récupérer les badges d'un utilisateur
   */
  async getUserBadges(userId: string) {
    const { data } = await this.client.get(`/users/${userId}/badges`);
    return data;
  }

  /**
   * Attribuer un badge à un utilisateur (manuel, pour tests)
   */
  async awardBadge(userId: string, badgeId: string) {
    const { data } = await this.client.post(`/users/${userId}/badges/${badgeId}`);
    return data;
  }
}

const API_BASE_URL = 'https://corail-backend-6e5o.onrender.com/api/v1';

// Pour dev local, utiliser :
// const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

