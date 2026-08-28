// api/send-notification.js
const admin = require('firebase-admin');

// 🔴 PASTIKAN SERVICE ACCOUNT SUDAH DI-SET DI ENV
let app;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} catch (err) {
  console.error('Gagal inisialisasi Firebase Admin:', err.message);
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Set CORS dan response JSON
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verifikasi password admin
  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title dan body wajib diisi' });
  }

  try {
    // Ambil semua token dari Firestore
    const snapshot = await db.collection('tokens').get();
    const tokens = [];
    snapshot.forEach(doc => {
      const token = doc.data().token;
      if (token) tokens.push(token);
    });

    if (tokens.length === 0) {
      return res.status(200).json({ message: 'Tidak ada token tersimpan' });
    }

    // Kirim notifikasi
    const payload = {
      notification: { title, body },
      webpush: {
        fcm_options: { link: url || 'https://lky.store.ekkstore.web.id' }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      ...payload,
    });

    // Hapus token yang gagal
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) failedTokens.push(tokens[idx]);
    });

    if (failedTokens.length > 0) {
      const batch = db.batch();
      const tokensRef = db.collection('tokens');
      for (const token of failedTokens) {
        const snap = await tokensRef.where('token', '==', token).get();
        snap.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      message: `Notifikasi dikirim ke ${tokens.length - failedTokens.length} perangkat (${failedTokens.length} gagal)`,
      failed: failedTokens.length,
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};