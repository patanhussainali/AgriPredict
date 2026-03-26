import React from 'react';

/**
 * Special Crop Prediction Icon (Sprout)
 */
export const CropPredictionIcon = ({ className = "" }) => (
    <svg 
        viewBox="0 0 24 24" 
        className={className} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 22C12 22 12 18 12 15M12 15C12 15 15 12 19 12M12 15C12 15 9 12 5 12" />
        <path d="M19 12C21 12 17 8 12 8C7 8 3 12 5 12" />
        <path d="M12 8C12 8 13.5 5 17 5" />
        <path d="M12 8C12 8 10.5 5 7 5" />
        <path d="M12 15V8" />
    </svg>
);

/**
 * Special Yield Estimation Icon (Modern Tractor)
 */
export const YieldEstimationIcon = ({ className = "" }) => (
    <svg 
        viewBox="0 0 24 24" 
        className={className} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M4 18h3.5" />
        <path d="M10.5 18H14" />
        <path d="M18 18h2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="3" />
        <path d="M11 18V8a2 2 0 0 1 2-2h3v12" />
        <path d="M16 6v4" />
        <path d="M8 11V6a2 2 0 0 1 2-2h3" />
        <path d="M6 18V11h5" />
    </svg>
);

/**
 * Special Weather Advisory Icon (Sun & Cloud)
 */
export const WeatherAdvisoryIcon = ({ className = "" }) => (
    <svg 
        viewBox="0 0 24 24" 
        className={className} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        <path d="M17.5 19a3.5 3.5 0 1 1-6.74-1.97 4.5 4.5 0 1 1 6.74 1.97z" fill="white" fillOpacity="0.2" />
    </svg>
);
