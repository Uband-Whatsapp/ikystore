// api/send-notification.js
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// 🔴 GANTI PROJECT ID DI BAWAH DENGAN PUNYA KAMU
const PROJECT_ID = "riky-store-push";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title dan body wajib' });
  }

  try {
    const snapshot = await db.collection('tokens').get();
    const tokens = [];
    snapshot.forEach(doc => {
      const token = doc.data().token;
      if (token) tokens.push(token);
    });

    if (tokens.length === 0) {
      return res.status(200).json({ message: 'Tidak ada token tersimpan' });
    }

    const payload = {
      notification: { title, body },
      webpush: {
        fcm_options: { link: url || 'https://iky.store.ekkstore.web.id' }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      ...payload,
    });

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

    res.status(200).json({
      success: true,
      message: `Notifikasi dikirim ke ${tokens.length - failedTokens.length} perangkat (${failedTokens.length} gagal)`,
      failed: failedTokens.length,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
