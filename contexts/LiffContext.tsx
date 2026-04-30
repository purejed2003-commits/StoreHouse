"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initLiff } from '@/lib/liff';
import type { Liff } from '@line/liff';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffContextType {
  liff: Liff | null;
  profile: LiffProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDevMode: boolean;
  error: string | null;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffInstance, setLiffInstance] = useState<Liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startLiff = async () => {
      try {
        const result = await initLiff();
        if (result) {
          setLiffInstance(result.liff);
          setProfile(result.profile);
          if (!result.liff) setIsDevMode(true);
        }
      } catch (err: any) {
        setError(err.message || "ไม่สามารถเชื่อมต่อ LINE ได้");
      } finally {
        setIsLoading(false);
      }
    };

    startLiff();
  }, []);

  return (
    <LiffContext.Provider value={{
      liff: liffInstance,
      profile,
      isLoggedIn: !!profile,
      isLoading,
      isDevMode,
      error,
    }}>
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
}
