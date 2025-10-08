/**
 * Menu and Navigation Types
 *
 * Type definitions for sidebar menu items
 */

import { LucideIcon } from 'lucide-react';
import { UserRole } from './user.types';

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  items?: MenuItem[];
  requiredPermission?: string;
  roles?: UserRole[]; // User roles that can see this item
}

export interface MenuSection {
  id: string;
  items: MenuItem[];
}