'use strict';

const REPAIR_STATUSES = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_PARTS',
  'IN_PROGRESS',
  'REPAIR_COMPLETED',
  'DELIVERED',
  'CANCELLED',
];

const STATUS_TRANSITIONS = {
  RECEIVED: ['DIAGNOSING', 'CANCELLED'],
  DIAGNOSING: ['WAITING_PARTS', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['REPAIR_COMPLETED', 'CANCELLED'],
  REPAIR_COMPLETED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function calculateRepairCosts(cost, coverageLimit, fixedExcess = 0) {
  const total = Number(cost);
  const limit = Number(coverageLimit);
  const deductible = Math.min(total, Number(fixedExcess));
  const covered = Math.min(Math.max(total - deductible, 0), limit);
  return {
    cost_covered_by_insurance: covered,
    customer_excess_paid: Math.max(total - covered, 0),
  };
}

function getCoverageLimit(policyRemaining, rule) {
  const remaining = Number(policyRemaining);
  const ruleLimit = rule?.max_amount === null || rule?.max_amount === undefined
    ? remaining
    : Number(rule.max_amount);
  return Math.min(remaining, ruleLimit);
}

function inferCoverageType(symptom) {
  const normalized = symptom.toLowerCase();
  if (/น้ำ|water|liquid/.test(normalized)) return 'WATER_DAMAGE';
  if (/จอ|screen|display/.test(normalized)) return 'SCREEN_CRACK';
  if (/อุบัติเหตุ|ตก|กระแทก|accident/.test(normalized)) return 'ACCIDENTAL';
  return null;
}

function resolveCoverageRule(rules, requestedType, symptom) {
  const coverageType = requestedType || inferCoverageType(symptom);
  if (!coverageType) return null;
  return rules.find((rule) => rule.coverage_type === coverageType) || null;
}

function canTransition(from, to) {
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}

module.exports = {
  REPAIR_STATUSES,
  calculateRepairCosts,
  getCoverageLimit,
  inferCoverageType,
  resolveCoverageRule,
  canTransition,
};
