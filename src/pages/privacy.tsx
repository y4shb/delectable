import AppShell from '../layouts/AppShell';
import SEOHead from '../components/SEOHead';
import { Box, Typography, Divider } from '@mui/material';
import Link from 'next/link';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="h6"
      sx={{ fontWeight: 700, mt: 4, mb: 1.5, fontSize: 18 }}
    >
      {children}
    </Typography>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="body1"
      color="text.secondary"
      sx={{ mb: 1.5, lineHeight: 1.7, fontSize: 15 }}
    >
      {children}
    </Typography>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <Box component="ul" sx={{ pl: 3, mb: 1.5 }}>
      {items.map((item) => (
        <Typography
          component="li"
          key={item}
          variant="body1"
          color="text.secondary"
          sx={{ mb: 0.5, lineHeight: 1.7, fontSize: 15 }}
        >
          {item}
        </Typography>
      ))}
    </Box>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <AppShell>
      <SEOHead
        title="Privacy Policy"
        description="Delectable Privacy Policy — how we collect, use, and protect your data."
      />

      <Box sx={{ maxWidth: 600, mx: 'auto', pb: 12 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: March 2026
        </Typography>

        <Paragraph>
          Delectable (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is
          committed to protecting your privacy. This Privacy Policy explains how
          we collect, use, and safeguard your information when you use our mobile
          application and website.
        </Paragraph>

        <Divider sx={{ my: 3 }} />

        {/* 1. Information We Collect */}
        <SectionHeading>1. Information We Collect</SectionHeading>
        <Paragraph>
          We collect the following types of information to provide and improve
          our service:
        </Paragraph>
        <BulletList
          items={[
            'Account information: email address and display name',
            'Location data: your geographic location, only when you grant permission',
            'Photos: images you choose to upload with your reviews',
            'Reviews and ratings: the content you create on our platform',
            'Usage data: how you interact with the app, including pages visited, features used, and session duration',
          ]}
        />

        {/* 2. How We Use Your Information */}
        <SectionHeading>2. How We Use Your Information</SectionHeading>
        <Paragraph>We use your information to:</Paragraph>
        <BulletList
          items={[
            'Personalize your experience and provide tailored restaurant recommendations',
            'Power social features such as following other users, liking reviews, and sharing playlists',
            'Improve our service through analytics and usage patterns',
            'Send you relevant notifications about activity on your account (with your consent)',
            'Maintain the security and integrity of our platform',
          ]}
        />

        {/* 3. Information Sharing */}
        <SectionHeading>3. Information Sharing</SectionHeading>
        <Paragraph>
          We do not sell your personal data. We share data only with the
          following service providers to operate our app:
        </Paragraph>
        <BulletList
          items={[
            'Google Maps: your location is used to display nearby restaurants on the map',
            'Firebase: used to deliver push notifications to your device',
            'AWS: your uploaded images are stored securely on cloud storage',
          ]}
        />
        <Paragraph>
          These providers process data on our behalf and are contractually
          obligated to protect your information.
        </Paragraph>

        {/* 4. Data Storage & Security */}
        <SectionHeading>4. Data Storage & Security</SectionHeading>
        <Paragraph>
          We take the security of your data seriously:
        </Paragraph>
        <BulletList
          items={[
            'All data is encrypted in transit using HTTPS/TLS',
            'Data is encrypted at rest on our servers',
            'We implement strict access controls so only authorized personnel can access your data',
            'We regularly review our security practices and update them as needed',
          ]}
        />

        {/* 5. Your Rights */}
        <SectionHeading>5. Your Rights</SectionHeading>
        <Paragraph>You have the right to:</Paragraph>
        <BulletList
          items={[
            'Access and export your data at any time',
            'Delete your account and all associated data',
            'Opt out of push notifications and email communications',
            'Manage your location permissions through your device settings',
          ]}
        />
        <Paragraph>
          You can{' '}
          <Link href="/settings/account" style={{ color: '#F24D4F', textDecoration: 'underline' }}>
            export your data or delete your account
          </Link>{' '}
          from the Account Settings page.
        </Paragraph>

        {/* 6. Location Data */}
        <SectionHeading>6. Location Data</SectionHeading>
        <Paragraph>
          Location data is collected only when you explicitly grant permission
          through your device settings. We use your location to show nearby
          restaurants and personalize recommendations. Your precise location is
          not stored permanently on our servers and is used only during your
          active session.
        </Paragraph>
        <Paragraph>
          You can revoke location permissions at any time through your device
          settings.
        </Paragraph>

        {/* 7. Camera & Photos */}
        <SectionHeading>7. Camera & Photos</SectionHeading>
        <Paragraph>
          We access your camera and photo library only when you actively choose
          to upload a photo with a review. Photos are uploaded and stored
          securely on our cloud storage. We do not access your camera or photos
          in the background.
        </Paragraph>

        {/* 8. Children's Privacy */}
        <SectionHeading>8. Children&apos;s Privacy</SectionHeading>
        <Paragraph>
          Delectable is not intended for use by children under the age of 13. We
          do not knowingly collect personal information from children under 13.
          If you believe a child under 13 has provided us with personal
          information, please contact us at the address below so we can delete
          that information.
        </Paragraph>

        {/* 9. Changes to This Policy */}
        <SectionHeading>9. Changes to This Policy</SectionHeading>
        <Paragraph>
          We may update this Privacy Policy from time to time. When we make
          significant changes, we will notify you through the app or via email.
          We encourage you to review this policy periodically for any updates.
        </Paragraph>

        {/* 10. Contact Us */}
        <SectionHeading>10. Contact Us</SectionHeading>
        <Paragraph>
          If you have any questions or concerns about this Privacy Policy, please
          contact us at:
        </Paragraph>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            fontSize: 15,
            mb: 1.5,
          }}
        >
          <a
            href="mailto:support@delectable.app"
            style={{ color: '#F24D4F', textDecoration: 'underline' }}
          >
            support@delectable.app
          </a>
        </Typography>
      </Box>
    </AppShell>
  );
}
