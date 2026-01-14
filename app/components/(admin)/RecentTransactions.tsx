'use client';

import { Transaction } from '@/app/types/dashboard';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions 
}) => (
  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">ID</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Time</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Amount</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Items</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2 text-sm text-gray-900 font-medium">{txn.id}</td>
              <td className="py-3 px-2 text-sm text-gray-600">{txn.time}</td>
              <td className="py-3 px-2 text-sm text-gray-900">${txn.amount.toFixed(2)}</td>
              <td className="py-3 px-2 text-sm text-gray-600">{txn.items}</td>
              <td className="py-3 px-2">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  txn.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {txn.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);