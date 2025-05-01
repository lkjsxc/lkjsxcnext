'use client';

import React, { useState, useEffect, useRef } from 'react'; // Keep this import
import { Memo, MemoFormData } from '@/types/memo';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useMemoDetail } from '@/features/memo/hooks/useMemoDetail';
import { useSession } from 'next-auth/react';
import { useMemoAutoSave } from '@/features/memo/hooks/useMemoAutoSave'; // Import useMemoAutoSave
import { usePolling } from '@/features/polling/hooks/usePolling'; // Import usePolling

interface MemoEditorProps {
  memoId: string | null; // null for creating a new memo
  onSaveSuccess: (memoId: string) => void;
  onDeleteSuccess: () => void;
}

const MemoEditor: React.FC<MemoEditorProps> = ({ memoId, onSaveSuccess, onDeleteSuccess }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Fetch existing memo data if memoId is provided
  const { memo: initialMemo, isLoading, error, refetch } = useMemoDetail(memoId);

  const [formData, setFormData] = useState<MemoFormData>({
    title: '',
    content: '',
    isPublic: false,
  });
  const [isNewMemo, setIsNewMemo] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // State for manual save/delete
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isActivelyEditing, setIsActivelyEditing] = useState(false); // Track if user is typing/interacting

  // Effect to populate form data when initialMemo changes (editing existing memo)
  useEffect(() => {
    if (initialMemo) {
      setFormData({
        title: initialMemo.title,
        content: initialMemo.content,
        isPublic: initialMemo.isPublic,
      });
      setIsNewMemo(false);
    } else {
      // Reset form for new memo
      setFormData({ title: '', content: '', isPublic: false });
      setIsNewMemo(true);
    }
  }, [initialMemo]);

  // Use auto-save hook for existing memos
  useMemoAutoSave({
    memoId: isNewMemo ? null : memoId, // Only auto-save existing memos
    formData,
    initialMemoClientUpdatedAt: initialMemo?.clientUpdatedAt instanceof Date ? initialMemo.clientUpdatedAt.toISOString() : undefined, // Safely convert Date to ISO string
    isEditing: isActivelyEditing, // Pass active editing state
  });

  // Use polling hook for the current memo detail, but disable it when editing
  const { disable: disablePolling, enable: enablePolling } = usePolling(
    () => {
      // This task will be registered for the specific memo detail fetch
      // We don't need to do anything here, as useMemoDetail's SWR handles the fetch
    },
    [memoId], // Dependencies for polling hook
    memoId || undefined // Use memoId as the key for polling task
  );

  // Effect to pause/resume polling based on active editing state
  useEffect(() => {
    if (memoId) { // Only manage polling if a memo is selected
      if (isActivelyEditing) {
        console.log(`Disabling polling for memo ${memoId}`);
        disablePolling?.(); // Disable polling when actively editing
      } else {
        console.log(`Enabling polling for memo ${memoId}`);
        enablePolling?.(); // Enable polling when not actively editing
      }
    }
     // Cleanup: Ensure polling is re-enabled if component unmounts while editing
    return () => {
       if (memoId) {
          console.log(`Editor unmounted, ensuring polling for memo ${memoId} is enabled.`);
          enablePolling?.();
       }
    };
  }, [memoId, isActivelyEditing, enablePolling, disablePolling]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveError(null); // Clear error on new input
    setIsActivelyEditing(true); // User is actively editing
  };

   const handleInputBlur = () => {
      setIsActivelyEditing(false); // User is no longer actively editing
   };


  const handleToggleChange = () => {
    setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }));
    setSaveError(null); // Clear error on new input
    setIsActivelyEditing(true); // User is actively editing
  };

  // Manual save is only for creating a new memo now
  const handleCreateNewMemo = async () => {
    if (!userId) {
      setSaveError('You must be logged in to create memos.');
      return;
    }
    if (!formData.title) {
      setSaveError('Title cannot be empty.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create memo.');
      }

      const result: { memo: Memo } = await response.json();
      onSaveSuccess(result.memo.id); // Notify parent of new memo creation

    } catch (error: any) {
      console.error('Create memo error:', error);
      setSaveError(error.message || 'An unexpected error occurred during creation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memoId || !userId) return; // Cannot delete if no memo selected or not logged in

    if (!confirm('Are you sure you want to delete this memo?')) {
      return;
    }

    setIsSaving(true); // Use saving state for deletion feedback too
    setSaveError(null);

    try {
      const response = await fetch(`/api/memo/${memoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete memo.');
      }

      onDeleteSuccess(); // Notify parent of deletion

    } catch (error: any) {
      console.error('Delete error:', error);
      setSaveError(error.message || 'An unexpected error occurred during deletion.');
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <Card className="flex-1 flex justify-center items-center">
        <Spinner />
      </Card>
    );
  }

  if (error && memoId) { // Only show error if trying to load an existing memo
    return <Card className="flex-1 text-red-500">Error loading memo for editing: {error.error.message}</Card>;
  }

  // If memoId exists but initialMemo is null (e.g., unauthorized), show message
  if (memoId && !initialMemo && !isLoading) {
     return <Card className="flex-1 text-gray-500">Memo not found or you do not have permission to edit it.</Card>;
  }


  return (
    <Card className="flex-1 flex flex-col space-y-4 overflow-y-auto">
      <Input
        name="title"
        placeholder="Memo Title"
        value={formData.title}
        onChange={handleInputChange}
        onBlur={handleInputBlur} // Track blur for active editing state
        className="text-xl font-bold"
      />
      <Textarea
        name="content"
        placeholder="Memo Content"
        value={formData.content || ''}
        onChange={handleInputChange}
        onBlur={handleInputBlur} // Track blur for active editing state
        className="flex-1 min-h-[200px]"
      />

      <div className="flex items-center justify-between">
        <ToggleSwitch
          label="Public"
          isOn={formData.isPublic}
          handleToggle={handleToggleChange}
        />
        <div className="flex space-x-2">
           {saveError && <span className="text-red-500 text-sm self-center">{saveError}</span>}
           {/* isSaving state is now primarily for manual create/delete */}
           {isNewMemo && isSaving && <Spinner size="small" className="self-center" />}
           {/* Auto-save status feedback would come from useMemoAutoSave */}
           {isNewMemo ? (
             <Button onClick={handleCreateNewMemo} disabled={isSaving}>
               Create Memo
             </Button>
           ) : (
             // For existing memos, save is automatic. Maybe show a status indicator here.
             <span className="text-gray-500 text-sm self-center">Auto-saving...</span> // Placeholder
           )}
           {!isNewMemo && ( // Only show delete button for existing memos
             <Button onClick={handleDelete} disabled={isSaving} className="bg-red-500 hover:bg-red-600">
               Delete
             </Button>
           )}
        </div>
      </div>
       {!isNewMemo && initialMemo && (
         <div className="text-sm text-gray-500">
           Last saved: {new Date(initialMemo.updatedAt).toLocaleString()}
         </div>
       )}
    </Card>
  );
};

export { MemoEditor };