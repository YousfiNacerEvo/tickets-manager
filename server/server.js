const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

app.use(cors());
app.use(express.json());

// Middleware pour vérifier le token JWT
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  

  if (!token) return res.status(401).json({ error: 'Token manquant' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  

  if (error || !user) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = user;
  next();
}


app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.post('/tickets', authenticateToken, async (req, res) => {
  const { title, description, priority, type, status, clientFirstName, clientLastName, clientPhone, clientEmail, image, waitingClient } = req.body;
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        priority,
        type,
        status,
        client_first_name: clientFirstName,  // Conversion en snake_case
        client_last_name: clientLastName,
        client_phone: clientPhone,
        client_email: clientEmail,          // Le nom correct doit être client_email
        image,
        waiting_client: waitingClient,      // Snake_case ici aussi
        user_id: req.user.id,
        user_email: req.user.email
      })
      .select(); // Ajoutez .select() pour voir les données retournées

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Erreur inattendue:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/tickets', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('tickets').select('*');
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.get('/tickets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log("ID du ticket:", id);
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id);
  res.json(data);
});
app.put('/tickets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, type, status, clientFirstName, clientLastName, clientPhone, clientEmail, image, waitingClient } = req.body;
  const { data, error } = await supabase
    .from('tickets')
    .update({
      title,
      description,
      priority,
      type,
      status,
      client_first_name: clientFirstName,
      client_last_name: clientLastName,
      client_phone: clientPhone,
      client_email: clientEmail,
      image,
      waiting_client: waitingClient
    })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});

app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
})


