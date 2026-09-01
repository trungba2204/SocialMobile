import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import {
  Bell,
  Ban,
  Globe,
  Info,
  LifeBuoy,
  Lock,
  LogOut,
  Palette,
  ShieldCheck,
  UserCog,
  UserPen,
} from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { AppModal } from '@/components/AppModal';
import { useAuthStore } from '@/store/useAuthStore';
import { getRefreshToken } from '@/api/tokenStore';
import * as authApi from '@/api/auth';
import { SettingsSection } from './components/SettingsSection';
import { SettingsRow } from './components/SettingsRow';
import { AppearancePicker } from './components/AppearancePicker';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const go = (screen: string) => navigation.navigate(screen);

  const onConfirmLogout = async () => {
    setLoggingOut(true);
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {});
    }
    await useAuthStore.getState().signOut();
    // RootNavigator swaps to the Auth stack on signOut, unmounting this screen.
  };

  return (
    <ScreenContainer testID="settings-screen" scroll padded>
      <Text variant="heading" style={{ marginBottom: theme.space.xl }}>
        Settings
      </Text>

      <SettingsSection title="Account">
        <SettingsRow label="Edit profile" icon={UserPen} onPress={() => go('EditProfile')} />
        <SettingsRow label="Account" icon={UserCog} onPress={() => go('AccountSettings')} />
        <SettingsRow label="Privacy" icon={Lock} onPress={() => go('PrivacySettings')} />
        <SettingsRow label="Security" icon={ShieldCheck} onPress={() => go('SecuritySettings')} />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow label="Appearance" icon={Palette} rightElement={<AppearancePicker />} />
        <SettingsRow
          label="Notifications"
          icon={Bell}
          onPress={() => go('NotificationSettings')}
        />
        <SettingsRow label="Language" icon={Globe} value="English" disabled />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsRow label="Help" icon={LifeBuoy} onPress={() => go('HelpCenter')} />
        <SettingsRow label="About" icon={Info} onPress={() => setAboutOpen(true)} />
      </SettingsSection>

      <SettingsSection title="Danger">
        <SettingsRow label="Blocked users" icon={Ban} onPress={() => go('BlockedUsers')} />
        <SettingsRow label="Log out" icon={LogOut} danger onPress={() => setLogoutOpen(true)} />
      </SettingsSection>

      <AppModal visible={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <View style={{ gap: theme.space.md }}>
          <Text variant="title">Log out?</Text>
          <Text variant="body" color="textSecondary">
            You will need to sign in again to use Orbit.
          </Text>
          <View style={{ gap: theme.space.sm, marginTop: theme.space.sm }}>
            <Button
              label="Log out"
              variant="danger"
              fullWidth
              loading={loggingOut}
              onPress={onConfirmLogout}
            />
            <Button
              label="Cancel"
              variant="ghost"
              fullWidth
              onPress={() => setLogoutOpen(false)}
            />
          </View>
        </View>
      </AppModal>

      <AppModal visible={aboutOpen} onClose={() => setAboutOpen(false)}>
        <View style={{ gap: theme.space.sm }}>
          <Text variant="title">Orbit</Text>
          <Text variant="body" color="textSecondary">
            Version {APP_VERSION}
          </Text>
          <View style={{ marginTop: theme.space.md }}>
            <Button label="Close" variant="secondary" fullWidth onPress={() => setAboutOpen(false)} />
          </View>
        </View>
      </AppModal>
    </ScreenContainer>
  );
}
