

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-gray-800 shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-6 w-6 text-red-400"
              >
                <path
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                {title}
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-700 p-4">
          <button
            onClick={onCancel}
            className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-white ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
