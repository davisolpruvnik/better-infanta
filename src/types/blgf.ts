// 1:1 Mapping to your Parquet schema
export interface BLGFRawRecord {
  YEAR: number;
  REGION: string;
  PROVINCE: string;
  LGU_NAME: string;
  LGU_TYPE: 'Municipality' | 'City' | 'Province';

  // Raw Revenue (PHP)
  REV_NTA_IRA: number;
  REV_BIZ_TAX: number;
  REV_RPT: number;
  REV_ECONOMIC_ENTERPRISE: number;
  REV_FEES_CHARGES: number;
  REV_OTHER_LOCAL: number;
  REV_OTHER_EXTERNAL: number;
  TOTAL_OPERATING_INCOME: number;

  // Raw Expenditures (PHP)
  EXP_GEN_ADMIN: number;
  EXP_HEALTH: number;
  EXP_EDUCATION: number;
  EXP_SOCIAL_WELFARE: number;
  EXP_ECONOMIC_SERVICES: number;
  EXP_DEBT_SERVICE: number;
  EXP_CAPITAL_OUTLAY: number;
  EXP_OTHER: number;
  TOTAL_EXPENDITURES: number;

  // ₱1,000 Bill Proportions (Precalculated in Parquet)
  BILL_REV_NTA_IRA: number;
  BILL_REV_BIZ_TAX: number;
  BILL_REV_RPT: number;
  BILL_REV_ECONOMIC_ENTERPRISE: number;
  BILL_REV_FEES_CHARGES: number;
  BILL_REV_OTHER_LOCAL: number;
  BILL_REV_OTHER_EXTERNAL: number;

  BILL_EXP_GEN_ADMIN: number;
  BILL_EXP_HEALTH: number;
  BILL_EXP_EDUCATION: number;
  BILL_EXP_SOCIAL_WELFARE: number;
  BILL_EXP_ECONOMIC_SERVICES: number;
  BILL_EXP_DEBT_SERVICE: number;
  BILL_EXP_CAPITAL_OUTLAY: number;
  BILL_EXP_OTHER: number;
}

export interface SpendingCategoryItem {
  key: keyof BLGFRawRecord;
  name: string;
  category: string;
  billAmount: number;
  rawAmount: number;
  color: string;
}

export function getLocalRevenue(row: BLGFRawRecord): number {
  return (
    row.REV_BIZ_TAX +
    row.REV_RPT +
    row.REV_ECONOMIC_ENTERPRISE +
    row.REV_FEES_CHARGES +
    row.REV_OTHER_LOCAL
  );
}

export function getNTADependency(row: BLGFRawRecord): number {
  if (!row.TOTAL_OPERATING_INCOME || row.TOTAL_OPERATING_INCOME === 0) return 0;
  return (row.REV_NTA_IRA / row.TOTAL_OPERATING_INCOME) * 100;
}
