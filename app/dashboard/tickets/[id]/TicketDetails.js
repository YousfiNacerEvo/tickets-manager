'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateTicket, uploadTicketFiles, getTicketComments, addTicketComment, getClientToken } from '@/services/ticketservice';

export default function TicketDetails({ ticket }) {
  ticket = ticket[0]; 
  console.log('Ticketqdkfkjqdmsf:', ticket);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const fileInputRef = useRef();
  const commentsEndRef = useRef(null);
  
  const formatFileUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    // Remove any duplicate domain
    const baseUrl = 'https://gestion-ticket-back-78nj.onrender.com';
    if (url.startsWith(baseUrl + baseUrl)) {
      return url.replace(baseUrl + baseUrl, baseUrl);
    }
    return url;
  };

  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    type: ticket.type,
    waitingClient: ticket.waiting_client,
    client: ticket.client,
    station: ticket.station,
    clientPhone: ticket.client_phone,
    clientEmail: ticket.client_email,
    files: Array.isArray(ticket.files) ? 
      ticket.files.map(file => {
        if (typeof file === 'string') {
          return { url: formatFileUrl(file.trim()) };
        } else if (file && typeof file === 'object' && file.url) {
          return { url: formatFileUrl(file.url.trim()) };
        }
        return { url: '' };
      }).filter(file => file.url !== '') : 
      (ticket.files ? 
        ticket.files.split(',').map(url => {
          if (typeof url === 'string') {
            return { url: formatFileUrl(url.trim()) };
          }
          return { url: '' };
        }).filter(file => file.url !== '') : 
        []),
    resolutionComment: ticket.resolution_comment || '',
  });

  useEffect(() => {
    fetchComments();
  }, [ticket.id]);

  const fetchComments = async () => {
    try {
      const token = getClientToken();
      console.log('TOKEN CLIENT TicketDetails:', token);
      const commentsData = await getTicketComments(ticket.id, token);
      console.log('Commentaires récupérés:', commentsData);
      setComments(commentsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
    }
  };

  const handleAddComment = async () => {
    setIsSubmittingComment(true);
    try {
      const token = getClientToken();
      console.log('TOKEN CLIENT addTicketComment:', token);
      await addTicketComment(ticket.id, newComment, token);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        const token = getClientToken();
        console.log('Token récupéré:', token);
        if (!token) {
          throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
        }
        const fileUrls = await uploadTicketFiles(files, token);
        console.log('File URLs received:', fileUrls); // Debug log

        // Ensure we're working with an array of strings
        let formattedUrls = [];
        if (Array.isArray(fileUrls)) {
          formattedUrls = fileUrls.map(url => {
            if (typeof url === 'string') {
              return { url: formatFileUrl(url.trim()) };
            } else if (url && typeof url === 'object' && url.url) {
              return { url: formatFileUrl(url.url.trim()) };
            }
            return { url: '' };
          }).filter(file => file.url !== '');
        } else if (typeof fileUrls === 'string') {
          formattedUrls = [{ url: formatFileUrl(fileUrls.trim()) }];
        } else if (fileUrls && typeof fileUrls === 'object' && fileUrls.url) {
          formattedUrls = [{ url: formatFileUrl(fileUrls.url.trim()) }];
        }

        setFormData(prev => ({ 
          ...prev, 
          files: [...prev.files, ...formattedUrls]
        }));
      } catch (error) {
        console.error('Erreur lors de l\'upload des fichiers:', error);
        alert(error.message || 'Erreur lors de l\'upload des fichiers');
      }
    }
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setIsFileModalOpen(true);
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedData = {
        ...formData,
        closed_at: null,
        waiting_client: formData.waitingClient || false,
        client_phone: formData.clientPhone,
        client_email: formData.clientEmail,
        resolution_comment: formData.resolutionComment
      };

      const token = getClientToken();
      console.log('TOKEN CLIENT updateTicket:', token);
      await updateTicket(ticket.id, updatedData, token);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du ticket:', error);
      alert(error.message || 'Erreur lors de la mise à jour du ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      date.setHours(date.getHours() ); // Soustraire une heure pour corriger le décalage UTC+1
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '--';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Ticket Details #{ticket.id}</h1>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
              disabled={isLoading}
            >
              {isEditing ? 'Cancel' : 'update'}
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{ticket.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                {isEditing ? (
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ticket.priority}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="closed">closed</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ticket.status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                {isEditing ? (
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="requeste">Requeste</option>
                    <option value="incident">incident</option>
                  </select>
                ) : (
                  <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                    {ticket.type}
                  </span>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  {isEditing ? (
                    <select
                      name="client"
                      value={formData.client}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a client</option>
                      {[
                        "TDA Algerian VN", "AbuDhabi", "Sharjah", "NOC", "KSA", "Palastine", 
                        "Egypt", "Dubai", "Oman", "Moroco", "Algeria", "Qatar", "Kuwait", 
                        "Libya", "Mauritania", "HQ ASBU", "HUB", "Tunisia", "Iraq", 
                        "Bahrain", "Sudan", "Jordan", "Teleliban"
                      ].map((client) => (
                        <option key={client} value={client}>
                          {client}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{ticket.client}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                  {isEditing ? (
                    <select
                      name="station"
                      value={formData.station}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a station</option>
                      {["Radio", "TV", "HUB"].map((station) => (
                        <option key={station} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{ticket.station}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{ticket.client_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{ticket.client_phone}</p>
                  )}
                </div>

                <div className="md:col-span-2 flex items-center gap-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waiting Client</label>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="waitingClient"
                      checked={formData.waitingClient}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  ) : (
                    <span className="ml-2 text-gray-900 font-semibold">{formData.waitingClient ? 'yes' : 'No'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Resolution comment</h2>
              {isEditing ? (
                <textarea
                  name="resolutionComment"
                  value={formData.resolutionComment}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="add resolution comment"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{ticket.resolution_comment || <span className='text-gray-400'>Aucun commentaire</span>}</p>
              )}
            </div>

            {/* Files Section */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Files</h2>
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <div className="w-full max-w-md">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => fileInputRef.current.click()}>
                      {formData.files && formData.files.length > 0 ? (
                        <div className="space-y-2">
                          {formData.files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow">
                              {getFileIcon(file)}
                              <span className="text-sm text-gray-700 truncate">
                                {file.name || file.filename || `File ${index + 1}`}
                              </span>
                              {file.size && (
                                <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({
                                    ...prev,
                                    files: prev.files.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2">Click to add files</p>
                          <p className="text-xs text-gray-400 mt-1">Maximum total size: 20MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  formData.files && formData.files.length > 0 && (
                    <div className="w-full max-w-md space-y-2">
                      {formData.files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-2 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50"
                          onClick={() => handleFileClick(file)}
                        >
                          {getFileIcon(file)}
                          <span className="text-sm text-gray-700 truncate">
                            {file.name || file.filename || `File ${index + 1}`}
                          </span>
                          {file.size && (
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          )}
                          <a 
                            href={formatFileUrl(file.url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/tickets')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </form>

          {/* Comments Section - Outside the main form */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Comment</h2>
            
            {/* Comments List */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">{comment.user_email}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Form */}
            <div className="mt-4">
              <div className="flex gap-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="add comment"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm resize-none text-black"
                  rows="3"
                />
                <button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className={`px-4 py-2 rounded-lg text-white ${
                    isSubmittingComment || !newComment.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors duration-200 flex items-center gap-2`}
                >
                  {isSubmittingComment ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    'Commenter'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Modal */}
      {isFileModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">File Preview</h3>
              <button
                onClick={() => setIsFileModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedFile.type?.startsWith('image/') ? (
              <img 
                src={formatFileUrl(selectedFile.url)} 
                alt="File preview" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-gray-600">Preview not available</p>
                <a 
                  href={formatFileUrl(selectedFile.url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 