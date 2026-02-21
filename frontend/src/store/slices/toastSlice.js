import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action) => {
      const { message, type = 'error', duration } = action.payload;
      const id = Date.now() + Math.random();
      if (type === 'success') {
        state.toasts = state.toasts.filter(t => t.type !== 'success');
      }
      state.toasts.push({ id, message, type, duration });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearAllToasts } = toastSlice.actions;

export const selectToasts = (state) => state.toast.toasts;

export default toastSlice.reducer;
