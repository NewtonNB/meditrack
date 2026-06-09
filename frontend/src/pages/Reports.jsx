import { reports as api } from '../api';
import { toast } from 'react-toastify';

const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(new Blob([data]));
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const report = async (fn, filename) => {
    try {
      const { data } = await fn();
      downloadBlob(data, filename);
      toast.success(`${filename} downloaded.`);
    } catch {
      toast.error('Failed to generate report.');
    }
  };

  const cards = [
    {
      title: 'Sales Report',
      desc: 'Detailed sales data with revenue breakdown.',
      actions: [
        { label: 'Export PDF',   fn: () => report(api.salesPdf,   'sales-report.pdf')   },
        { label: 'Export Excel', fn: () => report(api.salesExcel, 'sales-report.xlsx')  },
      ],
    },
    {
      title: 'Expiry Report',
      desc: 'Medicines expiring within the selected range.',
      actions: [
        { label: 'Export PDF',   fn: () => report(api.expiryPdf,   'expiry-report.pdf')  },
        { label: 'Export Excel', fn: () => report(api.expiryExcel, 'expiry-report.xlsx') },
      ],
    },
    {
      title: 'Stock Report',
      desc: 'Current stock levels and inventory value.',
      actions: [
        { label: 'Export PDF',   fn: () => report(api.stockPdf,   'stock-report.pdf')   },
        { label: 'Export Excel', fn: () => report(api.stockExcel, 'stock-report.xlsx')  },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(c => (
          <div key={c.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-2">{c.title}</h2>
            <p className="text-sm text-gray-500 mb-4">{c.desc}</p>
            <div className="flex flex-col gap-2">
              {c.actions.map(a => (
                <button
                  key={a.label}
                  onClick={a.fn}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <i className="bi bi-download mr-2" />{a.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
