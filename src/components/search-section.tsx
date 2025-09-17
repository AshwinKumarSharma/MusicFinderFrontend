import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchSection({ onSearch, isLoading }: SearchSectionProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="mb-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Search Your Favorite Music</h2>
        <p className="text-center mb-2" style={{ color: 'var(--music-light-gray)' }}>
          Discover millions of songs from artists around the world
        </p>
        <p className="text-center mb-8 text-sm" style={{ color: 'var(--music-light-gray)' }}>
          Preview 30-second clips from iTunes
        </p>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for songs, artists, or albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-6 py-4 text-white rounded-2xl border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 pl-14"
            style={{ backgroundColor: 'var(--music-gray)' }}
            disabled={isLoading}
          />
          <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
            <Search className="text-gray-400" size={20} />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 gradient-bg px-6 py-2 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </section>
  );
}
