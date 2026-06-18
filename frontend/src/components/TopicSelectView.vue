<template>
  <f7-page name="select" @page:beforein="state.screen = 'select'">
    <!-- Navbar -->
    <f7-navbar>
      <f7-nav-left>
        <f7-link back href="/">
          <span class="material-icons" style="font-size: 20px; vertical-align: middle;">arrow_back</span>
          <span style="margin-left: 6px; font-weight: 600; vertical-align: middle;">Kembali</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-title>
        <div class="logo-wrapper">
          <span class="logo-title gradient-text">AksaraCAT</span>
          <div class="status-indicator" :class="{ offline: state.isOffline }">
            <span class="pulse-dot"></span>
            <span class="status-text">{{ state.isOffline ? 'Offline Mode' : 'Online' }}</span>
          </div>
        </div>
      </f7-nav-title>
    </f7-navbar>

    <div class="page-container">
      <div class="block-title font-bold" style="margin-left:0; margin-bottom: 8px; font-size: 24px; font-weight: 800; color: #fff;">
        Topik Latihan {{ state.selectedCategory }}
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px; line-height: 1.5;">
        Pilih paket/topik di bawah ini. Paket <strong>Latihan</strong> memberikan feedback ralat instan setelah menjawab, sedangkan paket <strong>Tryout</strong> menggunakan simulasi blind-mode berwaktu.
      </p>

      <!-- Segmented Filter -->
      <div style="margin-bottom: 24px;">
        <f7-segmented strong round>
          <f7-button :active="state.selectedFilter === 'all'" @click="state.selectedFilter = 'all'">Semua Jenis</f7-button>
          <f7-button :active="state.selectedFilter === 'latihan'" @click="state.selectedFilter = 'latihan'">Latihan Mandiri</f7-button>
          <f7-button :active="state.selectedFilter === 'tryout'" @click="state.selectedFilter = 'tryout'">Tryout Simulasi</f7-button>
        </f7-segmented>
      </div>

      <!-- Category Global Practice Option -->
      <div class="simulation-banner premium-banner glass-card" style="margin-bottom: 24px; padding: 20px;">
        <div class="banner-content">
          <h3 class="banner-title" style="font-size: 18px;">Latihan Acak Global {{ state.selectedCategory }}</h3>
          <p class="banner-desc" style="font-size: 13px; margin-bottom: 12px;">
            Kerjakan 30 soal acak dari seluruh bank soal kategori {{ state.selectedCategory }} untuk ralat pemahaman instan.
          </p>
          <f7-button fill class="gradient-bg-btn" style="width: auto; display: inline-flex;" @click="startCategoryPractice(state.selectedCategory)">
            <span class="material-icons" style="font-size: 18px; margin-right: 6px;">shuffle</span>
            Mulai Acak Global
          </f7-button>
        </div>
        <div class="banner-visual-wrapper">
          <span class="material-icons banner-glowing-icon">track_changes</span>
        </div>
      </div>

      <!-- Packets Grid -->
      <div class="packet-list-grid">
        <div 
          v-for="pkt in filteredPackets" 
          :key="pkt.id" 
          class="packet-card glass-card" 
          @click="startPacketPractice(pkt)"
        >
          <h4 class="packet-title">{{ pkt.judul }}</h4>
          <div class="packet-details">
            <span class="packet-pill" :style="{ color: pkt.jenis === 'tryout' ? 'var(--warning-color)' : 'var(--success-color)' }">
              {{ pkt.jenis.toUpperCase() }}
            </span>
            <span class="packet-pill">{{ pkt.bank_soals_count || pkt.bank_soals?.length || 0 }} Soal</span>
            <span v-if="pkt.waktu_menit" class="packet-pill">⏱️ {{ pkt.waktu_menit }} Menit</span>
          </div>
          <f7-button outline round style="margin-top:auto;" class="card-action-btn twk-btn">
            Mulai Kerjakan
          </f7-button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPackets.length === 0" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        Tidak ada paket yang sesuai dengan filter ini.
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { state, filteredPackets, startCategoryPractice, startPacketPractice } from '../store';
</script>

<style scoped>
</style>
