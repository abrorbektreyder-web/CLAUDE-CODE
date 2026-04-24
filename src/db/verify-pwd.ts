import * as argon2 from 'argon2';

async function verify() {
  const hash = '$argon2id$v=19$m=65536,t=3,p=4$LufDDQekJ4JpLqTDL0v1Pw$TyG0KHJbVwnJz5M3qKI66uKzlIUEL81VmdVlSJcbCRk';
  const password = '12345678';
  
  try {
    const match = await argon2.verify(hash, password);
    console.log('Match:', match);
  } catch (err) {
    console.error('Error:', err);
  }
}

verify();
