import React, { memo } from "react";
import { useTranslation } from "react-i18next";

const EstimateTotalsRow = memo(function EstimateTotalsRow({ totals, formatHours }) {
  const { t } = useTranslation(['common']);

  return (
    <tr className="bg-gray-100 font-semibold">
      <td className="px-0.5 lg:px-3 py-4 text-xs lg:text-sm" colSpan="2">
        {t('common:total').toUpperCase()}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalAnalysis)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalDevelopment)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalInternalTest)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalUat)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalRelease)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalPm)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalStartup)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.totalDocumentation)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm">
        {formatHours(totals.contingencyHours)}
      </td>
      <td className="px-0 lg:px-1 py-4 text-right text-xs lg:text-sm text-cyan-700">
        {formatHours(totals.totalWithContingency)}
      </td>
      <td className="pl-4 pr-2 lg:pl-6 lg:pr-2 py-4"></td>
    </tr>
  );
});

export default EstimateTotalsRow;
