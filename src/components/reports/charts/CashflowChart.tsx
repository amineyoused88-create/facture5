import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface CashflowData {
  month: string;
  expectedRevenue: number;
  invoicesCount: number;
}

interface CashflowChartProps {
  data: CashflowData[];
}

export default function CashflowChart({ data }: CashflowChartProps) {
  const totalExpected = data.reduce((sum, item) => sum + item.expectedRevenue, 0);
  const totalInvoices = data.reduce((sum, item) => sum + item.invoicesCount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-600">
            Montant attendu: {data.expectedRevenue.toLocaleString()} MAD
          </p>
          <p className="text-sm text-gray-600">
            Factures: {data.invoicesCount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prévisionnel de Trésorerie</h3>
          <p className="text-sm text-gray-600">Encaissements attendus (6 prochains mois)</p>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-medium">Prévisions</span>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {totalExpected.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-green-700">MAD Attendus</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{totalInvoices}</span>
          </div>
          <p className="text-sm text-blue-700">Factures en attente</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-purple-600">
              {totalInvoices > 0 ? (totalExpected / totalInvoices).toFixed(0) : '0'}
            </span>
          </div>
          <p className="text-sm text-purple-700">MAD Moyen/facture</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="expectedRevenue" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              name="Montant attendu"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune facture en attente avec échéance</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajoutez des dates d'échéance à vos factures pour voir les prévisions
          </p>
        </div>
      )}
    </div>
  );
}