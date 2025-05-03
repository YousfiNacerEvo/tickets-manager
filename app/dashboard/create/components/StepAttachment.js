import React from 'react';

export default function StepAttachment({ imagePreview, fileInputRef, handleImageChange, handleDrop, handleDragOver, handlePrev, handleSubmit, isLoading }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide (JPG, PNG, etc.)');
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      handleImageChange(e);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide (JPG, PNG, etc.)');
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      const event = {
        target: {
          files: [file]
        }
      };
      handleImageChange(event);
    }
  };

  return (
    <div className="space-y-6 text-black">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Image (optionnel)
        </label>
        <div
          className="w-full h-40 border-2 border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-pink-50 hover:bg-pink-100 relative transition"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="h-full object-contain rounded-lg shadow" />
          ) : (
            <>
              <svg className="w-12 h-12 text-pink-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-pink-400">Glissez-déposez une image ou cliquez pour sélectionner</span>
              <span className="text-xs text-gray-500 mt-2">Formats acceptés : JPG, PNG (max 5MB)</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <button 
          type="button" 
          onClick={handlePrev} 
          className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition cursor-pointer font-semibold shadow"
          disabled={isLoading}
        >
          Previous
        </button>
        <button 
          type="submit" 
          className={`bg-blue-600 text-white px-8 py-2 rounded-lg transition cursor-pointer font-semibold shadow flex items-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Création en cours...
            </>
          ) : (
            'Créer le ticket'
          )}
        </button>
      </div>
    </div>
  );
} 