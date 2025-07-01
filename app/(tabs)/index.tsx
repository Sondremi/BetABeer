// Denne filen er kun for å unngå route warning i tabs. Kan tilpasses senere.
import { Redirect } from 'expo-router';

export default function TabIndex() {
  return <Redirect href="/groups" />;
}
