// src/components/transparency/AuditsTab.tsx
interface AuditFinding {
  id: string;
  year: number;
  category: string;
  finding: string;
  actionTaken: string;
  compliance: 'Fully Complied' | 'Ongoing' | 'Pending';
}

const AUDIT_REPORTS = [
  {
    year: 2024,
    opinion: 'Qualified Opinion',
    description:
      'Fair presentation of financial positions except for the effects of unverified asset inventories subject to ongoing reconciliation.',
    disallowedTotal: '₱0.00',
    suspendedTotal: '₱420,500.00',
  },
  {
    year: 2023,
    opinion: 'Unqualified (Clean) Opinion',
    description:
      'Financial statements present fairly, in all material respects, the financial position and cash flows in accordance with IPSAS.',
    disallowedTotal: '₱0.00',
    suspendedTotal: '₱0.00',
  },
  {
    year: 2022,
    opinion: 'Qualified Opinion',
    description:
      'Incomplete physical count of property, plant, and equipment (PPE) accounts carried over from historical registries.',
    disallowedTotal: '₱120,000.00',
    suspendedTotal: '₱1,150,000.00',
  },
];

const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: 'AAR-24-01',
    year: 2024,
    category: 'Cash & Cash Equivalents',
    finding: 'Delayed submission of monthly Bank Reconciliation Statements (BRS) by 14 days.',
    actionTaken: 'Municipal Treasurer designated an additional accounting officer to enforce monthly cut-offs.',
    compliance: 'Fully Complied',
  },
  {
    id: 'AAR-24-02',
    year: 2024,
    category: 'Procurement (RA 9184)',
    finding: 'Incomplete warranty security attachments on 2 minor infrastructure supply vouchers.',
    actionTaken: 'Retention vouchers updated with certified retention bonds from supplier.',
    compliance: 'Fully Complied',
  },
  {
    id: 'AAR-24-03',
    year: 2024,
    category: 'Local Disaster Risk Fund (LDRRMF)',
    finding: 'Unexpended balance of Quick Response Fund (QRF) required transfer to Special Trust Fund.',
    actionTaken: 'Journal Entry Voucher (JEV) posted transferring ₱3.2M into the LDRRMF Trust Fund.',
    compliance: 'Fully Complied',
  },
  {
    id: 'AAR-23-01',
    year: 2023,
    category: 'Fixed Asset Inventory (PPE)',
    finding: 'Discrepancy between general ledger balances and physical inventory reports on historical office equipment.',
    actionTaken: 'LGU Inventory Committee completed barcode appraisal and dropped obsolete assets.',
    compliance: 'Ongoing',
  },
];

export default function AuditsTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* COA Annual Reports History */}
      <div>
        <h3 className="text-lg font-axis-wide-header uppercase text-slate-900 mb-3">
          Annual Audit Reports (AAR) by Commission on Audit
        </h3>
        <p className="text-xs text-slate-600 mb-4 font-sans">
          Official statutory reviews mandated under the Philippine Constitution to verify municipal fund management integrity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AUDIT_REPORTS.map((report) => (
            <div
              key={report.year}
              className="bg-white border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span className="font-mono text-xl font-bold text-slate-900">
                    CY {report.year}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      report.opinion.includes('Unqualified')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {report.opinion}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {report.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-mono grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Disallowances</span>
                  <span className="font-bold text-slate-800">{report.disallowedTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Suspensions</span>
                  <span className="font-bold text-slate-800">{report.suspendedTotal}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Observations & Compliance Matrix */}
      <div>
        <h3 className="text-lg font-axis-wide-header uppercase text-slate-900 mb-3">
          Status of Audit Recommendations & Corrective Actions
        </h3>
        <div className="bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-axis-navbar-focus uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Fiscal Year</th>
                <th className="py-3 px-4">Audit Area</th>
                <th className="py-3 px-4">COA Observation / Finding</th>
                <th className="py-3 px-4">LGU Action Taken</th>
                <th className="py-3 px-4">Validation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {AUDIT_FINDINGS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 font-bold">
                    {item.id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{item.year}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.category}</td>
                  <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-xs">{item.finding}</td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-xs">{item.actionTaken}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                        item.compliance === 'Fully Complied'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.compliance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
