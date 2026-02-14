import { supabase } from '@/utils/supabase';
import { redirect } from 'next/navigation';

export default async function MentorSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check if a mentor exists with this slug or ID
  const { data: mentor } = await supabase
    .from('mentors')
    .select('slug')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single();

  if (mentor) {
    // Redirect to home page with the mentor slug (prefer slug over ID for URL)
    redirect(`/?mentor=${mentor.slug}`);
  }

  // If no mentor found, redirect to home or show 404
  // For now, let's just redirect to home
  redirect('/');
}
