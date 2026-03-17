# Rollback: Planning Project/Activity Column Layout Change

## Date: 2025-03-17
## Description: Changed TaskRow and ProjectRow to use consuntivo-style layout (colored circle + two-line project/task display)

## Files Modified:
- `components/TaskRow.jsx` - Project/Activity column (lines 215-241 original)
- `components/ProjectRow.jsx` - Project title cell (lines 48-84 original)

## Original TaskRow Column (lines 215-241):
```jsx
<td className="border-b border-r border-gray-300 px-2 py-0 w-[130px] max-w-[130px] xl:w-[200px] xl:max-w-[200px]">
  <div className="flex items-center gap-1 overflow-hidden">
    <span className="font-mono text-xs text-gray-500">
      {project.project_key}-{task.task_number}
    </span>
    {isEditingTitle ? (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => handleCellBlur(task.task_id, project.project_id, 'title', task.title)}
        onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'title', task.title)}
        autoFocus
        className="flex-1 px-2 py-0.5 border border-blue-300 rounded text-xs font-medium"
      />
    ) : (
      <span
        className="font-medium text-xs cursor-pointer hover:text-blue-600 truncate max-w-xs"
        onClick={() => handleTaskDetailsClick(task, project)}
        title={task.title}
      >
        {task.title}
      </span>
    )}
  </div>
</td>
```

## Original ProjectRow Title Cell (lines 48-84):
```jsx
<td
  colSpan={showTimeline ? 1 : 4}
  className="border-b border-r border-gray-300 px-2 py-2 bg-gray-100 group-hover:bg-gray-200 border-l-[6px]"
  style={{ borderLeftColor: project.client_color || '#6B7280' }}
>
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 overflow-hidden min-w-0">
      <Button
        onClick={() => toggleProjectExpansion(project.project_id)}
        isExpandButton
        isExpanded={expandedProjects[project.project_id]}
        title={expandedProjects[project.project_id] ? t('common:collapse') : t('common:expand')}
        className="text-gray-500 hover:text-gray-700 shrink-0"
      />
      <span className="font-semibold text-gray-800 text-sm truncate">
        {project.title}
        <span className="font-normal text-gray-500 text-xs ml-1">
          ({project.client_key}-{project.project_key})
        </span>
      </span>
    </div>
    {!showTimeline && (
      <Button
        onClick={() => handleStartAddingTask(project.project_id)}
        color="cyan"
        icon={Plus}
        iconSize={14}
        size="sm"
        title={t('planning:addActivity')}
        className="xl:pr-2"
      >
        <span className="hidden xl:inline">{t('common:activity')}</span>
      </Button>
    )}
  </div>
</td>
```

## Original TaskRow imports (line 4):
```jsx
import { Trash2, AlertCircle } from 'lucide-react';
```

## Backend Changes:

### taskRepository.js - getPMPlanningData query:
Added 3 fields after `c.color as client_color`:
```sql
c.symbol_letter,
c.symbol_bg_color,
c.symbol_letter_color,
```
To rollback: remove these 3 lines from the SELECT.

### taskService.js - getPMPlanning project mapping:
Added 3 fields after `client_color`:
```js
symbol_letter: row.symbol_letter,
symbol_bg_color: row.symbol_bg_color,
symbol_letter_color: row.symbol_letter_color,
```
To rollback: remove these 3 lines from the projectsMap.set() call.

## How to rollback:
1. Replace the modified frontend sections with the originals above, and remove FolderKanban/ListTodo from TaskRow imports.
2. Remove the 3 symbol_* lines from backend query and service mapping.
