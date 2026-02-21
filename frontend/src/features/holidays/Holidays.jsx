import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_MAP } from '../../utils/date/dateUtils';
import { useGetHolidaysQuery, useCreateHolidayMutation, useUpdateHolidayMutation, useDeleteHolidayMutation } from './api/holidayEndpoints';
import { Calendar, Edit2 } from 'lucide-react';
import logger from '../../utils/logger';
import HolidayModal from './components/HolidayModal';
import SearchFilter from '../../shared/components/SearchFilter';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import { useFilteredList } from '../../hooks/useFilteredList';

function Holidays() {
  const { t, i18n } = useTranslation(['holidays', 'common']);
  const { data: holidays = [], isLoading: loading } = useGetHolidaysQuery();
  const [createHoliday] = useCreateHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHolidays = useFilteredList(
    holidays,
    searchTerm,
    ['name', 'date']
  );

  const handleCreateHoliday = async (holidayData) => {
    try {
      await createHoliday(holidayData).unwrap();
    } catch (error) {
      logger.error('Error creating holiday:', error);
    }
  };

  const handleUpdateHoliday = async (holidayData) => {
    if (editingHoliday) {
      try {
        await updateHoliday({
          id: editingHoliday.holiday_id,
          data: holidayData
        }).unwrap();
        setEditingHoliday(null);
      } catch (error) {
        logger.error('Error updating holiday:', error);
      }
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await deleteHoliday(id).unwrap();
    } catch (error) {
      logger.error('Error deleting holiday:', error);
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHoliday(null);
  };

  const locale = LOCALE_MAP[i18n.language] || 'it-IT';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Rome'
    });
  };

  if (loading && holidays.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <HolidayModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={editingHoliday ? handleUpdateHoliday : handleCreateHoliday}
        holiday={editingHoliday}
      />

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={Calendar}
            title={t('holidays:title')}
            description={t('holidays:description')}
            actionButton={{
              label: t('holidays:newHoliday'),
              onClick: () => setIsModalOpen(true)
            }}
          />

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('holidays:searchPlaceholder')}
          />

          {filteredHolidays.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('holidays:name')}
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('holidays:date')}
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('holidays:recurring')}
                      </th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common:actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHolidays.map((holiday) => (
                      <tr key={holiday.holiday_id} className="hover:bg-gray-50">
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-cyan-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {holiday.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(holiday.date)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          {holiday.is_recurring ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {t('common:yes')}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {t('common:no')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(holiday)}
                              variant="ghost"
                              color="blue"
                              size="sm"
                              icon={Edit2}
                              iconSize={18}
                              title={t('common:edit')}
                            />
                            <Button
                              confirmAction
                              onConfirm={() => handleDeleteHoliday(holiday.holiday_id)}
                              itemName={holiday.name}
                              size="md"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredHolidays.length === 0 && (
            <EmptyState
              icon={Calendar}
              title={searchTerm.trim() ? t('common:noResults') : t('holidays:noHolidays')}
              message={
                searchTerm.trim()
                  ? `${t('holidays:noHolidaysForSearch')} "${searchTerm}"`
                  : t('holidays:emptyMessage')
              }
              action={!searchTerm.trim() ? {
                label: t('holidays:addHoliday'),
                onClick: () => setIsModalOpen(true)
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Holidays;
