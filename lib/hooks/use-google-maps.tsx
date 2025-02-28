'use client';

import { useState, useEffect } from 'react';

type Libraries = ('places' | 'geometry' | 'drawing' | 'visualization')[];

interface UseGoogleMapsScriptOptions {
  googleMapsApiKey: string;
  libraries?: Libraries;
}

interface UseGoogleMapsScriptReturn {
  isLoaded: boolean;
  loadError: Error | null;
}

export function useGoogleMaps({
  googleMapsApiKey,
  libraries = ['places'],
}: UseGoogleMapsScriptOptions): UseGoogleMapsScriptReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!googleMapsApiKey) {
      setLoadError(new Error('Google Maps API key is required'));
      return;
    }

    // Check if the script is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      // Script is loading, wait for it
      const handleScriptLoad = () => setIsLoaded(true);
      const handleScriptError = () =>
        setLoadError(new Error('Failed to load Google Maps script'));

      existingScript.addEventListener('load', handleScriptLoad);
      existingScript.addEventListener('error', handleScriptError);

      return () => {
        existingScript.removeEventListener('load', handleScriptLoad);
        existingScript.removeEventListener('error', handleScriptError);
      };
    }

    // Create and append the script
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=${libraries.join(',')}`;
    script.async = true;
    script.defer = true;

    script.onload = () => setIsLoaded(true);
    script.onerror = () =>
      setLoadError(new Error('Failed to load Google Maps script'));

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount as other components might need it
    };
  }, [googleMapsApiKey, libraries]);

  return { isLoaded, loadError };
}
