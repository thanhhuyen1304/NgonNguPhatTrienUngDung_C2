import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';
import socketService from '../../services/socketService';

// Simple event emitter for auth events
class SimpleEventEmitter {
  constructor() {
    this.listeners = [];
  }
  
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  emit(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }
}

const authEventEmitter = new SimpleEventEmitter();
global.authEventEmitter = authEventEmitter;

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials.email, credentials.password);
      return result.user;
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Get current user
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getMe();
      return user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUserFromCache: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    forceLogout: (state) => {
      // Force clear all auth state - for emergency logout
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      
      // Disconnect socket
      socketService.disconnect();
    },
    handleTokenExpired: (state, action) => {
      // Handle token expiration with message
      state.user = null;
      state.isAuthenticated = false;
      state.error = action.payload?.message || 'Phiên đăng nhập đã hết hạn';
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      
      // Connect to Socket.IO
      socketService.connect();
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    });

    // Get Me
    builder.addCase(getMe.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      
      // Connect to Socket.IO if not already connected
      if (!socketService.isSocketConnected()) {
        socketService.connect();
      }
    });
    builder.addCase(getMe.rejected, (state) => {
      state.loading = false;
      // Don't set isAuthenticated to false immediately
      // Let the navigation handle this
      console.log('getMe rejected, but keeping auth state for now');
    });

    // Logout
    builder.addCase(logout.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      
      // Disconnect socket
      socketService.disconnect();
    });
    builder.addCase(logout.rejected, (state, action) => {
      // Even if logout fails, clear the local state
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      console.log('Logout failed but cleared local state:', action.payload);
    });
  },
});

export const { clearError, setUserFromCache, updateUser, forceLogout, handleTokenExpired } = authSlice.actions;

// Setup auth event listener
let authEventListener = null;

export const setupAuthEventListener = (dispatch) => {
  if (authEventListener) {
    authEventListener(); // Remove previous listener
  }
  
  authEventListener = authEventEmitter.addListener((event, data) => {
    if (event === 'FORCE_LOGOUT') {
      dispatch(handleTokenExpired(data));
    }
  });
  
  return authEventListener;
};

export default authSlice.reducer;
