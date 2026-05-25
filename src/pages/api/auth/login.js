export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;
    // Dummy 
    if (username === 'admin' && password === '1234') {
      return res.status(200).json({ role: 'Superadmin' });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }
  res.status(405).end();
}
