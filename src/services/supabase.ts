// src/services/supabase.ts
import 'react-native-url-polyfill/auto'; // Cần thiết cho Supabase trên React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcojffehtxhxnqkiggzo.supabase.co'; // Thay bằng Project URL của bạn
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2pmZmVodHhoeG5xa2lnZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODAxNjEsImV4cCI6MjA2MDA1NjE2MX0.sEC_zq4IeYyAQn_AC8IG7Qd189ePi7O3oNHYrogDa2k'; // Thay bằng anon public key của bạn

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});