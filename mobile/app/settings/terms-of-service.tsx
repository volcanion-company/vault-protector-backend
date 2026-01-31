/**
 * @file Terms of Service Screen
 * @description Static page displaying terms of service
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MD3Theme } from 'react-native-paper';

import { useTranslation } from '@/i18n';

export default function TermsOfServiceScreen() {
  const theme = useTheme<MD3Theme>();
  const { t, language } = useTranslation();

  const lastUpdated = '2026-01-01';

  const contentEn = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using Vault Protector, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.

These terms apply to all users of the application, including visitors, registered users, and premium subscribers.`,
    },
    {
      title: '2. Description of Service',
      content: `Vault Protector is a password management application that provides:

• Secure storage for passwords, notes, cards, and identity information
• End-to-end encryption for all stored data
• Cross-device synchronization
• Password generation tools
• Biometric authentication support`,
    },
    {
      title: '3. User Responsibilities',
      content: `As a user, you are responsible for:

• Maintaining the confidentiality of your master password
• All activities that occur under your account
• Ensuring your account information is accurate and up-to-date
• Complying with all applicable laws and regulations
• Not using the service for any illegal or unauthorized purpose`,
    },
    {
      title: '4. Master Password',
      content: `IMPORTANT: Your master password is the key to all your data.

• We cannot recover or reset your master password
• If you forget your master password, you will lose access to all your data
• You are solely responsible for remembering your master password
• We recommend storing a backup of your master password in a secure location`,
    },
    {
      title: '5. Account Termination',
      content: `We reserve the right to terminate or suspend your account if:

• You violate these Terms of Service
• You use the service for illegal activities
• You attempt to compromise the security of the service
• You engage in any activity that disrupts the service

You may also delete your account at any time through the app settings.`,
    },
    {
      title: '6. Limitation of Liability',
      content: `To the maximum extent permitted by law:

• The service is provided "as is" without warranties of any kind
• We are not liable for any data loss resulting from forgotten master passwords
• We are not liable for any indirect, incidental, or consequential damages
• Our total liability is limited to the amount you paid for the service`,
    },
    {
      title: '7. Changes to Terms',
      content: `We may update these Terms of Service from time to time. We will notify you of any significant changes by:

• Posting the new terms in the application
• Sending an email to your registered address

Continued use of the service after changes constitutes acceptance of the new terms.`,
    },
    {
      title: '8. Governing Law',
      content: `These Terms of Service are governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through arbitration.`,
    },
    {
      title: '9. Contact Information',
      content: `For questions about these Terms of Service, contact us at:

Email: legal@vaultprotector.app`,
    },
  ];

  const contentVi = [
    {
      title: '1. Chấp Nhận Điều Khoản',
      content: `Bằng việc truy cập hoặc sử dụng Vault Protector, bạn đồng ý tuân theo các Điều khoản Dịch vụ này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.

Các điều khoản này áp dụng cho tất cả người dùng, bao gồm khách truy cập, người dùng đã đăng ký và người đăng ký premium.`,
    },
    {
      title: '2. Mô Tả Dịch Vụ',
      content: `Vault Protector là ứng dụng quản lý mật khẩu cung cấp:

• Lưu trữ an toàn cho mật khẩu, ghi chú, thẻ và thông tin danh tính
• Mã hóa đầu cuối cho tất cả dữ liệu lưu trữ
• Đồng bộ hóa đa thiết bị
• Công cụ tạo mật khẩu
• Hỗ trợ xác thực sinh trắc học`,
    },
    {
      title: '3. Trách Nhiệm Người Dùng',
      content: `Là người dùng, bạn có trách nhiệm:

• Duy trì tính bảo mật của mật khẩu chính
• Tất cả hoạt động xảy ra dưới tài khoản của bạn
• Đảm bảo thông tin tài khoản chính xác và cập nhật
• Tuân thủ tất cả luật pháp và quy định hiện hành
• Không sử dụng dịch vụ cho mục đích bất hợp pháp`,
    },
    {
      title: '4. Mật Khẩu Chính',
      content: `QUAN TRỌNG: Mật khẩu chính là chìa khóa cho tất cả dữ liệu của bạn.

• Chúng tôi không thể khôi phục hoặc đặt lại mật khẩu chính
• Nếu bạn quên mật khẩu chính, bạn sẽ mất quyền truy cập vào tất cả dữ liệu
• Bạn hoàn toàn chịu trách nhiệm ghi nhớ mật khẩu chính
• Chúng tôi khuyến nghị lưu bản sao lưu mật khẩu chính ở nơi an toàn`,
    },
    {
      title: '5. Chấm Dứt Tài Khoản',
      content: `Chúng tôi có quyền chấm dứt hoặc tạm ngừng tài khoản nếu:

• Bạn vi phạm Điều khoản Dịch vụ
• Bạn sử dụng dịch vụ cho hoạt động bất hợp pháp
• Bạn cố gắng xâm phạm bảo mật của dịch vụ
• Bạn tham gia bất kỳ hoạt động nào làm gián đoạn dịch vụ

Bạn cũng có thể xóa tài khoản bất kỳ lúc nào thông qua cài đặt ứng dụng.`,
    },
    {
      title: '6. Giới Hạn Trách Nhiệm',
      content: `Trong phạm vi tối đa được pháp luật cho phép:

• Dịch vụ được cung cấp "nguyên trạng" không có bảo đảm
• Chúng tôi không chịu trách nhiệm về mất dữ liệu do quên mật khẩu chính
• Chúng tôi không chịu trách nhiệm về thiệt hại gián tiếp hoặc hậu quả
• Trách nhiệm tổng thể giới hạn trong số tiền bạn đã thanh toán`,
    },
    {
      title: '7. Thay Đổi Điều Khoản',
      content: `Chúng tôi có thể cập nhật Điều khoản Dịch vụ theo thời gian. Chúng tôi sẽ thông báo về các thay đổi quan trọng bằng:

• Đăng điều khoản mới trong ứng dụng
• Gửi email đến địa chỉ đã đăng ký

Tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa với việc chấp nhận điều khoản mới.`,
    },
    {
      title: '8. Luật Áp Dụng',
      content: `Điều khoản Dịch vụ này được điều chỉnh và giải thích theo luật pháp hiện hành. Mọi tranh chấp phát sinh từ các điều khoản này sẽ được giải quyết thông qua trọng tài.`,
    },
    {
      title: '9. Thông Tin Liên Hệ',
      content: `Đối với câu hỏi về Điều khoản Dịch vụ, liên hệ:

Email: legal@vaultprotector.app`,
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
