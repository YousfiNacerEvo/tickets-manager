require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// ===== CONFIGURATION =====
// Mettez vos informations ici ou dans le fichier .env

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'test@example.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'your-email@example.com'; // Changez ceci pour recevoir le test

// ===========================

console.log('🧪 Test de configuration SendGrid\n');
console.log('='.repeat(50));

// Vérifier que la clé API est définie
if (!SENDGRID_API_KEY) {
  console.error('❌ ERREUR: SENDGRID_API_KEY n\'est pas définie');
  console.error('\n💡 Pour corriger:');
  console.error('   1. Ajoutez SENDGRID_API_KEY=votre_clé dans votre fichier .env');
  console.error('   2. Ou exportez la variable: export SENDGRID_API_KEY=votre_clé');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   API Key: ${SENDGRID_API_KEY.substring(0, 10)}...`);
console.log(`   From: ${FROM_EMAIL}`);
console.log(`   To: ${TEST_EMAIL}`);
console.log('='.repeat(50) + '\n');

// Configurer SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

// Préparer le message de test
const msg = {
  to: TEST_EMAIL,
  from: FROM_EMAIL,
  subject: '🧪 Test Email from SendGrid',
  text: 'Si vous recevez cet email, votre configuration SendGrid fonctionne correctement!',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">✅ Test SendGrid réussi!</h2>
      <p>Si vous recevez cet email, votre configuration SendGrid fonctionne correctement!</p>
      <hr style="border: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #666; font-size: 14px;">
        <strong>Configuration testée:</strong><br>
        API Key: ${SENDGRID_API_KEY.substring(0, 10)}...<br>
        From: ${FROM_EMAIL}<br>
        Date: ${new Date().toLocaleString('fr-FR')}
      </p>
    </div>
  `,
};

// Envoyer l'email de test
console.log('📤 Envoi de l\'email de test...\n');

sgMail
  .send(msg)
  .then((response) => {
    console.log('✅ Email envoyé avec succès!');
    console.log(`   Status Code: ${response[0].statusCode}`);
    console.log(`   Headers: ${JSON.stringify(response[0].headers, null, 2)}`);
    console.log('\n🎉 Votre configuration SendGrid est correcte!');
    console.log(`📧 Vérifiez votre boîte mail: ${TEST_EMAIL}`);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'envoi de l\'email:\n');
    
    if (error.response) {
      console.error(`   Status Code: ${error.response.statusCode}`);
      console.error(`   Body: ${JSON.stringify(error.response.body, null, 2)}`);
      
      // Messages d'erreur courants
      if (error.response.body.errors) {
        console.error('\n💡 Erreurs détectées:');
        error.response.body.errors.forEach((err, index) => {
          console.error(`   ${index + 1}. ${err.message}`);
          
          // Suggestions pour les erreurs courantes
          if (err.message.includes('does not match a verified Sender Identity')) {
            console.error('      ➡️ Vérifiez votre expéditeur dans SendGrid:');
            console.error('         https://app.sendgrid.com/settings/sender_auth/senders');
          }
          if (err.message.includes('API key')) {
            console.error('      ➡️ Vérifiez votre clé API dans SendGrid:');
            console.error('         https://app.sendgrid.com/settings/api_keys');
          }
        });
      }
    } else {
      console.error(`   Message: ${error.message}`);
      console.error(`   Code: ${error.code}`);
    }
    
    console.error('\n📚 Resources:');
    console.error('   - Documentation: https://docs.sendgrid.com/');
    console.error('   - Status: https://status.sendgrid.com/');
    console.error('   - Support: https://support.sendgrid.com/');
    
    process.exit(1);
  });

