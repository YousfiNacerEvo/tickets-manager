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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: function (req, file, cb) {
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

    // Récupérer l'ancien statut du ticket
    const { data: oldTicketData, error: oldTicketError } = await supabase
      .from('tickets')
      .select('status, client_email')
      .eq('id', id)
      .single();

    if (oldTicketError) {
      console.error('Error fetching old ticket data:', oldTicketError);
    }

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

    // Note: Email notifications are now handled by the frontend to avoid duplicates
    // The frontend will send the appropriate email when status changes

    res.json(data);
  } catch (error) {
    console.error('Error while updating the ticket:', error);
    res.status(500).json({ error: 'Server error while updating the ticket' });
  }
});

// Function to sanitize filename for Supabase Storage
function sanitizeFileName(originalName) {
  // Remove or replace problematic characters
  return originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length to 100 characters
}

// Route for file upload
app.post('/tickets/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }

    const uploadedUrls = [];
    for (const file of req.files) {
      // Sanitize the filename to avoid Supabase Storage key issues
      const sanitizedFileName = sanitizeFileName(file.originalname);
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      
      console.log('Original filename:', file.originalname);
      console.log('Sanitized filename:', fileName);
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: error.message });
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      uploadedUrls.push(publicUrlData.publicUrl);
    }
    res.json({ urls: uploadedUrls });
  } catch (error) {
    console.error('Error while uploading files to Supabase:', error);
    res.status(500).json({ error: 'Error while uploading files to Supabase' });
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

// Configuration du transporteur email (SMTP explicite avec pool et timeouts)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: String(process.env.EMAIL_SECURE || 'true') === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 20000,
  socketTimeout: 20000,
  greetingTimeout: 10000
});

// Essai de vérification de la connexion SMTP au démarrage
transporter.verify().then(() => {
  console.log('SMTP transporter ready');
}).catch((err) => {
  console.warn('SMTP transporter verify failed:', err?.code || err?.message || err);
});

// Endpoint pour l'envoi d'email de notification de ticket
app.post('/api/send-ticket', authenticateToken, async (req, res) => {
  try {
    const { ticketId, userEmail, message, subject, isClientEmail = false, isUpdate = false } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'ticketId est requis'
      });
    }

    // Récupérer les informations du ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticketData) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    // Récupérer les commentaires du ticket
    const { data: comments, error: commentsError } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Correction : définir ticketUrl avant de l'utiliser dans le template
    const ticketUrl = `https://tickets-manager-kappa.vercel.app/dashboard/tickets/${ticketId}`;

    let commentsHtml = '';
    if (comments && comments.length > 0) {
      commentsHtml = `<div style="margin-top:30px;">
        <h3 style="color:#222; margin-bottom:8px;">Comments:</h3>
        <ul style="padding-left:0; list-style:none;">
          ${comments.map(c => `
            <li style="margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
              <div><b>${c.user_email || 'Utilisateur'}</b> <span style="color:#888; font-size:12px;">(${new Date(c.created_at).toLocaleString('fr-FR')})</span></div>
              <div style="margin-top:2px;">${c.content}</div>
            </li>
          `).join('')}
        </ul>
      </div>`;
    }

    let resolutionHtml = '';
    if (ticketData.resolution_comment) {
      resolutionHtml = `<div style="margin-top:30px;">
        <h3 style="color:#222; margin-bottom:8px;">Resolution note:</h3>
        <div style="background:#f6f6f6; border-radius:5px; padding:10px 15px;">${ticketData.resolution_comment}</div>
      </div>`;
    }

    // Template d'email avec les informations demandées
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Subject: ${ticketData.title}</h2>
        <p><strong>Priority:</strong> ${ticketData.priority}</p>
        <p><strong>Service:</strong> ${ticketData.station}</p>
        <p><strong>Ticket ID:</strong> ID_${ticketId}</p>
        ${isUpdate ? `<p><strong>Status:</strong> ${ticketData.status}</p>` : ''}
        ${isUpdate ? `<p><strong>Ticket has been updated</strong></p>` : ''}
        ${!isClientEmail ? `<p><strong>Click here to view the ticket:</strong> <a href="${ticketUrl}">ID_${ticketId}</a></p>` : ''}
        ${!isClientEmail ? `<p><strong>Ticket created by:</strong> ${ticketData.user_email}</p>` : ''}
        ${commentsHtml}
        ${resolutionHtml}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <p style="margin: 0; font-weight: bold;">*ASBU ,News and Programmes Exchange Center - Algiers</p>
          <p style="margin: 5px 0;">: E-mail: support@asbumenos.net</p>
          <p style="margin: 5px 0;">: Site web: www.asbu.net / www.asbucenter.dz</p>
          <p style="margin: 5px 0;">**************************************************</p>
          <p style="margin: 5px 0;">MENOS VoIP : 4001/ 4002</p>
          <p style="margin: 5px 0;">HOTLINE:+213 20 40 68 20</p>
          <p style="margin: 5px 0;">GSM NOC :+213 667 32 54 13</p>
        </div>
      </div>
    `;

    // Déterminer le statut en anglais pour l'objet de l'email
    const getStatusInEnglish = (status) => {
      switch (status) {
        case 'open': return 'Open';
        case 'in_progress': return 'In Progress';
        case 'closed': return 'Closed';
        case 'waiting_client': return 'Waiting for Client';
        default: return status;
      }
    };
    const statusInEnglish = getStatusInEnglish(ticketData.status);

    // Générer l'objet dynamiquement selon le contexte
    let subjectToSend = subject;
    if (!subjectToSend) {
      if (isClientEmail && isUpdate) {
        subjectToSend = `Ticket (ID_${ticketId}) - Status updated to ${statusInEnglish}`;
      } else if (isUpdate) {
        subjectToSend = `Ticket (ID_${ticketId}) - Ticket updated`;
      } else {
        subjectToSend = `Ticket (ID_${ticketId}) - New ticket created`;
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subjectToSend,
      html: message ? `<p>${message}</p>` : emailTemplate
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.json({
        success: true,
        message: 'Email envoyé avec succès'
      });
    } catch (smtpError) {
      console.error('Erreur SMTP, tentative de fallback HTTP:', smtpError?.code || smtpError?.message || smtpError);
      // Fallback via API HTTP (Resend) si disponible pour contourner les blocages SMTP
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        try {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
              to: userEmail,
              subject: subjectToSend,
              html: message ? `<p>${message}</p>` : emailTemplate
            })
          });
          if (!resp.ok) {
            const body = await resp.text().catch(() => '');
            throw new Error(`Resend API error: ${resp.status} ${resp.statusText} ${body}`);
          }
          return res.json({ success: true, message: 'Email envoyé via fallback API' });
        } catch (fallbackErr) {
          console.error('Fallback API failure:', fallbackErr?.message || fallbackErr);
          // Continue vers le handler d'erreur principal ci-dessous
        }
      }
      throw smtpError;
    }
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


