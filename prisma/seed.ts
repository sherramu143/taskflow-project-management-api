import { PrismaClient, Role, Status, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TaskFlow database...');

  // Clean existing data in reverse order of dependencies
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.orgMember.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create Users
  const userAdminAcme = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      passwordHash,
      name: 'Alice Admin (Acme)',
    },
  });

  const userMember1Acme = await prisma.user.create({
    data: {
      email: 'member1@acme.com',
      passwordHash,
      name: 'Bob Developer (Acme)',
    },
  });

  const userMember2Acme = await prisma.user.create({
    data: {
      email: 'member2@acme.com',
      passwordHash,
      name: 'Charlie Designer (Acme)',
    },
  });

  const userAdminStark = await prisma.user.create({
    data: {
      email: 'admin@stark.com',
      passwordHash,
      name: 'Tony Stark (Stark Tech)',
    },
  });

  const userMemberStark = await prisma.user.create({
    data: {
      email: 'member@stark.com',
      passwordHash,
      name: 'Peter Parker (Stark Tech)',
    },
  });

  console.log('Created 5 Users.');

  // 2. Create Organizations
  const orgAcme = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });

  const orgStark = await prisma.organization.create({
    data: {
      name: 'Stark Tech',
      slug: 'stark-tech',
    },
  });

  console.log('Created 2 Organizations.');

  // 3. Create Org Memberships
  await prisma.orgMember.createMany({
    data: [
      { orgId: orgAcme.id, userId: userAdminAcme.id, role: Role.org_admin },
      { orgId: orgAcme.id, userId: userMember1Acme.id, role: Role.member },
      { orgId: orgAcme.id, userId: userMember2Acme.id, role: Role.member },
      { orgId: orgStark.id, userId: userAdminStark.id, role: Role.org_admin },
      { orgId: orgStark.id, userId: userMemberStark.id, role: Role.member },
    ],
  });

  console.log('Assigned Organization Memberships with RBAC roles.');

  // 4. Create Projects
  const projectAcmeWeb = await prisma.project.create({
    data: {
      orgId: orgAcme.id,
      name: 'Web Application Redesign',
      description: 'Modernizing the front-end interface and REST APIs',
    },
  });

  const projectAcmeMobile = await prisma.project.create({
    data: {
      orgId: orgAcme.id,
      name: 'Mobile iOS & Android App',
      description: 'Native mobile client integration',
    },
  });

  const projectStarkArmor = await prisma.project.create({
    data: {
      orgId: orgStark.id,
      name: 'Mark 85 Armor Diagnostics',
      description: 'Telemetry and power grid optimization',
    },
  });

  console.log('Created Projects.');

  // 5. Create 10+ Tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: projectAcmeWeb.id,
      orgId: orgAcme.id,
      title: 'Design Dark Theme UI Mockups',
      description: 'Figma mockups with dark slate background and dynamic glassmorphism',
      status: Status.done,
      priority: Priority.high,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: projectAcmeWeb.id,
      orgId: orgAcme.id,
      title: 'Implement JWT Access and Refresh Auth',
      description: 'Setup token rotation and rate limiting middleware',
      status: Status.in_progress,
      priority: Priority.urgent,
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: projectAcmeWeb.id,
      orgId: orgAcme.id,
      title: 'Setup PostgreSQL Indexes & Full-Text Search',
      description: 'GIN index on title + description vector',
      status: Status.review,
      priority: Priority.medium,
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: projectAcmeWeb.id,
      orgId: orgAcme.id,
      title: 'Write Unit & Integration Tests',
      description: 'Test coverage for auth, task CRUD, and tenant isolation',
      status: Status.todo,
      priority: Priority.medium,
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: projectAcmeMobile.id,
      orgId: orgAcme.id,
      title: 'Push Notification Integration',
      description: 'FCM push notifications for mobile devices',
      status: Status.todo,
      priority: Priority.low,
      dueDate: new Date(Date.now() + 86400000 * 10),
    },
  });

  const task6 = await prisma.task.create({
    data: {
      projectId: projectAcmeMobile.id,
      orgId: orgAcme.id,
      title: 'Biometric Authentication Flow',
      description: 'FaceID and TouchID login integration',
      status: Status.in_progress,
      priority: Priority.high,
      dueDate: new Date(Date.now() + 86400000 * 4),
    },
  });

  // Stark Tech tasks
  const task7 = await prisma.task.create({
    data: {
      projectId: projectStarkArmor.id,
      orgId: orgStark.id,
      title: 'Calibrate Arc Reactor Power Output',
      description: 'Regulate nanotech plasma distribution across thrusters',
      status: Status.in_progress,
      priority: Priority.urgent,
      dueDate: new Date(Date.now() + 86400000 * 1),
    },
  });

  const task8 = await prisma.task.create({
    data: {
      projectId: projectStarkArmor.id,
      orgId: orgStark.id,
      title: 'JARVIS Telemetry Stream Analysis',
      description: 'Real-time websocket telemetry ingestion',
      status: Status.todo,
      priority: Priority.high,
      dueDate: new Date(Date.now() + 86400000 * 6),
    },
  });

  const task9 = await prisma.task.create({
    data: {
      projectId: projectStarkArmor.id,
      orgId: orgStark.id,
      title: 'Vibranium Mesh Stress Testing',
      description: 'Thermal and kinetic shock test simulations',
      status: Status.done,
      priority: Priority.medium,
      dueDate: new Date(Date.now() - 86400000 * 1),
    },
  });

  const task10 = await prisma.task.create({
    data: {
      projectId: projectStarkArmor.id,
      orgId: orgStark.id,
      title: 'Deploy Automated Repair Drones',
      description: 'Configure BullMQ queue for drone dispatch notifications',
      status: Status.review,
      priority: Priority.urgent,
      dueDate: new Date(Date.now() + 86400000 * 8),
    },
  });

  console.log('Created 10 Tasks distributed across projects and orgs.');

  // 6. Create Assignments
  await prisma.taskAssignment.createMany({
    data: [
      { taskId: task1.id, userId: userMember2Acme.id },
      { taskId: task2.id, userId: userMember1Acme.id },
      { taskId: task3.id, userId: userMember1Acme.id },
      { taskId: task6.id, userId: userMember1Acme.id },
      { taskId: task7.id, userId: userAdminStark.id },
      { taskId: task8.id, userId: userMemberStark.id },
      { taskId: task10.id, userId: userMemberStark.id },
    ],
  });

  console.log('Created Task Assignments.');

  // 7. Create Sample Comments
  await prisma.comment.createMany({
    data: [
      {
        taskId: task2.id,
        authorId: userAdminAcme.id,
        content: 'Please ensure bcrypt salt cost is set to at least 12.',
      },
      {
        taskId: task2.id,
        authorId: userMember1Acme.id,
        content: 'Understood! I also added refresh token rotation and revocation support.',
      },
      {
        taskId: task7.id,
        authorId: userMemberStark.id,
        content: 'Mr. Stark, the power output is fluctuating around 98%. Should I increase damper pressure?',
      },
    ],
  });

  console.log('Created Sample Comments.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
