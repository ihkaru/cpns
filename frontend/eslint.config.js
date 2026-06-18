import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs(
  // Global ignores configuration
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'android/**',
      'dev.sh',
      '**/sw.js'
    ]
  },

  // Base Vue rules (essential rules for Vue 3)
  pluginVue.configs['flat/essential'],

  // Recommended TypeScript rules for Vue & normal TypeScript files
  vueTsConfigs.recommended,

  // Custom project rules override
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off', // off as AksaraCAT components use simple names (DashboardView, TopicSelectView, etc.)
      '@typescript-eslint/no-explicit-any': 'off', // off since we use any in some scrapers & dynamic structures
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
);
