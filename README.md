This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Ticket Management System

Un système de gestion de tickets avec authentification, notifications par email et reporting.

## Fonctionnalités

- 🎫 Création et gestion de tickets
- 📧 Notifications par email via **SendGrid**
- 📊 Tableaux de bord et statistiques
- 👥 Gestion des utilisateurs
- 💬 Commentaires sur les tickets
- 📎 Pièces jointes
- 🔐 Authentification sécurisée avec Supabase

## Configuration

### 1. Installation des dépendances

```bash
# Installation frontend
npm install

# Installation backend
cd server
npm install
```

### 2. Configuration de l'email (SendGrid)

Le projet utilise **SendGrid** pour l'envoi d'emails (remplaçant Nodemailer).

1. Créez un compte sur [SendGrid](https://sendgrid.com)
2. Créez une clé API avec les permissions "Mail Send"
3. Vérifiez votre email d'expéditeur dans SendGrid
4. Ajoutez les variables d'environnement dans `server/.env`:

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@example.com
```

📖 **Documentation détaillée**: Voir [server/SENDGRID_CONFIG.md](server/SENDGRID_CONFIG.md)

### 3. Tester la configuration email

```bash
cd server
node test-sendgrid.js
```

## Getting Started

### Frontend

Lancez le serveur de développement:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Backend

Lancez le serveur Express:

```bash
cd server
npm start
```

Le serveur API sera disponible sur [http://localhost:10000](http://localhost:10000).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
