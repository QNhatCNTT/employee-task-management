import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useToast } from '../contexts/toast-context';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../types/employee-types';
import * as employeeService from '../services/employee-service';
import { EmployeeList } from '../components/employee/employee-list';
import { EmployeeForm } from '../components/employee/employee-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  LogOut, 
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';

export const ManagerDashboardPage = () => {
  const { user, logout } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      showError('Failed to load employees. Please try again.');
      console.error('Fetch employees error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // CRUD handlers
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CreateEmployeeInput | UpdateEmployeeInput) => {
    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, data as UpdateEmployeeInput);
        success('Employee updated successfully!');
      } else {
        await employeeService.createEmployee(data as CreateEmployeeInput);
        success('Employee added successfully! Invitation email sent.');
      }
      setIsFormOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      console.error('Form submit error:', err);
      showError(editingEmployee ? 'Failed to update employee' : 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (employee: Employee) => {
    setDeleteTarget(employee);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(deleteTarget.id);
      success(`${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChat = (employee: Employee) => {
    navigate(`/dashboard/chat?employeeId=${employee.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Stats calculations
  const activeCount = employees.filter(e => e.setupCompleted).length;
  const pendingCount = employees.filter(e => !e.setupCompleted).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back, {user?.phoneNumber || 'Manager'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard/chat')}>
                <MessageSquare size={18} className="mr-2" />
                Chat
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Employees
              </CardTitle>
              <Users size={20} className="text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{employees.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Active
              </CardTitle>
              <CheckCircle size={20} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending Setup
              </CardTitle>
              <Clock size={20} className="text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Employees</h2>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={isLoading}>
                <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleAddEmployee}>
                <UserPlus size={18} className="mr-2" />
                Add Employee
              </Button>
            </div>
          </div>

          <EmployeeList
            employees={employees}
            isLoading={isLoading}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteClick}
            onChat={handleChat}
          />
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle onClose={() => setIsFormOpen(false)}>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editingEmployee || undefined}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 mb-6">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
