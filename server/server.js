require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
console.log("Supabase URL:", process.env.SUPABASE_URL);
console.log("Supabase Key:", supabaseKey);
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
  console.log("Données du ticket à mettre à jour:", req.body);
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

// Image upload endpoint
app.post('/tickets/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path relative to the server
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

app.post('/add-account', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});


app.get('/states', authenticateToken, async (req, res) => {
  try {
    console.log('Début de la récupération des statistiques...');
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*');
    
    console.log("Données brutes de Supabase:", data);
    console.log("Erreur Supabase:", error);

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      console.warn('Aucune donnée reçue de Supabase');
      return res.status(200).json({
        total: 0,
        resolved: 0,
        closed: 0,
        pending: 0
      });
    }
    
    const stats = {
      total: data.length,
      resolved: data.filter(ticket => ticket.status === 'closed').length,
      pending: data.filter(ticket => ticket.status === 'in_progress').length,
      open: data.filter(ticket => ticket.status === 'open').length
    };

    console.log("Statistiques calculées:", stats);
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
})


