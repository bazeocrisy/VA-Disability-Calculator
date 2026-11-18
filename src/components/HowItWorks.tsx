export function HowItWorks() {
  return (
    <div className="prose-grid">
      <article className="info-card">
        <h3>How VA disability percentages work</h3>
        <p>
          VA rates each service-connected condition from 0% to 100% in steps of 10, based on how much it affects your
          health and ability to work. Your monthly payment is based on your <strong>combined</strong> rating — not on any
          single condition — plus your eligible dependents once you reach 30%.
        </p>
      </article>
      <article className="info-card">
        <h3>Why 50% + 30% doesn’t equal 80%</h3>
        <p>
          VA uses “whole person” math (38 CFR § 4.25). If you’re 50% disabled, you’re treated as 50% able. A 30%
          condition then takes 30% of the <em>remaining</em> 50% — that’s 15 more points, for 65. VA rounds 65 to the
          nearest 10, rounding 5s up, so the final rating is <strong>70%</strong>.
        </p>
        <p>
          With three or more conditions VA keeps the exact combined value (for example 65) for the next step, and rounds
          only once at the end. Example: 50 + 30 + 20 → 65, then 65 with 20 → 72, rounded to 70%.
        </p>
      </article>
      <article className="info-card">
        <h3>The bilateral factor</h3>
        <p>
          When both arms, or both legs, have compensable ratings (38 CFR § 4.26), VA combines those ratings first and then
          <strong> adds</strong> 10% of that value. Example: right knee 10% and left knee 10% combine to 19; adding 1.9
          gives 20.9, used as 21. If including a condition in the bilateral calculation would lower your result, VA
          leaves it out — this calculator checks every option and uses the most favorable one.
        </p>
      </article>
      <article className="info-card">
        <h3>How dependents affect compensation</h3>
        <p>
          At <strong>10% and 20%</strong>, dependents don’t change your payment. From <strong>30%</strong> up, VA has a
          separate rate row for each household: spouse, dependent parents, and a first child. Each additional child
          under 18 and each child 18–23 in a VA-approved school program adds a set amount, and so does a spouse who
          receives Aid and Attendance. These amounts rise with your rating, so they are not flat add-ons.
        </p>
      </article>
      <article className="info-card">
        <h3>How COLA increases work</h3>
        <p>
          Each year VA increases compensation by the same percentage as Social Security’s cost-of-living adjustment,
          usually effective December 1 (paid starting in January). Social Security announced a 3.6% increase for 2027 on
          October 14, 2026. Until VA publishes its 2027 tables, our 2027 numbers are clearly labeled <strong>projected</strong>.
        </p>
      </article>
      <article className="info-card">
        <h3>Basic compensation, TDIU, and SMC</h3>
        <dl className="defs">
          <dt>Basic compensation</dt>
          <dd>The monthly amount for your combined rating and dependents — what this calculator estimates.</dd>
          <dt>TDIU (Individual Unemployability)</dt>
          <dd>
            If VA finds your service-connected conditions keep you from holding steady work, VA can pay at the 100% rate
            even if your combined rating is lower. Only VA can grant TDIU; we never assume it.
          </dd>
          <dt>Special Monthly Compensation (SMC)</dt>
          <dd>
            Extra pay for specific situations such as loss of use of a limb or needing help with daily activities. SMC uses
            separate VA tables and is not estimated here.
          </dd>
        </dl>
      </article>
    </div>
  );
}
