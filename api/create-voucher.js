// api/create-voucher.js
const webpush = require('web-push');
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK (gunakan service account)
// Untuk Vercel, sebaiknya gunakan environment variables.
// Contoh: simpan credentials di Vercel Environment Variables.
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Konfigurasi VAPID (sama dengan yang di frontend)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BFcH-HuEIbgumvfYh8SXXIip0MCOndkFTovfImUmIwxU1NotrrQxdma7c7vt2PkZcQLHFCsCHPGAQqDKO_QDwCs',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY' // GANTI DENGAN PRIVATE KEY ANDA
};

webpush.setVapidDetails(
  'mailto:admin@rikystore.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = async (req, res) => {
  // Hanya menerima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { voucherId, code, discountPercent, maxUses, expiresDays } = req.body;
  if (!voucherId || !code || !discountPercent) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    // 1. Pastikan voucher sudah tersimpan di Firestore (bisa dari dashboard)
    // Tapi karena dashboard sudah simpan, kita tidak perlu simpan ulang.
    // Kita akan ambil semua subscription yang aktif
    const subscriptionsSnapshot = await db.collection('pushSubscriptions').get();
    if (subscriptionsSnapshot.empty) {
      return res.status(200).json({ message: 'Tidak ada subscriber, notifikasi tidak dikirim' });
    }

    // 2. Siapkan payload notifikasi
    const notificationTitle = `🎉 Voucher Baru: ${code}`;
    const notificationBody = `Diskon ${discountPercent}% untuk semua produk! Berlaku ${expiresDays} hari. Kuota ${maxUses} orang.`;

    // 3. Kirim ke semua subscriber
    let successCount = 0;
    let failCount = 0;

    for (const doc of subscriptionsSnapshot.docs) {
      const subscription = doc.data();
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          icon: '/favicon.ico',
          data: { voucherCode: code }
        }));
        successCount++;
      } catch (err) {
        console.error('Gagal kirim ke', subscription.endpoint, err.message);
        failCount++;
        // Jika subscription sudah invalid, hapus dari Firestore
        if (err.statusCode === 410) {
          await doc.ref.delete();
        }
      }
    }

    // 4. Simpan log notifikasi (opsional)
    await db.collection('notificationLogs').add({
      voucherId,
      code,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      totalSubscribers: subscriptionsSnapshot.size,
      successCount,
      failCount
    });

    res.status(200).json({
      message: `Notifikasi dikirim ke ${successCount} subscriber (${failCount} gagal)`,
      successCount,
      failCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};