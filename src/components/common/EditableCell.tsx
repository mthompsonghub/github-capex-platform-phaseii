import React, { useState, useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { ProjectStatus, StatusPercentage, STATUS_PERCENTAGES } from '../../types/capex';
import { Trash2 } from 'lucide-react';

interface EditableCellProps {
  value: string | number | StatusPercentage | ProjectStatus;
  onChange: (value: string | number | StatusPercentage | ProjectStatus) => void;
  onDelete?: () => void;
  type: 'number' | 'percentage' | 'status' | 'text' | 'textarea' | 'owner';
  editable?: boolean;
  calculated?: boolean;
  className?: string;
  owners?: { id: string; name: string }[];
  isFirstCell?: boolean;
}

const baseInputStyles = 'w-full p-1 border border-gray-200 rounded bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200';

export function EditableCell({
  value,
  onChange,
  onDelete,
  type,
  editable = true,
  calculated = false,
  className,
  owners = [],
  isFirstCell = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (editable && !calculated) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (type === 'number') {
      onChange(Number(editValue) || 0);
    } else {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      setIsEditing(false);
      if (type === 'number') {
        onChange(Number(editValue) || 0);
      } else {
        onChange(editValue);
      }
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const renderValue = () => {
    if (type === 'percentage') {
      return typeof value === 'number' ? `${value}%` : value;
    }
    if (type === 'number' && typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Impacted':
        return 'text-red-600';
      case 'At Risk':
        return 'text-yellow-600';
      case 'On Track':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isEditing) {
    if (type === 'percentage') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value as StatusPercentage)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={twMerge(baseInputStyles, className)}
        >
          {STATUS_PERCENTAGES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'status') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value as ProjectStatus)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={twMerge(baseInputStyles, className)}
        >
          {['Impacted', 'At Risk', 'On Track'].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'owner') {
      return (
        <div className="relative">
          {isAddingOwner ? (
            <div className="flex">
              <input
                type="text"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                onBlur={() => {
                  if (newOwnerName.trim()) {
                    onChange(newOwnerName.trim());
                  }
                  setIsAddingOwner(false);
                  setIsEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOwnerName.trim()) {
                    onChange(newOwnerName.trim());
                    setIsAddingOwner(false);
                    setIsEditing(false);
                  }
                }}
                className={baseInputStyles}
                autoFocus
              />
            </div>
          ) : (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue as string}
              onChange={(e) => {
                if (e.target.value === 'add_new') {
                  setIsAddingOwner(true);
                } else {
                  setEditValue(e.target.value);
                  onChange(e.target.value);
                  setIsEditing(false);
                }
              }}
              onBlur={() => !isAddingOwner && setIsEditing(false)}
              className={twMerge(baseInputStyles, className)}
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.name}>
                  {owner.name}
                </option>
              ))}
              <option value="add_new">+ Add New Owner</option>
            </select>
          )}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Escape' && handleKeyDown(e)}
          rows={3}
          className={twMerge(baseInputStyles, 'resize-none', className)}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={twMerge(baseInputStyles, className)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        onClick={handleClick}
        className={twMerge(
          'flex-grow cursor-pointer p-1 hover:bg-gray-50 rounded',
          type === 'status' && getStatusColor(value as ProjectStatus),
          calculated ? 'bg-gray-50' : '',
          className
        )}
      >
        {renderValue()}
      </div>
      {isFirstCell && onDelete && (
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Delete row"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
} 