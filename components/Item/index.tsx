import { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2 } from "lucide-react";
import { useState } from 'react';

interface ItemProps {
  id: UniqueIdentifier;
  title: string;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

export default function Items({ id, title, onDelete, onTitleChange }: ItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const handleTitleSubmit = () => {
    console.log('editedTitle', editedTitle);  
    if (editedTitle.trim() && onTitleChange) {
      onTitleChange(editedTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full bg-white p-3 rounded-lg shadow flex justify-between items-center group"
    >
      <div className="flex items-center gap-2 flex-1">
        <button {...attributes} {...listeners}>
          <GripVertical className="cursor-grab text-gray-400" />
        </button>
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 border rounded bg-white"
            autoFocus
          />
        ) : (
          <span className="flex-1">{title}</span>
        )}
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsEditing(true)} 
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Edit2 size={16} className="text-gray-500" />
        </button>
        <button 
          onClick={onDelete} 
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}