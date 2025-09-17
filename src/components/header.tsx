import { Music, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onDJModeClick?: () => void;
}

export default function Header({ onDJModeClick }: HeaderProps) {
  const scrollToDJModes = () => {
    const djModeSection = document.getElementById('dj-modes-section');
    if (djModeSection) {
      djModeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (onDJModeClick) {
      onDJModeClick();
    }
  };

  return (
    <header className="shadow-xl border-b border-gray-700" style={{ backgroundColor: 'var(--music-gray)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
              <Music className="text-white text-lg" size={20} />
            </div>
            <h1 className="text-2xl font-bold gradient-text">
              MelodyStream
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={scrollToDJModes}
              className="gradient-bg text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-transform duration-200 flex items-center gap-2"
              data-testid="header-dj-mode-button"
            >
              <Radio size={18} />
              <span className="hidden sm:inline">DJ Mode</span>
            </Button>
            <div className="hidden md:flex items-center">
              <span className="text-sm" style={{ color: 'var(--music-light-gray)' }}>
                Discover & Play Music
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
