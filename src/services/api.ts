/**
 * Corail API Client - MIGRATED TO SUPABASE ✅
 * Wrapper pour compatibilité avec le code existant
 */

import supabaseApi, { type CredentialChangeRequestType } from './supabaseApi';
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

  async listMarketplaceRides(options?: { filterType?: 'all' | 'public' | 'groups'; limit?: number }) {
    const rides = await supabaseApi.getRides();
    const limit = options?.limit ?? 50;
    const list = Array.isArray(rides) ? rides.slice(0, limit) : [];
    return { data: list };
  }

  async listMyRides() {
    const rides = await supabaseApi.getMyRides('claimed');
    return { data: Array.isArray(rides) ? rides : [] };
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

  async completeRide(rideId: string, rating?: { stars: number; comment?: string | null }) {
    return supabaseApi.completeRide(rideId, rating);
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
    client_name: string;
    client_phone?: string;
    client_email?: string;
  }) {
    return supabaseApi.publishPersonalRide(personalRideId, options);
  }

  async getPersonalRidesStats() {
    return supabaseApi.getPersonalRidesStats();
  }

  async deletePersonalRide(personalRideId: string) {
    return supabaseApi.deletePersonalRide(personalRideId);
  }

  async updatePersonalRide(personalRideId: string, updates: any) {
    return supabaseApi.updatePersonalRide(personalRideId, updates);
  }

  async completePersonalRide(personalRideId: string) {
    return supabaseApi.completePersonalRide(personalRideId);
  }

  // CREDITS
  async getCredits() {
    return supabaseApi.getCredits();
  }

  async setCreditsOnboardingSeen() {
    return supabaseApi.setCreditsOnboardingSeen();
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
    return supabaseApi.getGroup(groupId);
  }

  // PLANNING
  async getPlanningEvents(params?: any) {
    return supabaseApi.getPlanningEvents(params || {
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  async createPlanningEvent(event: {
    title: string;
    event_type: 'RIDE' | 'MEETING' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER';
    start_time: string;
    end_time: string;
    location?: string;
    notes?: string;
    ride_id?: string;
  }) {
    return supabaseApi.createPlanningEvent(event);
  }

  async checkPlanningConflicts(start_time: string, end_time: string) {
    return { conflicts: [] };
  }

  // ACTIVITY
  async getRecentActivity(limit: number = 20, offset: number = 0) {
    return supabaseApi.getRecentActivity(limit, offset);
  }

  // BADGES
  async getAllBadges() {
    return supabaseApi.getAllBadges();
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

  async previewGroupInvite(groupId: string, params: { email?: string; phone?: string }) {
    return supabaseApi.previewGroupInvite(groupId, params);
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

  async sendQuoteEmail(emailData: {
    clientEmail: string;
    clientName: string;
    quoteUrl: string;
    price: string;
    date: string;
    time: string;
    pickupAddress: string;
    dropoffAddress: string;
    driverName?: string;
  }) {
    return supabaseApi.sendQuoteEmail(emailData);
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

  async listInvoices(filters?: any) {
    return supabaseApi.listInvoices(filters);
  }

  async getInvoiceByRide(sourceType: 'RIDE' | 'PERSONAL', sourceId: string) {
    return supabaseApi.getInvoiceByRide(sourceType, sourceId);
  }

  async createInvoice(sourceType: 'RIDE' | 'PERSONAL', sourceId: string) {
    return supabaseApi.createInvoice(sourceType, sourceId);
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

  // Driver verification (Profil vérifié – documents)
  async getDriverVerification() {
    return supabaseApi.getDriverVerification();
  }

  async setVerificationIdDocumentType(docType: 'cni' | 'passport') {
    return supabaseApi.setVerificationIdDocumentType(docType);
  }

  async uploadDriverVerificationDocument(
    docType: 'vtc_card' | 'vtc_card_verso' | 'id_card' | 'id_card_verso' | 'insurance',
    file: { uri: string; type?: string; name?: string; base64?: string }
  ) {
    return supabaseApi.uploadDriverVerificationDocument(docType, file);
  }

  async uploadLegalKbisDocument(file: { uri: string; type?: string; name?: string; base64?: string }) {
    return supabaseApi.uploadLegalKbisDocument(file);
  }

  async submitDriverVerification() {
    return supabaseApi.submitDriverVerification();
  }

  async updateUserPhoto(photoUrl: string) {
    return supabaseApi.updateUserPhoto(photoUrl);
  }

  async updateUserProfile(updates: { phone?: string; professional_card_number?: string }) {
    return supabaseApi.updateUserProfile(updates);
  }

  async getMyCredentialChangeRequests() {
    return supabaseApi.getMyCredentialChangeRequests();
  }

  async createCredentialChangeRequest(params: {
    requestType: CredentialChangeRequestType;
    requestedValue: string;
    document?: { uri: string; type?: string; name?: string; base64?: string } | null;
    documentVerso?: { uri: string; type?: string; name?: string; base64?: string } | null;
  }) {
    return supabaseApi.createCredentialChangeRequest(params);
  }

  async convertPublishedToPersonal(rideId: string) {
    return supabaseApi.convertPublishedToPersonal(rideId);
  }

  async getDriverRideRequestsPendingCount(): Promise<number> {
    return supabaseApi.getDriverRideRequestsPendingCount();
  }

  async getDriverRideRequests() {
    return supabaseApi.getDriverRideRequests();
  }

  async getDriverRideRequestById(id: string) {
    return supabaseApi.getDriverRideRequestById(id);
  }

  async acceptDriverRideRequest(requestId: string) {
    return supabaseApi.acceptDriverRideRequest(requestId);
  }

  async refuseDriverRideRequest(requestId: string) {
    return supabaseApi.refuseDriverRideRequest(requestId);
  }

  // Admin: driver verification review
  async listPendingDriverVerifications() {
    return supabaseApi.listPendingDriverVerifications();
  }

  async getDriverVerificationDocumentSignedUrl(path: string, expiresIn?: number) {
    return supabaseApi.getDriverVerificationDocumentSignedUrl(path, expiresIn);
  }

  async getDriverVerificationDocumentSignedUrlAdmin(path: string) {
    return supabaseApi.getDriverVerificationDocumentSignedUrlAdmin(path);
  }

  async reviewDriverVerificationDocument(
    vtcProfileId: string,
    docType: 'vtc_card' | 'vtc_card_verso' | 'id_card' | 'id_card_verso' | 'insurance',
    status: 'approved' | 'rejected',
    adminNotes?: string | null
  ) {
    return supabaseApi.reviewDriverVerificationDocument(vtcProfileId, docType, status, adminNotes);
  }

  async rejectDriverVerification(vtcProfileId: string, reason: string) {
    return supabaseApi.rejectDriverVerification(vtcProfileId, reason);
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

  // IN-APP NOTIFICATIONS (centre de notifications)
  async listInAppNotifications(limit?: number, offset?: number) {
    return supabaseApi.listInAppNotifications(limit ?? 50, offset ?? 0);
  }

  async getUnreadNotificationsCount(): Promise<number> {
    return supabaseApi.getUnreadNotificationsCount();
  }

  async markNotificationRead(id: string) {
    return supabaseApi.markNotificationRead(id);
  }

  async markAllNotificationsRead() {
    return supabaseApi.markAllNotificationsRead();
  }

  async insertInAppNotification(payload: {
    type: string;
    title: string;
    body?: string | null;
    target_ride_id?: string | null;
    target_screen?: string | null;
    target_personal_ride_id?: string | null;
  }) {
    return supabaseApi.insertInAppNotification(payload);
  }
}

// Utiliser l'URL Supabase (non utilisée maintenant mais garde la compatibilité)
const API_BASE_URL = 'https://qeheawdjlwlkhnwbhqcg.supabase.co';

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
