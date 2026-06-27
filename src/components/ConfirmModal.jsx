

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  confirmClass = "bg-red-500 hover:bg-red-400",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-250/80 shadow-2xl overflow-hidden animate-zoom-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-600 shadow-xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>

              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
          <button
            onClick={onCancel}
            className="rounded-lg bg-white border border-slate-350 hover:bg-slate-50 px-4 py-2.5 text-xs text-slate-700 font-semibold cursor-pointer transition active:scale-95 shadow-xs"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-xs font-semibold text-white cursor-pointer transition active:scale-95 shadow-sm hover:shadow ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
