// This file exists only to avoid a route warning. Can be customized later.
import { Redirect } from 'expo-router';

export default function ExploreScreen() {
  return <Redirect href="/groups" />;
}
