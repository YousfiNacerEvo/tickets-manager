import React from 'react';

export default function StepAttachment({ fileList, fileInputRef, handleFileChange, handleDrop, handleDragOver, handlePrev, handleSubmit, isLoading }) {
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Vérifier la taille totale des fichiers (max 20MB)
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 20 * 1024 * 1024) {
        alert('Total file size should not exceed 20MB');
        return;
      }
      
      handleFileChange(e);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Vérifier la taille totale des fichiers (max 20MB)
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 20 * 1024 * 1024) {
        alert('Total file size should not exceed 20MB');
        return;
      }
      
      const event = {
        target: {
          files: e.dataTransfer.files
        }
      };
      handleFileChange(event);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
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

  return (
    <div className="space-y-6 text-black">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          File (optionnel)
        </label>
        <div
          className="w-full min-h-40 border-2 border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-pink-50 hover:bg-pink-100 relative transition p-4"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current.click()}
        >
          {fileList && fileList.length > 0 ? (
            <div className="w-full space-y-2">
              {fileList.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow">
                  {getFileIcon(file)}
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 text-pink-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-pink-400">Drag and drop files or click to select</span>
              <span className="text-xs text-gray-500 mt-2">Maximum total size: 20MB</span>
            </>
          )}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
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
            'Create ticket'
          )}
        </button>
      </div>
    </div>
  );
} 