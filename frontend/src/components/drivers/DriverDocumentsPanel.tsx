import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDriverDocument, uploadDriverDocument, type Driver } from "../../api/drivers";

interface DriverDocumentsPanelProps {
  driver: Driver;
  onClose: () => void;
}

export function DriverDocumentsPanel({ driver, onClose }: DriverDocumentsPanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDriverDocument(driver.id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => deleteDriverDocument(driver.id, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = "";
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{driver.name}'s documents</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {driver.documents.length === 0 && <p className="text-sm text-gray-500">No documents uploaded yet.</p>}

        {driver.documents.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded border border-gray-200">
            {driver.documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <a href={document.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                  {document.filename}
                </a>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(document.id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <input ref={fileInputRef} type="file" onChange={handleFileChange} className="text-xs" />
          {uploadMutation.isPending && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
          {uploadMutation.isError && <p className="mt-1 text-xs text-red-600">Upload failed. Please try again.</p>}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
