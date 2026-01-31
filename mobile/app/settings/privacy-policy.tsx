/**
 * @file Privacy Policy Screen
 * @description Static page displaying privacy policy
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MD3Theme } from 'react-native-paper';

import { useTranslation } from '@/i18n';

export default function PrivacyPolicyScreen() {
  const theme = useTheme<MD3Theme>();
  const { t, language } = useTranslation();

  const lastUpdated = '2026-01-01';

  const contentEn = [
    {
      title: '1. Information We Collect',
      content: `Vault Protector collects minimal information necessary to provide our service:

• Account Information: Email address and encrypted master password hash for authentication.
• Vault Data: All passwords, notes, cards, and identity information are encrypted locally before being stored.
• Device Information: Device identifiers for session management and security purposes.
• Usage Data: Anonymous usage statistics to improve our service.`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the collected information to:

• Provide and maintain the Vault Protector service
• Authenticate your identity and secure your account
• Sync your encrypted vault across your devices
• Send important security notifications
• Improve and optimize our application`,
    },
    {
      title: '3. Data Security',
      content: `Your security is our top priority:

• Zero-Knowledge Architecture: We cannot access your vault data. Only you have the encryption keys.
• End-to-End Encryption: All data is encrypted using AES-256-GCM before leaving your device.
• Master Password: Your master password never leaves your device and is never stored on our servers.
• Secure Infrastructure: Our servers use industry-standard security measures.`,
    },
    {
      title: '4. Data Sharing',
      content: `We do not sell, trade, or rent your personal information. We may share data only:

• With your consent
• To comply with legal obligations
• To protect our rights and prevent fraud
• With service providers who assist in operating our service (under strict confidentiality)`,
    },
    {
      title: '5. Data Retention',
      content: `• Active accounts: Data is retained while your account is active.
• Deleted accounts: Data is permanently deleted within 30 days of account deletion.
• Backups: Encrypted backups may be retained for up to 90 days for disaster recovery.`,
    },
    {
      title: '6. Your Rights',
      content: `You have the right to:

• Access your personal data
• Export your vault data
• Delete your account and all associated data
• Opt-out of non-essential communications`,
    },
    {
      title: '7. Contact Us',
      content: `If you have questions about this Privacy Policy, contact us at:

Email: privacy@vaultprotector.app`,
    },
  ];

  const contentVi = [
    {
      title: '1. Thông Tin Chúng Tôi Thu Thập',
      content: `Vault Protector thu thập thông tin tối thiểu cần thiết để cung cấp dịch vụ:

• Thông tin tài khoản: Địa chỉ email và mật khẩu chính đã mã hóa để xác thực.
• Dữ liệu kho: Tất cả mật khẩu, ghi chú, thẻ và thông tin danh tính được mã hóa cục bộ trước khi lưu trữ.
• Thông tin thiết bị: Định danh thiết bị để quản lý phiên và bảo mật.
• Dữ liệu sử dụng: Thống kê sử dụng ẩn danh để cải thiện dịch vụ.`,
    },
    {
      title: '2. Cách Chúng Tôi Sử Dụng Thông Tin',
      content: `Chúng tôi sử dụng thông tin thu thập để:

• Cung cấp và duy trì dịch vụ Vault Protector
• Xác thực danh tính và bảo mật tài khoản của bạn
• Đồng bộ kho đã mã hóa trên các thiết bị của bạn
• Gửi thông báo bảo mật quan trọng
• Cải thiện và tối ưu hóa ứng dụng`,
    },
    {
      title: '3. Bảo Mật Dữ Liệu',
      content: `Bảo mật của bạn là ưu tiên hàng đầu:

• Kiến trúc Zero-Knowledge: Chúng tôi không thể truy cập dữ liệu kho của bạn. Chỉ bạn có khóa mã hóa.
• Mã hóa đầu cuối: Tất cả dữ liệu được mã hóa bằng AES-256-GCM trước khi rời khỏi thiết bị.
• Mật khẩu chính: Mật khẩu chính không bao giờ rời khỏi thiết bị và không được lưu trên máy chủ.
• Hạ tầng bảo mật: Máy chủ sử dụng các biện pháp bảo mật tiêu chuẩn ngành.`,
    },
    {
      title: '4. Chia Sẻ Dữ Liệu',
      content: `Chúng tôi không bán, trao đổi hoặc cho thuê thông tin cá nhân. Chúng tôi chỉ chia sẻ dữ liệu khi:

• Có sự đồng ý của bạn
• Để tuân thủ nghĩa vụ pháp lý
• Để bảo vệ quyền và ngăn chặn gian lận
• Với các nhà cung cấp dịch vụ hỗ trợ (theo bảo mật nghiêm ngặt)`,
    },
    {
      title: '5. Lưu Giữ Dữ Liệu',
      content: `• Tài khoản hoạt động: Dữ liệu được lưu giữ khi tài khoản hoạt động.
• Tài khoản đã xóa: Dữ liệu bị xóa vĩnh viễn trong vòng 30 ngày sau khi xóa tài khoản.
• Sao lưu: Bản sao lưu đã mã hóa có thể được giữ tối đa 90 ngày để khôi phục thảm họa.`,
    },
    {
      title: '6. Quyền Của Bạn',
      content: `Bạn có quyền:

• Truy cập dữ liệu cá nhân của bạn
• Xuất dữ liệu kho của bạn
• Xóa tài khoản và tất cả dữ liệu liên quan
• Từ chối nhận thông báo không cần thiết`,
    },
    {
      title: '7. Liên Hệ',
      content: `Nếu bạn có câu hỏi về Chính sách Bảo mật này, liên hệ:

Email: privacy@vaultprotector.app`,
    },
  ];

  const content = language === 'vi' ? contentVi : contentEn;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="bodySmall" style={[styles.lastUpdated, { color: theme.colors.onSurfaceVariant }]}>
          {language === 'vi' ? 'Cập nhật lần cuối' : 'Last updated'}: {lastUpdated}
        </Text>

        {content.map((section, index) => (
          <Card key={index} style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {section.title}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {section.content}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  lastUpdated: {
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
});
