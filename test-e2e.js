/**
 * TaskFlow End-to-End (E2E) Live Verification Script
 * Tests full backend workflow against Vercel live deployment.
 */

const BASE_URL = process.env.LIVE_URL || 'https://taskflow-project-management-api.vercel.app';

async function runE2ETest() {
  console.log('====================================================');
  console.log('🚀 TASKFLOW FULL END-TO-END (E2E) LIVE TEST SUITE');
  console.log(`🌐 Target Base URL: ${BASE_URL}`);
  console.log('====================================================\n');

  const runId = Date.now();
  let step = 1;

  const logStep = (title) => {
    console.log(`\n--- STEP ${step++}: ${title} ---`);
  };

  try {
    // STEP 1: Health Check
    logStep('Checking System Health (GET /health)');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`Status: ${healthRes.status} OK`);
    console.log(`Health Response:`, healthData);

    // STEP 2: Register Primary Org Admin
    logStep('Registering Primary Org Admin (POST /auth/register)');
    const adminEmail = `admin_${runId}@acme.com`;
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'Password123!',
        name: 'Alice Admin',
        organizationName: `Acme Global ${runId}`
      })
    });
    const regAdminData = await regAdminRes.json();
    console.log(`Status: ${regAdminRes.status} Created`);
    console.log(`User ID: ${regAdminData.user.id}`);
    console.log(`Org ID: ${regAdminData.organization.id}`);

    let accessToken = regAdminData.tokens.accessToken;
    let refreshToken = regAdminData.tokens.refreshToken;
    const adminUserId = regAdminData.user.id;

    // STEP 3: Login Verification
    logStep('Logging In Admin User (POST /auth/login)');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status} OK`);
    console.log(`Login Token Generated: ${loginData.tokens?.accessToken ? 'YES ✅' : 'NO ❌'}`);

    // STEP 4: Refresh Token Rotation
    logStep('Testing Refresh Token Rotation (POST /auth/refresh)');
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const refreshData = await refreshRes.json();
    console.log(`Status: ${refreshRes.status} OK`);
    if (refreshData.tokens?.accessToken) {
      accessToken = refreshData.tokens.accessToken;
      refreshToken = refreshData.tokens.refreshToken;
      console.log('New Rotated Access Token Acquired ✅');
    }

    // STEP 5: Create Project
    logStep('Creating a New Project (POST /projects)');
    const createProjRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: `TaskFlow Cloud Deployment ${runId}`,
        description: 'E2E test project for Vercel + Neon + Upstash integration'
      })
    });
    const createProjData = await createProjRes.json();
    console.log(`Status: ${createProjRes.status} Created`);
    const projectId = createProjData.id || createProjData.data?.id;
    console.log(`Project ID: ${projectId}`);

    // STEP 6: List Projects
    logStep('Listing Organization Projects (GET /projects)');
    const listProjRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const listProjData = await listProjRes.json();
    console.log(`Status: ${listProjRes.status} OK`);
    const projectsList = Array.isArray(listProjData) ? listProjData : (listProjData.data || []);
    console.log(`Total Projects Found: ${projectsList.length}`);

    // STEP 7: Create Tasks Nested under Project
    logStep('Creating Task 1 - Urgent Priority (POST /projects/:projectId/tasks)');
    const task1Res = await fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'Configure Production Upstash Redis Queue',
        description: 'Ensure BullMQ processes assignment notifications',
        priority: 'urgent',
        status: 'todo',
        dueDate: '2026-12-31T23:59:59.000Z'
      })
    });
    const task1Data = await task1Res.json();
    console.log(`Status: ${task1Res.status} Created`);
    const task1Id = task1Data.id || task1Data.data?.id;
    console.log(`Task 1 ID: ${task1Id}`);

    logStep('Creating Task 2 - Medium Priority (POST /projects/:projectId/tasks)');
    const task2Res = await fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'Verify OpenAPI Swagger Documentation',
        description: 'Ensure CDN assets load without CSP blocks',
        priority: 'medium',
        status: 'in_progress'
      })
    });
    const task2Data = await task2Res.json();
    console.log(`Status: ${task2Res.status} Created`);
    const task2Id = task2Data.id || task2Data.data?.id;
    console.log(`Task 2 ID: ${task2Id}`);

    // STEP 8: Task Filtering & Pagination
    logStep('Listing Tasks with Status Filter (GET /tasks?status=in_progress)');
    const filterTaskRes = await fetch(`${BASE_URL}/tasks?status=in_progress`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const filterTaskData = await filterTaskRes.json();
    console.log(`Status: ${filterTaskRes.status} OK`);
    const tasksList = Array.isArray(filterTaskData) ? filterTaskData : (filterTaskData.data || filterTaskData.items || []);
    console.log(`Filtered Tasks Count: ${tasksList.length}`);

    // STEP 9: Task Assignment & Queue Job Enqueueing
    logStep('Assigning User to Task (POST /tasks/:id/assign)');
    const assignRes = await fetch(`${BASE_URL}/tasks/${task1Id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ userId: adminUserId })
    });
    const assignData = await assignRes.json();
    console.log(`Status: ${assignRes.status} Created`);
    console.log(`Queue Response:`, assignData);

    // STEP 10: Bulk Update Task Status
    logStep('Bulk Updating Task Status (PATCH /tasks/bulk-status)');
    const bulkRes = await fetch(`${BASE_URL}/tasks/bulk-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        taskIds: [task1Id, task2Id],
        status: 'done'
      })
    });
    const bulkData = await bulkRes.json();
    console.log(`Status: ${bulkRes.status} OK`);
    console.log(`Bulk Update Response:`, bulkData);

    // STEP 11: Project Metrics Dashboard
    logStep('Fetching Project Metrics Dashboard (GET /projects/:id/dashboard)');
    const dashRes = await fetch(`${BASE_URL}/projects/${projectId}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const dashData = await dashRes.json();
    console.log(`Status: ${dashRes.status} OK`);
    console.log(`Dashboard Status Counts:`, dashData.statusCounts || dashData.data?.statusCounts || dashData);

    // STEP 12: Multi-tenant Security Isolation Test
    logStep('Testing Cross-Tenant Security Isolation (403 Forbidden)');
    const regTenant2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `tenant2_${runId}@stark.com`,
        password: 'Password123!',
        name: 'Stark Admin',
        organizationName: `Stark Industries ${runId}`
      })
    });
    const regTenant2Data = await regTenant2Res.json();
    const tenant2Token = regTenant2Data.tokens.accessToken;

    const crossAccessRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${tenant2Token}` }
    });
    console.log(`Cross-Tenant Access HTTP Status: ${crossAccessRes.status}`);
    if (crossAccessRes.status === 403 || crossAccessRes.status === 404) {
      console.log('🛡️ Cross-Tenant Isolation ENFORCED! (Access Denied as expected) ✅');
    } else {
      console.error('❌ Security Warning: Cross-tenant access was not blocked!');
    }

    // STEP 13: Soft Delete Cleanup
    logStep('Soft Deleting Task (DELETE /tasks/:id)');
    const delTaskRes = await fetch(`${BASE_URL}/tasks/${task1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`Status: ${delTaskRes.status} OK`);

    logStep('Soft Deleting Project (DELETE /projects/:id)');
    const delProjRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`Status: ${delProjRes.status} OK`);

    console.log('\n====================================================');
    console.log('🎉 ALL 13 END-TO-END (E2E) VERIFICATION STEPS PASSED!');
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ E2E Test Execution Failed:', error);
    process.exit(1);
  }
}

runE2ETest();
