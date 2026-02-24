"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
  context: string;
  coordinates: { lat: number; lon: number };
  type: string;
  importance: number;
  isPOI?: boolean;
}

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onSelectAddress: (address: AddressSuggestion) => void;
  onChangeText?: (text: string) => void;
  className?: string;
  iconClassName?: string;
}

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 3;

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onSelectAddress,
  onChangeText,
  className,
  iconClassName,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue.length < MIN_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/address-search?q=${encodeURIComponent(inputValue)}&limit=8`
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    onChangeText?.(v);
  };

  const handleSelect = (s: AddressSuggestion) => {
    setInputValue(s.label);
    setSuggestions([]);
    setOpen(false);
    onSelectAddress(s);
    onChangeText?.(s.label);
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className={cn("space-y-2", className)}>
      <label className="text-foreground font-medium text-sm">{label}</label>
      <div className="relative">
        <MapPin
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none",
            iconClassName
          )}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => inputValue.length >= MIN_LENGTH && setOpen(true)}
          className="w-full h-12 pl-11 pr-10 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin pointer-events-none" />
        )}
        {showList && (
          <ul
            className="absolute z-50 w-full mt-1 py-1 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.label}-${i}`}
                role="option"
                tabIndex={0}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                className="px-4 py-3 text-sm text-foreground hover:bg-muted/80 cursor-pointer border-b border-border/50 last:border-0"
              >
                <span className="font-medium">{s.label}</span>
                {s.city && (
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {s.postcode} {s.city}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
