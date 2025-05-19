require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

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
const corsOptions = {
  origin: [
    "https://tickets-manager-kappa.vercel.app", // Retirer le / final
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Appliquer CORS à toutes les routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

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
  console.log("BODY /login:", req.body); 
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
  console.log("Données du ticket à créer:", req.body);
  console.log("Utilisateur connecté:", req.user);
  console.log("Donnée IDDD:", req.user.id);
  const { title, description, priority, type, status, client, station, clientPhone, clientEmail, image, waitingClient, resolutionComment } = req.body;
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        priority,
        type,
        status,
        client,
        station,
        client_phone: clientPhone,
        client_email: clientEmail,
        image,
        waiting_client: waitingClient,
        user_id: req.user.id,
        user_email: req.user.email,
        resolution_comment: resolutionComment
      })
      .select();

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

app.get('/tickets', async (req, res) => {
  const { data, error } = await supabase.from('tickets').select('*');
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.get('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  console.log("ID du ticket:", id);
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id);
  res.json(data);
});
app.put('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  console.log("Données du ticket à mettre à jour:", req.body);
  const { title, description, priority, type, status, client, station, clientPhone, clientEmail, image, waitingClient, resolutionComment } = req.body;
  const { data, error } = await supabase
    .from('tickets')
    .update({
      title,
      description,
      priority,
      type,
      status,
      client,
      station,
      client_phone: clientPhone,
      client_email: clientEmail,
      image,
      waiting_client: waitingClient,
      resolution_comment: resolutionComment
    })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});

// Image upload endpoint
app.post('/tickets/upload', upload.single('image'), async (req, res) => {
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


app.get('/states', async (req, res) => {
  try {
    console.log('Début de la récupération des statistiques...');
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*');
    
    

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

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});
// Ajoute ceci dans server/server.js

app.get('/ticketsStats', async (req, res) => {
  const { status, groupBy = 'day' } = req.query;
  let { data, error } = await supabase.from('tickets').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // Filtrer par statut
  if (status) data = data.filter(t => t.status === status);

  // Grouper par date
  const groupFn = (date) => {
    const d = new Date(date);
    if (groupBy === 'year') return d.getFullYear();
    if (groupBy === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // default: day
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const stats = {};
  data.forEach(ticket => {
    const label = groupFn(ticket.created_at);
    stats[label] = (stats[label] || 0) + 1;
  });

  // Format pour le frontend
  const result = Object.entries(stats).map(([label, count]) => ({ label, count }));
  res.json(result);
});

// Endpoint pour les tickets par station
app.get('/stats/tickets-by-station', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('client, station');

    if (error) throw error;

    const stats = data.reduce((acc, ticket) => {
      const key = ticket.client;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    

    const result = Object.entries(stats).map(([station, count]) => ({
      station,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour les incidents par priorité
app.get('/stats/incidents-by-priority',  async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('priority')
      

    if (error) throw error;

    const stats = data.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});
    console.log("Statistiques par priorité:", stats);
    const result = Object.entries(stats).map(([priority, count]) => ({
      priority,
      count
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour les catégories NOC Osticket
app.get('/stats/noc-osticket-categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('type, station')
      

    if (error) throw error;

    const stats = data.reduce((acc, ticket) => {
      const category = `${ticket.station}_${ticket.type}`;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(stats).map(([category, count]) => ({
      category,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour les incidents par statut
app.get('/stats/incidents-by-status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('status')
      

    if (error) throw error;

    const stats = data.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(stats).map(([status, count]) => ({
      status,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Endpoint pour l'envoi d'email de notification de ticket
app.post('/api/send-ticket',authenticateToken, async (req, res) => {
  console.log("Données de User maiou:", req.user.email);
  try {
    const { ticketId, userEmail } = req.body;

    if (!ticketId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ticketId est requis' 
      });
    }

    const ticketUrl = `https://monapp.com/tickets/${ticketId}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'naceryousfi007@gmail.com',
      subject: 'Nouveau ticket créé',
      html: `
        <h2>Un nouveau ticket a été créé</h2>
        <p>Un nouveau ticket a été créé dans le système.</p>
        <p><strong>Email de l'utilisateur :</strong> ${req.user.email || 'Non renseigné'}</p>
        <p>Vous pouvez accéder au ticket en cliquant sur le lien suivant :</p>
        <a href="${ticketUrl}">Voir le ticket</a>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Email envoyé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message 
    });
  }
});

const PORT = 10000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});


