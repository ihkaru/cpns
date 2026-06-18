<template>
  <f7-sheet
    class="leaderboard-sheet glass-sheet"
    style="height: 80%; --f7-sheet-bg-color: #0c101d; border-radius: 24px 24px 0 0;"
    swipe-to-close
    backdrop
    :opened="opened"
    @sheet:closed="$emit('update:opened', false)"
  >
    <div class="sheet-header-custom">
      <div class="swipe-handler"></div>
      <div class="sheet-title-row">
        <h3 class="sheet-title-text">
          <span class="material-icons" style="color: var(--warning-color); margin-right: 8px;">emoji_events</span>
          Papan Peringkat Nasional (Top 10)
        </h3>
        <f7-link sheet-close class="close-sheet-btn">
          <span class="material-icons">close</span>
        </f7-link>
      </div>
      <p class="sheet-subtitle-text">Diurutkan berdasarkan standar perangkingan CAT BKN asli (Skor → TKP → TIU → TWK → Durasi)</p>
    </div>

    <div class="sheet-body-content scrollable-area">
      <!-- Empty State -->
      <div v-if="state.leaderboard.length === 0" class="empty-leaderboard">
        <span class="material-icons empty-icon">leaderboard</span>
        <p class="empty-text">Belum ada simulasi yang tercatat di papan peringkat.</p>
        <p class="empty-subtext">Selesaikan Simulasi CAT SKD untuk memulai persaingan!</p>
      </div>

      <!-- Leaderboard List -->
      <div v-else class="leaderboard-list">
        <div 
          v-for="user in state.leaderboard" 
          :key="user.userId"
          class="leaderboard-item"
          :class="{ 'is-current-user': state.user && user.userId === state.currentUserRank?.userId }"
        >
          <!-- Rank Badge -->
          <div class="rank-badge-wrapper">
            <span v-if="user.rank === 1" class="rank-badge rank-1">👑</span>
            <span v-else-if="user.rank === 2" class="rank-badge rank-2">🥈</span>
            <span v-else-if="user.rank === 3" class="rank-badge rank-3">🥉</span>
            <span v-else class="rank-number">#{{ user.rank }}</span>
          </div>

          <!-- Avatar -->
          <div class="user-avatar-wrapper">
            <img 
              :src="user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c'" 
              class="user-avatar"
              @error="(e: any) => (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/a/default-user=s96-c'"
            />
          </div>

          <!-- Info -->
          <div class="user-info-section">
            <span class="user-name-text">{{ user.name }}</span>
            <div class="user-breakdown-row">
              <span class="br-pill twk">TWK: {{ user.breakdown?.TWK ?? 0 }}</span>
              <span class="br-pill tiu">TIU: {{ user.breakdown?.TIU ?? 0 }}</span>
              <span class="br-pill tkp">TKP: {{ user.breakdown?.TKP ?? 0 }}</span>
            </div>
          </div>

          <!-- Score & Duration -->
          <div class="score-duration-section">
            <span class="score-value">{{ user.score }}<span class="score-max">/{{ user.maxScore }}</span></span>
            <span class="duration-value">
              <span class="material-icons dur-icon">timer</span>
              {{ formatDuration(user.durationSeconds) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Bottom Row for Current User Rank (if outside top 10) -->
    <div 
      v-if="state.user && state.currentUserRank && state.currentUserRank.rank > 10" 
      class="current-user-sticky-bar"
    >
      <div class="sticky-left">
        <span class="your-rank-label">Peringkat Anda:</span>
        <span class="your-rank-value">#{{ state.currentUserRank.rank }}</span>
      </div>
      <div class="sticky-center">
        <span class="your-score-value">{{ state.currentUserRank.score }}<span class="your-score-max">/{{ state.currentUserRank.maxScore }}</span></span>
        <div class="your-breakdown">
          TWK: {{ state.currentUserRank.breakdown?.TWK ?? 0 }} | 
          TIU: {{ state.currentUserRank.breakdown?.TIU ?? 0 }} | 
          TKP: {{ state.currentUserRank.breakdown?.TKP ?? 0 }}
        </div>
      </div>
      <div class="sticky-right">
        <span class="material-icons dur-icon">timer</span>
        {{ formatDuration(state.currentUserRank.durationSeconds) }}
      </div>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { state } from '../store';

defineProps<{
  opened: boolean;
}>();

defineEmits<{
  (e: 'update:opened', val: boolean): void;
}>();

const formatDuration = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
/* Sheet local layout adjustments */
.swipe-handler {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 10px auto 14px auto;
}
.sheet-header-custom {
  padding: 0 20px 16px 20px;
  border-bottom: 1px solid var(--surface-border, rgba(255, 255, 255, 0.08));
}
.sheet-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.sheet-title-text {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
}
.close-sheet-btn {
  color: var(--text-secondary, #a0a0a9) !important;
}
.sheet-subtitle-text {
  font-size: 12px;
  color: var(--text-secondary, #a0a0a9);
  margin: 0;
}
.sheet-body-content {
  height: calc(100% - 150px);
  padding: 16px 20px;
  box-sizing: border-box;
}
.scrollable-area {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.empty-leaderboard {
  text-align: center;
  padding: 48px 20px;
}
.empty-icon {
  font-size: 64px;
  color: rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}
.empty-text {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px 0;
}
.empty-subtext {
  font-size: 13px;
  color: var(--text-secondary, #a0a0a9);
  margin: 0;
}
</style>
