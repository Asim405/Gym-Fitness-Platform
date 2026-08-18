import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import ClassManagement from '../../components/ClassManagement';

export default function AdminClasses() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardShell title="Class management" subtitle="Create, assign, edit, and cancel gym classes."><ClassManagement role="admin" /></DashboardShell>
    </ProtectedRoute>
  );
}
