import { useRouter } from 'next/router';
import DiscoverWizard from '../components/DiscoverWizard';

export default function DiscoverPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/feed');
  };

  return <DiscoverWizard onClose={handleClose} />;
}
