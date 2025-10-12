/**
 * Projects Index Page
 * 
 * Redirects to /projects/all
 */

import { redirect } from 'next/navigation';

export default function ProjectsPage() {
  redirect('/projects/all');
}