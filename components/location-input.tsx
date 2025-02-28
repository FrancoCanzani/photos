'use client';

import { useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/lib/hooks/use-google-maps';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type LocationSuggestion = {
  id: string;
  description: string;
  placeId: string;
};

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function LocationInput({
  value,
  onChange,
  required = false,
  label = 'Location',
  placeholder = 'Enter a location...',
  className,
}: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderService = useRef<google.maps.Geocoder | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useGoogleMaps({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      geocoderService.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (
      !query ||
      query.length < 3 ||
      !isLoaded ||
      !autocompleteService.current
    ) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        autocompleteService.current?.getPlacePredictions(
          { input: query },
          (predictions, status) => {
            setIsLoadingSuggestions(false);
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              const formattedSuggestions = predictions.map((prediction) => ({
                id: prediction.place_id,
                description: prediction.description,
                placeId: prediction.place_id,
              }));
              setSuggestions(formattedSuggestions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
          }
        );
      } catch (error) {
        setIsLoadingSuggestions(false);
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isLoaded]);

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.description);
    onChange(suggestion.description);
    setShowSuggestions(false);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    if (!geocoderService.current) {
      toast.error('Location service not available');
      return;
    }

    setIsLoadingLocation(true);

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      geocoderService.current?.geocode(
        {
          location: { lat: latitude, lng: longitude },
        },
        (results, status) => {
          setIsLoadingLocation(false);

          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            setQuery(address);
            onChange(address);
            toast.success('Location updated successfully');
          } else {
            toast.error('Could not find your location');
          }
        }
      );
    };

    const handleError = (error: GeolocationPositionError) => {
      setIsLoadingLocation(false);

      const errorMessages = {
        1: 'Permission denied. Please allow location access.',
        2: 'Location unavailable. Try again later.',
        3: 'Location request timed out. Try again.',
      };

      const message =
        errorMessages[error.code as 1 | 2 | 3] || `Error: ${error.message}`;
      toast.error(message);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
  };

  useEffect(() => {
    return () => {
      autocompleteService.current = null;
      geocoderService.current = null;
    };
  }, []);

  if (loadError) {
    return (
      <div className='space-y-2'>
        {label && (
          <Label htmlFor='location'>
            {label}
            {required && '*'}
          </Label>
        )}
        <Input
          id='location'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn('h-12', className)}
          required={required}
        />
        <p className='text-xs text-red-500'>
          Error loading location service. You can still enter a location
          manually.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {label && (
        <Label htmlFor='location'>
          {label}
          {required && '*'}
        </Label>
      )}
      <div className='relative'>
        <div className='flex gap-2'>
          <div className='relative flex-grow'>
            <Input
              ref={inputRef}
              id='location'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
              className={cn('h-12 pr-10', className)}
              required={required}
            />
            {isLoadingSuggestions && (
              <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
              </div>
            )}
          </div>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='h-12 w-12'
            onClick={getUserLocation}
            disabled={isLoadingLocation || !isLoaded}
            title='Use your current location'
            aria-label='Use your current location'
          >
            {isLoadingLocation ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <MapPin className='h-5 w-5' />
            )}
          </Button>
        </div>

        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className='absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto'
          >
            {isLoadingSuggestions ? (
              <div className='p-3 flex items-center justify-center'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground mr-2' />
                <span className='text-sm text-muted-foreground'>
                  Loading suggestions...
                </span>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className='p-3 hover:bg-muted cursor-pointer flex items-center gap-2'
                >
                  <MapPin className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                  <span className='text-sm'>{suggestion.description}</span>
                </div>
              ))
            ) : query.length >= 3 ? (
              <div className='p-3 text-sm text-muted-foreground text-center'>
                No locations found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
