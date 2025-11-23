import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from './services/db';
import { generateDaySummary } from './services/gemini';
import { ActivityEntry, CATEGORIES } from './types';
import { Button, Input, Label, Card, Modal, Select, TextArea } from './components/ui';

// --- Icons ---
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const SparklesIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const ChevronLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const ClockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

// --- Components ---

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 shadow-sm">
      <span className="font-bold text-black text-xs leading-none">L</span>
    </div>
    <span className="font-semibold text-zinc-100 tracking-tight">LinearFlow</span>
  </div>
);

const App = () => {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Form State
  const [newEntry, setNewEntry] = useState<Partial<ActivityEntry>>({
    startTime: '',
    endTime: '',
    description: '',
    category: 'Work'
  });

  const loadEntries = useCallback(async () => {
    try {
      const data = await dbService.getEntriesByDate(selectedDate);
      setEntries(data);
      setSummary(null); // Reset summary when data changes/reloads
    } catch (error) {
      console.error("Failed to load entries", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleOpenModal = useCallback(() => {
    // Calculate default previous hour
    const now = new Date();
    const currentHour = now.getHours();
    
    // Default: Previous hour to Current hour (e.g., 14:00 - 15:00 if it's 15:20)
    let startH = currentHour - 1;
    let endH = currentHour;
    
    // Handle edge case for midnight
    if (startH < 0) {
      startH = 23;
      endH = 0;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultStartTime = `${pad(startH)}:00`;
    const defaultEndTime = `${pad(endH)}:00`;

    // Set selected date to today
    setSelectedDate(new Date().toISOString().split('T')[0]);
    
    setNewEntry({
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      description: '',
      category: 'Work'
    });
    setIsModalOpen(true);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleOpenModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenModal]);

  // Focus Description on Modal Open
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        descriptionRef.current?.focus();
      }, 50);
    }
  }, [isModalOpen]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.startTime || !newEntry.endTime || !newEntry.description) return;

    if (newEntry.endTime <= newEntry.startTime! && newEntry.endTime !== '00:00') {
        alert("End time must be after start time");
        return;
    }

    try {
      await dbService.addEntry({
        date: selectedDate,
        startTime: newEntry.startTime!,
        endTime: newEntry.endTime!,
        description: newEntry.description!,
        category: newEntry.category || 'General',
        timestamp: Date.now(),
      });
      
      setIsModalOpen(false);
      loadEntries();
    } catch (error) {
      console.error("Failed to add entry", error);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm("Delete this entry?")) {
      await dbService.deleteEntry(id);
      loadEntries();
    }
  };

  const handleGenerateSummary = async () => {
    if (entries.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await generateDaySummary(selectedDate, entries);
      setSummary(result);
    } finally {
      setIsGenerating(false);
    }
  };

  // Date Navigation
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }).toUpperCase();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddEntry(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-400 font-sans selection:bg-white selection:text-black flex flex-col">
      
      {/* Top Navigation */}
      <nav className="border-b border-[#1F1F23] bg-[#08080A]/80 backdrop-blur-md sticky top-0 z-10 h-14">
        <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
          <Logo />
          <Button onClick={handleOpenModal} className="px-3 h-8">
            <PlusIcon />
            <span className="hidden sm:inline">Add Entry</span>
            <kbd className="hidden sm:inline-block ml-1.5 px-1 py-0.5 text-[10px] bg-zinc-200 text-black rounded border border-zinc-300 font-mono">A</kbd>
          </Button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-zinc-100 mb-1">Activity Log</h1>
          <p className="text-sm text-zinc-500">Record and review your daily progress.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          
          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" onClick={() => changeDate(-1)} className="w-8 px-0 h-8">
              <ChevronLeftIcon />
            </Button>
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#27272A] bg-[#121215] text-zinc-200 min-w-[140px] justify-center cursor-pointer hover:bg-[#18181B] transition-colors h-8">
                <CalendarIcon />
                <span className="text-xs font-medium tracking-wide uppercase">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>
              <input 
                type="date" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => changeDate(1)} className="w-8 px-0 h-8">
              <ChevronRightIcon />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
             <Button 
                variant="secondary" 
                onClick={handleGenerateSummary}
                disabled={isGenerating || entries.length === 0}
                className="h-8 gap-2 px-3 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-600 hover:bg-[#18181B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SparklesIcon />
                {isGenerating ? 'Analyzing...' : 'AI Summary'}
            </Button>
          </div>
        </div>

        {/* AI Summary Card */}
        {summary && (
            <div className="mb-8 animate-slide-in-down">
                <Card className="p-0 overflow-hidden bg-[#121215] border-[#27272A]">
                    <div className="px-5 py-3 border-b border-[#27272A] flex items-center justify-between bg-[#161618]">
                       <div className="flex items-center gap-2">
                         <SparklesIcon />
                         <span className="text-sm font-medium text-zinc-200">AI Daily Analysis</span>
                       </div>
                       <button onClick={() => setSummary(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                          <CloseIcon />
                       </button>
                    </div>
                    <div className="p-5 text-sm text-zinc-400 leading-relaxed whitespace-pre-line font-mono">
                        {summary}
                    </div>
                </Card>
            </div>
        )}

        {/* Timeline View */}
        <div className="relative min-h-[400px]">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#27272A] rounded-xl bg-[#121215]/50 text-zinc-600">
              <div className="p-3 rounded-full bg-[#18181B] mb-3">
                <ClockIcon />
              </div>
              <p className="text-sm font-medium">No activity recorded</p>
              <p className="text-xs mt-1">Press <kbd className="font-mono text-[10px] bg-zinc-800 px-1 rounded">A</kbd> to start tracking</p>
            </div>
          ) : (
            <div className="relative space-y-0">
               {/* Vertical Line */}
               <div className="absolute left-[70px] top-2 bottom-0 w-px bg-[#27272A]" />
               
               {entries.map((entry, idx) => (
                   <div key={entry.id} className="group relative flex gap-5 pb-3 last:pb-0 animate-slide-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both'}}>
                       
                       {/* Time Column */}
                       <div className="w-[70px] flex-shrink-0 text-right pt-0.5">
                            <span className="font-mono text-[10px] text-zinc-500 tracking-tight block">
                                {entry.startTime} - {entry.endTime}
                            </span>
                       </div>

                       {/* Dot on Line */}
                       <div className="relative z-0 flex items-center justify-center pt-1.5">
                           <div className="h-2 w-2 rounded-full bg-[#27272A] ring-4 ring-[#08080A] group-hover:bg-white transition-colors duration-200" />
                       </div>

                       {/* Content */}
                       <div className="flex-1 pt-0">
                            <div className="flex items-start justify-between group/card p-2 -m-2 rounded-lg hover:bg-[#121215] transition-colors cursor-default">
                                <div>
                                    <p className="text-sm text-zinc-200 leading-snug">{entry.description}</p>
                                    <span className="text-[10px] text-zinc-600 mt-1 inline-block font-medium tracking-wide uppercase">{entry.category}</span>
                                </div>
                                <button 
                                    onClick={() => handleDelete(entry.id)}
                                    className="opacity-0 group-hover/card:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                       </div>
                   </div>
               ))}
            </div>
          )}
        </div>

      </main>

      {/* Add Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Entry"
      >
        <form onSubmit={handleAddEntry} onKeyDown={handleFormKeyDown} className="flex flex-col gap-3">
            <div className="flex gap-3">
                <div className="flex-1">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                        id="date"
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-[#18181B]"
                    />
                </div>
                <div className="flex-[2]">
                    <Label>Time Range</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="time" 
                            required
                            value={newEntry.startTime}
                            onChange={(e) => setNewEntry({...newEntry, startTime: e.target.value})}
                        />
                        <span className="text-zinc-600 text-xs">-</span>
                        <Input 
                            type="time" 
                            required
                            value={newEntry.endTime}
                            onChange={(e) => setNewEntry({...newEntry, endTime: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div>
                <Label>Activity Description</Label>
                <TextArea 
                    ref={descriptionRef}
                    placeholder="What did you work on?" 
                    required
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                    className="text-sm"
                />
            </div>

            <div>
                <Label>Category</Label>
                <Select 
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({...newEntry, category: e.target.value})}
                >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-zinc-600">Cmd+Enter to save</span>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Entry
                    </Button>
                </div>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default App;