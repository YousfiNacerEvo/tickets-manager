import React, { useState } from 'react';

export default function StepClientInfo({ ticket, handleChange, handleNext, handlePrev }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const clients = [
    "TDA Algerian VN", "AbuDhabi", "Sharjah", "NOC", "KSA", "Palastine", 
    "Egypt", "Dubai", "Oman", "Moroco", "Algeria", "Qatar", "Kuwait", 
    "Libya", "Mauritania", "HQ ASBU", "HUB", "Tunisia", "Iraq", 
    "Bahrain", "Sudan", "Jordan", "Teleliban", "Other"
  ];

  const stations = ["Radio", "TV", "HUB"];

  const handleClientChange = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setShowCustomInput(true);
      // Réinitialiser le client quand on sélectionne Other
      handleChange({ target: { name: 'client', value: '' } });
    } else {
      setShowCustomInput(false);
      handleChange(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          {!showCustomInput ? (
            <select
              name="client"
              value={ticket.client || ''}
              onChange={handleClientChange}
              className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                name="client"
                value={ticket.client || ''}
                onChange={handleChange}
                className="w-full px-4 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                placeholder="Entrez le nom du client"
                required
              />
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Retour à la liste
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
          <select
            name="station"
            value={ticket.station || ''}
            onChange={handleChange}
            className="w-full text-black placeholder:text-gray[300] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
            required
          >
            <option value="">Sélectionner une station</option>
            {stations.map((station) => (
              <option key={station} value={station}>
                {station}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="clientEmail"
            value={ticket.clientEmail || ''}
            onChange={handleChange}
            className="w-full px-4 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="clientPhone"
            value={ticket.clientPhone || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
            required
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={handlePrev}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Suivant
        </button>
      </div>
    </div>
  );
} 