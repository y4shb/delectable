import { ReactNode } from 'react';
import { useTasteProfile } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LockedFeaturePrompt from './LockedFeaturePrompt';

interface FeatureGateProps {
  children: ReactNode;
  /** Minimum maturity level required (0-5) */
  requiredLevel: number;
  /** Feature name shown when locked */
  featureName?: string;
  /** Hide children completely instead of showing locked prompt */
  hideWhenLocked?: boolean;
}

/**
 * FeatureGate renders children only if user meets the maturity level requirement.
 *
 * Maturity levels (0-5):
 * - 0: New user, hasn't completed anything
 * - 1: Completed first review
 * - 2: Followed 3+ users
 * - 3: Created a playlist
 * - 4: Has 10+ followers or 5+ reviews
 * - 5: Power user
 *
 * Usage:
 * <FeatureGate requiredLevel={2} featureName="playlists">
 *   <CreatePlaylistButton />
 * </FeatureGate>
 */
export default function FeatureGate({
  children,
  requiredLevel,
  featureName = 'this feature',
  hideWhenLocked = false,
}: FeatureGateProps) {
  const { isAuthenticated } = useAuth();
  const { data: tasteProfile } = useTasteProfile();

  // Anonymous users don't have maturity levels
  if (!isAuthenticated) {
    if (hideWhenLocked) return null;
    return (
      <LockedFeaturePrompt
        featureName={featureName}
        currentLevel={0}
        requiredLevel={requiredLevel}
        isAnonymous
      />
    );
  }

  const currentLevel = tasteProfile?.maturityLevel ?? 0;

  if (currentLevel >= requiredLevel) {
    return <>{children}</>;
  }

  if (hideWhenLocked) {
    return null;
  }

  return (
    <LockedFeaturePrompt
      featureName={featureName}
      currentLevel={currentLevel}
      requiredLevel={requiredLevel}
    />
  );
}
