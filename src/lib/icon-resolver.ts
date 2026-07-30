// src/lib/iconResolver.ts

// 💡 Export the Prefix Map so you can reference or extend it anywhere
export const PREFIX_MAP: Record<string, string> = {
  Ri: 'ri', // Remix Icons -> ri
  Lu: 'lucide', // Lucide -> lucide
  Fi: 'feather', // Feather -> feather
  Fa: 'fa6-solid', // Font Awesome 6 Solid -> fa6-solid
  Md: 'mdi', // Material Design -> mdi
  Bs: 'bi', // Bootstrap Icons -> bi
  Bi: 'bx', // BoxIcons -> bx
  Tb: 'tabler', // Tabler -> tabler
  Hi: 'heroicons', // Heroicons v1 -> heroicons
  Hi2: 'heroicons', // Heroicons v2 -> heroicons
  Ai: 'ant-design', // Ant Design -> ant-design
  Io: 'ion', // Ionicons -> ion
  Go: 'octicon', // Octicons -> octicon
  Si: 'simple-icons', // Simple Icons -> simple-icons
  Ti: 'typcn',
  Pi: 'ph',
  Roentgen: 'roentgen',
  Carbon: 'carbon',
};

/**
 * Translates PascalCase React Icon names (e.g. "MdDirectionsBoatFilled" or "LuShip")
 * into lowercase-kebab Iconify identifiers (e.g. "mdi:directions-boat-filled" or "lucide:ship")
 */
export function resolveIconName(iconName?: string): string {
  const name = (iconName || 'RiFileTextLine').trim();

  // If the icon is already in Iconify format (like "mdi:directions-boat-filled"), return it directly
  if (name.includes(':')) {
    return name;
  }

  // Extract prefix (Group 1) and the rest of the PascalCase name (Group 2)
  const match = name.match(/^([A-Z][a-z]?[0-9]?)([A-Z].*)$/);
  let iconifyPrefix = 'ri';
  let cleanName = name;

  if (match) {
    const reactIconsPrefix = match[1];
    cleanName = match[2];
    if (PREFIX_MAP[reactIconsPrefix]) {
      iconifyPrefix = PREFIX_MAP[reactIconsPrefix];
    }
  }

  // Convert to kebab-case
  const kebabCase = cleanName
    .replace(/([A-Z])/g, '-$1')
    .replace(/([0-9]+)/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/-+/g, '-');

  return `${iconifyPrefix}:${kebabCase}`;
}
