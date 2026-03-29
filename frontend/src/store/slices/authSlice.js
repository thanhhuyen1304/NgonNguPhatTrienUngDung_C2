import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const safeParseUser = () => {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const getStoredAccessToken = () => localStorage.getItem('accessToken');

const persistSession = ({ user, accessToken }) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
};

const clearStoredSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

const storedUser = safeParseUser();
const storedAccessToken = getStoredAccessToken();

const initialState = {
  user: storedUser,
  isAuthenticated: Boolean(storedUser && storedAccessToken),
  loading: false,
  initialized: false,
  error: null,
};

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, accessToken } = response.data.data;
      persistSession({ user, accessToken });
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, accessToken } = response.data.data;
      persistSession({ user, accessToken });
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Logout failed'
      );
    } finally {
      clearStoredSession();
    }

    return null;
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data.user;
      persistSession({ user });
      return user;
    } catch (error) {
      clearStoredSession();
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get user'
      );
    }
  }
);

export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const user = await dispatch(getMe()).unwrap();
      return user;
    } catch (error) {
      clearStoredSession();
      return rejectWithValue(
        error?.response?.data?.message || error || 'Authentication required'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', userData);
      const user = response.data.data.user;
      persistSession({ user });
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      const accessToken = response.data.data.accessToken;

      if (accessToken) {
        persistSession({ accessToken });
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to change password'
      );
    }
  }
);

export const hasStoredSessionHint = () => {
  return Boolean(safeParseUser() || getStoredAccessToken());
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = Boolean(action.payload.user && getStoredAccessToken());
      state.initialized = true;
    },
    clearSessionState: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      state.loading = false;
      state.error = null;
      clearStoredSession();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initialized = true;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initialized = true;
        state.error = action.payload || null;
      })
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(bootstrapAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload || null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      ;
  },
});

export const { clearError, setCredentials, clearSessionState } = authSlice.actions;
export default authSlice.reducer;
