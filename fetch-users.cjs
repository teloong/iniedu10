const fs = require('fs');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download dari Firebase Console

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const listUsers = await admin.auth().listUsers(1000);
  const users = listUsers.users
    .sort((a, b) => b.metadata.creationTime.localeCompare(a.metadata.creationTime))
    .slice(0, 10)
    .map(u => ({
      email: u.email,
      displayName: u.displayName,
      created_at: u.metadata.creationTime.slice(0, 10)
    }));
  fs.writeFileSync('./public/users-latest.json', JSON.stringify({ users }, null, 2));
  console.log('User terbaru berhasil disimpan ke public/users-latest.json');
}
main();
