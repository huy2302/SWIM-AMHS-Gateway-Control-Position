import React from 'react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  confirmClass = "bg-rose-600 hover:bg-rose-700",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onCancel}>
      <div className="w-[440px] max-w-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{title}</h3>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 text-xs text-slate-600 leading-relaxed font-medium">
          {message}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
