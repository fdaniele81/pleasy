import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const EstimatesByClientBarChart = ({ data, onBarClick }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const truncateText = (text, maxLength = 15) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.client_name}</p>
          <p className="text-sm text-amber-600">
            {t('dashboard:draftTooltip', { hours: data.draft_hours, count: data.draft_count })}
          </p>
          <p className="text-sm text-green-600">
            {t('dashboard:convertedTooltip', { hours: data.converted_hours, count: data.converted_count })}
          </p>
          <p className="text-sm text-gray-700 font-semibold mt-1">
            {t('common:total')}: {data.total_hours}h
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="client_name"
          angle={-45}
          textAnchor="end"
          height={100}
          tickFormatter={(value) => truncateText(value, 15)}
        />
        <YAxis label={{ value: '', angle: -90, position: 'insideLeft' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Bar
          dataKey="draft_hours"
          stackId="a"
          fill="#f59e0b"
          name={t('dashboard:draftLabel')}
          onClick={onBarClick}
          style={{ cursor: 'pointer' }}
        />
        <Bar
          dataKey="converted_hours"
          stackId="a"
          fill="#10b981"
          name={t('dashboard:convertedLabel')}
          radius={[4, 4, 0, 0]}
          onClick={onBarClick}
          style={{ cursor: 'pointer' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EstimatesByClientBarChart;
