"use client"
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TicketStepper from './components/TicketStepper';
import StepTitle from './components/StepTitle';
import StepTicketInfo from './components/StepTicketInfo';
import StepClientInfo from './components/StepClientInfo';
import StepAttachment from './components/StepAttachment';
import { getTicketById, sendTicketToBackend, getClientToken, uploadTicketFiles } from '@/services/ticketservice';
import { sendTicketNotificationEmail } from '@/services/emailService';

const API_URL_LOCAL = "http://localhost:10000";

const steps = [
  { label: "ticket information", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) },
  { label: "Client", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { label: "attachment", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486l6.586-6.586" /></svg>
  ) },
];

const stepTitles = [
  {
    title: "ticket information",
    desc: "Fill in the main ticket information."
  },
  {
    title: "client information",
    desc: "fill in the client information."
  },
  {
    title: "add a file",
    desc: "add a file to the ticket (optional)."
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
    files: [],
    waitingClient: false,
    resolutionComment: '',
  });
  const [fileList, setFileList] = useState([]);
  const fileInputRef = useRef();

  // Gestion de l'upload de fichiers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setTicket({ ...ticket, files: [...ticket.files, ...files] });
      setFileList([...fileList, ...files]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setTicket({ ...ticket, files: [...ticket.files, ...files] });
      setFileList([...fileList, ...files]);
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
      // Check required fields
      if (!ticket.client || !ticket.station) {
        setMessage({ type: 'error', text: 'Please select a client and a station.' });
        setIsLoading(false);
        return;
      }

      const token = getClientToken();
      console.log('TOKEN AVANT CREATION:', token);
      console.log('Fichiers à uploader:', ticket.files);

      // First upload files if any
      let uploadedFiles = [];
      if (ticket.files && ticket.files.length > 0) {
        try {
          console.log('Starting file upload...');
          uploadedFiles = await uploadTicketFiles(ticket.files, token);
          console.log('Files uploaded successfully:', uploadedFiles);
        } catch (uploadError) {
          console.error('Detailed error during file upload:', uploadError);
          setMessage({ type: 'error', text: 'Error while uploading files. The ticket will be created without the files.' });
        }
      }

      // Create the ticket with the uploaded file URLs
      const ticketData = {
        ...ticket,
        files: uploadedFiles // Utiliser les fichiers uploadés au lieu des objets File
      };

      const backendResponse = await sendTicketToBackend(ticketData, token);
      const ticketId = Array.isArray(backendResponse) ? backendResponse[0]?.id : backendResponse?.id;
      if (!ticketId) throw new Error("Unable to retrieve the created ticket ID");
      
      // Send notification email to client
      if (ticket.clientEmail) {
        try {
          await sendTicketNotificationEmail(
            ticketId,
            ticket.clientEmail,
            token,
            null, // Pas de message personnalisé, utiliser le template par défaut
            null, // Pas de sujet personnalisé, utiliser le template par défaut
            true // isClientEmail = true pour ne pas inclure le lien vers le ticket
          );
        } catch (emailError) {
          console.error('Error while sending email to client:', emailError);
        }
      }
      // Send notification email to admin
      try {
        const creatorEmail = getCreatorEmail();
        await sendTicketNotificationEmail(
          ticketId,
          "support@asbumenos.net",//support@asbumenos.net
          token,
          null, // Pas de message personnalisé, utiliser le template par défaut
          null, // Pas de sujet personnalisé, utiliser le template par défaut
          false // isClientEmail = false pour inclure le lien vers le ticket
        );
      } catch (emailError) {
        console.error('Error while sending email to admin:', emailError);
      }
      
      setMessage({ type: 'success', text: 'Ticket created successfully!' });
      setTimeout(() => {
        router.push('/dashboard/tickets');
      }, 2000);
    } catch (err) {
      console.error('Error during ticket creation:', err);
      setMessage({ type: 'error', text: err.message || 'Error while sending ticket to backend' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCreatorEmail = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed && parsed.email) return parsed.email;
          if (typeof parsed === 'string') return parsed;
        } catch {
          if (typeof user === 'string') return user;
        }
      }
    }
    return 'unknown';
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
                fileList={fileList}
                fileInputRef={fileInputRef} 
                handleFileChange={handleFileChange} 
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