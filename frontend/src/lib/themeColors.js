// Theme color definitions with defaults for all 3 groups

export const WEBSITE_COLORS = [
  { key: 'primary', label: 'Primary Color', default: '#1a2332' },
  { key: 'accent', label: 'Accent Color', default: '#0D9488' },
  { key: 'heading_color', label: 'Heading Color', default: '#1a2332' },
  { key: 'body_text', label: 'Body Text Color', default: '#475569' },
  { key: 'navbar_bg', label: 'Navbar Background', default: '#ffffff' },
  { key: 'button_bg', label: 'Button Background', default: '#1a2332' },
  { key: 'button_text', label: 'Button Text', default: '#ffffff' },
  { key: 'link_color', label: 'Link Color', default: '#0D9488' },
  { key: 'tab_active_bg', label: 'Tab Active Background', default: '#1a2332' },
  { key: 'tab_active_text', label: 'Tab Active Text', default: '#ffffff' },
  { key: 'icon_color', label: 'Icon Color', default: '#0D9488' },
  { key: 'section_bg', label: 'Section Alt Background', default: '#F8FAFC' },
  { key: 'card_bg', label: 'Card Background', default: '#ffffff' },
  { key: 'card_border', label: 'Card Border', default: '#e2e8f0' },
  { key: 'footer_bg', label: 'Footer Background', default: '#1a2332' },
  { key: 'footer_text', label: 'Footer Text', default: '#ffffff' },
];

export const MYACCOUNT_COLORS = [
  { key: 'page_bg', label: 'Page Background', default: '#0d0f14' },
  { key: 'sidebar_bg', label: 'Sidebar Background', default: '#13161e' },
  { key: 'sidebar_text', label: 'Sidebar Text', default: '#9ca3af' },
  { key: 'sidebar_active_bg', label: 'Sidebar Active Background', default: 'rgba(201,168,76,0.1)' },
  { key: 'sidebar_active_text', label: 'Sidebar Active Text', default: '#c9a84c' },
  { key: 'sidebar_active_border', label: 'Sidebar Active Border', default: '#c9a84c' },
  { key: 'header_bg', label: 'Header Background', default: '#13161e' },
  { key: 'card_bg', label: 'Card Background', default: '#13161e' },
  { key: 'card_border', label: 'Card Border', default: 'rgba(255,255,255,0.05)' },
  { key: 'accent', label: 'Accent Color', default: '#c9a84c' },
  { key: 'text_primary', label: 'Primary Text', default: '#ffffff' },
  { key: 'text_secondary', label: 'Secondary Text', default: '#9ca3af' },
  { key: 'text_muted', label: 'Muted Text', default: '#6b7280' },
  { key: 'input_bg', label: 'Input Background', default: '#0d0f14' },
  { key: 'input_border', label: 'Input Border', default: 'rgba(255,255,255,0.1)' },
  { key: 'button_bg', label: 'Button Background', default: '#c9a84c' },
  { key: 'button_text', label: 'Button Text', default: '#0d0f14' },
  { key: 'tab_active', label: 'Tab Active Color', default: '#c9a84c' },
  { key: 'tab_inactive', label: 'Tab Inactive Color', default: '#6b7280' },
  { key: 'modal_bg', label: 'Modal Background', default: '#13161e' },
  { key: 'modal_border', label: 'Modal Border', default: 'rgba(255,255,255,0.1)' },
  { key: 'progress_low', label: 'Progress Bar Low', default: '#ef4444' },
  { key: 'progress_mid', label: 'Progress Bar Mid', default: '#c9a84c' },
  { key: 'progress_high', label: 'Progress Bar High', default: '#22c55e' },
  { key: 'avatar_border', label: 'Avatar Border', default: 'rgba(201,168,76,0.3)' },
  { key: 'avatar_bg', label: 'Avatar Background', default: 'rgba(201,168,76,0.1)' },
];

export const ADMIN_COLORS = [
  { key: 'sidebar_bg', label: 'Sidebar Background', default: '#1a2332' },
  { key: 'sidebar_text', label: 'Sidebar Text', default: 'rgba(255,255,255,0.6)' },
  { key: 'sidebar_active_bg', label: 'Sidebar Active Background', default: '#0D9488' },
  { key: 'sidebar_active_text', label: 'Sidebar Active Text', default: '#ffffff' },
  { key: 'sidebar_hover_bg', label: 'Sidebar Hover Background', default: 'rgba(255,255,255,0.05)' },
  { key: 'navbar_bg', label: 'Navbar Background', default: '#ffffff' },
  { key: 'navbar_text', label: 'Navbar Text', default: '#1a2332' },
  { key: 'navbar_border', label: 'Navbar Border', default: '#e2e8f0' },
  { key: 'page_bg', label: 'Page Background', default: '#f8fafc' },
  { key: 'card_bg', label: 'Card Background', default: '#ffffff' },
  { key: 'card_border', label: 'Card Border', default: '#e2e8f0' },
  { key: 'accent', label: 'Accent Color', default: '#0D9488' },
  { key: 'button_bg', label: 'Button Background', default: '#0D9488' },
  { key: 'button_text', label: 'Button Text', default: '#ffffff' },
  { key: 'button_danger_bg', label: 'Danger Button Background', default: '#ef4444' },
  { key: 'heading', label: 'Heading Color', default: '#1a2332' },
  { key: 'text_primary', label: 'Primary Text', default: '#334155' },
  { key: 'text_secondary', label: 'Secondary Text', default: '#64748b' },
  { key: 'table_header_bg', label: 'Table Header Background', default: '#f8fafc' },
  { key: 'table_border', label: 'Table Border', default: '#e2e8f0' },
  { key: 'table_row_hover', label: 'Table Row Hover', default: '#f1f5f9' },
  { key: 'input_border', label: 'Input Border', default: '#e2e8f0' },
  { key: 'input_focus', label: 'Input Focus Border', default: '#0D9488' },
  { key: 'badge_bg', label: 'Badge Background', default: '#0D9488' },
  { key: 'badge_text', label: 'Badge Text', default: '#ffffff' },
];

// Helper: get color value from settings with fallback to default
export function getColor(group, key, themeColors) {
  return themeColors?.[group]?.[key] || getDefault(group, key);
}

function getDefault(group, key) {
  const groups = { website: WEBSITE_COLORS, my_account: MYACCOUNT_COLORS, admin: ADMIN_COLORS };
  return groups[group]?.find(c => c.key === key)?.default || '#000000';
}

// Inject all CSS variables from theme_colors settings
export function injectThemeColors(themeColors) {
  const root = document.documentElement;

  // Website colors (--color-* for backwards compat)
  const ws = themeColors?.website || {};
  WEBSITE_COLORS.forEach(c => {
    const val = ws[c.key] || c.default;
    root.style.setProperty(`--color-${c.key.replace(/_/g, '-')}`, val);
    // Legacy aliases
    if (c.key === 'heading_color') root.style.setProperty('--color-heading', val);
    if (c.key === 'body_text') root.style.setProperty('--color-body-text', val);
    if (c.key === 'link_color') root.style.setProperty('--color-link', val);
    if (c.key === 'footer_bg') root.style.setProperty('--color-footer-bg', val);
    if (c.key === 'footer_text') root.style.setProperty('--color-footer-text', val);
    if (c.key === 'button_bg') root.style.setProperty('--color-button-bg', val);
    if (c.key === 'button_text') root.style.setProperty('--color-button-text', val);
    if (c.key === 'tab_active_bg') root.style.setProperty('--color-tab-active-bg', val);
    if (c.key === 'tab_active_text') root.style.setProperty('--color-tab-active-text', val);
    if (c.key === 'icon_color') root.style.setProperty('--color-icon', val);
  });

  // My Account colors (--ma-*)
  const ma = themeColors?.my_account || {};
  MYACCOUNT_COLORS.forEach(c => {
    root.style.setProperty(`--ma-${c.key.replace(/_/g, '-')}`, ma[c.key] || c.default);
  });

  // Admin colors (--ad-*)
  const ad = themeColors?.admin || {};
  ADMIN_COLORS.forEach(c => {
    root.style.setProperty(`--ad-${c.key.replace(/_/g, '-')}`, ad[c.key] || c.default);
  });
}

// Theme definitions
export const THEMES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean, professional layout with a modern business aesthetic. White background with structured sections.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Minimalist design with bold typography, generous spacing, and a transparent header that blends into the hero.',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional corporate look with a boxed layout, bordered sections, and serif-heavy typography for a distinguished feel.',
  },
];
