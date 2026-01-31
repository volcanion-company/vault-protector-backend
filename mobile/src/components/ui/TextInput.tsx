/**
 * @file TextInput Component - Form input with validation
 * @description Material Design 3 text input with error handling
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  TextInput as PaperTextInput,
  HelperText,
  useTheme,
  IconButton,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface TextInputProps {
  /** Input label */
  label: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text (shown when no error) */
  helperText?: string;
  /** Password input (shows toggle) */
  secureTextEntry?: boolean;
  /** Input mode */
  mode?: 'flat' | 'outlined';
  /** Keyboard type */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  /** Auto-capitalize */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto-correct */
  autoCorrect?: boolean;
  /** Auto-complete */
  autoComplete?: 'off' | 'email' | 'password' | 'username' | 'name' | 'tel' | 'new-password';
  /** Editable state */
  editable?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Multiline input */
  multiline?: boolean;
  /** Number of lines for multiline */
  numberOfLines?: number;
  /** Max length */
  maxLength?: number;
  /** Left icon */
  left?: string;
  /** Right icon */
  right?: string;
  /** On right icon press */
  onRightPress?: () => void;
  /** On blur */
  onBlur?: () => void;
  /** On focus */
  onFocus?: () => void;
  /** On submit editing */
  onSubmitEditing?: () => void;
  /** Return key type */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  /** Container style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry = false,
  mode = 'outlined',
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  autoComplete = 'off',
  editable = true,
  disabled = false,
  multiline = false,
  numberOfLines,
  maxLength,
  left,
  right,
  onRightPress,
  onBlur,
  onFocus,
  onSubmitEditing,
  returnKeyType,
  style,
  testID,
}: TextInputProps) {
  const theme = useTheme<MD3Theme>();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        mode={mode}
        error={hasError}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        editable={editable && !disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        testID={testID}
        left={left ? <PaperTextInput.Icon icon={left} /> : undefined}
        right={
          secureTextEntry ? (
            <PaperTextInput.Icon
              icon={isPasswordVisible ? 'eye-off' : 'eye'}
              onPress={togglePasswordVisibility}
            />
          ) : right ? (
            <PaperTextInput.Icon icon={right} onPress={onRightPress} />
          ) : undefined
        }
        style={styles.input}
        disabled={disabled}
      />
      {(hasError || helperText) && (
        <HelperText type={hasError ? 'error' : 'info'} visible={true}>
          {hasError ? error : helperText}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  input: {
    // Add any custom input styles
  },
});

export default TextInput;
