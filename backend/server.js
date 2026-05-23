require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ecritures', require('./routes/ecritures'));
app.use('/api/comptes', require('./routes/comptes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/membres', require('./routes/membres'));
app.use('/api/categories', require('./routes/categories'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Dialaw TV - Livre Journal' }));

app.listen(PORT, () => {
  console.log(`Serveur Dialaw TV démarré sur http://localhost:${PORT}`);
  console.log('Comptes par défaut:');
  console.log('  Admin: admin@dialawtv.sn / admin2024');
  console.log('  Comptable: comptable@dialawtv.sn / comptable2024');
});
