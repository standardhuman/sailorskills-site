# Sailor Skills Diving Header Analysis

## Key Visual Elements

### 1. Navigation Bar Structure
- **Position**: Fixed header at top (0, 0)
- **Height**: 69px
- **Background**: Transparent (rgba(0, 0, 0, 0))
- **Font**: Montserrat, sans-serif
- **Main Links**: HOME, TRAINING, DIVING (current page), DETAILING, DELIVERIES

### 2. Navigation Link Styling
```css
/* Navigation Links */
color: rgb(0, 0, 238);  /* Blue color */
font-size: 20px;
font-weight: 400;
font-family: montserrat, sans-serif;
text-decoration: none;
text-transform: none;
padding: 0px;
margin: 0px;
```

### 3. Hero Section - "SAILOR SKILLS DIVING"
- **Layout**: Centered text layout
- **Background**: Clean white background with no background image in hero section
- **Typography**:
  - "SAILOR SKILLS" - Appears to be styled with letter-spacing
  - "DIVING" - Large heading (100px font size)
  - "UNDERWATER VESSEL CARE" - Subtitle text

### 4. Typography Details

#### "DIVING" Heading
```css
color: rgb(24, 24, 24);  /* Dark gray */
font-size: 100px;
font-weight: 400;
font-family: montserrat, sans-serif;
line-height: 140px;
text-align: center;
margin: 0px;
padding: 0px;
text-transform: none;
letter-spacing: normal;
```

### 5. Color Palette
- **Primary Navigation**: rgb(0, 0, 238) - Blue
- **Text Colors**: 
  - rgb(24, 24, 24) - Dark gray (main headings)
  - rgb(109, 123, 137) - Light gray
  - rgb(52, 84, 117) - Dark blue-gray
- **Background**: White (#FFFFFF)

### 6. Layout Structure
- **Header Container**: Full width (1920px on desktop)
- **Hero Section**: 
  - Height: 160px
  - Position: Relative
  - No background image (contrary to initial expectation)

### 7. Font Families Used
- montserrat, sans-serif (primary)
- Arial, Helvetica, sans-serif (fallback)
- avenir-lt-w01_35-light1475496
- oswald-medium
- assistant-light, sans-serif

### 8. Special Effects
- No background overlays detected
- Clean, minimal design
- No opacity effects on main elements
- Simple hover states on navigation links

### 9. Notable CSS Properties
- Navigation uses absolute positioning
- Hero content is centered using text-align: center
- No special background images or gradients
- Clean, minimalist approach

## Key Findings

1. **No Background Image**: The header/hero area does not use a background image as might be expected. It's a clean white background.

2. **Typography-Focused Design**: The design relies heavily on typography hierarchy and spacing rather than visual effects.

3. **Simple Color Scheme**: Limited color palette focusing on blue links and dark gray text.

4. **Responsive Considerations**: The site appears to be built on Wix platform with specific responsive classes.

5. **Spacing**: Generous spacing between elements with specific line-heights and margins.