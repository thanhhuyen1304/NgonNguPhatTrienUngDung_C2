import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import shipperService from '../../services/shipperService';

// Async thunks
export const getShipperDashboard = createAsyncThunk(
  'shipper/getDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shipperService.getShipperDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard');
    }
  }
);

export const getShipperOrders = createAsyncThunk(
  'shipper/getOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shipperService.getShipperOrders();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const getShipperRoute = createAsyncThunk(
  'shipper/getRoute',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shipperService.getShipperRoute();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch route');
    }
  }
);

export const acceptOrder = createAsyncThunk(
  'shipper/acceptOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await shipperService.acceptDeliveryOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to accept order');
    }
  }
);

const initialState = {
  dashboard: null,
  orders: [],
  route: null,
  loading: false,
  error: null,
};

const shipperSlice = createSlice({
  name: 'shipper',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Dashboard
      .addCase(getShipperDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShipperDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(getShipperDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Orders
      .addCase(getShipperOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShipperOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders || [];
      })
      .addCase(getShipperOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Route
      .addCase(getShipperRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShipperRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.route = action.payload.route || null;
      })
      .addCase(getShipperRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept Order
      .addCase(acceptOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(acceptOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = shipperSlice.actions;
export default shipperSlice.reducer;
