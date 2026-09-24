import { useSearchParams } from 'react-router-dom';
import LoginComponent from '../components/auth/LoginComponent';
import RegisterComponent from '../components/auth/RegisterComponent';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';

  return mode === 'register' ? <RegisterComponent /> : <LoginComponent />;
};

export default Auth;