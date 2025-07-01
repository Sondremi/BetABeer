// This file exists only to avoid a route warning. Navigation starts from the login screen.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/login" />;
}
