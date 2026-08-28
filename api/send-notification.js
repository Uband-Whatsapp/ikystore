import admin from 'firebase-admin';
import webpush from 'web-push';

if (!admin.apps.length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) throw new Error('FIREBASE_SERVICE_ACCOUNT belum diatur');
  const serviceAccount = JSON.parse(serviceAccountStr);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// VAPID KEYS (SAMA PERSIS DENGAN YANG DI INDEX.HTML)
const VAPID_PUBLIC_KEY = 'BFcH-HuEIbgumvfYh8SXXIip0MCOndkFTovfImUmIwxU1NotrrQxdma7c7vt2PkZcQLHFCsCHPGAQqDKO_QDwCs';
const VAPID_PRIVATE_KEY = '5slaCeRBYXAhBAgs4SVlMLT4vLY0e9Ilok7p1y-HIzg';

webpush.setVapidDetails(
  'mailto:ekkstore.id@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-admin-password'];
  // SEMENTARA: hardcode password "1"
  if (password !== "1") {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, icon, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title dan body wajib diisi' });
  }

  try {
    const snapshot = await db.collection('push_subscriptions').get();
    const subscriptions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.subscription) {
        subscriptions.push(data.subscription);
      }
    });

    console.log(`📨 Total subscriber: ${subscriptions.length}`);

    if (subscriptions.length === 0) {
      return res.status(200).json({
        message: 'Tidak ada subscriber yang terdaftar.',
        total: 0,
        success: 0
      });
    }

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: icon || 'https://files.catbox.moe/kzg0nc.png',
      badge: icon || 'https://files.catbox.moe/kzg0nc.png',
      url: url || 'https://iky.store.ekkstore.web.id/'
    });

    let successCount = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
        console.log('✅ Notifikasi terkirim');
      } catch (err) {
        console.error('❌ Gagal kirim:', err.statusCode, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired, nanti hapus
        }
      }
    }

    res.status(200).json({
      total: subscriptions.length,
      success: successCount,
      message: `Notifikasi dikirim ke ${successCount} perangkat dari ${subscriptions.length} subscriber.`
    });
  } catch (err) {
    console.error('❌ Error send-notification:', err);
    res.status(500).json({ error: err.message });
  }
}