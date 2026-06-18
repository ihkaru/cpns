import type { Router } from 'framework7/types';
import LoginView from './components/LoginView.vue';
import DashboardView from './components/DashboardView.vue';
import TopicSelectView from './components/TopicSelectView.vue';
import PracticeView from './components/PracticeView.vue';
import SimulationView from './components/SimulationView.vue';
import ReviewView from './components/ReviewView.vue';

export const routes: Router.RouteParameters[] = [
  {
    path: '/',
    component: DashboardView,
  },
  {
    path: '/login/',
    component: LoginView,
  },
  {
    path: '/select/',
    component: TopicSelectView,
  },
  {
    path: '/latihan/',
    component: PracticeView,
  },
  {
    path: '/simulasi/',
    component: SimulationView,
  },
  {
    path: '/review/',
    component: ReviewView,
  }
];
