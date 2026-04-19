export type TurnoverStatus =
  | "not_started"
  | "in_progress"
  | "ready"
  | "issue";

export type TurnoverChecklist = {
  id: string;
  unit_id: string;
  turnover_date: string;
  status: TurnoverStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};