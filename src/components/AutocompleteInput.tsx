import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface AutocompleteInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** Async function that returns suggestions based on query */
  search: (query: string) => Promise<string[]>;
  /** Minimum characters before triggering search */
  minChars?: number;
  /** Max results to show */
  maxResults?: number;
  /** Debounce delay in ms */
  debounce?: number;
  /** Message shown when no results found and input has min chars */
  emptyMessage?: string;
}

export function AutocompleteInput({
  value,
  onChangeText,
  placeholder,
  search,
  minChars = 2,
  maxResults = 5,
  debounce = 200,
  emptyMessage,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    if (value === selectedValue) return;

    if (value.trim().length < minChars) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await search(value.trim());
      const limited = results.slice(0, maxResults);
      setSuggestions(limited);
      setShowSuggestions(limited.length > 0);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, selectedValue, search, minChars, maxResults, debounce]);

  const handleSelect = (name: string) => {
    setSelectedValue(name);
    onChangeText(name);
    setShowSuggestions(false);
  };

  const handleChange = (v: string) => {
    setSelectedValue('');
    onChangeText(v);
  };

  return (
    <View className="relative z-10">
      <Input value={value} onChangeText={handleChange} placeholder={placeholder} />
      {showSuggestions && (
        <View className="absolute left-0 right-0 top-[44px] z-50 rounded-xl border border-zinc-800 bg-[#1c1c1f] shadow-lg">
          {suggestions.map((name) => (
            <Pressable
              key={name}
              onPress={() => handleSelect(name)}
              className="border-b border-zinc-800/50 px-3.5 py-2.5"
            >
              <Text className="text-sm text-white">{name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {emptyMessage &&
        value.trim().length >= minChars &&
        !showSuggestions &&
        value !== selectedValue && (
          <Text className="mt-1 text-xs text-zinc-500">{emptyMessage}</Text>
        )}
    </View>
  );
}
