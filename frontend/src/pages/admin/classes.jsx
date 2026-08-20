import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import ClassManagement from '../../components/ClassManagement';

export default function AdminClasses() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardShell
        title="Class management"
        subtitle="Create, assign, edit, and cancel gym classes."
      >
        <div className="mt-6">
          <ClassManagement role="admin" />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}