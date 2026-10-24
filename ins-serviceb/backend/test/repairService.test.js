'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateRepairCosts,
  getCoverageLimit,
  inferCoverageType,
  resolveCoverageRule,
  canTransition,
} = require('../src/services/repairCalculations');

test('calculates customer excess when estimated repair exceeds remaining insurance cover', () => {
  assert.deepEqual(calculateRepairCosts(15000, 10000), {
    cost_covered_by_insurance: 10000,
    customer_excess_paid: 5000,
  });
});

test('does not charge customer excess when insurance limit covers the repair', () => {
  assert.deepEqual(calculateRepairCosts(8500, 10000), {
    cost_covered_by_insurance: 8500,
    customer_excess_paid: 0,
  });
});

test('applies a policy excess without exceeding the available insurance limit', () => {
  assert.deepEqual(calculateRepairCosts(15000, 20000, 500), {
    cost_covered_by_insurance: 14500,
    customer_excess_paid: 500,
  });
  assert.deepEqual(calculateRepairCosts(15000, 10000, 500), {
    cost_covered_by_insurance: 10000,
    customer_excess_paid: 5000,
  });
});

test('uses the lower of the policy remaining amount and coverage-rule maximum', () => {
  assert.equal(getCoverageLimit(10000, { max_amount: 25000 }), 10000);
  assert.equal(getCoverageLimit(41900, { max_amount: 25000 }), 25000);
  assert.equal(getCoverageLimit(10000, null), 10000);
});

test('matches damage symptoms to eligible policy coverage rules', () => {
  const rules = [
    { coverage_type: 'SCREEN_CRACK', excess_amount: 0 },
    { coverage_type: 'WATER_DAMAGE', excess_amount: 500 },
  ];
  assert.equal(resolveCoverageRule(rules, undefined, 'เครื่องตกน้ำ').excess_amount, 500);
  assert.equal(resolveCoverageRule(rules, 'SCREEN_CRACK', 'จอแตก').coverage_type, 'SCREEN_CRACK');
  assert.equal(resolveCoverageRule(rules, 'THEFT', 'จอแตก'), null);
  assert.equal(inferCoverageType('น้ำเข้าเครื่อง'), 'WATER_DAMAGE');
  assert.equal(resolveCoverageRule(rules, undefined, 'ลำโพงแตก'), null);
});

test('allows only the configured repair status transitions', () => {
  assert.equal(canTransition('RECEIVED', 'DIAGNOSING'), true);
  assert.equal(canTransition('IN_PROGRESS', 'REPAIR_COMPLETED'), true);
  assert.equal(canTransition('RECEIVED', 'DELIVERED'), false);
  assert.equal(canTransition('DELIVERED', 'IN_PROGRESS'), false);
});
