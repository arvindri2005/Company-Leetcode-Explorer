"use client";
import * as React from "react";
import { Chip } from "./chip";

interface ChipGroupProps {
  options: { value: string; label: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  className?: string;
}

const ChipGroup: React.FC<ChipGroupProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  className,
}) => {
  const handleChipClick = (selectedValue: string) => {
    if (multiple) {
      const newValues = Array.isArray(value) ? [...value] : [];
      const index = newValues.indexOf(selectedValue);
      if (index > -1) {
        newValues.splice(index, 1);
      } else {
        newValues.push(selectedValue);
      }
      onChange(newValues);
    } else {
      onChange(selectedValue);
    }
  };

  const isChipSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={isChipSelected(option.value)}
          onClick={() => handleChipClick(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
};

export { ChipGroup };
