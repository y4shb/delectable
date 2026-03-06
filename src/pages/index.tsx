export async function getServerSideProps() {
  return { redirect: { destination: '/feed', permanent: false } };
}

export default function Home() {
  return null;
}
