
import admin from 'firebase-admin';
import webpush from 'web-push';

// ========== INIT FIREBASE ADMIN ==========
if (!admin.apps.length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) throw new Error('FIREBASE_SERVICE_ACCOUNT belum diatur');
  const serviceAccount = JSON.parse(serviceAccountStr);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// ========== VAPID KEYS (SAMA PERSIS DENGAN SEND-NOTIFICATION) ==========
const VAPID_PUBLIC_KEY = 'BFcH-HuEIbgumvfYh8SXXIip0MCOndkFTovfImUmIwxU1NotrrQxdma7c7vt2PkZcQLHFCsCHPGAQqDKO_QDwCs';
const VAPID_PRIVATE_KEY = '5slaCeRBYXAhBAgs4SVlMLT4vLY0e9Ilok7p1y-HIzg';

webpush.setVapidDetails(
  'mailto:ekkstore.id@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// ========== HANDLER ==========
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { voucherId, code, discountPercent, maxUses, expiresDays } = req.body;
  if (!voucherId || !code || !discountPercent) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    // Ambil semua subscriber dari koleksi push_subscriptions
    const snapshot = await db.collection('push_subscriptions').get();
    const subscriptions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.subscription) {
        subscriptions.push(data.subscription);
      }
    });

    if (subscriptions.length === 0) {
      return res.status(200).json({
        message: 'Tidak ada subscriber yang terdaftar.',
        total: 0,
        success: 0
      });
    }

    const title = `🎉 Voucher Baru: ${code}`;
    const body = `Diskon ${discountPercent}% untuk semua produk! Berlaku ${expiresDays} hari. Kuota ${maxUses} orang.`;

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: 'https://files.catbox.moe/l0n29q.jpg',
      badge: 'https://files.catbox.moe/l0n29q.jpg',
      url: 'https://iky.store.ekkstore.web.id/',
      data: { voucherCode: code }
    });

    let successCount = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err) {
        console.error('❌ Gagal kirim:', err.statusCode, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Hapus subscription expired nanti (opsional)
        }
      }
    }

    // Simpan log notifikasi
    await db.collection('notificationLogs').add({
      voucherId,
      code,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      totalSubscribers: subscriptions.length,
      successCount,
      failCount: subscriptions.length - successCount
    });

    res.status(200).json({
      total: subscriptions.length,
      success: successCount,
      message: `Notifikasi dikirim ke ${successCount} perangkat dari ${subscriptions.length} subscriber.`
    });
  } catch (err) {
    console.error('❌ Error create-voucher:', err);
    res.status(500).json({ error: err.message });
  }
}