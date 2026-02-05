/**
 * Firestore Database Setup Script (Using Entities)
 * Run this script to initialize the database with sample data
 * 
 * Usage: npx tsx scripts/setup-db.ts
 */

import { initializeFirebase } from '../src/config/firebase-admin-config';
import { userEntity } from '../src/entities/user.entity';
import { employeeEntity } from '../src/entities/employee.entity';
import { taskEntity } from '../src/entities/task.entity';

interface ManagerInput {
  phoneNumber: string;
  name: string;
}

interface EmployeeInput {
  email: string;
  name: string;
  phone?: string;
  managerId: string;
}

// Sample data - modify as needed
const MANAGERS: ManagerInput[] = [
  { phoneNumber: '+841234567890', name: 'Nguyễn Văn A' },
  { phoneNumber: '+849876543210', name: 'Trần Thị B' },
];

const EMPLOYEES: EmployeeInput[] = [
  { email: 'employee1@example.com', name: 'Lê Văn C', phone: '+84111222333', managerId: '' },
  { email: 'employee2@example.com', name: 'Phạm Thị D', phone: '+84144555666', managerId: '' },
  { email: 'employee3@example.com', name: 'Hoàng Văn E', managerId: '' },
];

async function setupDatabase() {
  console.log('🚀 Starting Firestore Database Setup...\n');

  // Initialize Firebase
  initializeFirebase();

  try {
    // Create managers
    console.log('--- Creating Managers ---\n');
    const managerIds: string[] = [];

    for (const manager of MANAGERS) {
      console.log(`📱 Creating manager: ${manager.name} (${manager.phoneNumber})`);
      
      const managerId = await userEntity.createManager(manager.phoneNumber, manager.name);
      managerIds.push(managerId);
      console.log(`   ✅ Manager created with ID: ${managerId}`);
    }

    // Assign managers to employees
    const employeesWithManager = EMPLOYEES.map((emp, index) => ({
      ...emp,
      managerId: managerIds[index % managerIds.length],
    }));

    // Create employees
    console.log('\n--- Creating Employees ---\n');

    for (const employee of employeesWithManager) {
      console.log(`👤 Creating employee: ${employee.name} (${employee.email})`);
      
      // Create user first
      const userId = await userEntity.createEmployee(employee.email, employee.name);
      console.log(`   ✅ User created with ID: ${userId}`);
      
      // Create employee profile
      const employeeId = await employeeEntity.createEmployee(
        employee.name,
        employee.email,
        employee.phone,
        'employee',
        employee.managerId
      );
      console.log(`   ✅ Employee profile created with ID: ${employeeId}`);
    }

    // Create sample tasks for first employee
    console.log('\n--- Creating Sample Tasks ---\n');

    const firstEmployee = await userEntity.findByEmail(employeesWithManager[0].email);
    if (firstEmployee) {
      const employeeProfile = await employeeEntity.findByEmail(employeesWithManager[0].email);
      if (employeeProfile) {
        const sampleTasks = [
          { title: 'Hoàn thành báo cáo tuần', description: 'Viết báo cáo công việc tuần này', priority: 'high' as const },
          { title: 'Họp team meeting', description: 'Tham gia cuộc họp team', priority: 'medium' as const },
          { title: 'Cập nhật documentation', description: 'Cập nhật tài liệu kỹ thuật', priority: 'low' as const },
        ];

        for (const task of sampleTasks) {
          const taskId = await taskEntity.createNew(
            task.title,
            task.description,
            firstEmployee.id!,
            employeeProfile.managerId || managerIds[0],
            task.priority
          );
          console.log(`📋 Task created: ${task.title} (ID: ${taskId})`);
        }
      }
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n--- Summary ---');
    console.log(`Managers created: ${managerIds.length}`);
    console.log(`Employees created: ${EMPLOYEES.length}`);
    console.log('\n📝 Next steps:');
    console.log('1. Update .env with your Firebase credentials');
    console.log('2. Run backend: cd backend && npm run dev');
    console.log('3. Test API endpoints with Postman or curl');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
