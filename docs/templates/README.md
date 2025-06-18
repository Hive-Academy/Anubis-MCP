# Handlebars Template Structure

This directory contains the Handlebars templates for the GitHub Pages site.

## Directory Structure

```
templates/
├── layouts/       # Base layout templates that define the page structure
│   └── main.hbs  # Main layout template with common HTML structure
└── partials/      # Reusable template components
    ├── header.hbs          # Site navigation and header
    ├── footer.hbs          # Site footer with links and copyright
    ├── hero.hbs           # Hero section with dynamic content
    ├── feature-card.hbs   # Reusable feature card component
    ├── code-block.hbs     # Code display with optional copy button
    ├── section-header.hbs # Consistent section headers
    └── timeline-step.hbs  # Timeline step for How It Works section
```

## Partial Components

### Header (`header.hbs`)

- Main navigation bar with responsive design
- Logo and navigation links
- GitHub button

### Footer (`footer.hbs`)

- Grid layout with multiple columns
- Quick links and resources
- Social media links
- Copyright information

### Hero Section (`hero.hbs`)

Variables:

- `badge`: Text for the MCP badge
- `headline1`: First line of the headline (gradient)
- `headline2`: Second line of the headline
- `subheadline`: HTML-enabled subheadline text
- `stats`: Array of statistics with icon, color, and text
- `ctaButtons`: Array of call-to-action buttons
- `quickInstall`: Optional quick install code block

### Feature Card (`feature-card.hbs`)

Variables:

- `icon`: FontAwesome icon class
- `iconColor`: Icon color class
- `title`: Card title
- `list`: Array of list items (for bullet points)
- `content`: Array of content items (for paragraphs)
- `hover`: Boolean to enable hover animation

### Code Block (`code-block.hbs`)

Variables:

- `title`: Optional title above code
- `code`: The code content (HTML-enabled)
- `codeColor`: Color class for the code
- `copyButton`: Boolean to show copy button
- `copyContent`: Content to copy when button clicked

### Section Header (`section-header.hbs`)

Variables:

- `badge`: Optional badge object with icon, color, and text
- `title`: Section title
- `gradientText`: Boolean for gradient effect
- `subtitle`: Optional subtitle text (HTML-enabled)

### Timeline Step (`timeline-step.hbs`)

Variables:

- `stepNumber`: Step number (1, 2, etc.)
- `title`: Step title
- `titleColor`: Color class for the title
- `description`: Step description
- `code`: Optional code block object
- `visual`: Visual element with icon, title, and subtitle
- `visualFirst`: Boolean to swap visual/content order
- `orderSwap`: Boolean for responsive order changes

## Usage

Include partials in your templates using:

```handlebars
{{> partial-name}}
```

With parameters:

```handlebars
{{> feature-card
  icon="fas fa-rocket"
  iconColor="text-blue-400"
  title="Quick Setup"
  hover=true
  list=setupSteps
}}
```

## Dependencies

- Handlebars.js - Template engine
- Tailwind CSS - Utility-first CSS framework
- Font Awesome - Icon library
- Custom CSS variables for theming
