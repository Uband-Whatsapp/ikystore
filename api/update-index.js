module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SEMUA LOGIKA MASUK KE DALAM TRY-CATCH
  try {
    // 1. Cek Password
    const password = req.headers['x-admin-password'];
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized: Password salah atau belum diset di Vercel' });
    }

    // 2. Cek Body (Aman dari crash)
    const body = req.body;
    const html = body ? body.html : null;

    if (!html) {
      return res.status(400).json({ error: 'HTML tidak boleh kosong' });
    }

    // 3. Cek Environment Variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPO || 'Uband-Whatsapp/ikystore';
    const PATH = 'index.html';
    const BRANCH = 'main';

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN tidak dikonfigurasi di Environment Variables Vercel');
    }

    // 4. Ambil SHA dari GitHub
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    
    if (!getRes.ok) {
      const err = await getRes.json();
      throw new Error(err.message || 'Gagal ambil file dari GitHub (Cek Token/Repo)');
    }
    
    const fileData = await getRes.json();
    const sha = fileData.sha;

    // 5. Update file ke GitHub
    const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update via admin',
        content: Buffer.from(html).toString('base64'),
        sha: sha,
        branch: BRANCH
      })
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.message || 'Gagal update file ke GitHub');
    }

    return res.status(200).json({ success: true, message: '✅ Berhasil! Vercel akan deploy otomatis.' });

  } catch (err) {
    console.error('Error Backend:', err);
    // Selalu kirim JSON jika terjadi error
    return res.status(500).json({ error: 'Server Error: ' + err.message });
  }
};