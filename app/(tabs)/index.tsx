import { Redirect } from 'expo-router';

// Default route inside the tabs group: open Groups.
export default function TabIndex() {
  return <Redirect href="/groups" />;
}
