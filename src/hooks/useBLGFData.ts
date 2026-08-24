import { useState, useEffect } from 'react';
import { parquetRead } from 'hyparquet';
import { BLGFRawRecord } from '@/types/blgf';

// Import parquet file URL (works in Vite, Webpack 5, Next.js)
// Adjust filename if yours is named differently (e.g., blgf_sre.parquet)
import parquetUrl from '@/data/quezon_1000bill_1992_2025.parquet?url';

export function useBLGFParquet(customUrl?: string) {
  const [data, setData] = useState<BLGFRawRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadParquet() {
      try {
        setLoading(true);
        setError(null);

        const targetUrl = customUrl || parquetUrl;
        const response = await fetch(targetUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch Parquet file: ${response.statusText} (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Parse parquet records using hyparquet
        await parquetRead({
          file: arrayBuffer,
          rowFormat: 'object',
          onComplete: (rows: any[]) => {
            if (!isMounted) return;

            const filteredRows = rows.filter((row) => {
              const lguType = String(row.LGU_TYPE ?? '').trim().toLowerCase();
              const lguName = String(row.LGU_NAME ?? '').trim().toLowerCase();

              // Exclude if it is a Province OR named "Quezon" with Province type
              const isProvinceLevel = lguType === 'province' || (lguName === 'quezon' && lguType !== 'municipality');

              return !isProvinceLevel;
            });

            // Transform raw column values into typed BLGFRawRecord objects
            const typedRows: BLGFRawRecord[] = filteredRows.map((row) => ({
              YEAR: Number(row.YEAR),
              REGION: String(row.REGION ?? ''),
              PROVINCE: String(row.PROVINCE ?? ''),
              LGU_NAME: String(row.LGU_NAME ?? ''),
              LGU_TYPE: row.LGU_TYPE as any,

              REV_NTA_IRA: Number(row.REV_NTA_IRA ?? 0),
              REV_BIZ_TAX: Number(row.REV_BIZ_TAX ?? 0),
              REV_RPT: Number(row.REV_RPT ?? 0),
              REV_ECONOMIC_ENTERPRISE: Number(row.REV_ECONOMIC_ENTERPRISE ?? 0),
              REV_FEES_CHARGES: Number(row.REV_FEES_CHARGES ?? 0),
              REV_OTHER_LOCAL: Number(row.REV_OTHER_LOCAL ?? 0),
              REV_OTHER_EXTERNAL: Number(row.REV_OTHER_EXTERNAL ?? 0),
              TOTAL_OPERATING_INCOME: Number(row.TOTAL_OPERATING_INCOME ?? 0),

              EXP_GEN_ADMIN: Number(row.EXP_GEN_ADMIN ?? 0),
              EXP_HEALTH: Number(row.EXP_HEALTH ?? 0),
              EXP_EDUCATION: Number(row.EXP_EDUCATION ?? 0),
              EXP_SOCIAL_WELFARE: Number(row.EXP_SOCIAL_WELFARE ?? 0),
              EXP_ECONOMIC_SERVICES: Number(row.EXP_ECONOMIC_SERVICES ?? 0),
              EXP_DEBT_SERVICE: Number(row.EXP_DEBT_SERVICE ?? 0),
              EXP_CAPITAL_OUTLAY: Number(row.EXP_CAPITAL_OUTLAY ?? 0),
              EXP_OTHER: Number(row.EXP_OTHER ?? 0),
              TOTAL_EXPENDITURES: Number(row.TOTAL_EXPENDITURES ?? 0),

              BILL_REV_NTA_IRA: Number(row.BILL_REV_NTA_IRA ?? 0),
              BILL_REV_BIZ_TAX: Number(row.BILL_REV_BIZ_TAX ?? 0),
              BILL_REV_RPT: Number(row.BILL_REV_RPT ?? 0),
              BILL_REV_ECONOMIC_ENTERPRISE: Number(row.BILL_REV_ECONOMIC_ENTERPRISE ?? 0),
              BILL_REV_FEES_CHARGES: Number(row.BILL_REV_FEES_CHARGES ?? 0),
              BILL_REV_OTHER_LOCAL: Number(row.BILL_REV_OTHER_LOCAL ?? 0),
              BILL_REV_OTHER_EXTERNAL: Number(row.BILL_REV_OTHER_EXTERNAL ?? 0),

              BILL_EXP_GEN_ADMIN: Number(row.BILL_EXP_GEN_ADMIN ?? 0),
              BILL_EXP_HEALTH: Number(row.BILL_EXP_HEALTH ?? 0),
              BILL_EXP_EDUCATION: Number(row.BILL_EXP_EDUCATION ?? 0),
              BILL_EXP_SOCIAL_WELFARE: Number(row.BILL_EXP_SOCIAL_WELFARE ?? 0),
              BILL_EXP_ECONOMIC_SERVICES: Number(row.BILL_EXP_ECONOMIC_SERVICES ?? 0),
              BILL_EXP_DEBT_SERVICE: Number(row.BILL_EXP_DEBT_SERVICE ?? 0),
              BILL_EXP_CAPITAL_OUTLAY: Number(row.BILL_EXP_CAPITAL_OUTLAY ?? 0),
              BILL_EXP_OTHER: Number(row.BILL_EXP_OTHER ?? 0),
            }));

            setData(typedRows);
            setLoading(false);
          },
        });
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error parsing Parquet dataset');
          setLoading(false);
        }
      }
    }

    loadParquet();

    return () => {
      isMounted = false;
    };
  }, [customUrl]);

  return { data, loading, error };
}
