require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:<PASSWORD>@<HOST>:5432/postgres',
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: function (req, file, cb) {
    // Accept all file types
    cb(null, true);
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
console.log("Supabase URL:", process.env.SUPABASE_URL);
console.log("Supabase Key:", supabaseKey);
const supabase = createClient(supabaseUrl, supabaseKey)
//"https://tickets-manager-kappa.vercel.app"
//"http://192.168.137.1:3000",
const corsOptions = {
  origin: "*",
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

  req.user = {
    ...user,
    role: user.user_metadata?.role || 'user',
  };
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
  const { title, description, priority, type, status, client, station, clientPhone, clientEmail, files, waitingClient, resolutionComment } = req.body;
  console.log("Backend host is working")
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
        files: files ? JSON.stringify(files) : null,
        waiting_client: waitingClient,
        user_id: req.user.id,
        user_email: req.user.email,
        resolution_comment: resolutionComment
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
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
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Ticket non trouvé' });
  }

  // Transformer les données pour avoir un format plus simple
  const transformedData = data.map(ticket => ({
    ...ticket,
    files: ticket.files ? JSON.parse(ticket.files) : []
  }));

  res.json(transformedData);
});

app.put('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, type, status, client, station, clientPhone, clientEmail, files, waitingClient, resolutionComment } = req.body;
  
  try {
    // Get the current server time in UTC
    const serverTime = new Date();
    console.log('Server time:', serverTime.toISOString());

    const updateData = {
      title,
      description,
      priority,
      type,
      status,
      client,
      station,
      client_phone: clientPhone,
      client_email: clientEmail,
      files: files ? JSON.stringify(files) : null,
      waiting_client: waitingClient,
      resolution_comment: resolutionComment,
      // Si le ticket est fermé, utiliser l'heure du serveur
      closed_at: status === 'closed' ? serverTime.toISOString() : null
    };

    console.log('Updating ticket with data:', updateData);

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }
    res.json(data);
  } catch (error) {
    console.error('Error while updating the ticket:', error);
    res.status(500).json({ error: 'Server error while updating the ticket' });
  }
});

// Route for file upload
app.post('/tickets/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }

    const urls = req.files.map(file => `/uploads/${file.filename}`);
    console.log('Uploaded files:', urls);

    res.json({ urls });
  } catch (error) {
    console.error('Error while uploading files:', error);
    res.status(500).json({ error: 'Error while uploading files' });
  }
});

app.post('/add-account', async (req, res) => {
  try {
    console.log("Entering add-account endpoint");
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Créer l'utilisateur avec Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Confirmer automatiquement l'email
    });

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Utilisateur créé avec succès:', data);
    res.json({ success: true, user: data.user });
    
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});


app.get('/states', async (req, res) => {
  try {

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
app.get('/stats/incidents-by-priority', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('priority')


    if (error) throw error;

    const stats = data.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});
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
app.post('/api/send-ticket', authenticateToken, async (req, res) => {
  try {
    const { ticketId, userEmail, message, subject } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'ticketId est requis'
      });
    }

    const ticketUrl = `https://tickets-manager-kappa.vercel.app/dashboard/tickets/${ticketId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject || (message ? 'Ticket Status Update' : 'New ticket has been created '),
      html: message
        ? `<p>${message}</p>`
        : `
          <h2>A new ticket has been created</h2>
          <p>A new ticket has been created in the system.</p>
          <p><strong>User Elmail :</strong> ${req.user.email || 'anonymous'}</p>
          <p>You can access the ticket by clicking on the following link :</p>
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

app.post("/api/forget-password", async (req, res) => {
  console.log("reset server enter")
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "L'email est requis" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    c
    if (error) {
      throw error;
    }

    res.json({ message: "Email de réinitialisation envoyé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    res.status(500).json({
      message: error.message || "Une erreur est survenue lors de la réinitialisation du mot de passe",
    });
  }
});

app.post("/api/update-password", async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token de réinitialisation manquant" });
    }

    if (!password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
      password: password
    });

    if (error) {
      throw error;
    }

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    res.status(500).json({
      message: error.message || "Une erreur est survenue lors de la mise à jour du mot de passe",
    });
  }
});

// Route to get ticket comments
app.get('/tickets/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error while retrieving comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to add a comment
app.post('/tickets/:id/comments', authenticateToken, async (req, res) => {
  console.log("Comment received on server side");

  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const { data, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        content,
        user_id: userId,
        user_email: userEmail,
        created_at: new Date().toISOString()
      })
      .select();
    console.log("Comment updated");

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error while adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour le reporting des tickets
app.get('/api/reporting', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      type,
      assignedUser,
      category,
      groupBy = 'month' // month, week, day
    } = req.query;

    let query = supabase.from('tickets').select('*');

    // Appliquer les filtres
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (assignedUser) {
      query = query.eq('user_email', assignedUser);
    }
    if (category) {
      query = query.eq('station', category);
    }

    const { data: tickets, error } = await query;

    if (error) throw error;

    function parseToUTC(dateStr) {
      if (!dateStr) return null;
      // Si déjà ISO avec Z ou +/-, on garde
      if (dateStr.includes('T') && (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('-'))) {
        return new Date(dateStr);
      }
      // Sinon, on force le format ISO UTC
      return new Date(dateStr.replace(' ', 'T') + 'Z');
    }

    const ticketsWithResolution = tickets.map(ticket => {
      const createdDate = parseToUTC(ticket.created_at);
      let resolutionTime = null;
      if (
        ticket.status === 'closed' &&
        ticket.closed_at &&
        typeof ticket.closed_at === 'string' &&
        ticket.closed_at.trim() !== ''
      ) {
        const closedDate = parseToUTC(ticket.closed_at);
        resolutionTime = closedDate.getTime() - createdDate.getTime();
        // DEBUG
        console.log('DEBUG ticket:', ticket.id, 'created:', ticket.created_at, 'closed:', ticket.closed_at, 'parsed created:', createdDate, 'parsed closed:', closedDate, 'resolutionTime:', resolutionTime);
      }
      return { ...ticket, resolution_time: resolutionTime };
    });

    // Calculer les statistiques
    // validResolvedTickets doit inclure uniquement les tickets valides pour le calcul de la moyenne
    const validResolvedTickets = ticketsWithResolution.filter(ticket => 
      ticket.resolution_time !== null && !isNaN(ticket.resolution_time) && ticket.resolution_time > 0
    );
    
    const averageResolutionTime = calculateAverageResolutionTime(validResolvedTickets);

    const stats = {
      total: ticketsWithResolution.length,
      resolved: validResolvedTickets.length, // Nombre de tickets réellement résolus avec un temps positif
      byStatus: ticketsWithResolution.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {}),
      byType: ticketsWithResolution.reduce((acc, ticket) => {
        acc[ticket.type] = (acc[ticket.type] || 0) + 1;
        return acc;
      }, {}),
      byCategory: ticketsWithResolution.reduce((acc, ticket) => {
        acc[ticket.station] = (acc[ticket.station] || 0) + 1;
        return acc;
      }, {}),
      averageResolutionTime: averageResolutionTime,
      timeSeries: groupTicketsByTime(ticketsWithResolution, groupBy)
    };

    // Log statistics for debugging
    console.log('Reporting Statistics:', {
      totalTickets: stats.total,
      resolvedTickets: stats.resolved,
      averageResolutionTime: stats.averageResolutionTime,
      statusBreakdown: stats.byStatus
    });

    res.json({
      tickets: ticketsWithResolution,
      stats
    });
  } catch (error) {
    console.error('Error while generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fonction utilitaire pour calculer le temps moyen de résolution
function calculateAverageResolutionTime(resolvedTickets) {
  // Cette fonction reçoit déjà les tickets validés avec un resolution_time positif
  if (resolvedTickets.length === 0) return 0;

  const totalTime = resolvedTickets.reduce((sum, ticket) => sum + ticket.resolution_time, 0);

  // Convertir en heures pour plus de lisibilité
  return (totalTime / resolvedTickets.length) / (1000 * 60 * 60);
}

// Fonction utilitaire pour grouper les tickets par période
function groupTicketsByTime(tickets, groupBy) {
  const groups = {};

  tickets.forEach(ticket => {
    const date = new Date(ticket.created_at);
    let key;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
        break;
      case 'month':
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    groups[key] = (groups[key] || 0) + 1;
  });

  return Object.entries(groups).map(([label, count]) => ({
    label,
    count
  }));
}

// Fonction utilitaire pour obtenir le numéro de semaine
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Réinitialisation du mot de passe via token (reset sécurisé côté serveur)
app.post('/reset-password', async (req, res) => {
  const { access_token, new_password } = req.body;

  if (!access_token || !new_password) {
    return res.status(400).json({ error: 'Token ou mot de passe manquant.' });
  }

  // Vérifier le token et récupérer l'utilisateur
  const { data: userData, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !userData || !userData.user) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }

  // Mettre à jour le mot de passe
  const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
    password: new_password,
  });

  if (updateError) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe.' });
  }

  return res.json({ success: true });
});

// Vérifie si un utilisateur existe par email
app.get('/check-user-exists', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const userExists = data.users.some(user => user.email === email);
    res.json({ exists: userExists });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 10000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});


