import { createPricingRuleAction } from "@/app/(dashboard)/actions";

export default function NewPricingRuleForm() {
  return (
    <form action={createPricingRuleAction} className="space-y-4">
      <div>
        <label htmlFor="name">Rule name</label>
        <input id="name" name="name" type="text" required />
      </div>

      <div>
        <label htmlFor="start_date">Start date</label>
        <input id="start_date" name="start_date" type="date" required />
      </div>

      <div>
        <label htmlFor="end_date">End date</label>
        <input id="end_date" name="end_date" type="date" required />
      </div>

      <div>
        <label htmlFor="nightly_rate">Nightly rate</label>
        <input
          id="nightly_rate"
          name="nightly_rate"
          type="number"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="min_stay">Minimum stay</label>
        <input
          id="min_stay"
          name="min_stay"
          type="number"
          min="1"
          defaultValue={1}
          required
        />
      </div>

      <div>
        <label htmlFor="priority">Priority</label>
        <input
          id="priority"
          name="priority"
          type="number"
          defaultValue={1}
          required
        />
      </div>

      <button type="submit">Add pricing rule</button>
    </form>
  );
}