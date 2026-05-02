import { Redirect } from 'expo-router';

// Root entry route: send users to the login flow.
export default function Index() {
  return <Redirect href="/login" />;
}
