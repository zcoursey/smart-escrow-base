import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const ImageViewer = ({ photo, onClose }) => {
    if (!photo) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
            onClick={onClose}
        >
            <div className="relative max-w-5xl w-full flex justify-center">
                <button 
                    onClick={onClose}
                    className="absolute -top-4 -right-2 md:-right-4 bg-gray-600 text-white rounded-full p-2 hover:bg-gray-500 transition opacity-100 shadow-lg z-[101]"
                >
                    <X size={24} />
                </button>
                <img 
                    src={photo} 
                    alt="Enlarged view" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>,
        document.body
    );
};

export default ImageViewer;
