/**
 * @file useClipboard Hook - Secure clipboard operations
 * @description Copy to clipboard with auto-clear functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useSettingsStore } from '@/stores/settingsStore';

export interface ClipboardOptions {
  /** Override default timeout (in seconds) */
  timeout?: number;
  /** Show notification on copy */
  showNotification?: boolean;
  /** Label for the copied content (for notifications) */
  label?: string;
}

export function useClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetStateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { clipboardTimeout } = useSettingsStore();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      if (resetStateTimeoutRef.current) {
        clearTimeout(resetStateTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Copy text to clipboard with auto-clear
   */
  const copy = useCallback(
    async (text: string, options: ClipboardOptions = {}): Promise<boolean> => {
      const { timeout = clipboardTimeout, label = 'Text' } = options;

      try {
        // Clear any existing timeouts
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
        if (resetStateTimeoutRef.current) {
          clearTimeout(resetStateTimeoutRef.current);
        }

        // Copy to clipboard
        await Clipboard.setStringAsync(text);

        // Update state
        setIsCopied(true);
        setCopiedLabel(label);

        // Auto-clear clipboard after timeout
        if (timeout > 0) {
          clearTimeoutRef.current = setTimeout(async () => {
            try {
              // Check if clipboard still contains our text
              const currentContent = await Clipboard.getStringAsync();
              if (currentContent === text) {
                await Clipboard.setStringAsync('');
              }
            } catch (error) {
              console.warn('Failed to clear clipboard:', error);
            }
          }, timeout * 1000);
        }

        // Reset copied state after 2 seconds
        resetStateTimeoutRef.current = setTimeout(() => {
          setIsCopied(false);
          setCopiedLabel(null);
        }, 2000);

        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    },
    [clipboardTimeout]
  );

  /**
   * Copy password to clipboard
   */
  const copyPassword = useCallback(
    async (password: string, options: Omit<ClipboardOptions, 'label'> = {}) => {
      return copy(password, { ...options, label: 'Password' });
    },
    [copy]
  );

  /**
   * Copy username to clipboard
   */
  const copyUsername = useCallback(
    async (username: string, options: Omit<ClipboardOptions, 'label'> = {}) => {
      return copy(username, { ...options, label: 'Username' });
    },
    [copy]
  );

  /**
   * Copy URL to clipboard
   */
  const copyUrl = useCallback(
    async (url: string, options: Omit<ClipboardOptions, 'label'> = {}) => {
      return copy(url, { ...options, label: 'URL' });
    },
    [copy]
  );

  /**
   * Copy TOTP code to clipboard
   */
  const copyTOTP = useCallback(
    async (code: string, options: Omit<ClipboardOptions, 'label'> = {}) => {
      return copy(code, { ...options, label: 'Verification Code' });
    },
    [copy]
  );

  /**
   * Copy card number to clipboard
   */
  const copyCardNumber = useCallback(
    async (cardNumber: string, options: Omit<ClipboardOptions, 'label'> = {}) => {
      return copy(cardNumber, { ...options, label: 'Card Number' });
    },
    [copy]
  );

  /**
   * Clear clipboard immediately
   */
  const clear = useCallback(async (): Promise<boolean> => {
    try {
      await Clipboard.setStringAsync('');
      setIsCopied(false);
      setCopiedLabel(null);

      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }

      return true;
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
      return false;
    }
  }, []);

  /**
   * Get current clipboard content
   */
  const getContent = useCallback(async (): Promise<string> => {
    try {
      return await Clipboard.getStringAsync();
    } catch (error) {
      console.error('Failed to get clipboard content:', error);
      return '';
    }
  }, []);

  /**
   * Check if clipboard has content
   */
  const hasContent = useCallback(async (): Promise<boolean> => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      return hasString;
    } catch (error) {
      console.error('Failed to check clipboard:', error);
      return false;
    }
  }, []);

  return {
    // State
    isCopied,
    copiedLabel,

    // Actions
    copy,
    copyPassword,
    copyUsername,
    copyUrl,
    copyTOTP,
    copyCardNumber,
    clear,
    getContent,
    hasContent,
  };
}

export default useClipboard;
