import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Check } from 'lucide-react';
import {
  useGetScratchpadQuery,
  useSaveScratchpadMutation,
} from '../api/scratchpadEndpoints';

const SAVE_DELAY_MS = 1000;

function Scratchpad({ className = '' }) {
  const { t } = useTranslation('todolist');
  const { data: savedContent, isLoading } = useGetScratchpadQuery();
  const [saveScratchpad] = useSaveScratchpadMutation();

  const [localContent, setLocalContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const timerRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize from server
  useEffect(() => {
    if (savedContent !== undefined && !isInitialized.current) {
      setLocalContent(savedContent);
      isInitialized.current = true;
    }
  }, [savedContent]);

  // Debounced auto-save
  const scheduleAutoSave = useCallback((content) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveScratchpad(content).unwrap();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, SAVE_DELAY_MS);
  }, [saveScratchpad]);

  const handleChange = useCallback((e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setSaveStatus('idle');
    scheduleAutoSave(newContent);
  }, [scheduleAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="h-40 flex items-center justify-center text-xs text-gray-400">
          {t('common:loading')}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5">
          <Pencil size={12} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t('todolist:scratchpad')}
          </span>
        </div>
        {saveStatus === 'saving' && (
          <span className="text-[10px] text-gray-400 animate-pulse">{t('todolist:saving')}</span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-500">
            <Check size={10} /> {t('todolist:saved')}
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={localContent}
        onChange={handleChange}
        placeholder={t('todolist:scratchpadPlaceholder')}
        className="flex-1 w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none"
      />
    </div>
  );
}

export default Scratchpad;
