import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Knowledge Bases | BidOps.AI',
  description: 'Browse and manage knowledge bases',
};

/**
 * Knowledge Bases Root Page
 * 
 * Redirects to /knowledge-bases/all to display the list of all knowledge bases.
 * This follows the same pattern as the projects page structure.
 */
export default function KnowledgeBasesPage() {
  redirect('/knowledge-bases/all');
}