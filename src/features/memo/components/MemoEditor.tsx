'use client';

import React, { useState, useEffect } from 'react';
import { Memo, MemoFormData } from '@/types/memo';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useMemoDetail } from '@/features/memo/hooks/useMemoDetail';
import { useSession } from 'next-auth/react';
import { useMemoAutoSave } from '@/features/memo/hooks/useMemoAutoSave';

interface MemoEditorProps {
  memoId: string | null;
  onSaveSuccess: (memoId: string) => void;
  onDeleteSuccess: () => void;
}

const MemoEditor: React.FC<MemoEditorProps> = ({ memoId, onSaveSuccess, onDeleteSuccess }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isActivelyEditing, setIsActivelyEditing] = useState(false);

  // Fetch existing memo data if memoId is provided, ignore server updates while editing
  const { memo: initialMemo, isLoading, error } = useMemoDetail(memoId, isActivelyEditing);

  const [formData, setFormData] = useState<MemoFormData>({
    title: '',
    content: '',
    isPublic: false,
  });
  const [isNewMemo, setIsNewMemo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Effect to populate form data when initialMemo changes
  useEffect(() => {
    if (initialMemo) {
      setFormData({
        title: initialMemo.title,
        content: initialMemo.content,
        isPublic: initialMemo.isPublic,
      });
      setIsNewMemo(false);
    } else {
      setFormData({ title: '', content: '', isPublic: false });
      setIsNewMemo(true);
    }
  }, [initialMemo]);

  // Use auto-save hook for existing memos
  useMemoAutoSave({
    memoId: isNewMemo ? null : memoId,
    formData,
    initialMemoClientUpdatedAt: initialMemo?.clientUpdatedAt instanceof Date ? initialMemo.clientUpdatedAt.toISOString() : undefined,
    isEditing: isActivelyEditing,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsActivelyEditing(true);
  };

  const handleToggleChange = (isOn: boolean) => {
    setFormData(prev => ({ ...prev, isPublic: isOn }));
    setIsActivelyEditing(true);
  };

  const handleInputBlur = () => {
    // Short delay before marking as not editing to allow for auto-save
    setTimeout(() => {
      setIsActivelyEditing(false);
    }, 500);
  };

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
      onSaveSuccess(result.memo.id);

    } catch (error: any) {
      console.error('Create memo error:', error);
      setSaveError(error.message || 'An unexpected error occurred during creation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memoId || !userId) return;

    if (!confirm('Are you sure you want to delete this memo?')) {
      return;
    }

    setIsSaving(true);
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

      onDeleteSuccess();

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

  if (error && memoId) {
    return <Card className="flex-1 text-red-500">Error loading memo for editing: {error.error.message}</Card>;
  }

  return (
    <Card className="flex-1 flex flex-col space-y-4 overflow-y-auto">
      <Input
        name="title"
        placeholder="Memo Title"
        value={formData.title}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="text-xl font-bold"
      />
      <Textarea
        name="content"
        placeholder="Memo Content"
        value={formData.content || ''}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="flex-1 min-h-[200px]"
      />

      <div className="flex items-center justify-between">
        <ToggleSwitch
          label="Public"
          isOn={formData.isPublic}
          onToggle={handleToggleChange}
        />
        <div className="flex space-x-2">
          {saveError && <span className="text-red-500 text-sm self-center">{saveError}</span>}
          {isNewMemo && isSaving && <Spinner size="small" className="self-center" />}
          {isNewMemo ? (
            <Button onClick={handleCreateNewMemo} disabled={isSaving}>
              Create Memo
            </Button>
          ) : (
            <span className="text-gray-500 text-sm self-center">Auto-saving...</span>
          )}
          {!isNewMemo && (
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