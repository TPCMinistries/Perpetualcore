"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Upload, FolderPlus, Settings, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FloatingCommandBarProps {
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onSearch?: (query: string) => void;
  onCommandPalette?: () => void;
}

export function FloatingCommandBar({
  onUpload,
  onCreateFolder,
  onSearch,
  onCommandPalette,
}: FloatingCommandBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled ? "top-4 scale-95" : ""
      }`}
    >
      {/* Ambient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-700 animate-pulse" />

      {/* Main command bar */}
      <div className="relative group">
        {/* Glass container */}
        <div className="backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 px-6 py-3 flex items-center gap-4 min-w-[700px] transition-all duration-300 hover:shadow-3xl hover:border-blue-300/60 dark:hover:border-blue-500/60">

          {/* Search section */}
          <div className="flex items-center gap-3 flex-1 relative group/search">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover/search:from-blue-500/5 group-hover/search:to-indigo-500/5 rounded-2xl blur-xl transition-all duration-300" />

            <div className="relative flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 transition-colors group-hover/search:text-blue-500" />

              <Input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search documents, folders, tags..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              />

              {/* Command hint */}
              <button
                onClick={onCommandPalette}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all duration-200 group/cmd"
              >
                <Command className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover/cmd:text-blue-500 transition-colors" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover/cmd:text-blue-500 transition-colors">K</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent" />

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {/* Upload button */}
            <Button
              onClick={onUpload}
              size="sm"
              className="relative group/btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 rounded-xl px-4 py-2 h-auto"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl opacity-0 group-hover/btn:opacity-50 blur transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Upload</span>
              </div>
            </Button>

            {/* Create folder button */}
            <Button
              onClick={onCreateFolder}
              size="sm"
              variant="ghost"
              className="relative group/folder hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 rounded-xl px-3 py-2 h-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover/folder:from-indigo-500/10 group-hover/folder:to-purple-500/10 rounded-xl blur transition-all duration-300" />
              <FolderPlus className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover/folder:text-indigo-600 dark:group-hover/folder:text-indigo-400 transition-colors relative" />
            </Button>

            {/* AI Assistant quick access */}
            <Button
              size="sm"
              variant="ghost"
              className="relative group/ai hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 rounded-xl px-3 py-2 h-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover/ai:from-purple-500/10 group-hover/ai:to-pink-500/10 rounded-xl blur transition-all duration-300" />
              <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover/ai:text-purple-600 dark:group-hover/ai:text-purple-400 transition-colors relative" />
            </Button>

            {/* Settings */}
            <Button
              size="sm"
              variant="ghost"
              className="relative group/settings hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 rounded-xl px-3 py-2 h-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-500/0 to-slate-500/0 group-hover/settings:from-slate-500/10 group-hover/settings:to-slate-500/10 rounded-xl blur transition-all duration-300" />
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover/settings:text-slate-800 dark:group-hover/settings:text-slate-200 transition-colors relative" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
