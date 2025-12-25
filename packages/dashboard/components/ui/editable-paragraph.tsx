import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";

interface EditableParagraphProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EditableParagraph({
  value,
  onChange,
}: EditableParagraphProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = () => {
    setDraftValue(value); // Sync with prop when editing starts
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (draftValue !== value) {
      onChange(draftValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftValue(e.target.value);
  };

  return (
    <div onDoubleClick={handleDoubleClick} className="cursor-text">
      {isEditing ? (
        <Input
          ref={inputRef}
          value={draftValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          style={{ lineHeight: "inherit" }}
          className="!text-base font-bold !bg-transparent !p-0 !m-0 h-auto border-none shadow-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
        />
      ) : (
        <p className="text-base font-bold">{value}</p>
      )}
    </div>
  );
}
