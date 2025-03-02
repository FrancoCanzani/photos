'use client';

import { useState, useEffect } from 'react';

type Libraries = ('places' | 'geometry' | 'drawing' | 'visualization')[];

interface UseGoogleMapsScriptOptions {
  libraries?: Libraries;
}

interface UseGoogleMapsScriptReturn {
  isLoaded: boolean;
  loadError: Error | null;
}

export function useGoogleMaps({
  libraries = ['places'],
}: UseGoogleMapsScriptOptions = {}): UseGoogleMapsScriptReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const librariesKey = libraries.sort().join(',');

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setLoadError(new Error('Google Maps API key is required'));
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

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

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=${librariesKey}`;
    script.async = true;
    script.defer = true;

    const handleLoad = () => setIsLoaded(true);
    const handleError = () =>
      setLoadError(new Error('Failed to load Google Maps script'));

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [libraries.sort().join(',')]);

  return { isLoaded, loadError };
}
