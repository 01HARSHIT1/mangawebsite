import type { Metadata } from 'next';
import MonitoringDashboard from '@/components/MonitoringDashboard';

export const metadata: Metadata = {
  title: 'System Monitoring',
  description: 'Real-time system health and performance monitoring dashboard',
};

export default function MonitoringPage() {
  return <MonitoringDashboard />;
} 