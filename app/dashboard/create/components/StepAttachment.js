import React from 'react';

export default function StepAttachment({ imagePreview, fileInputRef, handleImageChange, handleDrop, handleDragOver, handlePrev, handleSubmit }) {
  return (
    <div className="space-y-6 text-black">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Image (optionnel)
        </label>
        <div
          className="w-full h-40 border-2 border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-pink-50 hover:bg-pink-100 relative transition"
          onDrop={handleDrop}
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
            </>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={handlePrev} className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition cursor-pointer font-semibold shadow">Previous</button>
        <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer font-semibold shadow">Créer le ticket</button>
      </div>
    </div>
  );
} 