import { Text, Heading } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';

interface AnnouncementEmailProps {
  subject: string;
  body: string;
  unsubscribeUrl?: string;
}

export function AnnouncementEmail({
  subject,
  body,
  unsubscribeUrl,
}: AnnouncementEmailProps) {
  return (
    <EmailLayout>
      <Heading style={headingStyle}>{subject}</Heading>
      <Text style={bodyStyle}>{body}</Text>
      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 16px',
};

const bodyStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  whiteSpace: 'pre-wrap',
  margin: '0 0 24px',
};

export default AnnouncementEmail;
