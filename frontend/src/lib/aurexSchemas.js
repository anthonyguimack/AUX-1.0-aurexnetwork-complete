// Aurex section schemas — drive the polymorphic admin UI.
// Each entry defines: config fields (page-level) + item fields (CRUD rows).
import { Users, Workflow, DollarSign, UserCircle, Calendar, Building2, Award } from 'lucide-react';

// Field types: 'text' | 'textarea' | 'url' | 'number' | 'bool' | 'image' | 'icon' | 'rich'

export const AUREX_SECTIONS = {
  aurex_audience: {
    label: 'Aurex is for you',
    icon: Users,
    description: 'Target-audience cards. Each card = icon + title + description.',
    configFields: [
      { key: 'title',        label: 'Section title',        type: 'text',     placeholder: 'Aurex is for you' },
      { key: 'subtitle',     label: 'Subtitle',             type: 'textarea', placeholder: 'Who this is for…' },
      { key: 'cta_text',     label: 'CTA button text',      type: 'text',     placeholder: 'Get started' },
      { key: 'cta_url',      label: 'CTA button URL',       type: 'url',      placeholder: '/enrollment' },
    ],
    itemFields: [
      { key: 'icon',        label: 'Icon (lucide name)', type: 'icon',     placeholder: 'briefcase' },
      { key: 'title',       label: 'Title',              type: 'text',     required: true },
      { key: 'description', label: 'Description',        type: 'textarea' },
    ],
    itemPreview: (i) => i.title,
  },

  aurex_process: {
    label: 'Our Process',
    icon: Workflow,
    description: 'Vertical timeline of process steps (auto-alternating left/right).',
    configFields: [
      { key: 'title',    label: 'Section title', type: 'text',     placeholder: 'Our Process' },
      { key: 'subtitle', label: 'Subtitle',      type: 'textarea' },
    ],
    itemFields: [
      { key: 'step_number', label: 'Step #',      type: 'number', placeholder: 'auto' },
      { key: 'title',       label: 'Step title',  type: 'text',   required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    itemPreview: (i) => `${i.step_number || '·'}. ${i.title}`,
  },

  aurex_pricing: {
    label: 'Pricing',
    icon: DollarSign,
    description: 'Plan columns with features list. One plan can be marked "featured".',
    configFields: [
      { key: 'title',        label: 'Section title',           type: 'text',     placeholder: 'Pricing' },
      { key: 'subtitle',     label: 'Subtitle',                type: 'textarea' },
      { key: 'show_toggle',  label: 'Monthly/annual switch',   type: 'bool' },
    ],
    itemFields: [
      { key: 'name',         label: 'Plan name',         type: 'text', required: true },
      { key: 'price',        label: 'Price (monthly)',   type: 'text',    placeholder: '29' },
      { key: 'price_annual', label: 'Price (annual)',    type: 'text',    placeholder: '290' },
      { key: 'currency',     label: 'Currency',          type: 'text',    placeholder: 'USD' },
      { key: 'period',       label: 'Period label',      type: 'text',    placeholder: '/ month' },
      { key: 'badge',        label: 'Badge text',        type: 'text',    placeholder: 'Most popular' },
      { key: 'is_featured',  label: 'Featured plan',     type: 'bool' },
      { key: 'cta_text',     label: 'CTA text',          type: 'text',    placeholder: 'Get started' },
      { key: 'cta_url',      label: 'CTA URL',           type: 'url' },
      { key: 'features',     label: 'Features (one per line, prefix ✗ for excluded)', type: 'textarea', placeholder: 'Unlimited access\nPriority support\n✗ Custom domain' },
    ],
    itemPreview: (i) => `${i.name} — ${i.currency || '$'}${i.price || '–'}`,
  },

  aurex_team: {
    label: 'Our Team',
    icon: UserCircle,
    description: 'Team member grid with photos, roles, and social links.',
    configFields: [
      { key: 'title',              label: 'Section title',         type: 'text',     placeholder: 'Our Team' },
      { key: 'subtitle',           label: 'Subtitle',              type: 'textarea' },
      { key: 'show_view_all',      label: 'Show "View all" button', type: 'bool' },
      { key: 'view_all_text',      label: '"View all" button text', type: 'text',    placeholder: 'View full team' },
      { key: 'view_all_url',       label: '"View all" URL',         type: 'url' },
      { key: 'max_visible',        label: 'Max members on site',    type: 'number',  placeholder: '6' },
    ],
    itemFields: [
      { key: 'name',         label: 'Full name',       type: 'text', required: true },
      { key: 'role',         label: 'Position / role', type: 'text' },
      { key: 'photo_url',    label: 'Photo',           type: 'image' },
      { key: 'bio',          label: 'Short bio (≤120 chars)', type: 'textarea' },
      { key: 'linkedin_url', label: 'LinkedIn URL',    type: 'url' },
      { key: 'twitter_url',  label: 'Twitter/X URL',   type: 'url' },
      { key: 'other_url',    label: 'Other social URL', type: 'url' },
    ],
    itemPreview: (i) => `${i.name}${i.role ? ' · ' + i.role : ''}`,
  },

  aurex_events: {
    label: 'Events (from AUX Calendar)',
    icon: Calendar,
    description: 'Config-only. Events come from Calendar → Global Events. Change content there.',
    configFields: [
      { key: 'title',             label: 'Section title',        type: 'text',     placeholder: 'Upcoming Events' },
      { key: 'subtitle',          label: 'Subtitle',             type: 'textarea' },
      { key: 'max_items',         label: 'Max events to show',   type: 'number',   placeholder: '5' },
      { key: 'only_upcoming',     label: 'Upcoming only',        type: 'bool' },
      { key: 'view_all_text',     label: '"View all" button',    type: 'text',     placeholder: 'View all events' },
      { key: 'view_all_url',      label: '"View all" URL',       type: 'url' },
      { key: 'empty_message',     label: 'Empty-state message',  type: 'text',     placeholder: 'No upcoming events. Check back soon.' },
    ],
    itemFields: null,
  },

  aurex_partners: {
    label: 'Partners',
    icon: Building2,
    description: 'Partner logo strip (dark bg, grayscale→color on hover).',
    configFields: [
      { key: 'title',           label: 'Section title', type: 'text',     placeholder: 'Our Partners' },
      { key: 'autoscroll',      label: 'Auto-scrolling carousel', type: 'bool' },
      { key: 'scroll_speed',    label: 'Scroll speed (s per cycle)', type: 'number', placeholder: '30' },
    ],
    itemFields: [
      { key: 'name',      label: 'Partner name (internal)', type: 'text', required: true },
      { key: 'logo_url',  label: 'Logo (PNG/SVG)',          type: 'image' },
      { key: 'link_url',  label: 'Link URL',                type: 'url' },
      { key: 'link_target', label: 'Open in',               type: 'select', options: [
        { value: '_blank', label: 'New tab' }, { value: '_self', label: 'Same tab' }, { value: 'internal', label: 'Internal page' },
      ] },
    ],
    itemPreview: (i) => i.name,
  },

  aurex_clients: {
    label: 'Our Clients',
    icon: Award,
    description: 'Client logo gallery (light bg, grayscale→color on hover).',
    configFields: [
      { key: 'title',       label: 'Section title', type: 'text', placeholder: 'Our Clients' },
      { key: 'subtitle',    label: 'Subtitle',      type: 'textarea' },
      { key: 'autoscroll',  label: 'Auto-scrolling carousel', type: 'bool' },
    ],
    itemFields: [
      { key: 'name',      label: 'Client name (internal)', type: 'text', required: true },
      { key: 'logo_url',  label: 'Logo (PNG/SVG)',         type: 'image' },
      { key: 'link_url',  label: 'Link URL',               type: 'url' },
      { key: 'link_target', label: 'Open in',              type: 'select', options: [
        { value: '_blank', label: 'New tab' }, { value: '_self', label: 'Same tab' }, { value: 'internal', label: 'Internal page' },
      ] },
    ],
    itemPreview: (i) => i.name,
  },
};
