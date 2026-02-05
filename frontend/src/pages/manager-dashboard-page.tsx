import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/toast-context';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../types/employee-types';
import * as employeeService from '../services/employee-service';
import { EmployeeForm } from '../components/employee/employee-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  Building2
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export const ManagerDashboardPage = () => {
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employeePage, setEmployeePage] = useState(1);

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      showError('Failed to load employees. Please try again.');
      console.error('Fetch employees error:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.setupCompleted).length;
    const pending = employees.filter(e => !e.setupCompleted).length;
    const departments = new Set(employees.map(e => e.department)).size;
    return { total, active, pending, departments };
  }, [employees]);

  // Filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase());
      const matchesDept =
        departmentFilter === 'all' || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, employeeSearch, departmentFilter]);

  const totalEmployeePages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (employeePage - 1) * ITEMS_PER_PAGE,
    employeePage * ITEMS_PER_PAGE
  );

  const departments = useMemo(() =>
    Array.from(new Set(employees.map(e => e.department))).filter(Boolean),
    [employees]
  );

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

  const handleChat = (employeeId: string) => {
    navigate(`/dashboard/chat?employeeId=${employeeId}`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employee Management</h1>
          <p className="text-slate-500 mt-1">
            Manage your team members and their information
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={employeesLoading}>
            <RefreshCw size={16} className={`mr-2 ${employeesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddEmployee}>
            <UserPlus size={16} className="mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 font-medium">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <UserCheck size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
                <p className="text-xs text-slate-500 font-medium">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <UserX size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
                <p className="text-xs text-slate-500 font-medium">Pending Setup</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-50">
                <Building2 size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.departments}</p>
                <p className="text-xs text-slate-500 font-medium">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Team Members</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-9 w-48 text-sm"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setEmployeePage(1);
                  }}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  className="h-9 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setEmployeePage(1);
                  }}
                >
                  <option value="all">All Depts</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-medium">Employee</TableHead>
                <TableHead className="font-medium">Contact</TableHead>
                <TableHead className="font-medium">Department</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{employee.name}</p>
                          <p className="text-xs text-slate-500">{employee.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-slate-700">{employee.email}</p>
                        {employee.phone && (
                          <p className="text-slate-500 text-xs">{employee.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal bg-slate-50">
                        {employee.department}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.setupCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                          <CheckCircle size={12} className="mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                          <Clock size={12} className="mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleChat(employee.id)}
                          title="Chat"
                        >
                          <MessageSquare size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => handleEditEmployee(employee)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(employee)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalEmployeePages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setEmployeePage(p => Math.max(1, p - 1))}
                    className={employeePage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalEmployeePages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={employeePage === i + 1}
                      onClick={() => setEmployeePage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setEmployeePage(p => Math.min(totalEmployeePages, p + 1))}
                    className={employeePage === totalEmployeePages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
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
