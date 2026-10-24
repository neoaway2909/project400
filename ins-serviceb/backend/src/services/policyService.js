const { mockPackages, mockPolicies, getNextPolicyNo } = require('../database/mockStore');
const { addMonths, isAfter, isBefore, parseISO } = require('date-fns');

// ============================================================
// PolicyService: Business Logic Layer
// ============================================================
class PolicyService {

  // ----------------------------------------------------------
  // สร้างกรมธรรม์ใหม่ (POST /policies)
  // ----------------------------------------------------------
  async createPolicy(data) {
    const {
      store_id, order_id, imei, device_model, device_price,
      package_code, customer, purchased_at
    } = data;

    // 1. ตรวจสอบแพ็กเกจว่ามีอยู่และ active
    const pkg = mockPackages.find(p => p.package_code === package_code && p.is_active);
    if (!pkg) {
      const err = new Error(`Package '${package_code}' not found or inactive`);
      err.code = 'PACKAGE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 2. ตรวจสอบ IMEI ซ้ำ (ไม่ให้มีกรมธรรม์ ACTIVE ซ้อนกัน)
    const now = new Date();
    const duplicatePolicy = mockPolicies.find(p =>
      p.imei === imei &&
      p.status === 'ACTIVE' &&
      isAfter(new Date(p.coverage_end), now)
    );
    if (duplicatePolicy) {
      const err = new Error(
        `IMEI ${imei} already has an active policy: ${duplicatePolicy.policy_no}. ` +
        `Coverage expires at ${duplicatePolicy.coverage_end}`
      );
      err.code = 'DUPLICATE_IMEI_POLICY';
      err.statusCode = 409;
      throw err;
    }

    // 3. คำนวณวันเริ่มและหมดอายุ
    const purchasedDate = parseISO(purchased_at);
    const coverageStart = purchasedDate;
    const coverageEnd = addMonths(purchasedDate, pkg.coverage_months);
    // ตั้งเวลาหมดอายุเป็น 23:59:59
    coverageEnd.setHours(23, 59, 59, 999);

    // 4. สร้าง Policy No อัตโนมัติ
    const policyNo = getNextPolicyNo();

    // 5. สร้างกรมธรรม์ใหม่
    const newPolicy = {
      policy_no: policyNo,
      package_id: pkg.id,
      package_code: pkg.package_code,
      package_name: pkg.package_name,
      store_id,
      order_id,
      imei,
      device_model,
      device_price: device_price || null,
      customer_name: customer.full_name,
      customer_phone: customer.phone_number,
      customer_email: customer.email || null,
      coverage_start: coverageStart.toISOString(),
      coverage_end: coverageEnd.toISOString(),
      max_coverage_amount: pkg.max_coverage_amount,
      remaining_claim_amount: pkg.max_coverage_amount,
      claim_count: 0,
      max_claim_count: pkg.max_claim_count,
      status: 'ACTIVE',
      e_warranty_url: `${process.env.WARRANTY_BASE_URL || 'https://warranty.example.com/card'}/${policyNo}`,
      purchased_at: purchasedDate.toISOString(),
      created_at: now.toISOString()
    };

    // 6. บันทึก (ใน mock store)
    mockPolicies.push(newPolicy);

    return newPolicy;
  }

  // ----------------------------------------------------------
  // ตรวจสอบสิทธิ์ด้วย IMEI (GET /policies/verify?imei=)
  // ----------------------------------------------------------
  async verifyByImei(imei) {
    // ค้นหากรมธรรม์ล่าสุดของ IMEI นี้
    const policies = mockPolicies
      .filter(p => p.imei === imei)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (policies.length === 0) {
      const err = new Error(`ไม่พบข้อมูลกรมธรรม์สำหรับเลขอีมี่นี้ในระบบ`);
      err.code = 'POLICY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const policy = policies[0]; // กรมธรรม์ล่าสุด
    const now = new Date();
    const coverageEnd = new Date(policy.coverage_end);
    const coverageStart = new Date(policy.coverage_start);

    // ตรวจสอบสถานะ
    let currentStatus = policy.status;
    const isInPeriod = isAfter(coverageEnd, now) && isBefore(coverageStart, now);
    const hasRemainingAmount = policy.remaining_claim_amount > 0;
    const hasRemainingCount = policy.claim_count < policy.max_claim_count;

    const isValid = currentStatus === 'ACTIVE' && isInPeriod && hasRemainingAmount && hasRemainingCount;

    // สรุปความสามารถในการเคลม
    const pkg = mockPackages.find(p => p.package_code === policy.package_code);
    const claimableRules = pkg ? pkg.coverage_rules.map(r => ({
      coverage_type: r.coverage_type,
      rule_name: r.rule_name,
      max_amount: r.max_amount,
      excess_amount: r.excess_amount
    })) : [];

    return {
      is_valid: isValid,
      policy_no: policy.policy_no,
      imei: policy.imei,
      device_model: policy.device_model,
      policy_status: currentStatus,
      store_id: policy.store_id,
      customer_name: policy.customer_name,
      coverage_details: {
        package_name: policy.package_name,
        coverage_start: policy.coverage_start,
        expires_at: policy.coverage_end,
        remaining_claim_amount: policy.remaining_claim_amount,
        claim_count: policy.claim_count,
        max_claim_count: policy.max_claim_count,
        claimable_rules: claimableRules
      },
      validation_reason: isValid ? null : this._getInvalidReason(currentStatus, isInPeriod, hasRemainingAmount, hasRemainingCount)
    };
  }

  // ----------------------------------------------------------
  // ดึงรายการแพ็กเกจทั้งหมด (GET /policies/packages)
  // ----------------------------------------------------------
  async getPackages(includeInactive = false) {
    return mockPackages.filter(p => includeInactive || p.is_active);
  }

  // ----------------------------------------------------------
  // ดึงกรมธรรม์ทั้งหมด (Admin)
  // ----------------------------------------------------------
  async getAllPolicies({ status, store_id, search, page = 1, limit = 20 } = {}) {
    let filtered = [...mockPolicies];

    if (status) filtered = filtered.filter(p => p.status === status);
    if (store_id) filtered = filtered.filter(p => p.store_id === store_id);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.policy_no.toLowerCase().includes(s) ||
        p.imei.includes(s) ||
        p.customer_name.toLowerCase().includes(s) ||
        p.device_model.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit);

    return { items, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  // ----------------------------------------------------------
  // Dashboard Statistics
  // ----------------------------------------------------------
  async getDashboardStats() {
    const now = new Date();
    const total = mockPolicies.length;
    const active = mockPolicies.filter(p => p.status === 'ACTIVE').length;
    const expired = mockPolicies.filter(p => p.status === 'EXPIRED').length;
    const voidCount = mockPolicies.filter(p => p.status === 'VOID').length;
    const claimedOut = mockPolicies.filter(p => p.status === 'CLAIMED_OUT').length;

    // ยอดรายเดือน (6 เดือนย้อนหลัง)
    const monthlyData = this._getMonthlyStats();

    // รุ่นโทรศัพท์ยอดนิยม
    const deviceCount = {};
    mockPolicies.forEach(p => {
      const brand = p.device_model.split(' ')[0];
      deviceCount[brand] = (deviceCount[brand] || 0) + 1;
    });
    const topDevices = Object.entries(deviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));

    // แพ็กเกจยอดนิยม
    const packageCount = {};
    mockPolicies.forEach(p => {
      packageCount[p.package_name] = (packageCount[p.package_name] || 0) + 1;
    });
    const topPackages = Object.entries(packageCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return {
      total_policies: total,
      active_policies: active,
      expired_policies: expired,
      void_policies: voidCount,
      claimed_out_policies: claimedOut,
      monthly_data: monthlyData,
      top_devices: topDevices,
      top_packages: topPackages
    };
  }

  // ----------------------------------------------------------
  // อัปเดตแพ็กเกจ (Admin)
  // ----------------------------------------------------------
  async updatePackage(packageCode, updateData) {
    const idx = mockPackages.findIndex(p => p.package_code === packageCode);
    if (idx === -1) {
      const err = new Error(`Package '${packageCode}' not found`);
      err.code = 'PACKAGE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    Object.assign(mockPackages[idx], updateData, { updated_at: new Date().toISOString() });
    return mockPackages[idx];
  }

  // Private Helpers
  _getInvalidReason(status, isInPeriod, hasAmount, hasCount) {
    if (status === 'VOID') return 'กรมธรรม์ถูกยกเลิก (VOID)';
    if (status === 'CLAIMED_OUT') return 'ใช้สิทธิ์เคลมครบแล้ว';
    if (!isInPeriod) return 'อยู่นอกระยะเวลาคุ้มครอง';
    if (!hasAmount) return 'วงเงินเคลมหมดแล้ว';
    if (!hasCount) return 'จำนวนครั้งเคลมครบแล้ว';
    return 'ไม่มีสิทธิ์เคลม';
  }

  _getMonthlyStats() {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('th-TH', { month: 'short', year: '2-digit' });
      const count = mockPolicies.filter(p => {
        const created = new Date(p.created_at);
        return created.getFullYear() === d.getFullYear() &&
               created.getMonth() === d.getMonth();
      }).length;
      months.push({ month: label, count });
    }
    return months;
  }
}

module.exports = new PolicyService();
