# Configuration SendGrid

Le serveur utilise maintenant **SendGrid** pour l'envoi d'emails via leur API REST.

## Pourquoi SendGrid ?

SendGrid est plus simple et plus fiable que SMTP :
- ✅ Pas de problèmes de ports bloqués
- ✅ Meilleure délivrabilité
- ✅ API REST simple et rapide
- ✅ Pas de timeouts de connexion
- ✅ Fonctionne sur tous les hébergeurs (Render, Heroku, Vercel, etc.)

## Configuration

### 1. Créer un compte SendGrid

1. Allez sur [https://sendgrid.com](https://sendgrid.com)
2. Créez un compte gratuit (100 emails/jour gratuits)
3. Vérifiez votre email

### 2. Créer une clé API

1. Connectez-vous à SendGrid
2. Allez dans **Settings** > **API Keys**
3. Cliquez sur **Create API Key**
4. Donnez un nom à votre clé (ex: "Production Server")
5. Choisissez **Full Access** ou au minimum **Mail Send** permissions
6. Copiez la clé API (vous ne pourrez plus la voir après!)

### 3. Vérifier votre domaine ou email d'expéditeur

Pour envoyer des emails, vous devez vérifier au moins un expéditeur:

#### Option A: Single Sender Verification (plus simple)
1. Allez dans **Settings** > **Sender Authentication** > **Single Sender Verification**
2. Cliquez sur **Create New Sender**
3. Remplissez le formulaire avec votre email
4. Vérifiez l'email que SendGrid vous envoie

#### Option B: Domain Authentication (recommandé pour la production)
1. Allez dans **Settings** > **Sender Authentication** > **Authenticate Your Domain**
2. Suivez les instructions pour ajouter des enregistrements DNS
3. Attendez la vérification (peut prendre quelques heures)

### 4. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env`:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=votre-email@example.com
```

⚠️ **Important**: 
- `SENDGRID_FROM_EMAIL` doit être l'email que vous avez vérifié à l'étape 3
- Ne partagez JAMAIS votre clé API publiquement

## Variables d'environnement

| Variable | Description | Requis | Exemple |
|----------|-------------|--------|---------|
| `SENDGRID_API_KEY` | Clé API SendGrid | ✅ Oui | `SG.xxx...` |
| `SENDGRID_FROM_EMAIL` | Email expéditeur vérifié | ✅ Oui | `support@asbu.net` |

## Démarrer le serveur

```bash
cd server
npm install
npm start
```

Si tout est correctement configuré, vous verrez:
```
✅ SendGrid configured successfully
📧 Emails will be sent from: support@asbu.net
```

## Tester l'envoi d'emails

Utilisez l'endpoint de test:

```bash
curl -X POST http://localhost:10000/api/send-ticket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ticketId": 1,
    "userEmail": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from SendGrid"
  }'
```

## Dépannage

### Erreur: "Service d'email non configuré"
➡️ Vérifiez que `SENDGRID_API_KEY` est définie dans votre `.env`

### Erreur: "The from address does not match a verified Sender Identity"
➡️ Vérifiez que `SENDGRID_FROM_EMAIL` correspond à un expéditeur vérifié dans SendGrid

### Erreur: "Forbidden"
➡️ Votre clé API n'a pas les permissions "Mail Send". Créez une nouvelle clé avec les bonnes permissions.

### Erreur: "Invalid API Key"
➡️ Vérifiez que vous avez copié la clé API complète, elle doit commencer par `SG.`

## Limites du plan gratuit

- **100 emails/jour** gratuitement
- Si vous avez besoin de plus, passez au plan payant ou utilisez plusieurs clés API

## Avantages par rapport à SMTP

| SMTP (Nodemailer) | SendGrid API |
|-------------------|--------------|
| ❌ Ports souvent bloqués | ✅ API REST (port 443) |
| ❌ Timeouts fréquents | ✅ Connexion rapide |
| ❌ Configuration complexe | ✅ Configuration simple |
| ❌ Problèmes avec hébergeurs | ✅ Fonctionne partout |
| ⚠️ Mots de passe d'application | ✅ Clé API sécurisée |

## Documentation officielle

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Node.js Mail Send](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- [API Keys](https://docs.sendgrid.com/ui/account-and-settings/api-keys)

## Support

Si vous avez des questions:
- Documentation SendGrid: https://docs.sendgrid.com/
- Status SendGrid: https://status.sendgrid.com/
- Support SendGrid: https://support.sendgrid.com/

