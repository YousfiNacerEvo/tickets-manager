"use client"
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TicketStepper from './components/TicketStepper';
import StepTitle from './components/StepTitle';
import StepTicketInfo from './components/StepTicketInfo';
import StepClientInfo from './components/StepClientInfo';
import StepAttachment from './components/StepAttachment';
import { getTicketById } from '@/services/ticketservice';
import { sendTicketToBackend } from '@/services/ticketservice';
import { sendTicketNotificationEmail } from '@/services/emailService';

const steps = [
  { label: "Informations du ticket", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) },
  { label: "Client", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { label: "Pièce jointe", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486l6.586-6.586" /></svg>
  ) },
];

const stepTitles = [
  {
    title: "Informations du ticket",
    desc: "Remplissez les informations principales du ticket."
  },
  {
    title: "Informations du client",
    desc: "Renseignez les coordonnées du client lié à ce ticket."
  },
  {
    title: "Ajouter une pièce jointe",
    desc: "Ajoutez une image ou un document lié au ticket (optionnel)."
  }
];

export default function CreateTicket() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [ticket, setTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'request',
    status: 'open',
    client: '',
    station: '',
    clientPhone: '',
    clientEmail: '',
    image: null,
    waitingClient: false,
    resolutionComment: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

  // Gestion de l'upload d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTicket({ ...ticket, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setTicket({ ...ticket, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleChange = (e) => {
    if (e.target.type === 'checkbox') {
      setTicket({ ...ticket, [e.target.name]: e.target.checked });
    } else {
      setTicket({ ...ticket, [e.target.name]: e.target.value });
    }
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Vérification des champs requis
      if (!ticket.client || !ticket.station) {
        setMessage({ type: 'error', text: 'Veuillez sélectionner un client et une station.' });
        setIsLoading(false);
        return;
      }

      const backendResponse = await sendTicketToBackend(ticket);
      const ticketId = Array.isArray(backendResponse) ? backendResponse[0]?.id : backendResponse?.id;
      if (!ticketId) throw new Error("Impossible de récupérer l'identifiant du ticket créé");
      
      // Envoyer l'email de notification
      console.log("cikte",ticket)
      await sendTicketNotificationEmail(ticketId, ticket.userEmail);
      
      setMessage({ type: 'success', text: 'Ticket créé avec succès !' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la création du ticket:', err);
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'envoi du ticket au backend' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="absolute top-6 right-4 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition cursor-pointer shadow"
          >
            Dashboard
          </button>
          <TicketStepper step={step} steps={steps} />
          <StepTitle title={stepTitles[step-1].title} desc={stepTitles[step-1].desc} />
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <StepTicketInfo ticket={ticket} handleChange={handleChange} handleNext={handleNext} />
            )}
            {step === 2 && (
              <StepClientInfo ticket={ticket} handleChange={handleChange} handleNext={handleNext} handlePrev={handlePrev} />
            )}
            {step === 3 && (
              <StepAttachment 
                imagePreview={imagePreview} 
                fileInputRef={fileInputRef} 
                handleImageChange={handleImageChange} 
                handleDrop={handleDrop} 
                handleDragOver={handleDragOver} 
                handlePrev={handlePrev} 
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 