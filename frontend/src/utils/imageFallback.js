export const getPlaceholderSvg = (category, name = '') => {
  let bgColor = '#1e293b'; // Default dark slate
  let iconSvg = '';
  
  const cleanCategory = (category || '').toLowerCase();
  
  if (cleanCategory.includes('oil') || cleanCategory.includes('lubricant')) {
    bgColor = '#1e3a8a'; // Deep blue
    // Oil drop icon
    iconSvg = `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`;
  } else if (cleanCategory.includes('batter') || cleanCategory.includes('power')) {
    bgColor = '#78350f'; // Dark amber
    // Battery icon
    iconSvg = `
      <rect x="2" y="7" width="16" height="10" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="22" y1="11" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="14" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (cleanCategory.includes('tyre') || cleanCategory.includes('wheel')) {
    bgColor = '#0f172a'; // Black/Slate
    // Wheel icon
    iconSvg = `
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" stroke-width="1.5"/>
      <line x1="12" y1="15" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/>
      <line x1="3" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.5"/>
      <line x1="15" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5"/>
      <line x1="5.64" y1="5.64" x2="9.88" y2="9.88" stroke="currentColor" stroke-width="1.5"/>
      <line x1="14.12" y1="14.12" x2="18.36" y2="18.36" stroke="currentColor" stroke-width="1.5"/>
      <line x1="18.36" y1="5.64" x2="14.12" y2="9.88" stroke="currentColor" stroke-width="1.5"/>
      <line x1="9.88" y1="14.12" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="1.5"/>
    `;
  } else if (cleanCategory.includes('spare') || cleanCategory.includes('part')) {
    bgColor = '#311042'; // Plum
    // Gear icon
    iconSvg = `
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/>
    `;
  } else if (cleanCategory.includes('tool') || cleanCategory.includes('equip')) {
    bgColor = '#065f46'; // Teal
    // Wrench icon
    iconSvg = `
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  } else if (cleanCategory.includes('care') || cleanCategory.includes('detail')) {
    bgColor = '#115e59'; // Teal-cyan
    // Spray/Sparkle icon
    iconSvg = `
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="none" stroke="currentColor" stroke-width="2"/>
    `;
  } else if (cleanCategory.includes('light') || cleanCategory.includes('elect')) {
    bgColor = '#854d0e'; // Yellow-gold dark
    // Lightbulb icon
    iconSvg = `
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M9 18h6m-5 3h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `;
  } else {
    // Default abstract car shape or box
    iconSvg = `
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="7" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="17" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
    `;
  }

  // Generate dynamic initials for the product name (up to 3 characters)
  const initials = (name || '')
    .split(' ')
    .filter(word => word)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase() || 'AD';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      
      <!-- Premium background grid pattern -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Centralized graphical elements -->
      <g transform="translate(100, 65)" stroke="rgba(255,255,255,0.7)" fill="none">
        <g transform="translate(-12, -12)">
          ${iconSvg}
        </g>
      </g>
      
      <!-- Text details -->
      <text x="100" y="115" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="12" 
            font-weight="bold" 
            fill="rgba(255,255,255,0.85)" 
            text-anchor="middle"
            letter-spacing="0.5">
        ${initials}
      </text>
      
      <text x="100" y="130" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="8" 
            font-weight="bold" 
            fill="rgba(255,255,255,0.4)" 
            text-anchor="middle"
            letter-spacing="1">
        AUTO DISTRIBUTOR
      </text>
    </svg>
  `;

  // Base64 encode the SVG to safe data URI
  const base64Svg = btoa(svg.trim());
  return `data:image/svg+xml;base64,${base64Svg}`;
};

export const handleImageError = (e, category, name) => {
  e.target.onerror = null; // Prevent infinite loops
  e.target.src = getPlaceholderSvg(category, name);
};

export const handleUserAvatarError = (e) => {
  e.target.onerror = null;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#4f46e5"/>
      <circle cx="50" cy="40" r="20" fill="none" stroke="#ffffff" stroke-width="4"/>
      <path d="M 20 85 C 20 70, 80 70, 80 85" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `;
  const base64Svg = btoa(svg.trim());
  e.target.src = `data:image/svg+xml;base64,${base64Svg}`;
};
