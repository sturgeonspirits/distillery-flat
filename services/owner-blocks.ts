import { createClient } from "@/supabase/server";
import type { OwnerBlock } from "@/types/owner-block";

export async function getOwnerBlocks(): Promise<OwnerBlock[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owner_blocks")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load owner blocks: ${error.message}`);
  }

  return (data ?? []) as OwnerBlock[];
}

export async function getOwnerBlockById(id: string): Promise<OwnerBlock> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owner_blocks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load owner block: ${error.message}`);
  }

  return data as OwnerBlock;
}

export async function createOwnerBlock(input: {
  unit_id: string;
  title: string;
  start_date: string;
  end_date: string;
  reason: string;
}): Promise<OwnerBlock> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owner_blocks")
    .insert([input])
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create owner block: ${error.message}`);
  }

  return data as OwnerBlock;
}

export async function updateOwnerBlock(input: {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  reason: string;
}): Promise<OwnerBlock> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owner_blocks")
    .update({
      title: input.title,
      start_date: input.start_date,
      end_date: input.end_date,
      reason: input.reason,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update owner block: ${error.message}`);
  }

  return data as OwnerBlock;
}

export async function deleteOwnerBlock(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("owner_blocks")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete owner block: ${error.message}`);
  }
}