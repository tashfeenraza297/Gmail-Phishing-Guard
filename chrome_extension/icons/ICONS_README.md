# Icon Requirements for PhishGuard

The Chrome extension needs icons at the following sizes:

## Required Sizes:
- **16x16** - Extension toolbar icon (small)
- **32x32** - Windows taskbar
- **48x48** - Extension management page
- **128x128** - Chrome Web Store listing

## Design Suggestions:

### Concept: Shield with "P" or phishing hook symbol

**Color Scheme:**
- Primary: `#667eea` (purple)
- Secondary: `#764ba2` (darker purple)
- Accent: `#48bb78` (green for safe)
- Alert: `#f56565` (red for danger)

### Option 1: Shield Logo
```
Simple shield outline with "P" in center
Gradient fill from #667eea to #764ba2
White letter for contrast
```

### Option 2: Hook + Shield
```
Fishing hook crossed out inside shield
Symbolizes "anti-phishing"
Same gradient colors
```

### Option 3: Email + Check
```
Email envelope with checkmark overlay
Clean and professional
Easy to recognize
```

## How to Create Icons:

### Using Free Tools:

1. **Canva** (Online, Free)
   - Create custom size: 128x128
   - Use shapes: Shield, letter P, gradients
   - Download as PNG
   - Resize to other sizes

2. **GIMP** (Free Desktop App)
   - Create 128x128 image
   - Design shield icon
   - Export as PNG
   - Scale to 16, 32, 48

3. **Figma** (Online, Free)
   - Professional design tool
   - Create icon set
   - Export all sizes at once

4. **AI Generator** (Fastest)
   - Use DALL-E, Midjourney, or free alternatives
   - Prompt: "Shield logo with purple gradient, minimalist, app icon, 512x512"
   - Resize to required sizes

### Using AI (Recommended for Speed):

**Prompt for DALL-E/Midjourney:**
```
Modern app icon of a shield with letter P inside, 
purple gradient from #667eea to #764ba2, 
minimalist design, flat style, white background, 
professional, 512x512 resolution
```

**Or:**
```
Anti-phishing shield icon, email security symbol, 
purple and blue gradient, simple geometric design, 
app icon style, high resolution
```

### Quick Placeholder Icons:

If you need to test immediately, use a solid color square:
1. Create 128x128 PNG with purple background
2. Add white "P" text in center
3. Resize to 16, 32, 48

## After Creating Icons:

1. Save all 4 sizes as PNG
2. Name them:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`
3. Place in `chrome_extension/icons/` folder
4. Icons are already referenced in `manifest.json`

## Free Icon Resources:

- **Flaticon** - https://www.flaticon.com (search "shield" or "security")
- **Icons8** - https://icons8.com (free with attribution)
- **IconMonstr** - https://iconmonstr.com (completely free)
- **Font Awesome** - https://fontawesome.com (icon fonts)

## Note:

The extension will work WITHOUT icons during development, but Chrome will show a default puzzle piece. Icons are REQUIRED for Chrome Web Store publishing.

---

**Current Status:** Icons folder exists at `chrome_extension/icons/` but is empty. Create icons before publishing!
