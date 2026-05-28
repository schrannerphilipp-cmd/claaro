import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";

export interface PublicTestimonial {
  id: string;
  customer_name: string;
  role: string | null;
  quote: string;
  rating: number;
  result: string | null;
  initials: string | null;
  color: string | null;
}

export const getPublicTestimonials = unstable_cache(
  async (): Promise<PublicTestimonial[]> => {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("public_testimonials")
        .select("id, customer_name, role, quote, rating, result, initials, color")
        .eq("is_approved", true)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public-testimonials"],
  { revalidate: 86400 }
);
