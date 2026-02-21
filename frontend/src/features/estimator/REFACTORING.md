# Refactoring Plan for Estimator Module

## EstimateEditorTasks.jsx (1927 lines)

### Recommended Extractions

#### 1. Components

**ActivityTableRow.jsx** (~600 lines)
- Lines 815-1450 in current file
- Props needed:
  - `activity`, `index`, `isEditing`, `isReadOnly`
  - `hoveredCell`, `setHoveredCell`
  - `formatHours`, `calculateTotalHours`, `getContingencyHours`
  - Event handlers: `onFieldChange`, `onSave`, `onCancel`, `onDelete`, `onRecalculate`, `onEdit`

**NewActivityTableRow.jsx** (~365 lines)
- Lines 1453-1818 in current file
- Props needed:
  - `newActivity`, `hoveredCell`, `setHoveredCell`, `isReadOnly`
  - `formatHours`
  - Event handlers: `onChange`, `onAdd`, `onCancel`
  - `newActivityNameInputRef`

#### 2. Custom Hooks

**useTextExpansion.js** (~30 lines)
- Manages tooltip state and timeout
- Returns: `{ hoveredCell, handleTooltipEnter, handleTooltipLeave, setHoveredCell }`

**useActivityManagement.js** (~350 lines)
- Consolidates all activity CRUD handlers
- Parameters: `activities, setActivities, formData, savedEstimateId, mutations`
- Returns all handler functions

#### 3. Implementation Notes

- The table row components have complex tab navigation logic that should be shared
- Consider extracting `ExpandableTextCell` component for the hover-to-expand pattern
- Phase hours calculation is repeated in multiple places - already using shared utilities

### EstimateEditor.jsx (1776 lines)

Similar structure - can be analyzed when ready for refactoring.

## Priority

These refactorings should be done when:
1. There's a feature request that touches these files
2. There are test suites in place to validate functionality
3. There's dedicated time for testing the changes
