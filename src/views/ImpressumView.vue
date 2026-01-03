<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  router.back();
}
</script>

<template>
  <div class="impressum-view">
    <header class="impressum-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Impressum</h1>
    </header>
    
    <main class="impressum-content">
      <div class="impressum-card">
        <section>
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            <strong>[Ihr Name / Firmenname]</strong><br>
            [Straße und Hausnummer]<br>
            [PLZ] [Ort]<br>
            Deutschland
          </p>
        </section>
        
        <section>
          <h2>Kontakt</h2>
          <p>
            Telefon: [Ihre Telefonnummer]<br>
            E-Mail: [Ihre E-Mail-Adresse]
          </p>
        </section>
        
        <section>
          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            [Name des Verantwortlichen]<br>
            [Adresse]
          </p>
        </section>
        
        <section>
          <h2>Haftungsausschluss</h2>
          
          <h3>Haftung für Inhalte</h3>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. 
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
          
          <h3>Haftung für Links</h3>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. 
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
          </p>
        </section>
        
        <section>
          <h2>Datenschutz</h2>
          <p>
            Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich. 
            Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) 
            erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis.
          </p>
          <p>
            Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) 
            Sicherheitslücken aufweisen kann.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.impressum-view {
  min-height: 100vh;
  background: var(--bg-primary);
}

.impressum-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.back-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.impressum-header h1 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.impressum-content {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.impressum-card {
  background: var(--bg-card);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

section {
  margin-bottom: 2rem;
}

section:last-child {
  margin-bottom: 0;
}

h2 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
}

h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

p {
  color: var(--text-primary);
  line-height: 1.7;
  margin-bottom: 0.75rem;
}

p:last-child {
  margin-bottom: 0;
}
</style>

