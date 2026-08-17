import { useEffect } from 'react';

export default function Receipt({ sale, onClose, onNewSale }) {
  useEffect(() => {
    // Auto-focus for keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Trigger print which can save as PDF
    window.print();
  };

  if (!sale) return null;

  const today = new Date();
  const pharmacyName = JSON.parse(localStorage.getItem('auth_user') || '{}').pharmacy?.name || 'MediTrack Pharmacy';
  const pharmacyPhone = JSON.parse(localStorage.getItem('auth_user') || '{}').pharmacy?.phone || '';
  const pharmacyAddress = JSON.parse(localStorage.getItem('auth_user') || '{}').pharmacy?.address || '';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 print:hidden" onClick={onClose} />

      {/* Receipt Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full print:shadow-none print:max-w-full print:rounded-none">
          
          {/* Action Buttons (hidden on print) */}
          <div className="flex justify-between items-center gap-2 p-4 border-b print:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Receipt</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                <i className="bi bi-printer" />
                Print / Save as PDF
              </button>
              {onNewSale && (
                <button
                  onClick={onNewSale}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2">
                  <i className="bi bi-plus-circle" />
                  New Sale
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-8 print:p-12" id="receipt-content">
            
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{pharmacyName}</h1>
              {pharmacyAddress && <p className="text-sm text-gray-600 mt-1">{pharmacyAddress}</p>}
              {pharmacyPhone && <p className="text-sm text-gray-600">{pharmacyPhone}</p>}
              <p className="text-xs text-gray-500 mt-2">SALES RECEIPT</p>
            </div>

            {/* Receipt Info */}
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt No:</span>
                <span className="font-semibold">#{sale.id?.toString().padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{today.toLocaleDateString()} {today.toLocaleTimeString()}</span>
              </div>
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold">{sale.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="font-semibold capitalize">{sale.payment_method?.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-gray-300 py-3 mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-2 font-semibold">
                <span className="flex-1">Item</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-24 text-right">Price</span>
                <span className="w-24 text-right">Total</span>
              </div>
              
              {/* Handle multiple items from POS or single item from Sales */}
              {sale.items && Array.isArray(sale.items) ? (
                // Multiple items (POS)
                sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm mb-1">
                    <span className="flex-1 font-medium text-gray-900">{item.name}</span>
                    <span className="w-16 text-center text-gray-700">{item.quantity}</span>
                    <span className="w-24 text-right text-gray-700">UGX {Number(item.selling_price || item.unit_price).toLocaleString()}</span>
                    <span className="w-24 text-right font-semibold text-gray-900">UGX {Number(item.total || (item.quantity * (item.selling_price || item.unit_price))).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                // Single item (Sales)
                <div className="flex justify-between text-sm">
                  <span className="flex-1 font-medium text-gray-900">{sale.medicine_name}</span>
                  <span className="w-16 text-center text-gray-700">{sale.quantity}</span>
                  <span className="w-24 text-right text-gray-700">UGX {Number(sale.unit_price).toLocaleString()}</span>
                  <span className="w-24 text-right font-semibold text-gray-900">UGX {Number(sale.total_amount).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span>UGX {Number(sale.total_amount).toLocaleString()}</span>
              </div>
              {sale.change > 0 && (
                <div className="flex justify-between text-base text-green-600 font-semibold">
                  <span>Change</span>
                  <span>UGX {Number(sale.change).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-xs text-gray-600 font-semibold mb-1">Notes:</p>
                <p className="text-sm text-gray-700">{sale.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-dashed border-gray-300">
              <p className="font-semibold">Thank you for your purchase!</p>
              <p className="mt-1">Please keep this receipt for your records</p>
              <p className="mt-3 text-gray-400">Powered by MediTrack</p>
            </div>

          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}
