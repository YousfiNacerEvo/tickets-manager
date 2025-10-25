# Guide de migration: Nodemailer → SendGrid

## ✅ Migration terminée

Votre projet utilise maintenant **SendGrid** au lieu de **Nodemailer** pour l'envoi d'emails.

## 🔄 Changements effectués

### 1. Packages
- ❌ Supprimé: `nodemailer`
- ✅ Ajouté: `@sendgrid/mail`

### 2. Fichiers modifiés
- **server/server.js**: Code email mis à jour pour utiliser SendGrid
- **server/package.json**: Dépendances mises à jour
- **package.json** (racine): Dépendances mises à jour
- **README.md**: Documentation mise à jour

### 3. Fichiers supprimés
- ~~server/NODEMAILER_CONFIG.md~~
- ~~server/SMTP_TROUBLESHOOTING.md~~
- ~~server/test-smtp.js~~

### 4. Fichiers créés
- ✅ **server/SENDGRID_CONFIG.md**: Documentation complète SendGrid
- ✅ **server/test-sendgrid.js**: Script de test SendGrid
- ✅ **server/MIGRATION_GUIDE.md**: Ce guide

## 📋 Prochaines étapes

### Étape 1: Configurer SendGrid

1. Créez un compte SendGrid gratuit sur [https://sendgrid.com](https://sendgrid.com)
2. Créez une clé API avec les permissions "Mail Send"
3. Vérifiez votre email d'expéditeur

### Étape 2: Mettre à jour les variables d'environnement

Modifiez votre fichier `server/.env`:

#### ❌ AVANT (Nodemailer/SMTP)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

#### ✅ APRÈS (SendGrid)
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your-verified-email@example.com
```

💡 **Vous pouvez supprimer** les anciennes variables `EMAIL_*` si vous ne les utilisez plus ailleurs.

### Étape 3: Tester la configuration

```bash
cd server
npm install  # Installer @sendgrid/mail
node test-sendgrid.js  # Tester l'envoi d'email
```

### Étape 4: Démarrer le serveur

```bash
cd server
npm start
```

Vous devriez voir:
```
✅ SendGrid configured successfully
📧 Emails will be sent from: your-email@example.com
```

## 🐛 Dépannage

### Erreur: "Cannot find module '@sendgrid/mail'"
➡️ Exécutez: `cd server && npm install`

### Erreur: "No email service configured"
➡️ Ajoutez `SENDGRID_API_KEY` dans votre fichier `.env`

### Erreur: "The from address does not match a verified Sender Identity"
➡️ Vérifiez votre expéditeur dans SendGrid:
   https://app.sendgrid.com/settings/sender_auth/senders

## 📊 Comparaison: Avant vs Après

| Aspect | Nodemailer (SMTP) | SendGrid (API) |
|--------|-------------------|----------------|
| **Configuration** | 6+ variables | 2 variables |
| **Ports** | 25, 465, 587, 2525 | API REST (443) |
| **Problèmes hébergeurs** | Fréquents | Aucun |
| **Timeouts** | Fréquents | Rares |
| **Délivrabilité** | Variable | Excellente |
| **Limites gratuites** | Dépend du fournisseur | 100/jour |

## 🎯 Avantages de la migration

- ✅ **Plus simple**: 2 variables au lieu de 6+
- ✅ **Plus fiable**: Pas de ports bloqués
- ✅ **Plus rapide**: API REST au lieu de SMTP
- ✅ **Meilleure délivrabilité**: Infrastructure SendGrid
- ✅ **Fonctionne partout**: Render, Heroku, Vercel, etc.

## 📚 Documentation

- **Configuration détaillée**: [SENDGRID_CONFIG.md](SENDGRID_CONFIG.md)
- **Documentation SendGrid**: https://docs.sendgrid.com/
- **Node.js Quick Start**: https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs

## ❓ Questions fréquentes

### Est-ce que l'API frontend a changé?
Non, l'endpoint `/api/send-ticket` fonctionne exactement de la même façon.

### Puis-je revenir à Nodemailer?
Oui, mais ce n'est pas recommandé. Les commits Git contiennent l'ancien code si nécessaire.

### Combien coûte SendGrid?
- **Gratuit**: 100 emails/jour
- **Essentials**: $19.95/mois pour 50,000 emails
- Voir: https://sendgrid.com/pricing/

### Où trouver ma clé API?
https://app.sendgrid.com/settings/api_keys

### Comment vérifier mon email d'expéditeur?
https://app.sendgrid.com/settings/sender_auth/senders

## 💬 Support

Si vous avez des questions ou des problèmes:
1. Consultez [SENDGRID_CONFIG.md](SENDGRID_CONFIG.md)
2. Testez avec `node test-sendgrid.js`
3. Vérifiez le statut SendGrid: https://status.sendgrid.com/

---

**Date de migration**: ${new Date().toLocaleDateString('fr-FR')}

