import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery, useLogoutMutation } from '@/services/authApi';
import { setUser, setLoading, logout, selectIsAuthenticated, selectCurrentUser } from '../authSlice';
import { toast } from 'sonner';

const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

export function useAuth() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const token = sessionStorage.getItem('possum_token');

  return {
    isAuthenticated,
    currentUser,
    token,
  };
}

export function useAuthInitialization() {
  const dispatch = useDispatch();
  const token = sessionStorage.getItem('possum_token');
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const { data: user, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token || (isAuthenticated && !!currentUser),
  });

  useEffect(() => {
    if (user) {
      dispatch(setUser(user));
    } else if (isError) {
      dispatch(setUser(null));
      sessionStorage.removeItem('possum_token');
    }

    if (!isLoading) {
      dispatch(setLoading(false));
    }
  }, [user, isError, isLoading, dispatch]);

  return { isLoading };
}

export function useAutoLogout() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleLogout = async () => {
      try {
        await logoutMutation().unwrap();
      } catch (error) {
        console.error('Logout API call failed:', error);
      } finally {
        dispatch(logout());
        toast.info('You have been logged out due to inactivity.');
      }
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleLogout, AUTO_LOGOUT_TIME);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    resetTimer();
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, dispatch, logoutMutation]);
}
