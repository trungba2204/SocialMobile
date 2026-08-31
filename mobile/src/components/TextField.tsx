import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  onBlur?: TextInputProps['onBlur'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  returnKeyType?: TextInputProps['returnKeyType'];
  autoFocus?: boolean;
};

export function TextField({
  label,
  value,
  onChangeText,
  error,
  helper,
  placeholder,
  secureTextEntry = false,
  autoCapitalize,
  keyboardType,
  multiline = false,
  maxLength,
  editable = true,
  onBlur,
  onSubmitEditing,
  returnKeyType,
  autoFocus,
}: TextFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={{ gap: theme.space.xs }}>
      <Text variant="metadata" color="textSecondary">
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.card,
            borderColor,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.lg,
            paddingVertical: multiline ? theme.space.md : theme.space.sm,
            minHeight: multiline ? 96 : 48,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.body.fontFamily,
              fontSize: theme.typography.body.fontSize,
            },
            multiline && { minHeight: 72, textAlignVertical: 'top' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textDim}
          secureTextEntry={secureTextEntry && hidden}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
        />
        {secureTextEntry ? (
          <PressableScale
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            hitSlop={theme.hitSlop}
            onPress={() => setHidden((h) => !h)}
            style={{ paddingLeft: theme.space.sm }}
          >
            {hidden ? (
              <Eye size={20} color={theme.colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={theme.colors.textSecondary} />
            )}
          </PressableScale>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="error">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="textDim">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, padding: 0, margin: 0 },
});
