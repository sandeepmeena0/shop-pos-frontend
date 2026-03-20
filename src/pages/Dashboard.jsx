import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/index.js';
import { Link } from 'react-router-dom';
import {
  CurrencyRupeeIcon, ShoppingCartIcon, ArrowTrendingUpIcon,
  UserGroupIcon, ExclamationTriangleIcon, CubeIcon, ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';

const getPaymentBadge = (method) => {
  const map = {
    Cash: 'bg-green-100 text-green-700',
    Card: 'bg-blue-100 text-blue-700',
    UPI: 'bg-primary/10 text-primary',
  };
  return map[method] || 'bg-gray-100 text-gray-700';
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-500 ${color.bg}`} />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-3xl font-black text-gray-800">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await dashboardService.getStats();
        setStats(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) return <div className="text-center text-gray-400 py-20">Failed to load dashboard data.</div>;

  const avgOrderValue = stats.today.orders > 0 ? (stats.today.sales / stats.today.orders) : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Real-time store performance</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm font-medium text-primary text-sm whitespace-nowrap">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard 
          label="Today's Sales" 
          value={`₹${(stats.today.sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon={CurrencyRupeeIcon} 
          color={{ bg: 'bg-primary/10', icon: 'bg-primary/10 text-primary' }}
          sub={`Gross Sales`} 
        />
        <StatCard 
          label="Today's Refunds" 
          value={`₹${(stats.today.refunds || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon={ArrowUturnLeftIcon} 
          color={{ bg: 'bg-red-100', icon: 'bg-red-100 text-red-600' }}
          sub={`Customer Returns`} 
        />
        <StatCard 
          label="Net Sales" 
          value={`₹${((stats.today.sales - stats.today.refunds) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon={ArrowTrendingUpIcon} 
          color={{ bg: 'bg-green-100', icon: 'bg-green-100 text-green-600' }}
          sub={`Sales - Refunds`} 
        />
        <StatCard 
          label="Orders Today" 
          value={stats.today.orders}
          icon={ShoppingCartIcon} 
          color={{ bg: 'bg-blue-100', icon: 'bg-blue-100 text-blue-600' }}
          sub={`${stats.monthly.orders} this month`} 
        />
        <StatCard 
          label="Active Store" 
          value={stats.totalProducts}
          icon={CubeIcon} 
          color={{ bg: 'bg-amber-100', icon: 'bg-amber-100 text-amber-600' }}
          sub={`${stats.totalUsers} active staff`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-800">Recent Activity</h2>
            <Link to="/admin/transactions" className="text-sm text-primary font-semibold hover:text-indigo-800">View All Records →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Receipt</th>
                  <th className="px-5 py-3 font-semibold text-center">Type</th>
                  <th className="px-5 py-3 font-semibold">Cashier</th>
                  <th className="px-5 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentTransactions.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-10 text-center text-gray-400">No activity yet</td></tr>
                ) : stats.recentTransactions.map(txn => (
                  <tr key={txn._id} className={`hover:bg-gray-50 transition-colors ${txn.type === 'RETURN' ? 'bg-red-50/20' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-primary font-medium">
                      {txn.receiptNumber}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${txn.type === 'RETURN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {txn.type || 'SALE'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{txn.cashierId?.name || 'N/A'}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${txn.type === 'RETURN' ? 'text-red-600' : 'text-gray-900'}`}>
                      {txn.type === 'RETURN' ? '-' : ''}₹{Math.abs(txn.finalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-800">Low Stock Alerts</h2>
            {stats.lowStockProducts.length > 0 && (
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.lowStockProducts.length}</span>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {stats.lowStockProducts.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400">
                <p className="font-medium text-green-600">✓ All products well-stocked</p>
              </div>
            ) : stats.lowStockProducts.map(p => (
              <div key={p._id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
          {stats.lowStockProducts.length > 0 && (
            <div className="px-5 py-3 border-t bg-gray-50">
              <Link to="/admin/products" className="text-sm text-primary font-semibold hover:text-indigo-800">Manage Inventory →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
