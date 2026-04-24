declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const SENTRY_DSN: string;
}

// Résolution TypeScript pour @expo/vector-icons (fourni par Expo)
declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  export const Ionicons: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const MaterialIcons: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const MaterialCommunityIcons: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const FontAwesome: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const FontAwesome5: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const Feather: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const AntDesign: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const Entypo: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const EvilIcons: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const Foundation: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const Octicons: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const SimpleLineIcons: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const Zocial: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const Fontisto: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
  export const FontAwesome6: ComponentType<{ name: string; size?: number; color?: string; [key: string]: unknown }>;
}
