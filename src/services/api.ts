/**
 * Corail API Client - MIGRATED TO SUPABASE ✅
 * Wrapper pour compatibilité avec le code existant
 */

import supabaseApi from './supabaseApi';
import type { Ride } from '../types';

class ApiClient {
  private userId: string | null = null;

  constructor(baseURL?: string) {
    console.log('✅ API Client migré vers Supabase');
  }

  setUserId(userId: string) {
    this.userId = userId;
    supabaseApi.setUserId(userId);
  }

  clearAuth() {
    this.userId = null;
    supabaseApi.clearAuth();
  }

  // RIDES
  async getRides() {
    return supabaseApi.getRides();
  }

  async getMyRides(type: 'claimed' | 'published' = 'claimed') {
    return supabaseApi.getMyRides(type);
  }

  async getRide(rideId: string) {
    return supabaseApi.getRide(rideId);
  }

  async createRide(rideData: any) {
    return supabaseApi.createRide(rideData);
  }

  async claimRide(rideId: string) {
    return supabaseApi.claimRide(rideId);
  }

  async completeRide(rideId: string) {
    return supabaseApi.completeRide(rideId);
  }

  async deleteRide(rideId: string) {
    await supabaseApi.deleteRide(rideId);
    return { success: true, message: 'Ride deleted' };
  }

  // PERSONAL RIDES
  async listPersonalRides(filters?: any) {
    return supabaseApi.listPersonalRides(filters);
  }

  async getPersonalRide(rideId: string) {
    return supabaseApi.getPersonalRide(rideId);
  }

  async createPersonalRide(rideData: any) {
    return supabaseApi.createPersonalRide(rideData);
  }

  async publishPersonalRide(personalRideId: string, options: {
    visibility: 'PUBLIC' | 'GROUP';
    vehicle_type: 'STANDARD' | 'ELECTRIC' | 'VAN' | 'PREMIUM' | 'LUXURY';
    group_id?: string;
  }) {
    return supabaseApi.publishPersonalRide(personalRideId, options);
  }

  async getPersonalRidesStats() {
    return supabaseApi.getPersonalRidesStats();
  }

  async deletePersonalRide(personalRideId: string) {
    return supabaseApi.deletePersonalRide(personalRideId);
  }

  // CREDITS
  async getCredits() {
    return supabaseApi.getCredits();
  }

  // BADGES
  async getUserBadges(userId: string) {
    return supabaseApi.getUserBadges(userId);
  }

  // VERIFICATION
  async getVerificationStatus() {
    return supabaseApi.getVerificationStatus();
  }

  async submitVerification(verification: any) {
    return supabaseApi.submitVerification(verification);
  }

  async createUser(userData: any) {
    return supabaseApi.createUser(userData);
  }

  // GROUPS
  async listMyGroups() {
    // Alias pour listGroups (pour compatibilité)
    const groups = await this.listGroups();
    return { data: groups };
  }

  async getGroup(groupId: string) {
    // TODO: Implémenter si besoin
    return null;
  }

  // PLANNING
  async getPlanningEvents(params?: any) {
    return supabaseApi.getPlanningEvents(params || {
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  async createPlanningEvent(event: any) {
    // TODO: Implement if needed
    return event;
  }

  async checkPlanningConflicts(start_time: string, end_time: string) {
    return { conflicts: [] };
  }

  // ACTIVITY
  async getRecentActivity(limit: number = 20) {
    return supabaseApi.getRecentActivity(limit);
  }

  // BADGES
  async getAllBadges() {
    return supabaseApi.getAllBadges();
  }

  async getUserBadges(userId: string) {
    return supabaseApi.getUserBadges(userId);
  }

  // GROUPS
  async listGroups() {
    return supabaseApi.listGroups();
  }

  async createGroup(groupData: any) {
    return supabaseApi.createGroup(groupData);
  }

  async getGroupMembers(groupId: string) {
    return supabaseApi.getGroupMembers(groupId);
  }

  async inviteToGroup(params: { groupId: string; email?: string; phone?: string }) {
    return supabaseApi.inviteToGroup(params);
  }

  async getMyGroupInvitations() {
    return supabaseApi.getMyGroupInvitations();
  }

  async respondToInvitation(invitationId: string, accept: boolean) {
    return supabaseApi.respondToInvitation(invitationId, accept);
  }

  async leaveGroup(groupId: string) {
    return supabaseApi.leaveGroup(groupId);
  }

  async removeMemberFromGroup(groupId: string, userId: string) {
    return supabaseApi.removeMemberFromGroup(groupId, userId);
  }

  async getGroupPendingInvitations(groupId: string) {
    return supabaseApi.getGroupPendingInvitations(groupId);
  }

  async cancelGroupInvitation(invitationId: string) {
    return supabaseApi.cancelGroupInvitation(invitationId);
  }

  // ADMIN
  async getPendingVerifications() {
    return supabaseApi.getPendingVerifications();
  }

  async reviewVerification(userId: string, review: any) {
    return supabaseApi.reviewVerification(userId, review);
  }

  // NOTIFICATIONS (stub)
  async getNotificationPreferences() {
    return {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
    };
  }

  async updateNotificationPreferences(preferences: any) {
    return preferences;
  }

  // QUOTES
  async createQuote(quoteData: any) {
    return supabaseApi.createQuote(quoteData);
  }

  async listQuotes(filters?: any) {
    return supabaseApi.listQuotes(filters);
  }

  async getQuote(quoteId: string) {
    return supabaseApi.getQuote(quoteId);
  }

  async getQuoteByToken(token: string) {
    return supabaseApi.getQuoteByToken(token);
  }

  // VTC PUBLIC PROFILE
  async getMyVTCProfile() {
    return supabaseApi.getMyVTCProfile();
  }

  async createVTCProfile(data: any) {
    return supabaseApi.createVTCProfile(data);
  }

  async updateVTCProfile(data: any) {
    return supabaseApi.updateVTCProfile(data);
  }

  async deleteVTCProfile() {
    return supabaseApi.deleteVTCProfile();
  }

  async updateUserPhoto(photoUrl: string) {
    return supabaseApi.updateUserPhoto(photoUrl);
  }

  async convertPublishedToPersonal(rideId: string) {
    return supabaseApi.convertPublishedToPersonal(rideId);
  }

  // RGPD
  async requestDataExport() {
    return supabaseApi.requestDataExport();
  }

  async deleteAccount() {
    return supabaseApi.deleteAccount();
  }

  async acceptTerms() {
    return supabaseApi.acceptTerms();
  }
}

// Utiliser l'URL Supabase (non utilisée maintenant mais garde la compatibilité)
const API_BASE_URL = 'https://qeheawdjlwlkhnwbhqcg.supabase.co';

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
