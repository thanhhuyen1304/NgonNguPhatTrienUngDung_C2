import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  categories: [],
  category: null,
  loading: false,
  error: null,
};

// Get all categories
export const getCategories = createAsyncThunk(
  'categories/getCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/categories?${queryString}`);
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch categories'
      );
    }
  }
);

// Get category tree
export const getCategoryTree = createAsyncThunk(
  'categories/getCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/categories/tree');
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch category tree'
      );
    }
  }
);

// Get category by slug
export const getCategoryBySlug = createAsyncThunk(
  'categories/getCategoryBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await api.get(`/categories/slug/${slug}`);
      return response.data.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch category'
      );
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategory: (state) => {
      state.category = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Categories
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Category Tree
      .addCase(getCategoryTree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategoryTree.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategoryTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Category by Slug
      .addCase(getCategoryBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategoryBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.category = action.payload;
      })
      .addCase(getCategoryBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCategory, clearError } = categorySlice.actions;
export default categorySlice.reducer;
