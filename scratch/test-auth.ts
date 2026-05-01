async function testAuth() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/session');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 100));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}
testAuth();
