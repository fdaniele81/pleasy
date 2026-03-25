import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

export const todoItemEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTodoItems: builder.query({
      query: () => '/todo-items',
      transformResponse: (response) => response.items || [],
      providesTags: [{ type: TAG_TYPES.TODO_ITEM, id: 'LIST' }],
      keepUnusedDataFor: CACHE_STRATEGIES.SHORT,
    }),

    createTodoItem: builder.mutation({
      query: ({ title, details, dueDate, taskId }) => ({
        url: '/todo-items',
        method: 'POST',
        body: {
          title,
          details: details || undefined,
          due_date: dueDate || undefined,
          task_id: taskId || undefined,
        },
      }),
      invalidatesTags: [{ type: TAG_TYPES.TODO_ITEM, id: 'LIST' }],
    }),

    updateTodoItem: builder.mutation({
      query: ({ todoItemId, title, details, dueDate, taskId }) => ({
        url: `/todo-items/${todoItemId}`,
        method: 'PUT',
        body: {
          title,
          details: details || undefined,
          due_date: dueDate || undefined,
          task_id: taskId || undefined,
        },
      }),
      invalidatesTags: [{ type: TAG_TYPES.TODO_ITEM, id: 'LIST' }],
    }),

    toggleTodoItem: builder.mutation({
      query: (todoItemId) => ({
        url: `/todo-items/${todoItemId}/toggle`,
        method: 'PUT',
      }),
      invalidatesTags: [{ type: TAG_TYPES.TODO_ITEM, id: 'LIST' }],
    }),

    deleteTodoItem: builder.mutation({
      query: (todoItemId) => ({
        url: `/todo-items/${todoItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: TAG_TYPES.TODO_ITEM, id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTodoItemsQuery,
  useCreateTodoItemMutation,
  useUpdateTodoItemMutation,
  useToggleTodoItemMutation,
  useDeleteTodoItemMutation,
} = todoItemEndpoints;
