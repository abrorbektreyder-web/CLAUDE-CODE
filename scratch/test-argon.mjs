
async function testArgon() {
  try {
    const argon2 = await import('argon2');
    const hash = '$argon2id$v=19$m=65536,t=3,p=4$LufDDQekJ4JpLqTDL0v1Pw$TyG0KHJbVwnJz5M3qKI66uKzlIUEL81VmdVlSJcbCRk';
    const password = '12345678';
    const result = await argon2.verify(hash, password);
    console.log('Argon2 verification result:', result);
  } catch (e) {
    console.error('Argon2 Error:', e);
  }
}

testArgon();
