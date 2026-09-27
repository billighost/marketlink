const safeNext = (raw) => {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
};

const BASE_URL = 'http://localhost:3000/api/auth';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== STARTING FAST AUTH VERIFICATION ===\n');

  // 1. safeNext unit checks
  console.log('--- Checking safeNext contract ---');
  const safeTests = [
    { input: '/products/abc', expected: '/products/abc' },
    { input: '', expected: null },
    { input: '//evil.com', expected: null },
    { input: 'https://evil.com', expected: null },
    { input: 'javascript:alert(1)', expected: null },
    { input: '/buyer/basket', expected: '/buyer/basket' },
  ];
  let safePass = true;
  for (const t of safeTests) {
    const res = safeNext(t.input);
    if (res !== t.expected) {
      console.error(`FAIL: safeNext("${t.input}") = "${res}", expected "${t.expected}"`);
      safePass = false;
    } else {
      console.log(`PASS: safeNext("${t.input}") = ${res}`);
    }
  }

  // 2. Failure path: Wrong password
  console.log('\n--- Checking Wrong Password ---');
  const wrongPw = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'sally.buyer@example.com', password: 'WrongPassword999!' }),
  });
  console.log('Status:', wrongPw.status, 'Error:', wrongPw.data?.error);

  // 3. Failure path: Unknown email
  console.log('\n--- Checking Unknown Email ---');
  const unknownEmail = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nonexistent-user-xyz@example.com', password: 'ValidPassword123!' }),
  });
  console.log('Status:', unknownEmail.status, 'Error:', unknownEmail.data?.error);

  // 4. Failure path: Duplicate email on register
  console.log('\n--- Checking Duplicate Email Register ---');
  const dupRegister = await request('/register/customer', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Test',
      email: 'sally.buyer@example.com',
      phone: '07123456789',
      address: '12 Elm Street, London',
      password: 'StrongPassword123!',
    }),
  });
  console.log('Status:', dupRegister.status, 'Error:', dupRegister.data?.error);

  // 5. Failure path: Missing required field
  console.log('\n--- Checking Missing Address ---');
  const missingField = await request('/register/customer', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Missing Address',
      email: `test-${Date.now()}@example.com`,
      phone: '07123456789',
      password: 'StrongPassword123!',
    }),
  });
  console.log('Status:', missingField.status, 'Details:', missingField.data?.error?.details);

  // 6. Failure path: Invalid email format
  console.log('\n--- Checking Invalid Email ---');
  const badEmail = await request('/register/customer', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bad Email',
      email: 'not-an-email',
      phone: '07123456789',
      address: '10 High Street',
      password: 'StrongPassword123!',
    }),
  });
  console.log('Status:', badEmail.status, 'Details:', badEmail.data?.error?.details);

  // 7. Failure path: Weak password (123)
  console.log('\n--- Checking Weak Password ---');
  const weakPw = await request('/register/customer', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Weak Pw',
      email: `test-weak-${Date.now()}@example.com`,
      phone: '07123456789',
      address: '10 High Street',
      password: '123',
    }),
  });
  console.log('Status:', weakPw.status, 'Details:', weakPw.data?.error?.details);

  // 8. Failure path: Expired or invalid reset token
  console.log('\n--- Checking Invalid Reset Token ---');
  const badReset = await request('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: 'made-up-invalid-token-1234567', password: 'NewStrongPassword123!' }),
  });
  console.log('Status:', badReset.status, 'Error:', badReset.data?.error);

  // 9. Failure path: Invalid verification token
  console.log('\n--- Checking Invalid Verification Token ---');
  const badVerify = await request('/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: 'made-up-invalid-token-1234567' }),
  });
  console.log('Status:', badVerify.status, 'Error:', badVerify.data?.error);

  // 10. Forgot Password: Leak check (registered vs unregistered email)
  console.log('\n--- Checking Forgot Password Leak Resistance ---');
  const forgotRegistered = await request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'sally.buyer@example.com' }),
  });
  const forgotUnregistered = await request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'completely-unknown-email-xyz@example.com' }),
  });
  console.log('Registered status:', forgotRegistered.status, 'Message:', forgotRegistered.data?.data?.message);
  console.log('Unregistered status:', forgotUnregistered.status, 'Message:', forgotUnregistered.data?.data?.message);
  const messagesIdentical = JSON.stringify(forgotRegistered.data) === JSON.stringify(forgotUnregistered.data);
  console.log('Leak check passed (identical responses):', messagesIdentical);

  // 11. Customer registration round trip
  console.log('\n--- Customer Registration Round Trip ---');
  const freshCustomerEmail = `customer-${Date.now()}@example.com`;
  const regCustomer = await request('/register/customer', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Jane Shopper',
      email: freshCustomerEmail,
      phone: '07987654321',
      address: '42 Meadow Lane, Cambridge',
      password: 'CustomerPassword123!',
    }),
  });
  console.log('Customer Register Status:', regCustomer.status);
  console.log('Has accessToken:', Boolean(regCustomer.data?.data?.accessToken));
  console.log('User role:', regCustomer.data?.data?.user?.role);
  console.log('User status:', regCustomer.data?.data?.user?.status);

  // Login with new customer
  const loginCustomer = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email: freshCustomerEmail, password: 'CustomerPassword123!' }),
  });
  console.log('Customer Login Status:', loginCustomer.status);
  console.log('Customer Login Role:', loginCustomer.data?.data?.user?.role);

  // 12. Farmer registration round trip
  console.log('\n--- Farmer Registration Round Trip ---');
  const freshFarmerEmail = `farmer-${Date.now()}@example.com`;
  const regFarmer = await request('/register/farmer', {
    method: 'POST',
    body: JSON.stringify({
      stallName: 'Sunny Acre Orchards',
      contactPerson: 'Jack Orchard',
      email: freshFarmerEmail,
      phone: '07111222333',
      address: 'Farmstead Lane, Somerset',
      password: 'FarmerPassword123!',
    }),
  });
  console.log('Farmer Register Status:', regFarmer.status);
  console.log('Has accessToken:', Boolean(regFarmer.data?.data?.accessToken));
  console.log('User role:', regFarmer.data?.data?.user?.role);
  console.log('User approval status:', regFarmer.data?.data?.user?.status);

  // Login with new farmer
  const loginFarmer = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email: freshFarmerEmail, password: 'FarmerPassword123!' }),
  });
  console.log('Farmer Login Status:', loginFarmer.status);
  console.log('Farmer Login Status in DB:', loginFarmer.data?.data?.user?.status);

  // 13. Resend verification
  console.log('\n--- Resend Verification Test ---');
  const resend = await request('/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: freshCustomerEmail }),
  });
  console.log('Resend Status:', resend.status, 'Message:', resend.data?.data?.message);

  console.log('\n=== FAST AUTH VERIFICATION COMPLETE ===');
}

runTests().catch(console.error);
