import { usePrivy } from "@privy-io/react-auth";

const Login = () => {
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <div>
      {authenticated ? (
        <div>
          <p>Welcome, {user?.email || "User"}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Login with Privy</button>
      )}
    </div>
  );
};

export default Login;
