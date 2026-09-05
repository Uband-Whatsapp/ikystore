const webpush = require('web-push');
const admin = require('firebase-admin');

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

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
    'mailto:admin@rikystore.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { voucherId, code, discountPercent, maxUses, expiresDays } = req.body;
    if (!voucherId || !code || !discountPercent) {
        return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    try {
        const subscriptionsSnapshot = await db.collection('pushSubscriptions').get();
        if (subscriptionsSnapshot.empty) {
            return res.status(200).json({ message: 'Tidak ada subscriber' });
        }

        const title = `🎉 Voucher Baru: ${code}`;
        const body = `Diskon ${discountPercent}% untuk semua produk! Berlaku ${expiresDays} hari. Kuota ${maxUses} orang.`;

        let successCount = 0, failCount = 0;
        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data();
            try {
                await webpush.sendNotification(subscription, JSON.stringify({
                    title, body, icon: '/favicon.ico', data: { voucherCode: code }
                }));
                successCount++;
            } catch (err) {
                failCount++;
                if (err.statusCode === 410) await doc.ref.delete();
            }
        }

        await db.collection('notificationLogs').add({
            voucherId, code, sentAt: admin.firestore.FieldValue.serverTimestamp(),
            totalSubscribers: subscriptionsSnapshot.size, successCount, failCount
        });

        res.status(200).json({
            message: `Notifikasi dikirim ke ${successCount} subscriber (${failCount} gagal)`,
            successCount, failCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};