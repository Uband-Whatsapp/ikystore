// api/update-index.js (CommonJS)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'HTML tidak boleh kosong' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = process.env.GITHUB_REPO || 'Uband-Whatsapp/ikystore';
  const PATH = 'index.html';
  const BRANCH = 'main';

  try {
    // Ambil SHA file saat ini
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    if (!getRes.ok) {
      const err = await getRes.json();
      throw new Error(err.message || 'Gagal ambil file');
    }
    const fileData = await getRes.json();
    const sha = fileData.sha;

    // Update file
    const updateRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update index.html via admin',
          content: Buffer.from(html).toString('base64'),
          sha: sha,
          branch: BRANCH,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.message || 'Gagal update file');
    }

    res.status(200).json({
      success: true,
      message: '✅ index.html berhasil diupdate! Vercel akan deploy otomatis.',
    });
  } catch (err) {
    console.error('❌ Error update index:', err);
    res.status(500).json({ error: err.message });
  }
};