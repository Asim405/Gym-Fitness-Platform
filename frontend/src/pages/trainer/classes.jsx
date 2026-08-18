import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import ClassManagement from '../../components/ClassManagement';

export default function TrainerClasses() {
  return (
    <ProtectedRoute allowedRoles={['trainer']}>
      <DashboardShell title="My classes" subtitle="Create and manage only sessions assigned to you."><ClassManagement role="trainer" /></DashboardShell>
    </ProtectedRoute>
  );
}
