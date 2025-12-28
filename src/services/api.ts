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
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Ajoute automatiquement le token Firebase
    this.client.interceptors.request.use(
      async (config) => {
        // Récupérer le token Firebase automatiquement
        const token = await firebaseAuth.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // User ID pour tracking (optionnel)
        if (this.userId) {
          config.headers['X-User-Id'] = this.userId;
        }

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
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

  async createRide(rideData: {
    pickup_address: string;
    dropoff_address: string;
    scheduled_at: string;
    price_cents: number;
    visibility?: 'PUBLIC' | 'GROUP';
    group_id?: string;
    commission_enabled?: boolean;
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
}

// Export singleton instance
// Backend URL - Databricks Apps
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1'  // Local development
  : 'https://corail-app-1444828305810485.aws.databricksapps.com/api/v1';   // Production (Databricks Apps)

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

