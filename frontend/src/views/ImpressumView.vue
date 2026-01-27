<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  router.back();
}
</script>

<template>
  <div class="min-h-screen min-h-dvh bg-bg-primary">
    <header class="flex items-center gap-4 px-6 py-4 bg-bg-card border-b border-border sticky top-0 z-10">
      <button 
        class="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border text-text-primary cursor-pointer transition-all duration-200 hover:bg-bg-hover"
        @click="goBack"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="font-display text-xl font-semibold text-text-primary">Impressum</h1>
    </header>
    
    <main class="p-6 max-w-[800px] mx-auto">
      <div class="bg-bg-card rounded-2xl p-8 shadow-sm">
        <section class="mb-8 last:mb-0">
          <h2 class="font-display text-xl font-semibold text-text-primary mb-3 pb-2 border-b-2 border-primary">Angaben gemäß § 5 TMG</h2>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            <strong>[Ihr Name / Firmenname]</strong><br>
            [Straße und Hausnummer]<br>
            [PLZ] [Ort]<br>
            Deutschland
          </p>
        </section>
        
        <section class="mb-8 last:mb-0">
          <h2 class="font-display text-xl font-semibold text-text-primary mb-3 pb-2 border-b-2 border-primary">Kontakt</h2>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            Telefon: [Ihre Telefonnummer]<br>
            E-Mail: [Ihre E-Mail-Adresse]
          </p>
        </section>
        
        <section class="mb-8 last:mb-0">
          <h2 class="font-display text-xl font-semibold text-text-primary mb-3 pb-2 border-b-2 border-primary">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            [Name des Verantwortlichen]<br>
            [Adresse]
          </p>
        </section>
        
        <section class="mb-8 last:mb-0">
          <h2 class="font-display text-xl font-semibold text-text-primary mb-3 pb-2 border-b-2 border-primary">Haftungsausschluss</h2>
          
          <h3 class="text-base font-semibold text-text-secondary mt-4 mb-2">Haftung für Inhalte</h3>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. 
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
          
          <h3 class="text-base font-semibold text-text-secondary mt-4 mb-2">Haftung für Links</h3>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. 
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
          </p>
        </section>
        
        <section class="mb-8 last:mb-0">
          <h2 class="font-display text-xl font-semibold text-text-primary mb-3 pb-2 border-b-2 border-primary">Datenschutz</h2>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich. 
            Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) 
            erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis.
          </p>
          <p class="text-text-primary leading-relaxed mb-3 last:mb-0">
            Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) 
            Sicherheitslücken aufweisen kann.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

