module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const pass = req.headers['x-admin-password'];
  if (pass !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: 'HTML kosong' });
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'Uband-Whatsapp/ikystore';
  const path = 'index.html';
  const branch = 'main';
  try {
    const get = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, { headers: { Authorization: `token ${token}` } });
    const file = await get.json();
    const sha = file.sha;
    const update = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Update via admin', content: Buffer.from(html).toString('base64'), sha, branch })
    });
    if (!update.ok) throw new Error('Gagal update');
    res.status(200).json({ success: true, message: '✅ Berhasil!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};