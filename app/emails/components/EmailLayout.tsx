import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Img
              src="https://donation-mentoring.org/logo.png"
              alt="Donation Mentoring"
              width={150}
              height={40}
              style={{ margin: '0 auto' }}
            />
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '40px 0',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  maxWidth: '600px',
  margin: '0 auto',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  borderRadius: '8px 8px 0 0',
  padding: '24px',
  textAlign: 'center',
};

const contentStyle: React.CSSProperties = {
  padding: '32px 24px',
};

export default EmailLayout;
