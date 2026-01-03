<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const localError = ref('');

async function handleSubmit() {
  localError.value = '';
  
  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwörter stimmen nicht überein.';
    return;
  }
  
  if (password.value.length < 6) {
    localError.value = 'Passwort muss mindestens 6 Zeichen lang sein.';
    return;
  }
  
  const success = await authStore.signup(email.value, username.value, password.value);
  if (success) {
    router.push('/map');
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <svg viewBox="0 0 100 100" class="auth-logo-icon">
            <path d="M50 10 C30 10 15 35 15 55 C15 75 30 90 50 90 C70 90 85 75 85 55 C85 35 70 10 50 10 Z" fill="currentColor" opacity="0.2"/>
            <path d="M30 50 Q50 30 70 50 Q50 70 30 50" fill="none" stroke="currentColor" stroke-width="3"/>
            <line x1="50" y1="35" x2="50" y2="65" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <h1>Paddelsport Launchspot</h1>
        <p class="auth-subtitle">Konto erstellen</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">E-Mail</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            required 
            placeholder="deine@email.de"
            autocomplete="email"
          />
        </div>
        
        <div class="form-group">
          <label for="username">Benutzername</label>
          <input 
            id="username"
            v-model="username" 
            type="text" 
            required 
            placeholder="dein_benutzername"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Passwort</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            required 
            placeholder="Mind. 6 Zeichen"
            autocomplete="new-password"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Passwort bestätigen</label>
          <input 
            id="confirmPassword"
            v-model="confirmPassword" 
            type="password" 
            required 
            placeholder="Passwort wiederholen"
            autocomplete="new-password"
          />
        </div>
        
        <div v-if="localError || authStore.error" class="auth-error-message">
          {{ localError || authStore.error }}
        </div>
        
        <button type="submit" class="auth-btn-primary" :disabled="authStore.loading">
          <span v-if="authStore.loading">Laden...</span>
          <span v-else>Registrieren</span>
        </button>
      </form>
      
      <div class="auth-footer">
        <p>Bereits ein Konto? <router-link to="/login">Jetzt anmelden</router-link></p>
      </div>
    </div>
    
    <div class="water-bg"></div>
  </div>
</template>

<style src="../assets/auth.css"></style>
