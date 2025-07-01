// Denne filen er kun for å unngå route warning. Navigasjonen starter i login.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/login" />;
}
