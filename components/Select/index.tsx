import React, { useState } from 'react';



function CustomSelect({ options, value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const truncateText = (text: string) => {
    return text.length > 20 ? text.substring(0, 20) + '...' : text;
  };

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative w-[200px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border rounded-lg w-full text-left bg-white flex justify-between items-center"
      >
        <span className="truncate">
          {selectedOption ? truncateText(selectedOption.title) : options.length === 0 ? "No options available" : "Select Container"}
        </span>
        <span className="ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.id}
              className="relative"
              onMouseEnter={() => setShowTooltip(option.id)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer truncate"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                {truncateText(option.title)}
              </div>
              {/* {showTooltip === option.id && option.title.length > 20 && (
                <div className="absolute z-100 px-2 py-1 text-sm text-white bg-gray-800 rounded-md -top-8 left-0 whitespace-nowrap">
                  {option.title}
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;