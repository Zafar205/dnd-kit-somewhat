import { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical, Trash2 } from "lucide-react";
import { useState } from 'react';

interface ContainerProps {
  id: UniqueIdentifier;
  title: string;
  children: React.ReactNode;
  onAddItem?: () => void;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

export default function Container({ 
  id, 
  title, 
  children, 
  onAddItem, 
  onDelete,
  onTitleChange 
}: ContainerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [showTooltip, setShowTooltip] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, active } = useSortable({
    id,
  });


  const isDragging = active?.id === id;


  const handleTitleSubmit = () => {
    if (editedTitle.trim() && onTitleChange) {
      onTitleChange(editedTitle);
    }
    setIsEditing(false);
    setShowTooltip(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    }
  };

  const truncateTitle = (text: string) => {
    return text.length > 20 ? text.substring(0, 20) + '...' : text;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        filter: isDragging ? 'blur(0.8px)' : 'none',
      }}
      className="bg-gray-200 p-4 rounded-xl min-w-[350px] min-h-[150px]"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 max-w-[250px]">
          <button {...attributes} {...listeners}>
            <GripVertical className="cursor-grab" />
          </button>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="rounded text-xl w-full"
              autoFocus
            />
          ) : (
            <div className="relative">
              <h1 
                className="text-gray-800 text-xl font-semibold cursor-pointer"
                onClick={() => setIsEditing(true)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {truncateTitle(title)}
              </h1>
              {showTooltip && title.length > 20 && (
                <div className="absolute z-50 px-2 py-1 text-sm text-white bg-gray-800 rounded-md -top-8 left-0 whitespace-nowrap">
                  {title}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onDelete} className="p-1 hover:bg-gray-300 rounded">
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>
      {children}
      <button
        className="w-full bg-gray-300 hover:bg-gray-400 p-2 rounded-lg mt-4"
        onClick={onAddItem}
      >
        + Add Item
      </button>
    </div>
  );
}