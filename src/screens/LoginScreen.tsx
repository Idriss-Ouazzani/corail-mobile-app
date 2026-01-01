/**
 * Écran de connexion / inscription
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { firebaseAuth } from '../services/firebase';
import { apiClient } from '../services/api';
import CoralLogo from '../components/CoralLogo';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Détecter si le clavier est ouvert
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (isSignUp && !fullName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // 1. Créer le compte Firebase
        console.log('📝 Création compte Firebase...');
        const user = await firebaseAuth.signUp(email.trim(), password);
        
        // 2. Formater le nom (capitaliser première lettre de chaque mot)
        const formattedName = fullName.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        // 3. Créer l'utilisateur dans Databricks avec status UNVERIFIED
        console.log('💾 Création utilisateur Databricks...');
        try {
          await apiClient.createUser({
            id: user.uid,
            email: email.trim(),
            full_name: formattedName,
            verification_status: 'UNVERIFIED',
          });
          console.log('✅ Utilisateur créé dans Databricks avec nom formaté:', formattedName);
        } catch (dbError: any) {
          console.error('❌ Erreur création utilisateur Databricks:', dbError);
          // Continue quand même, l'utilisateur sera créé au premier login
        }

        Alert.alert(
          'Compte créé ! 🎉',
          'Complétez maintenant votre profil professionnel pour accéder à la plateforme.',
          [{ text: 'Continuer', onPress: onLoginSuccess }]
        );
      } else {
        await firebaseAuth.signIn(email.trim(), password);
        onLoginSuccess();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await firebaseAuth.signInWithGoogle();
      onLoginSuccess();
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#2d3748']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo et titre - Réduit quand le clavier est visible */}
          {!keyboardVisible && (
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <CoralLogo size={90} />
              </View>
              <Text style={styles.title}>Corail</Text>
              <View style={styles.taglineContainer}>
                <Text style={styles.tagline}>
                  Plus qu'une appli. Une indépendance.
                </Text>
              </View>
              <View style={styles.freeTagContainer}>
                <Text style={styles.freeTag}>100% gratuit</Text>
              </View>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Rejoignez la communauté VTC' : 'Connectez-vous à votre espace'}
              </Text>
            </View>
          )}
          
          {/* Header compact quand le clavier est ouvert */}
          {keyboardVisible && (
            <View style={styles.headerCompact}>
              <CoralLogo size={36} />
              <View style={styles.titleCompactWrapper}>
                <Text style={styles.titleCompact}>Corail</Text>
                <Text style={styles.taglineCompact}>Assistant VTC 100% gratuit</Text>
              </View>
            </View>
          )}

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Nom complet (inscription seulement) */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  placeholderTextColor="#64748b"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Mot de passe */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmer mot de passe (inscription seulement) */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#64748b"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            {/* Bouton de connexion */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#ff6b47', '#ff8a6d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Séparateur "OU" */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Bouton Google */}
            <TouchableOpacity
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.googleButtonContent}>
                <Ionicons name="logo-google" size={22} color="#ea4335" />
                <Text style={styles.googleButtonText}>
                  Continuer avec Google
                </Text>
              </View>
            </TouchableOpacity>

            {/* Toggle connexion/inscription */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Vous avez déjà un compte ?' : "Pas encore de compte ?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setFullName('');
                  setConfirmPassword('');
                }}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Se connecter' : "S'inscrire"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          {!keyboardVisible && (
            <View style={styles.footer}>
              <View style={styles.footerDivider} />
              <Text style={styles.footerText}>
                En continuant, vous acceptez nos conditions d'utilisation
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 4,
  },
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ff6b47',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 1,
  },
  titleCompactWrapper: {
    marginLeft: 12,
  },
  titleCompact: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    lineHeight: 22,
  },
  taglineCompact: {
    fontSize: 11,
    color: '#ff6b47',
    fontWeight: '600',
    marginTop: 2,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff6b47',
    marginRight: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
  freeTagContainer: {
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(241, 245, 249, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  freeTag: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '400',
  },
  form: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#f1f5f9',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    elevation: 8,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  toggleText: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 6,
  },
  toggleLink: {
    fontSize: 14,
    color: '#ff6b47',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255, 107, 71, 0.4)',
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
    paddingTop: 24,
  },
  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 107, 71, 0.3)',
    borderRadius: 1,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 40,
  },
});

