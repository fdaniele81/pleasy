import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Circle, Clock, Eye, EyeOff, ListTodo, Pencil, Plus, CalendarDays, StickyNote, Trash2 } from 'lucide-react';
import { getRouteIcon } from '../../constants/routeIcons';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import FilterBar from '../../shared/ui/filters/FilterBar';
import SearchInput from '../../shared/ui/filters/SearchInput';
import BaseModal from '../../shared/components/BaseModal';
import DateInput from '../../shared/ui/DateInput';
import MiniCalendar from './components/MiniCalendar';
import Scratchpad from './components/Scratchpad';
import { useLocale } from '../../hooks/useLocale';
import { toISODate } from '../../utils/date/dateUtils';
import { useFormModal } from '../../hooks/useFormModal';
import { selectCurrentUser } from '../../store/selectors/authSelectors';
import { useGetProjectsWithTasksQuery } from '../planning/api/taskEndpoints';
import {
  useGetTodoListQuery,
  useUpdateTimesheetStatusMutation,
  useSaveTimesheetMutation,
} from '../timesheet/api/timesheetEndpoints';
import {
  useGetTodoItemsQuery,
  useCreateTodoItemMutation,
  useUpdateTodoItemMutation,
  useToggleTodoItemMutation,
  useDeleteTodoItemMutation,
} from './api/todoItemEndpoints';

const TODAY_ISO = toISODate(new Date());
const NO_DATE_KEY = '__no_date__';

const HOLD_MS = 1000;
const HOLD_DELAY_MS = 150;
const HOLD_MOVE_TOLERANCE = 10;
const RING_R = 9;
const RING_C = 2 * Math.PI * RING_R;

function TodoList() {
  const { t } = useTranslation(['todolist', 'common']);
  const navigate = useNavigate();
  const locale = useLocale();
  const TodoIcon = getRouteIcon('/todo-list');

  const currentUser = useSelector(selectCurrentUser);
  const { data: timesheetItems = [], isLoading: isLoadingTs } = useGetTodoListQuery();
  const { data: todoItems = [], isLoading: isLoadingTodo } = useGetTodoItemsQuery();
  const [updateStatus] = useUpdateTimesheetStatusMutation();
  const [saveTimesheet] = useSaveTimesheetMutation();
  const [createTodoItem] = useCreateTodoItemMutation();
  const [updateTodoItem] = useUpdateTodoItemMutation();
  const [toggleTodoItem] = useToggleTodoItemMutation();
  const [deleteTodoItem] = useDeleteTodoItemMutation();

  const isLoading = isLoadingTs || isLoadingTodo;

  const [pendingOnly, setPendingOnly] = useState(true);
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [editingTimesheetEntry, setEditingTimesheetEntry] = useState(null);
  const [editingTodoEntry, setEditingTodoEntry] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const todayRef = useRef(null);
  const stickyHeaderRef = useRef(null);

  // ── Normalize both sources into a unified shape ──
  const allItems = useMemo(() => {
    const tsNormalized = timesheetItems.map((item) => ({
      id: item.timesheet_id,
      type: 'timesheet',
      title: item.task_title,
      details: item.details,
      date: item.work_date,
      isCompleted: item.timesheet_status_id === 'COMPLETED',
      hours: item.hours_worked,
      client_key: item.client_key,
      project_key: item.project_key,
      symbol_letter: item.symbol_letter,
      symbol_bg_color: item.symbol_bg_color,
      symbol_letter_color: item.symbol_letter_color,
      client_color: item.client_color,
      // keep originals for mutations
      _timesheetId: item.timesheet_id,
      _statusId: item.timesheet_status_id,
      _taskId: item.task_id,
    }));

    const todoNormalized = todoItems.map((item) => ({
      id: item.todo_item_id,
      type: 'todo',
      title: item.title,
      details: item.details,
      date: item.due_date || null,
      isCompleted: item.is_completed,
      hours: null,
      client_key: item.client_key || null,
      project_key: item.project_key || null,
      symbol_letter: item.symbol_letter || null,
      symbol_bg_color: item.symbol_bg_color || null,
      symbol_letter_color: item.symbol_letter_color || null,
      client_color: item.client_color || null,
      _todoItemId: item.todo_item_id,
    }));

    return [...tsNormalized, ...todoNormalized];
  }, [timesheetItems, todoItems]);

  // ── Filter ──
  const filteredItems = useMemo(() => {
    if (!pendingOnly) return allItems;
    return allItems.filter((item) => !item.isCompleted);
  }, [allItems, pendingOnly]);

  // ── Group + sort ascending (null dates go last) ──
  const groupedByDate = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach((item) => {
      const key = item.date || NO_DATE_KEY;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === NO_DATE_KEY) return 1;
      if (b === NO_DATE_KEY) return -1;
      return a.localeCompare(b);
    });
  }, [filteredItems]);

  // ── Compute scroll offset from sticky header ──
  const getScrollOffset = useCallback(() => {
    if (!stickyHeaderRef.current) return 0;
    const headerRect = stickyHeaderRef.current.getBoundingClientRect();
    // sticky top offset + actual header height + small gap
    const stickyTop = window.innerWidth >= 640 ? 80 : 64;
    return headerRect.height + stickyTop + 8;
  }, []);

  const scrollToElement = useCallback((el) => {
    if (!el) return;
    const offset = getScrollOffset();
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [getScrollOffset]);

  // ── Auto-scroll to today on first render ──
  const didScroll = useRef(false);
  useEffect(() => {
    if (!isLoading && !didScroll.current && todayRef.current) {
      scrollToElement(todayRef.current);
      didScroll.current = true;
    }
  }, [isLoading, groupedByDate, scrollToElement]);

  const scrollToToday = useCallback(() => {
    scrollToElement(todayRef.current);
  }, [scrollToElement]);

  // ── Hold-to-toggle ──
  const [holdingId, setHoldingId] = useState(null);
  const holdTimerRef = useRef(null);
  const delayTimerRef = useRef(null);
  const holdOriginRef = useRef(null);

  const handleToggle = useCallback(async (entry) => {
    if (entry.type === 'timesheet') {
      const newStatus = entry._statusId === 'COMPLETED' ? 'INSERTED' : 'COMPLETED';
      await updateStatus({ timesheetId: entry._timesheetId, statusId: newStatus });
    } else {
      await toggleTodoItem(entry._todoItemId);
    }
  }, [updateStatus, toggleTodoItem]);

  const cancelHold = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdOriginRef.current = null;
    setHoldingId(null);
  }, []);

  const startHold = useCallback((e, entry) => {
    e.stopPropagation();
    holdOriginRef.current = { x: e.clientX, y: e.clientY };
    // Small delay before starting the ring animation so scrolling isn't blocked
    delayTimerRef.current = setTimeout(() => {
      setHoldingId(entry.id);
      holdTimerRef.current = setTimeout(() => {
        setHoldingId(null);
        holdOriginRef.current = null;
        handleToggle(entry);
      }, HOLD_MS);
    }, HOLD_DELAY_MS);
  }, [handleToggle]);

  const handlePointerMove = useCallback((e) => {
    if (!holdOriginRef.current) return;
    const dx = e.clientX - holdOriginRef.current.x;
    const dy = e.clientY - holdOriginRef.current.y;
    if (dx * dx + dy * dy > HOLD_MOVE_TOLERANCE * HOLD_MOVE_TOLERANCE) {
      cancelHold();
    }
  }, [cancelHold]);

  // ── Delete todo ──
  const handleDeleteTodo = useCallback(async (e, todoItemId) => {
    e.stopPropagation();
    await deleteTodoItem(todoItemId);
  }, [deleteTodoItem]);

  // ── Date label ──
  const formatDateLabel = useCallback((dateStr) => {
    if (dateStr === NO_DATE_KEY) return t('todolist:noDueDate');
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    let label = '';
    if (dateOnly.getTime() === today.getTime()) label = t('todolist:today');
    else if (dateOnly.getTime() === yesterday.getTime()) label = t('todolist:yesterday');

    const formatted = date.toLocaleDateString(locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    return label ? `${label} — ${formatted}` : formatted;
  }, [locale, t]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter((i) => i.isCompleted).length;
    return { total, completed, pending: total - completed };
  }, [filteredItems]);

  // ── Calendar data: count items per date for dot indicators ──
  const datesWithItems = useMemo(() => {
    const map = {};
    filteredItems.forEach((item) => {
      if (!item.date) return;
      if (!map[item.date]) map[item.date] = { count: 0 };
      map[item.date].count++;
    });
    return map;
  }, [filteredItems]);

  // ── Refs for each date group (for calendar click → scroll) ──
  const dateRefsMap = useRef({});
  const scrollToDate = useCallback((iso) => {
    const el = dateRefsMap.current[iso];
    if (el) scrollToElement(el);
  }, [scrollToElement]);

  // ── Add timesheet entry modal ──
  const { data: projects = [] } = useGetProjectsWithTasksQuery(undefined, { skip: !timesheetModalOpen });
  const [selectedClientId, setSelectedClientId] = useState('');

  const clientsWithTasks = useMemo(() => {
    if (!projects.length || !currentUser) return [];
    const clientMap = new Map();
    projects.forEach((project) => {
      const activeTasks = (project.tasks || []).filter(
        (task) => task.owner_id === currentUser.user_id
          && task.task_status_id !== 'DONE'
          && task.task_status_id !== 'DELETED'
      );
      if (activeTasks.length === 0) return;
      const cid = project.client_id;
      if (!clientMap.has(cid)) {
        clientMap.set(cid, {
          client_id: cid,
          client_key: project.client_key,
          client_name: project.client_name,
          tasks: [],
        });
      }
      activeTasks.forEach((task) => {
        clientMap.get(cid).tasks.push({
          task_id: task.task_id,
          label: task.title,
          projectLabel: project.title,
        });
      });
    });
    return Array.from(clientMap.values()).sort((a, b) => a.client_name.localeCompare(b.client_name));
  }, [projects, currentUser]);

  const [taskSearch, setTaskSearch] = useState('');

  const tasksForClient = useMemo(() => {
    if (!selectedClientId) return [];
    const client = clientsWithTasks.find((c) => c.client_id === selectedClientId);
    const tasks = client?.tasks || [];
    if (!taskSearch.trim()) return tasks;
    const q = taskSearch.toLowerCase();
    return tasks.filter((tk) => tk.label.toLowerCase().includes(q) || tk.projectLabel.toLowerCase().includes(q));
  }, [clientsWithTasks, selectedClientId, taskSearch]);

  const closeTimesheetModal = useCallback(() => {
    setTimesheetModalOpen(false);
    setEditingTimesheetEntry(null);
    setSelectedClientId('');
    setTaskSearch('');
  }, []);

  const openEditTimesheet = useCallback((entry) => {
    setEditingTimesheetEntry(entry);
    setTimesheetModalOpen(true);
  }, []);

  const { formData: tsFormData, errors: tsErrors, isEditMode: tsIsEditMode, isSubmitting: tsIsSubmitting, handleChange: tsHandleChange, handleSubmit: tsHandleSubmit } = useFormModal({
    initialValues: { task_id: '', work_date: TODAY_ISO, hours: '', details: '' },
    entity: editingTimesheetEntry,
    isOpen: timesheetModalOpen,
    transformForEdit: (entry) => ({
      task_id: entry._taskId,
      work_date: entry.date,
      hours: String(entry.hours ?? ''),
      details: entry.details || '',
    }),
    validate: (data) => {
      if (!data.task_id) return t('todolist:taskRequired');
      if (!data.work_date) return t('todolist:dateRequired');
      if (!data.hours || parseFloat(data.hours) <= 0) return t('todolist:hoursRequired');
      return null;
    },
    onSubmit: async (data) => {
      await saveTimesheet({
        taskId: data.task_id,
        workDate: data.work_date,
        hoursWorked: parseFloat(data.hours),
        details: data.details?.trim() || '',
      }).unwrap();
      closeTimesheetModal();
    },
  });

  // ── Add todo item modal ──
  const closeTodoModal = useCallback(() => {
    setTodoModalOpen(false);
    setEditingTodoEntry(null);
  }, []);

  const openEditTodo = useCallback((entry) => {
    setEditingTodoEntry(entry);
    setTodoModalOpen(true);
  }, []);

  const { formData: todoFormData, errors: todoErrors, isEditMode: todoIsEditMode, isSubmitting: todoIsSubmitting, handleChange: todoHandleChange, handleSubmit: todoHandleSubmit } = useFormModal({
    initialValues: { title: '', details: '', due_date: '' },
    entity: editingTodoEntry,
    isOpen: todoModalOpen,
    transformForEdit: (entry) => ({
      title: entry.title || '',
      details: entry.details || '',
      due_date: entry.date || '',
    }),
    validate: (data) => {
      if (!data.title?.trim()) return t('todolist:todoTitleRequired');
      return null;
    },
    onSubmit: async (data, isEditMode) => {
      if (isEditMode && editingTodoEntry) {
        await updateTodoItem({
          todoItemId: editingTodoEntry._todoItemId,
          title: data.title.trim(),
          details: data.details?.trim() || '',
          dueDate: data.due_date || null,
        }).unwrap();
      } else {
        await createTodoItem({
          title: data.title.trim(),
          details: data.details?.trim() || '',
          dueDate: data.due_date || null,
        }).unwrap();
      }
      closeTodoModal();
    },
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16 sm:pt-20">
        <div className="flex items-center justify-center p-6">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16 sm:pt-20">
      <div className="px-4 pb-4">
        <div className="max-w-7xl mx-auto flex gap-6">
          {/* ── Left column: todo list ── */}
          <div className="flex-1 min-w-0">
          <div ref={stickyHeaderRef} className="sticky top-16 sm:top-20 z-30 bg-gray-100 pb-2 before:content-[''] before:absolute before:left-0 before:right-0 before:-top-16 sm:before:-top-20 before:h-16 sm:before:h-20 before:bg-gray-100">
            <div className="pt-2 mb-1 sm:mb-4">
              <h1 className="text-base sm:text-2xl font-bold text-gray-800 mb-0 sm:mb-1 flex items-center gap-2 sm:gap-3">
                {TodoIcon && <TodoIcon size={18} className="sm:w-7 sm:h-7 shrink-0" />}
                <span>{t('todolist:title')}</span>
              </h1>
              <p className="hidden sm:block text-sm sm:text-base text-gray-600">{t('todolist:description')}</p>
            </div>

            <FilterBar gap="sm">
            <Button
              onClick={() => setPendingOnly((v) => !v)}
              color={pendingOnly ? "cyan" : "gray"}
              variant={pendingOnly ? "solid" : "outline"}
              size="sm"
              icon={pendingOnly ? EyeOff : Eye}
              fullWidth={false}
              title={pendingOnly ? t('todolist:hideCompleted') : t('todolist:showCompleted')}
            >
              <span className="hidden sm:inline">{pendingOnly ? t('todolist:hideCompleted') : t('todolist:showCompleted')}</span>
            </Button>

            <Button
              onClick={scrollToToday}
              variant="outline"
              color="gray"
              size="sm"
              icon={CalendarDays}
              fullWidth={false}
              title={t('todolist:goToToday')}
            >
              <span className="hidden sm:inline">{t('todolist:goToToday')}</span>
            </Button>

            <Button
              onClick={() => setTimesheetModalOpen(true)}
              variant="outline"
              color="cyan"
              size="sm"
              icon={Clock}
              fullWidth={false}
              title={t('todolist:addEntry')}
            >
              <span className="hidden sm:inline">{t('todolist:addEntry')}</span>
            </Button>

            <Button
              onClick={() => setTodoModalOpen(true)}
              variant="outline"
              color="cyan"
              size="sm"
              icon={StickyNote}
              fullWidth={false}
              title={t('todolist:addTodo')}
            >
              <span className="hidden sm:inline">{t('todolist:addTodo')}</span>
            </Button>

            {filteredItems.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={14} className="text-gray-400" />
                  <span>{stats.pending} <span className="hidden sm:inline">{t('todolist:pending')}</span></span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span>{stats.completed} <span className="hidden sm:inline">{t('todolist:completed')}</span></span>
                </div>
              </div>
            )}
            </FilterBar>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title={t('todolist:emptyTitle')}
              message={t('todolist:emptyMessage')}
            />
          ) : (
            <div className="space-y-6 pb-[70vh]">
              {groupedByDate.map(([date, entries]) => {
                const isToday = date === TODAY_ISO;
                const isNoDate = date === NO_DATE_KEY;
                const dateCompleted = entries.filter((e) => e.isCompleted).length;
                const dateTotal = entries.length;
                const allDone = dateCompleted === dateTotal;

                return (
                  <div
                    key={date}
                    ref={(el) => {
                      if (isToday) todayRef.current = el;
                      if (el) dateRefsMap.current[date] = el;
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className={`text-sm font-semibold uppercase tracking-wide ${isToday ? 'text-cyan-600' : isNoDate ? 'text-amber-500' : 'text-gray-500'}`}>
                        {formatDateLabel(date)}
                      </h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {dateCompleted}/{dateTotal}
                      </span>
                    </div>

                    <div className={`bg-white rounded-xl shadow-sm border divide-y divide-gray-100 ${isToday ? 'border-cyan-300 ring-2 ring-cyan-100' : isNoDate ? 'border-amber-200' : 'border-gray-200'}`}>
                      {entries.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        return (
                        <div key={entry.id}>
                          <div
                            className={`flex items-center gap-3 px-4 py-3 transition-colors select-none cursor-pointer touch-pan-y ${entry.isCompleted ? 'bg-gray-50/50' : ''}`}
                            role="button"
                            aria-label={entry.isCompleted ? t('todolist:markInserted') : t('todolist:markCompleted')}
                            onPointerDown={(e) => startHold(e, entry)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={cancelHold}
                            onPointerLeave={cancelHold}
                            onPointerCancel={cancelHold}
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            {/* Hold-to-toggle circle */}
                            <div className="shrink-0 relative">
                              {entry.isCompleted ? (
                                <CheckCircle2 size={22} className="text-green-500" />
                              ) : (
                                <Circle size={22} className="text-gray-300" />
                              )}
                              <svg
                                className="absolute inset-0 -rotate-90 pointer-events-none"
                                width={22}
                                height={22}
                                viewBox="0 0 22 22"
                              >
                                <circle
                                  cx={11}
                                  cy={11}
                                  r={RING_R}
                                  fill="none"
                                  stroke={entry.isCompleted ? '#f87171' : '#06b6d4'}
                                  strokeWidth={2.5}
                                  strokeLinecap="round"
                                  strokeDasharray={RING_C}
                                  strokeDashoffset={holdingId === entry.id ? 0 : RING_C}
                                  style={{
                                    transition: holdingId === entry.id
                                      ? `stroke-dashoffset ${HOLD_MS}ms linear`
                                      : 'none',
                                  }}
                                />
                              </svg>
                            </div>

                            {/* Icon / avatar */}
                            {entry.type === 'timesheet' ? (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                  backgroundColor: entry.symbol_bg_color || entry.client_color || '#6b7280',
                                  color: entry.symbol_letter_color || '#ffffff',
                                }}
                              >
                                {entry.symbol_letter || entry.client_key?.charAt(0) || '?'}
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-amber-100">
                                <StickyNote size={14} className="text-amber-600" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${entry.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {entry.title}
                              </div>
                              {entry.type === 'timesheet' ? (
                                <div className="text-xs text-gray-400 truncate">
                                  {entry.client_key} &middot; {entry.project_key}
                                </div>
                              ) : entry.client_key ? (
                                <div className="text-xs text-gray-400 truncate">
                                  {entry.client_key} &middot; {entry.project_key}
                                </div>
                              ) : null}
                            </div>

                            {/* Inline details preview (lg+ only) */}
                            {entry.details && (
                              <div className={`hidden lg:block flex-1 min-w-0 text-xs italic whitespace-pre-line line-clamp-3 ${entry.isCompleted ? 'text-gray-300' : 'text-gray-400'}`}>
                                {entry.details}
                              </div>
                            )}

                            {/* Toggle details button (below lg only) */}
                            {entry.details && (
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(isExpanded ? null : entry.id);
                                }}
                                className="shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors lg:hidden"
                                aria-label={isExpanded ? t('todolist:hideDetails') : t('todolist:showDetails')}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            )}

                            {/* Hours (only for timesheets) */}
                            {entry.hours != null && (
                              <div className={`shrink-0 text-sm font-semibold tabular-nums ${entry.isCompleted ? 'text-gray-400' : 'text-gray-700'}`}>
                                {entry.hours}h
                              </div>
                            )}

                            {/* Edit button */}
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (entry.type === 'timesheet') openEditTimesheet(entry);
                                else openEditTodo(entry);
                              }}
                              className="shrink-0 p-1 text-gray-300 hover:text-cyan-500 transition-colors"
                              aria-label={t('common:edit')}
                            >
                              <Pencil size={14} />
                            </button>

                            {/* Delete button for todo items */}
                            {entry.type === 'todo' && (
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => handleDeleteTodo(e, entry._todoItemId)}
                                className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors"
                                aria-label={t('todolist:deleteTodo')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {/* Expandable details panel (below lg only) */}
                          {entry.details && isExpanded && (
                            <div className={`px-4 pb-3 pt-0 pl-17 text-xs italic whitespace-pre-line lg:hidden ${entry.isCompleted ? 'text-gray-300' : 'text-gray-400'}`}>
                              {entry.details}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {/* ── Right sidebar (hidden below lg / 1024px) ── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 flex flex-col gap-4" style={{ height: 'calc(100vh - 6.5rem)' }}>
              <MiniCalendar
                datesWithItems={datesWithItems}
                onDateClick={scrollToDate}
              />
              <Scratchpad className="flex-1 min-h-0" />
            </div>
          </aside>
        </div>
      </div>

      {/* ── Add timesheet entry modal ── */}
      <BaseModal
        isOpen={timesheetModalOpen}
        onClose={closeTimesheetModal}
        onConfirm={tsHandleSubmit}
        entityName={t('todolist:timesheetEntry')}
        isEditMode={tsIsEditMode}
        icon={tsIsEditMode ? <Pencil className="text-cyan-600" size={24} /> : <Plus className="text-cyan-600" size={24} />}
        error={tsErrors.general}
        isSubmitting={tsIsSubmitting}
        confirmButtonColor="cyan"
        size="md"
      >
        {/* Client / Task selector (hidden in edit mode) */}
        {tsIsEditMode ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('todolist:selectTask')}
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              {editingTimesheetEntry?.title}
              <span className="text-xs text-gray-400 ml-2">
                {editingTimesheetEntry?.client_key} &middot; {editingTimesheetEntry?.project_key}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common:client')}
              </label>
              <div className="flex flex-wrap gap-2">
                {clientsWithTasks.map((client) => (
                  <button
                    key={client.client_id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(client.client_id);
                      tsHandleChange('task_id', '');
                      setTaskSearch('');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selectedClientId === client.client_id
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {client.client_name}
                  </button>
                ))}
                {clientsWithTasks.length === 0 && (
                  <div className="text-xs text-gray-400">{t('todolist:noTasks')}</div>
                )}
              </div>
            </div>

            {selectedClientId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('todolist:selectTask')}
                </label>
                <SearchInput
                  value={taskSearch}
                  onChange={setTaskSearch}
                  placeholder={t('todolist:selectTaskPlaceholder')}
                  size="sm"
                  className="mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {tasksForClient.map((task) => (
                    <button
                      key={task.task_id}
                      type="button"
                      onClick={() => tsHandleChange('task_id', task.task_id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        tsFormData.task_id === task.task_id
                          ? 'bg-cyan-50 text-cyan-800'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium truncate">{task.label}</div>
                      <div className="text-xs text-gray-400">{task.projectLabel}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Date + Hours row */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('todolist:date')}
            </label>
            <DateInput
              value={tsFormData.work_date}
              onChange={(v) => tsHandleChange('work_date', v)}
              className="w-full"
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('todolist:hours')}
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={tsFormData.hours}
              onChange={(e) => tsHandleChange('hours', e.target.value)}
              placeholder="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('todolist:notes')}
          </label>
          <textarea
            value={tsFormData.details}
            onChange={(e) => tsHandleChange('details', e.target.value)}
            placeholder={t('todolist:notesPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
          />
        </div>
      </BaseModal>

      {/* ── Add todo item modal ── */}
      <BaseModal
        isOpen={todoModalOpen}
        onClose={closeTodoModal}
        onConfirm={todoHandleSubmit}
        entityName={t('todolist:todoItem')}
        isEditMode={todoIsEditMode}
        icon={todoIsEditMode ? <Pencil className="text-amber-500" size={24} /> : <StickyNote className="text-amber-500" size={24} />}
        error={todoErrors.general}
        isSubmitting={todoIsSubmitting}
        confirmButtonColor="cyan"
        size="md"
      >
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('todolist:todoTitle')}
          </label>
          <input
            type="text"
            value={todoFormData.title}
            onChange={(e) => todoHandleChange('title', e.target.value)}
            placeholder={t('todolist:todoTitlePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>

        {/* Due date (optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('todolist:todoDueDate')}
          </label>
          <DateInput
            value={todoFormData.due_date}
            onChange={(v) => todoHandleChange('due_date', v)}
            className="w-full"
          />
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('todolist:todoDetails')}
          </label>
          <textarea
            value={todoFormData.details}
            onChange={(e) => todoHandleChange('details', e.target.value)}
            placeholder={t('todolist:todoDetailsPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
          />
        </div>
      </BaseModal>
    </div>
  );
}

export default TodoList;
