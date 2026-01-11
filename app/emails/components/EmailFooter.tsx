import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export function EmailFooter({ unsubscribeUrl }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Hr style={hrStyle} />
      <Text style={footerTextStyle}>
        You are receiving this email because you are a member of Donation
        Mentoring.
        <br />
        이 이메일은 Donation Mentoring 회원님께 발송되었습니다.
      </Text>
      {unsubscribeUrl && (
        <Text style={unsubscribeStyle}>
          <Link href={unsubscribeUrl} style={linkStyle}>
            Unsubscribe
          </Link>
          {' | '}
          <Link href={unsubscribeUrl} style={linkStyle}>
            수신거부
          </Link>
        </Text>
      )}
      <Text style={copyrightStyle}>
        © {new Date().getFullYear()} Donation Mentoring. All rights reserved.
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  padding: '0 24px 24px',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footerTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center',
  margin: '0 0 12px',
};

const unsubscribeStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  textAlign: 'center',
  margin: '0 0 12px',
};

const linkStyle: React.CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

const copyrightStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '11px',
  textAlign: 'center',
  margin: 0,
};

export default EmailFooter;
